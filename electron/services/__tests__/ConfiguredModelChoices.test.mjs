import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Execute the production renderer loader with metadata fixtures. No provider,
// credential value, generation, daemon or network operation is involved.
const bundle = await build({ entryPoints: ['src/utils/configuredModels.ts'], bundle: true, write: false, format: 'esm', platform: 'browser' });
const { loadConfiguredModels, favoriteModelChoices } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
function fixture(t, overrides = {}) {
  const previous=Object.getOwnPropertyDescriptor(globalThis,'window');
  t.after(()=>{if(previous)Object.defineProperty(globalThis,'window',previous);else delete globalThis.window;});
  Object.defineProperty(globalThis,'window',{configurable:true,writable:true,value:{ electronAPI: {
    getStoredCredentials: async () => ({ hasGroqKey: true }),
    getCloudFetchedModels: async () => ({ models: { groq: [{ id: 'allam-2-7b', label: 'Allam' }] }, fetchedAt: {} }),
    getProviderHealth: async () => ({}), getAvailableOllamaModels: async () => [],
    getCustomProviders: async () => [], getProviderStatuses: async () => [],
    getAvailableLiteLLMModels: async () => [], getCodexCliConfig: async () => ({ enabled: false }),
    ...overrides,
  } }});
}
test('configured account chat IDs survive unchanged; missing keys and speech presets never become choices', async t => {
  fixture(t, { getCloudFetchedModels: async () => ({ models: {
    groq: [{ id: 'allam-2-7b', label: 'Allam' }, { id: 'whisper-large-v3', label: 'Speech' }],
    openai: [{ id: 'gpt-4o', label: 'GPT' }],
  }, fetchedAt: {} }) });
  assert.deepEqual(await loadConfiguredModels(), [{ id: 'allam-2-7b', label: 'Allam', provider: 'groq' }]);
});
test('disabled providers and allow-lists apply before favorites, including opt-in LiteLLM', async t => {
  fixture(t, {
    getStoredCredentials: async () => ({ hasGroqKey: true, disabledProviders: ['groq'], cloudEnabledModels: { litellm: ['litellm/openai/gpt-4o'] } }),
    getAvailableLiteLLMModels: async () => ['openai/gpt-4o', 'anthropic/claude-other'],
  });
  const choices=await loadConfiguredModels();
  assert.deepEqual(choices, [{ id: 'litellm/openai/gpt-4o', label: 'gpt-4o', provider: 'litellm' }]);
  assert.deepEqual(favoriteModelChoices(choices,{ groq:['allam-2-7b'],litellm:['litellm/openai/gpt-4o'] }),choices);
  window.electronAPI.getStoredCredentials=async()=>({});
  assert.deepEqual(await loadConfiguredModels(),[], 'an empty proxy permission list grants nothing');
});
test('exact access denial hides a model; quota failures retain it; refreshed discovery supersedes old denial', async t => {
  let message='HTTP 429: quota exhausted';
  let refreshed=0;
  const observed=Date.now()-1000;
  fixture(t, {
    getProviderStatuses: async () => [{ id:'answer:test',health:'degraded',message,updatedAt:new Date(observed).toISOString(),details:{provider:'groq',model:'allam-2-7b'} }],
    getCloudFetchedModels: async () => ({ models:{groq:[{id:'allam-2-7b',label:'Allam'}]},fetchedAt:{groq:refreshed} }),
  });
  assert.equal((await loadConfiguredModels()).length,1);
  message='HTTP 403: model access denied';
  assert.deepEqual(await loadConfiguredModels(),[]);
  refreshed=Date.now();
  assert.equal((await loadConfiguredModels()).length,1);
});
