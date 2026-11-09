// WORK0039: the main-process ingestion state survives renderer panel remounts.
// The active profile database replaces retired node/STAR bookkeeping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { KnowledgeOrchestrator } from '../../../dist-electron/premium/electron/knowledge/KnowledgeOrchestrator.js';
import { KnowledgeDatabaseManager } from '../../../dist-electron/premium/electron/knowledge/KnowledgeDatabaseManager.js';
import { DocType } from '../../../dist-electron/premium/electron/knowledge/types.js';

function fixture() {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'work0039-ingest-status-'));
  const db=new Database(':memory:');
  const orch=new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
  const file=(suffix)=>{const p=path.join(directory,`${suffix}.txt`);fs.writeFileSync(p,`Rohan Varma\nSoftware Engineer at AetherGrid\nBuilt a streaming service ${suffix} using Redis and PostgreSQL. I designed the API, tested error handling and improved deployment reliability.`);return p;};
  let release, reached;
  const wait=new Promise(r=>{release=r;});
  const entered=new Promise(r=>{reached=r;});
  let calls=0;
  orch.setGenerateContentFn(async()=>{
    calls++;if(calls===1){reached();await wait;}
    return JSON.stringify({identity:{name:'Rohan Varma'},skills:{languages:['TypeScript']},
      experience:[{role:'Engineer',company:'AetherGrid',bullets:['Built streaming service']}],projects:[]});
  });
  return {db,orch,file,entered,release:()=>release(),close:()=>{release();db.close();fs.rmSync(directory,{recursive:true,force:true});}};
}
test('main-owned status stays true while résumé parsing is in progress',async()=>{
  const f=fixture();try{
    assert.equal(f.orch.isIngesting(DocType.RESUME),false);
    const pending=f.orch.ingestDocument(f.file('one'),DocType.RESUME);
    await f.entered;
    assert.equal(f.orch.isIngesting(DocType.RESUME),true);
    assert.equal(f.orch.isIngesting(DocType.JD),false);
    f.release(); assert.equal((await pending).success,true);
    assert.equal(f.orch.isIngesting(DocType.RESUME),false);
  }finally{f.close();}
});
test('status includes queued same-type tasks and clears after the last settles',async()=>{
  const f=fixture();try{
    const a=f.orch.ingestDocument(f.file('one'),DocType.RESUME);
    await f.entered;
    const b=f.orch.ingestDocument(f.file('two'),DocType.RESUME);
    assert.equal(f.orch.isIngesting(DocType.RESUME),true);
    f.release();await a;
    assert.equal(f.orch.isIngesting(DocType.RESUME),true,'second queued ingest still pending');
    await b;
    assert.equal(f.orch.isIngesting(DocType.RESUME),false);
  }finally{f.close();}
});
test('a failed extraction clears in-flight status',async()=>{
  const f=fixture();try{
    f.orch.setGenerateContentFn(async()=>{throw new Error('simulated provider failure');});
    const old=process.env.PI_HEURISTIC_EXTRACTION;
    process.env.PI_HEURISTIC_EXTRACTION='off';
    try{
      const result=await f.orch.ingestDocument(f.file('bad'),DocType.RESUME);
      assert.equal(result.success,false);
      assert.equal(f.orch.isIngesting(DocType.RESUME),false);
    }finally{if(old===undefined)delete process.env.PI_HEURISTIC_EXTRACTION;else process.env.PI_HEURISTIC_EXTRACTION=old;}
  }finally{f.close();}
});
test('profile:get-status reports main-process flags rather than renderer-local state',()=>{
  const text=fs.readFileSync(path.resolve('electron/ipcHandlers.ts'),'utf8');
  const start=text.indexOf("safeHandle('profile:get-status'");
  assert.ok(start>=0);
  const next=text.indexOf('safeHandle(',start+10);
  const body=text.slice(start,next>start?next:undefined);
  assert.match(body,/resume_indexing_in_flight:\s*Boolean\(.*isIngesting/s);
  assert.match(body,/jd_indexing_in_flight:\s*Boolean\(.*isIngesting/s);
});
