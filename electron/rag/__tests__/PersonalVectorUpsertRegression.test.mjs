import assert from 'node:assert/strict';
import { test } from 'node:test';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { VectorStore } from '../../../dist-electron/electron/rag/VectorStore.js';

function vectorBlob(values) {
  const floats = Float32Array.from(values);
  return Buffer.from(floats.buffer, floats.byteOffset, floats.byteLength);
}

function setup() {
  const db = new Database(':memory:');
  db.loadExtension(sqliteVec.getLoadablePath());
  db.exec(`
    CREATE TABLE personal_file_chunks (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding BLOB,
      embedding_provider TEXT,
      embedding_dimensions INTEGER,
      embedding_space TEXT
    );

    -- VectorStore detects native sqlite-vec support through the meeting table.
    CREATE VIRTUAL TABLE vec_chunks_768 USING vec0(
      chunk_id INTEGER PRIMARY KEY,
      embedding float[768] distance_metric=cosine
    );

    CREATE VIRTUAL TABLE vec_personal_chunks_3 USING vec0(
      personal_chunk_rowid INTEGER PRIMARY KEY,
      embedding float[3] distance_metric=cosine
    );
  `);
  db.prepare(`
    INSERT INTO personal_file_chunks (id, file_id, chunk_index, text)
    VALUES (?, ?, ?, ?)
  `).run('chunk-1', 'resume-1', 0, 'Candidate project evidence.');

  return { db, store: new VectorStore(db, ':memory:', '') };
}

function setupWithoutNativeVec() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE personal_file_chunks (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding BLOB,
      embedding_provider TEXT,
      embedding_dimensions INTEGER,
      embedding_space TEXT
    );
  `);
  return { db, store: new VectorStore(db, ':memory:', '') };
}

function nearestDistance(db, vector) {
  const row = db.prepare(`
    SELECT personal_chunk_rowid, distance
    FROM vec_personal_chunks_3
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT 1
  `).get(vectorBlob(vector));
  return Number(row?.distance);
}

test('missing personal source row throws when native vec is unavailable', () => {
  const { db, store } = setupWithoutNativeVec();

  assert.throws(
    () => store.storePersonalEmbedding('missing-chunk', [1, 0, 0], 'test:space:3'),
    /does not exist/,
  );
  db.close();
});

test('personal native vector writes are idempotent for the same chunk rowid', () => {
  const { db, store } = setup();

  store.storePersonalEmbedding('chunk-1', [1, 0, 0], 'test:space:3', 'test', 3);
  store.storePersonalEmbedding('chunk-1', [0, 1, 0], 'test:space:3', 'test', 3);

  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM vec_personal_chunks_3').get().n,
    1,
    're-embedding the same chunk must replace, not duplicate or fail',
  );
  assert.ok(nearestDistance(db, [0, 1, 0]) < 1e-6, 'native row must contain the latest vector');
  db.close();
});

test('derived personal native vec index can be repaired from source-row embedding BLOBs', () => {
  const { db, store } = setup();

  store.storePersonalEmbedding('chunk-1', [0, 1, 0], 'test:space:3', 'test', 3);
  const source = db.prepare('SELECT rowid FROM personal_file_chunks WHERE id = ?').get('chunk-1');

  // Simulate the old false-success state: source BLOB is current, native vec row is stale.
  db.prepare('DELETE FROM vec_personal_chunks_3 WHERE personal_chunk_rowid = ?').run(source.rowid);
  db.prepare(`
    INSERT INTO vec_personal_chunks_3(personal_chunk_rowid, embedding)
    VALUES (?, ?)
  `).run(BigInt(source.rowid), vectorBlob([1, 0, 0]));

  assert.ok(nearestDistance(db, [0, 1, 0]) > 0.5, 'fixture must actually be stale before repair');

  const repair = store.rebuildPersonalNativeVecIndexesFromStoredEmbeddings();
  assert.equal(repair.rebuiltRows, 1);
  assert.deepEqual(repair.dimensions, [3]);
  assert.ok(nearestDistance(db, [0, 1, 0]) < 1e-6, 'repair must restore the source-row vector');

  const sourceAfter = db.prepare(`
    SELECT file_id, text, embedding_space, embedding_dimensions
    FROM personal_file_chunks
    WHERE id = ?
  `).get('chunk-1');
  assert.equal(sourceAfter.file_id, 'resume-1');
  assert.equal(sourceAfter.text, 'Candidate project evidence.');
  assert.equal(sourceAfter.embedding_space, 'test:space:3');
  assert.equal(sourceAfter.embedding_dimensions, 3);
  db.close();
});
