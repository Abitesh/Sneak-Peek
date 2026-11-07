import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('normal chat UI talks to gemini-chat-stream, not rag:query-*', () => {
  const ui = read('src/components/SneakPeekInterface.tsx');
  assert.match(ui, /electronAPI\.streamGeminiChat\(/);
  assert.doesNotMatch(ui, /invoke\(['"]rag:query-/);
  const preload = read('electron/preload.ts');
  assert.match(preload, /streamGeminiChat[\s\S]{0,400}gemini-chat-stream/);
});

// CHG-17: the planner is owned by the Intelligence Engine. Manual chat's
// primary path must supply planned source reads; the old secondary V3 RAG
// retrieval port remains a compatibility caller, not the new authority.
// The behavioral no-replanning assertion is covered in
// CanonicalRagReadProduction.test.mjs, using RAGManager's actual method.
test('manual chat routes authorized planned sources through the Intelligence Engine', () => {
  const ipc = read('electron/ipcHandlers.ts');
  const handlerStart = ipc.indexOf('const _geminiChatStreamHandler');
  assert.ok(handlerStart >= 0, 'manual chat stream handler missing');
  assert.match(ipc.slice(handlerStart, handlerStart + 18000), /createPrimaryManualSneakPeekEngine\(/);

  const primaryStart = ipc.indexOf('function createPrimaryManualSneakPeekEngine(');
  assert.ok(primaryStart >= 0, 'primary Intelligence Engine wiring missing');
  const primary = ipc.slice(primaryStart, handlerStart);
  assert.match(primary, /createCanonicalRagRetrievalCapability\(/);
  assert.match(primary, /ragManager\.readPlannedCanonicalSource\(input\)/);
  assert.match(primary, /source:\s*['"]meeting_transcript['"]/);
  assert.match(primary, /source:\s*['"]mode_documents['"]/);
  assert.match(primary, /source:\s*['"]personal_knowledge['"]/);
  assert.match(primary, /source:\s*['"]my_files['"]/);

  const adapter = read('electron/intelligence/engine/CanonicalRagRetrievalAdapter.ts');
  assert.doesNotMatch(adapter, /\bRagQueryPlanner\b.*\.plan\(/);
  const manager = read('electron/rag/RAGManager.ts');
  const start = manager.indexOf('public async readPlannedCanonicalSource(');
  const end = manager.indexOf('public createRAGRetrievalPort(', start);
  assert.ok(start >= 0 && end > start, 'planned-source reader boundary missing');
  const plannedReader = manager.slice(start, end);
  assert.doesNotMatch(plannedReader, /this\.queryPlanner\.plan\(|this\.search\s*\(/);
  assert.match(plannedReader, /new CanonicalRagReadService\(/);
});
