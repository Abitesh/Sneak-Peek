import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LLMHelper } from '../../../dist-electron/electron/LLMHelper.js';

const localMetadata = {
  details: { format: 'gguf', quantization_level: 'Q4_K_M' },
  capabilities: ['completion'],
};

function helperWith(overrides) {
  return Object.assign(Object.create(LLMHelper.prototype), {
    _prewarmedKeys: new Set(),
    getPromptTier: () => 'tiny',
    resolveLocalSystemPrompt: prompt => prompt,
    injectLanguageInstruction: prompt => prompt,
    ...overrides,
  });
}

for (const [provider, model, field, method] of [
  ['gemini', 'gemini-3.1-flash', 'client', 'geminiPromptCache'],
  ['claude', 'claude-opus-4-8', 'claudeClient', 'streamWithClaude'],
  ['openai', 'gpt-4.1', 'openaiClient', 'streamWithOpenai'],
  ['groq', 'llama-3.3-70b', 'groqClient', 'streamWithGroq'],
]) {
  test(`routes to ${provider} and deduplicates the prompt cache warmer`, async () => {
    let calls = 0;
    const helper = helperWith({
      currentModelId: model,
      [field]: {},
      [method]: provider === 'gemini'
        ? { getOrCreate: async () => { calls++; } }
        : async function* () { calls++; yield 'ready'; },
    });
    await helper.prewarmPromptCache();
    await helper.prewarmPromptCache();
    assert.equal(calls, 1);
  });
}

test('local-only, server-side and unavailable cloud models skip and warm failures stay best-effort', async () => {
  let calls = 0;
  const helper = helperWith({
    currentModelId: 'claude-opus-4-8',
    isLocalOnlyMode: true,
    claudeClient: {},
    streamWithClaude: async function* () { calls++; throw new Error('fixture'); },
  });
  await helper.prewarmPromptCache();
  assert.equal(calls, 0);
  helper.isLocalOnlyMode = false;
  helper.currentModelId = 'natively';
  await helper.prewarmPromptCache();
  assert.equal(calls, 0);
  helper.currentModelId = 'claude-opus-4-8';
  helper.claudeClient = null;
  await helper.prewarmPromptCache();
  assert.equal(calls, 0);
  helper.claudeClient = {};
  helper._prewarmedKeys.clear();
  await assert.doesNotReject(helper.prewarmPromptCache());
  assert.equal(calls, 1);
});

test('local-only Ollama warms only the selected installed model, uses no text and bounds residency', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ path: new URL(url).pathname, body: JSON.parse(options.body), redirect: options.redirect });
    return Response.json(url.endsWith('/show') ? localMetadata : { done_reason: 'load' });
  });
  const helper = helperWith({
    isLocalOnlyMode: true, useOllama: true, ollamaModel: 'selected:3b', ollamaUrl: 'http://localhost:11434',
    currentModelId: 'gemini-3.1-flash',
    getPromptTier: () => { assert.fail('Ollama preload must not construct a prompt'); },
  });
  await Promise.all([helper.prewarmPromptCache(), helper.prewarmPromptCache()]);
  await helper.prewarmPromptCache();
  assert.deepEqual(calls, [
    { path: '/api/show', body: { model: 'selected:3b' }, redirect: 'error' },
    { path: '/api/chat', body: { model: 'selected:3b', messages: [], stream: false, keep_alive: '5m' }, redirect: 'error' },
  ]);
  helper.setModel('ollama-other:3b');
  await helper.prewarmPromptCache();
  assert.equal(calls.at(-1).body.model, 'other:3b');
  helper.setModel('gemini');
  assert.equal(calls.length, 4, 'switch must not send an unload that can race an active turn');
});

test('host, capability and remote-model guards refuse background loads', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return Response.json({ ...localMetadata, remote_host: 'cloud.invalid' });
  });
  const helper = helperWith({ useOllama: true, ollamaModel: 'selected:3b', ollamaUrl: 'http://example.invalid' });
  await helper.prewarmPromptCache();
  helper.ollamaUrl = 'http://127.0.0.1:11434';
  helper.ollamaModel = 'selected:3b-cloud';
  await helper.prewarmPromptCache();
  assert.equal(calls, 0);
  helper.ollamaModel = 'selected:3b';
  await helper.prewarmPromptCache();
  assert.equal(calls, 1, 'only a metadata request for the loopback alias');
});

test('switching models aborts a pending preload and retry survives errors', async t => {
  let firstSignal;
  let resolveShow;
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    if (calls === 1) {
      firstSignal = options.signal;
      return new Promise(resolve => { resolveShow = resolve; });
    }
    if (calls === 2) throw new Error('fixture');
    return Response.json(url.endsWith('/show') ? localMetadata : { done_reason: 'load' });
  });
  const helper = helperWith({ useOllama: true, ollamaModel: 'selected:3b', ollamaUrl: 'http://127.0.0.1:11434' });
  const first = helper.prewarmPromptCache();
  helper.setModel('ollama-other:3b');
  assert.equal(firstSignal.aborted, true);
  resolveShow(Response.json(localMetadata));
  await first;
  assert.equal(calls, 1);
  await helper.prewarmPromptCache();
  await helper.prewarmPromptCache();
  assert.equal(calls, 4, 'failed model inspection does not prevent a retry');
});
