// Opt-in full-product acceptance entry, launched only by the sandboxed runner.
// Normal application startup is unchanged. No real credentials/provider/capture.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { app, BrowserWindow, safeStorage, systemPreferences, desktopCapturer, dialog, ipcMain } = require('electron');
const root = path.resolve(__dirname, '../..');
const temp = process.env.SNEAK_PEEK_ACCEPTANCE_ROOT;
if (!temp || !fs.existsSync(path.join(temp, 'sandbox.sb'))) throw new Error('Use the sandboxed acceptance runner');
const keep = new Set(['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG', 'LC_ALL', '__CF_USER_TEXT_ENCODING', 'DISPLAY', 'XPC_FLAGS', 'XPC_SERVICE_NAME', 'SNEAK_PEEK_ACCEPTANCE_ROOT', 'CHG19_PHASE']);
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
// Instrument genuine handlers and deliveries; their arguments, return values,
// security decisions and implementation are not replaced by this harness.
const { AsyncLocalStorage } = require('node:async_hooks');
const crypto = require('node:crypto');
const phase = process.env.CHG19_PHASE;
assert.ok(['initial', 'relaunch'].includes(phase));
const scope = new AsyncLocalStorage();
const records = [], events = [], reads = [], scenarios = [], windows = [];
const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel, handler) => originalHandle(channel, (event, ...args) => {
  if (!/^rag:(query-meeting|query-global|cancel-query)$/.test(channel)) return handler(event, ...args);
  const row = { channel, senderId: event.sender.id, args, at: performance.now() };
  records.push(row);
  return scope.run(row, async () => {
    try { row.result = await handler(event, ...args); return row.result; }
    finally { row.settledAt = performance.now(); }
  });
});
const uuid = crypto.randomUUID.bind(crypto);
crypto.randomUUID = (...args) => {
  const value = uuid(...args), row = scope.getStore();
  // streamSneakPeekMeetingAnswer creates this request ID before other work.
  if (row?.channel.startsWith('rag:query-') && !row.requestId) row.requestId = `sneak-peek-rag-${value}`;
  return value;
};
app.on('browser-window-created', (_event, win) => {
  windows.push(win);
  const send = win.webContents.send.bind(win.webContents);
  win.webContents.send = (channel, ...args) => {
    if (/^rag:stream-(chunk|complete|error)$/.test(channel)) events.push({ channel, senderId: win.webContents.id, payload: args[0], requestId: scope.getStore()?.requestId, at: performance.now() });
    return send(channel, ...args);
  };
});
const report = { phase, status: 'RUNNING', provider: 'deterministic delayed transport, no credentials/network', paths: Object.fromEntries(['userData', 'sessionData', 'appData', 'logs', 'downloads'].map(k => [k, app.getPath(k)])), scenarios, records, events, reads };
function save() { fs.writeFileSync(path.join(temp, `${phase}.json`), JSON.stringify(report, (key, value) => key === 'release' ? undefined : value, 2)); }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, label, ms = 20000) {
  const until = Date.now() + ms;
  while (Date.now() < until) { const result = await check(); if (result) return result; await sleep(40); }
  throw new Error(`Timed out: ${label}`);
}
const { AppState } = require(path.join(root, 'dist-electron/electron/main.js'));
app.whenReady().then(async () => {
  // Verify denial before any owner-home directory entries can be returned;
  // no actual owner file or credential is opened. A nonexistent read path
  // can legitimately return ENOENT before macOS performs its sandbox check.
  const deny = path.join(require('node:os').homedir(), '__chg19_nonexistent_sandbox_canary__');
  report.isolation = {};
  for (const mode of ['r', 'w']) {
    try {
      if (mode === 'r') fs.readdirSync(require('node:os').homedir());
      else { const fd = fs.openSync(deny, mode); fs.closeSync(fd); }
      throw new Error('Owner home unexpectedly accessible');
    }
    catch (error) { assert.ok(['EPERM', 'EACCES'].includes(error.code), `sandbox ${mode}: ${error.code}`); report.isolation[mode] = error.code; }
  }
  const state = AppState.getInstance();
  const helper = state.processingHelper.getLLMHelper();
  const rag = await waitFor(() => state.getRAGManager(), 'real RAG manager');
  // Only model transports are deterministic. Actual source adapters, lexical
  // retrieval, planner, prompt, provider router and stream controller run.
  rag.embeddingPipeline.getEmbeddingForQuery = async () => null;
  helper.getSneakPeekGenerationRouteOptions = () => ({ capability: 'stream_chat', preferredProvider: 'groq', allowedProviders: ['groq'], availability: { hasGroq: true }, models: { groq: 'synthetic-offline' }, maxAttempts: 1 });
  helper.streamFinalPrompt = async function* (_provider, _model, prompt, options) {
    const row = scope.getStore();
    assert.ok(row?.requestId, 'provider must belong to genuine query IPC');
    row.providerStartedAt = performance.now(); row.prompt = prompt;
    row.first = `CHG19_FIRST_${records.indexOf(row)} violet leases. `;
    row.late = `CHG19_LATE_${records.indexOf(row)}.`;
    row.providerCalls = (row.providerCalls ?? 0) + 1;
    options.abortSignal.addEventListener('abort', () => { row.abortedAt = performance.now(); save(); }, { once: true });
    let release;
    const gate = new Promise(resolve => { release = resolve; }); row.release = release;
    yield row.first;
    await gate; // Intentionally ignores abort until released: exercise late rejection.
    row.lateAttemptedAt = performance.now();
    yield row.late;
    row.providerFinishedAt = performance.now();
  };
  const read = rag.readPlannedCanonicalSource.bind(rag);
  rag.readPlannedCanonicalSource = async input => {
    const result = await read(input);
    reads.push({ requestId: scope.getStore()?.requestId, sourceType: input.sourceType, sourceId: input.sourceId ?? null, sessionId: input.sessionId, resultSourceIds: result.results.map(r => r.source.id), usedCanonical: result.usedCanonical });
    return result;
  };
  const { DatabaseManager } = require(path.join(root, 'dist-electron/electron/db/DatabaseManager.js'));
  const manager = DatabaseManager.getInstance();
  assert.equal(path.resolve(manager.getDbPath()), path.resolve(app.getPath('userData'), 'natively.db'));
  if (phase === 'initial') {
    for (const [id, title, text] of [
      ['chg19-a', 'CHG19 Synthetic Meeting A', 'The team selected violet leases for crash recovery.'],
      ['chg19-b', 'CHG19 Synthetic Meeting B', 'The team selected violet leases with amber counters for rate limiting.'],
    ]) {
      manager.saveMeeting({ id, title, date: new Date().toISOString(), summary: text, transcript: [{ speaker: 'interviewer', text, timestamp: 100 }], isProcessed: true, summaryStatus: 'completed', source: 'manual' }, Date.now(), 60000);
      rag.vectorStore.saveChunks([{ meetingId: id, chunkIndex: 0, speaker: 'interviewer', startMs: 100, endMs: 200, text, tokenCount: 15 }]);
    }
    // A stored synthetic personal source must remain unreachable to global RAG.
    const { installCanonicalRagSchema } = require(path.join(root, 'dist-electron/electron/rag/canonical/CanonicalRagSchema.js'));
    const { CanonicalRagStorage } = require(path.join(root, 'dist-electron/electron/rag/canonical/CanonicalRagStorage.js'));
    installCanonicalRagSchema(rag.db);
    const storage = new CanonicalRagStorage(rag.db);
    const doc = storage.createDocument({ sourceType: 'personal', sourceId: 'chg19-private-decoy', name: 'synthetic decoy', fileType: 'project' });
    const rev = storage.createRevision({ documentId: doc.id, contentHash: 'chg19-decoy', extractionVersion: 'fixture', chunkingVersion: 'fixture', normalizationVersion: 'fixture' });
    storage.replaceChunks(doc.id, rev.id, [{ chunkIndex: 0, text: 'Violet leases FORBIDDEN_PERSONAL_CANARY', sourceLocator: 'synthetic:1' }]);
    storage.setStatus(doc.id, rev.id, 'READY', { chunkCount: 1, embeddedChunkCount: 0 }); storage.activateRevision(doc.id, rev.id);
  } else assert.ok(manager.getMeetingDetails('chg19-a'), 'same profile retains synthetic meeting');
  const win = await waitFor(() => windows.find(w => !w.isDestroyed() && /window=launcher/.test(w.webContents.getURL())), 'production launcher');
  await waitFor(() => win.webContents.executeJavaScript('document.body.innerText.length > 40'), 'launcher paint');
  win.show(); win.focus();
  win.webContents.send('meetings-updated');
  await waitFor(() => win.webContents.executeJavaScript(`document.body.innerText.includes('CHG19 Synthetic Meeting A')`), 'synthetic meeting list');
  await win.webContents.executeJavaScript(`window.__chg19Events=[];window.__chg19Off=[window.electronAPI.onRAGStreamChunk(p=>window.__chg19Events.push({kind:'chunk',p,at:performance.now()})),window.electronAPI.onRAGStreamComplete(p=>window.__chg19Events.push({kind:'complete',p,at:performance.now()})),window.electronAPI.onRAGStreamError(p=>window.__chg19Events.push({kind:'error',p,at:performance.now()}))];void 0;`);
  const js = code => win.webContents.executeJavaScript(code);
  const title = type => type === 'meeting' ? 'Search this meeting' : 'Search all meetings';
  const visible = type => js(`Array.from(document.querySelectorAll('span')).some(e=>e.textContent===${JSON.stringify(title(type))})`);
  async function paint() { await js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))'); }
  async function screenshot(name) { await paint(); const file = `${phase}-${name}.png`; fs.writeFileSync(path.join(temp, file), (await win.webContents.capturePage()).toPNG()); return file; }
  async function input(selector, value, repeats = 1) {
    await waitFor(() => js(`Boolean(document.querySelector(${JSON.stringify(selector)}))`), selector);
    await js(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    await win.webContents.insertText(value);
    // Allow the actual controlled React input and search menu to settle.
    await paint();
    for (let i = 0; i < repeats; i++) { win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' }); win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' }); }
  }
  async function open(type, label) {
    if (type === 'meeting' && !(await js(`Boolean(document.querySelector('input[placeholder="Ask about this meeting..."]'))`))) {
      await js(`Array.from(document.querySelectorAll('h3,h4,p,span,div')).filter(e=>e.textContent==='CHG19 Synthetic Meeting A').sort((a,b)=>a.children.length-b.children.length)[0].click()`);
    }
    const before = records.length;
    await input(type === 'meeting' ? 'input[placeholder="Ask about this meeting..."]' : 'input[placeholder="Search or ask anything..."]', `What violet leases did the meeting select? ${label}`);
    await waitFor(() => visible(type), `${type} overlay visible`);
    const row = await waitFor(() => records.slice(before).find(r => r.channel === `rag:query-${type}` && r.providerStartedAt), `${type} delayed provider`);
    await waitFor(() => js(`document.body.innerText.includes(${JSON.stringify(row.first.trim())})`), 'actual first answer visible');
    return row;
  }
  async function verifyScope(row, type) {
    const selected = reads.filter(r => r.requestId === row.requestId);
    assert.equal(selected.length, 1, 'one planned meeting read');
    assert.equal(selected[0].sourceType, 'meeting');
    assert.equal(selected[0].sourceId, type === 'meeting' ? 'chg19-a' : null);
    assert.ok(selected[0].resultSourceIds.length > 0, 'real source retrieval produced evidence');
    assert.ok(selected[0].resultSourceIds.every(id => (type === 'meeting' ? ['chg19-a'] : ['chg19-a', 'chg19-b']).includes(id)));
    if (type === 'global') assert.deepEqual([...new Set(selected[0].resultSourceIds)].sort(), ['chg19-a', 'chg19-b']);
    assert.doesNotMatch(row.prompt, /FORBIDDEN_PERSONAL_CANARY/);
    if (type === 'meeting') assert.doesNotMatch(row.prompt, /amber counters/);
  }
  async function closeScenario(type, action) {
    const row = await open(type, `${type}-${action}`);
    await verifyScope(row, type);
    const beforeScreenshot = await screenshot(`${type}-${action}-${records.indexOf(row)}-streaming`);
    const beforeCount = events.filter(e => e.requestId === row.requestId).length;
    const cancelledAt = performance.now();
    if (action === 'Escape') { win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' }); win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' }); }
    else await js(`Array.from(document.querySelectorAll('span')).find(e=>e.textContent===${JSON.stringify(title(type))}).parentElement.parentElement.querySelector('button').click()`);
    await waitFor(() => row.abortedAt && row.settledAt, 'close reaches real cancellation');
    await waitFor(async () => !(await visible(type)), 'actual overlay removed');
    row.release();
    await waitFor(() => row.lateAttemptedAt, 'late provider output attempted');
    await sleep(250);
    const rendererEvents = await js('window.__chg19Events');
    const rendererStart = rendererEvents.findIndex(e => e.kind === 'chunk' && e.p.chunk === row.first);
    assert.ok(rendererStart >= 0, 'renderer observed first committed chunk');
    const rendererAfter = rendererEvents.slice(rendererStart);
    assert.deepEqual(rendererAfter.map(e => e.kind), ['chunk'], 'renderer receives no late token or terminal event');
    const own = events.filter(e => e.requestId === row.requestId);
    assert.equal(own.length, beforeCount, 'no post-cancel event');
    assert.equal(own.filter(e => e.channel === 'rag:stream-chunk').length, 1);
    assert.equal(own.filter(e => e.channel === 'rag:stream-complete').length, 0);
    assert.equal(own.filter(e => e.channel === 'rag:stream-error').length, 0);
    assert.ok(!await js(`document.body.innerText.includes(${JSON.stringify(row.late)})`));
    const cancel = records.filter(r => r.channel === 'rag:cancel-query' && r.senderId === row.senderId && r.at >= cancelledAt && (type === 'meeting' ? r.args[0].meetingId === 'chg19-a' : r.args[0].global === true));
    assert.ok(cancel.some(r => r.args[0].clearContext === true));
    scenarios.push({ id: type === 'meeting' ? 'G19-01' : 'G19-02', type, action, status: 'PASS', requestId: row.requestId, senderId: row.senderId, meetingId: type === 'meeting' ? 'chg19-a' : null, cancelledAt, chunks: 1, completes: 0, errors: 0, postCancelEvents: 0, cancelCalls: cancel.length, rendererCounts: { chunks: rendererAfter.length, completes: 0, errors: 0 }, screenshots: [beforeScreenshot, await screenshot(`${type}-${action}-${records.indexOf(row)}-closed`)] }); save();
  }
  if (phase === 'initial') {
    await closeScenario('meeting', 'Escape'); await closeScenario('meeting', 'X');
    // Return through the actual launcher back button to open global search.
    await js(`document.querySelector('button svg.lucide-arrow-left').closest('button').click()`);
    await closeScenario('global', 'Escape'); await closeScenario('global', 'X');
    // A second real launcher/overlay uses another WebContents but the same
    // disposable DB. Closing the first window's query must leave it alive.
    const second = new BrowserWindow({ width: 1000, height: 800, show: false, webPreferences: { preload: path.join(root, 'dist-electron/electron/preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    await second.loadURL(win.webContents.getURL());
    const js2 = code => second.webContents.executeJavaScript(code);
    await waitFor(() => js2(`Boolean(document.querySelector('input[placeholder="Search or ask anything..."]'))`), 'second real launcher');
    const beforeSecond = records.length;
    await js2(`document.querySelector('input[placeholder="Search or ask anything..."]').focus()`);
    await second.webContents.insertText('What violet leases did the meeting select? second-sender');
    await js2('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    second.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' }); second.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' });
    const secondRow = await waitFor(() => records.slice(beforeSecond).find(r => r.channel === 'rag:query-global' && r.senderId === second.webContents.id && r.providerStartedAt), 'second sender provider');
    await waitFor(() => js2(`document.body.innerText.includes(${JSON.stringify(secondRow.first.trim())})`), 'second overlay visible chunk');
    await verifyScope(secondRow, 'global');
    await closeScenario('global', 'Escape');
    assert.equal(secondRow.abortedAt, undefined, 'closing main sender does not cancel second sender');
    secondRow.release(); await waitFor(() => secondRow.settledAt, 'independent sender completion');
    await waitFor(() => js2(`document.body.innerText.includes(${JSON.stringify(secondRow.late)})`), 'second overlay final answer');
    await js2('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const otherEvents = events.filter(e => e.requestId === secondRow.requestId);
    assert.deepEqual(otherEvents.map(e => e.channel), ['rag:stream-chunk', 'rag:stream-chunk', 'rag:stream-complete']);
    fs.writeFileSync(path.join(temp, 'initial-global-independent-sender.png'), (await second.webContents.capturePage()).toPNG());
    scenarios.push({ id: 'G19-02', status: 'PASS', behavior: 'actual second global overlay survives first sender cancellation', requestId: secondRow.requestId, senderId: secondRow.senderId, otherSenderId: win.webContents.id, chunks: 2, completes: 1, errors: 0, screenshot: 'initial-global-independent-sender.png' });
    // Overlapping requests are an IPC test, not an artificial removal of the
    // GUI busy guard. Observe the genuine registered handler and late rejection.
    second.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' }); second.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
    await waitFor(() => js2(`!Array.from(document.querySelectorAll('span')).some(e=>e.textContent==='Search all meetings')`), 'second overlay closes');
    await js2(`window.__ipcEvents=[];window.__ipcOff=[window.electronAPI.onRAGStreamChunk(p=>window.__ipcEvents.push({kind:'chunk',p})),window.electronAPI.onRAGStreamComplete(p=>window.__ipcEvents.push({kind:'complete',p})),window.electronAPI.onRAGStreamError(p=>window.__ipcEvents.push({kind:'error',p}))];void 0;`);
    const priorA = records.length;
    await js2(`window.__requestA=window.electronAPI.ragQueryGlobal('What violet leases did the meeting select? ipc-A');void 0;`);
    const a = await waitFor(() => records.slice(priorA).find(r => r.channel === 'rag:query-global' && r.providerStartedAt), 'IPC request A');
    await waitFor(() => events.some(e => e.requestId === a.requestId && e.channel === 'rag:stream-chunk'), 'A committed');
    const priorB = records.length;
    await js2(`window.__requestB=window.electronAPI.ragQueryGlobal('What violet leases did the meeting select? ipc-B');void 0;`);
    const b = await waitFor(() => records.slice(priorB).find(r => r.channel === 'rag:query-global' && r.providerStartedAt), 'IPC request B');
    await waitFor(() => a.abortedAt && a.settledAt, 'supersession aborts A');
    a.release(); await waitFor(() => a.lateAttemptedAt, 'A late output released after B starts');
    b.release(); await waitFor(() => b.settledAt, 'B completes'); await sleep(150);
    assert.deepEqual(events.filter(e => e.requestId === a.requestId).map(e => e.channel), ['rag:stream-chunk']);
    assert.deepEqual(events.filter(e => e.requestId === b.requestId).map(e => e.channel), ['rag:stream-chunk', 'rag:stream-chunk', 'rag:stream-complete']);
    const ipcEvents = await js2('window.__ipcEvents');
    assert.deepEqual(ipcEvents.map(e => e.kind), ['chunk', 'chunk', 'chunk', 'complete']);
    assert.ok(!ipcEvents.some(e => e.p.chunk === a.late), 'renderer bridge rejects stale A');
    scenarios.push({ id: 'G19-03', status: 'PASS', behavior: 'real same-sender/scope IPC A superseded by B; GUI guard unchanged', senderId: second.webContents.id, supersededRequestId: a.requestId, requestId: b.requestId, aChunks: 1, aCompletes: 0, bChunks: 2, bCompletes: 1, lateARejected: true, rendererEventKinds: ipcEvents.map(e => e.kind) });
    await js2('window.__ipcOff.forEach(off=>off());void 0;'); second.destroy(); save();
    const row = await open('global', 'repeated-enter');
    const before = records.filter(r => r.channel.startsWith('rag:query-')).length;
    await input('input[placeholder="Ask me anything..."]', 'Repeated Enter must not submit while busy', 3);
    await sleep(150);
    assert.equal(records.filter(r => r.channel.startsWith('rag:query-')).length, before);
    row.release(); await waitFor(() => row.settledAt, 'one completed request');
    await waitFor(() => js(`document.body.innerText.includes(${JSON.stringify(row.late)})`), 'single completed answer visible');
    assert.equal(events.filter(e => e.requestId === row.requestId && e.channel === 'rag:stream-complete').length, 1);
    scenarios.push({ id: 'G19-03', status: 'PASS', behavior: 'three repeated Enter keypresses rejected while actual global overlay is busy; existing IPC tests separately cover supersession', requestId: row.requestId, senderId: row.senderId, queryCalls: 1, chunks: 2, completes: 1, screenshot: await screenshot('repeated-enter') }); save();
    // Close the completed global chat, then leave a genuinely in-flight request
    // during graceful quit. Relaunch must not resurrect it from persisted state.
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' }); win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
    await waitFor(async () => !(await visible('global')), 'close completed global');
    const pending = await open('global', 'quit-pending');
    report.pendingAtQuit = { requestId: pending.requestId, senderId: pending.senderId, first: pending.first, late: pending.late, screenshot: await screenshot('quit-pending') };
  } else {
    await sleep(300);
    assert.equal(records.filter(r => r.channel.startsWith('rag:query-')).length, 0, 'no request resumes on startup');
    assert.equal(events.length, 0, 'no cancelled event resumes');
    const initial = JSON.parse(fs.readFileSync(path.join(temp, 'initial.json')));
    assert.equal(initial.paths.userData, report.paths.userData);
    assert.equal(initial.paths.sessionData, report.paths.sessionData);
    assert.ok(!await js(`document.body.innerText.includes(${JSON.stringify(initial.pendingAtQuit.late)})`));
    const row = await open('global', 'after-relaunch'); await verifyScope(row, 'global');
    row.release(); await waitFor(() => row.settledAt, 'new request after relaunch');
    await waitFor(() => js(`document.body.innerText.includes(${JSON.stringify(row.late)})`), 'new visible answer');
    const own = events.filter(e => e.requestId === row.requestId);
    assert.equal(own.filter(e => e.channel === 'rag:stream-chunk').length, 2);
    assert.equal(own.filter(e => e.channel === 'rag:stream-complete').length, 1);
    assert.equal(own.filter(e => e.channel === 'rag:stream-error').length, 0);
    scenarios.push({ id: 'G19-04', status: 'PASS', previousRequestId: initial.pendingAtQuit.requestId, requestId: row.requestId, senderId: row.senderId, resumedRequests: 0, resumedEvents: 0, chunks: 2, completes: 1, errors: 0, screenshot: await screenshot('relaunch-completed') });
  }
  report.rendererEvents = await js('window.__chg19Events');
  report.status = 'PASS'; save(); app.quit();
}).catch(error => { report.status = 'FAIL'; report.error = error.stack; save(); console.error(error.stack); app.exit(1); });
setTimeout(() => { report.status = 'FAIL'; report.error = 'Desktop acceptance exceeded 120 seconds'; save(); app.exit(1); }, 120000).unref();
