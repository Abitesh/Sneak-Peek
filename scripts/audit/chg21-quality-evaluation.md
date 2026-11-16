# CHG-21 quality and regression evidence

WORK-0077 / TASK-0004, 2026-11-16. See the [roadmap](../../ROADMAP.md#chg-21--final-intelligence-qualityregression-pass) for acceptance status.

The baseline is the locally built WORK-0076 working tree on main c7d1f790, after CHG-20 passed. The comparison invokes the compiled canonical engine, planner, retrieval coordinator, evidence and prompt assembler, provider router, and generation controller. Fixture adapters return synthetic retrieval results. Actual Ollama llama3.2:3b receives the canonical prompt through a dedicated local test transport. All three runs used the same isolated Ollama 0.33.0 process. Restart attempts found the owned listener still bound, so the comparison used that process and warmed each evaluation. The listener was stopped after the recheck. Model digest and options are in the JSON. This measures genuine model responses with controlled evidence and measures delivery through the engine. The desktop lifecycle and database evidence is separate.

Each case records source calls and counts, prompt byte/token counts, first useful text (at least five non-whitespace characters), final completion, provider terminal reason, and a narrow fact/style rubric. A one-attempt completion must send the canonical prompt and avoid duplicate source calls. The declared raw rubric target is 90%, p95 first useful text at most 2 s, all completed useful answers within 6 s, zero forbidden canary/fact matches, and explicit evidence gaps on two filtered-evidence fixtures. The rubric is an automated screen. It does not prove correctness, completeness, naturalness, or absence of hallucination outside the tested patterns. Small sample timings vary with model cache and machine load. The measured start is engine entry, without capture, STT finalization or final renderer paint.

## Comparable results

| Measure | WORK-0076 baseline | First CHG-21 iteration | Final CHG-21 revision |
| --- | ---: | ---: | ---: |
| Common cases passing text rubric | 12/17 | 15/17 | 15/17 |
| Completed generation | 17/17 | 17/17 | 17/17 |
| Explicit gap for filtered evidence | 0/2 | 2/2 | 2/2 |
| Unrelated document directive quoted | 1 | 0 | 0 |
| Raw timestamp in global result | 42,000 seconds | 42000 with no unit | Absent |
| Duplicate source calls | 0 | 0 | 0 |
| Source calls | 11 | 11 | 11 |
| Provider attempts | 17 | 17 | 17 |
| Input tokens across all common cases | 5,311 | 5,665 | 5,669 |
| Prompt bytes across all common cases | 21,913 | 23,807 | 23,865 |
| P95 first useful text | 2.158 s | 1.335 s | 2.343 s |
| Median engine-to-final text | 3.028 s | 2.237 s | 2.306 s |
| P95 / maximum engine-to-final text | 4.714 s | 4.326 s | 4.803 s |

Review found that the Spanish answer correctly used Spanish but misdescribed FIFO as a priority queue. The supplied-history-only follow-up lacked a completed turn in the same-session store. The answer asked for context instead of guessing. That original fixture stays in the comparison. An additional final case populated the real completed-turn store and correctly used the urgent-jobs explanation, 1.460 s to completion. A compiled regression verifies the same result stays out of a separate session. The final total is 16/18 including that extra case. The two filtered-evidence baseline refusals contained a useful gap acknowledgment in prose, but the old prompt omitted the gap policy. The original regex missed the contraction “don't”; use the raw rubric and manual review together.

The final revision improved targeted grounding and ignored the tested document directive. Final p95 first useful text missed 2 s, and the raw answer rubric missed 90%. The lower median did not establish a tail-latency improvement. The added evidence guidance costs 358 input tokens across 17 cases. No claim of provider-wide injection resistance or product six-second compliance follows from this test.

## Reproduce

Run from the Sneak-Peek repository root. Use an already installed local model. An isolated service can be started in a separate terminal using a disposable HOME and a loopback address. Close the isolated service when the evaluation finishes.

```sh
npm run build
npm run build:electron
node --check scripts/audit/chg21-quality-evaluation.mjs
```

```sh
eval_home=$(mktemp -d)
env -i PATH="$PATH" HOME="$eval_home" OLLAMA_MODELS="$HOME/.ollama/models" \
  OLLAMA_HOST=127.0.0.1:11435 OLLAMA_NO_CLOUD=1 OLLAMA_NUM_PARALLEL=1 ollama serve
```

```sh
eval_dir=$(mktemp -d "$HOME/Downloads/sneak-chg21-quality.XXXXXX")
NATIVELY_TEST_USERDATA="$eval_dir/profile" ELECTRON_RUN_AS_NODE=1 \
  ./node_modules/.bin/electron scripts/audit/chg21-quality-evaluation.mjs \
  "$eval_dir/result.json" dist-electron http://127.0.0.1:11435 llama3.2:3b
node scripts/audit/run-chg20-desktop-acceptance.mjs
```

For a before/after comparison, build the WORK-0076 source in a separate directory with the same dependencies and use its build directory as the second evaluation argument. Compare case IDs common to both runs, model/digest/options, prompt sizes, source calls, completion/first-useful timings and outputs, and review mismatches. Obtain Windows/physical surface or credentialed provider evidence in their corresponding environments. Retain sanitized answer and timing data.

## Remaining acceptance

- P0: Repeat the quality pass for the Spanish factual failure and first-useful tail with a representative approved model and reproducible workload. Required outcome is correct language and facts, at least 90% of the raw rubric, and first-useful p95 at or below 2 seconds under a stated timing protocol. Check correct clarification for incomplete input separately from a completed-session follow-up.
- P0: Measure actual Stop-click to final visible verified answer with stage timings for STT, retrieval, provider and renderer, and measure first useful text separately. Required outcome is useful final answers within 6 s for the approved workload. The current dataset measures engine completion with synthetic evidence and a real local text model. It does not exercise the actual capture and display timing.
- P1: Finish applicable cross-platform and product matrix validation. Physical Phone Mirror, Windows desktop and credentialed text/vision were not exercised. Verify source/privacy, correct selected model and terminal events using authorized synthetic accounts/devices, or document which environments are outside the release scope. Packaging runs need separate approval per the roadmap. Source asset verification is recorded independently.

## Final verification and files

On macOS 26.4.1 arm64, Node 22.18.0, ran `npm run typecheck:electron`, `typecheck:premium`, `typecheck:ts5:electron`, `typecheck:ts5`, `typecheck:ts7`, `build`, `build:electron` and `verify:packaged-local-assets`. All exited zero. Asset integrity check used source mode.

| Command | Passed | Failed | Cancelled | Skipped | TODO |
| --- | ---: | ---: | ---: | ---: | ---: |
| `npm test -- --test-concurrency=4` | 9,034 | 0 | 0 | 67 | 0 |
| `npm run test:intelligence -- --test-concurrency=4`, includes the engine glob | 2,182 | 0 | 0 | 0 | 9 |
| `npm run test:lib` | 382 | 0 | 0 | 1 | 0 |
| `npm run test:scripts` | 99 | 0 | 0 | 0 | 0 |
| Targeted compiled final regressions (behavioral evaluation, Change17, Change18, Phone Mirror, speech provenance and validation) | 62 | 0 | 0 | 0 | 0 |

`node scripts/audit/run-chg20-desktop-acceptance.mjs` passed the final rerun on the CHG-21 build. Both launches exited zero, 14 initial scenarios and one relaunch scenario. Manual cancellation settled before transport release. The cancelled stream attempted a late token, and only the new stream emitted a token and a completion afterward. Selected fallback occurred once before commitment. After commitment there was one error and no second provider. Visible desktop evidence includes the rendered overlay and same-profile relaunch. See `/Users/abitesh/Downloads/Sneak-Peek-WORK0077.YRLAFI/desktop-final/result.json` and screenshots.

Earlier final desktop run failed because a fixture looked for scenario markers throughout conversation history, so a previous marker could intercept the current STOP scenario. The retry matched markers inside the current-question block and waited for actual renderer events. Earlier source-only regressions for ERR-093 and ERR-095 failed against the old compiled behavior and passed after the fixes. All prior failure attempts remain distinguishable from the final pass. See the [CHG-20 surface map](chg20-surface-map.md#work-0077--final-chg-20-acceptance-2026-11-16) for skip reconciliation.

Production changes: `electron/intelligence/engine/PromptAssembler.ts` and `SneakPeekIntelligenceEngine.ts`. Regression additions: `electron/intelligence/__tests__/SneakPeekIntelligenceBehavioralEvaluation.test.mjs`, `electron/intelligence/engine/__tests__/Change17CompletionRegression.test.mjs`, and disposable desktop harness `scripts/audit/chg19-desktop-acceptance.cjs`. Evaluation tool and runbook are `scripts/audit/chg21-quality-evaluation.mjs` and this file. The roadmap, all current tracking records, project overview/tree and CHG-20 surface map were reconciled. Dormant compatibility and separate non-answer tasks are listed in the surface map. The reviewed diff has no changes to native audio, packaging, credentials, RAG storage, selected model/router, or IPC/preload contracts.

Raw files: `/Users/abitesh/Downloads/Sneak-Peek-WORK0077.YRLAFI/quality-baseline.json`, `quality-final.json` (first iteration), `quality-recheck.json` (final), `final-*.log`, and `COPILOT-ASK.md`. The owner updated Git staging during the initial run. The observed later index was preserved byte for byte by the agent. CHG-20 Verified. CHG-21 is Implemented, unverified. C21-AC1 passes the authorized local regression scope. C21-AC2 remains open. CHG-22 stays gated.


## WORK-0078 — Repeated local model and rendered acceptance (2026-11-17)

**C21-AC1 PASS for authorized local scope. C21-AC2 remains open.** CHG-22 has not begun. See these results before relying on earlier WORK-0077 measurements.

### Reproduction and verified changes

- ERR-097: the compiled engine formerly resolved a denied follow-up against stored history before enforcing conversation permission. Gate resolution and returned conversation context, including cancellation. An allowed prior topic is still resolved, while denial leaves the literal question and no previous turns.
- ERR-098: the explicit Follow-up surface now selects its authorized request snapshot when the question is referential and the session has no indexed antecedent. The snapshot has no citation authority. The original follow-up and the separate completed-session case both passed all three repeats.
- ERR-099/101: Spanish, French and German explicit screen references select an attached, permitted screen. Treat OCR as data at the prompt boundary. The English OCR command canary was quoted at an intermediate revision. The unchanged Spanish OCR question identified the permission error and omitted the canary on the final repeats. No model-wide resistance claim follows.
- ERR-100: remove a leading “according to the meetings” wrapper and a narrow trailing answer-format instruction only from the saved/global retrieval query. Do not change the actual question, selected source, number of reads, matching threshold or ranking. The failing real global request recovered both authorized rows in one production read.
- ERR-102: compact global meeting evidence to explicit title and speaker fields while retaining complete internal typed provenance. The first attempt changed single-meeting formatting, causing a saved fallback verification failure and a single-meeting citation miss in the benchmark. Restored the single-meeting path and its fallback markers. The first focused global-format fixture also failed because the generic test builder discarded retrievalScope. The corrected fixture exercises the actual scoped branch and asserts visible labels and the preserved internal timestamp. Final focused suite passed 71/71.
- General standalone response prompts ask for concrete definitions, distinct comparison rules and code constraint checks. The expanded TypeScript case originally mutated its input. The final model returned a copy-based numerical sort in all repeats.

### Real model results

macOS 26.4.1 arm64, Node 22.18.0, existing Ollama 0.33.0 and llama3.2:3b. The fresh WORK-0077 baseline at 95282d41 and three final repeats use the same local model, deterministic engine evaluator settings and unchanged 17 common prompts/assertions. Each final repeat also runs the existing completed exchange plus eight new case types. Tagged provider events report model load, prefill and decode. The engine benchmark still uses synthetic retrieval. First useful text is the established five-character proxy. The renderer benchmark below uses actual scoped SQLite retrieval and the production Ollama transport.

| Run | Original 17 raw passes | Expanded raw passes | Original p95 first useful (ms) | Expanded p95 first useful (ms) | Maximum completion, all cases (ms) | Common input tokens |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Fresh WORK-0077 | 15/17 | 16/18 (no new cases) | 1049 | 1049 (18 cases) | 2104 | 5669 |
| Final 1 | 17/17 | 24/26 | 1020 | 824 | 2117 | 6058 |
| Final 2 | 17/17 | 24/26 | 1994 | 1994 | 6887 | 6058 |
| Final 3 | 17/17 | 24/26 | 2052 | 2052 | 4985 | 6058 |

Keep the raw result alongside human review. The Spanish FIFO definition passes the original regex but incorrectly calls FIFO a priority queue in every repeat. The Spanish stack/queue comparison remains wrong. The French LRU paraphrase omits the matcher’s literal words. No score was changed to compensate for these. The OCR/injection, non-mutating code, completed follow-up, denied-file and missing-evidence controls show concrete gains. All common runs made 11 retrieval calls, with zero duplicate scopes. The slower repeat spent about 6.55 s in model decoding on the failed Spanish comparison. Median prefill across final runs was about 80–209 ms and median decoding about 644–1575 ms. Run 3 also missed the p95 target. This current fresh baseline was much faster than the historical 2.343 s p95. The repeated results do not establish a general speed improvement.

### Rendered global search and STOP

The optional desktop run exercises the real launcher, actual scoped reads, the regular provider controller and production loopback transport with an isolated profile and synthetic meetings. The other lifecycle/vision cases retain deterministic transports. Captured at action submission, IPC arrival, scoped SQLite retrieval, first non-whitespace provider text, first rendered text and complete answer matched to the stream. The visible measurements include polling/paint overhead. STT is not applicable to saved meetings. Each trial made one scoped read and one provider attempt, and the prompt omitted the personal canary.

| Case | Action→IPC ms | Retrieval ms (rounded) | Provider→first ms | Action→first visible ms | Action→complete visible ms | Full grounded answer |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| ambiguous-singular-reference (1) | 308 | 1 | 160 | 797 | 2117 | Partial |
| ambiguous-singular-reference (2) | 306 | 1 | 40 | 719 | 1521 | Partial |
| ambiguous-singular-reference (3) | 308 | 1 | 39 | 451 | 1223 | Partial |
| explicit-multiple-meetings (4) | 307 | 1 | 2339 | 3154 | 6268 | Yes |
| specific-grounded-lookup (5) | 307 | 1 | 2198 | 2780 | 3931 | Yes |

The first desktop experiment returned no evidence for the original ambiguous request and all three visible answers were refusals (844–1394 ms). The query fix brought both records back. Before attribution changes the model answered a single reason with no meeting title in all three runs. Compact labels reduced that same two-record prompt from 3,520 to 2,568 bytes, and the tested model consistently named the source of the reason it reported. It still omitted the second matching record in the ambiguous singular case. The explicit plural and specific cases both returned supported, appropriately attributed answers. The plural case took 6.268 s. An earlier run of the same final production source had an incomplete ambiguous answer at 6.467 s.

Final two-launch smoke passed (19 initial scenarios and 1 relaunch scenario). The suite distinguishes an observed live-model timing/quality miss from an IPC/renderer failure. The true overlay X-click-to-settlement samples were meeting 2.5 ms, global 12.7 ms. The manual renderer preload cancellation request settled in 1.5 ms while the transport remained parked. Its released late token did not arrive, and the next request completed under a different stream ID. Pre-commit fallback, model ownership, post-commit no-fallback, protected meeting scope, WTA, Code Hint and image/preload cases passed their existing checks. See `/Users/abitesh/Downloads/Sneak-Peek-WORK0078.oKvPpI/desktop-final/result.json` and the screenshots.

### Commands and scope

Both builds, five TS checks and source asset validation exited 0 on the final production tree. The exact commands were `npm run build`, `npm run build:electron`, `npm run verify:packaged-local-assets` and `npm run` for each of `typecheck:electron`, `typecheck:premium`, `typecheck:ts5:electron`, `typecheck:ts5`, `typecheck:ts7`. Use disposable `NATIVELY_TEST_USERDATA` directories.

| Final suite | Pass | Fail | Cancelled | Skip | TODO |
| --- | ---: | ---: | ---: | ---: | ---: |
| `npm test -- --test-concurrency=4` | 9034 | 0 | 0 | 67 | 0 |
| `npm run test:intelligence -- --test-concurrency=4`, explicit engine glob | 2186 | 0 | 0 | 0 | 9 |
| `npm run test:lib` | 382 | 0 | 0 | 1 | 0 |
| `npm run test:scripts` | 99 | 0 | 0 | 0 | 0 |
| Targeted compiled behavior, transcript, prompt, cancellation, Phone Mirror and validation | 71 | 0 | 0 | 0 | 0 |

The baseline categories persist: 67 Electron skips cover retired OCR contracts, external or missing API/evaluation fixtures, generated artifacts and opt-in/platform/toolchain cases. Nine intelligence TODOs describe future system baselines. One lib skip is an absent API review ledger. Separate prerecorded Whisper tests ran in the Electron suite. Those separate checks do not measure the full live Listen/Analyze path. No current-tree Windows desktop, physical Phone Mirror, credentialed cloud/vision or packaging evidence. The compiled Phone Mirror source and denial tests passed.

Use the earlier Ollama setup steps with `OLLAMA_HOST=127.0.0.1:11436`. Run `ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron scripts/audit/chg21-quality-evaluation.mjs OUTPUT.json dist-electron http://127.0.0.1:11436 llama3.2:3b --extended`, repeating with fresh disposable profiles. Run `node scripts/audit/run-chg20-desktop-acceptance.mjs --local-ollama` after building both app bundles. The optional macOS rule opens only the loopback Ollama port. Preserve and score each case, including the observed failures. Raw runs, command logs and independent review prompt: `/Users/abitesh/Downloads/Sneak-Peek-WORK0078.oKvPpI`.

### Completion checklist

1. P0 quality. Resolve the observed FIFO/LIFO factual errors and ambiguous multi-meeting omission, then obtain representative repeated results with at least 90% correct by raw rubric and review of factual mismatches. Retain denial, injection and code-constraint controls. The current raw percentage alone is insufficient evidence.
2. P0 timing. Meet p95 first useful <=2 s and useful final visible answers <=6 s across the agreed cold/warm workload. Preserve complete answers and measure the actual Listen/Analyze journey from trigger through STT readiness, scoped retrieval, provider start, first useful text and final paint. Record STOP settlement separately with late-event rejection. The saved meeting data covers a route without live STT, and includes a complete-answer deadline miss.
3. P1 release matrix. Finish the supported Windows desktop, physical Phone Mirror and credentialed text/vision checks where applicable and record selected model, authorized evidence and single terminal delivery. Use separate approval for any package/signing work. Retain exact limitations until the corresponding environment is tested.
4. CHG-22. After C21-AC2 passes, audit every proposed removal for imports/exports, dynamic references, IPC, UI, database and migration use, runtime paths, tests and its verified replacement. Run compile, suites and equivalent desktop/platform scenarios on every removal scope and review the final diff and records. No deletion is approved by this report.

Git started clean on main 95282d41. The index was compared byte for byte after implementation. Native audio, credentials, provider choice/commitment, IPC, RAG storage and packaging paths have no source changes.
