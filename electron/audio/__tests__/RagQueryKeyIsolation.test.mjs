// RAG transport contract only; no audio/native implementation is loaded.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ragQueryPrefix } from '../../../dist-electron/electron/intelligence/engine/RagIpcStream.js';
const ipc = readFileSync('electron/ipcHandlers.ts', 'utf8');
test('meeting streams use a unique request ID under a sender/meeting prefix', () => {
  const helper = ipc.slice(ipc.indexOf('async function streamSneakPeekMeetingAnswer('), ipc.indexOf('const _geminiChatStreamHandler = async ('));
  assert.match(helper, /requestId = `sneak-peek-rag-\$\{crypto\.randomUUID\(\)\}`/);
  assert.match(helper, /ragQueryPrefix\(event\.sender\.id, streamMeta\)/);
  assert.match(helper, /activeRAGQueries\.set\(queryKey, abortController\)/);
  assert.match(helper, /activeRAGQueries\.get\(queryKey\) === abortController/);
  assert.match(helper, /activeRAGQueries\.delete\(queryKey\)/);
});
test('cancel-query matches only this sender and the exact meeting delimiter', () => {
  const region = ipc.slice(ipc.indexOf("'rag:cancel-query'"), ipc.indexOf('// Check if meeting has RAG embeddings'));
  assert.match(region, /ragQueryPrefix\(event\.sender\.id/);
  assert.match(region, /if \(!global && !meetingId\)/);
  assert.match(region, /key\.startsWith\(queryKey\)/);
  const prefix = ragQueryPrefix(1, { meetingId: 'abc' });
  assert.equal(`${ragQueryPrefix(1, { meetingId: 'abcdef' })}request`.startsWith(prefix), false);
  assert.equal(`${ragQueryPrefix(2, { meetingId: 'abc' })}request`.startsWith(prefix), false);
  assert.equal(`${prefix}request`.startsWith(prefix), true);
});
