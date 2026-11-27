import test from 'node:test';
import assert from 'node:assert/strict';
import { SneakPeekIntelligenceEngine } from '../../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import { planResponse } from '../../../../dist-electron/electron/intelligence/engine/ResponsePlanner.js';
const request = (q,length='medium') => ({requestId:'adaptive',sessionId:'isolated',surface:'manual-chat',userMessage:q,manualQuestion:q,currentTurn:{id:'now',role:'user',content:q},recentConversation:[],activeContext:{sessionPreferences:{length,format:'script',tone:'simple',codeLanguages:{},favorites:{},instructions:''}},contextPermissions:{conversation:true,project:false,profile:false,files:false,memory:false,mode:false,transcript:false,screen:false,generalKnowledge:true}});
test('single definitions get smaller budgets than multi-step design without shortening compound questions',()=>{
 const simple=planResponse({question:'What is a semaphore?'});
 const design=planResponse({question:'Design a distributed dispatch service with failover and consistency guarantees.'});
 assert.equal(simple.detailLevel,'concise');assert.ok(simple.maxTokens<design.maxTokens);
 assert.equal(simple.thinkingBudget,0);assert.equal(design.thinkingBudget,1024);
 assert.notEqual(planResponse({question:'What is a semaphore and how does it differ from a mutex?'}).detailLevel,'concise');
 assert.notEqual(planResponse({question:'What is a semaphore? Give an example.'}).detailLevel,'concise');
});
test('balanced session preferences preserve adaptive planning and explicit duration overrides saved length',async()=>{
 const engine=new SneakPeekIntelligenceEngine();
 const simple=await engine.handle(request('What is a semaphore?'));
 const design=await engine.handle(request('Design a distributed dispatch service with failover and consistency guarantees.'));
 assert.equal(simple.responsePlan.detailLevel,'concise');assert.equal(design.responsePlan.detailLevel,'detailed');
 const duration=await engine.handle(request('Explain semaphores in 15 seconds.','long'));
 assert.equal(duration.responsePlan.requestedDurationSeconds,15);assert.equal(duration.responsePlan.maxTokens,160);
});
test('the generation port receives the resolved reasoning budget and mode prompts include presentation limits',async()=>{
 let observed;
 const engine=new SneakPeekIntelligenceEngine({generationPort:{stream:async function*(input){observed=input;yield 'A bounded answer.';}}});
 const req=request('Design a distributed dispatch service.');
 req.answerContext={languageInstruction:'Answer in the language of the current question.'};
 const run=engine.prepareAndStream(req);for await(const _ of run.stream){}
 await run.result;
 assert.equal(observed.responsePlan.thinkingBudget,1024);
 assert.match(observed.prompt.finalPrompt,/<max_tokens>1100<\/max_tokens>/);
});

test('a definition and capability question about system design keeps both parts without extra reasoning', () => {
  const plan = planResponse({ question: 'What is system design? Can you solve any system design problem I give you?' });
  assert.equal(plan.thinkingBudget, 0);
  assert.equal(plan.detailLevel, 'normal');
  assert.match(plan.question, /Can you solve/);
});

test('standalone definitions leave out old project history while referential follow-ups keep it', async () => {
  const engine = new SneakPeekIntelligenceEngine();
  const snapshot = 'User: Explain the earlier concept.\nAssistant: PRIOR_PRIVATE_CONTEXT';
  const context = { answerContext: { promptTier: 'tiny', referenceSourceIds: [], personalSourceIds: [] }, sessionSnapshot: snapshot };
  const definition = await engine.handle({ ...request('What is a mutex?'), ...context });
  assert.doesNotMatch(definition.prompt.finalPrompt, /PRIOR_PRIVATE_CONTEXT/);
  const followUp = await engine.handle({ ...request('Explain that again.'), ...context });
  assert.match(followUp.prompt.finalPrompt, /PRIOR_PRIVATE_CONTEXT/);
});

test('a missing named project excludes unrelated resume and conversation evidence', async () => {
  const engine = new SneakPeekIntelligenceEngine();
  const req = request('Tell me about my Nimbus Ledger project.');
  req.contextPermissions.profile = req.contextPermissions.files = req.contextPermissions.memory = true;
  req.activeContext = { ...req.activeContext, projectName: 'nimbus ledger', projectSourceIds: [], hasResume: true };
  req.answerContext = { promptTier: 'tiny', profileDocuments: [{ sourceType: 'RESUME', sourceId: 'resume', content: 'UNRELATED_RESUME' }], referenceSourceIds: [], personalSourceIds: ['file'] };
  req.sessionSnapshot = 'UNRELATED_HISTORY';
  const result = await engine.handle(req);
  assert.equal(result.contextPlan.missingNamedProject, true);
  assert.ok(!result.contextPlan.requiredSources.some(source => ['profile', 'my_files', 'personal_knowledge'].includes(source)));
  assert.deepEqual(result.contextPlan.sourceIds.project_knowledge, []);
  assert.doesNotMatch(result.prompt.finalPrompt, /UNRELATED_(?:RESUME|HISTORY)/);
  assert.match(result.prompt.finalPrompt, /evidence was not found/);
});

test('an internship question keeps profile access when the project-name heuristic finds no file', async () => {
  const engine = new SneakPeekIntelligenceEngine();
  const req = request('Explain my internship.');
  req.contextPermissions.profile = true;
  req.activeContext = { ...req.activeContext, projectName: 'internship', projectSourceIds: [], hasResume: true };
  req.answerContext = { promptTier: 'tiny', referenceSourceIds: [], personalSourceIds: [] };
  const result = await engine.handle(req);
  assert.ok(result.contextPlan.requiredSources.includes('profile'));
  assert.equal(result.contextPlan.missingNamedProject, undefined);
});
