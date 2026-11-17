import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerationController } from '../../../../dist-electron/electron/intelligence/engine/GenerationController.js';

function route(overrides = {}) {
  return {
    capability: 'stream_chat',
    availability: { hasGroq: true, hasGemini: true },
    models: { groq: 'qwen/qwen3.8-27b', geminiFlash: 'gemini-3.7-flash' },
    ...overrides,
  };
}

async function collect(stream) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

test('pre-first-token provider failure falls back and emits only one final answer', async () => {
  const calls = [];
  const transport = {
    async *streamFinalPrompt(provider, model, finalPrompt) {
      calls.push({ provider, model, finalPrompt });
      if (provider === 'groq') throw new Error('Gemini/Groq unavailable before first token');
      yield 'fallback answer';
    },
  };

  const controller = new GenerationController(transport);
  const { stream, outcome } = controller.stream({
    requestId: 'r1',
    finalPrompt: '<final_prompt>What is Redis?</final_prompt>',
    route: route(),
  });

  assert.equal(await collect(stream), 'fallback answer');
  assert.equal(outcome.status, 'completed');
  assert.equal(outcome.lifecycle.state, 'COMPLETED');
  assert.deepEqual(outcome.lifecycle.history.map((entry) => entry.state), ['IDLE', 'GENERATING', 'COMMITTED', 'COMPLETED']);
  assert.equal(outcome.fallbackUsed, true);
  assert.equal(outcome.committedProvider, 'gemini_flash');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].finalPrompt, calls[1].finalPrompt);
});

test('post-commit provider failure never appends a second provider answer', async () => {
  const calls = [];
  const transport = {
    async *streamFinalPrompt(provider) {
      calls.push(provider);
      yield 'partial answer';
      throw new Error('connection dropped after first token');
    },
  };

  const controller = new GenerationController(transport);
  const { stream, outcome } = controller.stream({
    requestId: 'r2',
    finalPrompt: 'final prompt',
    route: route(),
  });

  assert.equal(await collect(stream), 'partial answer');
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.lifecycle.state, 'FAILED');
  assert.equal(outcome.fallbackUsed, false);
  assert.equal(calls.length, 1);
  assert.match(outcome.error, /after commit/i);
});

test('first visible token establishes provider commit and first-token timing', async () => {
  const transport = {
    async *streamFinalPrompt() {
      yield 'hello';
      yield ' world';
    },
  };

  const controller = new GenerationController(transport);
  const { stream, outcome } = controller.stream({
    requestId: 'r3',
    finalPrompt: 'final prompt',
    route: route({ maxAttempts: 1 }),
  });

  assert.equal(await collect(stream), 'hello world');
  assert.equal(outcome.status, 'completed');
  assert.equal(outcome.firstTokenAt !== undefined, true);
  assert.equal(outcome.firstTokenLatencyMs !== undefined, true);
  assert.equal(outcome.committedProvider, 'groq');
  assert.equal(outcome.attempts[0].status, 'succeeded');
  assert.equal(outcome.attempts[0].firstTokenAt !== undefined, true);
});

test('abort before generation produces no provider call', async () => {
  const calls = [];
  const controller = new GenerationController({
    async *streamFinalPrompt() {
      calls.push('called');
      yield 'should not happen';
    },
  });

  const abort = new AbortController();
  abort.abort();
  const { stream, outcome } = controller.stream({
    requestId: 'r4',
    finalPrompt: 'final prompt',
    route: route(),
    abortSignal: abort.signal,
  });

  assert.equal(await collect(stream), '');
  assert.equal(outcome.status, 'cancelled');
  assert.equal(calls.length, 0);
});

test('cancellation during streaming stops output without fallback', async () => {
  const abort = new AbortController();
  const calls = [];
  const transport = {
    async *streamFinalPrompt(provider, _model, _prompt, options) {
      calls.push(provider);
      yield 'first';
      abort.abort();
      yield 'second';
    },
  };

  const controller = new GenerationController(transport);
  const { stream, outcome } = controller.stream({
    requestId: 'r5',
    finalPrompt: 'final prompt',
    route: route(),
    abortSignal: abort.signal,
  });

  assert.equal(await collect(stream), 'first');
  assert.equal(outcome.status, 'cancelled');
  assert.equal(outcome.lifecycle.state, 'CANCELLED');
  assert.equal(calls.length, 1);
});

