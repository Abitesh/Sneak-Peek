// electron/llm/codeVerification/localRunner.ts
//
// Sandboxed LOCAL execution of model-generated code (Python/JS). Model code is
// UNTRUSTED, so each case runs in a short-lived subprocess with hard limits:
//   - fresh OS process (never eval/vm in-process — those share Electron's heap)
//   - 3s wall-clock timeout -> SIGKILL (catches infinite loops)
//   - scrubbed env (no API keys; only the test case + minimal PATH), stdin closed
//   - throwaway temp dir as cwd; temp file deleted after
//   - stdout/stderr capped (~256KB) -> kill (catches runaway prints)
//   - global concurrency semaphore (max 2) so verification can't storm the box
//   - per-language interpreter availability is detected once and cached
//
// Mirrors the spawn-with-timeout pattern already used by CodexCliService.

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { TestCase, RunResult, VerifyLanguage } from './types';
import { buildDriver, parseDriverResult, TC_ENV, isLocallyRunnable, isValidEntry, type DriverHints } from './drivers';
import { buildCppProgram } from './cppDriver';
import { buildJavaProgram } from './javaDriver';
import { buildGoProgram } from './goDriver';
import { buildSqlScript, parseSqlRows } from './sqlRunner';
import type { SqlSpec } from './types';
import { valuesEqual, renderValue, compareResultSet } from './judge';

const TIMEOUT_MS = 3000;
const MAX_OUTPUT_BYTES = 256 * 1024;
const MAX_CONCURRENCY = 2;

const isWin = process.platform === 'win32';

// Start teardown before waiting for stdio close. Descendants can inherit the
// pipes, so waiting for close before killing the process group would deadlock.
const killTree = async (child: ReturnType<typeof spawn>): Promise<void> => {
  const pid = child.pid;
  if (!pid) return;
  if (!isWin) {
    try { process.kill(-pid, 'SIGKILL'); } catch { /* group already gone */ }
    try { child.kill('SIGKILL'); } catch { /* child already gone */ }
    return;
  }

  // Keep the parent alive long enough for taskkill to enumerate its tree.
  // Bound the helper itself so a failed Windows reaper cannot pin a run slot.
  try {
    const reaper = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    const killed = await new Promise<boolean>(resolve => {
      const timer = setTimeout(() => {
        try { reaper.kill(); } catch { /* helper already gone */ }
        resolve(false);
      }, 2000);
      reaper.once('close', code => { clearTimeout(timer); resolve(code === 0); });
      reaper.once('error', () => { clearTimeout(timer); resolve(false); });
    });
    if (killed) return;
  } catch { /* taskkill unavailable */ }
  try { child.kill(); } catch { /* child already gone */ }
};

let active = 0;
const waiters: Array<() => void> = [];
const acquire = (signal?: AbortSignal): Promise<boolean> => {
  if (signal?.aborted) return Promise.resolve(false);
  if (active < MAX_CONCURRENCY) {
    active++;
    return Promise.resolve(true);
  }
  return new Promise(resolve => {
    const admit = () => {
      signal?.removeEventListener('abort', cancel);
      active++;
      resolve(true);
    };
    const cancel = () => {
      const index = waiters.indexOf(admit);
      if (index !== -1) waiters.splice(index, 1);
      resolve(false);
    };
    waiters.push(admit);
    signal?.addEventListener('abort', cancel, { once: true });
  });
};
const release = (): void => { active--; waiters.shift()?.(); };

const cancelledResult = (tc: TestCase): RunResult => ({
  case: tc, status: 'error', stdout: '', error: 'verification cancelled', ms: 0,
});

const withRunDirectory = async (
  tc: TestCase, signal: AbortSignal | undefined, run: (dir: string) => Promise<RunResult>,
): Promise<RunResult> => {
  if (!(await acquire(signal))) return cancelledResult(tc);
  let dir: string | undefined;
  let result: RunResult;
  try {
    if (signal?.aborted) {
      result = cancelledResult(tc);
    } else {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'natively-verify-'));
      result = await run(dir);
    }
  } catch (error: any) {
    result = { case: tc, status: 'error', stdout: '', error: String(error?.message || error).slice(0, 200), ms: 0 };
  }

  try {
    if (dir) await fs.promises.rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch (error) {
    // Keep the cleanup failure visible without logging a user-specific path.
    const code = (error as NodeJS.ErrnoException).code ?? 'unknown';
    return { case: tc, status: 'error', stdout: '', error: `temporary directory cleanup failed (${code})`, ms: 0 };
  } finally {
    release();
  }
  return signal?.aborted ? cancelledResult(tc) : result;
};

