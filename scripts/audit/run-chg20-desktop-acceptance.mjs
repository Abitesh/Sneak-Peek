// macOS-only, opt-in desktop acceptance. Both launches share one disposable
// profile under the same enclosing Seatbelt policy. No installs or live APIs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
if (process.platform !== 'darwin') throw new Error('macOS Seatbelt required');
const args = process.argv.slice(2);
const localOllama = args.includes('--local-ollama');
if (localOllama) args.splice(args.indexOf('--local-ollama'), 1);
assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--repo'),
  'Usage: node scripts/audit/run-chg20-desktop-acceptance.mjs [--repo /absolute/repository] [--local-ollama]');
const root = fs.realpathSync(args[1] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
assert.equal(fs.realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8' }).trim()), root,
  'The root must be the repository itself, not a parent directory');
for (const required of ['dist/index.html', 'dist-electron/electron/main.js', 'scripts/audit/chg19-desktop-acceptance.cjs']) {
  assert.ok(fs.existsSync(path.join(root, required)), `Missing ${required}; build renderer then Electron first`);
}
const evidence = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-chg20-desktop-'));
const q = JSON.stringify;
// Same protections as run-stabilization-full-product.mjs; no wider allowances.
fs.writeFileSync(path.join(evidence, 'sandbox.sb'), `(version 1)
(allow default)
(deny network*)
(allow network* (local unix-socket) (remote unix-socket))
${localOllama ? '(allow network-outbound (remote ip "localhost:11436"))' : ''}
(deny file-read* (subpath ${q(os.homedir())}))
(allow file-read* (subpath ${q(root)}))
(deny file-read* (regex #"[.]env"))
(allow file-read-metadata)
(deny file-write*)
(allow file-write* (subpath "/private/tmp") (subpath "/tmp") (subpath "/private/var/folders") (subpath "/var/folders") (literal "/dev/null"))
(deny process-exec)
(allow process-exec (subpath ${q(path.join(root, 'node_modules/electron'))}))
`);
const env = Object.fromEntries(['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG', 'LC_ALL', '__CF_USER_TEXT_ENCODING', 'DISPLAY', 'XPC_FLAGS', 'XPC_SERVICE_NAME'].filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
console.log(`Evidence directory: ${evidence}`);
const runs = [];
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 20000000 });
const hash = value => createHash('sha256').update(value).digest('hex');
// Bind the evidence to the tracked source snapshot AND the actual loaded builds.
// Hashes contain no source content, credentials or personal data.
function buildHash(directory) {
  const digest = createHash('sha256');
  function visit(relative) {
    const absolute = path.join(root, directory, relative);
    for (const name of fs.readdirSync(absolute).sort()) {
      const rel = path.join(relative, name);
      const file = path.join(root, directory, rel);
      const stat = fs.lstatSync(file);
      if (stat.isDirectory()) visit(rel);
      else if (stat.isFile()) digest.update(rel).update('\0').update(hash(fs.readFileSync(file))).update('\0');
      else if (stat.isSymbolicLink()) digest.update(rel).update('\0link:').update(fs.readlinkSync(file)).update('\0');
    }
  }
  visit('');
  return digest.digest('hex');
}
const snapshot = () => ({
  head: git(['rev-parse', 'HEAD']).trim(), branch: git(['branch', '--show-current']).trim(),
  status: git(['status', '--short']),
  paths: git(['diff', 'HEAD', '--name-only']).trim().split('\n').filter(Boolean),
  indexHash: hash(git(['diff', '--cached', '--binary'])),
  trackedDiffHash: hash(git(['diff', 'HEAD', '--binary'])),
  harnessHash: hash(fs.readFileSync(path.join(root, 'scripts/audit/chg19-desktop-acceptance.cjs'))),
  runnerHash: hash(fs.readFileSync(fileURLToPath(import.meta.url))),
  rendererBuildHash: buildHash('dist'), electronBuildHash: buildHash('dist-electron'),
});
const before = snapshot();
fs.writeFileSync(path.join(evidence, 'git-before.json'), JSON.stringify(before, null, 2));
try {
  for (const phase of ['initial', 'relaunch']) {
    const log = fs.openSync(path.join(evidence, `${phase}.log`), 'w');
    const code = await new Promise((resolve, reject) => {
      const child = spawn('/usr/bin/sandbox-exec', ['-f', path.join(evidence, 'sandbox.sb'), path.join(root, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'), path.join(root, 'scripts/audit/chg19-desktop-acceptance.cjs')], {
        cwd: evidence, env: { ...env, SNEAK_PEEK_ACCEPTANCE_ROOT: evidence, CHG19_PHASE: phase, CHG21_LOCAL_OLLAMA: localOllama ? '1' : '0' }, stdio: ['ignore', log, log],
      });
      let forceTimer;
      const timer = setTimeout(() => { child.kill('SIGTERM'); forceTimer = setTimeout(() => child.kill('SIGKILL'), 5000); }, 150000);
      child.once('error', error => { clearTimeout(timer); clearTimeout(forceTimer); fs.closeSync(log); reject(error); });
      child.once('exit', (code, signal) => { clearTimeout(timer); clearTimeout(forceTimer); fs.closeSync(log); runs.push({ phase, pid: child.pid, code, signal }); resolve(code); });
    });
    assert.equal(code, 0, `${phase} failed; inspect its JSON and log`);
    const report = JSON.parse(fs.readFileSync(path.join(evidence, `${phase}.json`)));
    assert.equal(report.status, 'PASS');
  }
  const initial = JSON.parse(fs.readFileSync(path.join(evidence, 'initial.json')));
  const relaunch = JSON.parse(fs.readFileSync(path.join(evidence, 'relaunch.json')));
  assert.equal(initial.paths.userData, relaunch.paths.userData);
  assert.equal(initial.paths.sessionData, relaunch.paths.sessionData);
  const after = snapshot();
  assert.deepEqual(after, before, 'Desktop run must not change the checkout or index');
  const retained = ['electron/IntelligenceEngine.ts', 'electron/intelligence/ContextRouter.ts', 'electron/intelligence/ContextFusionEngine.ts', 'electron/intelligence/PromptAssemblerV2.ts', 'electron/llm/WhatToAnswerLLM.ts', 'electron/context-intelligence/orchestration/orchestrator.ts'];
  assert.ok(retained.every(p => fs.existsSync(path.join(root, p))));
  const review = { id: 'C20-CHECKOUT-PRESERVATION', status: 'PASS', before, after, unchangedIndex: true, trackedContentUnchanged: true, loadedBuildsUnchanged: true, retained, limitation: 'Does not establish correctness of preexisting changes or hash arbitrary untracked file contents; independent migration review remains required.' };
  fs.writeFileSync(path.join(evidence, 'git-review.json'), JSON.stringify(review, null, 2));
  fs.writeFileSync(path.join(evidence, 'result.json'), JSON.stringify({ status: 'PASS', gitReview: review, runs, sharedUserData: initial.paths.userData, sharedSessionData: initial.paths.sessionData, initial: initial.scenarios, relaunch: relaunch.scenarios }, null, 2));
  console.log('CHG-20 desktop scenarios PASS: both launches, same disposable profile. This does not close independent review or other untested acceptance criteria.');
} catch (error) {
  fs.writeFileSync(path.join(evidence, 'runner-failure.json'), JSON.stringify({ status: 'FAIL', runs, error: error.message }, null, 2));
  console.error(error.message); process.exitCode = 1;
}
