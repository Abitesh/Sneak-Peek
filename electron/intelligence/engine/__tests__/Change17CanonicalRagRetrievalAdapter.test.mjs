import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const adapterPath = path.resolve(here, '../CanonicalRagRetrievalAdapter.ts');
const source = (await readFile(adapterPath, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
const ipcPath = path.resolve(here, '../CanonicalRuntime.ts');
const ipcSource = (await readFile(ipcPath, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
const compiledAdapterPath = new URL('../../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js', import.meta.url).href;
const { createCanonicalRagRetrievalCapability } = await import(compiledAdapterPath);

test('canonical adapter does not call the RAGManager query planner or answer-generation paths', () => {
  assert.doesNotMatch(source, /RAGManager\.search\s*\(/);
  assert.doesNotMatch(source, /RagQueryPlanner/);
  assert.doesNotMatch(source, /streamChat|buildRAGPrompt|LLMHelper/);
});

test('canonical adapter requires the coordinator-selected source and maps only supported canonical source families', () => {
  assert.match(source, /source: Extract<ContextSource, 'meeting_transcript' \| 'mode_documents' \| 'personal_knowledge' \| 'my_files' \| 'project_knowledge'>/);
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
    sourceLocator: 'page:2', documentName: 'resume.pdf', page: 2, pageStart: 2, pageEnd: 3,
    section: 'Experience', heading: undefined, chunkId: 'canonical-chunk-1',
    pointer: { chunkId: 'canonical-chunk-1', fileId: 'source-file-1', page: 2, section: 'Experience' },
    speaker: undefined, timestampStart: undefined, timestampEnd: undefined,
    chunkIndex: 0, retrievalSource: 'canonical-rag-adapter',
  });
});

test('production engine uses canonical capability and planned-source reads only for the approved four sources', () => {
  assert.match(ipcSource, /createCanonicalRagRetrievalCapability/);
  for (const sourceName of ['my_files', 'mode_documents', 'meeting_transcript', 'personal_knowledge', 'project_knowledge']) {
    assert.match(ipcSource, new RegExp(`source:\\s*['"]${sourceName}['"]`));
  }
  assert.match(ipcSource, /readPlannedCanonicalSource/);
  assert.match(ipcSource, /source:\s*['"]project_knowledge['"]/);
  assert.match(ipcSource, /projectFilesOnly:\s*true/);
  assert.match(ipcSource, /projectFileIds:\s*request\.activeContext\?\.projectSourceIds/);
  assert.match(ipcSource, /readPlannedCanonicalSource\(input\)/);
  assert.match(ipcSource, /createRetrievalCapability\(['"]structured_knowledge['"]/);
  assert.match(ipcSource, /readPlannedKnowledgeSource\(/);
  const projectStart = ipcSource.indexOf("source: 'project_knowledge',");
  const myFilesStart = ipcSource.indexOf("source: 'my_files',", projectStart);
  assert.ok(projectStart >= 0 && myFilesStart > projectStart);
  assert.doesNotMatch(ipcSource.slice(projectStart, myFilesStart), /ragManager\.search\(|queryPlanner\.plan\(/);
});


test('planned project IDs are intersected with the authorized scope and cancellation is forwarded', async () => {
  const approvedId = 'project-approved';
  const unauthorizedId = 'other-project';
  const scopeIds = [approvedId];
  const plannedIds = [approvedId, unauthorizedId];
  let captured;
  const controller = new AbortController();
  const capability = createCanonicalRagRetrievalCapability({
    source: 'project_knowledge', sourceType: 'personal',
    resolveScope: () => ({ projectFilesOnly: true, projectFileIds: scopeIds }),
    read: async (input) => {
      captured = input;
      return { usedCanonical: true, fallbackReason: null, results: plannedIds.map((id) => ({
        chunk: { id: `chunk-${id}`, documentId: id, text: `evidence for ${id}` },
        source: { id, sourceType: 'personal', name: `${id}.md`, metadata: { fileType: 'project' } },
        score: 0.9,
      })) };
    },
  });
  const request = { sessionId: 'scope-check' };
  const contextPlan = { sourceIds: { project_knowledge: plannedIds } };
  const first = await capability.retrieve({ query: 'project', source: 'project_knowledge',
    request, contextPlan, signal: controller.signal });
  assert.deepEqual(captured.projectFileIds, scopeIds, 'the reader receives only the authorized intersection, never the wider plan');
  assert.equal(captured.signal, controller.signal, 'the active cancellation signal is passed through');
  assert.deepEqual(first.items.map(item => item.metadata.sourceId), [approvedId],
    'an overbroad or stale planned ID cannot escape the final authorized scope');
  controller.abort('superseded');
  const cancelled = await capability.retrieve({ query: 'project', source: 'project_knowledge',
    request, contextPlan, signal: controller.signal });
  assert.deepEqual(cancelled.items, [], 'already-aborted retrieval emits no evidence');
});


test('empty or missing authorized project scope performs no underlying read', async () => {
  let calls = 0;
  for (const authorization of [undefined, [], ['another-project']]) {
    const capability = createCanonicalRagRetrievalCapability({
      source: 'project_knowledge', sourceType: 'personal',
      resolveScope: () => ({ projectFilesOnly: true, projectFileIds: authorization }),
      read: async () => { calls++; return { usedCanonical: true, results: [] }; },
    });
    const result = await capability.retrieve({
      query: 'why this project', source: 'project_knowledge',
      request: { sessionId: 'no-scope' }, contextPlan: { sourceIds: { project_knowledge: ['approved'] } },
    });
    assert.deepEqual(result.items, []);
    assert.equal(result.metadata.scopeDenied, true);
  }
  assert.equal(calls, 0, 'the source read is never entered with unapproved project IDs');
});

test('late cancellation suppresses results even after an authorized read started', async () => {
  const controller = new AbortController();
  let release;
  let capturedSignal;
  let reads = 0;
  const capability = createCanonicalRagRetrievalCapability({
    source: 'project_knowledge', sourceType: 'personal',
    resolveScope: () => ({ projectFilesOnly: true, projectFileIds: ['approved'] }),
    read: async ({ signal, projectFileIds }) => {
      reads++;
      capturedSignal = signal;
      assert.deepEqual(projectFileIds, ['approved']);
      return new Promise(resolve => {
        release = () => resolve({ usedCanonical: true, results: [{
          chunk: { id: 'chunk-approved', documentId: 'approved', text: 'should be suppressed' },
          source: { id: 'approved', sourceType: 'personal', metadata: { fileType: 'project' } },
          score: 0.9,
        }] });
      });
    },
  });
  const pending = capability.retrieve({
    query: 'project', source: 'project_knowledge', signal: controller.signal,
    request: { sessionId: 'abort-during-read' }, contextPlan: { sourceIds: { project_knowledge: ['approved'] } },
  });
  assert.equal(reads, 1, 'the read starts before cancellation');
  controller.abort('superseded');
  release();
  const result = await pending;
  assert.equal(capturedSignal, controller.signal);
  assert.deepEqual(result.items, [], 'late completed data must never enter evidence');
  assert.equal(result.metadata.cancelled, true);
});
