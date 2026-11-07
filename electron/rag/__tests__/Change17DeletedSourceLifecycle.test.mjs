import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { DatabaseManager } from '../../../dist-electron/electron/db/DatabaseManager.js';
import { CanonicalRagStorage } from '../../../dist-electron/electron/rag/canonical/CanonicalRagStorage.js';
import { installCanonicalRagSchema } from '../../../dist-electron/electron/rag/canonical/CanonicalRagSchema.js';

function fixture() {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE modes(id TEXT PRIMARY KEY); CREATE TABLE mode_reference_files(id TEXT PRIMARY KEY, mode_id TEXT);
    CREATE TABLE rag_index_status(source_type TEXT, document_id TEXT); CREATE TABLE meetings(id TEXT PRIMARY KEY);
    CREATE TABLE embedding_queue(id TEXT); CREATE TABLE chunk_summaries(id TEXT, meeting_id TEXT); CREATE TABLE chunks(id TEXT, meeting_id TEXT);
    CREATE TABLE ai_interactions(id TEXT); CREATE TABLE transcripts(id TEXT);
    INSERT INTO modes VALUES ('mode-a'); INSERT INTO mode_reference_files VALUES ('ref-a','mode-a'); INSERT INTO meetings VALUES ('meeting-a');`);
  installCanonicalRagSchema(db);
  const storage = new CanonicalRagStorage(db);
  for (const [type, id] of [['mode', 'ref-a'], ['meeting', 'meeting-a'], ['personal', 'personal-decoy']]) {
    const doc = storage.createDocument({ sourceType: type, sourceId: id, name: id });
    const rev = storage.createRevision({ documentId: doc.id, contentHash: id, extractionVersion: 'fixture', chunkingVersion: 'fixture', normalizationVersion: 'fixture' });
    storage.replaceChunks(doc.id, rev.id, [{ chunkIndex: 0, text: 'Synthetic violet deletion canary.' }]);
    storage.setStatus(doc.id, rev.id, 'READY', { chunkCount: 1, embeddedChunkCount: 0 }); storage.activateRevision(doc.id, rev.id);
  }
  const manager = Object.create(DatabaseManager.prototype); manager.db = db;
  return { db, storage, manager };
}

for (const operation of ['deleteReferenceFile', 'deleteMode', 'deleteMeeting', 'clearAllData']) {
  test(`CHG-17 ${operation} revokes canonical searchability while retaining history and other source families`, () => {
    const { db, storage, manager } = fixture();
    try {
      const type = operation === 'deleteReferenceFile' || operation === 'deleteMode' ? 'mode' : 'meeting';
      const id = type === 'mode' ? 'ref-a' : 'meeting-a';
      assert.equal(storage.searchLexical('violet', { sourceType: type, sourceId: id, limit: 8 }).length, 1);
      manager[operation](operation === 'deleteMode' ? 'mode-a' : id);
      assert.deepEqual(storage.searchLexical('violet', { sourceType: type, sourceId: id, limit: 8 }), []);
      assert.ok(storage.readDocumentBySource(type, id).deletedAt);
      assert.equal(storage.readRevisions(storage.readDocumentBySource(type, id).id).length, 1);
      assert.equal(storage.searchLexical('violet', { sourceType: 'personal', sourceId: 'personal-decoy', limit: 8 }).length, 1);
    } finally { db.close(); }
  });
}

test('a failed source deletion rolls back canonical revocation with the source row', () => {
  const { db, storage, manager } = fixture();
  try {
    db.exec("CREATE TRIGGER reject_synthetic_delete BEFORE DELETE ON mode_reference_files BEGIN SELECT RAISE(ABORT, 'synthetic deletion failure'); END");
    manager.deleteReferenceFile('ref-a');
    assert.ok(db.prepare('SELECT 1 FROM mode_reference_files WHERE id = ?').get('ref-a'));
    assert.equal(storage.readDocumentBySource('mode', 'ref-a').deletedAt, null);
    assert.equal(storage.searchLexical('violet', { sourceType: 'mode', sourceId: 'ref-a', limit: 8 }).length, 1);
  } finally { db.close(); }
});
