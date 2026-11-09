// WORK0039 migration of the historical knowledge-node re-embedding suite.
// The premium context_nodes store is retired. CanonicalRagStorage owns
// revisions, embeddings, jobs and distinct model-space IDs. These are actual
// persisted-in-SQLite checks, not source-text or mock-only assertions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { installCanonicalRagSchema } from '../../../dist-electron/electron/rag/canonical/CanonicalRagSchema.js';
import { CanonicalRagStorage } from '../../../dist-electron/electron/rag/canonical/CanonicalRagStorage.js';
import { CanonicalEmbeddingService } from '../../../dist-electron/electron/rag/canonical/CanonicalEmbeddingService.js';
import { CanonicalRagIndexer } from '../../../dist-electron/electron/rag/canonical/CanonicalRagIndexer.js';

function fixture({ count=3, suffix='fixture', sourceType='personal' } = {}) {
  const db=new Database(':memory:');
  db.pragma('foreign_keys = ON');
  let ext=sqliteVec.getLoadablePath();
  ext=ext.replace('app.asar','app.asar.unpacked').replace(/\.(dylib|so|dll)$/,'');
  db.loadExtension(ext);
  installCanonicalRagSchema(db);
  const storage=new CanonicalRagStorage(db);
  const doc=storage.createDocument({sourceType,sourceId:`space-${suffix}`,name:`${suffix}.txt`});
  const revision=storage.createRevision({documentId:doc.id,contentHash:`hash-${suffix}`,
    extractionVersion:'extract-v1',chunkingVersion:'chunk-v1',normalizationVersion:'norm-v1'});
  storage.replaceChunks(doc.id,revision.id,Array.from({length:count},(_,i)=>({
    chunkIndex:i,text:`canonical evidence ${suffix} ${i}`,sourceLocator:`chunk-${i}`})));
  return {db,storage,doc,revision,close:()=>db.close()};
}
function provider(options={}) {
  return {provider:'local',model:'fixture-embedding',dimensions:3,version:'v2',
    async embedBatch(texts){return texts.map(()=>[0.7,0.2,0.1]);},...options};
}
const run=(f,p=provider(),options={})=>new CanonicalEmbeddingService(f.storage,p).embedRevision(f.revision.id,options);
const count=(db,where='',args=[])=>db.prepare(`SELECT COUNT(*) n FROM rag_embeddings ${where}`).get(...args).n;

