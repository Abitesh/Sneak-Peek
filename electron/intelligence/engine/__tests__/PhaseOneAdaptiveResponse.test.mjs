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
