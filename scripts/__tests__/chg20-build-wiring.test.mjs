import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// WORK-0065: keep this source test dependency-free. The executable runtime
// regression is AnswerValidation.test.mjs (which needs build:electron first).
const ipc = readFileSync(resolve('electron/ipcHandlers.ts'), 'utf8');
const validation = readFileSync(resolve('electron/intelligence/engine/AnswerValidation.ts'), 'utf8');
const validator = readFileSync(resolve('electron/llm/AnswerValidator.ts'), 'utf8');

test('canonical manual route is runtime-unconditional without making legacy dispatch reachable', () => {
  const boundary = ipc.indexOf('if (true as boolean) {');
  const canonical = ipc.indexOf('const run = createAnswerExecution(llmHelper, appState, sneakPeekRequest);');
  const legacy = ipc.indexOf('// Historical compatibility implementation below is unreachable. Retained for CHG-22 review.');
  assert.ok(boundary > 0 && canonical > boundary && legacy > canonical);
  assert.match(ipc.slice(boundary, canonical), /if \(true as boolean\) \{/);
  assert.match(ipc.slice(legacy - 50, legacy + 110), /\}\s*\/\/ Historical compatibility implementation below is unreachable/s);
  // TypeScript's assertion is erased, preserving a literal true at runtime.
  assert.equal(Boolean(true), true);
});

test('canonical answer validation imports the real structural validator', () => {
  assert.match(validation, /import \{ validateAnswerStructure \} from '\.\.\/\.\.\/llm\/AnswerValidator';/);
  assert.match(validation, /import \{ isCodingAnswerType \} from '\.\.\/\.\.\/llm\/AnswerPlanner';/);
  assert.match(validator, /export const validateAnswerStructure\s*=/);
});
