// Opt-in full-product acceptance entry, launched only by the sandboxed runner.
// Normal application startup is unchanged. No credentials or physical capture.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { app, BrowserWindow, safeStorage, systemPreferences, desktopCapturer, dialog } = require('electron');
const root = path.resolve(__dirname, '../..');
const temp = process.env.SNEAK_PEEK_ACCEPTANCE_ROOT;
if (!temp || !fs.existsSync(path.join(temp, 'sandbox.sb'))) throw new Error('Use the sandboxed acceptance runner');
const keep = new Set(['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG', 'LC_ALL', '__CF_USER_TEXT_ENCODING', 'DISPLAY', 'XPC_FLAGS', 'XPC_SERVICE_NAME', 'SNEAK_PEEK_ACCEPTANCE_ROOT', 'CHG21_LOCAL_OLLAMA']);
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
  const productionTransport = helper.streamFinalPrompt.bind(helper);
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
  // A portfolio may read both project-tagged files, but never an unrelated
  // general file merely because it shares the same project vocabulary.
  const decoyPath = path.join(temp, 'Unrelated General.txt');
  fs.writeFileSync(decoyPath, 'Linkship and Orchid projects: forbidden-general-file-canary.');
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [decoyPath] });
  const decoy = await win.webContents.executeJavaScript('window.electronAPI.personalFilesPickAndIngest()');
  assert.equal(decoy.success, true, JSON.stringify(decoy));
  const scenarios=[];
  async function clearRenderedConversation(lastAnswer) {
    overlay.webContents.send('session-reset');
    await waitFor(() => overlay.webContents.executeJavaScript(`!document.body.innerText.includes(${JSON.stringify(lastAnswer)})`));
    const cleared = await overlay.webContents.executeJavaScript('window.electronAPI.clearChatContext()');
    assert.equal(cleared.success, true, JSON.stringify(cleared));
  }
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
    // The reveal ticker can settle after the stream's earlier frame barrier.
    // Capture only after Chromium has painted the final visible text as well.
    await overlay.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
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
  await clearRenderedConversation(scenarios.at(-1).answer);
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
  await clearRenderedConversation(scenarios.at(-1).answer);
  for(const [q,expected] of [['Tell me about yourself.',/Violet Example/],['What skills do I have?',/TypeScript/],['Explain my internship.',/orchid leases/],['What certifications do I have?',/Violet Database Certificate/]])await ask(q,expected,/amber rate counters|violet job leases|forbidden-general-file-canary/);
  await ask('What projects have I built?', /orchid leases/, /forbidden-general-file-canary/);
  assert.match(scenarios.at(-1).answer, /violet job leases/);
  assert.match(scenarios.at(-1).answer, /amber rate counters/);
  const portfolioReads = scenarios.at(-1).reads.filter(read => read.input.projectFilesOnly);
  assert.ok(portfolioReads.length > 0, 'portfolio must retrieve actual tagged projects');
  const retrievedIds = [...new Set(portfolioReads.flatMap(read => read.result.results.map(item => item.source.id)))].sort();
  assert.deepEqual(retrievedIds, files.map(file => file.id).sort(), 'portfolio project evidence must have original authorized IDs');
  fs.writeFileSync(path.join(temp,'answer.png'),(await overlay.webContents.capturePage()).toPNG());

  // Drive the real toolbar and preload using synthetic final transcript events.
  // Its audio entry points are stubbed in this disposable run, so this covers
  // the transcript handoff and rendering, without timing physical capture/STT.
  await clearRenderedConversation(scenarios.at(-1).answer);
  overlay.webContents.setBackgroundThrottling(false);
  const overlayJs = code => overlay.webContents.executeJavaScript(code);
  const toolbarClick = title => overlayJs(`(() => {
    const button = document.querySelector('[data-top-control-bar] button[title=' + CSS.escape(${JSON.stringify(title)}) + ']');
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  const visible = text => overlayJs(`document.body.innerText.includes(${JSON.stringify(text)})`);
  const paint = () => overlayJs('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  const results = {};
  const timings = {};
  const marks = {};
  const mark = key => { marks[key] = performance.now(); };
  const since = (end, start) => Math.round(marks[end] - marks[start]);
  state.getIsMeetingActive = () => true;
  state.startMeeting = async () => { throw new Error('Native meeting start is disabled in fixture'); };
  state.ensureListenAudioCapture = async () => {
    mark('ready');
    return { ok: true, mic: true, system: true };
  };
  state.finalizeMicSTT = () => mark('finalizeInvoked');
  const interviewer = 'How does a bounded queue work?';
  const user = 'Use a tiny example.';
  const listenStart = 'A bounded queue only accepts items while space remains.';
  const listenAnswer = listenStart + ' For example, a two-slot queue refuses a third item until one leaves.';
  const localModel = process.env.CHG21_LOCAL_OLLAMA === '1' ? 'llama3.2:3b' : null;
  const previousSelection = { route: helper.getSneakPeekGenerationRouteOptions, url: helper.ollamaUrl, tier: helper.getPromptTier };
  const restoreSelection = () => {
    helper.getSneakPeekGenerationRouteOptions = previousSelection.route;
    helper.ollamaUrl = previousSelection.url;
    helper.getPromptTier = previousSelection.tier;
  };
  let selectedModelResident;
  let selectedPromptTier;
  const stopText = 'Synthetic output before toolbar STOP.';
  const lateText = 'Synthetic late output must never be shown.';
  let release;
  const parked = new Promise(resolve => { release = resolve; });
  helper.streamFinalPrompt = async function* (provider, model, prompt, options) {
    if (prompt.includes('toolbar cancellation fixture')) {
      options.abortSignal.addEventListener('abort', () => mark('stopped'), { once: true });
      yield stopText;
      await parked;
      mark('lateAttempt');
      yield lateText;
      return;
    }
    assert.ok(prompt.includes(interviewer) && prompt.includes(user), 'both finalized Listen speakers reach the canonical prompt');
    mark('providerStart');
    if (localModel) {
      assert.equal(provider, 'ollama');
      assert.equal(model, localModel);
      fs.writeFileSync(path.join(temp, 'listen-provider-prompt.txt'), prompt);
      let produced = '';
      for await (const token of productionTransport(provider, model, prompt, options)) {
        produced += token;
        if (!marks.providerUseful && produced.trim().length >= 5) mark('providerUseful');
        yield token;
      }
    } else {
      mark('providerUseful');
      yield listenStart;
      await new Promise(resolve => setTimeout(resolve, 90));
      yield listenAnswer.slice(listenStart.length);
    }
    mark('providerDone');
  };
  try {
    if (localModel) {
      helper.ollamaUrl = 'http://127.0.0.1:11436';
      // Exercise the production tier decision for the same binding that
      // streams the answer. Keep startup mode-section compilers offline.
      const selected = Object.assign(Object.create(Object.getPrototypeOf(helper)), {
        useOllama: true, ollamaModel: localModel,
      });
      selectedPromptTier = selected.getPromptTier();
      helper.getPromptTier = () => selectedPromptTier;
      helper.getSneakPeekGenerationRouteOptions = () => ({
        capability: 'stream_chat', preferredProvider: 'ollama', allowedProviders: ['ollama'],
        availability: { hasOllama: true }, models: { ollama: localModel }, maxAttempts: 1,
      });
      const response = await fetch(helper.ollamaUrl + '/api/ps', { signal: AbortSignal.timeout(2000) });
      assert.ok(response.ok);
      selectedModelResident = (await response.json()).models.some(entry => entry.name === localModel);
    }
    await overlayJs(`window.__chg21Events = [];
      window.__chg21Off = [
        window.electronAPI.onGeminiStreamToken((text, meta) => window.__chg21Events.push({kind:'token',text,id:meta?.streamId})),
        window.electronAPI.onGeminiStreamDone(meta => window.__chg21Events.push({kind:'done',id:meta?.streamId})),
        window.electronAPI.onGeminiStreamError((error, meta) => window.__chg21Events.push({kind:'error',id:meta?.streamId}))
      ]; void 0;`);
    await toolbarClick('Expand toolbar');
    const readsBefore = reads.length;
    mark('listen');
    assert.ok(await toolbarClick('Start listening'));
    await waitFor(() => marks.ready);
    for (const [speaker, text] of [['interviewer', interviewer], ['user', user]]) {
      overlay.webContents.send('native-audio-transcript', { speaker, text, final: true });
    }
    await waitFor(async () => await visible(interviewer) && await visible(user));
    mark('transcriptVisible');
    mark('analyze');
    assert.ok(await toolbarClick('Stop listening and get an answer'));
    const answerEvents = () => overlayJs('window.__chg21Events.slice()');
    const answerText = events => events.filter(event => event.kind === 'token').map(event => event.text).join('').trim();
    const plainAnswer = text => text.replace(/\*\*|__/g, '').replace(/\s+/g, ' ').trim();
    const visibleAnswer = text => overlayJs(`document.body.innerText.replace(/\\s+/g, ' ').includes(${JSON.stringify(plainAnswer(text))})`);
    if (localModel) {
      await waitFor(async () => {
        const prefix = plainAnswer(answerText(await answerEvents())).slice(0, 5);
        return prefix.length >= 5 && await overlayJs(`Array.from(document.querySelectorAll('.ai-response-card')).some(card => {
          const { top, bottom } = card.getBoundingClientRect();
          if (bottom <= 0 || top >= innerHeight || getComputedStyle(card).visibility !== 'visible') return false;
          const firstWord = card.querySelector('.reveal-word');
          if (firstWord && Number(getComputedStyle(firstWord).opacity) < 0.1) return false;
          return card.innerText.trim().startsWith(${JSON.stringify(prefix)});
        })`);
      });
      await paint();
    } else {
      await waitFor(() => visible(listenStart));
    }
    mark('firstVisible');
    await waitFor(() => marks.providerDone);
    const listenEvents = await waitFor(async () => {
      const events = await answerEvents();
      return events.some(event => event.kind === 'done') && events;
    });
    const delivered = answerText(listenEvents);
    if (localModel) {
      fs.writeFileSync(path.join(temp, 'listen-provider-answer.txt'), delivered);
      assert.match(delivered, /queue/i);
      assert.match(delivered, /capacity|fixed|limit|full|space/i);
      assert.doesNotMatch(delivered, /\[\[GIST\]\]|\$412/);
      await waitFor(() => visibleAnswer(delivered));
    } else {
      await waitFor(() => visible(listenAnswer));
    }
    // Text can be in the DOM while the per-word fade and blur still conceal it.
    await waitFor(() => overlayJs(`Array.from(document.querySelectorAll('.reveal-word')).every(word => {
      const style = getComputedStyle(word);
      return Number(style.opacity) >= 0.99 && ['blur(0px)', 'none'].includes(style.filter);
    })`), 5000);
    await paint();
    mark('finalVisible');
    assert.equal(listenEvents.filter(event => event.kind === 'done').length, 1);
    assert.ok(listenEvents.every(event => event.kind !== 'error'));
    assert.equal(new Set(listenEvents.map(event => event.id)).size, 1);
    assert.equal(reads.length, readsBefore, 'general Listen question does not read private documents');
    timings.listenToFixtureReadinessMs = since('ready', 'listen');
    timings.listenToFinalTranscriptVisibleMs = since('transcriptVisible', 'listen');
    timings.analyzeToFinalizeIpcMs = since('finalizeInvoked', 'analyze');
    timings.analyzeToProviderMs = since('providerStart', 'analyze');
    timings.providerToUsefulTextMs = since('providerUseful', 'providerStart');
    timings.analyzeToFirstVisibleMs = since('firstVisible', 'analyze');
    timings.analyzeToFinalPaintMs = since('finalVisible', 'analyze');
    timings.providerDoneToFinalPaintMs = since('finalVisible', 'providerDone');
    fs.writeFileSync(path.join(temp,'listen-analyze.png'),(await overlay.webContents.capturePage()).toPNG());
    results.listenAnalyze = { status: 'PASS', timings, events: listenEvents,
      model: localModel, selectedModelResident, selectedPromptTier, answer: delivered,
      limitation: localModel ? 'Synthetic final audio-transcript events and capture/finalization; real selected loopback model'
        : 'Synthetic final audio-transcript events, capture/finalization fixture and deterministic model transport' };
    fs.writeFileSync(path.join(temp,'chg21-lifecycle.json'), JSON.stringify(results, null, 2));

    restoreSelection();
    await overlayJs(`window.__chg21Events.length = 0; document.querySelector('[data-testid="overlay-chat-input"]').focus()`);
    await overlay.webContents.insertText('Explain the toolbar cancellation fixture.');
    overlay.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' });
    overlay.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' });
    await waitFor(() => visible(stopText));
    mark('stopClick');
    assert.ok(await toolbarClick('Stop the current answer'));
    await waitFor(() => marks.stopped);
    release();
    await waitFor(() => marks.lateAttempt);
    const stopButtonSettled = () => overlayJs(`document.querySelector('[aria-label="Stop current answer"]')?.disabled === true`);
    await waitFor(stopButtonSettled);
    await paint();
    mark('stopPaint');
    const stopEvents = await overlayJs('window.__chg21Events.slice()');
    assert.deepEqual(stopEvents.map(event => event.kind), ['token']);
    assert.equal(stopEvents[0].text.trim(), stopText);
    assert.equal(await visible(lateText), false);
    fs.writeFileSync(path.join(temp,'toolbar-stop.png'),(await overlay.webContents.capturePage()).toPNG());
    results.toolbarStop = { status: 'PASS', clickToProviderAbortMs: since('stopped', 'stopClick'),
      clickToSettledPaintMs: since('stopPaint', 'stopClick'), lateAttempted: true, lateVisible: false, events: stopEvents };
    fs.writeFileSync(path.join(temp,'chg21-lifecycle.json'), JSON.stringify(results, null, 2));
  } finally {
    restoreSelection();
    release();
    await overlayJs('window.__chg21Off?.forEach(off => off()); void 0;');
  }
  console.log('ACCEPTANCE_PASS',JSON.stringify({scenarios:scenarios.length,temp}));
  app.quit();
}).catch(e=>{fs.writeFileSync(path.join(temp,'failure.txt'),e.stack);console.error('ACCEPTANCE_FAILED',e.stack);app.exit(1);});
setTimeout(()=>{console.error('ACCEPTANCE_TIMEOUT');app.exit(1);},120000).unref();
