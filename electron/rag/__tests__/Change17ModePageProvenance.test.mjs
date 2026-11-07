import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// WORK-0024 / ERR-042: execute the actual mode retriever and adapter in an
// isolated, in-memory fixture. Never use the application's user database.
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const { ModeHybridRetriever } = require('../../../dist-electron/electron/services/modes/ModeHybridRetriever.js');
const { ModeRagAdapter } = require('../../../dist-electron/electron/rag/adapters/ModeRagAdapter.js');

const MODE_ID = 'chg17-synthetic-mode';
const FILE_ID = 'chg17-synthetic-mode-pdf';
const QUESTION = 'Which cache does the Sequoia service use?';
const FILE = {
  id: FILE_ID,
  modeId: MODE_ID,
  fileName: 'synthetic-sequoia.pdf',
  createdAt: '2026-01-01T00:00:00.000Z',
  pageCount: 7,
  extractedPageCount: 7,
  content: '[Page 7]\n1 Overview\nThe reference describes the service.\n1.1 Background\nThe workers require isolation.\n2 Design\nThe cache is part of the design.\n2.1 Cache rationale\nThe Sequoia service uses the violet cache for deterministic read isolation. The team selected this cache because it prevents unrelated workers from sharing stale values during recovery.\n3 Conclusion\nThe design is complete.',
};

async function makeFixture({ vector = false } = {}) {
  const db = new Database(':memory:');
  const pipeline = {
    isReady: () => vector,
    getActiveSpaceKey: () => vector ? 'synthetic:mode:2' : null,
    getActiveProviderName: () => vector ? 'fixture' : 'none',
    getEmbeddingsWithFallback: async (texts) => ({
      embeddings: texts.map(() => [1, 0]), space: 'synthetic:mode:2',
    }),
    getEmbeddingForQuery: async () => [1, 0],
  };
  const retriever = new ModeHybridRetriever(db, {}, pipeline);
  await retriever.indexFile(FILE);
  const mode = { id: MODE_ID };
  const adapter = new ModeRagAdapter();
  adapter.getModesManager = () => ({
    getActiveModeInfo: () => mode,
    getActiveMode: () => mode,
    getModes: () => [mode],
    getReferenceFiles: (modeId) => modeId === MODE_ID ? [FILE] : [],
    retrieveHybridRaw: (_mode, files, options) => retriever.retrieve({
      query: options.query,
      modeId: MODE_ID,
      files,
      topK: options.topK,
      tokenBudget: options.tokenBudget,
      allowRerank: false,
      forceDocumentGrounding: options.forceDocumentGrounding,
    }),
  });
  return { db, retriever, adapter };
}

test('CHG-17 compatible-vector mode retrieval keeps section and page metadata through the real adapter', async () => {
  const { db, retriever, adapter } = await makeFixture({ vector: true });
  try {
    const state = retriever.getIndexState(FILE_ID);
    assert.equal(state?.status, 'ready');
    assert.equal(state?.embeddingSpace, 'synthetic:mode:2');
    const results = await adapter.retrieve({
      query: QUESTION,
      options: { modeId: MODE_ID },
      candidatePoolSize: 8,
      tokenBudget: 2000,
    });
    const evidence = results.find((result) => result.source?.id === FILE_ID && result.chunk?.text.includes('violet cache'));
    assert.ok(evidence);
    assert.ok(evidence.semanticScore > 0, 'compatible vectors contribute to retrieval');
    assert.equal(evidence.chunk.pageStart, 7);
    assert.equal(evidence.chunk.section, '2.1');
    assert.equal(evidence.chunk.heading, '2.1 Cache rationale');
  } finally {
    db.close();
  }
});

for (const forceDocumentGrounding of [false, true]) {
  test(`CHG-17 mode ${forceDocumentGrounding ? 'document-grounded' : 'normal'} retrieval retains PDF page 7 through its real adapter`, async () => {
    const { db, retriever, adapter } = await makeFixture();
    try {
      const raw = await retriever.retrieve({
        query: QUESTION,
        modeId: MODE_ID,
        files: [FILE],
        topK: 8,
        tokenBudget: 2000,
        forceDocumentGrounding,
      });
      assert.ok(raw.chunks.length > 0, 'mode retriever must actually find source text');
      const selected = raw.chunks.find((chunk) => chunk.text.includes('violet cache'));
      assert.ok(selected, 'answer-bearing chunk must be selected');
      assert.equal(selected.pageStart, 7, 'indexed page survives selected-chunk mapping');
      assert.equal(selected.pageEnd, 7);
      assert.equal(selected.section, '2.1');
      assert.equal(selected.heading, '2.1 Cache rationale');

      const results = await adapter.retrieve({
        query: QUESTION,
        options: { modeId: MODE_ID, forceDocumentGrounding },
        candidatePoolSize: 8,
        tokenBudget: 2000,
      });
      const evidence = results.find((result) => result.source?.id === FILE_ID && result.chunk?.text.includes('violet cache'));
      assert.ok(evidence, 'adapter must return the same original source and fact');
      assert.equal(evidence.chunk.pageStart, 7);
      assert.equal(evidence.chunk.pageEnd, 7);
      assert.equal(evidence.chunk.section, '2.1');
      assert.equal(evidence.chunk.heading, '2.1 Cache rationale');
      assert.equal(evidence.chunk.documentId, FILE_ID);
      assert.equal(evidence.source.sourceType, 'mode');
    } finally {
      db.close();
    }
  });
}

test('CHG-17 mode adapter prefers the structured locator and falls back to text markers only for older results', async () => {
  const { db, adapter } = await makeFixture();
  try {
    const mode = { id: MODE_ID };
    const raw = [
      { sourceId: FILE_ID, text: 'The answer is violet cache.', chunkIndex: 0, score: 0.9, pageStart: 7, pageEnd: 7, section: '2.1', heading: 'Cache rationale' },
      { sourceId: FILE_ID, text: '[Page 4] The earlier answer was green.', chunkIndex: 1, score: 0.5 },
      { sourceId: FILE_ID, text: '[Page 2] Indexed page 7 beats this older marker.', chunkIndex: 2, score: 0.5, pageStart: 7, pageEnd: 7 },
    ];
    adapter.getModesManager = () => ({
      getActiveModeInfo: () => mode,
      getActiveMode: () => mode,
      getModes: () => [mode],
      getReferenceFiles: () => [FILE],
      retrieveHybridRaw: async () => ({ chunks: raw }),
    });
    const results = await adapter.retrieve({ query: QUESTION, options: { modeId: MODE_ID }, candidatePoolSize: 8, tokenBudget: 2000 });
    assert.equal(results.length, 3);
    assert.equal(results[0].chunk.pageStart, 7);
    assert.equal(results[0].chunk.section, '2.1');
    assert.equal(results[0].chunk.heading, 'Cache rationale');
    assert.equal(results[1].chunk.pageStart, 4, 'legacy text marker remains supported');
    assert.equal(results[2].chunk.pageStart, 7, 'structured locator takes precedence');
  } finally {
    db.close();
  }
});
