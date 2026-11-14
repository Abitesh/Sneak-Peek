import test from 'node:test';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as conversationStore from '../../../../dist-electron/electron/context-intelligence/question/conversation-state-store.js';
import { SneakPeekIntelligenceEngine } from '../../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import { RetrievalCoordinator, createRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/RetrievalCoordinator.js';
import { createCanonicalRagRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js';
import { GenerationController } from '../../../../dist-electron/electron/intelligence/engine/GenerationController.js';
import { streamRagEngineAnswer, buildGlobalRagRequest, ragQueryPrefix } from '../../../../dist-electron/electron/intelligence/engine/RagIpcStream.js';
import { CanonicalRagStorage } from '../../../../dist-electron/electron/rag/canonical/CanonicalRagStorage.js';
import { CanonicalRagReadService } from '../../../../dist-electron/electron/rag/canonical/CanonicalRagReadService.js';
import { installCanonicalRagSchema } from '../../../../dist-electron/electron/rag/canonical/CanonicalRagSchema.js';

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const route = { capability: 'stream_chat', preferredProvider: 'groq', allowedProviders: ['groq'], availability: { hasGroq: true }, models: { groq: 'synthetic-offline' }, maxAttempts: 1 };

function fixture({ retrieve, transport, stallTimeoutMs } = {}) {
  const db = new Database(':memory:');
  installCanonicalRagSchema(db);
  const storage = new CanonicalRagStorage(db);
  for (const [id, type, text] of [
    ['meeting-a', 'meeting', 'The meeting selected violet leases for crash recovery.'],
    ['meeting-b', 'meeting', 'Another meeting selected amber counters for rate limiting.'],
    ['project-decoy', 'personal', 'Private project violet secrets.'],
  ]) {
    const doc = storage.createDocument({ sourceType: type, sourceId: id, name: id, fileType: type === 'personal' ? 'project' : null });
    const rev = storage.createRevision({ documentId: doc.id, contentHash: id, extractionVersion: 'fixture', chunkingVersion: 'fixture', normalizationVersion: 'fixture' });
    storage.replaceChunks(doc.id, rev.id, [{ chunkIndex: 0, text, sourceLocator: 'meeting:100-200' }]);
    storage.setStatus(doc.id, rev.id, 'READY', { chunkCount: 1, embeddedChunkCount: 0 });
    storage.activateRevision(doc.id, rev.id);
  }
  const reads = [], prompts = [], sends = [], settlements = [];
  const capability = createCanonicalRagRetrievalCapability({
    source: 'meeting_transcript', sourceType: 'meeting',
    resolveScope: ({ request }) => ({ sourceId: request.retrievalScope?.kind === 'meeting' ? request.retrievalScope.meetingId : undefined }),
    read: async input => {
      reads.push(input);
      if (retrieve) await retrieve(input);
      return new CanonicalRagReadService(storage).readSource({ query: input.query, sourceType: 'meeting', sourceId: input.sourceId, limit: input.limit, fallback: async () => [] });
    },
  });
  const engine = new SneakPeekIntelligenceEngine({
    retrievalCoordinator: new RetrievalCoordinator({ capabilities: [capability,
      ...['profile', 'project_knowledge', 'my_files'].map(source => createRetrievalCapability(source, async () => { throw new Error('private capability must not execute'); })),
    ] }),
    generationPort: { stream: ({ request, prompt, lifecycle }) => new GenerationController({
      streamFinalPrompt: async function* (...args) {
        prompts.push(prompt.finalPrompt);
        if (transport) { yield* transport(...args); return; }
        yield prompt.finalPrompt.includes('violet leases') ? 'Violet leases [meeting-a].' : 'No supporting meeting evidence.';
      },
    }).stream({ requestId: request.requestId, finalPrompt: prompt.finalPrompt, route, abortSignal: request.cancellationSignal, lifecycle }).stream },
  });
  const controller = new AbortController();
  const request = buildGlobalRagRequest({ requestId: 'global-request', sessionId: 'sender-1-global', query: 'What violet leases did the meeting select?', signal: controller.signal, recentConversation: [] });
  let current = true;
  const run = (req = request, meta = { global: true }) => streamRagEngineAnswer({ engine, request: req, meta, isCurrent: () => current, abort: () => controller.abort(), stallTimeoutMs, send: (channel, payload) => sends.push({ channel, payload }), settle: (...args) => settlements.push(args) });
  return { db, reads, prompts, sends, settlements, controller, request, run, stale: () => { current = false; } };
}

test('global IPC transport runs one real canonical retrieval and one engine/provider prompt with compatible events', async () => {
  const f = fixture();
  try {
    assert.deepEqual(await f.run(), { success: true });
    assert.equal(f.reads.length, 1);
    assert.equal(f.reads[0].sourceType, 'meeting');
    assert.equal(f.reads[0].sourceId, undefined);
    assert.equal(f.prompts.length, 1);
    assert.match(f.prompts[0], /violet leases/);
    assert.doesNotMatch(f.prompts[0], /Private project violet secrets/);
    assert.deepEqual(f.sends.map(e => e.channel), ['rag:stream-chunk', 'rag:stream-complete']);
    assert.equal(f.sends[0].payload.global, true);
    assert.deepEqual(f.settlements, [['completed', 'Violet leases [meeting-a].']]);
  } finally { f.db.close(); }
});

test('meeting search scope overrides project words and excludes another meeting and private sources', async () => {
  const f = fixture();
  try {
    const request = { ...f.request, surface: 'meeting-overlay', userMessage: 'Why did my project choose violet leases?', retrievalScope: { kind: 'meeting', meetingId: 'meeting-a' }, contextPermissions: { ...f.request.contextPermissions, project: true, profile: true, files: true, memory: true } };
    await f.run(request, { meetingId: 'meeting-a' });
    assert.equal(f.reads.length, 1);
    assert.equal(f.reads[0].sourceId, 'meeting-a');
    assert.match(f.prompts[0], /violet leases/);
    assert.doesNotMatch(f.prompts[0], /amber counters|Private project/);
  } finally { f.db.close(); }
});

test('denied transcript permission executes no reads and yields an honest evidence-gap prompt', async () => {
  const f = fixture();
  try {
    await f.run({ ...f.request, contextPermissions: { ...f.request.contextPermissions, transcript: false } });
    assert.equal(f.reads.length, 0);
    assert.doesNotMatch(f.prompts[0], /The meeting selected violet leases/);
    assert.match(f.prompts[0], /not found|not fabricate|evidence.*not/i);
  } finally { f.db.close(); }
});

test('empty meeting evidence completes once without private-source substitution', async () => {
  const f = fixture();
  try {
    const question = 'What zephyr spacecraft was launched?';
    await f.run({ ...f.request, userMessage: question, manualQuestion: question, currentTurn: { ...f.request.currentTurn, content: question } });
    assert.equal(f.reads.length, 1);
    assert.equal(f.sends.filter(e => e.channel === 'rag:stream-complete').length, 1);
    assert.match(f.settlements[0][1], /No supporting/);
  } finally { f.db.close(); }
});

test('retrieval error emits one error, no generation or completion, and settles IPC', async () => {
  const f = fixture({ retrieve: async () => { throw new Error('synthetic retrieval failure'); } });
  try {
    assert.equal((await f.run()).success, false);
    assert.equal(f.prompts.length, 0);
    assert.deepEqual(f.sends.map(e => e.channel), ['rag:stream-error']);
    assert.equal(f.settlements[0][0], 'failed');
  } finally { f.db.close(); }
});

test('empty provider output is an explicit error rather than a completed blank answer', async () => {
  const f = fixture({ transport: async function* () {} });
  try {
    assert.equal((await f.run()).success, false);
    assert.deepEqual(f.sends.map(e => e.channel), ['rag:stream-error']);
    assert.deepEqual(f.settlements, [['failed']]);
  } finally { f.db.close(); }
});

test('STOP before retrieval produces no work or terminal stream event', async () => {
  const f = fixture();
  try {
    f.controller.abort();
    assert.deepEqual(await f.run(), { success: true });
    assert.equal(f.reads.length, 0);
    assert.equal(f.prompts.length, 0);
    assert.deepEqual(f.sends, []);
    assert.deepEqual(f.settlements, [['cancelled']]);
  } finally { f.db.close(); }
});

test('STOP during pending retrieval settles immediately and rejects late evidence', async () => {
  const entered = deferred(), release = deferred();
  const f = fixture({ retrieve: async () => { entered.resolve(); await release.promise; } });
  try {
    const pending = f.run();
    await entered.promise;
    f.controller.abort();
    assert.deepEqual(await pending, { success: true });
    release.resolve();
    await new Promise(r => setImmediate(r));
    assert.equal(f.prompts.length, 0);
    assert.deepEqual(f.sends, []);
  } finally { f.db.close(); }
});

test('supersession during committed generation rejects late tokens and second completion', async () => {
  const entered = deferred(), release = deferred();
  const f = fixture({ transport: async function* () { yield 'first'; entered.resolve(); await release.promise; yield 'late'; } });
  try {
    const pending = f.run();
    await entered.promise;
    f.stale(); f.controller.abort();
    assert.deepEqual(await pending, { success: true });
    release.resolve();
    await new Promise(r => setImmediate(r));
    assert.deepEqual(f.sends.map(e => e.payload.chunk), ['first']);
    assert.deepEqual(f.settlements, [['cancelled']]);
  } finally { f.db.close(); }
});

test('sender/surface query keys cannot cancel or reuse another window or meeting', () => {
  assert.notEqual(ragQueryPrefix(1, { global: true }), ragQueryPrefix(2, { global: true }));
  assert.notEqual(ragQueryPrefix(1, { meetingId: 'a' }), ragQueryPrefix(1, { meetingId: 'b' }));
  assert.notEqual(ragQueryPrefix(1, { global: true }), ragQueryPrefix(1, { live: true }));
  assert.equal(`${ragQueryPrefix(1, { meetingId: 'a:b' })}request`.startsWith(ragQueryPrefix(1, { meetingId: 'a' })), false);
});

test('a stalled provider returns one error and aborts instead of hanging or falsely completing', async () => {
  const release = deferred();
  const f = fixture({ stallTimeoutMs: 20, transport: async function* () { await release.promise; yield 'late'; } });
  try {
    const result = await f.run();
    assert.equal(result.success, false);
    assert.match(result.error, /stalled/);
    assert.equal(f.controller.signal.aborted, true);
    release.resolve(); await new Promise(r => setImmediate(r));
    assert.deepEqual(f.sends.map(e => e.channel), ['rag:stream-error']);
    assert.deepEqual(f.settlements, [['failed']]);
  } finally { f.db.close(); }
});

test('production meeting/global IPC preserve channel contracts and delegate to the verified engine transport', () => {
  const ipc = fs.readFileSync('electron/ipcHandlers.ts', 'utf8');
  const global = ipc.slice(ipc.indexOf("safeHandle('rag:query-global'"), ipc.indexOf('// Cancel active RAG query'));
  assert.match(global, /streamSneakPeekMeetingAnswer\(event, appState, query, '', \{ global: true \}\)/);
  assert.doesNotMatch(global, /\.queryGlobal\(|streamChatWithOutcome|buildRAGPrompt/);
  assert.match(ipc, /return await streamRagEngineAnswer/);
  assert.match(ipc, /ragQueryPrefix\(event\.sender\.id/);
});

test('actual registered meeting/global handlers validate scope and invoke the engine adapter with unchanged arguments', async () => {
  const ipc = fs.readFileSync('electron/ipcHandlers.ts', 'utf8');
  const registered = new Map(), calls = [];
  const context = { safeHandle: (name, handler) => registered.set(name, handler), appState: { getRAGManager: () => ({}) }, streamSneakPeekMeetingAnswer: async (...args) => { calls.push(args); return { success: true }; } };
  vm.createContext(context);
  for (const [start, end] of [["safeHandle(\n'rag:query-meeting'", '// Query live meeting through'], ["safeHandle('rag:query-global'", '// Cancel active RAG query']]) {
    vm.runInContext(ts.transpileModule(ipc.slice(ipc.indexOf(start), ipc.indexOf(end, ipc.indexOf(start))), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  }
  const event = { sender: { id: 9 } };
  assert.equal((await registered.get('rag:query-meeting')(event, { meetingId: '', query: 'question' })).success, false);
  assert.equal((await registered.get('rag:query-global')(event, { query: '' })).success, false);
  await registered.get('rag:query-meeting')(event, { meetingId: 'selected', query: 'question' });
  await registered.get('rag:query-global')(event, { query: 'global question' });
  assert.equal(calls.length, 2);
  assert.equal(calls[0][3], 'selected'); assert.equal(calls[0][4].meetingId, 'selected');
  assert.equal(calls[1][2], 'global question'); assert.equal(calls[1][4].global, true);
});

test('actual cancel IPC aborts and clears only the sending window session', async () => {
  const ipc = fs.readFileSync('electron/ipcHandlers.ts', 'utf8');
  const start = ipc.indexOf("safeHandle(\n'rag:cancel-query'");
  const end = ipc.indexOf('// Check if meeting has RAG embeddings', start);
  const activeRAGQueries = new Map(); let cancel;
  const first = new AbortController(), second = new AbortController();
  const prefix1 = ragQueryPrefix(901, { global: true }), prefix2 = ragQueryPrefix(902, { global: true });
  activeRAGQueries.set(`${prefix1}first`, first); activeRAGQueries.set(`${prefix2}second`, second);
  for (const prefix of [prefix1, prefix2]) conversationStore.appendConversationTurn({ sessionId: `rag:${prefix}`, turnId: prefix, role: 'user', speaker: 'user', source: 'meeting', text: 'Synthetic prior question', generationStatus: 'completed', finalized: true });
  try {
    const context = { activeRAGQueries, safeHandle: (_name, handler) => { cancel = handler; }, require: name => name.includes('RagIpcStream') ? { ragQueryPrefix } : conversationStore };
    vm.createContext(context);
    vm.runInContext(ts.transpileModule(ipc.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
    assert.equal((await cancel({ sender: { id: 901 } }, { global: true, clearContext: true })).success, true);
    assert.equal(first.signal.aborted, true); assert.equal(second.signal.aborted, false);
    assert.equal(conversationStore.getRecentConversationTurns(`rag:${prefix1}`, 12).length, 0);
    assert.equal(conversationStore.getRecentConversationTurns(`rag:${prefix2}`, 12).length, 1);
  } finally { conversationStore.clearConversationState(`rag:${prefix1}`); conversationStore.clearConversationState(`rag:${prefix2}`); }
});

function evaluateProductionIpcEngine(overrides = {}) {
  const ipc = fs.readFileSync('electron/ipcHandlers.ts', 'utf8');
  const start = ipc.indexOf('function createPrimaryManualSneakPeekEngine(');
  const end = ipc.indexOf('function buildSneakPeekMeetingTranscriptContext(', start);
  const context = {
    console: { log() {}, warn() {} },
    SneakPeekIntelligenceEngine, RetrievalCoordinator, createRetrievalCapability, createCanonicalRagRetrievalCapability,
    streamCanonicalProvider: (helper, input) => new GenerationController(helper).stream(input).stream,
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(ts.transpileModule(ipc.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return context.createPrimaryManualSneakPeekEngine;
}

test('meeting IPC engine uses only the saved meeting when its scoped index has no hits', async () => {
  const savedIds = [], indexedIds = [], prompts = [];
  const createEngine = evaluateProductionIpcEngine({
    DatabaseManager: { getInstance: () => ({ getMeetingDetails: id => {
      savedIds.push(id);
      return id === 'meeting-a' ? {
        id, title: 'Synthetic meeting A', detailedSummary: { overview: 'The team chose violet leases.' },
        transcript: [
          { speaker: 'interviewer', text: 'We chose violet leases.', timestamp: 100 },
          { speaker: 'assistant', text: 'FORBIDDEN_PRIOR_ASSISTANT', timestamp: 200 },
        ],
      } : null;
    } }) },
  });
  const helper = {
    getSneakPeekGenerationRouteOptions: scopes => ({ ...route, dataScopes: scopes }),
    async *streamFinalPrompt(_provider, _model, prompt) { prompts.push(prompt); yield 'Violet leases.'; },
  };
  const engine = createEngine(helper, {
    getRAGManager: () => ({ readPlannedCanonicalSource: async ({ sourceId }) => {
      indexedIds.push(sourceId);
      return { results: [], usedCanonical: true, fallbackReason: 'empty' };
    } }),
  }, 'scoped-fallback-test');
  const controller = new AbortController();
  const request = {
    ...buildGlobalRagRequest({ requestId: 'scoped-fallback-test', sessionId: 'fallback-session', query: 'What did we choose?', signal: controller.signal, recentConversation: [] }),
    surface: 'meeting-overlay',
    retrievalScope: { kind: 'meeting', meetingId: 'meeting-a' },
    activeContext: { meetingId: 'decoy' },
  };
  const events = [];
  const result = await streamRagEngineAnswer({
    engine, request, meta: { meetingId: 'meeting-a' }, isCurrent: () => true,
    send: (channel, payload) => events.push({ channel, payload }), settle() {},
  });
  assert.deepEqual(result, { success: true });
  assert.deepEqual(indexedIds, ['meeting-a']);
  assert.deepEqual(savedIds, ['meeting-a']);
  assert.equal(prompts.length, 1);
  assert.match(prompts[0], /The team chose violet leases/);
  assert.doesNotMatch(prompts[0], /FORBIDDEN_PRIOR_ASSISTANT|decoy/);
  assert.deepEqual(events.map(event => event.channel), ['rag:stream-chunk', 'rag:stream-complete']);
  assert.ok(events.every(event => event.payload.meetingId === 'meeting-a'));
});

test('canonical profile drafts use only active revisioned profile sources and respect cloud scope denial', async () => {
  const require = createRequire(import.meta.url);
  const createEngine = evaluateProductionIpcEngine({
    require: name => {
      assert.equal(name, './llm/ActiveProfileContext');
      return require('../../../../dist-electron/electron/llm/ActiveProfileContext.js');
    },
  });
  const prompts = [];
  const orchestrator = {
    activeResume: { id: 1, structured_data: { name: 'Synthetic Author', skills: ['violet leases'] } },
    activeJD: { id: 2, structured_data: { title: 'Synthetic Target Role' } },
    activeCompany: { structured_data: { summary: 'FORBIDDEN_COMPANY_CANARY' } },
  };
  const helper = {
    getSneakPeekGenerationRouteOptions: (_scopes) => ({
      ...route, dataScopes: _scopes, scopePolicy: { profile_history: !denyCloud },
    }),
    async *streamFinalPrompt(provider, model, prompt) {
      prompts.push({ provider, model, prompt });
      yield 'Completed synthetic draft.';
    },
  };
  let denyCloud = false;
  for (const kind of ['cover-letter', 'negotiation-script']) {
    const id = `fixture-${kind}`;
    const engine = createEngine(helper, { getKnowledgeOrchestrator: () => orchestrator }, id);
    const controller = new AbortController();
    const request = {
      requestId: id, sessionId: id, surface: 'document-draft',
      documentDraft: { kind }, userMessage: 'Draft the requested document.',
      currentTurn: { id, role: 'user', content: 'Draft the requested document.' },
      cancellationSignal: controller.signal, recentConversation: [],
      contextPermissions: {
        conversation: false, transcript: false, screen: false, mode: false,
        project: false, profile: true, files: false, memory: false, generalKnowledge: false,
      },
    };
    const run = engine.prepareAndStream(request);
    let text = '';
    for await (const token of run.stream) text += token;
    assert.equal(text, 'Completed synthetic draft.');
    assert.deepEqual((await run.result).evidencePack.items.map(item => item.sourceKind), ['profile_resume', 'profile_jd']);
    assert.equal(prompts.at(-1).model, 'synthetic-offline');
    assert.match(prompts.at(-1).prompt, /Synthetic Author[\s\S]*Synthetic Target Role/);
    assert.match(prompts.at(-1).prompt, /<source_revision>[0-9a-f]+<\/source_revision>/);
    assert.doesNotMatch(prompts.at(-1).prompt, /FORBIDDEN_COMPANY_CANARY/);
    denyCloud = true;
    const denied = engine.prepareAndStream(request);
    for await (const _ of denied.stream) assert.fail('Denied draft produced an answer');
    assert.match((await denied.result).providerAttempt.error, /no available provider/);
    denyCloud = false;
  }
  assert.equal(prompts.length, 2);
});
