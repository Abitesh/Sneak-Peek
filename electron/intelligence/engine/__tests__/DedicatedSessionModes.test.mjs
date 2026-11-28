import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeSessionPreferences,DEFAULT_SESSION_PREFERENCES,sessionAnswerGuidance} from '../../../../dist-electron/electron/session/SessionPreferences.js';
import {SessionPreferencesStore} from '../../../../dist-electron/electron/session/SessionPreferencesStore.js';
import {MODE_IDS,resolveModePolicy} from '../../../../dist-electron/electron/context-intelligence/policies/mode-policy-registry.js';
import {BUILTIN_MODE_LABELS,planBuiltinAdoption} from '../../../../dist-electron/electron/services/builtinModes.js';
import {SneakPeekIntelligenceEngine} from '../../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import {RetrievalCoordinator,createRetrievalCapability} from '../../../../dist-electron/electron/intelligence/engine/RetrievalCoordinator.js';
import {freezeAnswerRequest} from '../../../../dist-electron/electron/intelligence/engine/AnswerRequest.js';
import Database from 'better-sqlite3';
import {projectEvidenceQuery} from '../../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js';
const base=(mode,q='Explain my private project.')=>({requestId:'r',sessionId:`isolated-${mode}`,surface:'manual-chat',userMessage:q,currentTurn:{id:'r',role:'user',content:q,createdAt:Date.now()},recentConversation:[],activeContext:{modeTemplateType:mode,modeId:'m',projectName:'Orchid',projectSourceIds:['private'],hasResume:true,hasReferenceFiles:true},contextPermissions:{conversation:true,transcript:true,screen:false,mode:true,project:true,profile:true,files:true,memory:true,generalKnowledge:true}});
test('new modes register once and preserve old modes without destructive reclassification',()=>{
 for(const key of ['coding-dsa','cs-fundamentals','resume-projects']){assert.ok(MODE_IDS.includes(key));assert.ok(BUILTIN_MODE_LABELS[key]);assert.equal(resolveModePolicy(key).id,key);}
 const rows=Object.entries(BUILTIN_MODE_LABELS).map(([templateType,name],i)=>({id:`id${i}`,name,templateType,createdAt:String(i),isBuiltin:true}));assert.deepEqual(planBuiltinAdoption(rows).seed,[]);
 assert.equal(BUILTIN_MODE_LABELS.general,'General');assert.equal(BUILTIN_MODE_LABELS['technical-interview'],'Technical Interview');
});
for(const mode of ['coding-dsa','cs-fundamentals'])test(`${mode} never dispatches private retrieval even for explicit project asks`,async()=>{
 let calls=0;const sources=['project_knowledge','my_files','personal_knowledge','profile','mode_documents','structured_knowledge'];
 const engine=new SneakPeekIntelligenceEngine({retrievalCoordinator:new RetrievalCoordinator({capabilities:sources.map(s=>createRetrievalCapability(s,async()=>{calls++;return {items:[{id:'private',source:s,content:'PRIVATE_CANARY'}]};}))})});
 const result=await engine.handle(base(mode));assert.equal(calls,0);assert.doesNotMatch(result.prompt.finalPrompt,/PRIVATE_CANARY/);
 for(const source of sources)assert.ok(result.contextPlan.forbiddenSources.includes(source),source);
 assert.equal(result.contextPlan.generalKnowledgeAllowed,true);
});
test('preferences persist independently of credentials and obey three-per-provider bounds',()=>{
 const db=new Database(':memory:');try{const store=new SessionPreferencesStore(db),p=normalizeSessionPreferences({...DEFAULT_SESSION_PREFERENCES,favorites:{gemini:['g1','g2','g3'],ollama:['ollama-local']},length:'long'});store.save(p);assert.deepEqual(new SessionPreferencesStore(db).get(),p);assert.throws(()=>store.save({...p,favorites:{gemini:['1','2','3','4']}}),/three/);assert.equal(store.get().length,'long');assert.throws(()=>store.save({...p,codeLanguages:{...p.codeLanguages,dsa:'shell'}}),/language/);assert.throws(()=>store.save({...p,instructions:'x'.repeat(6001)}),/6000/);}finally{db.close();}
});
test('domain code choices apply only to implementation requests and respect explicit request priority',()=>{
 const p=normalizeSessionPreferences({});
 assert.match(sessionAnswerGuidance(p,'Write a two sum solution.'),/Selected dsa coding language: C\+\+/);
 assert.match(sessionAnswerGuidance(p,'Implement singleton pattern.'),/Selected oop coding language: Java/);
 assert.match(sessionAnswerGuidance(p,'Implement logistic regression.'),/Selected ml coding language: Python/);
 assert.match(sessionAnswerGuidance(p,'Write a SQL query.'),/Selected database coding language: SQL/);
 assert.doesNotMatch(sessionAnswerGuidance(p,'What is logistic regression?'),/Selected .* coding language/);
 assert.doesNotMatch(sessionAnswerGuidance(p,'What is a database query?'),/Selected .* coding language/);
 assert.match(sessionAnswerGuidance(p,'Write it in Rust.'),/unless the question explicitly requests another language/);
 assert.match(sessionAnswerGuidance(p,'Explain singleton pattern.'),/Selected oop coding language: Java/);
 assert.doesNotMatch(sessionAnswerGuidance(p,'How did you implement your project?'),/Selected .* coding language/);
});
test('frozen request keeps preferences pinned while new settings are saved',()=>{
 const p=normalizeSessionPreferences({length:'short'}),r=freezeAnswerRequest({...base('coding-dsa','Write binary search.'),activeContext:{modeTemplateType:'coding-dsa',sessionPreferences:p}});p.length='long';p.codeLanguages.dsa='Java';assert.equal(r.activeContext.sessionPreferences.length,'short');assert.equal(r.activeContext.sessionPreferences.codeLanguages.dsa,'C++');
});
test('project structural follow-ups search indexed sections without rewriting specific facts',()=>{
 assert.equal(projectEvidenceQuery('How does its backend work?','RealWorld API'),'RealWorld API backend');
 assert.equal(projectEvidenceQuery('Explain the complete flow.','RealWorld API'),'RealWorld API implementation');
 assert.equal(projectEvidenceQuery('What does OSRM do?','Dispatch'),'What does OSRM do?');
 assert.equal(projectEvidenceQuery('How does its backend work?'), 'How does its backend work?');
});
test('project prompt retains citation locators and separates choice rationale from verified decisions',async()=>{
 const metadata={sourceId:'private',repositoryPath:'src/server.ts',repositoryCommit:'a'.repeat(40),lineStart:1,lineEnd:8,retrievalSource:'INTERNAL_DIAGNOSTIC_CANARY'};
 const engine=new SneakPeekIntelligenceEngine({retrievalCoordinator:new RetrievalCoordinator({capabilities:[createRetrievalCapability('project_knowledge',async()=>({items:[{id:'source',source:'project_knowledge',content:'Orchid declares Express as a dependency.',metadata}]}))]})});
 const result=await engine.handle(base('resume-projects','Why did you choose Express in the Orchid project?'));
 assert.match(result.prompt.finalPrompt,/src\/server.ts/);assert.match(result.prompt.finalPrompt,/a{40}/);assert.match(result.prompt.finalPrompt,/<project_decision_policy>.*verified role.*Omit claims about past selection/);
 assert.doesNotMatch(result.prompt.finalPrompt,/INTERNAL_DIAGNOSTIC_CANARY|<reason>|<relevance>/);
 assert.equal(metadata.retrievalSource,'INTERNAL_DIAGNOSTIC_CANARY');
});