// ── interpreter availability (detected once, cached) ──────────────────────────
const interpreterCache = new Map<string, boolean>();
// `versionArgs` defaults to ['--version']; some tools differ (Go uses `version`).
const isInterpreterAvailable = (cmd: string, versionArgs: string[] = ['--version']): Promise<boolean> => {
  const cached = interpreterCache.get(cmd);
  if (cached !== undefined) return Promise.resolve(cached);
  return new Promise<boolean>(resolve => {
    let settled = false;
    const done = (ok: boolean) => { if (!settled) { settled = true; interpreterCache.set(cmd, ok); resolve(ok); } };
    try {
      const child = spawn(cmd, versionArgs, { stdio: ['ignore', 'ignore', 'ignore'] });
      child.on('error', () => done(false));
      child.on('exit', code => done(code === 0));
      setTimeout(() => { try { child.kill('SIGKILL'); } catch { /* noop */ } done(false); }, 2000).unref?.();
    } catch { done(false); }
  });
};

// Python interpreter name differs by platform. POSIX installs expose `python3`;
// the python.org Windows installer ships `python.exe` plus the `py` launcher and
// does NOT create a `python3` command (the bare `python3` on Windows usually
// resolves to the Microsoft Store App Execution Alias, which no-ops for
// non-interactive spawns). We probe candidates in order and cache the first that
// works, so the availability check and the actual run use the SAME interpreter.
export const PYTHON_CANDIDATES: ReadonlyArray<readonly [string, string[]]> = isWin
  ? [['python', ['--version']], ['py', ['-3', '--version']], ['python3', ['--version']]]
  : [['python3', ['--version']]];

let resolvedPythonCmd: string[] | null | undefined; // undefined=unprobed, null=none found
const resolvePythonCmd = async (): Promise<string[] | null> => {
  if (resolvedPythonCmd !== undefined) return resolvedPythonCmd;
  for (const [cmd, versionArgs] of PYTHON_CANDIDATES) {
    if (await isInterpreterAvailable(cmd, versionArgs)) {
      // Drop the trailing `--version` probe flag; keep launcher selectors like `-3`.
      resolvedPythonCmd = [cmd, ...versionArgs.slice(0, -1)];
      return resolvedPythonCmd;
    }
  }
  resolvedPythonCmd = null;
  return resolvedPythonCmd;
};

export const localLanguageAvailable = async (language: VerifyLanguage): Promise<boolean> => {
  // SQL is verified via sqlite3 but is NOT in LOCAL_LANGUAGES (it doesn't use the
  // entry(args) path); the orchestrator routes it separately and checks this.
  if (language === 'sql') return isInterpreterAvailable('sqlite3');
  if (!isLocallyRunnable(language)) return false;
  if (language === 'cpp') return isInterpreterAvailable('g++');
  if (language === 'java') return (await isInterpreterAvailable('javac')) && isInterpreterAvailable('java');
  if (language === 'go') return isInterpreterAvailable('go', ['version']);
  if (language === 'python') return (await resolvePythonCmd()) !== null;
  return isInterpreterAvailable('node');
};

interface RawRun { stdout: string; stderr: string; code: number | null; signal: NodeJS.Signals | null; timedOut: boolean; oversized: boolean; ms: number; }

