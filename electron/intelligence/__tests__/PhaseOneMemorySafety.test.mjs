import test from 'node:test';
import assert from 'node:assert/strict';
import { LongTermMemoryService } from '../../../dist-electron/electron/intelligence/memory/LongTermMemoryService.js';
import { HindsightClientAdapter } from '../../../dist-electron/electron/intelligence/memory/HindsightClientAdapter.js';
import { HindsightRetainQueue } from '../../../dist-electron/electron/intelligence/memory/HindsightRetainQueue.js';
import { ConversationMemoryService } from '../../../dist-electron/electron/intelligence/ConversationMemoryService.js';
import { appendConversationTurn, getRecentConversationTurns, getConversationWindow, clearConversationState } from '../../../dist-electron/electron/context-intelligence/question/conversation-state-store.js';
test('zero, negative and invalid history limits never return an entire session',()=>{
 clearConversationState();appendConversationTurn({sessionId:'zero',text:'private',role:'user',speaker:'user'});
 for(const n of [0,-1,NaN]) assert.deepEqual(getRecentConversationTurns('zero',n),[]);
 assert.deepEqual(getConversationWindow('zero',{limit:0}),[]);
 const memory=new ConversationMemoryService();memory.record({sessionId:'zero',userMessage:'Question',assistantAnswer:'Answer',timestamp:1});
 assert.deepEqual(memory.getRecentTurns('zero',0),[]);assert.equal(memory.getSessionSummary('zero',0),'');
 clearConversationState();
});
test('facade bounds an uncooperative provider and honors cancellation without calling it after abort',async()=>{
 let signal;let calls=0;
 const service=new LongTermMemoryService({name:'fixture',enabled:true,retain(){},recall(_q,_s,o){calls++;signal=o.signal;return new Promise(()=>{});}});
 const deadline=Date.now();assert.deepEqual(await service.recallRelevantMemory('question',{userId:'u'},{timeoutMs:20}),[]);
 assert.ok(Date.now()-deadline<1000);assert.ok(signal.aborted);
 const controller=new AbortController();controller.abort();
 assert.deepEqual(await service.recallRelevantMemory('question',{userId:'u'},{signal:controller.signal}),[]);assert.equal(calls,1);
 assert.deepEqual(await service.recallRelevantMemory('question',{userId:'u'},{maxResults:0}),[]);assert.equal(calls,1);
});
test('queued memory snapshots preserve ownership and flush waits for the active worker',async()=>{
 let release;const blocked=new Promise(resolve=>{release=resolve;});const seen=[];
 const queue=new HindsightRetainQueue(async item=>{await blocked;seen.push(item);});
 const scope={userId:'alice'};queue.enqueue({content:'Fact',scope,source:'chat_history',timestamp:123});scope.userId='bob';
 let flushed=false;const flush=queue.drain().then(()=>{flushed=true;});await Promise.resolve();assert.equal(flushed,false);
 release();await flush;assert.equal(seen[0].scope.userId,'alice');assert.equal(seen[0].timestamp,123);
});
test('provider provenance survives recall and caps are enforced independently of remote token budgets',async()=>{
 const client={retain:async()=>{},recall:async()=>({results:[{id:'fact-1',text:'Fact',document_id:'doc',chunk_id:'chunk',occurred_start:'2026-11-01',mentioned_at:'2026-11-02',entities:['Alice']},{id:'fact-2',text:'Other'}]})};
 const adapter=new HindsightClientAdapter({baseUrl:'http://fixture'},client);
 const service=new LongTermMemoryService(adapter);
 const result=await service.recallRelevantMemory('question',{userId:'u'},{maxResults:1});
 assert.equal(result.length,1);assert.equal(result[0].id,'fact-1');assert.equal(result[0].documentId,'doc');assert.equal(result[0].occurredAt,'2026-11-01');
 assert.deepEqual(await adapter.recall('question',{userId:'u'},{timeoutMs:100,maxResults:0}),[]);
});

const { meetingMemorySourcePolicy } = await import('../../../dist-electron/electron/intelligence/memory/MeetingMemoryAuthority.js');
test('current source revision and retention revoke stale, deleted and untraceable meeting memories',async()=>{
 let row={summary_json:'original',summary_status:'completed',start_time:100000000};let retention='forever';
 const policy=meetingMemorySourcePolicy(id=>id==='m1'?row:undefined,()=>retention,()=>1000000000);
 const writes=[];let recalled=[];
 const client={retain:async(_bank,text,options)=>writes.push({text,options}),recall:async()=>({results:recalled})};
 const adapter=new HindsightClientAdapter({baseUrl:'http://fixture'},client,policy);
 adapter.retain({content:'summary',scope:{userId:'u',meetingId:'m1'},source:'meeting_summary'});await adapter.flush();
 assert.equal(writes.length,1);assert.equal(writes[0].options.updateMode,'replace');
 recalled=[{id:'fact',text:'summary',document_id:writes[0].options.documentId,metadata:writes[0].options.metadata}];
 const recall=()=>adapter.recall('q',{userId:'u'},{timeoutMs:100});
 assert.equal((await recall()).length,1);
 row={...row,summary_json:'corrected'};assert.deepEqual(await recall(),[]);
 row=undefined;assert.deepEqual(await recall(),[]);
 row={summary_json:'original',summary_status:'completed',start_time:100000000};
 retention='never';assert.deepEqual(await recall(),[]);
 retention='7d';row.start_time=0;assert.deepEqual(await recall(),[]);
 retention='forever';recalled=[{id:'legacy',text:'No source pointer'}];assert.deepEqual(await recall(),[]);
});
