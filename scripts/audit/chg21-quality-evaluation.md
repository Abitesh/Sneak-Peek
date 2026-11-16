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
