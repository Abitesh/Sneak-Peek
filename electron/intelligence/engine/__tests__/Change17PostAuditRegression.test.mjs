import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SneakPeekIntelligenceEngine } from '../../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import { resolveProjectFileScope } from '../../../../dist-electron/electron/intelligence/engine/ProjectFileScope.js';
import { RetrievalCoordinator, createRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/RetrievalCoordinator.js';
import { appendConversationTurn, clearConversationState, getConversationState } from '../../../../dist-electron/electron/context-intelligence/question/conversation-state-store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const permissions = {
  conversation: true, transcript: false, screen: false, mode: false,
  project: false, profile: true, files: false, memory: false, generalKnowledge: true,
};

function request(sessionId, question) {
  return {
    requestId: `${sessionId}-req`, sessionId, surface: 'manual-chat',
    userMessage: question, manualQuestion: question,
    currentTurn: { id: `${sessionId}-f`, role: 'user', content: question },
    recentConversation: [], contextPermissions: permissions,
  };
}

test('CHG-17 post-audit: follow-up response shape remains independent from reference resolution', async () => {
  const examples = [
    ['Explain binary search.', 'Binary search halves a sorted interval.', 'Can you give me its Python implementation?', 'coding', 'code', 'detailed'],
    ['Explain REST APIs.', 'REST APIs expose HTTP resources.', 'Can you explain that more simply?', 'explanation', 'prose', 'concise'],
    ['Tell me about JavaScript closures.', 'Closures retain lexical bindings.', 'Give me another example.', 'example', 'prose', 'normal'],
  ];
  for (const [i, [q, a, followup, kind, format, detail]] of examples.entries()) {
    const sessionId = `chg17-post-followup-${i}`;
    clearConversationState(sessionId);
    appendConversationTurn({ sessionId, role: 'user', speaker: 'user', source: 'manual', text: q, finalized: true, generationStatus: 'completed', requestSequence: 1, turnId: `${sessionId}-q` });
    appendConversationTurn({ sessionId, role: 'assistant', speaker: 'assistant', source: 'manual', text: a, finalized: true, generationStatus: 'completed', requestSequence: 1, turnId: `${sessionId}-a` });
    appendConversationTurn({ sessionId, role: 'user', speaker: 'user', source: 'manual', text: followup, finalized: true, generationStatus: 'pending', requestSequence: 2, turnId: `${sessionId}-f` });
    const result = await new SneakPeekIntelligenceEngine().handle(request(sessionId, followup));
    assert.equal(result.responsePlan.kind, kind, followup);
    assert.equal(result.responsePlan.format, format, followup);
    if (detail === 'concise') assert.equal(result.responsePlan.detailLevel, detail, followup);
    assert.match(result.prompt.finalPrompt, new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(result.prompt.finalPrompt.includes(a));
    clearConversationState(sessionId);
    assert.equal(getConversationState(sessionId), null, 'new chat must not retain the old referent');
  }
});

test('CHG-17 post-audit: named-project filtering never substitutes an unrelated project file', () => {
  const files = [
    { id: 'other', fileName: 'AnotherProject-design.pdf', fileType: 'project' },
    { id: 'linkship', fileName: 'Linkship architecture.pdf', fileType: 'project' },
    { id: 'resume', fileName: 'resume.pdf', fileType: 'resume' },
  ];
  const scope = resolveProjectFileScope('Why did you use Redis in Linkship?', files);
  assert.deepEqual(scope.selectedFileIds, ['linkship']);
  assert.equal(scope.projectAvailable, true);
  const missing = resolveProjectFileScope('Why did you use Redis in ProjectMissing?', files);
  assert.equal(missing.projectAvailable, false);
  assert.deepEqual(missing.selectedFileIds, []);
  assert.equal(missing.missingNamedProject, true);
  const broad = resolveProjectFileScope('Explain my projects', files);
  assert.equal(broad.projectAvailable, true);
  assert.equal(broad.selectedFileIds, undefined);
});

test('CHG-17 post-audit: failed capability remains an error and is recorded without document text', async () => {
  const input = request('chg17-failed', 'What does my PDF say?');
  input.contextPermissions = { ...permissions, files: true };
  let diagnostic;
  const coordinator = new RetrievalCoordinator({
    capabilities: [createRetrievalCapability('my_files', async () => { throw new Error('private fixture failure'); })],
    onDecision: (trace) => { diagnostic = trace; },
  });
  await assert.rejects(
    coordinator.retrieve({ requiredSources: ['my_files'], optionalSources: [], forbiddenSources: [] }, input, input.userMessage),
    /private fixture failure/,
  );
  assert.equal(diagnostic.sourceOutcomes[0].status, 'failed');
  assert.equal(diagnostic.sourceOutcomes[0].itemCount, 0);
  assert.ok(!JSON.stringify(diagnostic.sourceOutcomes).includes('private fixture'));
});

test('CHG-17 post-audit: chat reset is scoped to the sender and traverses typed preload/IPC/UI', async () => {
  const [ipc, preload, renderer, declaration, adapter, personal] = await Promise.all([
    fs.readFile(path.join(root, 'electron/ipcHandlers.ts'), 'utf8'),
    fs.readFile(path.join(root, 'electron/preload.ts'), 'utf8'),
    fs.readFile(path.join(root, 'src/components/SneakPeekInterface.tsx'), 'utf8'),
    fs.readFile(path.join(root, 'src/types/electron.d.ts'), 'utf8'),
    fs.readFile(path.join(root, 'electron/rag/adapters/PersonalRagAdapter.ts'), 'utf8'),
    fs.readFile(path.join(root, 'electron/personalKnowledge/PersonalKnowledgeManager.ts'), 'utf8'),
  ]);
  assert.match(ipc, /safeHandle\('gemini-chat-stream-clear-context'/);
  assert.match(ipc, /clearConversationState\(String\(senderId\)\)/);
  assert.match(preload, /clearChatContext:\s*\(\)\s*=>\s*ipcRenderer\.invoke\('gemini-chat-stream-clear-context'\)/);
  assert.match(declaration, /clearChatContext:\s*\(\)\s*=>/);
  assert.match(renderer, /resetChatState = useCallback\(\(\) => \{[\s\S]*?clearChatContext/);
  assert.match(adapter, /projectFileIds/);
  assert.match(personal, /scopedFileIds\?: readonly string\[\]/);
});
