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
  win.show();win.focus();win.webContents.focus();win.webContents.setBackgroundThrottling(false);
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

 await waitFor(()=>js(`!Array.from(document.querySelectorAll('div')).some(e=>e.classList.contains('z-[100]'))`));
 const results=[];
 const {CredentialsManager}=require(path.join(root,'dist-electron/electron/services/CredentialsManager.js'));
 const credentials=CredentialsManager.getInstance();
 credentials.setGroqApiKey('fixture-only-never-network');
 credentials.setCloudFetchedModels('groq',[{id:'qwen/qwen3.8-27b',label:'Qwen fixture'},{id:'openai/gpt-oss-120b',label:'OSS 120 fixture'},{id:'openai/gpt-oss-20b',label:'OSS 20 fixture'},{id:'fourth-fixture',label:'Fourth fixture'}],Date.now());
 if(process.env.PROJECT_ACCEPTANCE_PHASE==='2'){
  const p=await js('window.electronAPI.sessionPreferencesGet()');assert.equal(p.length,'short');assert.equal(p.codeLanguages.oop,'Java');assert.deepEqual(p.favorites.groq,['openai/gpt-oss-120b','qwen/qwen3.8-27b','openai/gpt-oss-20b']);
  const projects=await js('window.electronAPI.projectsList()');assert.equal(projects.value.length,1);assert.equal(projects.value[0].name,'Orchid API');
  assert.equal(calls.length,0);assert.equal(state.isMeetingActive,false);
  fs.writeFileSync(path.join(temp,'relaunch.json'),JSON.stringify({preferences:true,favorites:3,project:true,idleGeneration:0,capture:false}));console.log('SESSION_RELAUNCH_PASS',temp);app.exit(0);return;
 }
 const db=state.getDatabaseManager?.()?.getDb?.()??require(path.join(root,'dist-electron/electron/db/DatabaseManager.js')).DatabaseManager.getInstance().getDb();
 assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='notes'").get(),undefined);
 await js('document.querySelector("[data-testid=open-session-controls]").click()');
 await waitFor(()=>js('document.body.innerText.includes("Modes & session")'));
 await paint();
 fs.writeFileSync(path.join(temp,'session.png'),(await win.webContents.capturePage()).toPNG());
 await js(`Array.from(document.querySelectorAll('button')).find(b=>b.innerText.startsWith('Answer mode')).click()`);
 await waitFor(()=>js('document.body.innerText.includes("Coding / DSA")'));
 await click('Coding / DSA');const active=await js('window.electronAPI.modesGetActive()');assert.equal(active.templateType,'coding-dsa');
 await js(`document.querySelector('[aria-label=Back]').click()`);
 await js(`Array.from(document.querySelectorAll('button')).find(b=>b.innerText.startsWith('Code languages')).click()`);
 assert.deepEqual(await js(`Array.from(document.querySelectorAll('select')).map(s=>s.value)`),['C++','Java','SQL','Python']);
 await click('Save preferences');await js(`document.querySelector('[aria-label=Back]').click()`);
 await js(`Array.from(document.querySelectorAll('button')).find(b=>b.innerText.startsWith('Answer preferences')).click()`);
 await js(`Array.from(document.querySelectorAll('button')).find(b=>b.innerText.startsWith('Short')).click()`);await click('Save preferences');
 await waitFor(()=>js('document.body.innerText.includes("Saved. Changes apply")'));
 fs.writeFileSync(path.join(temp,'preferences.png'),(await win.webContents.capturePage()).toPNG());
 await js(`document.querySelector('[aria-label=Back]').click()`);
 await js(`Array.from(document.querySelectorAll('button')).find(b=>b.innerText.startsWith('Select language')).click()`);
 await waitFor(()=>js('document.body.innerText.includes("English")'));await click('English');assert.equal(await js('window.electronAPI.getAiResponseLanguage()'),'English');
 await js(`document.querySelector('[aria-label=Back]').click()`);
 await js(`Array.from(document.querySelectorAll('button')).find(b=>b.innerText.startsWith('Select model')).click()`);
 await waitFor(()=>js('!!document.querySelector("[aria-label=\\"Add favorite qwen/qwen3.8-27b\\"]")'));
 for(const id of ['qwen/qwen3.8-27b','openai/gpt-oss-120b','openai/gpt-oss-20b']){
  await js(`document.querySelector('[aria-label="Add favorite ${id}"]').click()`);
  await waitFor(()=>js(`!!document.querySelector('[aria-label="Remove favorite ${id}"]')`));
 }
 const p=await js('window.electronAPI.sessionPreferencesGet()');assert.equal(p.favorites.groq.length,3);
 await js(`document.querySelector('[aria-label="Add favorite fourth-fixture"]').click()`);
 await waitFor(()=>js('document.body.innerText.includes("Three favorites are already selected")'));
 assert.equal((await js('window.electronAPI.sessionPreferencesGet()')).favorites.groq.length,3);
 await js(`document.querySelector('[aria-label="Move qwen/qwen3.8-27b favorite down"]').click()`);
 await waitFor(async()=>((await js('window.electronAPI.sessionPreferencesGet()')).favorites.groq[0])==='openai/gpt-oss-120b');
 fs.writeFileSync(path.join(temp,'models.png'),(await win.webContents.capturePage()).toPNG());
 await js(`document.querySelector('[aria-label="Close session controls"]').click()`);
 const allModes=await js('window.electronAPI.modesGetAll()');await js(`window.electronAPI.modesSetActive(${JSON.stringify(allModes.find(m=>m.templateType==='resume-projects').id)})`);
 // Actual native-picker IPC with a controlled regular document; renderer never supplies paths.
 const upload=path.join(temp,'implementation.txt');fs.writeFileSync(upload,'Orchid API uses violet leases to retry dispatch safely. The database is PostgreSQL.');
 dialog.showOpenDialog=async()=>({canceled:false,filePaths:[upload]});
 let githubRequests=0,failImport=true;
 const fixtureFiles=[['README.md','# Orchid API\n\nOrchid API coordinates dispatch with PostgreSQL and an Express backend.\n\n## Architecture\nClients call REST APIs; controllers validate, services coordinate data access.'],['package.json',JSON.stringify({dependencies:{express:'5.0.0',pg:'8.0.0'}})],['src/main.ts',"import {router} from './routes';\napp.use('/api',router);"],['src/routes/controller.ts',"router.post('/dispatch',handleDispatch);\nimport {dispatch} from '../service';"],['src/schema.sql','CREATE TABLE jobs (id INTEGER PRIMARY KEY, state TEXT);']].map(([path,text],i)=>({path,text,sha:String(i+1).repeat(40),type:'blob',mode:'100644',size:Buffer.byteLength(text)}));
 const originalFetch=global.fetch;
 global.fetch=async(url,opts)=>{if(!String(url).startsWith('https://api.github.com/repos/example/orchid'))return originalFetch(url,opts);githubRequests++;if(failImport){failImport=false;return new Response('{}',{status:503});}const u=String(url);let value=u.endsWith('/example/orchid')?{name:'Orchid API',description:'Dispatch API using Express and PostgreSQL.',default_branch:'main'}:u.includes('/commits/')?{sha:'a'.repeat(40)}:u.includes('/git/trees/')?{tree:fixtureFiles,truncated:false}:{encoding:'base64',content:Buffer.from(fixtureFiles.find(f=>u.endsWith(f.sha))?.text??'').toString('base64')};return new Response(JSON.stringify(value),{status:200});};
 await js(`document.querySelector('button[title="Profile Intelligence"]').click()`);await waitFor(()=>js('document.body.innerText.includes("Identity")'));await click('Projects');await click('Add project');
 const fields=await js(`Array.from(document.querySelectorAll('[aria-label="Project knowledge manager"] label')).map(l=>l.innerText)`);assert.ok(fields.some(f=>f==='GitHub URL'));assert.ok(!fields.some(f=>/Technology stack|Description \/|README \/|optional/.test(f)));
 await type('[aria-label="Project knowledge manager"] input','Orchid API');
 await js(`document.querySelectorAll('[aria-label="Project knowledge manager"] input')[2].focus()`);await win.webContents.insertText('https://github.com/example/orchid');
 await type('[aria-label="Project knowledge manager"] textarea','I implemented the dispatch endpoint.');
 await click('Upload files');await waitFor(()=>js('document.body.innerText.includes("implementation.txt")'));
 await click('Save project');await waitFor(()=>js('!!document.querySelector("[role=alert]")'));assert.equal((await js('window.electronAPI.projectsList()')).value.length,0);
 await click('Save project');await waitFor(async()=>{const status=await js('({text:document.body.innerText,error:document.querySelector("[role=alert]")?.innerText})');if(status.error)throw new Error('Project save: '+status.error);return status.text.includes('Orchid API saved');},45000);
 const project=(await js('window.electronAPI.projectsList()')).value[0];assert.equal(project.indexState,'Ready');assert.match(project.stack,/express/);assert.equal(project.sources.length,2);assert.ok(project.knowledge.attachedDocuments.length);assert.match(JSON.stringify(project.knowledge),/controller|routes/);
 fs.writeFileSync(path.join(temp,'project.png'),(await win.webContents.capturePage()).toPNG());
 const requests=githubRequests;
 const response=await js(`(async()=>{let answer='',binding;const off=window.electronAPI.onGeminiStreamDone(d=>{answer=d.finalText||'';binding=d.answeringModel});try{await window.electronAPI.streamGeminiChat('Explain the Orchid API project.',undefined,undefined,{projectIds:[${JSON.stringify(project.id)}]});return {answer,binding};}finally{off();}})()`);
 assert.match(response.answer,/violet leases/);assert.equal(githubRequests,requests,'interview does not fetch GitHub');assert.equal(response.binding,'offline-test');
 assert.match(calls.at(-1).prompt,/saved_presentation_preferences/);assert.match(calls.at(-1).prompt,/Length: short/);
 const noRagMode=allModes.find(m=>m.templateType==='coding-dsa');await js(`window.electronAPI.modesSetActive(${JSON.stringify(noRagMode.id)})`);
 await js(`window.electronAPI.streamGeminiChat('What is binary search?',undefined,undefined)`);
 assert.doesNotMatch(calls.at(-1).prompt,/violet leases|dispatch endpoint|Dispatch API using/);
 results.push({scenario:'Session UI settings, exact modes, favorites and relaunch persistence',status:'PASS'},{scenario:'Project URL auto import, upload, explicit 503 recovery, local knowledge and no interview network',status:'PASS'},{scenario:'Mode switch removes private source content and inherited private history',status:'PASS'},{scenario:'Actual committed answer model metadata',status:'PASS'});
 fs.writeFileSync(path.join(temp,'acceptance.json'),JSON.stringify({results,generationCalls:calls.length,githubProtocolFixtureRequests:githubRequests,physicalCapture:false},null,2));
 console.log('SESSION_CONTROLS_PASS',temp);app.exit(0);
}).catch(async error=>{try{const w=windows.find(w=>!w.isDestroyed()&&/window=launcher/.test(w.webContents.getURL()));fs.writeFileSync(path.join(temp,'failure-ui.json'),JSON.stringify(await w.webContents.executeJavaScript('({text:document.body.innerText,inputs:Array.from(document.querySelectorAll("input,textarea")).map(e=>({value:e.value,disabled:e.disabled}))})')));fs.writeFileSync(path.join(temp,'failure.png'),(await w.webContents.capturePage()).toPNG());}catch{}console.error(error);fs.writeFileSync(path.join(temp,'failure.json'),JSON.stringify({error:String(error),stack:error.stack}));app.exit(1);});
