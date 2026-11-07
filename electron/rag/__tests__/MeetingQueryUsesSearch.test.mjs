// CHG-18: engine/IPC behavior is exercised in Change18RagIpcIntegration.
// Keep an ownership guard against restoring a direct RAG answer bypass.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
const read = rel => fs.readFileSync(rel, 'utf8');
const manager = read('electron/rag/RAGManager.ts');
test('meeting/global answer methods cannot bypass the Intelligence Engine', () => {
  assert.doesNotMatch(manager, /async \*(?:queryMeeting|queryGlobal|streamRagAnswer|query)\(/);
  assert.doesNotMatch(manager, /buildRAGPrompt|streamChatWithOutcome/);
  const ipc = read('electron/ipcHandlers.ts');
  assert.doesNotMatch(ipc, /ragManager\.query(?:Meeting|Global)\(/);
  assert.match(ipc, /return await streamRagEngineAnswer/);
});
test('planned meeting evidence uses the source adapter without replanning', () => {
  const start = manager.indexOf('public async readPlannedCanonicalSource(');
  const end = manager.indexOf('public createRAGRetrievalPort', start);
  const planned = manager.slice(start, end);
  assert.match(planned, /this\.meetingAdapter\.retrieve/);
  assert.match(planned, /CanonicalRagReadService/);
  assert.doesNotMatch(planned, /queryPlanner\.plan|this\.search\(/);
});
test('specialized retrievers remain for adapters', () => {
  for (const file of ['electron/rag/RAGRetriever.ts', 'electron/services/modes/ModeHybridRetriever.ts', 'electron/personalKnowledge/PersonalKnowledgeManager.ts']) assert.ok(fs.existsSync(file));
  assert.match(read('electron/rag/adapters/MeetingRagAdapter.ts'), /this\.retriever\.retrieve\(/);
});
