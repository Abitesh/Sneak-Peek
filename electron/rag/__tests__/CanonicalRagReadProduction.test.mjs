import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';

process.env.NATIVELY_CANONICAL_RAG_READ = 'on';
process.env.NATIVELY_RAG_LOCAL_RERANK = 'on';

const modulePath = new URL('../../../dist-electron/electron/rag/RAGManager.js', import.meta.url).href;
const schemaPath = new URL('../../../dist-electron/electron/rag/canonical/CanonicalRagSchema.js', import.meta.url).href;
const storagePath = new URL('../../../dist-electron/electron/rag/canonical/CanonicalRagStorage.js', import.meta.url).href;
const { RAGManager } = await import(modulePath);
const { installCanonicalRagSchema } = await import(schemaPath);
const { CanonicalRagStorage } = await import(storagePath);

const searchSource = RAGManager.prototype.search.toString();
const plannedSource = RAGManager.prototype.readPlannedCanonicalSource.toString();

function makeDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  installCanonicalRagSchema(db);
  return db;
}

function seedReadyMeeting(storage, meetingId, text = 'canonical meeting result') {
  const doc = storage.createDocument({
    sourceType: 'meeting',
    sourceId: meetingId,
    name: `Meeting ${meetingId}`,
  });
  const revision = storage.createRevision({
    documentId: doc.id,
    contentHash: `hash-${meetingId}`,
    extractionVersion: 'test',
    chunkingVersion: 'test',
    normalizationVersion: 'test',
  });
  storage.replaceChunks(doc.id, revision.id, [{
    chunkIndex: 0,
    text,
    sourceLocator: 'meeting:0',
  }]);
  storage.setStatus(doc.id, revision.id, 'READY', { chunkCount: 1 });
  storage.activateRevision(doc.id, revision.id);
}

function legacyResult(sourceType = 'meeting', text = 'legacy result') {
  return [{
    chunk: {
      id: `legacy-${sourceType}`,
      documentId: `${sourceType}-1`,
      text,
      chunkIndex: 0,
      metadata: {},
    },
    score: 0.8,
    source: {
      id: `${sourceType}-1`,
      sourceType,
      name: `${sourceType}.txt`,
      metadata: {},
    },
  }];
}

function makeSearchHarness(db) {
  const manager = Object.create(RAGManager.prototype);
  manager.db = db;
  manager.queryPlanner = {
    plan() {
      return { retrievalQuery: 'project update', sources: ['meeting'] };
    },
  };
  manager.getSourceManagers = () => ({ modesManager: null, personalKnowledge: null });
  manager.meetingAdapter = { retrieve: async () => legacyResult('meeting') };
  manager.modeAdapter = { retrieve: async () => legacyResult('mode') };
  manager.personalAdapter = { retrieve: async () => legacyResult('personal') };
  manager.knowledgeAdapter = { retrieve: async () => legacyResult('knowledge') };
  manager.rerankCanonicalResults = async (_query, results) => results;
  manager.gateCanonicalResults = results => results;
  return manager;
}

