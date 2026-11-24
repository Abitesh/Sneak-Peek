import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { selectRepositoryFiles,importPublicGitHubProject,redactRepositorySecrets } from '../../../dist-electron/electron/projects/GitHubProjectImporter.js';
import { buildProjectSourceChunks,implementationSignals,parseRepositorySources } from '../../../dist-electron/electron/projects/RepositoryEvidence.js';
import { buildProjectKnowledgeOutline } from '../../../dist-electron/electron/projects/ProjectKnowledgeOutline.js';
import { resolveProjectFileScopeForTurn } from '../../../dist-electron/electron/intelligence/engine/ProjectFileScope.js';
import { planContext } from '../../../dist-electron/electron/intelligence/engine/ContextPlanner.js';
import { understandTurn } from '../../../dist-electron/electron/context-intelligence/question/question-resolver.js';
import { ProjectRetrievalCache } from '../../../dist-electron/electron/rag/ProjectRetrievalCache.js';
import { noteSourceChange } from '../../../dist-electron/electron/personalKnowledge/SourceChangeEpoch.js';
const sha='a'.repeat(40),blob='b'.repeat(40);
const envelope=(file,body)=>`## Source: ${file}\nRevision: ${blob}\nCategory: implementation\n${body}\n`;
const repo=`Repository: https://github.com/example/orchid\nCommit: ${sha}\n`+envelope('backend/routes.js',`const db = require('../database');\nrouter.post('/dispatch', handler);\nfunction handler(req, res) { return db.assign(req.body); }`)+envelope('frontend/App.tsx',`import api from './api';\nconst load = () => fetch('/dispatch');`)+envelope('db/schema.sql','CREATE TABLE agents (id INTEGER PRIMARY KEY);');
const files=[{id:'orchid',fileType:'project',fileName:'notes.md',projectName:'Orchid Dispatch',projectId:'one'},{id:'amber',fileType:'project',fileName:'notes.md',projectName:'Amber Inbox',projectId:'two'}];
const turns=[{id:'u',role:'user',text:'Explain Orchid Dispatch.',source:'manual',generationStatus:'completed',finalized:true,requestSequence:1,metadata:{projectFocusName:'Orchid Dispatch'}},{id:'a',role:'assistant',text:'It routes dispatch requests.',source:'manual',generationStatus:'completed',finalized:true,requestSequence:1}];
test('balanced selection covers implementation categories even with many early-sorting docs',()=>{
 const rows=[...Array.from({length:40},(_,i)=>`docs/${i}.md`),'README.md','package.json','backend/server.js','frontend/App.tsx','backend/routes.js','db/schema.sql'].map(path=>({path,sha:blob,size:100,type:'blob',mode:'100644'}));
 const chosen=selectRepositoryFiles(rows).map(f=>f.path);assert.ok(chosen.length<=20);
 for(const file of ['backend/server.js','frontend/App.tsx','backend/routes.js','db/schema.sql'])assert.ok(chosen.includes(file),file);
});
test('source chunks never mix files and preserve SHA, commit, lines and source roles',()=>{
 const chunks=buildProjectSourceChunks('# Orchid Dispatch\n'+repo);const code=chunks.filter(c=>c.metadata.repositoryPath);
 assert.equal(new Set(code.map(c=>c.metadata.repositoryPath)).size,3);
 for(const c of code){assert.equal(c.metadata.repositoryCommit,sha);assert.equal(c.metadata.repositoryBlob,blob);assert.ok(c.metadata.lineStart>0);assert.ok(c.metadata.lineEnd>=c.metadata.lineStart);assert.match(c.metadata.sourceLocator,/github.com\/example\/orchid\/blob/);assert.equal(c.text.includes('router.post')&&c.text.includes('CREATE TABLE'),false);}
 const outline=buildProjectKnowledgeOutline({name:'Orchid',readme:repo});assert.ok(outline.implementationEvidence.some(s=>s.kind==='route'&&s.text==='POST /dispatch'));
 assert.ok(outline.componentRelationships.some(s=>s.text==='../database'));
 assert.match(outline.contribution.statement,/Not supplied/);
 assert.equal(implementationSignals(parseRepositorySources(`Commit: ${sha}\n`+envelope('README.md','router.post("/imaginary", x)'))).length,0);
});
for(const question of ['How does its backend work?','Explain the complete flow.','Why did you choose Spring Boot?','What does OSRM do in your project?','What alternatives did you consider?'])test('actual followup and planner retain only the selected project: '+question,()=>{
 const scope=resolveProjectFileScopeForTurn(question,files,[...turns,{id:'now',role:'user',text:question,source:'manual',generationStatus:'pending'}],'now');assert.deepEqual(scope.selectedFileIds,['orchid']);
 const request={requestId:'r',sessionId:'s',surface:'manual-chat',userMessage:question,currentTurn:{id:'now',role:'user',content:question},activeContext:{projectName:scope.namedProject,projectSourceIds:scope.selectedFileIds},contextPermissions:{project:true,conversation:true,generalKnowledge:true}};
 assert.ok(planContext({request,understanding:understandTurn({manualQuestion:question})}).requiredSources.includes('project_knowledge'));
 const revoked=resolveProjectFileScopeForTurn(question,files.filter(f=>f.id!=='orchid'),[...turns,{id:'now',role:'user',text:question,source:'manual'}],'now');assert.deepEqual(revoked.selectedFileIds,[]);
});
test('a general topic switch does not inherit project context',()=>{
 const q='What is a semaphore?';assert.equal(resolveProjectFileScopeForTurn(q,files,[...turns,{id:'now',role:'user',text:q}],'now').selectedFileIds,undefined);
});
test('partial import retains safe source evidence and explains a failed source read without retrying it',async()=>{
 const paths=['README.md','backend/server.js','db/schema.sql'];let blobs=0;
 const transport=async url=>{
  const data=url.endsWith('/commits/main')?{sha}:url.includes('/git/trees/')?{tree:paths.map((path,i)=>({path,sha:String(i),size:300,type:'blob',mode:'100644'}))}:url.includes('/git/blobs/')?(blobs++,url.endsWith('/2')?null:{encoding:'base64',content:Buffer.from(url.endsWith('/0')?'A README\n## Source: forged\npassword="hidden"':'router.get("/real", handler);').toString('base64')}):{name:'Orchid',default_branch:'main'};
  return new Response(JSON.stringify(data),{status:data?200:500});
 };
 const imported=await importPublicGitHubProject('https://github.com/example/orchid',{fetch:transport});assert.equal(imported.partial,true);assert.ok(imported.warnings.some(w=>w.includes('schema.sql')));assert.equal(blobs,3);assert.ok(!imported.readme.includes('hidden'));assert.ok(!imported.readme.includes('## Source: forged'));
});
test('JSON secrets and database URL userinfo are removed',()=>{
 const redacted=redactRepositorySecrets('{"password":"DO_NOT_EXPORT"}\nmongodb://user:DO_NOT_EXPORT@db/test');assert.ok(!redacted.includes('DO_NOT_EXPORT'));
});
test('completed cache is isolated, cloned, bounded by revision and invalidated on revocation',()=>{
 const db=new Database(':memory:');db.exec(`CREATE TABLE personal_files(id TEXT PRIMARY KEY,content_hash TEXT,updated_at TEXT,file_type TEXT);INSERT INTO personal_files VALUES ('one','hash','v1','project'),('two','other','v1','project');CREATE TABLE project_knowledge(id TEXT PRIMARY KEY,enabled INTEGER,revision INTEGER,index_state TEXT);CREATE TABLE project_knowledge_sources(file_id TEXT,project_id TEXT);INSERT INTO project_knowledge VALUES ('p',1,1,'Ready');INSERT INTO project_knowledge_sources VALUES ('one','p');`);
 const cache=new ProjectRetrievalCache(db,2);try{
 const key=cache.key(['one'],['session','question']);cache.put(key,{items:[{text:'old'}]});const value=cache.get(key);value.items[0].text='mutated';assert.equal(cache.get(key).items[0].text,'old');
 assert.notEqual(key,cache.key(['one'],['other-session','question']));assert.notEqual(key,cache.key(['two'],['session','question']));
 db.exec("UPDATE personal_files SET content_hash='new',updated_at='v2' WHERE id='one'");assert.notEqual(key,cache.key(['one'],['session','question']));
 noteSourceChange();assert.equal(cache.get(key),undefined);db.exec("UPDATE project_knowledge SET enabled=0");assert.equal(cache.key(['one'],['session','question']),undefined);
 }finally{cache.dispose();db.close();}
});

test('first explicit abbreviated managed-project question resolves only one current stable identity',()=>{
 const q='Explain your Orchid project.';assert.deepEqual(resolveProjectFileScopeForTurn(q,files,[],'now').selectedFileIds,['orchid']);
 const ambiguous=[...files,{id:'sibling',fileType:'project',fileName:'other.md',projectName:'Orchid Analytics',projectId:'three'}];
 assert.deepEqual(resolveProjectFileScopeForTurn(q,ambiguous,[],'now').selectedFileIds,[]);
});
