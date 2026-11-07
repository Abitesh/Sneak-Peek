/**
 * CHG-17 final source-boundary tests. Run with Electron's native better-sqlite3.
 * No user database, network provider, migration or external API is involved.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

process.env.NATIVELY_CANONICAL_RAG_READ = 'on';
process.env.NATIVELY_RAG_LOCAL_RERANK = 'on';

const root = new URL('../../../dist-electron/electron/rag/', import.meta.url).href;
const { installCanonicalRagSchema } = await import(new URL('canonical/CanonicalRagSchema.js', root).href);
const { CanonicalRagStorage } = await import(new URL('canonical/CanonicalRagStorage.js', root).href);
const { CanonicalRagReadService } = await import(new URL('canonical/CanonicalRagReadService.js', root).href);
const { RAGManager } = await import(new URL('RAGManager.js', root).href);
const { VectorStore } = await import(new URL('VectorStore.js', root).href);
const { RAGRetriever } = await import(new URL('RAGRetriever.js', root).href);
const { MeetingRagAdapter } = await import(new URL('adapters/MeetingRagAdapter.js', root).href);

const question = 'Which cache did the team select?';
const answerText = 'The team selected cobalt cache for the Aurora service.';

function makeDb({ vector = false } = {}) {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  if (vector) {
    let ext = sqliteVec.getLoadablePath();
    ext = ext.replace('app.asar', 'app.asar.unpacked').replace(/\.(dylib|so|dll)$/, '');
    db.loadExtension(ext);
  }
  installCanonicalRagSchema(db);
  return db;
}

function addCanonical(storage, {
  sourceType = 'personal',
  sourceId,
  fileType = null,
  ownerId = null,
  scopeId = null,
  text,
  status = 'READY',
  locator = 'page:2',
}) {
  const doc = storage.createDocument({ sourceType, sourceId, name: `${sourceId}.pdf`, fileType, ownerId, scopeId });
  const revision = storage.createRevision({
    documentId: doc.id,
    contentHash: `hash-${sourceId}`,
    extractionVersion: 'fixture',
    chunkingVersion: 'fixture',
    normalizationVersion: 'fixture',
  });
  storage.replaceChunks(doc.id, revision.id, [{
    chunkIndex: 0,
    text,
    pageStart: 2,
    pageEnd: 2,
    sourceLocator: locator,
  }]);
  if (status === 'READY') {
    storage.setStatus(doc.id, revision.id, 'READY', { chunkCount: 1, embeddedChunkCount: 0 });
    storage.activateRevision(doc.id, revision.id);
  }
  return { doc, revision };
}

test('CHG-17 project canonical reads enforce original file IDs, project type, and owner together', () => {
  const db = makeDb();
  try {
    const storage = new CanonicalRagStorage(db);
    const a = addCanonical(storage, { sourceId: 'project-a', fileType: 'project', ownerId: 'local', text: 'Cobalt cache backs project Alpha.' });
    addCanonical(storage, { sourceId: 'project-a-sibling', fileType: 'project', ownerId: 'local', text: 'Cobalt cache backs project Alpha Legacy.' });
    addCanonical(storage, { sourceId: 'project-personal', fileType: 'resume', ownerId: 'local', text: 'Cobalt is in the resume.' });
    addCanonical(storage, { sourceId: 'project-other-owner', fileType: 'project', ownerId: 'other', text: 'Cobalt belongs to another owner.' });
    addCanonical(storage, { sourceId: 'project-not-ready', fileType: 'project', ownerId: 'local', text: 'Cobalt is not indexed yet.', status: 'LEXICAL_READY' });
    const scope = {
      sourceType: 'personal',
      fileType: 'project',
      ownerId: 'local',
      sourceIds: ['project-a', 'project-a-sibling', 'project-other-owner', 'project-personal', 'project-not-ready'],
      limit: 20,
    };
    const filtered = storage.searchLexical('cobalt?', scope);
    assert.deepEqual(new Set(filtered.map((hit) => hit.document.sourceId)), new Set(['project-a', 'project-a-sibling']));
    const exact = storage.searchLexical('cobalt?', { ...scope, sourceIds: ['project-a'] });
    assert.equal(exact.length, 1);
    assert.equal(exact[0].document.id, a.doc.id);
    assert.equal(exact[0].chunk.sourceLocator, 'page:2');
    assert.deepEqual(storage.searchLexical('cobalt?', { ...scope, sourceIds: [] }), []);
    assert.deepEqual(storage.searchLexical('cobalt?', { ...scope, ownerId: 'not-local' }), []);
    assert.deepEqual(storage.searchLexical('cobalt?', { ...scope, fileType: 'resume', sourceIds: ['project-a'] }), []);
  } finally {
    db.close();
  }
});

test('CHG-17 canonical service cannot use siblings as project evidence or invoke fallback on a valid scoped hit', async () => {
  const db = makeDb();
  try {
    const storage = new CanonicalRagStorage(db);
    addCanonical(storage, { sourceId: 'project-linkship', fileType: 'project', text: answerText });
    addCanonical(storage, { sourceId: 'project-linkship-legacy', fileType: 'project', text: 'Cobalt cache was not used here.' });
    const service = new CanonicalRagReadService(storage);
    let fallbackCalls = 0;
    const outcome = await service.readSource({
      query: question,
      sourceType: 'personal',
      sourceIds: ['project-linkship'],
      fileType: 'project',
      limit: 10,
      fallback: async () => {
        fallbackCalls++;
        return [];
      },
    });
    assert.equal(outcome.usedCanonical, true);
    assert.equal(fallbackCalls, 0);
    assert.deepEqual(outcome.results.map((hit) => hit.source.id), ['project-linkship']);
    assert.equal(outcome.results[0].chunk.pageStart, 2);
    assert.ok(outcome.results[0].chunk.metadata.canonicalDocumentId);
    assert.ok(outcome.results[0].chunk.metadata.canonicalRevisionId);
    assert.equal(outcome.results[0].chunk.metadata.sourceLocator, 'page:2');
  } finally {
    db.close();
  }
});

test('CHG-17 planned-source project falls back with the same allowlist, without invoking the RAG planner', async () => {
  const db = makeDb();
  try {
    const manager = Object.create(RAGManager.prototype);
    manager.db = db;
    manager.queryPlanner = { plan: () => { throw new Error('second source planning is prohibited'); } };
    manager.getConversationForRetrieval = () => undefined;
    manager.resolveCanonicalQueryEmbedding = async () => null;
    manager.rerankCanonicalResults = async (_query, results) => results;
    manager.gateCanonicalResults = (results) => results;
    manager.meetingAdapter = { retrieve: async () => { throw new Error('wrong source'); } };
    manager.modeAdapter = { retrieve: async () => { throw new Error('wrong source'); } };
    let observedOptions;
    manager.personalAdapter = {
      retrieve: async ({ options }) => {
        observedOptions = options;
        return [
          {
            chunk: { id: 'a', documentId: 'project-a', text: answerText, chunkIndex: 0 },
            source: { id: 'project-a', sourceType: 'personal', metadata: { fileType: 'project' } },
            score: 0.7,
          },
          {
            chunk: { id: 'b', documentId: 'project-b', text: 'Forbidden sibling', chunkIndex: 0 },
            source: { id: 'project-b', sourceType: 'personal', metadata: { fileType: 'project' } },
            score: 0.9,
          },
        ];
      },
    };
    const result = await manager.readPlannedCanonicalSource({
      query: 'cobalt?',
      sourceType: 'personal',
      projectFilesOnly: true,
      projectFileIds: ['project-a'],
      limit: 8,
    });
    assert.equal(observedOptions.projectFilesOnly, true);
    assert.deepEqual(observedOptions.projectFileIds, ['project-a']);
    assert.equal(result.usedCanonical, false);
    assert.deepEqual(result.results.map((hit) => hit.source.id), ['project-a']);

    observedOptions = null;
    const denied = await manager.readPlannedCanonicalSource({
      query: 'cobalt?',
      sourceType: 'personal',
      projectFilesOnly: true,
      projectFileIds: [],
      limit: 8,
    });
    assert.equal(observedOptions, null, 'empty allowlist cannot invoke a global personal search');
    assert.deepEqual(denied.results, []);
  } finally {
    db.close();
  }
});

test('CHG-17 actual meeting RAGRetriever and canonical service agree on punctuated source/content (lexical path)', async () => {
  const db = makeDb();
  try {
    db.exec(`
      CREATE TABLE meetings (id TEXT PRIMARY KEY, title TEXT, start_time INTEGER, duration_ms INTEGER, summary_json TEXT, created_at TEXT, source TEXT, is_processed INTEGER, embedding_space TEXT);
      CREATE TABLE chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, meeting_id TEXT NOT NULL, chunk_index INTEGER NOT NULL, speaker TEXT, start_timestamp_ms INTEGER, end_timestamp_ms INTEGER, cleaned_text TEXT NOT NULL, token_count INTEGER NOT NULL, embedding BLOB);
      CREATE VIRTUAL TABLE chunks_fts USING fts5(chunk_id UNINDEXED, meeting_id UNINDEXED, speaker, text);
      CREATE TABLE embedding_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, meeting_id TEXT);
    `);
    db.prepare('INSERT INTO meetings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run('meeting-a', 'Synthetic Meeting', 1000, 1000, null, '2026-01-01', 'fixture', 1, 'fixture:model:2');
    const id = db.prepare('INSERT INTO chunks (meeting_id, chunk_index, speaker, start_timestamp_ms, end_timestamp_ms, cleaned_text, token_count, embedding) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run('meeting-a', 0, 'Speaker A', 100, 200, answerText, 15, null).lastInsertRowid;
    db.prepare('INSERT INTO chunks_fts VALUES (?, ?, ?, ?)').run(String(id), 'meeting-a', 'Speaker A', answerText);
    const storage = new CanonicalRagStorage(db);
    addCanonical(storage, { sourceType: 'meeting', sourceId: 'meeting-a', text: answerText, locator: 'meeting:100-200' });
    const queryEmbedding = {
      getEmbeddingForQuery: async () => { throw new Error('offline: no embedding provider'); },
      getActiveSpaceKey: () => 'fixture:model:2',
    };
    const retriever = new RAGRetriever(new VectorStore(db, '', ''), queryEmbedding);
    const legacyAdapter = new MeetingRagAdapter(retriever, {
      readMeeting: (meetingId) => ({ id: meetingId, title: 'Synthetic Meeting' }),
    });
    const retrieveLegacy = () => legacyAdapter.retrieve({
      query: question,
      options: { meetingId: 'meeting-a' },
      candidatePoolSize: 10,
      tokenBudget: 2000,
    });
    const legacy = await retrieveLegacy();
    assert.ok(legacy.length, 'real meeting retriever must return the lexical fact');
    const canonical = await new CanonicalRagReadService(storage).readSource({
      query: question,
      sourceType: 'meeting',
      sourceId: 'meeting-a',
      limit: 10,
      fallback: retrieveLegacy,
    });
    assert.equal(canonical.usedCanonical, true);
    assert.equal(canonical.fallbackReason, null);
    assert.deepEqual(new Set(canonical.results.map((hit) => hit.source.id)), new Set(['meeting-a']));
    assert.ok(legacy.some((hit) => hit.chunk.text === answerText));
    assert.ok(canonical.results.some((hit) => hit.chunk.text === answerText));
    assert.equal(canonical.results[0].chunk.metadata.sourceLocator, 'meeting:100-200');
    // Scores intentionally differ: legacy normalized rank vs canonical FTS5 BM25.
  } finally {
    db.close();
  }
});

test('CHG-17 canonical vector search keeps project type, original IDs and owner scope', () => {
  const db = makeDb({ vector: true });
  try {
    const storage = new CanonicalRagStorage(db);
    const allowed = addCanonical(storage, { sourceId: 'vec-project-a', fileType: 'project', ownerId: 'alice', text: 'Cobalt cache in authorized project.' });
    const sibling = addCanonical(storage, { sourceId: 'vec-project-b', fileType: 'project', ownerId: 'alice', text: 'Another project.' });
    const otherOwner = addCanonical(storage, { sourceId: 'vec-project-c', fileType: 'project', ownerId: 'bob', text: 'Another owner.' });
    const resume = addCanonical(storage, { sourceId: 'vec-resume', fileType: 'resume', ownerId: 'alice', text: 'Resume content.' });
    const space = storage.createEmbeddingSpace({ provider: 'fixture', model: 'm', dimensions: 2, version: '1' });
    for (const entity of [allowed, sibling, otherOwner, resume]) {
      const chunk = storage.readChunks(entity.revision.id)[0];
      storage.storeEmbedding(chunk.id, space.id, [1, 0]);
    }
    const results = storage.searchVector([1, 0], {
      embeddingSpaceId: space.id,
      sourceType: 'personal',
      fileType: 'project',
      ownerId: 'alice',
      sourceIds: ['vec-project-a'],
      limit: 20,
    });
    assert.deepEqual(results.map((result) => result.document.sourceId), ['vec-project-a']);
    assert.deepEqual(storage.searchVector([1, 0], {
      embeddingSpaceId: space.id,
      sourceType: 'personal',
      fileType: 'project',
      sourceIds: [],
      limit: 20,
    }), []);
    assert.deepEqual(storage.searchVector([1, 0], {
      embeddingSpaceId: space.id,
      sourceType: 'personal',
      fileType: 'project',
      ownerId: 'nobody',
      limit: 20,
    }), []);
  } finally {
    db.close();
  }
});