const spawnBounded = (
  cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, timeoutMs: number,
  signal?: AbortSignal, stdinPath?: string,
): Promise<RawRun> => new Promise(resolve => {
  const start = Date.now();
  let stdout = '', stderr = '', timedOut = false, oversized = false;
  const result = (code: number | null = null, exitSignal: NodeJS.Signals | null = null): RawRun =>
    ({ stdout, stderr, code, signal: exitSignal, timedOut, oversized, ms: Date.now() - start });

  if (signal?.aborted) {
    resolve(result());
    return;
  }

  let child: ReturnType<typeof spawn>;
  let stdinFd: number | undefined;
  try {
    if (stdinPath) stdinFd = fs.openSync(stdinPath, 'r');
    child = spawn(cmd, args, { cwd, env, stdio: [stdinFd ?? 'ignore', 'pipe', 'pipe'], detached: !isWin });
  } catch (error: any) {
    stderr = String(error?.message || error);
    resolve(result());
    return;
  } finally {
    if (stdinFd !== undefined) { try { fs.closeSync(stdinFd); } catch { /* child already has its own descriptor */ } }
  }

  let termination: Promise<void> | undefined;
  const terminate = () => termination ??= killTree(child);
  const stop = () => {
    void terminate();
    // After the deadline or cancellation no more output may affect the
    // verdict. Close our pipe handles even if a descendant retained them.
    child.stdout?.destroy();
    child.stderr?.destroy();
  };
  const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
  timer.unref?.();
  signal?.addEventListener('abort', stop, { once: true });

  const cap = (buf: string, chunk: Buffer) => {
    const next = buf + chunk.toString('utf8');
    if (next.length <= MAX_OUTPUT_BYTES) return next;
    oversized = true;
    stop();
    return next.slice(0, MAX_OUTPUT_BYTES);
  };
  child.stdout?.on('data', (chunk: Buffer) => { stdout = cap(stdout, chunk); });
  child.stderr?.on('data', (chunk: Buffer) => { stderr = cap(stderr, chunk); });
  child.once('error', error => { stderr ||= String(error.message || error); });
  child.once('exit', () => { void terminate(); });
  child.once('close', async (code, exitSignal) => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
    await terminate();
    resolve(result(code, exitSignal));
  });
});

const spawnOnce = (
  [cmd, ...prefixArgs]: string[], scriptPath: string, cwd: string, tcJson: string, signal?: AbortSignal,
): Promise<RawRun> => spawnBounded(cmd, [...prefixArgs, scriptPath], cwd, {
  PATH: process.env.PATH,
  HOME: cwd,
  TMPDIR: cwd,
  [TC_ENV]: tcJson,
  PYTHONDONTWRITEBYTECODE: '1',
  PYTHONIOENCODING: 'utf-8',
  NODE_OPTIONS: '--max-old-space-size=128',
}, TIMEOUT_MS, signal);

/** Run ONE case for a (language, code, entry). Never throws. */
export const runCase = async (
  language: VerifyLanguage,
  code: string,
  entry: string,
  tc: TestCase,
  hints?: DriverHints,
  signal?: AbortSignal,
): Promise<RunResult> => {
  if (signal?.aborted) return cancelledResult(tc);

  // Compiled paths: build a per-case program, compile, run. (C++/Java derive
  // list/tree from the signature, so they ignore the dynamic-language hints.)
  if (language === 'cpp') return runCppCase(code, entry, tc, signal);
  if (language === 'java') return runJavaCase(code, entry, tc, signal);
  if (language === 'go') return runGoCase(code, entry, tc, signal);

  const driver = buildDriver(language, code, entry, hints);
  if (!driver || !driver.localCmd) {
    return { case: tc, status: 'error', stdout: '', error: `no local driver for ${language}`, ms: 0 };
  }

  // Resolve the interpreter argv. `node` is the same everywhere; Python's command
  // is platform-dependent (python3 on POSIX, python/py on Windows) and is probed
  // and cached by resolvePythonCmd so the run uses the SAME interpreter the
  // availability check found.
  let argv: string[];
  if (driver.localCmd === 'python3') {
    const py = await resolvePythonCmd();
    if (!py) return { case: tc, status: 'error', stdout: '', error: 'no python interpreter available', ms: 0 };
    argv = py;
  } else {
    argv = [driver.localCmd];
  }

  return withRunDirectory(tc, signal, async tmpDir => {
    const scriptPath = path.join(tmpDir, `main.${driver.ext}`);
    fs.writeFileSync(scriptPath, driver.source, { encoding: 'utf8' });

    const tcJson = JSON.stringify(tc.input ?? []);
    const raw = await spawnOnce(argv, scriptPath, tmpDir, tcJson, signal);

    if (raw.timedOut) return { case: tc, status: 'error', stdout: trunc(raw.stdout), error: `timed out after ${TIMEOUT_MS}ms`, ms: raw.ms };
    if (raw.oversized) return { case: tc, status: 'error', stdout: trunc(raw.stdout), error: 'output limit exceeded', ms: raw.ms };

    const parsed = parseDriverResult(raw.stdout);
    if (!parsed.found) {
      // No sentinel result => a compile/runtime error (or entry-not-found).
      const errText = trunc(raw.stderr) || `exited with code ${raw.code ?? 'unknown'}`;
      return { case: tc, status: 'error', stdout: trunc(raw.stdout), error: errText, ms: raw.ms };
    }

    // Smoke case has no expected value — running without error IS the pass.
    if (tc.source === 'smoke') {
      return { case: tc, status: 'pass', stdout: trunc(raw.stdout), actual: parsed.value, ms: raw.ms };
    }

    const ok = valuesEqual(parsed.value, tc.expected);
    return {
      case: tc,
      status: ok ? 'pass' : 'fail',
      stdout: trunc(raw.stdout),
      actual: parsed.value,
      error: ok ? undefined : `expected ${renderValue(tc.expected)}, got ${renderValue(parsed.value)}`,
      ms: raw.ms,
    };
  });
};