test('unavailable providers are skipped by the generation controller', async () => {
  const calls = [];
  const controller = new GenerationController({
    async *streamFinalPrompt(provider) {
      calls.push(provider);
      yield 'answer';
    },
  });

  const { stream, outcome } = controller.stream({
    requestId: 'r6',
    finalPrompt: 'final prompt',
    route: {
      capability: 'stream_chat',
      availability: { hasGroq: false, hasGemini: true },
      models: { geminiFlash: 'gemini-3.7-flash' },
      preferredProvider: 'groq',
    },
  });

  assert.equal(await collect(stream), 'answer');
  assert.deepEqual(calls, ['gemini_flash']);
  assert.equal(outcome.committedProvider, 'gemini_flash');
});


test('terminal diagnostics distinguish outage and quota without exporting response contents', async t => {
  const logs = t.mock.method(console, 'warn', () => {});
  const controller = new GenerationController({
    async *streamFinalPrompt(provider) {
      const status = provider === 'gemini_flash' ? 503 : 429;
      const vendorMessage = status === 429 ? 'Daily quota exhausted: private token canary' : 'private prompt and token canary';
      throw Object.assign(new Error(vendorMessage), { status });
    },
  });
  const { stream, outcome } = controller.stream({
    requestId: 'sanitized-failure',
    finalPrompt: 'private test input',
    route: route({ preferredProvider: 'gemini_flash', allowedProviders: ['gemini_flash', 'groq'] }),
  });
  assert.equal(await collect(stream), '');
  assert.equal(outcome.status, 'failed');
  assert.match(outcome.error, /Gemini .*503.*groq .*429.*quota/i);
  assert.equal(outcome.lifecycle.history.at(-1).reason, outcome.error);
  assert.doesNotMatch(JSON.stringify([outcome, logs.mock.calls.map(c => c.arguments)]), /canary|private test input/);
});


test('a cloud attempt that never opens is bounded and falls back once without late output', async () => {
  const calls = [];
  let release;
  const held = new Promise(resolve => { release = resolve; });
  const controller = new GenerationController({
    async *streamFinalPrompt(provider, _model, _prompt, options) {
      calls.push({ provider, signal: options.abortSignal });
      if (provider === 'gemini_flash') {
        await held;
        yield 'late primary output';
      } else yield 'verified fallback output';
    },
  });
  const { stream, outcome } = controller.stream({
    requestId: 'bounded-first-token',
    finalPrompt: 'test prompt',
    route: route({ preferredProvider: 'gemini_flash', allowedProviders: ['gemini_flash', 'groq'] }),
    cloudFirstTokenTimeoutMs: 15,
  });
  try {
    assert.equal(await collect(stream), 'verified fallback output');
    assert.equal(outcome.committedProvider, 'groq');
    assert.equal(calls[0].signal.aborted, true);
    assert.match(outcome.attempts[0].error, /timed out/i);
  } finally { release(); }
});

test('the first-token deadline does not truncate an already committed stream', async () => {
  let signal;
  const controller = new GenerationController({
    async *streamFinalPrompt(_provider, _model, _prompt, options) {
      signal = options.abortSignal;
      yield 'partial ';
      await new Promise(resolve => setTimeout(resolve, 25));
      yield 'completion';
    },
  });
  const { stream, outcome } = controller.stream({
    requestId: 'committed-first-token',
    finalPrompt: 'test prompt',
    route: route({ maxAttempts: 1 }),
    cloudFirstTokenTimeoutMs: 10,
  });
  assert.equal(await collect(stream), 'partial completion');
  assert.equal(outcome.status, 'completed');
  assert.equal(signal.aborted, false);
});


test('a temporary 429 describes rate limiting and makes only one permitted request', async () => {
  const calls = [];
  const controller = new GenerationController({
    async *streamFinalPrompt(provider) {
      calls.push(provider);
      throw Object.assign(new Error('requests per minute exceeded'), { status: 429 });
    },
  });
  const { stream, outcome } = controller.stream({
    requestId: 'one-rate-limited-attempt',
    finalPrompt: 'test prompt',
    route: route({ preferredProvider: 'gemini_flash', allowedProviders: ['gemini_flash'] }),
  });
  assert.equal(await collect(stream), '');
  assert.match(outcome.error, /rate-limited/);
  assert.doesNotMatch(outcome.error, /exhausted quota/);
  assert.deepEqual(calls, ['gemini_flash']);
});