test('RAGManager production search consumes canonicalRagRead', () => {
  assert.match(searchSource, /isIntelligenceFlagEnabled\(['"]canonicalRagRead['"]\)/);
  assert.match(searchSource, /new CanonicalRagReadService/);
  assert.match(searchSource, /canonicalRead\.readSource/);
});

test('planned-source production read reuses canonical infrastructure without a second planner/search engine', () => {
  assert.doesNotMatch(plannedSource, /queryPlanner\.plan|this\.search\s*\(/);
  for (const symbol of [
    'CanonicalRagReadService', 'resolveCanonicalQueryEmbedding', 'rerankCanonicalResults',
    'gateCanonicalResults', 'meetingAdapter.retrieve', 'modeAdapter.retrieve',
    'personalAdapter.retrieve', 'dedupeRagSearchResults',
  ]) assert.match(plannedSource, new RegExp(symbol.replace('.', '\\.')));
});

test('planned-source read does not call RagQueryPlanner and uses READY canonical meeting evidence', async () => {
  const db = makeDb();
  const storage = new CanonicalRagStorage(db);
  seedReadyMeeting(storage, 'meeting-planned', 'planned canonical meeting result');
  const manager = makeSearchHarness(db);
  manager.queryPlanner.plan = () => { throw new Error('RagQueryPlanner must not run'); };
  let fallbackCalls = 0;
  manager.meetingAdapter.retrieve = async () => { fallbackCalls += 1; return legacyResult('meeting'); };

  const response = await manager.readPlannedCanonicalSource({
    query: 'planned canonical meeting result', sourceType: 'meeting',
    sourceId: 'meeting-planned', sessionId: 'session-planned', limit: 8,
  });
  assert.equal(response.usedCanonical, true);
  assert.equal(response.results[0].chunk.text, 'planned canonical meeting result');
  assert.equal(fallbackCalls, 0);
  db.close();
});

test('WORK-0019 punctuated natural-language queries keep READY canonical evidence without legacy error fallback', async () => {
  const db = makeDb();
  const storage = new CanonicalRagStorage(db);
  seedReadyMeeting(storage, 'meeting-fts-question', 'The team selected cobalt cache for the Aurora service.');
  const manager = makeSearchHarness(db);
  manager.queryPlanner.plan = () => { throw new Error('planned read must not replan'); };
  manager.resolveCanonicalQueryEmbedding = async () => null;
  let fallbackCalls = 0;
  manager.meetingAdapter.retrieve = async () => {
    fallbackCalls += 1;
    return legacyResult('meeting', 'unwanted legacy evidence');
  };

  for (const query of ['Which cache did the team select?', '"cobalt" AND cache?', 'cobalt: cache (Aurora)']) {
    const result = await manager.readPlannedCanonicalSource({
      query, sourceType: 'meeting', sourceId: 'meeting-fts-question', limit: 8,
    });
    assert.equal(result.usedCanonical, true, `canonical query was not admitted: ${query}`);
    assert.equal(result.fallbackReason, null);
    assert.equal(result.results.length, 1);
    assert.match(result.results[0].chunk.text, /cobalt cache/);
  }
  assert.equal(fallbackCalls, 0, 'valid punctuated questions must not be misclassified as fallback errors');
  db.close();
});

test('empty planned canonical meeting coverage uses only the meeting fallback', async () => {
  const db = makeDb();
  const manager = makeSearchHarness(db);
  manager.queryPlanner.plan = () => { throw new Error('RagQueryPlanner must not run'); };
  const calls = { meeting: 0, mode: 0, personal: 0 };
  manager.meetingAdapter.retrieve = async () => { calls.meeting += 1; return legacyResult('meeting', 'meeting fallback only'); };
  manager.modeAdapter.retrieve = async () => { calls.mode += 1; return legacyResult('mode'); };
  manager.personalAdapter.retrieve = async () => { calls.personal += 1; return legacyResult('personal'); };

  const response = await manager.readPlannedCanonicalSource({
    query: 'meeting fallback only', sourceType: 'meeting', sourceId: 'missing', limit: 8,
  });
  assert.equal(response.usedCanonical, false);
  assert.equal(response.fallbackReason, 'empty');
  assert.equal(response.results[0].chunk.text, 'meeting fallback only');
  assert.deepEqual(calls, { meeting: 1, mode: 0, personal: 0 });
  db.close();
});

test('pre-aborted planned-source request performs zero retrieval', async () => {
  const manager = makeSearchHarness({});
  const calls = { meeting: 0, embedding: 0 };
  manager.meetingAdapter.retrieve = async () => { calls.meeting += 1; return legacyResult('meeting'); };
  manager.resolveCanonicalQueryEmbedding = async () => { calls.embedding += 1; return null; };
  const controller = new AbortController();
  controller.abort();
  const response = await manager.readPlannedCanonicalSource({
    query: 'cancelled', sourceType: 'meeting', signal: controller.signal,
  });
  assert.deepEqual(response, { results: [], usedCanonical: false, fallbackReason: null });
  assert.deepEqual(calls, { meeting: 0, embedding: 0 });
});

test('Change 26: canonical search embeds the query once through the existing pipeline and pins one embedding space', () => {
  const embedSource = RAGManager.prototype.resolveCanonicalQueryEmbedding.toString();
  assert.match(searchSource, /resolveCanonicalQueryEmbedding/);
  assert.match(searchSource, /queryEmbedding/);
  assert.match(searchSource, /embeddingSpaceId/);
  assert.match(embedSource, /getEmbeddingForQuery/);
  assert.match(embedSource, /findEmbeddingSpace/);
  assert.match(embedSource, /getActiveSpaceKey\(\) !== capturedSpace/);
  assert.doesNotMatch(
    searchSource,
    /new (Gemini|OpenAI|Ollama|Local)EmbeddingProvider/,
    'BUG: Change 26 must not rebuild the provider system inside RAGManager.search.',
  );
});

// WORK-0017: canonical-enabled retrieval must share the existing abort-aware
// caller budget. These use a local in-memory DB and inert embedding promises;
// no credentials, user documents, network services, or provider calls.
function withCanonicalQueryEmbedding(manager, storage, getEmbeddingForQuery) {
  const identity = {
    provider: 'fixture', model: 'fixture-embed', dimensions: 2,
    space: 'fixture:fixture-embed:2', version: 'pipeline-v1',
  };
  const space = storage.createEmbeddingSpace({
    provider: identity.provider, model: identity.model,
    dimensions: identity.dimensions, version: identity.version,
  });
  manager.embeddingPipeline = {
    getActiveCanonicalEmbeddingIdentity: () => identity,
    getActiveSpaceKey: () => identity.space,
    getEmbeddingForQuery,
  };
  return space;
}

test('WORK-0017 canonical query embedding uses the registered space and one provider call', async () => {
  const db = makeDb();
  try {
    const storage = new CanonicalRagStorage(db);
    const manager = makeSearchHarness(db);
    let calls = 0;
    const space = withCanonicalQueryEmbedding(manager, storage, async () => {
      calls += 1;
      return [0.25, 0.75];
    });
    const result = await manager.resolveCanonicalQueryEmbedding('fixture query');
    assert.deepEqual(result, { embedding: [0.25, 0.75], embeddingSpaceId: space.id });
    assert.equal(calls, 1);
  } finally {
    db.close();
  }
});

test('WORK-0017 canonical stalled embedding returns READY lexical evidence within the caller budget', { timeout: 9_000 }, async () => {
  const db = makeDb();
  let release;
  try {
    const storage = new CanonicalRagStorage(db);
    seedReadyMeeting(storage, 'meeting-budget', 'canonical timeout lexical result');
    const manager = makeSearchHarness(db);
    const pendingEmbedding = new Promise((resolve) => { release = resolve; });
    let calls = 0;
    let fallbackCalls = 0;
    withCanonicalQueryEmbedding(manager, storage, () => {
      calls += 1;
      return pendingEmbedding;
    });
    manager.meetingAdapter.retrieve = async () => {
      fallbackCalls += 1;
      return legacyResult('meeting');
    };
    const started = Date.now();
    const result = await manager.readPlannedCanonicalSource({
      query: 'canonical timeout lexical result', sourceType: 'meeting',
      sourceId: 'meeting-budget', limit: 8,
    });
    assert.ok(Date.now() - started < 4_500, 'canonical read must not wait for a hung embedding provider');
    assert.equal(calls, 1);
    assert.equal(fallbackCalls, 0, 'READY canonical lexical result should not be replaced by legacy evidence');
    assert.equal(result.usedCanonical, true);
    assert.equal(result.results[0].chunk.text, 'canonical timeout lexical result');
    release([0.25, 0.75]);
    await Promise.resolve();
    assert.equal(result.results[0].chunk.text, 'canonical timeout lexical result', 'late embedding cannot mutate released evidence');
  } finally {
    release?.([0.25, 0.75]);
    db.close();
  }
});

test('WORK-0017 STOP during canonical embedding returns cancelled without late fallback', async () => {
  const db = makeDb();
  let release;
  try {
    const storage = new CanonicalRagStorage(db);
    seedReadyMeeting(storage, 'meeting-cancel', 'canonical cancellation result');
    const manager = makeSearchHarness(db);
    let calls = 0;
    let fallbackCalls = 0;
    const pendingEmbedding = new Promise((resolve) => { release = resolve; });
    withCanonicalQueryEmbedding(manager, storage, () => {
      calls += 1;
      return pendingEmbedding;
    });
    manager.meetingAdapter.retrieve = async () => {
      fallbackCalls += 1;
      return legacyResult('meeting');
    };
    const controller = new AbortController();
    const started = Date.now();
    const resultPromise = manager.readPlannedCanonicalSource({
      query: 'canonical cancellation result', sourceType: 'meeting',
      sourceId: 'meeting-cancel', signal: controller.signal,
    });
    controller.abort();
    const result = await resultPromise;
    assert.ok(Date.now() - started < 1_000, 'STOP must release the pending read promptly');
    assert.equal(calls, 1);
    assert.equal(fallbackCalls, 0);
    assert.deepEqual(result, { results: [], usedCanonical: false, fallbackReason: null });
    release([0.25, 0.75]);
    await Promise.resolve();
    assert.deepEqual(result.results, [], 'a late embedding must not create evidence after STOP');
  } finally {
    release?.([0.25, 0.75]);
    db.close();
  }
});

test('WORK-0017 both canonical call sites pass their own AbortSignal and retain lexical fallback', () => {
  const embedSource = RAGManager.prototype.resolveCanonicalQueryEmbedding.toString();
  assert.match(plannedSource, /resolveCanonicalQueryEmbedding\(query,\s*input\.signal\)/);
  assert.match(searchSource, /resolveCanonicalQueryEmbedding\(normalizedQuery,\s*options\.signal\)/);
  assert.match(searchSource, /if\s*\(options\.signal\?\.aborted\)/);
  assert.match(embedSource, /withinQueryEmbeddingBudget/);
  assert.match(embedSource, /signal\?\.aborted/);
  assert.match(embedSource, /getEmbeddingForQuery/);
  assert.match(plannedSource, /new CanonicalRagReadService/);
});

test('canonical read is source-local and Knowledge remains on its existing adapter', () => {
  assert.match(searchSource, /sourceType:\s*['"]meeting['"]/);
  assert.match(searchSource, /sourceType:\s*['"]mode['"]/);
  assert.match(searchSource, /sourceType:\s*['"]personal['"]/);
  assert.doesNotMatch(searchSource, /sourceType:\s*['"]knowledge['"]/);
  assert.match(searchSource, /this\.knowledgeAdapter\.retrieve/);
});

test('canonical read has explicit legacy fallback paths', () => {
  assert.match(searchSource, /fallback: \(\) => this\.meetingAdapter\.retrieve/);
  assert.match(searchSource, /fallback: \(\) => this\.modeAdapter\.retrieve/);
  assert.match(searchSource, /fallback: \(\) => this\.personalAdapter\.retrieve/);
});

test('observe-only comparison and shadow are disabled when canonical read is authoritative', () => {
  assert.match(searchSource, /if \(!canonicalReadEnabled && !queryPlan\.projectFilesOnly\)/);
  assert.match(searchSource, /rerankCandidatePoolSize,\s*canonicalReadEnabled/);
  assert.match(searchSource, /if \(canonicalReadEnabled && canonicalReadFallbacks\.length > 0\)/);
  assert.match(searchSource, /this\.compareCanonicalRetrievalIfEnabled/);
  assert.match(searchSource, /observeCanonicalRagShadowIfEnabled/);
});

test('canonical read remains fail-closed when reranking is disabled', () => {
  assert.match(searchSource, /isIntelligenceFlagEnabled\(['"]canonicalRagRead['"]\)/);
  assert.match(searchSource, /isRagRerankEnabled\(\)/);
  assert.match(searchSource, /options\.allowRerank !== false/);
});

test('production boundary uses a READY canonical result without invoking the legacy reader', async () => {
  const db = makeDb();
  const storage = new CanonicalRagStorage(db);
  seedReadyMeeting(storage, 'meeting-1', 'canonical project update result');
  const manager = makeSearchHarness(db);
  let fallbackCalls = 0;
  manager.meetingAdapter.retrieve = async () => {
    fallbackCalls += 1;
    return legacyResult('meeting');
  };

  const response = await manager.search('project update', {
    selectedSources: ['meeting'],
    meetingId: 'meeting-1',
  });

  assert.equal(response.status, 'ok');
  assert.equal(response.results[0].chunk.text, 'canonical project update result');
  assert.equal(fallbackCalls, 0);
  db.close();
});

test('production boundary falls back when canonical coverage is empty', async () => {
  const db = makeDb();
  const manager = makeSearchHarness(db);
  let fallbackCalls = 0;
  manager.meetingAdapter.retrieve = async () => {
    fallbackCalls += 1;
    return legacyResult('meeting', 'legacy after empty canonical');
  };

  const response = await manager.search('project update', {
    selectedSources: ['meeting'],
    meetingId: 'missing-meeting',
  });

  assert.equal(response.status, 'ok');
  assert.equal(response.results[0].chunk.text, 'legacy after empty canonical');
  assert.equal(fallbackCalls, 1);
  db.close();
});

test('production boundary falls back when canonical storage fails', async () => {
  const failingDb = {
    prepare() {
      throw new Error('canonical sqlite failure');
    },
  };
  const manager = makeSearchHarness(failingDb);
  let fallbackCalls = 0;
  manager.meetingAdapter.retrieve = async () => {
    fallbackCalls += 1;
    return legacyResult('meeting', 'legacy after canonical error');
  };

  const response = await manager.search('project update', {
    selectedSources: ['meeting'],
    meetingId: 'meeting-1',
  });

  assert.equal(response.status, 'ok');
  assert.equal(response.results[0].chunk.text, 'legacy after canonical error');
  assert.equal(fallbackCalls, 1);
});

test('explicit allowRerank false prevents canonical authority at the production boundary', async () => {
  const db = makeDb();
  const storage = new CanonicalRagStorage(db);
  seedReadyMeeting(storage, 'meeting-1', 'canonical must not be selected');
  const manager = makeSearchHarness(db);
  let legacyCalls = 0;
  manager.meetingAdapter.retrieve = async () => {
    legacyCalls += 1;
    return legacyResult('meeting', 'legacy because rerank was disabled');
  };

  const response = await manager.search('project update', {
    selectedSources: ['meeting'],
    meetingId: 'meeting-1',
    allowRerank: false,
  });

  assert.equal(response.status, 'ok');
  assert.equal(response.results[0].chunk.text, 'legacy because rerank was disabled');
  assert.equal(legacyCalls, 1);
  db.close();
});

test('Knowledge remains on its existing adapter even when canonical reads are enabled', async () => {
  const manager = makeSearchHarness({});
  manager.queryPlanner = { plan() { return { retrievalQuery: 'knowledge query', sources: ['knowledge'] }; } };
  let knowledgeCalls = 0;
  manager.knowledgeAdapter.retrieve = async () => {
    knowledgeCalls += 1;
    return legacyResult('knowledge', 'knowledge result');
  };

  const response = await manager.search('knowledge query', {
    selectedSources: ['knowledge'],
  });

  assert.equal(response.status, 'ok');
  assert.equal(response.results[0].chunk.text, 'knowledge result');
  assert.equal(knowledgeCalls, 1);
});

test('canonical rerank failure falls back to the legacy source instead of exposing BM25', async () => {
  const db = makeDb();
  const storage = new CanonicalRagStorage(db);
  seedReadyMeeting(storage, 'meeting-1', 'canonical BM25 must never reach final output');
  const manager = makeSearchHarness(db);
  manager.rerankCanonicalResults = async () => {
    throw new Error('reranker unavailable');
  };
  let fallbackCalls = 0;
  manager.meetingAdapter.retrieve = async () => {
    fallbackCalls += 1;
    return legacyResult('meeting', 'legacy after reranker failure');
  };

  const response = await manager.search('project update', {
    selectedSources: ['meeting'],
    meetingId: 'meeting-1',
  });

  assert.equal(response.status, 'ok');
  assert.equal(response.results[0].chunk.text, 'legacy after reranker failure');
  assert.equal(fallbackCalls, 1);
  db.close();
});

// WORK-0018: same-query, same-source synthetic boundary comparison. The
// compatibility adapter below is an offline fixture, not the production
// RAGRetriever; this proves live canonical/compatibility selection and scoped
// evidence consistency, NOT ranking-score or real legacy retrieval parity.
test('CHG-17 same-fixture canonical-on/off meeting read preserves source and content without score claims', async () => {
  const originalFlag = process.env.NATIVELY_CANONICAL_RAG_READ;
  const originalRerank = process.env.NATIVELY_RAG_RERANK_ENABLED;
  const db = makeDb();
  try {
    const storage = new CanonicalRagStorage(db);
    const sourceId = 'parity-selected';
    const otherSourceId = 'parity-sibling';
    const content = 'violet budget allocation meeting decision';
    seedReadyMeeting(storage, sourceId, content);
    seedReadyMeeting(storage, otherSourceId, 'violet budget allocation unrelated sibling');

    const manager = makeSearchHarness(db);
    manager.queryPlanner.plan = () => { throw new Error('planned retrieval must not call RagQueryPlanner'); };
    manager.resolveCanonicalQueryEmbedding = async () => null; // lexical only; no provider requests
    let legacyReads = 0;
    manager.meetingAdapter.retrieve = async ({ options }) => {
      legacyReads += 1;
      assert.equal(options.meetingId, sourceId, 'legacy adapter must remain source-scoped');
      return [{
        chunk: { id: 'legacy-physical-id', documentId: sourceId, text: content, chunkIndex: 0, metadata: {} },
        score: 0.75,
        source: { id: sourceId, sourceType: 'meeting', name: `Meeting ${sourceId}`, metadata: {} },
      }];
    };

    process.env.NATIVELY_RAG_RERANK_ENABLED = 'on';
    process.env.NATIVELY_CANONICAL_RAG_READ = 'on';
    const canonical = await manager.readPlannedCanonicalSource({
      query: 'violet budget', sourceType: 'meeting', sourceId, sessionId: 'parity-test', limit: 8,
    });
    assert.equal(canonical.usedCanonical, true);
    assert.equal(canonical.fallbackReason, null);
    assert.equal(legacyReads, 0);

    process.env.NATIVELY_CANONICAL_RAG_READ = 'off';
    const compatibility = await manager.readPlannedCanonicalSource({
      query: 'violet budget', sourceType: 'meeting', sourceId, sessionId: 'parity-test', limit: 8,
    });
    assert.equal(compatibility.usedCanonical, false);
    assert.equal(compatibility.fallbackReason, 'disabled');
    assert.equal(legacyReads, 1);

    const identity = (result) => result.results.map((hit) => ({
      sourceType: hit.source.sourceType,
      sourceId: hit.source.id,
      chunkIndex: hit.chunk.chunkIndex,
      text: hit.chunk.text,
    }));
    assert.deepEqual(identity(canonical), identity(compatibility));
    assert.equal(canonical.results.length, 1);
    assert.equal(canonical.results[0].chunk.metadata.canonicalDocumentId != null, true);
    assert.equal(compatibility.results[0].chunk.metadata.canonicalDocumentId, undefined);
    // BM25, legacy similarity, RRF, and rerank scores are NOT numerically interchangeable.
  } finally {
    if (originalFlag === undefined) delete process.env.NATIVELY_CANONICAL_RAG_READ;
    else process.env.NATIVELY_CANONICAL_RAG_READ = originalFlag;
    if (originalRerank === undefined) delete process.env.NATIVELY_RAG_RERANK_ENABLED;
    else process.env.NATIVELY_RAG_RERANK_ENABLED = originalRerank;
    db.close();
  }
});

test('CHG-17 canonical scoped read never returns an unrelated meeting when selected source has no hits', async () => {
  const originalFlag = process.env.NATIVELY_CANONICAL_RAG_READ;
  const originalRerank = process.env.NATIVELY_RAG_RERANK_ENABLED;
  const db = makeDb();
  try {
    const storage = new CanonicalRagStorage(db);
    seedReadyMeeting(storage, 'sibling-only', 'orchid capacity sibling meeting');
    const manager = makeSearchHarness(db);
    manager.resolveCanonicalQueryEmbedding = async () => null;
    let requestedSource = null;
    manager.meetingAdapter.retrieve = async ({ options }) => {
      requestedSource = options.meetingId;
      return [];
    };
    process.env.NATIVELY_RAG_RERANK_ENABLED = 'on';
    process.env.NATIVELY_CANONICAL_RAG_READ = 'on';
    const result = await manager.readPlannedCanonicalSource({
      query: 'orchid capacity', sourceType: 'meeting', sourceId: 'selected-no-hit', limit: 8,
    });
    assert.equal(requestedSource, 'selected-no-hit');
    assert.deepEqual(result.results, []);
    assert.equal(result.usedCanonical, false);
    assert.equal(result.fallbackReason, 'empty');
  } finally {
    if (originalFlag === undefined) delete process.env.NATIVELY_CANONICAL_RAG_READ;
    else process.env.NATIVELY_CANONICAL_RAG_READ = originalFlag;
    if (originalRerank === undefined) delete process.env.NATIVELY_RAG_RERANK_ENABLED;
    else process.env.NATIVELY_RAG_RERANK_ENABLED = originalRerank;
    db.close();
  }
});
