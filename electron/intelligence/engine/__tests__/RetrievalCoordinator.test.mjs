import assert from 'node:assert/strict';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const base = path.resolve(process.cwd(), 'dist-electron/electron/intelligence/engine');
const { RetrievalCoordinator, createRetrievalCapability } = await import(
  pathToFileURL(path.join(base, 'RetrievalCoordinator.js')).href,
);
const { planContext } = await import(pathToFileURL(path.join(base, 'ContextPlanner.js')).href);
const { understandTurn } = await import(
  pathToFileURL(path.join(process.cwd(), 'dist-electron/electron/context-intelligence/question/question-resolver.js')).href,
);

const permissions = {
  conversation: true, transcript: true, screen: true, mode: true,
  project: true, profile: true, files: true, memory: true, generalKnowledge: true,
};

function request(message, extra = {}) {
  return {
    requestId: 'r1', sessionId: 's1', surface: 'manual-chat', userMessage: message,
    currentTurn: { id: 't1', role: 'user', content: message }, recentConversation: [],
    contextPermissions: permissions, ...extra,
  };
}

function understanding(message) {
  return understandTurn({ manualQuestion: message, sessionId: 's1' });
}

test('general question performs no retrieval decision or capability call', async () => {
  const message = 'What is Python?';
  const req = request(message);
  const plan = planContext({ request: req, understanding: understanding(message) });
  let calls = 0;
  const coordinator = new RetrievalCoordinator({
    capabilities: [createRetrievalCapability('rag', async () => { calls += 1; return { items: [] }; })],
  });
  const result = await coordinator.retrieve(plan, req, message);
  assert.equal(result.trace.callCount, 0);
  assert.equal(calls, 0);
  assert.deepEqual(result.evidence.items, []);
});

test('project question makes exactly one intended project retrieval decision', async () => {
  const message = 'Why did you use Redis in Linkship?';
  const req = request(message, { activeContext: { projectId: 'linkship', projectName: 'Linkship' } });
  const plan = planContext({ request: req, understanding: understanding(message) });
  const calls = [];
  const coordinator = new RetrievalCoordinator({
    capabilities: [
      createRetrievalCapability('project_knowledge', async ({ source }) => {
        calls.push(source);
        return { items: [{ id: 'p1', source, content: 'Redis was used for caching.' }] };
      }),
      createRetrievalCapability('rag', async ({ source }) => {
        calls.push(source);
        return { items: [{ id: 'r1', source, content: 'duplicate generic RAG result' }] };
      }),
    ],
  });
  const result = await coordinator.retrieve(plan, req, message);
  assert.deepEqual(calls, ['project_knowledge']);
  assert.equal(result.trace.callCount, 1);
  assert.deepEqual(result.trace.executedSources, ['project_knowledge']);
  assert.equal(result.evidence.items.length, 1);
});

test('missing capability never falls back to an unrelated private source', async () => {
  const message = 'Why did you use Redis in Linkship?';
  const req = request(message, { activeContext: { projectId: 'linkship' } });
  const plan = planContext({ request: req, understanding: understanding(message) });
  let personalCalls = 0;
  const coordinator = new RetrievalCoordinator({
    capabilities: [createRetrievalCapability('personal_knowledge', async () => {
      personalCalls += 1; return { items: [] };
    })],
  });
  const result = await coordinator.retrieve(plan, req, message);
  assert.equal(result.trace.callCount, 0);
  assert.equal(personalCalls, 0);
  assert.equal(result.evidence.items.length, 0);
});

test('conversation-only recall does not call RAG', async () => {
  const message = 'What did I say earlier?';
  const req = request(message);
  const plan = planContext({ request: req, understanding: understanding(message) });
  let ragCalls = 0;
  const coordinator = new RetrievalCoordinator({
    capabilities: [createRetrievalCapability('rag', async () => { ragCalls += 1; return { items: [] }; })],
  });
  const result = await coordinator.retrieve(plan, req, message);
  assert.equal(result.trace.callCount, 0);
  assert.equal(ragCalls, 0);
});

