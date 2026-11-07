// Disposable desktop plumbing acceptance. Run with ELECTRON_RUN_AS_NODE unset.
// Uses the actual preload/engine/canonical reader/stream transport and a
// deterministic offline provider. Does not load main.ts, settings or credentials.
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chg1718-desktop-'));
for (const key of ['appData', 'userData', 'sessionData', 'logs', 'crashDumps']) {
  const dir = path.join(temp, key); fs.mkdirSync(dir); app.setPath(key, dir);
}
process.env.NATIVELY_TEST_USERDATA = app.getPath('userData');
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-background-networking');
const load = rel => require(path.join(root, 'dist-electron', rel));
const { SneakPeekIntelligenceEngine } = load('electron/intelligence/engine/SneakPeekIntelligenceEngine.js');
const { RetrievalCoordinator } = load('electron/intelligence/engine/RetrievalCoordinator.js');
const { createCanonicalRagRetrievalCapability } = load('electron/intelligence/engine/CanonicalRagRetrievalAdapter.js');
const { GenerationController } = load('electron/intelligence/engine/GenerationController.js');
const { streamRagEngineAnswer, buildGlobalRagRequest, ragQueryPrefix } = load('electron/intelligence/engine/RagIpcStream.js');
const { CanonicalRagStorage } = load('electron/rag/canonical/CanonicalRagStorage.js');
const { CanonicalRagReadService } = load('electron/rag/canonical/CanonicalRagReadService.js');
const { installCanonicalRagSchema } = load('electron/rag/canonical/CanonicalRagSchema.js');
const Database = require('better-sqlite3');
const db = new Database(path.join(temp, 'synthetic.sqlite'));
installCanonicalRagSchema(db);
const storage = new CanonicalRagStorage(db);
const doc = storage.createDocument({ sourceType: 'meeting', sourceId: 'synthetic-meeting', name: 'Synthetic meeting' });
const revision = storage.createRevision({ documentId: doc.id, contentHash: 'synthetic', extractionVersion: 'test', chunkingVersion: 'test', normalizationVersion: 'test' });
storage.replaceChunks(doc.id, revision.id, [{ chunkIndex: 0, text: 'The meeting selected violet job leases for safe recovery.', sourceLocator: 'meeting:100-200' }]);
storage.setStatus(doc.id, revision.id, 'READY', { chunkCount: 1, embeddedChunkCount: 0 });
storage.activateRevision(doc.id, revision.id);
const active = new Map();
const counters = { reads: 0, generations: 0, completions: 0 };
const engine = new SneakPeekIntelligenceEngine({
  retrievalCoordinator: new RetrievalCoordinator({ capabilities: [createCanonicalRagRetrievalCapability({
    source: 'meeting_transcript', sourceType: 'meeting',
    resolveScope: ({ request }) => ({ sourceId: request.retrievalScope.kind === 'meeting' ? request.retrievalScope.meetingId : undefined }),
    read: input => { counters.reads++; return new CanonicalRagReadService(storage).readSource({ ...input, fallback: async () => [] }); },
  })] }),
  generationPort: { stream: ({ request, prompt, lifecycle }) => new GenerationController({ streamFinalPrompt: async function* () {
    counters.generations++; assert.match(prompt.finalPrompt, /violet job leases/);
    yield 'The meeting selected '; yield 'violet job leases for safe recovery.';
  } }).stream({ requestId: request.requestId, finalPrompt: prompt.finalPrompt, route: { capability: 'stream_chat', availability: { hasGroq: true }, allowedProviders: ['groq'], models: { groq: 'synthetic-offline' }, maxAttempts: 1 }, abortSignal: request.cancellationSignal, lifecycle }).stream },
});
let sequence = 0;
async function answer(event, { query, meetingId }, global) {
  const meta = global ? { global: true } : { meetingId };
  const prefix = ragQueryPrefix(event.sender.id, meta);
  active.get(prefix)?.abort();
  const controller = new AbortController(); active.set(prefix, controller);
  const request = buildGlobalRagRequest({ requestId: `synthetic-${++sequence}`, sessionId: prefix, query, signal: controller.signal, recentConversation: [] });
  if (!global) { request.surface = 'meeting-overlay'; request.retrievalScope = { kind: 'meeting', meetingId }; }
  try {
    return await streamRagEngineAnswer({ engine, request, meta, isCurrent: () => active.get(prefix) === controller, send: (channel, data) => event.sender.send(channel, data), settle: status => { if (status === 'completed') counters.completions++; } });
  } finally { if (active.get(prefix) === controller) active.delete(prefix); }
}
ipcMain.handle('get-verbose-logging', () => false);
ipcMain.handle('rag:query-global', (event, args) => answer(event, args, true));
ipcMain.handle('rag:query-meeting', (event, args) => answer(event, args, false));
let win;
app.whenReady().then(async () => {
  const paths = Object.fromEntries(['appData', 'userData', 'sessionData', 'logs', 'crashDumps'].map(key => [key, app.getPath(key)]));
  for (const dir of Object.values(paths)) assert.ok(dir.startsWith(temp));
  win = new BrowserWindow({ width: 700, height: 320, show: true, title: 'Synthetic RAG verification', webPreferences: { preload: path.join(root, 'dist-electron/electron/preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false } });
  win.webContents.session.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !/^(file|data):/.test(details.url) }));
  const html = path.join(temp, 'renderer.html');
  fs.writeFileSync(html, '<!doctype html><meta charset="utf-8"><title>Synthetic RAG verification</title><h1>Offline synthetic answer</h1><pre id="answer"></pre>');
  await win.loadFile(html);
  const results = [];
  for (const global of [true, false]) {
    results.push(await win.webContents.executeJavaScript(`(async () => {
      const target = document.getElementById('answer'); target.textContent = '';
      let completed = 0, errors = 0;
      const off = [window.electronAPI.onRAGStreamChunk(data => { target.textContent += data.chunk; }), window.electronAPI.onRAGStreamComplete(() => { completed++; }), window.electronAPI.onRAGStreamError(() => { errors++; })];
      const result = await window.electronAPI.${global ? "ragQueryGlobal('What violet job leases were selected?')" : "ragQueryMeeting('synthetic-meeting', 'What violet job leases were selected?')"};
      off.forEach(fn => fn()); return { global: ${global}, result, completed, errors, visibleText: target.textContent };
    })()`));
  }
  for (const result of results) { assert.equal(result.result.success, true); assert.equal(result.completed, 1); assert.equal(result.errors, 0); assert.match(result.visibleText, /violet job leases for safe recovery/); }
  assert.deepEqual(counters, { reads: 2, generations: 2, completions: 2 });
  // IPC completion proves DOM settlement, not that Chromium has painted it.
  // Cross a rendered frame before capturing visible-answer evidence.
  await win.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  const screenshot = path.join(temp, 'visible-answer.png');
  fs.writeFileSync(screenshot, (await win.webContents.capturePage()).toPNG());
  fs.writeFileSync(path.join(temp, 'result.json'), JSON.stringify({ paths, results, counters, screenshot, provider: 'deterministic stub; no real model latency measured' }, null, 2));
  console.log(JSON.stringify({ success: true, evidence: path.join(temp, 'result.json'), screenshot, counters }));
  win.destroy(); db.close(); app.quit();
}).catch(error => { console.error(error.stack); win?.destroy(); db.close(); app.exit(1); });
setTimeout(() => { console.error('Synthetic desktop harness exceeded 30 seconds'); app.exit(1); }, 30_000).unref();
