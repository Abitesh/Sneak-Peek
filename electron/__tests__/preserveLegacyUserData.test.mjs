import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../preserveLegacyUserData.ts', import.meta.url), 'utf8');
const built = path.resolve('dist-electron/electron/preserveLegacyUserData.js');

function runWithProfile({ packaged, names = [], testUserData = false }) {
  const appData = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-peek-profile-test-'));
  const calls = [];
  try {
    for (const name of names) fs.mkdirSync(path.join(appData, name));
    const app = {
      isPackaged: packaged,
      getPath(name) {
        assert.equal(name, 'appData');
        return appData;
      },
      setPath(name, value) { calls.push([name, value]); },
    };
    const code = fs.readFileSync(built, 'utf8');
    vm.runInNewContext(code, {
      require(name) { return name === 'electron' ? { app } : require(name); },
      process: { env: testUserData ? { NATIVELY_TEST_USERDATA: appData } : {} },
    }, { filename: built });
    return { appData, calls };
  } finally {
    fs.rmSync(appData, { recursive: true, force: true });
  }
}

test('legacy profile is selected before renamed app creates a fresh profile', () => {
  assert.match(source, /setPath\('userData', legacyPath\)/);
  const { appData, calls } = runWithProfile({ packaged: true, names: ['Natively'] });
  assert.deepEqual(calls, [
    ['userData', path.join(appData, 'Natively')],
    ['sessionData', path.join(appData, 'Natively')],
  ]);
});

test('new and isolated test profiles are left to Electron defaults', () => {
  assert.deepEqual(runWithProfile({ packaged: true }).calls, []);
  assert.deepEqual(runWithProfile({ packaged: true, names: ['Natively'], testUserData: true }).calls, []);
});
