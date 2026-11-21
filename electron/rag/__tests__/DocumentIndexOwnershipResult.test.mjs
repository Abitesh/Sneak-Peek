import test from 'node:test';
import assert from 'node:assert/strict';
import { RAGManager } from '../../../dist-electron/electron/rag/RAGManager.js';
import { invalidateIndexAttempt } from '../../../dist-electron/electron/rag/IndexAttemptRegistry.js';
// Exercise the actual production method. Only storage/vector transports are
// controlled; importantly, successful storage returns void as the real store does.
function fixture(revoke=false){
 const status=[],stored=[];const manager=Object.create(RAGManager.prototype);
 manager.setIndexStatus=(_source,_id,state,details)=>{status.push({state,...details});return {};};
 manager.indexCanonicalCorpus=async()=>{throw new Error('No canonical provider in isolated test');};
 manager.personalStorage={clearEmbeddings(){},replaceChunks(_id,chunks){return chunks.map((_,i)=>'chunk-'+i);},storeEmbedding(id){stored.push(id);}};
 manager.embeddingPipeline={embedDocumentChunks:async texts=>{if(revoke)invalidateIndexAttempt('personal','ownership-fixture');return {complete:true,vectors:texts.map(()=>({embedding:[1,0,0,0],space:'test:4',provider:'test',dimensions:4}))};}};
 return {manager,status,stored};
}
test('successful void vector writes complete actual document indexing and emit READY',async()=>{
 const f=fixture();const result=await f.manager.indexDocument({sourceType:'personal',documentId:'ownership-fixture',content:'The service uses violet leases for dispatch.'});
 assert.equal(result.status,'ready');assert.equal(result.embeddedChunkCount,result.chunkCount);assert.ok(f.stored.length);assert.equal(f.status.at(-1).state,'READY');
});
test('a revoked embedding run cannot write vectors or emit READY',async()=>{
 const f=fixture(true);const result=await f.manager.indexDocument({sourceType:'personal',documentId:'ownership-fixture',content:'The service uses violet leases for dispatch.'});
 assert.equal(result.status,'failed');assert.deepEqual(f.stored,[]);assert.ok(f.status.every(s=>s.state!=='READY'));
});
