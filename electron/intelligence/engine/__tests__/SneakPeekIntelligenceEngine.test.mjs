import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const base = path.resolve(process.cwd(), 'dist-electron/electron/intelligence/engine');
const { SneakPeekIntelligenceEngine } = await import(
  pathToFileURL(path.join(base, 'SneakPeekIntelligenceEngine.js')).href,
);
const { RetrievalCoordinator, createRetrievalCapability } = await import(
  pathToFileURL(path.join(base, 'RetrievalCoordinator.js')).href,
);
const { advanceConversationState, clearConversationState } = await import(
  pathToFileURL(path.resolve(process.cwd(), 'dist-electron/electron/context-intelligence/question/conversation-state-store.js')).href,
);

const permissions = {
  conversation: true,
  transcript: true,
  screen: true,
  mode: true,
  project: true,
  profile: true,
  files: true,
  memory: true,
  generalKnowledge: true,
};

describe('SneakPeekIntelligenceEngine contract', () => {
  test('accepts a complete request and produces a provider-independent decision', async () => {
    const engine = new SneakPeekIntelligenceEngine();
    const result = await engine.handle({
      requestId: 'req-1',
      sessionId: 'session-1',
      surface: 'manual-chat',
      userMessage: 'What is a mutex?',
      currentTurn: { id: 'turn-1', role: 'user', content: 'What is a mutex?' },
      recentConversation: [],
      contextPermissions: permissions,
    });

    assert.equal(result.requestId, 'req-1');
    assert.equal(result.resolvedQuestion, 'What is a mutex?');
    assert.equal(result.intent, 'general-question');
    assert.equal(result.responseType, 'answer');
    assert.equal(result.providerAttempt.status, 'not-started');
    assert.equal(result.streamLifecycle.status, 'not-started');
    assert.equal(result.finalAnswer, null);
    assert.ok(result.diagnostics.stages.includes('understand'));
    assert.ok(result.diagnostics.stages.includes('plan-context'));
  });

  test('represents cancellation without requiring a provider', async () => {
    const controller = new AbortController();
    controller.abort();
    const engine = new SneakPeekIntelligenceEngine();

    const result = await engine.handle({
        requestId: 'req-cancelled',
        sessionId: 'session-1',
        surface: 'manual-chat',
        userMessage: 'Explain cancellation.',
        currentTurn: { id: 'turn-2', role: 'user', content: 'Explain cancellation.' },
        recentConversation: [],
        cancellationSignal: controller.signal,
        contextPermissions: permissions,
      });

    assert.equal(result.providerAttempt.status, 'cancelled');
    assert.equal(result.streamLifecycle.status, 'cancelled');
    assert.equal(result.finalAnswer, null);
    assert.match(result.diagnostics.warnings[0], /cancelled/i);
  });

  test('uses the canonical context planner to block private retrieval for general questions', async () => {
    const engine = new SneakPeekIntelligenceEngine();
    const result = await engine.handle({
      requestId: 'req-general-context',
      sessionId: 'session-1',
      surface: 'manual-chat',
      userMessage: 'What is Python?',
      currentTurn: { id: 'turn-3', role: 'user', content: 'What is Python?' },
      recentConversation: [],
      activeContext: { projectId: 'linkship', projectName: 'Linkship' },
      contextPermissions: permissions,
    });

    assert.equal(result.contextPlan.retrievalRequired, false);
    assert.equal(result.contextPlan.forbiddenSources.includes('project_knowledge'), true);
    assert.equal(result.contextPlan.forbiddenSources.includes('my_files'), true);
    assert.equal(result.retrievalPlan.shouldRetrieve, false);
    assert.equal(result.evidencePack.items.length, 0);
  });

  test('uses the canonical context planner for a project-specific question', async () => {
    const engine = new SneakPeekIntelligenceEngine();
    const result = await engine.handle({
      requestId: 'req-project-context',
      sessionId: 'session-1',
      surface: 'manual-chat',
      userMessage: 'Why did you use Redis in Linkship?',
      currentTurn: { id: 'turn-4', role: 'user', content: 'Why did you use Redis in Linkship?' },
      recentConversation: [],
      activeContext: { projectId: 'linkship', projectName: 'Linkship' },
      contextPermissions: permissions,
    });

    assert.equal(result.contextPlan.retrievalRequired, true);
    assert.equal(result.contextPlan.requiredSources.includes('project_knowledge'), true);
    assert.equal(result.contextPlan.requiredSources.includes('rag'), true);
    assert.equal(result.retrievalPlan.shouldRetrieve, true);
    assert.deepEqual(result.retrievalPlan.sources, ['rag']);
  });


  test('routes project retrieval through exactly one coordinator decision', async () => {
    const calls = [];
    const coordinator = new RetrievalCoordinator({
      capabilities: [
        createRetrievalCapability('project_knowledge', async ({ source }) => {
          calls.push(source);
          return {
            items: [{ id: 'project-1', source, content: 'Redis was used for caching.' }],
          };
        }),
        createRetrievalCapability('rag', async ({ source }) => {
          calls.push(source);
          return { items: [{ id: 'rag-1', source, content: 'unexpected duplicate retrieval' }] };
        }),
      ],
    });
    const engine = new SneakPeekIntelligenceEngine(coordinator);
    const result = await engine.handle({
      requestId: 'req-project-retrieval',
      sessionId: 'session-1',
      surface: 'manual-chat',
      userMessage: 'Why did you use Redis in Linkship?',
      currentTurn: { id: 'turn-5', role: 'user', content: 'Why did you use Redis in Linkship?' },
      recentConversation: [],
      activeContext: { projectId: 'linkship', projectName: 'Linkship' },
      contextPermissions: permissions,
    });

    assert.deepEqual(calls, ['project_knowledge']);
    assert.equal(result.evidence.items.length, 1);
    assert.equal(result.evidence.items[0].source, 'project_knowledge');
    assert.equal(result.evidencePack.items.length, 1);
    assert.equal(result.evidencePack.items[0].canonicalSource, 'project_knowledge');
    assert.equal(result.evidencePack.items[0].sourceId, 'project-1');
    assert.ok(result.diagnostics.stages.includes('build-evidence'));
    assert.ok(result.diagnostics.stages.includes('retrieve'));
  });

});