// Historical v1/v2 migration safety — a new model space never silently stamps
// old vectors with the new identity. Both can coexist for a revision.
test('old-space embeddings remain isolated when v2 model is embedded',async()=>{
  const f=fixture({suffix:'upgrade'});try{
    const old=await run(f,provider({version:'v1'}));
    const newer=await run(f,provider({version:'v2'}));
    assert.equal(old.complete,true); assert.equal(newer.complete,true);
    assert.notEqual(old.embeddingSpaceId,newer.embeddingSpaceId);
    assert.equal(count(f.db),6);
    assert.equal(count(f.db,'WHERE embedding_space_id=?',[newer.embeddingSpaceId]),3);
  }finally{f.close();}
});
test('provider model identity, not only vector dimensions, distinguishes spaces',async()=>{
  const f=fixture({suffix:'different-model'});try{
    const a=await run(f,provider({model:'model-a'}));
    const b=await run(f,provider({model:'model-b'}));
    assert.notEqual(a.embeddingSpaceId,b.embeddingSpaceId);
    assert.equal(count(f.db),6);
  }finally{f.close();}
});
test('partial provider failure leaves prefix saved and does not mark the revision complete',async()=>{
  const f=fixture({suffix:'partial'});try{
    let calls=0;
    const p=provider({async embedBatch(texts){calls++;if(calls===2)throw Error('429');return texts.map(()=>[1,0,0]);}});
    const result=await run(f,p,{batchSize:1});
    assert.equal(result.complete,false);assert.equal(result.embeddedCount,1);
    assert.equal(count(f.db),1);
  }finally{f.close();}
});
test('a later provider recovery converges the same revision without changing chunk identity',async()=>{
  const f=fixture({suffix:'recover'});try{
    const before=f.storage.readChunks(f.revision.id).map(c=>c.id);
    const bad=await run(f,provider({async embedBatch(){throw Error('temporary outage');}}));
    assert.equal(bad.complete,false);
    const good=await run(f);
    assert.equal(good.complete,true);assert.equal(count(f.db),3);
    assert.deepEqual(f.storage.readChunks(f.revision.id).map(c=>c.id),before);
  }finally{f.close();}
});
test('empty or wrong-count embedding result does not mark a batch done',async()=>{
  const f=fixture({suffix:'empty-result'});try{
    const result=await run(f,provider({async embedBatch(){return [];}}));
    assert.equal(result.complete,false);assert.equal(result.embeddedCount,0);
    assert.equal(count(f.db),0);
  }finally{f.close();}
});
test('a nonnumeric or nonfinite vector is never stored as valid evidence',async()=>{
  const f=fixture({suffix:'invalid-result'});try{
    const result=await run(f,provider({async embedBatch(texts){return texts.map(()=>[1,NaN,0]);}}));
    assert.equal(result.complete,false);assert.equal(count(f.db),0);
  }finally{f.close();}
});
test('empty canonical revision is a successful no-op without provider calls',async()=>{
  const f=fixture({count:0,suffix:'empty-revision'});try{
    let calls=0;
    const res=await run(f,provider({async embedBatch(){calls++;return [];}}));
    assert.equal(res.complete,true);assert.equal(res.embeddedCount,0);assert.equal(calls,0);
  }finally{f.close();}
});
test('matching active space does not force unnecessary second space creation',async()=>{
  const f=fixture({suffix:'same-space'});try{
    const a=await run(f);const b=await run(f);
    assert.equal(a.embeddingSpaceId,b.embeddingSpaceId);
    assert.equal(f.storage.listEmbeddingSpaces().length,1);
    assert.equal(count(f.db),3);
  }finally{f.close();}
});
test('keyword-only canonical chunks survive a failed embedding pass as lexical evidence',async()=>{
  const f=fixture({suffix:'lexical-only'});try{
    const before=f.storage.readChunks(f.revision.id);
    await run(f,provider({async embedBatch(){throw Error('offline');}}));
    assert.equal(count(f.db),0);
    assert.equal(f.storage.readChunks(f.revision.id).length,before.length);
    assert.deepEqual(f.storage.checkFts(f.revision.id),{expected:3,actual:3,missing:0});
  }finally{f.close();}
});
test('known active embedding space refuses vectors from a different model with equal dimensions',async()=>{
  const f=fixture({suffix:'refuse-space'});try{
    const a=new CanonicalEmbeddingService(f.storage,provider({model:'model-a'}));
    const b=new CanonicalEmbeddingService(f.storage,provider({model:'model-b'}));
    const active=a.ensureEmbeddingSpace();
    await assert.rejects(b.embedRevision(f.revision.id,{embeddingSpaceId:active.id}),/does not match/);
    assert.equal(count(f.db),0);
  }finally{f.close();}
});
test('a 384-dimensional provider cannot reuse a 768-dimensional space',async()=>{
  const f=fixture({suffix:'dimensions'});try{
    const a=new CanonicalEmbeddingService(f.storage,provider({dimensions:384}));
    const b=new CanonicalEmbeddingService(f.storage,provider({dimensions:768}));
    await assert.rejects(b.embedRevision(f.revision.id,{embeddingSpaceId:a.ensureEmbeddingSpace().id}),/does not match/);
    assert.equal(count(f.db),0);
  }finally{f.close();}
});
test('null active model is never inferred solely from an incompatible space',async()=>{
  const f=fixture({suffix:'unknown-model'});try{
    await assert.rejects(run(f,provider(),{embeddingSpaceId:'not-a-space'}),/not found/);
    assert.equal(count(f.db),0);
  }finally{f.close();}
});
test('space selection is provider:model:dimension:version, never a dimension-only stamp',()=>{
  const f=fixture({suffix:'metadata'});try{
    const a=new CanonicalEmbeddingService(f.storage,provider({model:'a'})).ensureEmbeddingSpace();
    const b=new CanonicalEmbeddingService(f.storage,provider({model:'b'})).ensureEmbeddingSpace();
    assert.notEqual(a.id,b.id);
    assert.equal(a.dimensions,b.dimensions);
  }finally{f.close();}
});
test('a model change keeps chunk provenance and document revision identity stable',async()=>{
  const f=fixture({suffix:'provenance'});try{
    const source=f.storage.readChunks(f.revision.id).map(c=>c.sourceLocator);
    await run(f,provider({version:'old'}));await run(f,provider({version:'new'}));
    assert.deepEqual(f.storage.readChunks(f.revision.id).map(c=>c.sourceLocator),source);
    assert.equal(f.storage.readRevision(f.revision.id).documentId,f.doc.id);
  }finally{f.close();}
});
test('indexRevision failure remains retryable and eventually activates READY on recovered provider',async()=>{
  const f=fixture({suffix:'index-recover'});try{
    let fail=true;
    const p=provider({async embedBatch(texts){if(fail)throw Error('temporary');return texts.map(()=>[1,0,0]);}});
    const indexer=new CanonicalRagIndexer(f.storage,new CanonicalEmbeddingService(f.storage,p));
    const first=await indexer.indexRevision(f.revision.id,{workerId:'test-repair'});
    assert.equal(first.complete,false);assert.equal(f.storage.getStatus(f.doc.id,f.revision.id).status,'FAILED');
    fail=false;
    await new Promise(resolve=>setTimeout(resolve,1100));
    const second=await indexer.indexRevision(f.revision.id,{workerId:'test-repair'});
    assert.equal(second.complete,true);assert.equal(f.storage.getStatus(f.doc.id,f.revision.id).status,'READY');
    assert.equal(f.storage.readDocument(f.doc.id).currentRevisionId,f.revision.id);
  }finally{f.close();}
});
test('READY revision is idempotent; reindex does not churn jobs',async()=>{
  const f=fixture({suffix:'index-idempotent'});try{
    const indexer=new CanonicalRagIndexer(f.storage,new CanonicalEmbeddingService(f.storage,provider()));
    const a=await indexer.indexRevision(f.revision.id,{workerId:'worker-idempotent'});
    const before=f.db.prepare('SELECT COUNT(*) n FROM rag_index_jobs').get().n;
    const b=await indexer.indexRevision(f.revision.id,{workerId:'worker-idempotent'});
    assert.equal(a.complete,true);assert.equal(b.complete,true);
    assert.equal(f.db.prepare('SELECT COUNT(*) n FROM rag_index_jobs').get().n,before);
  }finally{f.close();}
});
test('independent personal and meeting source types cannot share a canonical document identity',async()=>{
  const f=fixture({suffix:'isolated'});try{
    const meeting=f.storage.createDocument({sourceType:'meeting',sourceId:'space-isolated',name:'meeting.txt'});
    assert.notEqual(meeting.id,f.doc.id);
    const before=f.storage.readDocument(meeting.id);
    await run(f);
    assert.deepEqual(f.storage.readDocument(meeting.id),before);
  }finally{f.close();}
});
test('worker lease prevents superseded writer from completing a reclaimed indexing job',()=>{
  const f=fixture({suffix:'lease'});try{
    const job=f.storage.enqueueJob({documentId:f.doc.id,revisionId:f.revision.id,jobType:'rebuild_fts',availableAt:0});
    assert.equal(f.storage.claimSpecificJob(job.id,{workerId:'a',now:1000,leaseMs:10}).leasedBy,'a');
    assert.equal(f.storage.claimSpecificJob(job.id,{workerId:'b',now:1005,leaseMs:10}),null);
    assert.equal(f.storage.claimSpecificJob(job.id,{workerId:'b',now:1011,leaseMs:10}).leasedBy,'b');
    assert.throws(()=>f.storage.completeJob(job.id,'a'),/leased by another worker/);
    f.storage.completeJob(job.id,'b');
    assert.equal(f.storage.readJob(job.id).state,'COMPLETED');
  }finally{f.close();}
});
