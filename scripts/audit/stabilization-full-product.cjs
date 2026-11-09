// Opt-in full-product acceptance entry, launched only by the sandboxed runner.
// Normal application startup is unchanged. No real credentials/provider/capture.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { app, BrowserWindow, safeStorage, systemPreferences, desktopCapturer, dialog } = require('electron');
const root = path.resolve(__dirname, '../..');
const temp = process.env.SNEAK_PEEK_ACCEPTANCE_ROOT;
if (!temp || !fs.existsSync(path.join(temp, 'sandbox.sb'))) throw new Error('Use the sandboxed acceptance runner');
const keep = new Set(['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG', 'LC_ALL', '__CF_USER_TEXT_ENCODING', 'DISPLAY', 'XPC_FLAGS', 'XPC_SERVICE_NAME', 'SNEAK_PEEK_ACCEPTANCE_ROOT']);
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
  const requests=[];
  helper.getSneakPeekGenerationRouteOptions=()=>({capability:'stream_chat', preferredProvider:'groq', allowedProviders:['groq'], availability:{hasGroq:true}, models:{groq:'synthetic-offline'},maxAttempts:1});
  helper.streamFinalPrompt=async function*(_provider,_model,prompt){
    requests.push({prompt,at:performance.now()});
    // Deliberately trivial transport: facts may only come from the real final prompt.
    const facts=['violet job leases','amber rate counters','Violet Database Certificate','orchid leases','TypeScript','SQLite','Violet Example'].filter(f=>prompt.includes(f));
    yield 'Offline acceptance: '; yield facts.length ? facts.join('; ') : 'general knowledge or missing evidence.';
  };
  const reads=[];
  const rag=await waitFor(()=>state.getRAGManager());
  const originalRead=rag.readPlannedCanonicalSource.bind(rag);
  rag.readPlannedCanonicalSource=async input=>{const start=performance.now();const result=await originalRead(input);reads.push({input,result,ms:performance.now()-start});return result;};
  fs.writeFileSync(path.join(temp,'startup.json'),JSON.stringify({loaded:true,url:win.webContents.getURL(),text,paths:Object.fromEntries(['appData','userData','sessionData','documents','logs'].map(k=>[k,app.getPath(k)])),windows:windows.length},null,2));
  console.log('ACCEPTANCE_READY',temp);
  // Save a real renderer/preload/main IPC result without introducing a test IPC.
  const result=await win.webContents.executeJavaScript('window.electronAPI.personalFilesList()');
  assert.equal(result.success,true); assert.deepEqual(result.files,[]);
  fs.writeFileSync(path.join(temp,'ipc.json'),JSON.stringify(result));
  const overlay = await waitFor(() => windows.find(w=>!w.isDestroyed() && /window=overlay(?:&|$)/.test(w.webContents.getURL())));
  overlay.show();
  await waitFor(async()=>await overlay.webContents.executeJavaScript('document.querySelectorAll("input,textarea,button").length > 0'));
  await overlay.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  fs.writeFileSync(path.join(temp,'overlay.png'), (await overlay.webContents.capturePage()).toPNG());
  fs.writeFileSync(path.join(temp,'overlay-controls.json'), JSON.stringify(await overlay.webContents.executeJavaScript('Array.from(document.querySelectorAll("input,textarea,button")).map(e=>({tag:e.tagName,placeholder:e.getAttribute("placeholder"),text:e.innerText,label:e.getAttribute("aria-label"),title:e.getAttribute("title")}))'),null,2));
  const files=[];
  for(const [name,body] of [['Linkship.txt','Linkship is a project. Linkship uses Redis for violet job leases, ensuring safe session recovery.'],['Linkship Legacy.txt','Linkship Legacy is a project. Linkship Legacy uses Redis for amber rate counters.']]) {
    const filePath=path.join(temp,name);fs.writeFileSync(filePath,body);
    dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filePath]});
    const item=await win.webContents.executeJavaScript('window.electronAPI.personalFilesPickAndIngest()');
    assert.equal(item.success,true,JSON.stringify(item));
    assert.equal((await win.webContents.executeJavaScript(`window.electronAPI.personalFilesSetFileType(${JSON.stringify(item.file.id)},'project')`)).success,true);
    files.push(item.file);
  }
  const scenarios=[];
  async function ask(question,expected,excluded){
    const before=reads.length, pbefore=requests.length, start=performance.now();
    await overlay.webContents.executeJavaScript(`window.__acceptanceEvents=[];window.__acceptanceOff=[window.electronAPI.onGeminiStreamToken((t,m)=>window.__acceptanceEvents.push({type:'token',t,m,at:performance.now()})),window.electronAPI.onGeminiStreamDone(d=>window.__acceptanceEvents.push({type:'done',d,at:performance.now()})),window.electronAPI.onGeminiStreamError(e=>window.__acceptanceEvents.push({type:'error',e}))];document.querySelector('[data-testid="overlay-chat-input"]').focus()`);
    await overlay.webContents.insertText(question);
    overlay.webContents.sendInputEvent({type:'keyDown',keyCode:'Return'});overlay.webContents.sendInputEvent({type:'keyUp',keyCode:'Return'});
    await waitFor(()=>overlay.webContents.executeJavaScript(`window.__acceptanceEvents.some(e=>e.type==='done'||e.type==='error')`));
    await overlay.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const data=await overlay.webContents.executeJavaScript(`(()=>{window.__acceptanceOff.forEach(f=>f());return {events:window.__acceptanceEvents,text:document.body.innerText}})()`);
    const final=data.events.find(e=>e.type==='done')?.d;
    const answer=final?.finalText??final?.text??data.events.filter(e=>e.type==='token').map(e=>e.t).join('');
    await waitFor(()=>overlay.webContents.executeJavaScript(`document.body.innerText.includes(${JSON.stringify(answer)})`));
    const row={question,answer,visible:true,events:data.events,reads:reads.slice(before),prompts:requests.slice(pbefore),completeVisibleMs:performance.now()-start};scenarios.push(row);
    fs.writeFileSync(path.join(temp,'scenarios.json'),JSON.stringify({files,scenarios},null,2));
    assert.equal(data.events.filter(e=>e.type==='error').length,0,JSON.stringify(data.events));
    assert.equal(data.events.filter(e=>e.type==='done').length,1);
    assert.ok(row.visible,'answer must appear in actual renderer');
    if(expected) assert.match(answer,expected);
    if(excluded) assert.doesNotMatch(row.prompts.map(p=>p.prompt).join('\n'),excluded);
  }
  await ask('Why did you use Redis in Linkship?',/violet job leases/,/amber rate counters/);
  await ask('Tell me about Linkship.',/violet job leases/,/amber rate counters/);
  await ask('Why is Redis used in your project?',/violet job leases/,/amber rate counters/);
  await ask('Why did Linkship Legacy use Redis?',/amber rate counters/,/violet job leases/);
  const cleared=await overlay.webContents.executeJavaScript('window.electronAPI.clearChatContext()');
  assert.equal(cleared.success,true,JSON.stringify(cleared));
  await ask('Why is Redis used in your project?',null,/violet job leases|amber rate counters/);
  for(const q of ['What is DBMS?','What is Redis?','Explain the singleton design pattern.','Give me its code.','Write binary search in Python.']){
    await ask(q,null,/violet job leases|amber rate counters/);assert.equal(scenarios.at(-1).reads.length,0);
  }
  const profile=state.getKnowledgeOrchestrator();
  assert.ok(profile,'real profile service initialized');
  const resume={identity:{name:'Violet Example'},skills:{languages:['TypeScript'],databases:['SQLite']},experience:[{role:'Intern',company:'Violet Lab',bullets:['Implemented orchid leases']}],projects:[{name:'Orchid',description:'Synthetic orchid leases project'}],certifications:[{name:'Violet Database Certificate'}],education:[],achievements:[],leadership:[]};
  profile.setGenerateContentFn(async()=>JSON.stringify(resume));
  const resumePath=path.join(temp,'Synthetic Resume.txt');fs.writeFileSync(resumePath,JSON.stringify(resume));
  // Use the real selection IPC; upload-resume deliberately rejects a path
  // that was not selected and registered by profile:select-file. Do not
  // weaken that production authorization boundary to make a test pass.
  dialog.showOpenDialog=async()=>({canceled:false,filePaths:[resumePath]});
  const selected=await win.webContents.executeJavaScript('window.electronAPI.profileSelectFile()');
  assert.equal(selected.success,true,JSON.stringify(selected));
  assert.equal(selected.filePath,resumePath);
  const ingested=await win.webContents.executeJavaScript(`window.electronAPI.profileUploadResume(${JSON.stringify(selected.filePath)})`);
  assert.equal(ingested.success,true,JSON.stringify(ingested));
  assert.equal((await win.webContents.executeJavaScript('window.electronAPI.profileSetMode(true)')).success,true);
  const clearedBeforeProfile=await overlay.webContents.executeJavaScript('window.electronAPI.clearChatContext()');
  assert.equal(clearedBeforeProfile.success,true,JSON.stringify(clearedBeforeProfile));
  for(const [q,expected] of [['Tell me about yourself.',/Violet Example/],['What skills do I have?',/TypeScript/],['Explain my internship.',/orchid leases/],['What projects have I built?',/orchid leases/],['What certifications do I have?',/Violet Database Certificate/]])await ask(q,expected,/amber rate counters|violet job leases/);
  fs.writeFileSync(path.join(temp,'answer.png'),(await overlay.webContents.capturePage()).toPNG());
  console.log('ACCEPTANCE_PASS',JSON.stringify({scenarios:scenarios.length,temp}));
  app.quit();
}).catch(e=>{fs.writeFileSync(path.join(temp,'failure.txt'),e.stack);console.error('ACCEPTANCE_FAILED',e.stack);app.exit(1);});
setTimeout(()=>{console.error('ACCEPTANCE_TIMEOUT');app.exit(1);},120000).unref();