test('independent authorized sources start together and preserve planned evidence order', async () => {
  const sources = ['my_files', 'profile'];
  const started = [];
  const gates = sources.map(() => Promise.withResolvers());
  const coordinator = new RetrievalCoordinator({
    capabilities: sources.map((source, i) => createRetrievalCapability(source, async () => {
      started.push(source);
      await gates[i].promise;
      return { items: [{ id: source, source, content: source }] };
    })),
  });
  const req = request('Use my resume and uploaded documents.');
  const plan = { ...planContext({ request: req, understanding: understanding(req.userMessage) }), requiredSources: sources };
  const reading = coordinator.retrieve(plan, req, req.userMessage);
  assert.deepEqual(started, sources, 'the second read must start while the first is pending');
  gates[1].resolve();
  gates[0].resolve();
  const result = await reading;
  assert.deepEqual(result.evidence.items.map(item => item.source), sources);
  assert.deepEqual(result.trace.sourceOutcomes.map(item => item.source), sources);
  assert.equal(result.trace.callCount, 2);
});

test('abort discards completed and late sibling evidence from a parallel read', async () => {
  const controller = new AbortController();
  const gate = Promise.withResolvers();
  const coordinator = new RetrievalCoordinator({
    capabilities: [
      createRetrievalCapability('profile', async () => ({ items: [{ id: 'p', source: 'profile', content: 'private' }] })),
      createRetrievalCapability('my_files', async () => {
        await gate.promise;
        return { items: [{ id: 'f', source: 'my_files', content: 'late private' }] };
      }),
    ],
  });
  const req = request('Use my resume and documents.', { cancellationSignal: controller.signal });
  const plan = { ...planContext({ request: req, understanding: understanding(req.userMessage) }), requiredSources: ['profile', 'my_files'] };
  const reading = coordinator.retrieve(plan, req, req.userMessage);
  await Promise.resolve();
  controller.abort();
  gate.resolve();
  assert.deepEqual((await reading).evidence.items, []);
});

test('parallel retrieval filters denied categories and retains exact source identity', async () => {
  const calls = [];
  const coordinator = new RetrievalCoordinator({
    capabilities: [
      createRetrievalCapability('profile', async () => { calls.push('profile'); return { items: [] }; }),
      createRetrievalCapability('my_files', async () => {
        calls.push('my_files');
        return { items: [
          { id: 'ok', source: 'my_files', content: 'current', metadata: { sourceId: 'allowed', revisionId: 'r2' } },
          { id: 'other', source: 'my_files', content: 'other', metadata: { sourceId: 'forbidden' } },
          { id: 'wrong', source: 'profile', content: 'wrong category' },
        ] };
      }),
    ],
  });
  const req = request('Use these documents.', { contextPermissions: { ...permissions, profile: false } });
  const plan = { ...planContext({ request: req, understanding: understanding(req.userMessage) }), requiredSources: ['profile', 'my_files'], sourceIds: { my_files: ['allowed'] } };
  const result = await coordinator.retrieve(plan, req, req.userMessage);
  assert.deepEqual(calls, ['my_files']);
  assert.deepEqual(result.evidence.items.map(item => item.id), ['ok']);
  assert.equal(result.evidence.items[0].metadata.revisionId, 'r2');
  assert.ok(result.trace.sourceOutcomes.some(item => item.source === 'profile' && item.status === 'denied'));
});

test('a failed read reports a single complete trace and never returns sibling evidence', async () => {
  const traces = [];
  const error = new Error('fixture read failed');
  const coordinator = new RetrievalCoordinator({
    onDecision: trace => traces.push(trace),
    capabilities: [
      createRetrievalCapability('profile', async () => { throw error; }),
      createRetrievalCapability('my_files', async () => ({ items: [{ id: 'f', source: 'my_files', content: 'private' }] })),
    ],
  });
  const req = request('Use my resume and documents.');
  const plan = { ...planContext({ request: req, understanding: understanding(req.userMessage) }), requiredSources: ['profile', 'my_files'] };
  await assert.rejects(coordinator.retrieve(plan, req, req.userMessage), error);
  assert.equal(traces.length, 1);
  assert.equal(traces[0].callCount, 2);
  assert.equal(traces[0].sourceOutcomes.length, 2);
});
