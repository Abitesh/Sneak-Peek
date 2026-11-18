#!/usr/bin/env node
// scripts/upload-release.mjs
//
// Upload release DMGs to an explicitly configured Google Drive folder.
// Configure GDRIVE_FOLDER_ID and verify the gdrive: account before use.
// SNEAK_PEEK_SKIP_RELEASE_UPLOAD=1 skips the upload.
// SNEAK_PEEK_RELEASE_VERSION overrides the package version.
// Historical NATIVELY_ variables remain accepted for existing automation.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID;
// Drive's rclone backend needs the folder id passed via `--drive-root-folder-id`
// when the destination path itself starts with `/` (i.e. rooted). The curly-brace
// path syntax (`gdrive:{folderid}/`) is ambiguous: if a sibling folder whose
// literal NAME is "{folderid}" exists, rclone routes the file there instead of
// resolving the id (verified 2026-07-08: file landed in a sibling folder named
// literally `{18efvri8m_JBwuVdD3AxrCG8QZ_SbghSn}`). The flag form is unambiguous.
const GDRIVE_REMOTE = 'gdrive:/';
const RCLONE_BIN = process.env.RCLONE_BIN || 'rclone';
// Common rclone args applied to every operation. `--drive-root-folder-id` scopes
// the operation to a specific folder by id, regardless of any path/name collision.
const RCLONE_DRIVE_ARGS = ['--drive-root-folder-id', GDRIVE_FOLDER_ID];

async function main() {

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', ...opts });
}

function fail(msg, code = 1) {
  console.error(`[upload-release] ${msg}`);
  process.exit(code);
}

// 1. Resolve version: env override > package.json
const pkg = readJson(path.join(repoRoot, 'package.json'));
const version = (process.env.SNEAK_PEEK_RELEASE_VERSION || process.env.NATIVELY_RELEASE_VERSION || pkg.version || '').replace(/^v/, '');
if (!/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/.test(version)) {
  fail(`could not resolve a valid version (got "${version}"). Set SNEAK_PEEK_RELEASE_VERSION or fix package.json#version.`);
}
console.log(`[upload-release] version = ${version}`);

// 2. Find the signed .dmg — search both dist/ and release/ (electron-builder's
//    `output` setting + afterAllArtifactBuild's path resolution vary by build).
//    Match the product name used by Electron Builder for all supported macOS architectures.
const productName = pkg.build?.productName || pkg.productName || pkg.name || 'Sneak-Peek';
const escapedName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dmgRegexes = [
  new RegExp(`^${escapedName}(?:-Setup)?-${escapedVersion}(?:-(?:arm64|x64))?\\.dmg$`, 'i'),
];
const searchDirs = ['dist', 'release'].map((d) => path.join(repoRoot, d));

const candidates = [];
for (const dir of searchDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.dmg') && dmgRegexes.some((re) => re.test(f))) {
      candidates.push(path.join(dir, f));
    }
  }
}
if (candidates.length === 0) {
  fail(
    `no signed .dmg matching version ${version} found.\n` +
    `  Looked in: ${searchDirs.join(', ')}\n` +
    `  Did \`npm run dist:signed\` finish successfully?`,
  );
}
// Dedupe by basename (the same file can match multiple patterns if version is bare).
const seen = new Set();
const uniqueDmgs = candidates.filter((p) => {
  if (seen.has(path.basename(p))) return false;
  seen.add(path.basename(p));
  return true;
});
console.log(`[upload-release] found ${uniqueDmgs.length} dmg(s):`);
for (const d of uniqueDmgs) {
  const sz = fs.statSync(d).size;
  console.log(`  - ${path.relative(repoRoot, d)}  (${(sz / 1024 / 1024).toFixed(1)} MiB)`);
}

// 3. Skip if requested
const skipUpload = process.env.SNEAK_PEEK_SKIP_RELEASE_UPLOAD ?? process.env.NATIVELY_SKIP_RELEASE_UPLOAD;
if (skipUpload === '1') {
  console.log('[upload-release] release upload skipped.');
  process.exit(0);
}

