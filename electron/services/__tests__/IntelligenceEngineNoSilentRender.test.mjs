// Regression: the manual "What to answer" path must never return a non-null
// answer string WITHOUT also emitting a render signal.
//
// The renderer (SneakPeekInterface.handleWhatToSay) renders the answer from the
// 'suggested_answer' EVENT; the IPC return value's non-null answer is only used
// to detect the null/empty-feedback case. So an engine return path that returns
// a non-null string but emits NOTHING leaves the thinking-dots placeholder
// hanging forever — the user sees "no response at all". Two such silent
// dead-ends existed (no API key configured; empty legacy-answerLLM result).
// These tests pin that every manual outcome either emits or returns null.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installCanonicalWtaTestTransport } from './helpers/CanonicalWtaTestTransport.mjs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enginePath = path.resolve(__dirname, '../../../dist-electron/electron/IntelligenceEngine.js');
const sessionPath = path.resolve(__dirname, '../../../dist-electron/electron/SessionTracker.js');
const require = createRequire(import.meta.url);

const makeHelper = () => ({ setNegotiationCoachingHandler() {} });

async function makeEngine() {
  const { IntelligenceEngine } = await import(pathToFileURL(enginePath).href);
  const { SessionTracker } = require(sessionPath);
  const session = new SessionTracker();
  const engine = new IntelligenceEngine(makeHelper(), session);
  return { engine, session };
}

test('no LLM configured: manual WTA EMITS the config message (never a silent non-null return)', async () => {
  const { engine } = await makeEngine();
  // Force the unconfigured state.
  engine.whatToAnswerLLM = null;
  engine.answerLLM = null;

  const emitted = [];
  engine.on('suggested_answer', (a) => emitted.push(a));

  const answer = await engine.runWhatShouldISay('hi', 0.9, undefined, { skipCooldown: true });

  // INVARIANT: a non-null answer must have been emitted so the renderer shows it.
  assert.ok(answer && answer.includes('API Keys'), 'returns a useful provider setup message');
  assert.equal(emitted.length, 1, 'must emit exactly one suggested_answer so the placeholder resolves');
  assert.equal(emitted[0], answer, 'emitted text matches the returned answer');
});

test('no LLM configured + speculative: does NOT emit (no placeholder exists for speculation)', async () => {
  const { engine } = await makeEngine();
  engine.whatToAnswerLLM = null;
  engine.answerLLM = null;

  const emitted = [];
  engine.on('suggested_answer', (a) => emitted.push(a));

  // Speculative runs bypass the cooldown via isSpeculative and have no UI placeholder.
  const answer = await engine.runWhatShouldISay('hi', 0.9, undefined, { speculative: true });
  assert.equal(answer, null, 'setup feedback must never be eligible for speculative promotion');
  assert.equal(emitted.length, 0, 'speculative path must not emit a user-facing answer');
});

test('canonical provider returns empty: manual WTA resolves its placeholder without persisting a fake answer', async () => {
  const { engine, session } = await makeEngine();
  // The retired answerLLM is not a generation route under CHG-20.
  // Exercise the supported canonical provider boundary with zero tokens.
  installCanonicalWtaTestTransport(engine.llmHelper, []);

  const emitted = [];
  engine.on('suggested_answer', (a) => emitted.push(a));

  const answer = await engine.runWhatShouldISay('hi', 0.9, undefined, { skipCooldown: true });

  // INVARIANT: an explicit press is never a silent, blank result.
  assert.ok(typeof answer === 'string' && answer.trim(), 'must show a nonempty retry');
  assert.deepEqual(emitted, [answer], 'the renderer receives exactly the returned retry');
  assert.deepEqual(session.getFullUsage(), [], 'an empty provider output is not a successful answer');
});

test('canonical provider returns a real answer: emits it and returns it', async () => {
  const { engine } = await makeEngine();
  installCanonicalWtaTestTransport(engine.llmHelper, ['A real grounded answer.']);

  const emitted = [];
  engine.on('suggested_answer', (a) => emitted.push(a));

  const answer = await engine.runWhatShouldISay('hi', 0.9, undefined, { skipCooldown: true });
  assert.equal(answer, 'A real grounded answer.');
  assert.deepEqual(emitted, ['A real grounded answer.']);
});