// CHG-19: cancellation returns diagnostics without opening another retrieval or
// generation path, regardless of which surface would have owned the answer.
for (const [surface, question] of [
  ['manual-chat', 'What is DBMS?'],
  ['manual-chat', 'Tell me about myself.'],
  ['manual-chat', 'Why did Linkship use Redis?'],
  ['manual-chat', 'Write binary search in Python.'],
  ['manual-chat', 'Give me its code.'],
  ['screenshot', 'Explain this screen.'],
  ['meeting-overlay', 'Summarize this meeting.'],
  ['global-rag', 'Search all meetings.'],
]) {
  test(`CHG-19 pre-cancelled ${surface}: ${question}`, async () => {
    const controller = new AbortController();
    controller.abort();
    let reads = 0, generations = 0;
    const engine = new SneakPeekIntelligenceEngine({
      retrievalCoordinator: { retrieve() { reads++; throw new Error('Unexpected retrieval'); } },
      generationPort: { async *stream() { generations++; throw new Error('Unexpected generation'); } },
    });
    const request = {
      requestId: `cancel-${question}`, sessionId: `chg19-${question}`, surface,
      userMessage: question, currentTurn: { id: 'cancelled-turn', role: 'user', content: question, createdAt: 1 },
      recentConversation: [], contextPermissions: permissions, cancellationSignal: controller.signal,
      activeContext: { projectName: 'Linkship', projectSourceIds: ['synthetic-only'], profileId: 'synthetic-profile' },
    };
    const result = await engine.handle(request);
    assert.equal(result.providerAttempt.status, 'cancelled');
    assert.equal(result.streamLifecycle.status, 'cancelled');
    assert.equal(result.finalAnswer, null);
    assert.deepEqual(result.evidence.items, []);
    assert.deepEqual(result.evidencePack.items, []);
    assert.equal(result.retrievalPlan.shouldRetrieve, false);
    assert.deepEqual(result.diagnostics.stages, ['cancelled']);
    // Diagnostic fields remain coherent and the prompt has no retrieved evidence.
    assert.equal(result.resolvedQuestion, question);
    assert.equal(result.turnUnderstanding.question, question);
    assert.doesNotMatch(result.prompt.finalPrompt, /<item\s/);
    assert.equal(reads, 0);
    assert.equal(generations, 0);
  });
}