if (!GDRIVE_FOLDER_ID) fail('Set GDRIVE_FOLDER_ID to your verified release folder before uploading.');

// 4. Confirm in interactive mode (TTY) — auto-upload only if -y / CI / explicit yes
const autoYes =
  skipUpload !== 'prompt' &&
  (process.env.CI === 'true' || process.env.CI === '1' || !process.stdin.isTTY || process.argv.includes('-y'));
if (skipUpload !== 'prompt' && !autoYes && process.stdin.isTTY) {
  console.log(`[upload-release] about to upload ${uniqueDmgs.length} file(s) to Google Drive folder`);
  console.log(`              ${GDRIVE_REMOTE}`);
  console.log('              (re-run with -y or set CI=1 to skip this prompt)');
  // Read a single line of input. If non-TTY or stdin is closed, default to yes so
  // the build doesn't hang in pipelines that forgot to set CI.
  const answer = await new Promise((resolve) => {
    process.stdout.write('              Proceed? [y/N] ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (d) => resolve(d.toString().trim().toLowerCase()));
    process.stdin.once('end', () => resolve('y'));
  });
  if (answer !== 'y' && answer !== 'yes') {
    console.log('[upload-release] aborted by user.');
    process.exit(0);
  }
}

// 5. Verify rclone + remote exist
try {
  sh(RCLONE_BIN, ['version']);
} catch (e) {
  fail(`rclone not found at "${RCLONE_BIN}". Install via "brew install rclone" or set RCLONE_BIN.`);
}
try {
  sh(RCLONE_BIN, ['listremotes']);
} catch (e) {
  fail(`rclone cannot list remotes (no config?). Run "rclone config" to set up "gdrive:".`);
}

// 6. Upload each .dmg. Use `copyto` (not `copy`) so the destination filename
//    matches the source — preserves release filenames exactly,
//    which is what latest-mac.yml expects for auto-updater sanity.
//    `--drive-root-folder-id` scopes the destination to the real target folder
//    and bypasses any sibling folder whose name happens to look like a path.
for (const dmg of uniqueDmgs) {
  const name = path.basename(dmg);
  const dest = `${GDRIVE_REMOTE}${name}`;
  console.log(`[upload-release] uploading ${name} → gdrive folder ${GDRIVE_FOLDER_ID}`);
  try {
    // -v so progress shows; --stats-one-line so the summary is compact.
    const out = sh(RCLONE_BIN, ['copyto', '-v', '--stats-one-line', '--stats=10s', dmg, dest, ...RCLONE_DRIVE_ARGS]);
    process.stdout.write(out);
  } catch (e) {
    const stderr = e?.stderr?.toString?.() || e?.message || String(e);
    fail(`rclone copyto failed for ${name}:\n${stderr}`);
  }
}

// 7. Verify the upload landed by listing the folder.
console.log('[upload-release] verifying upload…');
try {
  const listed = sh(RCLONE_BIN, ['lsf', ...RCLONE_DRIVE_ARGS, GDRIVE_REMOTE]);
  const uploadedNames = listed.split('\n').filter(Boolean);
  for (const dmg of uniqueDmgs) {
    const name = path.basename(dmg);
    if (!uploadedNames.includes(name)) {
      fail(`verification failed: ${name} not visible in folder ${GDRIVE_FOLDER_ID} after upload.`);
    }
  }
  console.log(`[upload-release] ✓ all ${uniqueDmgs.length} dmg(s) verified in Drive folder.`);
} catch (e) {
  // Listing by folder-id can return "directory not found" even when the folder
  // exists + accepts writes (see GOTCHA in header). Trust the copy exit code
  // (which is non-zero on real failure) and warn instead of failing here.
  const stderr = e?.stderr?.toString?.() || '';
  console.warn(`[upload-release] WARNING: post-upload verification skipped: ${stderr.trim() || e.message}`);
}

console.log('[upload-release] done.');
}

main().catch((e) => {
  console.error('[upload-release] unexpected error:', e?.stack || e?.message || String(e));
  process.exit(1);
});