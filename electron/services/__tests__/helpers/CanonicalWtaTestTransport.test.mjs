import test from 'node:test';
import assert from 'node:assert/strict';
import { installCanonicalWtaTestTransport } from './CanonicalWtaTestTransport.mjs';

test('fixture uses pinned local provider and the canonical final-prompt transport', async () => {
  const helper = { setNegotiationCoachingHandler() {} };
  const state = installCanonicalWtaTestTransport(helper, ['first', ' second'], { repairChunks: ['repaired'] });
  const route = helper.getSneakPeekGenerationRouteOptions(['transcript']);
  assert.deepEqual(route.allowedProviders, ['ollama']);
  assert.deepEqual(route.dataScopes, ['transcript']);
  const first = [];
  for await (const chunk of helper.streamFinalPrompt('ollama', 'canonical-test-only', 'prompt', {})) first.push(chunk);
  const repair = [];
  for await (const chunk of helper.streamFinalPrompt('ollama', 'canonical-test-only', 'repair', {})) repair.push(chunk);
  assert.deepEqual(first, ['first', ' second']);
  assert.deepEqual(repair, ['repaired']);
  assert.equal(state.calls.length, 2);
});

test('fixture never yields after the request aborts', async () => {
  const controller = new AbortController();
  const helper = {};
  installCanonicalWtaTestTransport(helper, ['first', 'second']);
  const values = [];
  for await (const chunk of helper.streamFinalPrompt('ollama', 'canonical-test-only', 'prompt', { abortSignal: controller.signal })) {
    values.push(chunk); controller.abort();
  }
  assert.deepEqual(values, ['first']);
});
