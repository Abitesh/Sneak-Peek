// F-502 regression test (audit/autopilot-2026-08-18).
//
// streamContextPolicy documents pinnedModeId as the defence against a
// mid-request `modes:set-active` leaking a different mode's document content
// into an answer whose contract is scoped to the first mode. Only the WTA path
// ever produced it: desktop manual chat and phone-mirror chat both built
// StreamRouteOptions without it, so every mode read inside streamChat after an
// await resolved the LIVE ModesManager singleton.
//
// The phone surface was the worse half — unlike desktop it never registers in
// _chatStreamsBySender, so modes:set-active does not abort it either. It had
// neither the pin nor the abort.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const src = fs.readFileSync(path.join(root, 'electron/ipcHandlers.ts'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'electron/LLMHelper.ts'), 'utf8');

test('desktop manual chat pins the t0 mode id', () => {
  const blocks = [];
  for (let i = src.indexOf('answerType: answerPlan.answerType,'); i !== -1;
       i = src.indexOf('answerType: answerPlan.answerType,', i + 1)) {
    blocks.push(src.slice(i, i + 1600));
  }
  assert.ok(blocks.length > 0, 'no manual-chat StreamRouteOptions literal found');
  assert.ok(
    /pinnedModeId:\s*manualActiveMode\?\.id\s*\?\?\s*null/.test(blocks.join('\n')),
    'manual chat must pass the mode captured at request start (F-502)'
  );
});

test('phone-mirror chat captures a mode id at t0 and passes it to the canonical request', () => {
  assert.ok(/phonePinnedModeId\s*=\s*phoneModeInfo\?\.id\s*\?\?\s*null/.test(src),
    'the phone path must capture the active mode id at t0 (F-502)');
  const i = src.indexOf('const phoneRequest = buildPhoneMirrorCanonicalRequest(');
  assert.notEqual(i, -1);
  assert.ok(/modeId:\s*phonePinnedModeId\s*\?\?\s*undefined/.test(src.slice(i, i + 2000)),
    'the canonical phone request must carry the pinned mode ID (F-502)');
});

test('the phone pin is frozen into the canonical request before provider dispatch', () => {
  const capture = src.indexOf('phonePinnedModeId: string | null = null');
  const snapshot = src.indexOf('const phoneMode = phonePinnedModeInfo;');
  const request = src.indexOf('const phoneRequest = buildPhoneMirrorCanonicalRequest(');
  const stream = src.indexOf('const streamResult = await streamRagEngineAnswer(');
  assert.ok(capture >= 0 && snapshot > capture && request > snapshot && stream > request,
    'the t0 mode must be captured and passed to the canonical request before provider dispatch');
  assert.match(src.slice(request, stream), /modeSourceContract: phoneMode\?\.sourceContract/,
    'canonical phone planning must receive the persisted source contract pinned at t0');
  assert.doesNotMatch(src.slice(request, stream + 100), /llmHelper\.streamChat\(/,
    'phone answers must not use a second unpinned legacy generation path');
});

test('LLMHelper still honours the pin (pinning must not be theatre)', () => {
  assert.ok(/routeOptions\?\.pinnedModeId\s*\?\?\s*null/.test(helper),
    'LLMHelper must resolve the pinned mode rather than the live singleton');
});