const trunc = (s: string, max = 2000): string => (s.length > max ? s.slice(0, max) + '…' : s);

// Compiler and SQL processes have the same resource bounds and scrubbed
// environment as interpreted runs. Only SQL has an explicit stdin file.
const spawnCmd = (
  cmd: string, args: string[], cwd: string, timeoutMs: number, signal?: AbortSignal, stdinPath?: string,
): Promise<RawRun> => spawnBounded(cmd, args, cwd, {
  PATH: process.env.PATH, HOME: cwd, TMPDIR: cwd,
}, timeoutMs, signal, stdinPath);

// Compile time can exceed the run budget for C++; give the compiler its own,
// larger window (still bounded) and the binary the standard TIMEOUT_MS.
const CPP_COMPILE_TIMEOUT_MS = 10000;

/** Run ONE C++ case: build per-case program → g++ compile → run binary. */
const runCppCase = async (code: string, entry: string, tc: TestCase, signal?: AbortSignal): Promise<RunResult> => {
  // Validate entry as a plain identifier BEFORE it reaches any RegExp/template
  // (parseCppSignature interpolates it into a RegExp). Mirrors the Python/JS
  // buildDriver guard so a malformed entry is a clean per-case skip, never a
  // throw that aborts the whole batch and never an injection channel.
  if (!isValidEntry(entry)) {
    return { case: tc, status: 'error', stdout: '', error: 'invalid_entry', ms: 0 };
  }
  const program = buildCppProgram(code, entry, tc);
  if (program === null) {
    // Signature/args not safely representable → skip (never a false verdict).
    return { case: tc, status: 'error', stdout: '', error: 'cpp_signature_unsupported', ms: 0 };
  }
  return withRunDirectory(tc, signal, async tmpDir => {
    const srcPath = path.join(tmpDir, 'main.cpp');
    const binPath = path.join(tmpDir, 'a.out');
    fs.writeFileSync(srcPath, program, { encoding: 'utf8' });

    const comp = await spawnCmd('g++', ['-std=c++17', '-O0', '-w', srcPath, '-o', binPath], tmpDir, CPP_COMPILE_TIMEOUT_MS, signal);
    if (comp.timedOut) return { case: tc, status: 'error', stdout: '', error: `compile timed out after ${CPP_COMPILE_TIMEOUT_MS}ms`, ms: comp.ms };
    if (comp.code !== 0 || !fs.existsSync(binPath)) {
      return { case: tc, status: 'error', stdout: '', error: `compile error: ${trunc(comp.stderr, 400) || 'g++ failed'}`, ms: comp.ms };
    }

    const run = await spawnCmd(binPath, [], tmpDir, TIMEOUT_MS, signal);
    if (run.timedOut) return { case: tc, status: 'error', stdout: trunc(run.stdout), error: `timed out after ${TIMEOUT_MS}ms`, ms: run.ms };
    if (run.oversized) return { case: tc, status: 'error', stdout: trunc(run.stdout), error: 'output limit exceeded', ms: run.ms };

    const parsed = parseDriverResult(run.stdout);
    if (!parsed.found) {
      return { case: tc, status: 'error', stdout: trunc(run.stdout), error: trunc(run.stderr) || `exited with code ${run.code ?? 'unknown'}`, ms: run.ms };
    }
    if (tc.source === 'smoke') return { case: tc, status: 'pass', stdout: trunc(run.stdout), actual: parsed.value, ms: run.ms };
    const ok = valuesEqual(parsed.value, tc.expected);
    return {
      case: tc,
      status: ok ? 'pass' : 'fail',
      stdout: trunc(run.stdout),
      actual: parsed.value,
      error: ok ? undefined : `expected ${renderValue(tc.expected)}, got ${renderValue(parsed.value)}`,
      ms: run.ms,
    };
  });
};

