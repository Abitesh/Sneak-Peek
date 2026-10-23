import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const adapterPath = path.resolve(here, '../CanonicalRagRetrievalAdapter.ts');
const source = (await readFile(adapterPath, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');

test('canonical adapter does not call the RAGManager query planner or answer-generation paths', () => {
  assert.doesNotMatch(source, /RAGManager\.search\s*\(/);
  assert.doesNotMatch(source, /RagQueryPlanner/);
  assert.doesNotMatch(source, /streamChat|buildRAGPrompt|LLMHelper/);
});

test('canonical adapter requires the coordinator-selected source and maps only supported canonical source families', () => {
  assert.match(source, /source: Extract<ContextSource, 'meeting_transcript' \| 'mode_documents' \| 'personal_knowledge'>/);
  assert.match(source, /sourceType: CanonicalRagSource/);
  assert.match(source, /'meeting' \| 'mode' \| 'personal'/);
});

test('canonical evidence conversion preserves document, chunk, location, and revision provenance', () => {
  for (const field of ['documentId', 'documentName', 'pageEnd', 'section', 'canonicalChunkId', 'canonicalRevisionId', 'contentHash']) {
    assert.match(source, new RegExp(field));
  }
});

test('adapter respects cancellation before and after the read', () => {
  assert.equal((source.match(/signal\?\.aborted/g) ?? []).length, 2);
});

test('adapter clamps requested retrieval limit', () => {
  assert.match(source, /Math\.max\(1, Math\.min\(50, Math\.floor\(options\.limit \?\? 8\)\)\)/);
});
