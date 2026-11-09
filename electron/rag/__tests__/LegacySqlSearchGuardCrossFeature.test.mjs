// electron/rag/__tests__/LegacySqlSearchGuardCrossFeature.test.mjs
//
// HIGH — covers three previously-thin areas of the v1→v2 migration:
//
//  (5) buildLegacySpaceCaseSql(): every LEGACY_PROVIDER_MODEL entry must produce a
//      valid SQL CASE arm, and running that CASE in a real SQLite backfill must yield
//      exactly legacySpaceForProvider(name, dims) for each provider — including the
//      equality-only safety (no split on ':') for any colon-bearing model id.
//
//  (6) VectorStore search hard-guard: searchSimilar({}) and searchSummaries(q, 5) with
//      NO spaceKey return [] (refuse to leak across spaces); WITH a spaceKey they filter
//      correctly; meetingId + spaceKey combine.
//
//  (7) Cross-feature isolation: meetings reindex (RAG tables) and knowledge re-embed
//      (context_nodes) are separate DBs/tables and never interfere; a local-only 384d
//      user whose spaces already match triggers NEITHER a needless meetings reindex NOR
//      a knowledge re-embed.
//
// Run under Electron ABI:
//   ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron --test <file>

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { installCanonicalRagSchema } from '../../../dist-electron/electron/rag/canonical/CanonicalRagSchema.js';
import { CanonicalRagStorage } from '../../../dist-electron/electron/rag/canonical/CanonicalRagStorage.js';
import { CanonicalEmbeddingService } from '../../../dist-electron/electron/rag/canonical/CanonicalEmbeddingService.js';
import { CanonicalRagIndexer } from '../../../dist-electron/electron/rag/canonical/CanonicalRagIndexer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const esPath = path.resolve(__dirname, '../../../dist-electron/electron/rag/embeddingSpace.js');
const vsPath = path.resolve(__dirname, '../../../dist-electron/electron/rag/VectorStore.js');

const ES = await import(pathToFileURL(esPath).href);
const { VectorStore } = await import(pathToFileURL(vsPath).href);
const { buildLegacySpaceCaseSql, legacySpaceForProvider, LEGACY_PROVIDER_MODEL, embeddingSpaceKey } = ES;

