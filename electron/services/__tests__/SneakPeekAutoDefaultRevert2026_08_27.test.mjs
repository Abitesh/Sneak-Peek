// CredentialsManager.revertNativelyAutoDefaults — the undo for a key the server
// turns out to refuse.
//
// setNativelyApiKey() promotes the default model (and STT) to 'natively' and
// SAVES before anything has checked the key works. In the 2026-08-27 win32
// report the server then refused the key, and the failure branch only logged —
// so the user sat on an endpoint that rejects every request, with no UI signal.
//
// Two properties this must have, and the reason for each:
//   1. It reverts on the CURRENT value, not a pre-call snapshot. Re-saving a key
//      that was already stored leaves the snapshot reading 'natively' too, so
//      restoring the snapshot would restore the broken state.
//   2. It touches ONLY 'natively'. A model the user picked deliberately is not
//      collateral — clobbering it would be the same class of bug the
//      AUTO_ASSIGNED_MODEL_IDS allowlist exists to prevent on the way in.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import Module, { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const COMPILED = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../dist-electron/electron/services/CredentialsManager.js',
);

function makeEnv() {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'cred-revert-'));
  const state = { userData };
  const fakeElectron = {
    app: { getPath: () => state.userData, isPackaged: false, getVersion: () => '0.0.0-test' },
    safeStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (s) => Buffer.concat([Buffer.from('KR'), Buffer.from(s, 'utf8')]),
      decryptString: (b) => Buffer.from(b).subarray(2).toString('utf8'),
      getSelectedStorageBackend: () => 'basic_text',
    },
  };
  return { state, fakeElectron, userData };
}

let CURRENT = null;
const origLoad = Module._load;
Module._load = function patched(request) {
  if (request === 'electron') {
    if (!CURRENT) throw new Error('no electron env active');
    return CURRENT.fakeElectron;
  }
  return origLoad.apply(this, arguments);
};

function freshManager(env) {
  CURRENT = env;
  delete require.cache[require.resolve(COMPILED)];
  const mod = require(COMPILED);
  if (mod.CredentialsManager.instance) mod.CredentialsManager.instance = undefined;
  delete globalThis.__sneakPeekCredentialsManagerV1__;
  const cm = mod.CredentialsManager.getInstance();
  cm.init();
  return cm;
}

test('a refused key un-parks the default model from natively', () => {
  const env = makeEnv();
  const cm = freshManager(env);
  cm.setDefaultModel('natively');

  const changed = cm.revertSneakPeekAutoDefaults('Sneak-Peek key refused by server');

  assert.equal(cm.getDefaultModel(), 'gemini-3.1-flash-lite');
  assert.equal(
    changed.defaultModel,
    'gemini-3.1-flash-lite',
    'the caller re-syncs LLMHelper and the UI from this return value — a silent revert leaves the runtime on the dead model',
  );
});

test('disabled hosted-key setter cannot promote a model or persist a hosted key', () => {
  const env = makeEnv();
  const cm = freshManager(env);
  cm.setSneakPeekApiKey('natively_sk_whatever');
  assert.equal(cm.getDefaultModel(), 'gemini-3.1-flash-lite',
    'a retired hosted backend must not become the active default');
  assert.ok(!cm.getSneakPeekApiKey(), 'disabled credentials must not be retained');
  cm.setDefaultModel('natively'); // simulate credentials persisted by an older release
  cm.setSneakPeekApiKey('natively_sk_whatever');
  assert.equal(cm.getDefaultModel(), 'gemini-3.1-flash-lite',
    'a disabled-key write must also unwind a previously parked hosted model');
});

test('an explicitly chosen model is NOT collateral', () => {
  const env = makeEnv();
  const cm = freshManager(env);
  cm.setDefaultModel('gpt-5.4');

  const changed = cm.revertSneakPeekAutoDefaults('Sneak-Peek key refused by server');

  assert.equal(cm.getDefaultModel(), 'gpt-5.4', "a deliberate model choice must survive someone else's key being refused");
  assert.equal(changed.defaultModel, undefined, 'nothing changed, so nothing may be reported as changed');
  assert.equal(changed.sttProvider, undefined);
});

test('a natively STT provider is reverted and reported (the caller must rebuild the pipeline)', () => {
  const env = makeEnv();
  const cm = freshManager(env);
  cm.setSttProvider('natively');

  const changed = cm.revertSneakPeekAutoDefaults('Sneak-Peek key refused by server');

  assert.equal(cm.getSttProvider(), 'none');
  assert.equal(changed.sttProvider, 'none', 'reconfigureSttProvider() is gated on this being reported');
});

test('a non-natively STT provider is left alone', () => {
  const env = makeEnv();
  const cm = freshManager(env);
  cm.setSttProvider('deepgram');

  const changed = cm.revertSneakPeekAutoDefaults('Sneak-Peek key refused by server');

  assert.equal(cm.getSttProvider(), 'deepgram');
  assert.equal(changed.sttProvider, undefined);
});

test('the revert is persisted, not just in-memory', () => {
  const env = makeEnv();
  const cm = freshManager(env);
  cm.setDefaultModel('natively');
  cm.revertSneakPeekAutoDefaults('Sneak-Peek key refused by server');

  // Cold restart against the same userData.
  const reopened = freshManager(env);
  assert.equal(
    reopened.getDefaultModel(),
    'gemini-3.1-flash-lite',
    'an unsaved revert would put the user back on the dead model at next launch',
  );
});

test('clearing the key still reverts (regression on the extracted helper)', () => {
  const env = makeEnv();
  const cm = freshManager(env);
  cm.setSneakPeekApiKey('natively_sk_whatever');
  cm.setSttProvider('natively');

  cm.setSneakPeekApiKey('');

  assert.equal(cm.getDefaultModel(), 'gemini-3.1-flash-lite');
  assert.equal(cm.getSttProvider(), 'none');
});

// ---------------------------------------------------------------------------
// Handler wiring. Static, following this repo's ipcHandlers convention
// (ipcTestUtils + sliceSafeHandleBlock) — initializeIpcHandlers registers ~200
// handlers against a large appState surface, so the glue is pinned structurally
// rather than invoked. The two functions it glues are covered behaviorally above
// and in LicenseKeyRejectionVerdicts2026_08_27.test.mjs.
// ---------------------------------------------------------------------------
import { sliceSafeHandleBlock } from './ipcTestUtils.mjs';

const HANDLER_BLOCK = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../ipcHandlers.ts'),
  'utf8',
);

// Hosted Sneak-Peek key activation was intentionally removed from this build.
// Keep the old IPC channel absent: restoring a UI-writable credential without
// a genuine authenticated backend would silently put the user on a dead model.
test('retired hosted API-key handler cannot be reached from the renderer', () => {
  assert.equal(sliceSafeHandleBlock(HANDLER_BLOCK, 'set-natively-api-key'), '',
    'retired activation must stay unregistered');
});

test('retired hosted key cannot be saved by a legacy IPC alias', () => {
  assert.equal(sliceSafeHandleBlock(HANDLER_BLOCK, 'set-sneakpeek-api-key'), '',
    'legacy alias must not silently re-enable a disabled backend');
});

test('trial IPC explicitly fails closed rather than claiming activation', () => {
  const block = sliceSafeHandleBlock(HANDLER_BLOCK, 'trial:start');
  assert.ok(block, 'there must be a fail-closed response for an old trial caller');
  assert.match(block, /ok:\s*false/);
  assert.match(block, /natively_api_disabled/);
});
