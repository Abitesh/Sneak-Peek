import test from 'node:test';
import assert from 'node:assert/strict';
import { routeGenerationProviders } from '../../../../dist-electron/electron/llm/ProviderRouter.js';

test('generation routing honors an explicit preferred provider without semantic context decisions', () => {
  const attempts = routeGenerationProviders({
    capability: 'stream_chat',
    availability: { hasGroq: true, hasGemini: true },
    models: { groq: 'qwen/qwen3.8-27b', geminiFlash: 'gemini-3.7-flash' },
    preferredProvider: 'gemini_flash',
    maxAttempts: 2,
  });

  assert.deepEqual(attempts.map((a) => a.provider), ['gemini_flash', 'groq']);
  assert.equal(attempts[0].model, 'gemini-3.7-flash');
});

test('generation routing applies an explicit provider allow-list', () => {
  const attempts = routeGenerationProviders({
    capability: 'stream_chat',
    availability: { hasGroq: true, hasGemini: true },
    models: { groq: 'qwen/qwen3.8-27b', geminiFlash: 'gemini-3.7-flash' },
    allowedProviders: ['gemini_flash'],
  });

  assert.deepEqual(attempts.map((a) => a.provider), ['gemini_flash']);
});

test('explicit gateway preserves its model and forbids cross-provider fallbacks', () => {
  for (const provider of ['nvidia_nim', 'litellm']) {
    const model = `${provider}/fixture-model`;
    const options = {
      capability: 'stream_chat', preferredProvider: provider, allowedProviders: [provider],
      models: { [provider]: model },
      availability: { hasNvidiaNim: true, hasLiteLLM: true, hasOpenAI: true },
    };
    assert.deepEqual(routeGenerationProviders(options).map(a => [a.provider, a.model, a.status]),
      [[provider, model, 'available']]);
    assert.equal(routeGenerationProviders({ ...options, dataScopes: ['transcript'], scopePolicy: { transcript: false } })[0].status, 'unavailable');
    assert.deepEqual(routeGenerationProviders({ ...options, allowedProviders: [] }), []);
    assert.deepEqual(routeGenerationProviders({ ...options, multimodal: true, capability: 'vision' }), []);
  }
});

test('custom text transport selection respects opaque provider ID, outbound scopes and disabled providers', () => {
  const options = {
    capability: 'stream_chat', preferredProvider: 'custom', allowedProviders: ['custom'],
    models: { custom: 'fixture-custom' }, availability: { hasCustom: true },
    dataScopes: ['transcript'], scopePolicy: { transcript: false },
  };
  assert.equal(routeGenerationProviders(options)[0].status, 'unavailable');
  const allowed = { ...options, scopePolicy: { transcript: true } };
  assert.equal(routeGenerationProviders(allowed)[0].status, 'available');
  for (const off of ['custom', 'fixture-custom']) {
    assert.equal(routeGenerationProviders({ ...allowed, disabledProviders: [off] })[0].status, 'unavailable');
  }
});

test('only the selected image-capable custom binding can dispatch an image', () => {
  const options = {
    capability: 'vision', multimodal: true, preferredProvider: 'custom', allowedProviders: ['custom'],
    models: { custom: 'fixture-vision' }, availability: { hasCustom: true, customSupportsVision: true, hasOpenAI: true },
    dataScopes: ['screenshots'],
  };
  const attempts = routeGenerationProviders(options);
  assert.deepEqual(attempts.map(item => [item.provider, item.model, item.status]), [['custom', 'fixture-vision', 'available']]);
  assert.equal(routeGenerationProviders({ ...options, scopePolicy: { screenshots: false } })[0].status, 'unavailable');
  assert.equal(routeGenerationProviders({ ...options, availability: { hasCustom: true } })[0].unavailableReason, 'unsupported_capability');
});