// ──────────────────────────────────────────────────────────────────────────
// (5) buildLegacySpaceCaseSql — valid SQL + matches legacySpaceForProvider
// ──────────────────────────────────────────────────────────────────────────
describe('buildLegacySpaceCaseSql — backfill CASE matches legacySpaceForProvider', () => {
  test('produces one WHEN/THEN arm per LEGACY_PROVIDER_MODEL entry', () => {
    const sql = buildLegacySpaceCaseSql();
    const providers = Object.keys(LEGACY_PROVIDER_MODEL);
    for (const p of providers) {
      assert.ok(sql.includes(`WHEN '${p}' THEN '`), `arm present for provider ${p}`);
    }
    const armCount = (sql.match(/WHEN /g) || []).length;
    assert.equal(armCount, providers.length, 'exactly one arm per provider');
  });

  test('running the CASE in real SQLite yields legacySpaceForProvider(name,dims) for each', () => {
    const db = new Database(':memory:');
    db.exec(`CREATE TABLE m (id TEXT, embedding_provider TEXT, embedding_dimensions INTEGER, embedding_space TEXT)`);
    // One row per provider, plus an UNKNOWN provider (must fall through CASE → no model match).
    const dims = { gemini: 768, ollama: 768, openai: 1536, local: 384 };
    for (const [p] of Object.entries(LEGACY_PROVIDER_MODEL)) {
      db.prepare("INSERT INTO m (id, embedding_provider, embedding_dimensions) VALUES (?, ?, ?)").run(p, p, dims[p]);
    }
    db.prepare("INSERT INTO m (id, embedding_provider, embedding_dimensions) VALUES ('x','mystery',999)").run();

    const caseArms = buildLegacySpaceCaseSql();
    // Mirror the v16 migration backfill shape: name:model:dims, model resolved via CASE.
    const backfill = `
      UPDATE m
      SET embedding_space =
        embedding_provider || ':' ||
        (CASE embedding_provider
          ${caseArms}
          ELSE 'unknown'
        END) || ':' ||
        COALESCE(CAST(embedding_dimensions AS TEXT), 'unknown')
      WHERE embedding_provider IS NOT NULL
    `;
    db.exec(backfill);

    for (const [p] of Object.entries(LEGACY_PROVIDER_MODEL)) {
      const row = db.prepare("SELECT embedding_space FROM m WHERE id = ?").get(p);
      const expected = legacySpaceForProvider(p, dims[p]);
      assert.equal(row.embedding_space, expected, `backfill matches legacySpaceForProvider for ${p}`);
    }
    // Unknown provider → 'mystery:unknown:999' (CASE fell through to ELSE 'unknown').
    const mystery = db.prepare("SELECT embedding_space FROM m WHERE id='x'").get();
    assert.equal(mystery.embedding_space, 'mystery:unknown:999');
    db.close();
  });

  test('equality-only safety: a colon-bearing model id is matched whole, never split', () => {
    // No current LEGACY model contains a colon, but Ollama-style ids (nomic-embed-text:latest)
    // could. embeddingSpaceKey must keep the colon and equality compares must still hold.
    const k = embeddingSpaceKey({ name: 'ollama', model: 'nomic-embed-text:latest', dimensions: 768 });
    assert.equal(k, 'ollama:nomic-embed-text:latest:768');
    // Equality is the only operation used downstream — a naive split('::')[1] would be wrong,
    // so we assert the whole-string round-trips and compares equal to itself / differs from v2.
    const k2 = embeddingSpaceKey({ name: 'ollama', model: 'nomic-embed-text:v2', dimensions: 768 });
    assert.notEqual(k, k2, 'colon-bearing models with different suffixes are distinct spaces');
    assert.equal(k, 'ollama:nomic-embed-text:latest:768'); // stable
  });
});

