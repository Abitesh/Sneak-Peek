import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function callback(file,name){
 const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let result;
 function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)===name)result=n.initializer.getText(ast);ts.forEachChild(n,visit);}visit(ast);
 assert.ok(result);return result;
}
for(const name of ['MeetingChatOverlay','GlobalChatOverlay']){
 test(`${name}: rejected IPC with no events has a visible error and releases ownership`,async()=>{
  const source=callback(`src/components/${name}.tsx`,'submitQuestion');let messages=[],error='',state='idle';let counter=0;
  const ref={current:null}, listeners=new Set();
  const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
  const c=vm.createContext({Symbol,console,useCallback:fn=>fn,chatState:'idle',meetingContext:{id:'m'},submitInFlightRef:ref,genMessageId:()=>String(++counter),setMessages:fn=>{messages=fn(messages);},setErrorMessage:m=>{error=m;},setChatState:v=>{state=typeof v==='function'?v(state):v;},messagesEndRef:{current:null},setTimeout:()=>0,streamBuffer:{reset(){},getBufferedContent(){return '';},appendToken(){}},window:{electronAPI:{onRAGStreamChunk:subscribe,onRAGStreamComplete:subscribe,onRAGStreamError:subscribe,ragQueryMeeting:async()=>({success:false,error:'Quota exhausted. Choose an authorized model.'}),ragQueryGlobal:async()=>({success:false,error:'Quota exhausted. Choose an authorized model.'})}},withTimeout:p=>p,RAG_QUERY_CLIENT_TIMEOUT_MS:20000});
  const fn=vm.runInContext(ts.transpileModule(`(${source})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,c);
  await fn('What did we ask?');
  assert.match(error,/Quota exhausted/);assert.equal(state,'error');assert.equal(ref.current,null);
  assert.equal(messages.filter(m=>m.role==='assistant').length,0);assert.equal(listeners.size,0);
 });
}

test('summary regeneration reports a failed provider response and preserves saved content',async()=>{
 const source=callback('src/components/MeetingDetails.tsx','handleRegenerate');let error='',busy=false,reloads=0;
 const c=vm.createContext({isRegenerating:false,meeting:{id:'m'},setIsRegenerating:v=>{busy=v;},setSummaryError:v=>{error=v;},reloadMeeting:async()=>{reloads++;},window:{electronAPI:{regenerateMeetingSummary:async()=>({success:false})}}});
 const fn=vm.runInContext(ts.transpileModule(`(${source})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,c);
 await fn();assert.match(error,/Summary could not be generated/);assert.equal(busy,false);assert.equal(reloads,0);
});

for(const name of ['MeetingChatOverlay','GlobalChatOverlay'])test(`${name}: invoke answer paints without stream events and rejects late chunks after settlement`,async()=>{
 const source=callback(`src/components/${name}.tsx`,'submitQuestion');let messages=[],state='idle',counter=0;const ref={current:null},saved=[],listeners=new Set();
 const subscribe=fn=>{saved.push(fn);listeners.add(fn);return()=>listeners.delete(fn);};
 const c=vm.createContext({Symbol,console,useCallback:fn=>fn,chatState:'idle',meetingContext:{id:'m'},submitInFlightRef:ref,genMessageId:()=>String(++counter),setMessages:fn=>{messages=fn(messages);},setErrorMessage(){},setChatState:v=>{state=typeof v==='function'?v(state):v;},messagesEndRef:{current:null},setTimeout:()=>0,streamBuffer:{reset(){},getBufferedContent(){return '';},appendToken(_token,flush){flush('FORBIDDEN_LATE');}},window:{electronAPI:{onRAGStreamChunk:subscribe,onRAGStreamComplete:subscribe,onRAGStreamError:subscribe,ragQueryMeeting:async()=>({success:true,answer:'The meeting discussed violet leases.'}),ragQueryGlobal:async()=>({success:true,answer:'The meeting discussed violet leases.'})}},withTimeout:p=>p,RAG_QUERY_CLIENT_TIMEOUT_MS:20000});
 const fn=vm.runInContext(ts.transpileModule(`(${source})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,c);await fn('What did the meeting discuss?');
 assert.equal(messages.find(m=>m.role==='assistant').content,'The meeting discussed violet leases.');assert.equal(state,'idle');assert.equal(ref.current,null);assert.equal(listeners.size,0);
 saved[0]({global:name==='GlobalChatOverlay',meetingId:'m',chunk:'FORBIDDEN_LATE'});assert.equal(messages.find(m=>m.role==='assistant').content,'The meeting discussed violet leases.');
});
