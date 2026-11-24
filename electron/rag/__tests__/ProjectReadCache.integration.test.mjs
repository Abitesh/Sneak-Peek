import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Database from 'better-sqlite3';
import {performance} from 'node:perf_hooks';
import {RAGManager} from '../../../dist-electron/electron/rag/RAGManager.js';
import {PersonalRagAdapter} from '../../../dist-electron/electron/rag/adapters/PersonalRagAdapter.js';
import {PersonalKnowledgeManager} from '../../../dist-electron/electron/personalKnowledge/PersonalKnowledgeManager.js';
import {ProjectKnowledgeManager} from '../../../dist-electron/electron/projects/ProjectKnowledgeManager.js';
const fixture=()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sneak-0092-read-'));const db=new Database(path.join(dir,'test.db'));PersonalKnowledgeManager.instance=null;const files=PersonalKnowledgeManager.getInstance(db),projects=new ProjectKnowledgeManager(db,files);const rag=Object.create(RAGManager.prototype);rag.db=db;rag.embeddingPipeline={getActiveSpaceKey:()=>undefined};rag.getConversationForRetrieval=()=>undefined;rag.personalAdapter=new PersonalRagAdapter(db);rag.personalAdapter.getPersonalKnowledge=()=>files;rag.rerankCanonicalResults=async(_q,c)=>c;rag.gateCanonicalResults=c=>c;return {dir,db,files,projects,rag,close(){rag.projectReadCache?.dispose();db.close();PersonalKnowledgeManager.instance=null;fs.rmSync(dir,{recursive:true,force:true});}};};
test('actual canonical read and personal SQLite adapter reuse only the completed current project result',async()=>{
 const f=fixture();try{
 const a=await f.projects.save({name:'Orchid Dispatch',description:'Orchid dispatch uses violet leases for retries.'});const b=await f.projects.save({name:'Amber Inbox',description:'Amber uses yellow counters. PRIVATE_AMBER_CANARY'});
 let reads=0;const retrieve=f.rag.personalAdapter.retrieve.bind(f.rag.personalAdapter);f.rag.personalAdapter.retrieve=async input=>{reads++;return retrieve(input);};
 const input={sourceType:'personal',projectFilesOnly:true,projectFileIds:[a.id],sessionId:'s',query:'violet leases',limit:8,tokenBudget:1800};
 const initial=await f.rag.readPlannedCanonicalSource(input);assert.ok(initial.results.length);assert.ok(initial.results.every(r=>r.source.id===a.id));assert.doesNotMatch(JSON.stringify(initial),/PRIVATE_AMBER_CANARY/);
 const n=reads;initial.results[0].chunk.text='mutated';const cached=await f.rag.readPlannedCanonicalSource(input);assert.equal(reads,n);assert.doesNotMatch(JSON.stringify(cached),/mutated/);
 await f.rag.readPlannedCanonicalSource({...input,sessionId:'other'});assert.equal(reads,n+1);
 await f.projects.save({...a,description:'Orchid uses indigo leases for retries.'});const changed=await f.rag.readPlannedCanonicalSource({...input,query:'indigo leases'});assert.match(JSON.stringify(changed),/indigo/);assert.doesNotMatch(JSON.stringify(changed),/violet leases/);
 f.projects.setEnabled(a.id,false);await assert.rejects(f.rag.readPlannedCanonicalSource(input),/disabled/);f.projects.setEnabled(a.id,true);
 f.projects.remove(a.id);await assert.rejects(f.rag.readPlannedCanonicalSource(input),/disabled|deleted/);assert.ok(f.projects.get(b.id));
 }finally{f.close();}
});
test('cancellation does not populate the completed cache and an edit during retrieval rejects stale evidence',async()=>{
 const f=fixture();try{const a=await f.projects.save({name:'Orchid',description:'Violet dispatch leases.'});const input={sourceType:'personal',projectFilesOnly:true,projectFileIds:[a.id],sessionId:'s',query:'dispatch',limit:8};
 const controller=new AbortController();controller.abort();assert.deepEqual((await f.rag.readPlannedCanonicalSource({...input,signal:controller.signal})).results,[]);assert.equal(f.rag.getProjectRetrievalCacheStats().hits,0);
 const original=f.rag.personalAdapter.retrieve.bind(f.rag.personalAdapter);f.rag.personalAdapter.retrieve=async request=>{const result=await original(request);await f.projects.save({...a,description:'Indigo dispatch leases.'});return result;};
 await assert.rejects(f.rag.readPlannedCanonicalSource(input),/changed during retrieval/);
 }finally{f.close();}
});
