// WORK0039: Salary facts live in the active profile_documents store, not the
// retired salary_estimates/knowledge_documents tables. Only explicitly
// extracted figures may be returned; an LLM-generated guess is never inserted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { KnowledgeOrchestrator } from '../../../dist-electron/premium/electron/knowledge/KnowledgeOrchestrator.js';
import { KnowledgeDatabaseManager } from '../../../dist-electron/premium/electron/knowledge/KnowledgeDatabaseManager.js';
import { DocType } from '../../../dist-electron/premium/electron/knowledge/types.js';

const estimate = {role:'Software Engineer',currency:'INR',min:350000,max:650000,confidence:'medium'};
function makeDb(){const db=new Database(':memory:');new KnowledgeDatabaseManager(db).initializeSchema();return db;}
function putResume(db, data, id='resume-example') {
  const now=new Date().toISOString();
  db.prepare('DELETE FROM profile_documents WHERE doc_type = ?').run(DocType.RESUME);
  db.prepare(`INSERT INTO profile_documents(id,doc_type,raw_text,structured_data,created_at,updated_at)
     VALUES(?,?,?,?,?,?)`).run(id,DocType.RESUME,'Synthetic résumé fixture',JSON.stringify(data),now,now);
}
const resume=(name='Rohan Varma',salary=estimate)=>({identity:{name},skills:{languages:['TypeScript']},
  experience:[{company:'AetherGrid',role:'Software Engineer'}],salary_estimate:salary});

test('a fresh orchestrator reads an explicitly extracted salary fact from active profile_documents',()=>{
  const db=makeDb();try{
    putResume(db,resume());
    const first=new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
    assert.deepEqual(first.getResumeSalaryEstimate(),estimate);
    const afterRestart=new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
    assert.deepEqual(afterRestart.getResumeSalaryEstimate(),estimate);
  }finally{db.close();}
});
test('replacing a résumé replaces the active salary fact; a stale value cannot leak',()=>{
  const db=makeDb();try{
    putResume(db,resume());
    const old=new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
    assert.ok(old.getResumeSalaryEstimate());
    putResume(db,resume('Different Candidate',null),'new-resume');
    const fresh=new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
    assert.equal(fresh.getResumeSalaryEstimate(),null);
  }finally{db.close();}
});
test('no active résumé means no derived salary fact',()=>{
  const db=makeDb();try{
    const orch=new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
    assert.equal(orch.getResumeSalaryEstimate(),null);
  }finally{db.close();}
});
test('invalid, corrupt and incomplete estimates fail closed without invented figures',()=>{
  const invalid=[null,{}, {min:100}, {min:'1',max:'2',currency:'INR'},
    {min:100,max:50,currency:'INR'}, {min:100,max:200,currency:'?'}];
  const db=makeDb();try{
    for(let i=0;i<invalid.length;i++){
      putResume(db,resume('Rohan Varma',invalid[i]),`row-${i}`);
      const orch=new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
      assert.equal(orch.getResumeSalaryEstimate(),null,`invalid case ${i} must fail closed`);
    }
  }finally{db.close();}
});
test('salary getter never fabricates a market estimate from an ordinary résumé',()=>{
  const db=makeDb();try{
    putResume(db,{identity:{name:'Rohan Varma'},experience:[{role:'Engineer',company:'AetherGrid'}]});
    const orch=new KnowledgeOrchestrator(new KnowledgeDatabaseManager(db));
    assert.equal(orch.getResumeSalaryEstimate(),null);
  }finally{db.close();}
});