// javac is slow to start; give compile a larger (bounded) window than run.
const JAVA_COMPILE_TIMEOUT_MS = 20000;

/** Run ONE Java case: build Main.java → javac → java Main. Never throws. */
const runJavaCase = async (code: string, entry: string, tc: TestCase, signal?: AbortSignal): Promise<RunResult> => {
  if (!isValidEntry(entry)) return { case: tc, status: 'error', stdout: '', error: 'invalid_entry', ms: 0 };
  const program = buildJavaProgram(code, entry, tc);
  if (program === null) return { case: tc, status: 'error', stdout: '', error: 'java_signature_unsupported', ms: 0 };
  return withRunDirectory(tc, signal, async tmpDir => {
    const srcPath = path.join(tmpDir, 'Main.java');
    fs.writeFileSync(srcPath, program, { encoding: 'utf8' });

    const comp = await spawnCmd('javac', ['-d', tmpDir, srcPath], tmpDir, JAVA_COMPILE_TIMEOUT_MS, signal);
    if (comp.timedOut) return { case: tc, status: 'error', stdout: '', error: `compile timed out after ${JAVA_COMPILE_TIMEOUT_MS}ms`, ms: comp.ms };
    if (comp.code !== 0 || !fs.existsSync(path.join(tmpDir, 'Main.class'))) {
      return { case: tc, status: 'error', stdout: '', error: `compile error: ${trunc(comp.stderr, 400) || 'javac failed'}`, ms: comp.ms };
    }

    const run = await spawnCmd('java', ['-cp', tmpDir, 'Main'], tmpDir, TIMEOUT_MS, signal);
    if (run.timedOut) return { case: tc, status: 'error', stdout: trunc(run.stdout), error: `timed out after ${TIMEOUT_MS}ms`, ms: run.ms };
    if (run.oversized) return { case: tc, status: 'error', stdout: trunc(run.stdout), error: 'output limit exceeded', ms: run.ms };

    const parsed = parseDriverResult(run.stdout);
    if (!parsed.found) {
      return { case: tc, status: 'error', stdout: trunc(run.stdout), error: trunc(run.stderr) || `exited with code ${run.code ?? 'unknown'}`, ms: run.ms };
    }
    if (tc.source === 'smoke') return { case: tc, status: 'pass', stdout: trunc(run.stdout), actual: parsed.value, ms: run.ms };
    const ok = valuesEqual(parsed.value, tc.expected);
    return {
      case: tc,
      status: ok ? 'pass' : 'fail',
      stdout: trunc(run.stdout),
      actual: parsed.value,
      error: ok ? undefined : `expected ${renderValue(tc.expected)}, got ${renderValue(parsed.value)}`,
      ms: run.ms,
    };
  });
};

const SQL_TIMEOUT_MS = 4000;

/**
 * Run a SQL answer: schema + seeds + the model's SELECT in `sqlite3 -safe -bail
 * :memory:`, judge the result set. Never throws. Safety: `-safe` blocks
 * ATTACH/.read/.output/extension-load/all fs dot-commands; `-bail` makes any
 * sqlite error stop with a non-zero exit → we return `error` (skip), NOT `fail`.
 * A `fail` is produced ONLY when the query ran cleanly and the rows differ from
 * expected — so a MySQL-dialect-only query (errors on sqlite) is never a false
 * fail. Non-SELECT queries are rejected upstream by buildSqlScript → skip.
 */
