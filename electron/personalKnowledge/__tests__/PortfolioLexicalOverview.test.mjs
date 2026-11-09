import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

test('portfolio overview uses indexed project and scoped resume chunks without requiring embeddings', async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-overview-'));
  const db=new Database(path.join(dir,'fixture.db'));
  try {
    const {PersonalKnowledgeManager}=await import('../../../dist-electron/electron/personalKnowledge/PersonalKnowledgeManager.js');
    PersonalKnowledgeManager.instance=null;
    const manager=PersonalKnowledgeManager.getInstance(db);
    const projectPath=path.join(dir,'Linkship_Intermediate_Interview.md');
    const otherPath=path.join(dir,'Legacy_Backend.md');
    const resumePath=path.join(dir,'Candidate_Resume.md');
    const privatePath=path.join(dir,'Unrelated_General.md');
    fs.writeFileSync(projectPath,'# Linkship project\nDesigned a backend application that uses Redis job leases and PostgreSQL for durable records.\nThe API handles scheduling.');
    fs.writeFileSync(otherPath,'# Another project\nBuilt a Python service with SQLite and REST APIs.');
    fs.writeFileSync(resumePath,'# Resume Projects\nImplemented Linkship backend services with Redis and Python.');
    fs.writeFileSync(privatePath,'# Personal note\nThe secret canary for this unrelated file is forbidden.');
    const project=await manager.ingestFile(projectPath,'project');
    const other=await manager.ingestFile(otherPath,'project');
    const resume=await manager.ingestFile(resumePath,'resume');
    await manager.ingestFile(privatePath,'general');
    const question='Can you explain your projects?';
    const projects=manager.searchRelevant(question,8,'project');
    assert.ok(projects.some(r=>r.fileId===project.id && /Redis job leases/.test(r.text)));
    assert.ok(projects.some(r=>r.fileId===other.id && /Python service/.test(r.text)));
    assert.equal(projects.some(r=>/forbidden/.test(r.text)),false);
    // Production retrieval adapter and its existing grounding gate must agree
    // that this is an authorized synthesis request, not a fabricated score.
    const {PersonalRagAdapter}=await import('../../../dist-electron/electron/rag/adapters/PersonalRagAdapter.js');
    const {RAGManager}=await import('../../../dist-electron/electron/rag/RAGManager.js');
    const {RAGRetriever}=await import('../../../dist-electron/electron/rag/RAGRetriever.js');
    const adapter=new PersonalRagAdapter(db);
    adapter.getPersonalKnowledge=()=>manager;
    const candidates=await adapter.retrieve({query:question,options:{projectFilesOnly:true},candidatePoolSize:8,tokenBudget:1800});
    assert.ok(candidates.some(r=>r.source.id===project.id));
    assert.ok(candidates.some(r=>r.source.id===other.id));
    const rag=Object.create(RAGManager.prototype);
    rag.retriever={detectIntent:RAGRetriever.prototype.detectIntent};
    const admitted=rag.gateCanonicalResults(candidates,question,null);
    assert.ok(admitted.length>0,'actual relevance gate must admit source-tagged overview evidence');
    const resumes=manager.searchRelevant(question,8,undefined,[resume.id]);
    assert.ok(resumes.length>0);
    assert.deepEqual([...new Set(resumes.map(r=>r.fileId))],[resume.id]);
    assert.deepEqual(manager.searchRelevant(question,8,undefined,[]),[]);
    // Regression for the real desktop phrasing, which previously missed
    // portfolio recognition. Run actual lexical retrieval and relevance gate.
    const conversational='Then can you explain me Your projects you mentioned in the resume';
    const conversationalProjects=manager.searchRelevant(conversational,8,'project');
    assert.ok(conversationalProjects.some(r=>r.fileId===project.id && /Redis job leases/.test(r.text)));
    assert.ok(conversationalProjects.some(r=>r.fileId===other.id && /Python service/.test(r.text)));
    const conversationalResumes=manager.searchRelevant(conversational,8,undefined,[resume.id]);
    assert.ok(conversationalResumes.length>0);
    assert.ok(conversationalResumes.every(r=>r.fileId===resume.id));
    const conversationalCandidates=await adapter.retrieve({
      query:conversational,options:{projectFilesOnly:true},candidatePoolSize:8,tokenBudget:1800,
    });
    assert.equal(rag.retriever.detectIntent(conversational),'summary',
      'a conversational resume-project overview must not be treated as speaker lookup');
    assert.equal(rag.retriever.detectIntent('What did Alice say about Redis?'),'speaker_lookup',
      'actual speaker questions must retain the more specific intent');
    assert.equal(rag.retriever.detectIntent('Tell me about Linkship Legacy.'),'open_question',
      'named projects retain exact-project routing rather than broad portfolio synthesis');
    assert.equal(rag.retriever.detectIntent('What is DBMS?'),'open_question',
      'general technical queries must not become personal-document summaries');
    const conversationalAdmitted=rag.gateCanonicalResults(conversationalCandidates,conversational,null);
    assert.ok(conversationalAdmitted.length>0,'the real relevance gate must preserve authorized project evidence');
    assert.ok(conversationalAdmitted.every(r=>r.source.metadata.fileType==='project'));
    assert.ok(!conversationalAdmitted.some(r=>/forbidden/.test(r.chunk.text)));
    // The exact authorized synthesis must not wait on optional cloud query
    // embeddings; pending vectors must not stall an otherwise indexed PDF.
    let semanticCalls=0;
    const originalSemantic=manager.searchSemantic;
    manager.searchSemantic=async()=>{ semanticCalls++; return []; };
    try {
      const fastProjects=await manager.searchRelevantAsync(conversational,8,'project');
      const fastResume=await manager.searchRelevantAsync(conversational,8,undefined,[resume.id]);
      assert.ok(fastProjects.some(r=>r.fileId===project.id));
      assert.ok(fastResume.every(r=>r.fileId===resume.id) && fastResume.length>0);
      assert.equal(semanticCalls,0,'bounded authorized portfolio overview must not call semantic embeddings');
    } finally { manager.searchSemantic=originalSemantic; }
    assert.deepEqual(manager.searchRelevant(conversational,8,undefined,[]),[]);
    assert.deepEqual(manager.searchRelevant(conversational,8,'general'),[],
      'function-word overlap must not retrieve unrelated general files');
    assert.deepEqual(manager.searchRelevant('the and you',8,'general'),[],
      'a query containing only common words must produce no lexical evidence');
    assert.equal(manager.search(conversational).some(r=>r.fileName==='Unrelated_General.md'),false,
      'unscoped FTS and SQL fallback must agree on rejecting low-information overlap');
    const explicitlyRequestedGeneral=manager.searchRelevant('secret canary',8,'general');
    assert.ok(explicitlyRequestedGeneral.some(r=>r.fileName==='Unrelated_General.md'),
      'explicit meaningful matches must still retrieve an authorized general note');
    assert.equal(manager.searchRelevant('What is DBMS?',8,'project').some(r=>r.score>0),false);
  } finally {
    db.close();
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
