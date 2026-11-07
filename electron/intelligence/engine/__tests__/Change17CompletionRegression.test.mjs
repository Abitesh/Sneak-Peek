import test from 'node:test';
import assert from 'node:assert/strict';
import { SneakPeekIntelligenceEngine } from '../../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import { RetrievalCoordinator, createRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/RetrievalCoordinator.js';
import { createCanonicalRagRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js';
import { understandTurn } from '../../../../dist-electron/electron/context-intelligence/question/question-resolver.js';
import {
  appendConversationTurn,
  clearConversationState,
  getConversationState,
  updateConversationTurn,
} from '../../../../dist-electron/electron/context-intelligence/question/conversation-state-store.js';

const permissions = {
  conversation: true, transcript: false, screen: false, mode: false,
  project: false, profile: true, files: true, memory: true, generalKnowledge: true,
};
function makeRequest(sessionId, question, overrides = {}) {
  return {
    requestId: `${sessionId}:2`, sessionId, surface: 'manual-chat',
    userMessage: question, manualQuestion: question,
    currentTurn: { id: `${sessionId}:turn-2`, role: 'user', content: question },
    recentConversation: [], contextPermissions: permissions, ...overrides,
  };
}

test('CHG-17: broad candidate-project history is personal, named implementation stays project, generic stays general', async () => {
  const broad = [
    'Explain the projects I worked on',
    'Describe the projects that I have worked on',
    'Tell me about projects I developed',
    'Explain my projects',
  ];
  for (const question of broad) {
    const understanding = understandTurn({ manualQuestion: question });
    assert.equal(understanding.intent, 'personal-question', question);
    const result = await new SneakPeekIntelligenceEngine().handle(makeRequest(`project-history-${question}`, question));
    assert.ok(result.contextPlan.requiredSources.includes('personal_knowledge'), question);
    assert.ok(result.contextPlan.requiredSources.includes('profile'), question);
    assert.ok(!result.contextPlan.requiredSources.includes('project_knowledge'), question);
    assert.match(result.prompt.finalPrompt, /private or document-specific evidence was not found/, 'missing private evidence must be explicit');
  }
  assert.equal(understandTurn({ manualQuestion: 'Why did you use Redis in Linkship?' }).intent, 'project-question');
  const generic = await new SneakPeekIntelligenceEngine().handle(makeRequest('chg17-general', 'What is a database index?'));
  assert.ok(!generic.contextPlan.requiredSources.some((source) => ['personal_knowledge', 'profile', 'project_knowledge', 'my_files'].includes(source)));
});

test('CHG-17: exact Singleton code follow-up uses completed same-session question and answer, not Hindsight', async () => {
  const sessionId = 'chg17-singleton';
  clearConversationState(sessionId);
  appendConversationTurn({ sessionId, role: 'user', speaker: 'user', source: 'manual', text: 'Explain singleton pattern', finalized: true, generationStatus: 'completed', requestSequence: 1, turnId: 'singleton-user' });
  appendConversationTurn({ sessionId, role: 'assistant', speaker: 'assistant', source: 'manual', text: 'A singleton ensures only one class instance exists.', finalized: true, generationStatus: 'completed', requestSequence: 1, turnId: 'singleton-answer' });
  const state = getConversationState(sessionId);
  assert.equal(state.previousQuestion, 'Explain singleton pattern');
  appendConversationTurn({ sessionId, role: 'user', speaker: 'user', source: 'manual', text: 'Can you give me its code?', finalized: true, generationStatus: 'pending', requestSequence: 2, turnId: 'singleton-followup' });
  assert.equal(getConversationState(sessionId).previousQuestion, 'Explain singleton pattern', 'pending current user must not replace antecedent');
  const question = 'Can you give me its code?';
  const engine = new SneakPeekIntelligenceEngine();
  const result = await engine.handle(makeRequest(sessionId, question, { currentTurn: { id: 'singleton-followup', role: 'user', content: question } }));
  assert.equal(result.turnUnderstanding.followUp, true);
  assert.match(result.turnUnderstanding.question, /singleton/i);
  assert.ok(result.contextPlan.requiredSources.includes('recent_conversation'));
  assert.match(result.prompt.finalPrompt, /Explain singleton pattern/);
  assert.match(result.prompt.finalPrompt, /A singleton ensures only one class instance exists/);
  assert.match(result.prompt.finalPrompt, /code/i);
  assert.equal(result.responsePlan.format, 'code');
  assert.equal(result.responseType, 'coding-answer');
  assert.deepEqual(result.diagnostics.retrieval, [], 'conversation context must not be mistaken for a missing external capability');
  const isolated = await engine.handle(makeRequest('chg17-unrelated-session', question));
  assert.doesNotMatch(isolated.prompt.finalPrompt, /A singleton ensures only one class instance exists/);
});

test('CHG-17: cancelled or failed exchanges cannot advance referent state', () => {
  const sessionId = 'chg17-unsuccessful';
  clearConversationState(sessionId);
  appendConversationTurn({ sessionId, role: 'user', speaker: 'user', source: 'manual', text: 'Explain singleton pattern', generationStatus: 'completed', requestSequence: 1 });
  appendConversationTurn({ sessionId, role: 'assistant', speaker: 'assistant', source: 'manual', text: 'A single instance.', generationStatus: 'completed', requestSequence: 1 });
  for (const [sequence, status] of [[2, 'cancelled'], [3, 'failed']]) {
    appendConversationTurn({ sessionId, role: 'user', speaker: 'user', source: 'manual', text: `An incomplete topic ${sequence}`, generationStatus: status, requestSequence: sequence });
    appendConversationTurn({ sessionId, role: 'assistant', speaker: 'assistant', source: 'manual', text: `Unusable answer ${sequence}`, generationStatus: status, requestSequence: sequence });
    assert.equal(getConversationState(sessionId).previousQuestion, 'Explain singleton pattern');
  }
});

test('CHG-17: completed meeting answers advance referents without accepting cancelled turns', () => {
  const sessionId = 'chg17-meeting';
  clearConversationState(sessionId);
  appendConversationTurn({ sessionId, role: 'user', speaker: 'user', source: 'meeting', text: 'Explain singleton pattern', generationStatus: 'pending', turnId: 'meeting-q' });
  assert.equal(getConversationState(sessionId).previousQuestion, undefined);
  updateConversationTurn({ sessionId, turnId: 'meeting-q', generationStatus: 'completed' });
  appendConversationTurn({ sessionId, role: 'assistant', speaker: 'assistant', source: 'meeting', text: 'One instance per application', generationStatus: 'completed' });
  assert.equal(getConversationState(sessionId).previousQuestion, 'Explain singleton pattern');
});

test('CHG-17: source fallback has honest provenance and safe per-source diagnostics', async () => {
  const capability = createCanonicalRagRetrievalCapability({
    source: 'my_files', sourceType: 'personal',
    read: async () => ({ usedCanonical: false, fallbackReason: 'empty', results: [{
      chunk: { id: 'legacy-chunk', documentId: 'source-file', text: 'Fixture fact', chunkIndex: 0 },
      source: { id: 'source-file', name: 'fixture.pdf', sourceType: 'personal' }, score: 0.42,
    }] }),
  });
  const request = makeRequest('chg17-source-fallback', 'According to my file, what is the fixture fact?');
  const result = await new RetrievalCoordinator({ capabilities: [capability] }).retrieve({ requiredSources: ['my_files'], optionalSources: [], forbiddenSources: [] }, request, request.userMessage);
  assert.equal(result.evidence.items.length, 1);
  assert.equal(result.evidence.items[0].metadata.retrievalSource, 'source-fallback');
  assert.equal(result.evidence.items[0].metadata.fallbackReason, 'empty');
  assert.deepEqual(result.trace.sourceOutcomes, [{ source: 'my_files', status: 'retrieved', itemCount: 1, retrievalBackend: 'source-fallback', fallbackReason: 'empty' }]);
  assert.equal(JSON.stringify(result.trace.sourceOutcomes).includes('Fixture fact'), false);
});

test('CHG-17: denied/unavailable sources are explicit and post-read cancellation drops late evidence', async () => {
  const request = makeRequest('chg17-permissions', 'What is in my file?', { contextPermissions: { ...permissions, files: false } });
  let calls = 0;
  const source = createRetrievalCapability('my_files', async () => { calls++; return { items: [] }; });
  const planned = { requiredSources: ['my_files'], optionalSources: [], forbiddenSources: [] };
  const denied = await new RetrievalCoordinator({ capabilities: [source] }).retrieve(planned, request, request.userMessage);
  assert.equal(calls, 0);
  assert.equal(denied.trace.sourceOutcomes[0].status, 'denied');
  const missing = await new RetrievalCoordinator().retrieve(planned, makeRequest('missing', 'What is in my file?'), 'What is in my file?');
  assert.equal(missing.trace.sourceOutcomes[0].status, 'unavailable');
  const controller = new AbortController();
  const lateSource = createRetrievalCapability('my_files', async () => {
    controller.abort();
    return { items: [{ id: 'late', source: 'my_files', content: 'Must not appear' }] };
  });
  const late = await new RetrievalCoordinator({ capabilities: [lateSource] }).retrieve(planned, makeRequest('late', 'What is in my file?', { cancellationSignal: controller.signal }), 'What is in my file?');
  assert.equal(late.evidence.items.length, 0);
  assert.equal(late.trace.sourceOutcomes[0].status, 'cancelled');
});
