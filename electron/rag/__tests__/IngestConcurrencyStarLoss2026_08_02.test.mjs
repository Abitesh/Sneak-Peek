// WORK0039: Same-type profile uploads are serialized by the ACTIVE profile
// owner and replaced atomically in profile_documents. The retired STAR-node
// tables are not part of the app's source of truth. These tests exercise the
// same re-upload race with the active schema and real compiled orchestrator.
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
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'work0039-ingest-race-'));
  const db = new Database(':memory:');
  const orch = new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
  const file = (name) => {
    const p = path.join(directory, `${name}.txt`);
    fs.writeFileSync(p, `Rohan Varma\nSoftware Engineer at AetherGrid\nProject ${name}: shipped a streaming pipeline using TypeScript, Redis, and PostgreSQL. I built the APIs, tested retry behavior and improved production reliability.`);
    return p;
  };
  return {db, orch, file, close() { db.close(); fs.rmSync(directory, {recursive:true,force:true}); }};
}
const resumeJson = (name) => JSON.stringify({ identity: {name}, skills: {languages:['TypeScript']},
  experience:[{role:'Engineer',company:'AetherGrid',bullets:['Shipped streaming pipeline']}],
  projects:[], education:[], certifications:[] });
const jdJson = JSON.stringify({title:'Backend Developer',company:'AetherGrid',requirements:['TypeScript'],technologies:['Redis']});
function gate() {
  let release, reached;
  const wait = new Promise((resolve)=>{release=resolve;});
  const entered = new Promise((resolve)=>{reached=resolve;});
  return {wait,entered,release:()=>release(),reached:()=>reached()};
}

test('re-upload waits for existing same-type ingestion and atomically installs newest résumé', async () => {
  const f=fixture(), g=gate();
  try {
    let calls=0, active=0, overlap=false;
    f.orch.setGenerateContentFn(async parts => {
      const prompt=parts.map(x=>x.text).join(' ');
      if (/job description data/i.test(prompt)) return jdJson;
      active++; if(active>1) overlap=true;
      const index=++calls;
      if (index===1) { g.reached(); await g.wait; }
      active--;
      return resumeJson(index===1?'First Candidate':'Second Candidate');
    });
    const first=f.orch.ingestDocument(f.file('first'),DocType.RESUME);
    await g.entered;
    const second=f.orch.ingestDocument(f.file('second'),DocType.RESUME);
    assert.equal(f.orch.isIngesting(DocType.RESUME),true);
    assert.equal(f.orch.isIngesting(DocType.JD),false);
    // Allow the second queued task a chance to interleave before releasing.
    await new Promise(resolve=>setTimeout(resolve,25));
    assert.equal(calls,1,'second extraction must not start before first completes');
    g.release();
    const [a,b]=await Promise.all([first,second]);
    assert.equal(a.success,true,a.error); assert.equal(b.success,true,b.error);
    assert.equal(overlap,false);
    assert.equal(calls,2);
    const rows=f.db.prepare("SELECT * FROM profile_documents WHERE doc_type = 'resume'").all();
    assert.equal(rows.length,1);
    assert.equal(JSON.parse(rows[0].structured_data).identity.name,'Second Candidate');
    assert.equal(f.orch.isIngesting(DocType.RESUME),false);
  } finally { g.release(); f.close(); }
});

test('JD ingestion can finish while an independent résumé extraction is blocked', async () => {
  const f=fixture(),g=gate();
  try {
    f.orch.setGenerateContentFn(async parts=>{
      const prompt=parts.map(x=>x.text).join(' ');
      if (/job description data/i.test(prompt)) return jdJson;
      g.reached(); await g.wait; return resumeJson('Rohan Varma');
    });
    const resume=f.orch.ingestDocument(f.file('resume'),DocType.RESUME);
    await g.entered;
    const jd=await Promise.race([
      f.orch.ingestDocument(f.file('jd'),DocType.JD),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('JD blocked by résumé')),2000)),
    ]);
    assert.equal(jd.success,true,jd.error);
    assert.equal(f.db.prepare("SELECT count(*) n FROM profile_documents WHERE doc_type='jd'").get().n,1);
    assert.equal(f.orch.isIngesting(DocType.RESUME),true);
    g.release();
    assert.equal((await resume).success,true);
  } finally {g.release();f.close();}
});

test('failed replacement does not destroy an earlier valid résumé row', async () => {
  const f=fixture();
  try {
    f.orch.setGenerateContentFn(async()=>resumeJson('Original Candidate'));
    assert.equal((await f.orch.ingestDocument(f.file('original'),DocType.RESUME)).success,true);
    const before=f.db.prepare("SELECT id,structured_data FROM profile_documents WHERE doc_type='resume'").get();
    f.orch.setGenerateContentFn(async()=>{throw new Error('provider unavailable');});
    const old=process.env.PI_HEURISTIC_EXTRACTION;
    process.env.PI_HEURISTIC_EXTRACTION='off';
    try { assert.equal((await f.orch.ingestDocument(f.file('failed'),DocType.RESUME)).success,false); }
    finally {if(old===undefined) delete process.env.PI_HEURISTIC_EXTRACTION;else process.env.PI_HEURISTIC_EXTRACTION=old;}
    const after=f.db.prepare("SELECT id,structured_data FROM profile_documents WHERE doc_type='resume'").get();
    assert.deepEqual(after,before);
    assert.equal(f.orch.isIngesting(DocType.RESUME),false);
  } finally {f.close();}
});
