import test from 'node:test';
import assert from 'node:assert/strict';
import { SneakPeekIntelligenceEngine } from '../../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import { RetrievalCoordinator, createRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/RetrievalCoordinator.js';
import { appendConversationTurn, clearConversationState } from '../../../../dist-electron/electron/context-intelligence/question/conversation-state-store.js';

const permissions = { conversation: true, transcript: false, screen: false, mode: false, project: false, profile: true, files: false, memory: false, generalKnowledge: true };
function request(sessionId, message) {
  return { requestId: `${sessionId}-${message}`, sessionId, surface: 'manual-chat', userMessage: message, currentTurn: { id: `${sessionId}-current`, role: 'user', content: message }, recentConversation: [], contextPermissions: permissions };
}

test('same-session follow-up uses canonical history with Hindsight unavailable and never leaks another session', async () => {
  const session = 'memory-independent-a';
  clearConversationState(session);
  appendConversationTurn({ sessionId: session, role: 'user', text: 'Name two cache policies.', finalized: true, generationStatus: 'completed', timestamp: Date.now() - 1000 });
  appendConversationTurn({ sessionId: session, role: 'assistant', text: 'First: LRU. Second: LFU counts how often each key is used.', finalized: true, generationStatus: 'completed', timestamp: Date.now() - 999 });
  const engine = new SneakPeekIntelligenceEngine({ retrievalCoordinator: new RetrievalCoordinator({ capabilities: [] }) });
  const result = await engine.handle(request(session, 'Can you explain that more?'));
  assert.match(result.prompt.finalPrompt, /LFU counts how often/);
  const other = await engine.handle(request('memory-independent-b', 'Can you explain that more?'));
  assert.doesNotMatch(other.prompt.finalPrompt, /LFU counts how often/);
});

test('failed and cancelled answers are not usable previous context', async () => {
  const session = 'memory-independent-incomplete';
  clearConversationState(session);
  for (const status of ['failed', 'cancelled']) appendConversationTurn({ sessionId: session, role: 'assistant', text: `incomplete-${status}-secret`, finalized: true, generationStatus: status, timestamp: Date.now() - 10 });
  const result = await new SneakPeekIntelligenceEngine().handle(request(session, 'Can you explain that more?'));
  assert.doesNotMatch(result.prompt.finalPrompt, /incomplete-(failed|cancelled)-secret/);
});

test('authorized résumé fact reaches the final provider prompt without Hindsight; general CS avoids it', async () => {
  let calls = 0;
  let providerPrompt = '';
  const engine = new SneakPeekIntelligenceEngine({
    retrievalCoordinator: new RetrievalCoordinator({ capabilities: [createRetrievalCapability('profile', async () => {
      calls++;
      return { items: [{ id: 'resume-fixture-revision-1', source: 'profile', content: 'Candidate worked at Acme Robotics from 2023 to 2025. Primary language: Rust.', score: 0.95, metadata: { sourceId: 'resume-fixture', revisionId: 'revision-1', authority: 'evidence' } }] };
    })] }),
    generationPort: { stream: async function* ({ prompt, lifecycle }) {
      providerPrompt = prompt.finalPrompt;
      lifecycle.transition('GENERATING'); lifecycle.transition('COMMITTED');
      yield 'Acme Robotics; Rust.';
      lifecycle.transition('COMPLETED');
    } },
  });
  const run = engine.prepareAndStream(request('resume-independent', 'Where did I work according to my résumé?'));
  for await (const chunk of run.stream) assert.ok(chunk);
  const result = await run.result;
  assert.equal(calls, 1);
  assert.match(providerPrompt, /Acme Robotics/);
  assert.match(providerPrompt, /Rust/);
  assert.equal(result.evidence.items[0].metadata.revisionId, 'revision-1');
  await engine.handle(request('resume-independent-general', 'What is Django?'));
  assert.equal(calls, 1, 'general CS must not query the résumé');
});
