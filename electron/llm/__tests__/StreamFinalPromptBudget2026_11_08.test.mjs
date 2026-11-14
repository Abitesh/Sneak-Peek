// WORK-0033: the canonical Intelligence Engine provider transport is also bounded.
// Uses a fake streaming provider, so no API keys or paid model calls are needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LLMHelper } from '../../../dist-electron/electron/LLMHelper.js';
import { MAX_STREAM_OUTPUT_CHARS } from '../../../dist-electron/electron/llm/liveDeadlines.js';

test('streamFinalPrompt caps a runaway provider and reports incomplete instead of success', async () => {
  let produced = 0;
  const fake = Object.create(LLMHelper.prototype);
  fake.streamWithGroq = async function* () {
    for (let i = 0; i < Math.ceil(MAX_STREAM_OUTPUT_CHARS / 1000) + 4; i++) {
      produced++;
      yield 'x'.repeat(1000);
    }
  };
  let emitted = 0;
  let error = null;
  try {
    for await (const chunk of fake.streamFinalPrompt('groq', 'fake-model', 'safe synthetic prompt')) {
      emitted += chunk.length;
    }
  } catch (e) { error = e; }
  assert.ok(error && /generation_output_cap_reached/.test(String(error.message)),
    'canonical provider path must reject a capped partial stream as incomplete');
  assert.ok(emitted > 0 && emitted <= MAX_STREAM_OUTPUT_CHARS + 1000, 'overshoot must not exceed one chunk');
  assert.ok(produced <= Math.ceil(MAX_STREAM_OUTPUT_CHARS / 1000) + 1, 'underlying runaway provider must be stopped');
});

test('streamFinalPrompt completes normally when the provider stays below the cap', async () => {
  const fake = Object.create(LLMHelper.prototype);
  fake.streamWithGroq = async function* () { yield 'Hello '; yield 'world.'; };
  let answer = '';
  for await (const chunk of fake.streamFinalPrompt('groq', 'fake-model', 'synthetic prompt')) answer += chunk;
  assert.equal(answer, 'Hello world.');
});

test('canonical vision forwards the selected model, validated attachment and cancellation signal', async () => {
  const fake = Object.create(LLMHelper.prototype);
  const controller = new AbortController();
  const images = ['synthetic-screenshot.png'];
  fake.assertOutboundImagesAllowed = (provider, hasImages) => assert.deepEqual([provider, hasImages], ['openai', true]);
  fake.streamWithOpenaiMultimodal = async function* (prompt, paths, system, model, signal) {
    assert.deepEqual([prompt, paths, system, model, signal],
      ['canonical hint prompt', images, '', 'fixture-vision', controller.signal]);
    yield 'A hint.';
  };
  const chunks = [];
  for await (const chunk of fake.streamFinalPrompt('openai', 'fixture-vision', 'canonical hint prompt',
    { imagePaths: images, abortSignal: controller.signal })) chunks.push(chunk);
  assert.deepEqual(chunks, ['A hint.']);
  fake.isLocalOnlyMode = true;
  await assert.rejects(fake.streamFinalPrompt('openai', 'fixture-vision', 'canonical hint prompt',
    { imagePaths: images }).next(), /Cloud providers disabled/);
});

test('canonical gateway transport uses the selected model snapshot after a setting changes', async () => {
  for (const [provider, method] of [['litellm', 'streamWithLiteLLM'], ['nvidia_nim', 'streamWithNvidiaNim']]) {
    const fake = Object.create(LLMHelper.prototype);
    fake.currentModelId = 'unrelated-new-selection';
    fake[method] = async function* (prompt, system, images, signal, model) {
      assert.equal(model, `${provider}/selected-model`);
      assert.equal(prompt, 'canonical prompt');
      assert.equal(images, undefined);
      yield 'Selected result.';
    };
    assert.deepEqual(await fake.streamFinalPrompt(provider, `${provider}/selected-model`, 'canonical prompt').next(),
      { value: 'Selected result.', done: false });
  }
});

test('canonical custom selection fails if the active provider changes', async () => {
  const fake = Object.create(LLMHelper.prototype);
  fake.customProvider = { id: 'different-provider' };
  fake.streamWithCustom = async function* () { assert.fail('custom dispatch after selection changed'); };
  await assert.rejects(fake.streamFinalPrompt('custom', 'original-provider', 'canonical prompt').next(),
    /selected custom provider is no longer available/);
});

test('canonical custom and cURL vision dispatch forward one image without permitting silent image loss', async () => {
  const template = `curl https://example.invalid -d '{"image":"{{IMAGE_BASE64}}"}'`;
  const controller = new AbortController();
  for (const streaming of [true, false]) {
    const fake = Object.create(LLMHelper.prototype);
    fake[streaming ? 'customProvider' : 'activeCurlProvider'] = { id: 'fixture', curlCommand: template };
    fake.assertOutboundImagesAllowed = () => {};
    fake.isProviderDisabled = () => false;
    fake.streamWithCustom = async function* (...args) {
      assert.ok(streaming);
      assert.deepEqual(args, ['canonical prompt', undefined, ['fixture.png'], '', controller.signal, true]);
      yield 'Result';
    };
    fake.executeCustomProvider = async (...args) => {
      assert.ok(!streaming);
      assert.deepEqual(args, [template, 'canonical prompt', '', 'canonical prompt', '', 'fixture.png', controller.signal, true]);
      return 'Result';
    };
    const invoke = imagePaths => fake.streamFinalPrompt('custom', 'fixture', 'canonical prompt', { imagePaths, abortSignal: controller.signal }).next();
    assert.deepEqual(await invoke(['fixture.png']), { value: 'Result', done: false });
    await assert.rejects(invoke(['fixture.png', 'second.png']), /exactly one image/);
    fake.isLocalOnlyMode = true;
    await assert.rejects(invoke(['fixture.png']), /Cloud providers disabled/);
  }
});
