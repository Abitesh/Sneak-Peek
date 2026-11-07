import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  resolveProjectFileScope,
  resolveProjectFileScopeForTurn,
} from '../../../../dist-electron/electron/intelligence/engine/ProjectFileScope.js';
import { createCanonicalRagRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js';
import {
  appendConversationTurn,
  clearConversationState,
  getRecentConversationTurns,
} from '../../../../dist-electron/electron/context-intelligence/question/conversation-state-store.js';

const files = [
  { id: 'linkship-a', fileType: 'project', fileName: 'Linkship Architecture.pdf' },
  { id: 'linkship-b', fileType: 'project', fileName: 'Linkship Design.md' },
  { id: 'sibling', fileType: 'project', fileName: 'Linkship Legacy Notes.pdf' },
  { id: 'other', fileType: 'project', fileName: 'Other Architecture.pdf' },
  { id: 'resume', fileType: 'resume', fileName: 'Linkship Resume.pdf' },
];
const currentQuestion = 'Why is Redis used in your project?';

function completedPair(source = 'manual', question = 'Why does Linkship use Redis?') {
  const sequence = source === 'manual' ? { requestSequence: 1 } : {};
  return [
    { id: 'prior-user', role: 'user', text: question, finalized: true, generationStatus: 'completed', source, ...sequence },
    { id: 'prior-answer', role: 'assistant', text: 'The test project uses Redis for short-lived API caching.', finalized: true, generationStatus: 'completed', source, ...sequence },
    { id: 'current', role: 'user', text: currentQuestion, finalized: true, generationStatus: 'pending', source },
  ];
}

function followup(turns = completedPair(), availableFiles = files, question = currentQuestion) {
  return resolveProjectFileScopeForTurn(question, availableFiles, turns, 'current');
}

function matchResults(ids) {
  return ids.map((id) => ({
    chunk: { id: `${id}-chunk`, documentId: id, text: `Synthetic fact from ${id}`, chunkIndex: 0 },
    source: { id, name: id, sourceType: 'personal', metadata: { fileType: id === 'resume' ? 'resume' : 'project' } },
    score: 0.8,
  }));
}

test('CHG-17: Linkship explicit turn then completed same-session Redis follow-up keeps exact source IDs', async () => {
  const first = resolveProjectFileScope('Why does Linkship use Redis?', files);
  assert.deepEqual(first.selectedFileIds, ['linkship-a', 'linkship-b']);
  const next = followup();
  assert.deepEqual(next.selectedFileIds, first.selectedFileIds);
  assert.equal(next.projectAvailable, true);

  let captured;
  const capability = createCanonicalRagRetrievalCapability({
    source: 'project_knowledge', sourceType: 'personal',
    resolveScope: () => ({ projectFilesOnly: true, projectFileIds: next.selectedFileIds }),
    read: async (input) => {
      captured = input;
      // Deliberately return an overbroad result set. The engine-side boundary
      // must remove sibling/resume/other sources before prompt evidence.
      return { usedCanonical: false, fallbackReason: 'empty', results: matchResults(['linkship-a', 'linkship-b', 'sibling', 'other', 'resume']) };
    },
  });
  const result = await capability.retrieve({ query: currentQuestion, source: 'project_knowledge', request: { sessionId: 'session-linkship' }, contextPlan: {} });
  assert.deepEqual(captured.projectFileIds, ['linkship-a', 'linkship-b']);
  assert.deepEqual(result.items.map((item) => item.metadata.sourceId), ['linkship-a', 'linkship-b']);
});

test('CHG-17: no completed immediate predecessor, failed answer, and competing request all fail closed', () => {
  for (const history of [
    [{ id: 'current', role: 'user', text: currentQuestion }],
    completedPair().filter((turn) => turn.id !== 'prior-answer'),
    completedPair().map((turn) => turn.id === 'prior-answer' ? { ...turn, generationStatus: 'cancelled' } : turn),
    completedPair().map((turn) => turn.id === 'prior-user' ? { ...turn, generationStatus: 'failed' } : turn),
    completedPair().map((turn) => turn.id === 'prior-answer' ? { ...turn, requestSequence: 44 } : turn),
    completedPair().map((turn) => turn.id === 'prior-answer' ? { ...turn, source: 'meeting' } : turn),
  ]) {
    const result = followup(history);
    assert.deepEqual(result.selectedFileIds, []);
    assert.equal(result.projectAvailable, false);
    assert.equal(result.unresolvedReference, true);
  }
});

test('CHG-17: formerly authorized Linkship file removed before follow-up cannot broaden retrieval', () => {
  const noLinkship = files.filter((file) => !file.id.startsWith('linkship-') && file.id !== 'linkship-a' && file.id !== 'linkship-b');
  const result = followup(completedPair(), noLinkship);
  assert.deepEqual(result.selectedFileIds, []);
  assert.equal(result.projectAvailable, false);
  assert.equal(result.missingNamedProject, true);
});

test('CHG-17: explicit sibling project overrides prior referent and never unions source IDs', () => {
  const next = followup(completedPair(), files, 'Why does Linkship Legacy use Redis?');
  assert.deepEqual(next.selectedFileIds, ['sibling']);
});

test('CHG-17: unrelated intervening completed turn blocks a stale Linkship antecedent', () => {
  const turns = [
    ...completedPair().slice(0, 2),
    { id: 'other-user', role: 'user', text: 'What is DBMS?', source: 'manual', finalized: true, generationStatus: 'completed', requestSequence: 2 },
    { id: 'other-assistant', role: 'assistant', text: 'A database management system.', source: 'manual', finalized: true, generationStatus: 'completed', requestSequence: 2 },
    { id: 'current', role: 'user', text: currentQuestion, source: 'manual', generationStatus: 'pending' },
  ];
  assert.deepEqual(followup(turns).selectedFileIds, []);
});

test('CHG-17: singular follow-up is fail-closed, but general questions and plural project history are unchanged', () => {
  assert.deepEqual(followup([{ id: 'current', role: 'user', text: currentQuestion }]).selectedFileIds, []);
  const general = resolveProjectFileScopeForTurn('What is DBMS?', files, [], 'current');
  assert.equal(general.selectedFileIds, undefined);
  const plural = resolveProjectFileScopeForTurn('Describe my projects', files, [], 'current');
  assert.equal(plural.selectedFileIds, undefined);
});

test('CHG-17: meeting scope is revalidated only after completed same-meeting exchange', () => {
  const result = followup(completedPair('meeting'));
  assert.deepEqual(result.selectedFileIds, ['linkship-a', 'linkship-b']);
  assert.deepEqual(followup(completedPair('meeting').map((turn) => turn.id === 'prior-answer' ? { ...turn, generationStatus: 'pending' } : turn)).selectedFileIds, []);
});

test('CHG-17: state-store completion and clear-chat constrain follow-up across sessions', () => {
  const session = 'chg17-linkship-followup-scope';
  clearConversationState(session);
  appendConversationTurn({ sessionId: session, role: 'user', text: 'Why does Linkship use Redis?', source: 'manual', speaker: 'user', requestSequence: 1, generationStatus: 'completed', turnId: 'prior-user' });
  appendConversationTurn({ sessionId: session, role: 'assistant', text: 'For test caching.', source: 'manual', speaker: 'assistant', requestSequence: 1, generationStatus: 'completed', turnId: 'prior-answer' });
  appendConversationTurn({ sessionId: session, role: 'user', text: currentQuestion, source: 'manual', speaker: 'user', requestSequence: 2, generationStatus: 'pending', turnId: 'current' });
  assert.deepEqual(followup(getRecentConversationTurns(session, 12)).selectedFileIds, ['linkship-a', 'linkship-b']);
  clearConversationState(session);
  appendConversationTurn({ sessionId: session, role: 'user', text: currentQuestion, source: 'manual', speaker: 'user', requestSequence: 1, generationStatus: 'pending', turnId: 'current' });
  assert.deepEqual(followup(getRecentConversationTurns(session, 12)).selectedFileIds, []);
  clearConversationState(session);
});

test('CHG-17: both IPC routes consume current-session completed-turn scope and gate ambiguous profile fallback', () => {
  const ipc = readFileSync(path.join(process.cwd(), 'electron/ipcHandlers.ts'), 'utf8');
  assert.match(ipc, /resolveProjectFileScopeForTurn\(query, personalFiles, projectTurns, requestId\)/);
  assert.match(ipc, /resolveProjectFileScopeForTurn\(String\(message \|\| ''\), personalFiles, scopedConversationTurns, nativeCurrentTurn\.id\)/);
  assert.match(ipc, /profile: profileAvailable && !projectScope\.unresolvedReference/g);
  assert.match(ipc, /projectFileIds: request\.activeContext\?\.projectSourceIds/);
});
