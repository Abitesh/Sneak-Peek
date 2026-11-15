import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const primaryRoute = () => {
  const ipc = read('ipcHandlers.ts');
  const start = ipc.indexOf('// CHANGE 13: the canonical Sneak-Peek Intelligence Engine is now the PRIMARY');
  const legacy = ipc.indexOf('// Historical compatibility implementation below is unreachable.', start);
  assert.ok(start >= 0 && legacy > start, 'canonical and retained legacy boundaries exist');
  return ipc.slice(start, legacy);
};

test('Single primary manual-chat path is wired through Sneak-Peek Intelligence', () => {
  const ipc = read('ipcHandlers.ts');
  const runtime = read('intelligence/engine/CanonicalRuntime.ts');
  const engine = read('intelligence/engine/SneakPeekIntelligenceEngine.ts');
  const primary = primaryRoute();

  assert.match(primary, /createPrimaryManualSneakPeekEngine\(llmHelper, appState, requestId\)/);
  assert.match(primary, /const run = createAnswerExecution\(llmHelper, appState, sneakPeekRequest\)/);
  assert.match(runtime, /export function createPrimaryManualSneakPeekEngine\(/);
  assert.match(ipc, /Sneak-Peek Intelligence\] manual-chat PRIMARY route/);
  assert.doesNotMatch(primary, /buildV3Prompt\(|llmHelper\.streamChat\(/);
  assert.match(engine, /TurnUnderstanding|understandTurn/);
  assert.match(engine, /planContext/);
  assert.match(engine, /retrievalCoordinator\.retrieve/);
  assert.match(engine, /buildEvidencePackFromSneakPeekEvidence/);
  assert.match(engine, /assembleSneakPeekPrompt/);
  assert.match(engine, /generationPort/);
  assert.match(engine, /pipelineStages/);
  assert.match(engine, /ProviderRouter/);
  assert.match(engine, /GenerationController/);
});

test('Primary route has exactly one generation handoff and legacy is not reachable', () => {
  const primary = primaryRoute();
  assert.equal((primary.match(/createAnswerExecution\(/g) ?? []).length, 1);
  assert.equal((primary.match(/prepareAndStream\(/g) ?? []).length, 0);
  assert.equal((primary.match(/streamFinalPrompt\(/g) ?? []).length, 0);
  assert.match(primary, /if \(true as boolean\) \{/);
  assert.match(read('ipcHandlers.ts'), /return null;\s*\}\s*\}\s*\/\/ Historical compatibility implementation below is unreachable/);
});

test('Primary route does not let ordinary context or STOP fall through into a second generation', () => {
  const primary = primaryRoute();
  assert.match(primary, /cancellationSignal: myController\.signal/);
  assert.doesNotMatch(primary, /!context\s*&&/, 'ordinary context cannot bypass engine');
  assert.match(primary, /run\.lifecycle\.state === 'CANCELLED' \|\| myController\.signal\.aborted/);
  assert.match(primary, /STOP\/supersession is terminal/);
  assert.match(primary, /if \(run\.lifecycle\.state === 'COMPLETED'\)/);
  assert.match(primary, /settlePrimaryTurn\?\.\('failed'\)/);
});

test('Canonical entry enforces skill, image, source and sender guards', () => {
  const primary = primaryRoute();
  assert.match(primary, /canonicalSkillMatch/);
  assert.match(primary, /if \(!skill \|\| !skill\.enabled\)/);
  assert.match(primary, /canonicalSnapshot\.callerInstruction = options\?\.skipSystemPrompt/);
  assert.match(primary, /resolveAppImagePaths\(imagePaths\)/);
  assert.match(primary, /contextPermissions:\s*\{/);
  assert.match(primary, /profile: profileAvailable && !projectScope\.unresolvedReference/);
  assert.match(primary, /_chatStreamsBySender\.get\(senderId\)\?\.streamId !== myStreamId/);
});
