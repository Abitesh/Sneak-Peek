// electron/llm/codeVerification/__tests__/LocalRunner.test.mjs
//
// REAL execution tests — actually spawn python3 / node in the sandbox. Skips
// gracefully if an interpreter isn't available so CI without a runtime stays
// green. Proves correct pass/fail/error verdicts, timeout, output cap, and that
// the exact firstMissingPositive bug class (wrong logic) is caught.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, describe } from 'node:test';
import {
  runCase,
  localLanguageAvailable,
} from '../../../../dist-electron/electron/llm/codeVerification/localRunner.js';

const tc = (input, expected, source = 'problem') => ({ input, expected, source });

describe('localRunner — python (real execution)', async () => {
  const havePy = await localLanguageAvailable('python');
  const maybe = (name, fn) => test(name, { skip: havePy ? false : 'python3 unavailable' }, fn);

  maybe('correct twoSum passes its problem cases', async () => {
    const code = `def twoSum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`;
    const r = await runCase('python', code, 'twoSum', tc([[2, 7, 11, 15], 9], [0, 1]));
    assert.equal(r.status, 'pass', r.error);
  });

  maybe('WRONG firstMissingPositive is caught as fail', async () => {
    // Off-by-one bug: returns i (0-based) instead of i+1.
    const code = `def firstMissingPositive(nums):
    n = len(nums)
    for i in range(n):
        while 0 < nums[i] <= n and nums[nums[i]-1] != nums[i]:
            j = nums[i]-1
            nums[i], nums[j] = nums[j], nums[i]
    for i in range(n):
        if nums[i] != i + 1:
            return i  # BUG: should be i + 1
    return n + 1`;
    const r = await runCase('python', code, 'firstMissingPositive', tc([[1, 2, 0]], 3));
    assert.equal(r.status, 'fail');
    assert.match(r.error, /expected 3, got 2/);
  });

  maybe('a syntax error is reported as error (the ", 1" class)', async () => {
    const code = `def f(nums):
    return nums[nums[i], 1]`; // invalid
    const r = await runCase('python', code, 'f', tc([[1]], 1));
    assert.equal(r.status, 'error');
  });

  maybe('infinite loop is killed by the timeout', async () => {
    const code = `def f(x):
    while True:
        pass`;
    const r = await runCase('python', code, 'f', tc([1], 1));
    assert.equal(r.status, 'error');
    assert.match(r.error, /timed out/);
  });

  maybe('debug prints do not confuse the judge (sentinel parsing)', async () => {
    const code = `def f(x):
    print("debugging", x)
    return x * 2`;
    const r = await runCase('python', code, 'f', tc([21], 42));
    assert.equal(r.status, 'pass', r.error);
  });

  maybe('Solution-class method entry is supported', async () => {
    const code = `class Solution:
    def add(self, a, b):
        return a + b`;
    const r = await runCase('python', code, 'add', tc([2, 3], 5));
    assert.equal(r.status, 'pass', r.error);
  });

  // SECURITY INVARIANT (review P0): the executed code must NOT see the parent's
  // env secrets. The runner rebuilds a minimal scrubbed env; if a regression
  // ever spreads process.env, this test fails and the leak is caught.
  maybe('executed code CANNOT read parent env secrets (env is scrubbed)', async () => {
    const SECRET = 'sk-leak-canary-' + Date.now();
    process.env.NATIVELY_TEST_SECRET = SECRET;
    process.env.OPENAI_API_KEY = SECRET;
    try {
      const code = `import os
def leak(x):
    return os.environ.get("NATIVELY_TEST_SECRET", "ABSENT") + "|" + os.environ.get("OPENAI_API_KEY", "ABSENT")`;
      const r = await runCase('python', code, 'leak', tc([1], 'ABSENT|ABSENT'));
      assert.equal(r.status, 'pass', `secret leaked into sandbox: ${r.actual}`);
      assert.doesNotMatch(JSON.stringify(r.actual ?? ''), new RegExp(SECRET), 'secret value must never appear');
    } finally {
      delete process.env.NATIVELY_TEST_SECRET;
      delete process.env.OPENAI_API_KEY;
    }
  });

  maybe('a detached grandchild does NOT outlive the timeout (process-group kill)', async () => {
    // Fork a detached grandchild that would sleep 30s, then the parent loops.
    // The group kill must take down both within the 3s bound.
    const code = `import subprocess, sys, time
def f(x):
    subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
    while True:
        time.sleep(0.01)`;
    const start = Date.now();
    const r = await runCase('python', code, 'f', tc([1], 1));
    const elapsed = Date.now() - start;
    assert.equal(r.status, 'error');
    assert.match(r.error, /timed out/);
    assert.ok(elapsed < 6000, `must be bounded near 3s, took ${elapsed}ms`);
  });

  maybe('output cap kills a runaway print and reports error', async () => {
    const code = `def f(x):
    while True:
        print("x" * 1000)`;
    const r = await runCase('python', code, 'f', tc([1], 1));
    assert.equal(r.status, 'error');
    assert.match(r.error, /output limit|timed out/);
  });

  maybe('float inf becomes an honest error, not a silent string-pass', async () => {
    const code = `def f(x):
    return float('inf')`;
    const r = await runCase('python', code, 'f', tc([1], 'whatever'));
    assert.equal(r.status, 'error', 'inf is not valid JSON → honest error, never a coerced pass');
  });

  const trackDirectories = (t, onCreate = () => {}) => {
    const make = fs.mkdtempSync;
    const dirs = [];
    t.mock.method(fs, 'mkdtempSync', (prefix, ...options) => {
      const dir = make(prefix, ...options);
      if (path.basename(prefix) === 'natively-verify-') {
        dirs.push(dir);
        onCreate(dir);
      }
      return dir;
    });
    return dirs;
  };

  const assertRemoved = (dirs, count = 1) => {
    assert.equal(dirs.length, count, 'observe each directory actually allocated by the runner');
    for (const dir of dirs) assert.equal(fs.existsSync(dir), false, `owned directory was not removed: ${path.basename(dir)}`);
  };

  for (const [name, body, expectedStatus, error] of [
    ['success', 'return x', 'pass', null],
    ['runtime error', 'raise ValueError("fixture error")', 'error', /fixture error/],
    ['timeout', 'while True: pass', 'error', /timed out/],
    ['output overflow', 'while True: print("x" * 8192)', 'error', /output limit exceeded/],
  ]) {
    test(`removes its own directory after ${name}`, { skip: !havePy }, async t => {
      const foreign = fs.mkdtempSync(path.join(os.tmpdir(), 'natively-verify-'));
      t.after(() => fs.rmdirSync(foreign));
      const dirs = trackDirectories(t);
      const result = await runCase('python', `def f(x):\n    ${body}`, 'f', tc([1], 1));
      assert.equal(result.status, expectedStatus, result.error);
      if (error) assert.match(result.error, error);
      assertRemoved(dirs);
      assert.equal(fs.existsSync(foreign), true, 'another owner’s same-prefix directory is outside the cleanup scope');
    });
  }

  test('cancels queued work and removes both in-flight directories', { skip: !havePy }, async t => {
    const allocated = Promise.withResolvers();
    const dirs = trackDirectories(t, () => { if (dirs.length === 2) allocated.resolve(); });
    const running = new AbortController();
    const queued = new AbortController();
    const run = signal => runCase('python', 'def f(x):\n    while True: pass', 'f', tc([1], 1), undefined, signal);
    const cases = [run(running.signal), run(running.signal), run(queued.signal)];
    await allocated.promise;
    queued.abort();
    assert.match((await cases[2]).error, /cancelled/);
    // The two slots still belong to the first two requests.
    assert.equal(dirs.filter(dir => fs.existsSync(dir)).length, 2);
    running.abort();
    for (const outcome of await Promise.all(cases)) assert.match(outcome.error, /cancelled/);
    assertRemoved(dirs, 2);
  });

  test('reports cleanup failure and releases its run slot', { skip: !havePy }, async t => {
    const dirs = trackDirectories(t);
    const remove = fs.promises.rm;
    t.after(async () => {
      for (const dir of dirs) await remove(dir, { force: true, recursive: true });
    });
    t.mock.method(fs.promises, 'rm', async (dir, options) => {
      if (dir === dirs[0]) throw Object.assign(new Error('injected cleanup error'), { code: 'EACCES' });
      await remove(dir, options);
    });
    const run = () => runCase('python', 'def f(x):\n    return x', 'f', tc([1], 1));
    const failedCleanup = await run();
    assert.equal(failedCleanup.status, 'error');
    assert.match(failedCleanup.error, /temporary directory cleanup failed \(EACCES\)/);
    const results = await Promise.all([run(), run()]);
    for (const result of results) assert.equal(result.status, 'pass', result.error);
    assertRemoved(dirs.slice(1), 2);
  });

  test('normal exit reaps a child holding its stdout and stderr pipes', {
    skip: !havePy || process.platform === 'win32',
  }, async t => {
    const dirs = trackDirectories(t);
    const code = `import subprocess, sys
def f(x):
    subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
    return x`;
    const result = await runCase('python', code, 'f', tc([1], 1));
    assert.equal(result.status, 'pass', result.error);
    assertRemoved(dirs);
  });

});

describe('localRunner — javascript (real execution)', async () => {
  const haveJs = await localLanguageAvailable('javascript');
  const maybe = (name, fn) => test(name, { skip: haveJs ? false : 'node unavailable' }, fn);

  maybe('correct JS function passes', async () => {
    const code = `function twoSum(nums, target){const m=new Map();for(let i=0;i<nums.length;i++){if(m.has(target-nums[i]))return [m.get(target-nums[i]),i];m.set(nums[i],i);}return[];}`;
    const r = await runCase('javascript', code, 'twoSum', tc([[2, 7, 11, 15], 9], [0, 1]));
    assert.equal(r.status, 'pass', r.error);
  });

  maybe('WRONG JS output is caught as fail', async () => {
    const code = `function add(a,b){return a-b;}`; // bug: minus not plus
    const r = await runCase('javascript', code, 'add', tc([2, 3], 5));
    assert.equal(r.status, 'fail');
  });

  maybe('JS runtime error is reported as error', async () => {
    const code = `function f(x){ return x.nope.crash; }`;
    const r = await runCase('javascript', code, 'f', tc([1], 1));
    assert.equal(r.status, 'error');
  });
});