test('dedicated mode history keeps same-mode continuity and rejects mixed private history',async()=>{
 const request={...base('cs-fundamentals','What about its complexity?'),recentConversation:[{id:'old',role:'assistant',content:'PRIVATE_PROJECT_CANARY'},{id:'cs',role:'assistant',content:'Binary search halves a sorted search space.',metadata:{modeTemplateType:'cs-fundamentals'}}],sessionSnapshot:'PRIVATE_SNAPSHOT_CANARY'};
 const result=await new SneakPeekIntelligenceEngine().handle(request);
 assert.doesNotMatch(result.prompt.finalPrompt,/PRIVATE_PROJECT_CANARY|PRIVATE_SNAPSHOT_CANARY/);
 assert.match(result.prompt.finalPrompt,/Binary search/);
});

test('Resume & Projects reads the exact saved project without requiring an unrelated resume',async()=>{
 const {defaultSourceContractForNewMode}=await import('../../../../dist-electron/electron/services/modeSourceContract.js');
 let reads=0;const engine=new SneakPeekIntelligenceEngine({retrievalCoordinator:new RetrievalCoordinator({capabilities:[createRetrievalCapability('project_knowledge',async()=>{reads++;return {items:[{id:'private',source:'project_knowledge',content:'Orchid uses violet leases for dispatch.',metadata:{sourceId:'private'}}]};})]})});
 const request={...base('resume-projects','Explain the Orchid project.'),answerContext:{mode:{templateType:'resume-projects'},promptTier:'full',sourceVersions:{},referenceSourceIds:[],personalSourceIds:['private'],profileDocuments:[],providerRoute:null}};
 request.activeContext={...request.activeContext,hasResume:false,hasJobDescription:false,modeSourceContract:defaultSourceContractForNewMode('resume-projects')};
 const result=await engine.handle(request);assert.equal(reads,1);assert.match(result.prompt.finalPrompt,/violet leases/);assert.deepEqual(result.contextPlan.sourceIds.project_knowledge,['private']);
 reads=0;const denied=await engine.handle({...request,requestId:'resume-only',userMessage:'What does my resume say?',manualQuestion:'What does my resume say?',currentTurn:{id:'resume-only',role:'user',content:'What does my resume say?'}});assert.equal(reads,0);assert.doesNotMatch(denied.prompt.finalPrompt,/violet leases/);
});
