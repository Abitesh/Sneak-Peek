// CHG-18: exercise the current RAG transport instead of deleted generator shapes.
// No capture, microphone or native audio module is involved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { ragQueryPrefix, streamRagEngineAnswer, buildGlobalRagRequest } from '../../../dist-electron/electron/intelligence/engine/RagIpcStream.js';
import { SneakPeekIntelligenceEngine } from '../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import { GenerationController } from '../../../dist-electron/electron/intelligence/engine/GenerationController.js';
const ipc = fs.readFileSync('electron/ipcHandlers.ts', 'utf8');
const helperStart = ipc.indexOf('function abortPriorRAGQueriesOfClass(');
const helperEnd = ipc.indexOf('// Query meeting through', helperStart);
const helper = ts.transpileModule(ipc.slice(helperStart, helperEnd), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

test('production supersession helper aborts and evicts only matching sender/surface controllers', () => {
  const activeRAGQueries = new Map();
  const prefix = ragQueryPrefix(1, { meetingId: 'abc' });
  const old = new AbortController(), sibling = new AbortController(), otherSender = new AbortController();
  activeRAGQueries.set(`${prefix}old`, old);
  activeRAGQueries.set(`${ragQueryPrefix(1, { meetingId: 'abcdef' })}other`, sibling);
  activeRAGQueries.set(`${ragQueryPrefix(2, { meetingId: 'abc' })}other`, otherSender);
  const context = { activeRAGQueries }; vm.createContext(context); vm.runInContext(helper, context);
  context.abortPriorRAGQueriesOfClass(key => key.startsWith(prefix));
  assert.equal(old.signal.aborted, true); assert.equal(activeRAGQueries.size, 2);
  assert.equal(sibling.signal.aborted, false); assert.equal(otherSender.signal.aborted, false);
});

for (const [channel, meta] of [['rag:query-meeting', { meetingId: 'a' }], ['rag:query-live', { live: true }], ['rag:query-global', { global: true }]]) {
  test(`${channel} delegates to the shared superseding engine transport`, () => {
    const start = ipc.indexOf(`'${channel}'`);
    const end = ipc.indexOf('safeHandle(', start + channel.length);
    assert.match(ipc.slice(start, end > start ? end : undefined), /streamSneakPeekMeetingAnswer/);
    const shared = ipc.slice(ipc.indexOf('async function streamSneakPeekMeetingAnswer('), ipc.indexOf('const _geminiChatStreamHandler = async ('));
    assert.ok(shared.indexOf('abortPriorRAGQueriesOfClass') < shared.indexOf('activeRAGQueries.set'));
    assert.match(shared, /return await streamRagEngineAnswer/);
  });
  test(`${channel} abort after commitment emits no late token, completion or conversation commit`, async () => {
    const controller = new AbortController(); const events = [], settled = [];
    const engine = new SneakPeekIntelligenceEngine({ generationPort: { stream: ({ request, prompt, lifecycle }) => new GenerationController({ streamFinalPrompt: async function* () { yield 'first'; yield 'must not escape'; } }).stream({ requestId: request.requestId, finalPrompt: prompt.finalPrompt, route: { capability: 'stream_chat', availability: { hasGroq: true }, allowedProviders: ['groq'], maxAttempts: 1 }, abortSignal: request.cancellationSignal, lifecycle }).stream } });
    const request = buildGlobalRagRequest({ requestId: channel, sessionId: channel, query: 'What is DBMS?', signal: controller.signal, recentConversation: [] });
    const result = await streamRagEngineAnswer({ engine, request, meta, isCurrent: () => true, send: (name, payload) => { events.push({ name, payload }); controller.abort(); }, settle: status => settled.push(status) });
    assert.equal(result.success, true);
    assert.deepEqual(events.map(e => e.name), ['rag:stream-chunk']);
    assert.equal(events[0].payload.chunk, 'first');
    assert.deepEqual(settled, ['cancelled']);
  });
}
