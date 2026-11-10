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
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-chg19-desktop-'));
const q = JSON.stringify;
// Same protections as run-stabilization-full-product.mjs; no wider allowances.
fs.writeFileSync(path.join(evidence, 'sandbox.sb'), `(version 1)
(allow default)
(deny network*)
(allow network* (local unix-socket) (remote unix-socket))
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
const snapshot = () => ({ head: git(['rev-parse', 'HEAD']).trim(), branch: git(['branch', '--show-current']).trim(), status: git(['status', '--short']), paths: git(['diff', 'HEAD', '--name-only']).trim().split('\n').filter(Boolean), indexHash: createHash('sha256').update(git(['diff', '--cached', '--binary'])).digest('hex') });
const before = snapshot();
fs.writeFileSync(path.join(evidence, 'git-before.json'), JSON.stringify(before, null, 2));
try {
  for (const phase of ['initial', 'relaunch']) {
    const log = fs.openSync(path.join(evidence, `${phase}.log`), 'w');
    const code = await new Promise((resolve, reject) => {
      const child = spawn('/usr/bin/sandbox-exec', ['-f', path.join(evidence, 'sandbox.sb'), path.join(root, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'), path.join(root, 'scripts/audit/chg19-desktop-acceptance.cjs')], {
        cwd: evidence, env: { ...env, SNEAK_PEEK_ACCEPTANCE_ROOT: evidence, CHG19_PHASE: phase }, stdio: ['ignore', log, log],
      });
      const timer = setTimeout(() => child.kill('SIGTERM'), 150000);
      child.once('error', reject);
      child.once('exit', (code, signal) => { clearTimeout(timer); fs.closeSync(log); runs.push({ phase, pid: child.pid, code, signal }); resolve(code); });
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
  git(['diff', 'HEAD', '--check']); git(['diff', '--cached', '--check']);
  assert.equal(after.indexHash, before.indexHash, 'existing staged changes must remain byte-identical');
  assert.equal(after.head, before.head, 'no commit or reset');
  const allowed = /^(?:ROADMAP[.]md|chatgpt-work\/[^/]+[.]md|scripts\/audit\/[^/]+|electron\/intelligence\/__tests__\/HindsightMemory[.]test[.]mjs|electron\/intelligence\/engine\/SneakPeekIntelligenceEngine[.]ts|electron\/intelligence\/engine\/__tests__\/SneakPeekIntelligenceEngine[.]test[.]mjs)$/;
  assert.ok(after.paths.every(p => allowed.test(p)), 'protected path changed outside acceptance scope');
  const retained = ['electron/IntelligenceEngine.ts', 'electron/intelligence/ContextRouter.ts', 'electron/intelligence/ContextFusionEngine.ts', 'electron/intelligence/PromptAssemblerV2.ts', 'electron/llm/WhatToAnswerLLM.ts', 'electron/context-intelligence/orchestration/orchestrator.ts'];
  assert.ok(retained.every(p => fs.existsSync(path.join(root, p))));
  const review = { id: 'G19-05', status: 'PASS', before, after, unchangedIndex: true, diffChecks: ['git diff HEAD --check', 'git diff --cached --check'], retained, protectedPathChanges: [] };
  fs.writeFileSync(path.join(evidence, 'git-review.json'), JSON.stringify(review, null, 2));
  fs.writeFileSync(path.join(evidence, 'result.json'), JSON.stringify({ status: 'PASS', gitReview: review, runs, sharedUserData: initial.paths.userData, sharedSessionData: initial.paths.sessionData, initial: initial.scenarios, relaunch: relaunch.scenarios }, null, 2));
  console.log('Desktop acceptance PASS: both launches, same disposable profile.');
} catch (error) {
  fs.writeFileSync(path.join(evidence, 'runner-failure.json'), JSON.stringify({ status: 'FAIL', runs, error: error.message }, null, 2));
  console.error(error.message); process.exitCode = 1;
}