// CHG-19: The public stream entry must also settle its result for a request
// cancelled before consumption, without opening retrieval or provider generation.
test('CHG-19 prepareAndStream settles a pre-cancelled request without generation', { timeout: 5000 }, async () => {
  const cancellation = new AbortController();
  cancellation.abort();
  let retrievals = 0;
  let generations = 0;
  const engine = new SneakPeekIntelligenceEngine({
    retrievalCoordinator: {
      async retrieve() { retrievals++; throw new Error('Pre-cancelled stream attempted retrieval'); },
    },
    generationPort: {
      async *stream() { generations++; yield 'unexpected provider output'; },
    },
  });
  const request = {
    requestId: 'pre-cancelled-stream',
    sessionId: 'chg19-pre-cancelled-stream',
    surface: 'manual-chat',
    userMessage: 'Why did Linkship use Redis?',
    currentTurn: { id: 'turn-pre-cancel', role: 'user', content: 'Why did Linkship use Redis?', createdAt: 1 },
    recentConversation: [],
    contextPermissions: permissions,
    activeContext: { projectName: 'Linkship', projectSourceIds: ['synthetic-project'] },
    cancellationSignal: cancellation.signal,
  };
  const { stream, result, lifecycle } = engine.prepareAndStream(request);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const final = await result;
  assert.deepEqual(chunks, []);
  assert.equal(retrievals, 0);
  assert.equal(generations, 0);
  assert.equal(final.providerAttempt.status, 'cancelled');
  assert.equal(final.streamLifecycle.status, 'cancelled');
  assert.equal(final.finalAnswer, null);
  assert.equal(final.retrievalPlan.shouldRetrieve, false);
  assert.deepEqual(final.evidencePack.items, []);
  assert.equal(lifecycle.state, 'CANCELLED');
});

// A completed prior turn may resolve the cancelled follow-up differently from
// the raw user input. All returned diagnostic/question contracts must agree,
// while no private retrieval or provider stream is allowed to start.
test('CHG-19 pre-cancelled follow-up uses one resolved question across result and response plan', { timeout: 5000 }, async () => {
  const sessionId = 'chg19-cancelled-followup-consistency';
  clearConversationState(sessionId);
  advanceConversationState({
    sessionId,
    scope: { userId: 'local', sessionId },
    question: 'Explain Redis.',
    timestamp: Date.now() - 1000,
  });
  try {
    let retrievals = 0;
    let generations = 0;
    const engine = new SneakPeekIntelligenceEngine({
      retrievalCoordinator: {
        async retrieve() { retrievals++; throw new Error('Pre-cancelled follow-up retrieved private evidence'); },
      },
      generationPort: {
        async *stream() { generations++; yield 'unexpected output'; },
      },
    });
    const cancellation = new AbortController();
    cancellation.abort();
    const question = 'Give me its code.';
    const result = await engine.handle({
      requestId: 'chg19-cancelled-followup', sessionId, surface: 'manual-chat',
      userMessage: question,
      currentTurn: { id: 'cancelled-followup-turn', role: 'user', content: question, createdAt: Date.now() },
      recentConversation: [], contextPermissions: permissions,
      cancellationSignal: cancellation.signal,
    });
    assert.match(result.turnUnderstanding.question, /Redis/i);
    assert.notEqual(result.turnUnderstanding.question, question, 'seeded referent must actually resolve');
    assert.equal(result.resolvedQuestion, result.turnUnderstanding.question);
    assert.equal(result.responsePlan.question, result.resolvedQuestion);
    assert.equal(result.requestId, 'chg19-cancelled-followup');
    assert.ok(result.diagnostics.traceId);
    assert.equal(result.providerAttempt.status, 'cancelled');
    assert.equal(result.streamLifecycle.status, 'cancelled');
    assert.equal(result.finalAnswer, null);
    assert.deepEqual(result.evidence.items, []);
    assert.deepEqual(result.evidencePack.items, []);
    assert.equal(result.retrievalPlan.shouldRetrieve, false);
    assert.equal(retrievals, 0);
    assert.equal(generations, 0);
  } finally {
    clearConversationState(sessionId);
  }
});