// ──────────────────────────────────────────────────────────────────────────
// (6) VectorStore search hard-guard
// ──────────────────────────────────────────────────────────────────────────
describe('VectorStore search hard-guard (real compiled VectorStore, pure-SQL path)', () => {
  let db, vs;
  const SPACE_A = 'gemini:gemini-embedding-2:768';
  const SPACE_B = 'gemini:gemini-embedding-001:768';

  function embBlob(fill) {
    const b = Buffer.alloc(768 * 4);
    for (let i = 0; i < 768; i++) b.writeFloatLE(fill, i * 4);
    return b;
  }

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE meetings (id TEXT PRIMARY KEY, embedding_space TEXT);
      CREATE TABLE chunks (id INTEGER PRIMARY KEY AUTOINCREMENT, meeting_id TEXT, cleaned_text TEXT, embedding BLOB, speaker TEXT, start_ms INTEGER, end_ms INTEGER);
      CREATE TABLE chunk_summaries (id INTEGER PRIMARY KEY AUTOINCREMENT, meeting_id TEXT, summary_text TEXT, embedding BLOB);
    `);
    vs = new VectorStore(db, ':memory:', '/nonexistent-ext');
    // Meeting in SPACE_A with one embedded chunk + summary; meeting in SPACE_B too.
    db.prepare("INSERT INTO meetings (id, embedding_space) VALUES ('mA', ?)").run(SPACE_A);
    db.prepare("INSERT INTO meetings (id, embedding_space) VALUES ('mB', ?)").run(SPACE_B);
    db.prepare("INSERT INTO chunks (meeting_id, cleaned_text, embedding, speaker, start_ms, end_ms) VALUES ('mA','chunk A', ?, 'spk', 0, 1)").run(embBlob(0.1));
    db.prepare("INSERT INTO chunks (meeting_id, cleaned_text, embedding, speaker, start_ms, end_ms) VALUES ('mB','chunk B', ?, 'spk', 0, 1)").run(embBlob(0.2));
    db.prepare("INSERT INTO chunk_summaries (meeting_id, summary_text, embedding) VALUES ('mA','sum A', ?)").run(embBlob(0.1));
    db.prepare("INSERT INTO chunk_summaries (meeting_id, summary_text, embedding) VALUES ('mB','sum B', ?)").run(embBlob(0.2));
  });
  afterEach(async () => {
    // Terminate the VectorStore worker thread so the test process can exit cleanly
    // (a WITH-spaceKey search spins up a Worker; without destroy() the event loop hangs).
    if (vs && typeof vs.destroy === 'function') await vs.destroy();
    db.close();
  });

  test('searchSimilar({}) with NO spaceKey → [] (refuses cross-space leak)', async () => {
    const res = await vs.searchSimilar(new Array(768).fill(0.1), {});
    assert.deepEqual(res, [], 'empty options → empty, never all-spaces leak');
  });

  test('searchSummaries(q, 5) with NO spaceKey → [] (refuses cross-space leak)', async () => {
    const res = await vs.searchSummaries(new Array(768).fill(0.1), 5);
    assert.deepEqual(res, [], 'no spaceKey → empty');
  });

  test('searchSimilar with spaceKey filters to that space only', async () => {
    const res = await vs.searchSimilar(new Array(768).fill(0.1), { spaceKey: SPACE_A, minSimilarity: -1 });
    assert.ok(res.length >= 1, 'returns chunks in SPACE_A');
    assert.ok(res.every(r => r.meetingId === 'mA'), 'no SPACE_B chunks leak into a SPACE_A search');
  });

  test('searchSummaries with spaceKey filters to that space only', async () => {
    const res = await vs.searchSummaries(new Array(768).fill(0.1), 5, SPACE_A);
    assert.ok(res.length >= 1);
    assert.ok(res.every(r => r.meetingId === 'mA'), 'only SPACE_A summaries');
  });

  test('meetingId + spaceKey combine: a meetingId in a DIFFERENT space yields nothing', async () => {
    // mB is in SPACE_B; query for mB but with the SPACE_A key → space filter excludes it.
    const res = await vs.searchSimilar(new Array(768).fill(0.2), { meetingId: 'mB', spaceKey: SPACE_A, minSimilarity: -1 });
    assert.deepEqual(res, [], 'meetingId scoped + space-mismatched → empty');
    // mB with its own SPACE_B key → returned.
    const ok = await vs.searchSimilar(new Array(768).fill(0.2), { meetingId: 'mB', spaceKey: SPACE_B, minSimilarity: -1 });
    assert.ok(ok.length >= 1 && ok.every(r => r.meetingId === 'mB'));
  });
});

// ──────────────────────────────────────────────────────────────────────────
// (7) Cross-feature isolation + local-only no-op
// ──────────────────────────────────────────────────────────────────────────
function seedCanonical(db, sourceId, dimensions) {
  let ext = sqliteVec.getLoadablePath();
  ext = ext.replace('app.asar', 'app.asar.unpacked').replace(/\.(dylib|so|dll)$/,'');
  db.loadExtension(ext);
  installCanonicalRagSchema(db);
  const storage = new CanonicalRagStorage(db);
  const doc = storage.createDocument({sourceType:'personal',sourceId,name:'resume.txt'});
  const revision = storage.createRevision({documentId:doc.id,contentHash:'resume-hash',
    extractionVersion:'extract-v1',chunkingVersion:'chunk-v1',normalizationVersion:'norm-v1'});
  storage.replaceChunks(doc.id,revision.id,[{chunkIndex:0,text:'Rohan built backend APIs',sourceLocator:'resume:0'}]);
  let calls = 0;
  const provider = {provider:'local',model:'Xenova/all-MiniLM-L6-v2',dimensions,version:'v1',
    async embedBatch(texts) { calls++; return texts.map(()=>new Array(dimensions).fill(0.01)); }};
  return {storage,doc,revision,embedding:new CanonicalEmbeddingService(storage,provider),calls:()=>calls};
}
describe('Cross-feature: canonical personal indexing never mutates the legacy meeting tables', () => {
  test('personal canonical reindex cannot write to meeting chunks or meeting embedding space', async () => {
    const db = new Database(':memory:');
    try {
      db.exec(`CREATE TABLE meetings (id TEXT PRIMARY KEY, embedding_space TEXT, is_processed INTEGER DEFAULT 1);
        CREATE TABLE chunks (id INTEGER PRIMARY KEY, meeting_id TEXT, embedding BLOB);`);
      const oldSpace=embeddingSpaceKey({name:'gemini',model:'gemini-embedding-001',dimensions:768});
      db.prepare("INSERT INTO meetings(id, embedding_space) VALUES ('m1', ?)").run(oldSpace);
      db.prepare("INSERT INTO chunks(meeting_id,embedding) VALUES ('m1', ?)").run(Buffer.alloc(768*4));
      const before=db.prepare("SELECT id, embedding_space FROM meetings WHERE id='m1'").get();
      const beforeBlob=db.prepare("SELECT embedding FROM chunks WHERE meeting_id='m1'").get().embedding;
      const ctx=seedCanonical(db,'profile-safe',3);
      const result=await ctx.embedding.embedRevision(ctx.revision.id);
      assert.equal(result.complete,true);
      assert.deepEqual(db.prepare("SELECT id, embedding_space FROM meetings WHERE id='m1'").get(),before);
      assert.deepEqual(db.prepare("SELECT embedding FROM chunks WHERE meeting_id='m1'").get().embedding,beforeBlob);
      assert.equal(db.prepare("SELECT COUNT(*) n FROM rag_embeddings WHERE embedding_space_id=?").get(result.embeddingSpaceId).n,1);
    } finally {db.close();}
  });
  test('local space already READY does not trigger a redundant reindex or touch meeting rows', async () => {
    const db = new Database(':memory:');
    let vs;
    try {
      db.exec(`CREATE TABLE meetings (id TEXT PRIMARY KEY, embedding_space TEXT, is_processed INTEGER DEFAULT 1, created_at TEXT);
        CREATE TABLE chunks (id INTEGER PRIMARY KEY, meeting_id TEXT, embedding BLOB);
        CREATE TABLE chunk_summaries (id INTEGER PRIMARY KEY, meeting_id TEXT, embedding BLOB);`);
      const local=embeddingSpaceKey({name:'local',model:'Xenova/all-MiniLM-L6-v2',dimensions:384});
      db.prepare("INSERT INTO meetings(id,embedding_space) VALUES('m1',?)").run(local);
      db.prepare("INSERT INTO chunks(meeting_id,embedding) VALUES ('m1',?)").run(Buffer.alloc(384*4));
      vs=new VectorStore(db,':memory:','/nonexistent-ext');
      assert.equal(vs.getIncompatibleSpaceCount(local),0);
      assert.deepEqual(vs.getMeetingIdsNeedingReindex(local),[]);
      const ctx=seedCanonical(db,'profile-ready',384);
      const indexer=new CanonicalRagIndexer(ctx.storage,ctx.embedding);
      assert.equal((await indexer.indexRevision(ctx.revision.id,{workerId:'no-churn'})).complete,true);
      const calls=ctx.calls();
      const beforeJobs=db.prepare('SELECT count(*) n FROM rag_index_jobs').get().n;
      assert.equal((await indexer.indexRevision(ctx.revision.id,{workerId:'no-churn'})).complete,true);
      assert.equal(ctx.calls(),calls,'a READY revision must not require embedding again');
      assert.equal(db.prepare('SELECT count(*) n FROM rag_index_jobs').get().n,beforeJobs);
      assert.equal(db.prepare("SELECT embedding_space FROM meetings WHERE id='m1'").get().embedding_space,local);
    } finally {if(vs?.destroy) await vs.destroy();db.close();}
  });
});
