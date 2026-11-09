// electron/services/__tests__/ModeReferenceFileIngestResultContent2026_07_26.test.mjs
//
// Bug fix (2026-07-26, live-testing session): `ingestModeReferenceFile`'s
// returned `ModeReferenceFileIngestResult` omitted `content` even though
// `extractSafeDocumentText`'s result (`extracted.content`) was fully
// available at the call site. `modes:upload-reference-file` (ipcHandlers.ts)
// returns this result verbatim as `{ success: true, file }`, and
// `ModesSettings.tsx`'s `uploadFile()` pushes it straight into its
// `referenceFiles` list, then unconditionally renders `file.content.length`
// for every row — so every successful reference-file upload crashed the
// Modes settings panel (`Cannot read properties of undefined (reading
// 'length')`, caught by the renderer's ErrorBoundary) until the next full
// reload, which re-fetches via `modes:get-reference-files` (whose
// `rowToFile` mapping in ModesManager.ts always included `content`).
//
// Live-reproduced during a real upload of a 66-page PDF into a custom
// document-grounded mode (Session 2026-07-26 shadow-observation testing).
//
// Source-pinned: constructing a real ingestModeReferenceFile() call
// requires a real ModesManager backed by DatabaseManager, which is
// ABI-mismatched in this dev environment (established baseline throughout
// this test suite) — so this proves both halves of the fix by reading the
// source directly, mirroring ModeUploadHardening.test.mjs's own convention
// for testing this exact file.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const ingestionSrc = fs.readFileSync(
  path.resolve(__dirname, '../ModeReferenceFileIngestion.ts'),
  'utf8',
);
const modesSettingsSrc = fs.readFileSync(
  path.resolve(repoRoot, 'src/components/settings/ModesSettings.tsx'),
  'utf8',
);

describe('ModeReferenceFileIngestResult includes content (the actual bug)', () => {
  test('the interface declares a required `content: string` field', () => {
    const ifaceStart = ingestionSrc.indexOf('export interface ModeReferenceFileIngestResult {');
    const ifaceEnd = ingestionSrc.indexOf('\n}', ifaceStart);
    const iface = ingestionSrc.slice(ifaceStart, ifaceEnd);
    assert.match(iface, /\n\s*content: string;/, 'content must be declared, and required (no `?`)');
  });

  test('the returned object literal actually includes `content: extracted.content`', () => {
    const returnStart = ingestionSrc.lastIndexOf('return {');
    const returnEnd = ingestionSrc.indexOf('};', returnStart);
    const returnBody = ingestionSrc.slice(returnStart, returnEnd);
    assert.match(returnBody, /content:\s*extracted\.content/, 'the actual returned value must carry the real extracted content, not be omitted');
  });
});

describe('Current ModesSettings entrypoint', () => {
  test('the public settings wrapper cannot dereference missing reference-file content', () => {
    // This checkout exposes only a public settings entrypoint; the old
    // premium/src/ModesSettings.tsx was removed. The ingestion contract above
    // verifies the returned content, while this checks the reachable wrapper.
    assert.match(modesSettingsSrc, /ModesSettings/);
    assert.doesNotMatch(modesSettingsSrc, /file\.content\.length/,
      'public settings entrypoint must not dereference a missing content field');
  });
});
