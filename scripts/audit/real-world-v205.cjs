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
const keep = new Set(['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG', 'LC_ALL', '__CF_USER_TEXT_ENCODING', 'DISPLAY', 'XPC_FLAGS', 'XPC_SERVICE_NAME', 'SNEAK_PEEK_ACCEPTANCE_ROOT', 'CHG21_LOCAL_OLLAMA', 'SNEAK_PEEK_QUALITY']);
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

  helper.ollamaUrl = 'http://127.0.0.1:11436';
  helper.setModel('ollama-llama3.2:3b');
  const calls = [], reads = [], providerCalls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (url !== 'http://127.0.0.1:11436/api/chat') return realFetch(url, options);
    const request = JSON.parse(options.body);
    const call = { at: performance.now(), model: request.model, contextWindow: request.options?.num_ctx };
    providerCalls.push(call);
    const response = await realFetch(url, options);
    call.headersAt = performance.now();
    // Observe Ollama's native timing without changing the production stream.
    call.finished = response.clone().text().then(body => {
      const rows = body.trim().split('\n');
      const done = JSON.parse(rows.at(-1));
      for (const field of ['total_duration', 'load_duration', 'prompt_eval_count',
        'prompt_eval_duration', 'eval_count', 'eval_duration', 'done_reason']) call[field] = done[field];
    }).catch(error => { call.telemetryError = error.message; });
    return response;
  };
  const transport = helper.streamFinalPrompt.bind(helper);
  helper.streamFinalPrompt = async function* (provider,model,prompt,options) {
    const row={provider,model,promptChars:prompt.length,prompt,at:performance.now()}; calls.push(row);
    for await (const token of transport(provider,model,prompt,options)) {
      row.firstTokenAt ??= performance.now(); yield token;
    }
    row.endAt=performance.now();
  };
  const rag = await waitFor(()=>state.getRAGManager());
  const read=rag.readPlannedCanonicalSource.bind(rag);
  rag.readPlannedCanonicalSource=async input=>{const t=performance.now();const result=await read(input);reads.push({source:input.sourceType,ms:performance.now()-t,count:result.results.length});return result;};
  const docs=[['Linkship Architecture.txt','Linkship is a URL shortening project built with Django REST Framework, PostgreSQL and Redis. Celery and Redis process click analytics asynchronously. JWT authenticates APIs. Docker packages it; it was deployed on Railway. Core redirect, caching, authentication, analytics and user flows passed 11/11 automated tests.'],['Geospatial Dispatch Architecture.txt','Geospatial Dispatch is a real-time dispatch backend using Java 21 and Spring Boot. PostgreSQL with PostGIS handles spatial queries, proximity search and nearest available agent assignment. WebSockets, STOMP and SockJS publish live location updates. OSRM performs road-network routing and distance estimation. The document does not state why Spring Boot was chosen over alternative frameworks.']];
  for(const [name,body] of docs){
    const f=path.join(temp,name);fs.writeFileSync(f,body);
    dialog.showOpenDialog=async()=>({canceled:false,filePaths:[f]});
    const res=await win.webContents.executeJavaScript('window.electronAPI.personalFilesPickAndIngest()');assert.equal(res.success,true);
    assert.equal((await win.webContents.executeJavaScript(`window.electronAPI.personalFilesSetFileType(${JSON.stringify(res.file.id)},'project')`)).success,true);
  }
  const resume={identity:{name:'Synthetic Candidate'},projects:[{name:'Linkship',description:docs[0][1]},{name:'Geospatial Dispatch',description:docs[1][1]}],skills:{languages:['Java','Python'],databases:['PostgreSQL']},experience:[],education:[],achievements:[]};
  state.getKnowledgeOrchestrator().setGenerateContentFn(async()=>JSON.stringify(resume));
  const rpath=path.join(temp,'Synthetic Resume.txt');fs.writeFileSync(rpath,JSON.stringify(resume));
  dialog.showOpenDialog=async()=>({canceled:false,filePaths:[rpath]});
  const selected=await win.webContents.executeJavaScript('window.electronAPI.profileSelectFile()');
  assert.equal((await win.webContents.executeJavaScript(`window.electronAPI.profileUploadResume(${JSON.stringify(selected.filePath)})`)).success,true);
  await win.webContents.executeJavaScript('window.electronAPI.profileSetMode(true)');
  const routingOnly = process.env.SNEAK_PEEK_QUALITY === 'routing';
  const quality = routingOnly || process.env.SNEAK_PEEK_QUALITY === '1';
  if (quality) {
    const modes = await win.webContents.executeJavaScript('window.electronAPI.modesGetAll()');
    const interview = modes.find(mode => mode.templateType === 'technical-interview');
    assert.ok(interview, 'Technical Interview mode must exist');
    const activated = await win.webContents.executeJavaScript(`window.electronAPI.modesSetActive(${JSON.stringify(interview.id)})`);
    assert.equal(activated.success, true);
  }
  const overlay=await waitFor(()=>windows.find(w=>!w.isDestroyed()&&/window=overlay(?:&|$)/.test(w.webContents.getURL())));
  overlay.show();overlay.focus();overlay.webContents.focus();overlay.webContents.setBackgroundThrottling(false);
  await waitFor(()=>overlay.webContents.executeJavaScript('!!document.querySelector("[data-testid=overlay-chat-input]")'));
  // Ready cohort: load the exact selected model without a content-bearing request.
  const prewarm=await fetch('http://127.0.0.1:11436/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'llama3.2:3b',prompt:'',stream:false,keep_alive:'10m'})});assert.equal(prewarm.ok,true);
  const {stripDisplayMarkup}=require(path.join(root,'dist-electron/electron/llm/promptSystemV2.js'));
  const questions=quality ? [
    'What is system design? Can you solve any system design problem I give you?',
    'Explain your projects and their implementations to someone with no coding knowledge.',
    'Please elaborate on your Geospatial project.',
    'Why did you use Spring Boot instead of alternatives?',
    'Explain a bounded queue with an example.',
    'Briefly explain system design and how you would approach a problem I give you.',
    'Explain system design in detail and how you would approach an unfamiliar design problem.',
    'Briefly explain your projects to someone with no coding knowledge.',
    'Describe your projects in detail for an audience without a coding background.',
    'Briefly summarize the Geospatial project.',
    'Describe the implementation flow of the Geospatial project in detail.',
    'Briefly explain why you used Spring Boot instead of alternatives in your Geospatial project.',
    'Explain in detail why you used Spring Boot instead of alternatives in your Geospatial project.',
    'Explain a bounded queue briefly with an example.',
    'Explain a bounded queue in detail with an example of a full queue.',
    'What happens on a cache miss in a write-through cache? Give a small example.',
    'Explain how you reduced latency by 40% in your Nimbus Ledger project.',
    'Explain the difference between a database transaction and a database lock.',
  ] : ['Hi','What is system design? Can you solve any system design problem I give you?','Explain your projects and implementations to someone with no coding knowledge','Now explain those projects technically','Please elaborate Geospatial','No, I asked about your Geospatial project','Why did you use Spring Boot instead of alternatives?','What are Spring Boot and OSRM used for in your project?', 'How does the database work?', 'What is a mutex?', 'Tell me about my Nimbus Ledger project.'];
  const results=[];
  const { marked } = await import('marked');
  const normalize=text=>text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  for (const [index, question] of questions.entries()) {
    if (routingOnly && ![7, 9, 10, 15, 16].includes(index)) continue;
    if (quality && index === 17) await win.webContents.executeJavaScript('window.electronAPI.modesSetActive(null)');
    const c=calls.length,r=reads.length,providerStart=providerCalls.length;
    await overlay.webContents.executeJavaScript(`(()=>{
      window.__trial={origin:performance.timeOrigin,start:0,events:[],paints:[]};window.__trialOff=[window.electronAPI.onGeminiStreamToken((token,meta)=>window.__trial.events.push({type:'token',at:performance.now()})),window.electronAPI.onGeminiStreamDone(data=>window.__trial.events.push({type:'done',data,at:performance.now()})),window.electronAPI.onGeminiStreamError(error=>window.__trial.events.push({type:'error',error,at:performance.now()}))];
      const old=document.body.innerText;let paintPending=false;const observer=new MutationObserver(()=>{
        if(!paintPending){paintPending=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{paintPending=false;
          const visible=[...document.querySelectorAll('.ai-response-card')].at(-1)?.innerText?.trim()||'';
          if(visible&&window.__trial.paints.at(-1)?.text!==visible&&window.__trial.paints.length<240)window.__trial.paints.push({ms:performance.now()-window.__trial.start,text:visible.slice(0,4000)});
        }));}
        const card=[...document.querySelectorAll('.ai-response-card')].at(-1);const text=card?.innerText?.trim()||'';
        if(!window.__trial.firstVisible && text.length>=12 && !old.includes(text)){requestAnimationFrame(()=>{if(!window.__trial.firstVisible){window.__trial.firstVisible=performance.now();window.__trial.firstText=text;}});}
      });observer.observe(document.body,{subtree:true,childList:true,characterData:true});window.__trialObserver=observer;
      document.querySelector('[data-testid=overlay-chat-input]').focus();
    })()`);
    await overlay.webContents.insertText(question);
    await overlay.webContents.executeJavaScript('window.__trial.start=performance.now()');
    overlay.webContents.sendInputEvent({type:'keyDown',keyCode:'Return'});overlay.webContents.sendInputEvent({type:'keyUp',keyCode:'Return'});
    await waitFor(()=>overlay.webContents.executeJavaScript("window.__trial.events.some(e=>e.type==='done'||e.type==='error')"),120000);
    const trial=await overlay.webContents.executeJavaScript('window.__trial');
    const answer=trial.events.find(e=>e.type==='done')?.data?.finalText||trial.events.find(e=>e.type==='done')?.data?.text||'';
    let matched = false;
    if (answer) {
      const html = marked.parse(stripDisplayMarkup(answer));
      const expected = await overlay.webContents.executeJavaScript(`new DOMParser().parseFromString(${JSON.stringify(html)},'text/html').body.textContent`);
      try {
        await waitFor(() => overlay.webContents.executeJavaScript(`[...document.querySelectorAll('.ai-response-card')].at(-1)?.innerText.toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu,' ').includes(${JSON.stringify(normalize(expected))})`), 8000);
        matched = true;
      } catch { /* preserve a failed visible match in the benchmark */ }
    }
    await Promise.all(providerCalls.slice(providerStart).map(call => call.finished));
    const measured=await overlay.webContents.executeJavaScript(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__trialObserver.disconnect();window.__trialOff.forEach(f=>f());resolve({...window.__trial,finalVisible:performance.now()});})))`);
    results.push({question,answer,error:trial.events.find(e=>e.type==='error')?.error,firstTextVisibleMs:measured.firstVisible?measured.firstVisible-measured.start:null,firstText:measured.firstText,paints:measured.paints,finalVisibleMs:matched ? (measured.paints.find(p => p.text === measured.paints.at(-1)?.text)?.ms ?? measured.finalVisible-measured.start) : null,rendererOrigin:measured.origin,rendererStart:measured.start,ipcFirstMs:measured.events.find(e=>e.type==='token')?.at-measured.start,ipcDoneMs:measured.events.find(e=>e.type==='done')?.at-measured.start,provider:providerCalls.slice(providerStart),calls:calls.slice(c),reads:reads.slice(r)});
    fs.writeFileSync(path.join(temp,'real-world.json'),JSON.stringify({model:'llama3.2:3b',mainOrigin:performance.timeOrigin,readiness:'empty prewarm; inspect load durations',source:'synthetic documents and actual production UI/pipeline',results},null,2));
    console.log('REAL_WORLD',results.length,results.at(-1).firstTextVisibleMs,results.at(-1).finalVisibleMs);
  }
  fs.writeFileSync(path.join(temp,'real-world.png'),(await overlay.webContents.capturePage()).toPNG());
  console.log('REAL_WORLD_DONE',temp);app.exit(0);
}).catch(async error=>{console.error(error);for(const w of windows.filter(w=>!w.isDestroyed())){try{if(/window=overlay(?:&|$)/.test(w.webContents.getURL())){fs.writeFileSync(path.join(temp,'failure.png'),(await w.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(temp,'failure.json'),JSON.stringify(await w.webContents.executeJavaScript('({text:document.body.innerText,trial:window.__trial,inputs:[...document.querySelectorAll("input,textarea")].map(e=>({value:e.value,disabled:e.disabled,testId:e.getAttribute("data-testid")}))})'),null,2));}}catch{}}app.exit(1);});
