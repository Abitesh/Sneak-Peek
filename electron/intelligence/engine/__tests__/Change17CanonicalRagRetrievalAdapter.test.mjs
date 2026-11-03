import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const adapterPath = path.resolve(here, '../CanonicalRagRetrievalAdapter.ts');
const source = (await readFile(adapterPath, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
const ipcPath = path.resolve(here, '../../../ipcHandlers.ts');
const ipcSource = (await readFile(ipcPath, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
const compiledAdapterPath = new URL('../../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js', import.meta.url).href;
const { createCanonicalRagRetrievalCapability } = await import(compiledAdapterPath);

test('canonical adapter does not call the RAGManager query planner or answer-generation paths', () => {
  assert.doesNotMatch(source, /RAGManager\.search\s*\(/);
  assert.doesNotMatch(source, /RagQueryPlanner/);
  assert.doesNotMatch(source, /streamChat|buildRAGPrompt|LLMHelper/);
});

test('canonical adapter requires the coordinator-selected source and maps only supported canonical source families', () => {
  assert.match(source, /source: Extract<ContextSource, 'meeting_transcript' \| 'mode_documents' \| 'personal_knowledge' \| 'my_files'>/);
  assert.match(source, /sourceType: CanonicalRagSource/);
  assert.match(source, /'meeting' \| 'mode' \| 'personal'/);
  assert.match(source, /RetrievalCapabilityRequest/);
  assert.match(source, /\): RetrievalCapability/);
});

test('canonical evidence conversion preserves document, chunk, location, and revision provenance', () => {
  for (const field of ['sourceDocumentId', 'canonicalDocumentId', 'canonicalRevisionId', 'canonicalChunkId', 'canonicalContentHash', 'sourceLocator', 'documentId', 'documentName', 'pageEnd', 'section']) {
    assert.match(source, new RegExp(field));
  }
  assert.doesNotMatch(source, /metadata\?\.revisionId|metadata\?\.contentHash/);
});

test('adapter respects cancellation before and after the read', () => {
  assert.equal((source.match(/signal\?\.aborted/g) ?? []).length, 2);
});

test('adapter clamps requested retrieval limit', () => {
  assert.match(source, /Math\.max\(1, Math\.min\(50, Math\.floor\(options\.limit \?\? 8\)\)\)/);
});

test('adapter maps canonical metadata without relabelling the source document identity', async () => {
  let captured;
  const capability = createCanonicalRagRetrievalCapability({
    source: 'my_files',
    sourceType: 'personal',
    read: async (input) => {
      captured = input;
      return {
        usedCanonical: true,
        fallbackReason: null,
        results: [{
          chunk: {
            id: 'canonical-chunk-1', documentId: 'source-file-1', text: 'grounded text',
            pageStart: 2, pageEnd: 3, section: 'Experience', chunkIndex: 0,
            metadata: {
              canonicalDocumentId: 'canonical-doc-1', canonicalRevisionId: 'canonical-rev-1',
              canonicalContentHash: 'canonical-hash-1', sourceLocator: 'page:2',
            },
          },
          score: 0.7,
          source: { id: 'source-file-1', sourceType: 'personal', name: 'resume.pdf', metadata: {} },
        }],
      };
    },
  });
  const result = await capability.retrieve({
    query: 'experience', source: 'my_files', signal: undefined,
    request: { sessionId: 'session-1' }, contextPlan: {},
  });
  assert.equal(captured.sessionId, 'session-1');
  assert.deepEqual(result.items[0].metadata, {
    sourceId: 'source-file-1', sourceDocumentId: 'source-file-1', sourceType: 'personal',
    documentId: 'canonical-doc-1', canonicalDocumentId: 'canonical-doc-1',
    canonicalRevisionId: 'canonical-rev-1', canonicalChunkId: 'canonical-chunk-1',
    canonicalContentHash: 'canonical-hash-1', contentHash: 'canonical-hash-1',
    sourceLocator: 'page:2', documentName: 'resume.pdf', page: 2, pageEnd: 3,
    section: 'Experience', speaker: undefined, timestampStart: undefined, timestampEnd: undefined,
    chunkIndex: 0, retrievalSource: 'canonical-rag-adapter',
  });
});

test('production engine uses canonical capability and planned-source reads only for the approved four sources', () => {
  assert.match(ipcSource, /createCanonicalRagRetrievalCapability/);
  for (const sourceName of ['my_files', 'mode_documents', 'meeting_transcript', 'personal_knowledge']) {
    assert.match(ipcSource, new RegExp(`source:\\s*['"]${sourceName}['"]`));
  }
  assert.match(ipcSource, /readPlannedCanonicalSource/);
  assert.match(ipcSource, /createRetrievalCapability\(['"]project_knowledge['"]/);
  assert.match(ipcSource, /projectFilesOnly:\s*true/);
  assert.match(ipcSource, /createRetrievalCapability\(['"]structured_knowledge['"]/);
  assert.match(ipcSource, /selectedSources:\s*\[['"]knowledge['"]\]/);
});
