// WORK0039: Historical node reembed-loop tests migrated to the canonical
// bounded batching and lease/job retry owner. Retired context_nodes tables and
// the no-op premium ensureEmbeddingSpace() are intentionally not recreated.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { installCanonicalRagSchema } from '../../../dist-electron/electron/rag/canonical/CanonicalRagSchema.js';
import { CanonicalRagStorage } from '../../../dist-electron/electron/rag/canonical/CanonicalRagStorage.js';
import { CanonicalEmbeddingService } from '../../../dist-electron/electron/rag/canonical/CanonicalEmbeddingService.js';

function fixture(count=4,suffix='loop') {
  const db=new Database(':memory:'); db.pragma('foreign_keys=ON');
  let ext=sqliteVec.getLoadablePath(); ext=ext.replace('app.asar','app.asar.unpacked').replace(/\.(dylib|so|dll)$/,'');
  db.loadExtension(ext); installCanonicalRagSchema(db);
  const storage=new CanonicalRagStorage(db);
  const doc=storage.createDocument({sourceType:'personal',sourceId:`loop-${suffix}`,name:`${suffix}.txt`});
  const revision=storage.createRevision({documentId:doc.id,contentHash:`hash-${suffix}`,
    extractionVersion:'extract-v1',chunkingVersion:'chunk-v1',normalizationVersion:'norm-v1'});
  storage.replaceChunks(doc.id,revision.id,Array.from({length:count},(_,i)=>({chunkIndex:i,text:`chunk ${i}`,sourceLocator:`chunk-${i}`})));
  return {db,storage,doc,revision,close:()=>db.close()};
}
const provider=(fn=async texts=>texts.map(()=>[1,0,0]),override={})=>({
  provider:'local',model:'loop-model',dimensions:3,version:'1',embedBatch:fn,...override});
const service=(f,p=provider())=>new CanonicalEmbeddingService(f.storage,p);
const n=(f)=>f.db.prepare('SELECT COUNT(*) n FROM rag_embeddings').get().n;

test('a permanently failing embedding provider terminates instead of looping forever',async()=>{
  const f=fixture(4,'always-fail');try{
    let calls=0;
    const res=await service(f,provider(async()=>{calls++;throw Error('offline');})).embedRevision(f.revision.id,{batchSize:1});
    assert.equal(res.complete,false);assert.equal(calls,1);assert.equal(n(f),0);
  }finally{f.close();}
});
test('a failed invocation self-heals after the provider becomes available',async()=>{
  const f=fixture(3,'recover');try{
    let online=false;
    const emb=service(f,provider(async texts=>{if(!online)throw Error('offline');return texts.map(()=>[1,0,0]);}));
    assert.equal((await emb.embedRevision(f.revision.id)).complete,false);
    online=true;assert.equal((await emb.embedRevision(f.revision.id)).complete,true);assert.equal(n(f),3);
  }finally{f.close();}
});
test('a failure after real batch progress leaves only successfully persisted prefix',async()=>{
  const f=fixture(3,'partial-prefix');try{
    let calls=0;const emb=service(f,provider(async texts=>{calls++;if(calls===2)throw Error('retry');return texts.map(()=>[1,0,0]);}));
    const fail=await emb.embedRevision(f.revision.id,{batchSize:1});
    assert.equal(fail.embeddedCount,1);assert.equal(n(f),1);
    const done=await emb.embedRevision(f.revision.id);
    assert.equal(done.complete,true);assert.equal(n(f),3);
  }finally{f.close();}
});
test('batchCount above maximum is clamped so one call cannot grow without bound',async()=>{
  const f=fixture(70,'bounded');try{
    const sizes=[];const emb=service(f,provider(async texts=>{sizes.push(texts.length);return texts.map(()=>[1,0,0]);}));
    const result=await emb.embedRevision(f.revision.id,{batchSize:100000});
    assert.equal(result.complete,true);assert.deepEqual(sizes,[64,6]);
  }finally{f.close();}
});
test('zero batchSize fails explicitly instead of spinning',async()=>{
  const f=fixture(1,'zero');try{
    await assert.rejects(service(f).embedRevision(f.revision.id,{batchSize:0}),/greater than zero/);
  }finally{f.close();}
});
test('negative batchSize fails explicitly instead of spinning',async()=>{
  const f=fixture(1,'negative');try{
    await assert.rejects(service(f).embedRevision(f.revision.id,{batchSize:-1}),/greater than zero/);
  }finally{f.close();}
});
test('nonfinite batchSize cannot induce an unbounded indexing loop',async()=>{
  const f=fixture(1,'nan');try{
    await assert.rejects(service(f).embedRevision(f.revision.id,{batchSize:Infinity}),/must be finite/);
  }finally{f.close();}
});
test('mismatched provider dimensions cannot stamp an existing active space',async()=>{
  const f=fixture(1,'dimension-mismatch');try{
    const active=service(f).ensureEmbeddingSpace();
    const wrong=service(f,provider(async texts=>texts.map(()=>[1,0]),{dimensions:2}));
    await assert.rejects(wrong.embedRevision(f.revision.id,{embeddingSpaceId:active.id}),/does not match/);
    assert.equal(n(f),0);
  }finally{f.close();}
});
test('active model identity mismatch rejects same-dimension vectors',async()=>{
  const f=fixture(1,'model-mismatch');try{
    const active=service(f).ensureEmbeddingSpace();
    await assert.rejects(service(f,provider(undefined,{model:'different-model'})).embedRevision(f.revision.id,
      {embeddingSpaceId:active.id}),/does not match/);
  }finally{f.close();}
});
test('a broken local provider yields no vector, not an untrusted fallback from another space',async()=>{
  const f=fixture(2,'no-fallback');try{
    const res=await service(f,provider(async()=>null)).embedRevision(f.revision.id);
    assert.equal(res.complete,false);assert.equal(n(f),0);
  }finally{f.close();}
});
test('an array of wrong-size embedding vectors is rejected without extra work',async()=>{
  const f=fixture(2,'wrong-vector-size');try{
    const res=await service(f,provider(async texts=>texts.map(()=>[1,0]))).embedRevision(f.revision.id);
    assert.equal(res.complete,false);assert.equal(n(f),0);
  }finally{f.close();}
});
test('deleted canonical document cannot be re-embedded',async()=>{
  const f=fixture(1,'deleted');try{
    f.storage.softDeleteDocument(f.doc.id);
    await assert.rejects(service(f).embedRevision(f.revision.id),/deleted document/);
  }finally{f.close();}
});
test('provider space metadata remains stable across failures and recovery',async()=>{
  const f=fixture(2,'space-stable');try{
    let online=false;const emb=service(f,provider(async texts=>{if(!online)throw Error('offline');return texts.map(()=>[1,0,0]);}));
    const a=emb.ensureEmbeddingSpace();
    assert.equal((await emb.embedRevision(f.revision.id)).complete,false);
    online=true;const b=await emb.embedRevision(f.revision.id);
    assert.equal(b.embeddingSpaceId,a.id);assert.equal(n(f),2);
  }finally{f.close();}
});
