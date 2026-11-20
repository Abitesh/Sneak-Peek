import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test('fresh built-in mode seeding does not compile via LLM; explicit custom creation still does', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-idle-seeding-'));
  process.env.NATIVELY_TEST_USERDATA = dir;
  const { ModesManager } = await import(pathToFileURL(path.resolve('dist-electron/electron/services/ModesManager.js')).href);
  const original = ModesManager.prototype.compileAllSectionsAsync;
  const calls = [];
  ModesManager.prototype.compileAllSectionsAsync = id => calls.push(id);
  t.after(() => { ModesManager.prototype.compileAllSectionsAsync = original; });
  const manager = ModesManager.getInstance();
  manager.ensureSeeded();
  assert.equal(manager.ensureBuiltinModes(), true);
  assert.equal(calls.length, 0, 'opening a fresh app must not invoke the section compiler');
  assert.ok(manager.getModes().length > 1, 'built-in modes still exist');
  const custom = manager.createMode({ name: 'Synthetic custom mode', templateType: 'general' });
  assert.deepEqual(calls, [custom.id], 'explicit custom creation retains its compiler');
  assert.ok(manager.getNoteSections(custom.id).length > 0, 'summary section fallback remains available');
});