export const runSqlCase = async (query: string, spec: SqlSpec, signal?: AbortSignal): Promise<RunResult> => {
  const tc: TestCase = { input: [], expected: spec.expected, source: 'problem' };
  const script = buildSqlScript(query, spec.schema, spec.seeds || []);
  if (script === null) {
    return { case: tc, status: 'error', stdout: '', error: 'sql_not_verifiable', ms: 0 };
  }
  return withRunDirectory(tc, signal, async tmpDir => {
    const scriptPath = path.join(tmpDir, 'script.sql');
    fs.writeFileSync(scriptPath, script, { encoding: 'utf8' });

    const run = await spawnCmd('sqlite3', ['-safe', '-bail', ':memory:'], tmpDir, SQL_TIMEOUT_MS, signal, scriptPath);
    if (run.timedOut) return { case: tc, status: 'error', stdout: trunc(run.stdout), error: `timed out after ${SQL_TIMEOUT_MS}ms`, ms: run.ms };
    if (run.oversized) return { case: tc, status: 'error', stdout: trunc(run.stdout), error: 'output limit exceeded', ms: run.ms };
    // Any sqlite error (-bail → non-zero exit, e.g. MySQL-only constructs, bad
    // column) is an HONEST "couldn't verify", never a wrong-answer verdict.
    if (run.code !== 0) {
      return { case: tc, status: 'error', stdout: trunc(run.stdout), error: `sql error: ${trunc(run.stderr, 300) || `exit ${run.code}`}`, ms: run.ms };
    }
    const parsed = parseSqlRows(run.stdout);
    if (!parsed.found || !parsed.rows) {
      return { case: tc, status: 'error', stdout: trunc(run.stdout), error: 'sql result not parseable', ms: run.ms };
    }
    const ok = compareResultSet(parsed.rows, spec.expected, spec.ordered === true);
    return {
      case: tc,
      status: ok ? 'pass' : 'fail',
      stdout: trunc(run.stdout),
      actual: parsed.rows,
      error: ok ? undefined : `expected ${renderValue(spec.expected)}, got ${renderValue(parsed.rows)}`,
      ms: run.ms,
    };
  });
};

// Go's first compile is slower than g++; `go run` does compile+run in one spawn.
const GO_RUN_TIMEOUT_MS = 15000;

/** Run ONE Go case: build main.go → `go run main.go`. Never throws. */
const runGoCase = async (code: string, entry: string, tc: TestCase, signal?: AbortSignal): Promise<RunResult> => {
  if (!isValidEntry(entry)) return { case: tc, status: 'error', stdout: '', error: 'invalid_entry', ms: 0 };
  const program = buildGoProgram(code, entry, tc);
  if (program === null) return { case: tc, status: 'error', stdout: '', error: 'go_signature_unsupported', ms: 0 };
  return withRunDirectory(tc, signal, async tmpDir => {
    const srcPath = path.join(tmpDir, 'main.go');
    fs.writeFileSync(srcPath, program, { encoding: 'utf8' });
    // GOCACHE/HOME land in the throwaway temp dir (spawnCmd sets HOME/TMPDIR=cwd);
    // `go run` compiles + runs in one process we group-kill on timeout.
    const run = await spawnCmd('go', ['run', srcPath], tmpDir, GO_RUN_TIMEOUT_MS, signal);
    if (run.timedOut) return { case: tc, status: 'error', stdout: trunc(run.stdout), error: `timed out after ${GO_RUN_TIMEOUT_MS}ms`, ms: run.ms };
    if (run.oversized) return { case: tc, status: 'error', stdout: trunc(run.stdout), error: 'output limit exceeded', ms: run.ms };
    const parsed = parseDriverResult(run.stdout);
    if (!parsed.found) {
      return { case: tc, status: 'error', stdout: trunc(run.stdout), error: trunc(run.stderr) || `exited with code ${run.code ?? 'unknown'}`, ms: run.ms };
    }
    if (tc.source === 'smoke') return { case: tc, status: 'pass', stdout: trunc(run.stdout), actual: parsed.value, ms: run.ms };
    const ok = valuesEqual(parsed.value, tc.expected);
    return {
      case: tc,
      status: ok ? 'pass' : 'fail',
      stdout: trunc(run.stdout),
      actual: parsed.value,
      error: ok ? undefined : `expected ${renderValue(tc.expected)}, got ${renderValue(parsed.value)}`,
      ms: run.ms,
    };
  });
};
