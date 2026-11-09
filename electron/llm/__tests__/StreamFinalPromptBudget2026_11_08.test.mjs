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
