// Opt-in full-product acceptance entry, launched only by the sandboxed runner.
// Normal application startup is unchanged. No credentials or physical capture.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { app, BrowserWindow, safeStorage, systemPreferences, desktopCapturer, dialog } = require('electron');
const root = path.resolve(__dirname, '../..');
const temp = process.env.SNEAK_PEEK_ACCEPTANCE_ROOT;
if (!temp || !fs.existsSync(path.join(temp, 'sandbox.sb'))) throw new Error('Use the sandboxed acceptance runner');
const keep = new Set(['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG', 'LC_ALL', '__CF_USER_TEXT_ENCODING', 'DISPLAY', 'XPC_FLAGS', 'XPC_SERVICE_NAME', 'SNEAK_PEEK_ACCEPTANCE_ROOT', 'CHG21_LOCAL_OLLAMA','PROJECT_ACCEPTANCE_PHASE']);
for (const key of Object.keys(process.env)) if (!keep.has(key)) delete process.env[key];
for (const key of ['appData','userData','sessionData','logs','crashDumps','documents','downloads','desktop','temp']) {
  const dir = path.join(temp, key); fs.mkdirSync(dir, { recursive: true }); app.setPath(key, dir);
}
app.getAppPath = () => root; // wrapper entry must retain the real app asset root.
process.chdir(temp); // dotenv and relative telemetry cannot read/write the owner repository.
process.env.NATIVELY_TEST_USERDATA = app.getPath('userData');
process.env.NODE_ENV = 'production';
process.env.NATIVELY_USAGE_OUTBOX_ENABLED = '0';
process.env.NATIVELY_DISABLE_ONBOARDING_ORCH = '1';
// Empty profile must not contact the OS keychain or prompt for media permissions.
safeStorage.isEncryptionAvailable = () => false;
safeStorage.encryptString = safeStorage.decryptString = () => { throw new Error('OS credential access disabled in acceptance'); };
systemPreferences.askForMediaAccess = async () => false;
systemPreferences.getMediaAccessStatus = () => 'denied';
desktopCapturer.getSources = async () => []; // do not capture the owner's display during startup probes.
app.setLoginItemSettings = () => {};
dialog.showErrorBox = (title, message) => console.error('ACCEPTANCE_ERROR', title, message);
app.commandLine.appendSwitch('disable-background-networking');
// Chromium cannot reinitialize Seatbelt under sandbox-exec. The enclosing OS
// sandbox still denies network and owner-file access for this process tree.
app.commandLine.appendSwitch('no-sandbox');
app.disableHardwareAcceleration();
const windows = [];
app.on('browser-window-created', (_event, win) => {
  windows.push(win);
  win.webContents.on('did-fail-load', (_e, code, message) => console.error('ACCEPTANCE_LOAD',code,message));
});
const { AppState } = require(path.join(root, 'dist-electron/electron/main.js'));
async function waitFor(check, ms = 25000) {
  const deadline = Date.now()+ms;
  while(Date.now()<deadline) { const value=await check(); if(value) return value; await new Promise(r=>setTimeout(r,100)); }
  throw new Error('Acceptance wait timed out');
}
app.whenReady().then(async () => {
  const win = await waitFor(() => windows.find(w=>!w.isDestroyed() && /window=launcher/.test(w.webContents.getURL())));
  await waitFor(async()=>!win.webContents.isLoading() && await win.webContents.executeJavaScript('document.body.innerText.trim().length > 40'));
  win.show();
  await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  fs.writeFileSync(path.join(temp,'startup.png'),(await win.webContents.capturePage()).toPNG());
  const text=await win.webContents.executeJavaScript('document.body.innerText');
  fs.writeFileSync(path.join(temp,'controls.json'), JSON.stringify(await win.webContents.executeJavaScript('Array.from(document.querySelectorAll("input,textarea,button")).map(e=>({tag:e.tagName,placeholder:e.getAttribute("placeholder"),text:e.innerText,label:e.getAttribute("aria-label"),title:e.getAttribute("title")}))'),null,2));
  const state=AppState.getInstance();
  const helper=state.processingHelper.getLLMHelper();

  const rag=await waitFor(()=>state.getRAGManager());
  // Explicit synthetic embedding transport; actual canonical revisions, vectors,
  // FTS, permission planning and renderer are exercised without loading weights.
  const identity={provider:'acceptance',model:'synthetic',dimensions:384,space:'acceptance:synthetic:384',version:'fixture-v1'};
  const vectors=texts=>texts.map(()=>Array.from({length:384},(_,i)=>i===0?1:0));
  rag.embeddingPipeline.getActiveCanonicalEmbeddingIdentity=()=>identity;
  rag.embeddingPipeline.getEmbeddingsWithFallback=async texts=>({embeddings:vectors(texts),...identity});
  rag.embeddingPipeline.embedDocumentChunks=async texts=>({vectors:vectors(texts).map(embedding=>({embedding,...identity})),embeddedCount:texts.length,complete:true});
  rag.embeddingPipeline.getEmbeddingForQuery=async()=>null;
  let parkFeedback=false, releaseFeedback;
  const calls=[];
  helper.getSneakPeekGenerationRouteOptions=()=>({capability:'stream_chat',preferredProvider:'groq',allowedProviders:['groq'],availability:{hasGroq:true},models:{groq:'offline-test'},maxAttempts:1});
  helper.streamFinalPrompt=async function*(provider,model,prompt,options){
    calls.push({provider,model,prompt,images:options?.imagePaths?.length??0});
    if(prompt.includes('Review my practice answer')){yield 'Your distinction between a process and a thread is correct.';if(parkFeedback){await new Promise(resolve=>{releaseFeedback=resolve;});yield ' LATE_CANCELLED_FEEDBACK';}return;}
    yield prompt.includes('indigo leases')?'Orchid uses indigo leases.':prompt.includes('violet leases')?'Orchid uses violet leases.':'No authorized project facts found.';
  };
  helper.prewarmPromptCache=async()=>{};
  const js=code=>win.webContents.executeJavaScript(code);
  const paint=()=>js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const click=async text=>{await js(`(()=>{const b=[...document.querySelectorAll('button,[role=button]')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw new Error('Button unavailable: '+${JSON.stringify(text)});b.click();})()`);await paint();};
  const type=async(selector,text)=>{await js(`document.querySelector(${JSON.stringify(selector)}).focus()`);await win.webContents.insertText(text);await paint();};
  const results=[];
  if(process.env.PROJECT_ACCEPTANCE_PHASE==='2'){
   const projects=await js('window.electronAPI.projectsList()'),sessions=await js('window.electronAPI.practiceList()');
   assert.equal(projects.value.length,1);assert.equal(projects.value[0].description,'Uses indigo leases.');
   assert.equal(sessions.value.length,1);assert.match(sessions.value[0].questions[0].answer,/address space/);
   assert.match(sessions.value[0].questions[0].feedback,/distinction/);assert.equal(calls.length,0);assert.equal(state.isMeetingActive,false);
   fs.writeFileSync(path.join(temp,'relaunch.json'),JSON.stringify({projectsPersisted:true,practiceAndFeedbackPersisted:true,generationCalls:0,capture:false}));
   console.log('PROJECT_PRACTICE_RELAUNCH_PASS',temp);app.exit(0);return;
  }

  await js(`document.querySelector('button[title="Profile Intelligence"]').click()`);
  await waitFor(()=>js('document.body.innerText.includes("Identity")'));
  await click('Projects');await waitFor(()=>js('!!document.querySelector("[aria-label=\\"Project knowledge manager\\"]")'));
  await click('Add project');
  await type('[aria-label="Project knowledge manager"] label:has(input) input','Orchid Dispatch');
  await type('[aria-label="Project knowledge manager"] textarea','Uses violet leases. Backend uses Java and spatial queries.');
  fs.writeFileSync(path.join(temp,'form.json'),JSON.stringify(await js('[...document.querySelectorAll("input,textarea,button")].map(e=>({value:e.value,text:e.innerText,disabled:e.disabled}))'),null,2));
  await click('Save project');
  await waitFor(()=>js('document.body.innerText.includes("Orchid Dispatch")&&!document.body.innerText.includes("Processing…")'),45000);
  const listed=await js('window.electronAPI.projectsList()');assert.equal(listed.success,true);assert.equal(listed.value.length,1);
  const project=listed.value[0];assert.equal(project.indexState,'Ready');assert.ok(project.sources.length);
  fs.writeFileSync(path.join(temp,'projects.png'),(await win.webContents.capturePage()).toPNG());
  results.push({scenario:'Projects UI save',status:'PASS',id:project.id,sourceId:project.sources[0].id});
  const question='Why did Orchid Dispatch use violet leases?';
  const answer=await js(`(async()=>{let answer='',error='';const off=[window.electronAPI.onGeminiStreamDone(d=>answer=d.finalText||''),window.electronAPI.onGeminiStreamError(e=>error=e)];try{await window.electronAPI.streamGeminiChat(${JSON.stringify(question)},undefined,undefined,{skipRollingContext:true,projectIds:[${JSON.stringify(project.id)}]});return{answer,error};}finally{off.forEach(f=>f());}})()`);
  assert.equal(answer.error,'');assert.match(answer.answer,/violet leases/);assert.match(calls.at(-1).prompt,/violet leases/);
  results.push({scenario:'Actual preload/canonical project grounding',status:'PASS'});
  const edited=await js(`window.electronAPI.projectsSave({...${JSON.stringify(project)},description:'Uses indigo leases.',contribution:'Uses indigo leases.'})`);assert.equal(edited.success,true);assert.equal(edited.value.id,project.id);
  const revised=await js(`(async()=>{let answer='',error='';const off=[window.electronAPI.onGeminiStreamDone(d=>answer=d.finalText||''),window.electronAPI.onGeminiStreamError(e=>error=e)];try{await window.electronAPI.streamGeminiChat('Explain Orchid Dispatch.',undefined,undefined,{skipRollingContext:true,projectIds:[${JSON.stringify(project.id)}]});return{answer,error};}finally{off.forEach(f=>f());}})()`);
  assert.equal(revised.error,'');assert.match(revised.answer,/indigo leases/);assert.doesNotMatch(calls.at(-1).prompt,/Uses violet leases/);
  results.push({scenario:'Edited stable project source replaces stale facts',status:'PASS'});
  await click('Practice & Review');await waitFor(()=>js('document.body.innerText.includes("Start text practice")'));
  const before=calls.length;await click('Start text practice');
  await waitFor(()=>js('!!document.querySelector("textarea[aria-label=\\"Practice answer\\"]")'));
  await type('textarea[aria-label="Practice answer"]','A process has its own address space. Threads share process memory.');await click('Save answer');
  await waitFor(()=>js('document.body.innerText.includes("1 saved answers")'));
  assert.equal(calls.length,before,'offline practice never invokes generation');
  const practice=await js('window.electronAPI.practiceList()');assert.equal(practice.value.length,1);assert.match(practice.value[0].questions[0].answer,/address space/);
  fs.writeFileSync(path.join(temp,'practice.png'),(await win.webContents.capturePage()).toPNG());
  results.push({scenario:'Actual Practice UI persists draft with zero generation calls',status:'PASS'});
  await click('Request AI feedback');
  await waitFor(()=>js('document.body.innerText.includes("Your distinction between a process and a thread is correct.")&&!document.body.innerText.includes("Stop feedback")'));
  assert.equal(calls.length,before+1);assert.doesNotMatch(calls.at(-1).prompt,/Uses indigo leases|Uses violet leases/);
  const withFeedback=await js('window.electronAPI.practiceList()');assert.match(withFeedback.value[0].questions[0].feedback,/distinction/);
  parkFeedback=true;await click('Request AI feedback');await waitFor(()=>js('document.body.innerText.includes("Stop feedback")'));
  await click('Stop feedback');await waitFor(()=>js('document.body.innerText.includes("Feedback cancelled. Your answer is saved.")'));
  releaseFeedback?.();await paint();assert.equal(await js('document.body.innerText.includes("LATE_CANCELLED_FEEDBACK")'),false);
  results.push({scenario:'Optional feedback uses canonical model route; STOP rejects late output and saves draft',status:'PASS'});
  // The fixture never starts a microphone or system audio capture.
  assert.equal(state.isMeetingActive,false);
  fs.writeFileSync(path.join(temp,'project-practice.json'),JSON.stringify({results,calls:calls.map(({prompt,...rest})=>({...rest,promptChars:prompt.length})),privacy:'disposable profile, fake provider, no capture, no credentials'},null,2));
  console.log('PROJECT_PRACTICE_PASS',temp);app.exit(0);
}).catch(async error=>{console.error(error);for(const w of windows.filter(w=>!w.isDestroyed())){try{if(/window=launcher/.test(w.webContents.getURL())){fs.writeFileSync(path.join(temp,'failure.png'),(await w.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(temp,'failure.txt'),await w.webContents.executeJavaScript('document.body.innerText'));}}catch{}}app.exit(1);});
