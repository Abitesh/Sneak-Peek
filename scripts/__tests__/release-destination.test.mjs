import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('release upload finds Sneak-Peek installers and requires an explicit destination', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-release-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.mkdirSync(path.join(dir, 'release'));
  fs.copyFileSync(new URL('../upload-release.mjs', import.meta.url), path.join(dir, 'scripts/upload-release.mjs'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '2.8.7', build: { productName: 'Sneak-Peek' } }));
  fs.writeFileSync(path.join(dir, 'release/Sneak-Peek-2.8.7-arm64.dmg'), '');
  const env = { ...process.env };
  delete env.GDRIVE_FOLDER_ID;
  delete env.NATIVELY_SKIP_RELEASE_UPLOAD;
  delete env.SNEAK_PEEK_SKIP_RELEASE_UPLOAD;
  delete env.NATIVELY_RELEASE_VERSION;
  delete env.SNEAK_PEEK_RELEASE_VERSION;
  const args = [path.join(dir, 'scripts/upload-release.mjs')];
  const blocked = spawnSync(process.execPath, args, { env, encoding: 'utf8' });
  assert.equal(blocked.status, 1);
  assert.match(blocked.stdout, /found 1 dmg/);
  assert.match(blocked.stderr, /Set GDRIVE_FOLDER_ID/);
  const skipped = spawnSync(process.execPath, args, { env: { ...env, SNEAK_PEEK_SKIP_RELEASE_UPLOAD: '1' }, encoding: 'utf8' });
  assert.equal(skipped.status, 0);
  assert.match(skipped.stdout, /skipped/);
});

test('packaged updates are configured for the owner repository', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.ok(pkg.build.publish.some(({ provider, owner, repo }) => provider === 'github' && owner === 'Abitesh' && repo === 'Sneak-Peek'));
});
