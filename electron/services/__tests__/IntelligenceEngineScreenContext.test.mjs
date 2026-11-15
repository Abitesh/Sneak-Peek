import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { installCanonicalWtaTestTransport } from './helpers/CanonicalWtaTestTransport.mjs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadIntelligenceEngine() {
  const enginePath = path.resolve(__dirname, '../../../dist-electron/electron/IntelligenceEngine.js');
  return import(pathToFileURL(enginePath).href);
}

async function loadSessionTracker() {
  const sessionPath = path.resolve(__dirname, '../../../dist-electron/electron/SessionTracker.js');
  return import(pathToFileURL(sessionPath).href);
}

class StubLLMHelper {
  getActiveModel() { return { provider: 'ollama', model: 'canonical-test-only' }; }
  isStreamingSupported() { return true; }
  setNegotiationCoachingHandler(_fn) { }
  getGeminiClient() { return null; }
  getOpenAIClient() { return null; }
  getClaudeClient() { return null; }
  getGroqClient() { return null; }
  getOllamaClient() { return null; }
  getModesManager() { return { getActiveMode: () => null, getActiveModeSystemPromptSuffix: () => '' }; }
  getSettingsManager() { return { get: () => null, set: () => {} }; }
}

async function makeEngine() {
  const { IntelligenceEngine } = await loadIntelligenceEngine();
  const { SessionTracker } = await loadSessionTracker();
  const session = new SessionTracker();
  const helper = new StubLLMHelper();
  installCanonicalWtaTestTransport(helper, []);
  const engine = new IntelligenceEngine(helper, session);
  return { engine, session, helper };
}

test('runWhatShouldISay passes screenContext and preserves imagePaths', async (t) => {
  const { engine, session } = await makeEngine();
  const calls = [];
  const fixtureDir = mkdtempSync(path.join(tmpdir(), 'sneak-work0072-screen-'));
  t.after(() => rmSync(fixtureDir, { recursive: true, force: true }));
  const imagePaths = [path.join(fixtureDir, 'screen.png')];
  // Synthetic 1x1 PNG: a real local file, not a nonexistent screenshot path.
  writeFileSync(imagePaths[0], Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmFoAAAAASUVORK5CYII=', 'base64'));
  const screenContext = {
    ocrText: 'Visible prompt: explain the error on screen',
    imagePath: imagePaths[0],
    timestamp: Date.now(),
    hash: 'screen-hash-1',
  };

  session.addTranscript({
    speaker: 'interviewer',
    text: 'What should we do here?',
    timestamp: Date.now(),
    final: true,
  });

  engine.llmHelper.streamFinalPrompt = async function* (provider, model, prompt, options) {
    calls.push({ provider, model, prompt, options });
    yield 'Use the visible error message to explain the fix.';
  };

  const answer = await engine.runWhatShouldISay(undefined, 0.8, imagePaths, {
    skipCooldown: true,
    screenContext,
  });

  assert.equal(answer, 'Use the visible error message to explain the fix.');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].provider, 'ollama');
  assert.equal(calls[0].model, 'canonical-test-only');
  assert.deepEqual(calls[0].options.imagePaths, imagePaths);
  assert.match(calls[0].prompt, /Visible prompt: explain the error on screen/);
  assert.ok(calls[0].options.abortSignal instanceof AbortSignal);
});

test('runWhatShouldISay forwards dynamic action promptInstruction to WhatToAnswerLLM', async () => {
  const { engine, session } = await makeEngine();
  const calls = [];

  session.addTranscript({
    speaker: 'interviewer',
    text: 'How should we respond to this objection?',
    timestamp: Date.now(),
    final: true,
  });

  engine.llmHelper.streamFinalPrompt = async function* (provider, model, prompt, options) {
    calls.push({ provider, model, prompt, options });
    yield 'Acknowledge the objection and ask a discovery question.';
  };

  const answer = await engine.runWhatShouldISay(undefined, 0.8, undefined, {
    skipCooldown: true,
    promptInstruction: 'DYNAMIC_ACTION_PROMPT_INSTRUCTION_SENTINEL',
  });

  assert.equal(answer, 'Acknowledge the objection and ask a discovery question.');
  assert.equal(calls.length, 1);
  assert.match(calls[0].prompt, /DYNAMIC_ACTION_PROMPT_INSTRUCTION_SENTINEL/);
});

test('runWhatShouldISay works without screenContext', async () => {
  const { engine, session } = await makeEngine();
  let receivedScreenContext = 'unset';

  session.addTranscript({
    speaker: 'interviewer',
    text: 'What should I answer?',
    timestamp: Date.now(),
    final: true,
  });

  engine.llmHelper.streamFinalPrompt = async function* (_provider, _model, prompt, options) {
    receivedScreenContext = options.imagePaths;
    assert.doesNotMatch(prompt, /<screen_context>/);
    yield 'Answer from transcript only.';
  };

  const answer = await engine.runWhatShouldISay(undefined, 0.8, undefined, { skipCooldown: true });

  assert.equal(answer, 'Answer from transcript only.');
  assert.equal(receivedScreenContext, undefined);
});
