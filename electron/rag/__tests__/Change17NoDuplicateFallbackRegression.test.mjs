import assert from 'node:assert/strict';
import test from 'node:test';

const { CanonicalRagReadService } = await import('../../../dist-electron/electron/rag/canonical/CanonicalRagReadService.js');
const { RAGManager } = await import('../../../dist-electron/electron/rag/RAGManager.js');
const { createCanonicalRagRetrievalCapability } = await import('../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js');

function hit(id, fileType, text = `Evidence from ${id}`, ownerId) {
  return {
    source: { id, name: `${id}.pdf`, sourceType: 'personal', metadata: { fileType, ...(ownerId ? { ownerId } : {}) } },
    chunk: { id: `${id}:chunk`, documentId: id, text, chunkIndex: 0 },
    score: 0.8,
  };
}

test('CHG-17 a thrown source-local fallback executes once and propagates failure', async () => {
  const service = new CanonicalRagReadService({ searchLexical: () => [] });
  let calls = 0;
  await assert.rejects(service.readSource({
    query: 'resume detail', sourceType: 'personal', limit: 5,
    fallback: async () => { calls++; throw new Error('fallback unavailable'); },
  }), /fallback unavailable/);
  assert.equal(calls, 1, 'one source decision must not trigger a second fallback search');
});

test('CHG-17 a canonical storage error invokes one fallback with explicit error reason', async () => {
  const service = new CanonicalRagReadService({ searchLexical: () => { throw new Error('synthetic canonical error'); } });
  let calls = 0;
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...parts) => warnings.push(parts.join(' '));
  try {
    const result = await service.readSource({
      query: 'resume detail', sourceType: 'personal', limit: 5,
      fallback: async () => { calls++; return [hit('resume', 'resume')]; },
    });
    assert.equal(calls, 1);
    assert.equal(result.usedCanonical, false);
    assert.equal(result.fallbackReason, 'error');
    assert.equal(result.results.length, 1);
    assert.ok(warnings.every((message) => !message.includes('synthetic canonical error')));
  } finally {
    console.warn = originalWarn;
  }
});

test('CHG-17 an explicitly empty source allowlist cannot invoke canonical or legacy reads', async () => {
  let canonical = 0;
  let fallback = 0;
  const service = new CanonicalRagReadService({ searchLexical: () => { canonical++; return []; } });
  const result = await service.readSource({
    query: 'project fact', sourceType: 'personal', sourceIds: [], fileType: 'project', limit: 5,
    fallback: async () => { fallback++; return [hit('sibling', 'project')]; },
  });
  assert.deepEqual(result.results, []);
  assert.equal(canonical, 0);
  assert.equal(fallback, 0);
});

test('CHG-17 canonical-empty fallback enforces original source IDs, project type, and owner', async () => {
  const service = new CanonicalRagReadService({ searchLexical: () => [] });
  const result = await service.readSource({
    query: 'cobalt', sourceType: 'personal', sourceIds: ['allowed', 'resume'],
    fileType: 'project', ownerId: 'local', limit: 10,
    fallback: async () => [
      hit('allowed', 'project', 'Authorized project', 'local'),
      hit('sibling', 'project', 'Wrong project', 'local'),
      hit('resume', 'resume', 'Wrong file type', 'local'),
      hit('allowed', 'project', 'Wrong owner', 'other'),
      hit('allowed', 'project', 'Unverified owner'),
    ],
  });
  assert.deepEqual(result.results.map((item) => item.chunk.text), ['Authorized project']);
  assert.equal(result.fallbackReason, 'empty');
});

test('CHG-17 engine evidence adapter rejects a non-project even if its source ID is selected', async () => {
  const capability = createCanonicalRagRetrievalCapability({
    source: 'project_knowledge', sourceType: 'personal',
    resolveScope: () => ({ projectFilesOnly: true, projectFileIds: ['selected'] }),
    read: async () => ({
      usedCanonical: false, fallbackReason: 'empty',
      results: [hit('selected', 'project'), hit('selected', 'resume'), hit('sibling', 'project')],
    }),
  });
  const result = await capability.retrieve({
    query: 'project fact', source: 'project_knowledge',
    request: { sessionId: 'test', requestId: 'test' }, contextPlan: {},
  });
  assert.deepEqual(result.items.map((item) => item.content), ['Evidence from selected']);
});

test('CHG-17 planned project fallback enforces both project type and selected file IDs', async () => {
  const manager = Object.create(RAGManager.prototype);
  manager.getConversationForRetrieval = () => undefined;
  manager.rerankCanonicalResults = async (_query, results) => results;
  manager.gateCanonicalResults = (results) => results;
  manager.personalAdapter = {
    retrieve: async () => [hit('selected', 'project'), hit('selected', 'resume'), hit('sibling', 'project')],
  };
  const result = await manager.readPlannedCanonicalSource({
    query: 'project fact', sourceType: 'personal', projectFilesOnly: true,
    projectFileIds: ['selected'], limit: 8,
  });
  assert.equal(result.usedCanonical, false);
  assert.deepEqual(result.results.map((item) => item.chunk.text), ['Evidence from selected']);
});
