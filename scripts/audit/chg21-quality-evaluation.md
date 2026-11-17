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

## WORK-0079 — Acceptance evidence (2026-11-17)

**Checkout:** clean `main` at `3205976e8fb30e0c8be7450523cb716dbe891eeb` at intake. macOS 26.4.1 arm64, Node 22.18.0, Electron 43.1.0. Evidence directory: `/Users/abitesh/Downloads/Sneak-Peek-WORK0079.cgAvl4`.

### Verified desktop behavior

- The full-product macOS fixture drove 15 rendered manual chat, follow-up, project ingestion, résumé and portfolio scenarios. The named followed-up project and its sibling each read the exact appropriate project scope. A real renderer session reset and controller clear excluded the former conversation. The broad portfolio read included only explicitly tagged project IDs, plus authorized résumé evidence through its own capability. The unrelated general upload stayed out of the prompt.
- The actual Listen and Analyze controls used synthetic finalized text for two speakers. Listen-to-fixture-ready was 3 ms and Listen-to-final-transcript-visible was 120 ms. Analyze-to-finalize IPC was 1 ms, to provider dispatch 287 ms, to first visible answer text 493 ms and to complete unblurred paint 851 ms. One stream emitted two chunks and one done. The fixture supplied capture readiness, transcript and the model transport. This measures the real UI handoff and reveal. Physical STT recognition and live-model decode on that route remain unverified.
- Clicking the real STOP control aborted the parked provider within 1 ms resolution. Its attempted late token and terminal answer were absent, and the settled paint sample was 275 ms after click. The separate renderer-preload fixture settled in 1.1 ms before transport release and then recovered under a new stream ID with one completion. Both desktop launches passed their 19 + 1 scenarios. The same isolated profile, actual meeting/global overlay cancellation, typed image IPC, selected model and pre-commit fallback checks passed.

| Real global case | Action to IPC (ms) | Scoped retrieval (ms) | Provider to first text (ms) | Action to first visible (ms) | Final visible (ms) | Factual result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Ambiguous singular 1 | 107 | 1 | 2251 | 2746 | 5242 | Both reasons, correctly attributed |
| Ambiguous singular 2 | 106 | 1 | 402 | 914 | 3488 | Both reasons, correctly attributed |
| Ambiguous singular 3 | 108 | 1 | 47 | 899 | 3509 | Both reasons, correctly attributed |
| Explicit plural | 106 | 1 | 2403 | 2904 | 5145 | Both reasons, correctly attributed |
| Specific lookup | 107 | 1 | 2420 | 2610 | 3777 | Requested meeting only |

The corresponding WORK-0078 IPC samples were 306–308 ms. Removing the 200 ms cosmetic delay reduced the current samples to 106–108 ms. The previous explicit plural trial completed in 6268 ms. All five current final paints were within 6 seconds. Three of five first-visible samples exceeded 2 seconds. The newest global two-record prompt is 2673 bytes for the original ambiguous question, compared with 2568 bytes in WORK-0078 and 3520 before its human-readable titles. The after-evidence policy needed additional input text to recover both sources. Each trial used one authorized read and one selected local-model attempt. Neither storage scores nor the provider transport changed. See `desktop-final/result.json`, `desktop-final/initial-local-global-1.png` and `desktop-lifecycle-final/chg21-lifecycle.json` in the evidence directory.

### Reproduced defects and unsuccessful attempts

- ERR-045, ERR-105 and ERR-106. Follow-up lost its exact project scope at the mode source decision, which required a résumé for the profile-family switch. After adding a project-only grant, the sibling switch exposed the prior mixed renderer snapshot. After excluding the snapshot on that route, the portfolio exposed the missing tagged-ID list. Keep the exact intended project allowlist plus the separately authorized résumé capability. General CS requests and the sibling project cannot read unrelated files. One desktop attempt cleared only backend state in its fixture. Sending the existing reset event, then checking cleared renderer and backend state, fixed that evidence defect.
- ERR-107. The first snapshot exclusion suppressed typed image continuity for a generic image description that had an empty inferred project lookup. The existing image transport test exposed the regression. The final rule requires actual selected pixels, authorized history and absence of a private factual grounding requirement for that exception.
- ERR-102. An attribution instruction before the question consistently produced one of two relevant answers. Removing the ranking labels alone had the same issue. The after-evidence instruction handled the original singular wording and correctly excluded the nonmatching meeting on the specific lookup. The neutral-rewording diagnostic gave a false attribution and was rejected. The actual final prompt retains the literal question. The compiled regression covers two different meeting identities with identical evidence text.
- ERR-103 and ERR-108. One wider factual prompt repaired the ordering definition but produced mutating code. A later prompt improved the comparison and broke the missing-referent clarification. The final rules target explicit explanations and missing follow-ups separately, retaining the original code-output guidance. The independent reading of raw rubric passes also exposed a generic interview explanation routed to stored meeting evidence and conflating recency with frequency. The generic interview phrase now leaves the underlying concept in general knowledge. A factual question about a specific interviewer still selects meeting evidence.
- ERR-104. A first desktop screenshot showed the final words were still blurred despite the DOM already containing the complete sentence. The final fixture waits for the opacity and blur to settle plus two frames. Model response timing remains a separate measurement. On the slow warm diagnostic the 511-token screen case spent 2498 ms in local-model prefill and 1 ms before provider dispatch. In the fresh baseline the denied-document completion spent 6035 of 7411 ms decoding redundant text. The final missing-evidence instruction names the gap once and permits supported partial answers.

### Historical issue reconciliation

| Records | Current disposition |
| --- | --- |
| ERR-001, ERR-010–012, ERR-014 and BUG-001 / FEAT-005 | Credentialed provider connection, persistence and catalogue acceptance remain separate. Current offline suites check code-level guards. The disposable profile had no owner credentials. |
| ERR-002, ERR-038 and BUG-002 / FEAT-008 | Verified synthetic ingestion, résumé, exact project and follow-up behavior on this checkout. The original owner's source availability and request correlation remain open. |
| ERR-003 / BUG-003, ERR-021, ERR-040 and FEAT-010 | Installed-app, entitlement and native quit evidence require their own approved environment. The isolated development app quit cleanly. Brand and distribution work remain separately tracked. |
| ERR-004, ERR-008, ERR-060–064 / BUG-004 | Hosted CI and platform issues remain distinct. The current local macOS suites passed under controlled concurrency. A prior CI or missing build-output incident is not proof of a current platform pass. |
| ERR-005 / FEAT-002 / FEAT-006 | Current local inference and renderer latency are measured below. The separate fast-response preference/provider feature still needs its own confirmed acceptance. |
| ERR-009, ERR-015, ERR-018 and ERR-039 / BUG-005 | Hindsight readiness and credentialed embedding/recovery are separate service work. Local application tests cover configured behavior and authorized source boundaries. |
| ERR-006–007, ERR-013, ERR-016–017, ERR-019–020, ERR-023–037 and ERR-041–047 | Historical scoped project/profile, conversation, timeout and source-locator regressions retain their individual evidence and scope. Current compiled project tests and rendered source/reset checks reaffirm ERR-019, ERR-023, ERR-027–028, ERR-041 and ERR-044–045 on the exercised paths. Live timeout and parity observations remain limited to their original verification. |
| ERR-048–059 / STAB-001 | Current synthetic desktop scenarios reaffirm exact named/sibling and portfolio scope, permitted résumé selection, visible paint and overlay cancellation. Current compiled suites exercise supported parser, profile, cache, entity and query isolation regressions. Retained historical variants and external runtime checks remain open at their original scope. |
| ERR-065–096 / TASK-0003 | Current local suites, provider/IPC regressions and two-launch desktop evidence reaffirm the verified CHG-20 paths. Physical handset, actual credentials and non-macOS desktop are external coverage. ERR-076's speech-source and context regressions are included in the current core suite. |
| ERR-097–102, ERR-103–108 / TASK-0004 | Current bench and desktop cover the reported typed-history, missing referent, Spanish OCR, injected text, project and meeting-attribution examples. Remaining blockers relate to repeatable latency, workload breadth, external verification and independent review. |

CHG-22 depends on CHG-21 and evidence for each affected predecessor responsibility. Earlier CHG-17/18 local scoped verification does not replace the broader acceptance still recorded for those changes. Keep compatibility and data migration paths until candidate-specific caller and equivalent behavior evidence is available.

### Repeated model runs and factual review

All rows preserve the original 17 cases and the 26-case expanded workload. The runner used the installed loopback `llama3.2:3b` model with temperature 0, seed 177, context 4096 and a 120-token evaluation budget. The timed transport streamed real model text through the compiled canonical engine and controller. Retrieval was deterministic fixture data. Warm runs used a readiness request. Each cold-start run unloaded the model before its first fixture, with subsequent fixtures using the resident model. See `quality-summary.json` and the individual reports for the exact model and binary hashes.

| Run | Original raw | Expanded raw | Expanded factual review | Expanded first-text p95 (ms) | Maximum engine completion (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fresh WORK-0078 baseline | 17/17 | 24/26 | 22/26 | 2829 | 7411 |
| Final warm A | 17/17 | 25/26 | 25/26 | 1596 | 5006 |
| Final warm B | 17/17 | 25/26 | 25/26 | 1560 | 4870 |
| Final warm C | 17/17 | 25/26 | 25/26 | 1558 | 4998 |
| Final cold-start A | 17/17 | 25/26 | 25/26 | 2368 | 5114 |
| Final cold-start B | 17/17 | 25/26 | 25/26 | 2104 | 4713 |

The first-text proxy is at least five nonblank leading characters. It is a lower bound for a user-visible useful phrase. The actual renderer timings above are separate. The first cold fixture reported 1368 and 1089 ms of model load, 2368 and 2175 ms to first text, and 4310 and 4152 ms to completion. Median engine planning was 0.452–0.544 ms, coordinator retrieval 0.034–0.040 ms and evidence/response plan/prompt assembly 0.229–0.264 ms. Median model prefill was 326–820 ms and median decoding 1151–1285 ms. Trial-level data records larger prefill spikes. The final suite made 14 retrieval calls per run versus 15 in the baseline after the generic interview route stopped asking for a transcript. Each run had zero duplicate source calls, 26/26 prompt-integrity checks and no emitted injection canary. Input tokens changed from 8897 to 8946 across 26 cases.

Codex read each distinct final answer, then confirmed that the exact text matched across all five final runs. This is separate from the regex score. The baseline's FIFO priority-queue claim, incorrect stack/queue contrast, imprecise French LRU explanation and unsupported missing-referent claim failed this stricter review. All four improved. The final French answer states least recent use through the longest time since access, so it passes the factual review and retains its raw regex miss. One single-record global benchmark answer added unsupported wording about the reason being attributable to the speaker. Its raw match passes and the factual review treats it as incomplete. The rendered specific and multi-record cases correctly attributed the requested facts. The copy-sort code retained the non-mutation constraint and the denied and injection cases withheld the private canaries.

A final read-only latency diagnostic replayed the captured synthetic prompts through the same installed model. A stable evidence prefix reduced later-query prefill from 609–612 ms to 213 ms. Shortening that variant reduced its first-query prefill from 1305 to 878 ms. Both rearrangements omitted the second authorized answer on the ambiguous question, so the previously verified request order was retained. Raw answers and stage measurements are in `global-latency-diagnostics.jsonl`.

### Final local regression checks

| Command | Passed | Failed | Cancelled | Skipped | TODO |
| --- | ---: | ---: | ---: | ---: | ---: |
| `npm test -- --test-concurrency=4` | 9034 | 0 | 0 | 67 | 0 |
| `npm run test:intelligence -- --test-concurrency=4` including the engine glob | 2192 | 0 | 0 | 0 | 9 |
| `npm run test:lib` | 382 | 0 | 0 | 1 | 0 |
| `npm run test:scripts` | 99 | 0 | 0 | 0 | 0 |
| Four focused intelligence, portfolio, project-scope and RAG IPC files | 63 | 0 | 0 | 0 | 0 |

All five final commands exited zero: `npm run typecheck:electron`, `npm run typecheck:premium`, `npm run typecheck:ts5:electron`, `npm run typecheck:ts5` and `npm run typecheck:ts7`. `npm run build`, `npm run build:electron` and `npm run verify:packaged-local-assets` passed. The asset check was source-mode. The first compiler attempt reported two implicit-any callbacks for new project ID mapping; declaring the existing file record type fixed it. The first focused batch had one test-fixture mismatch over the coarse intent of “according to”. The test now checks canonical global scope overriding that hint, one scoped read, two retained identities and preserved raw scores. The corrected focused and broad suites passed. `checks/commands.txt`, `checks/exits.txt` and `checks/final-exits.txt` retain the initial and final dispositions.

Electron skips cover the retired OCR API, absent optional benchmark or API sources, opt-in live Hindsight and network integration, generated mode fixtures, Ollama bootstrap edge cases, Windows-only checks and unavailable Go/Java toolchains. The intelligent source/vision/IPC/lifecycle paths ran in the applicable compiled tests and disposable macOS scenarios. Intelligence TODOs cover future memory, search, lecture, diagram, fusion and cross-user baselines. The one library skip is the absent backend review ledger. These counts remain explicit.

Reproduce with the disposable loopback environment described above, then run the same extended command with `--cold-start` for first-request cold trials. Keep timing runs separate from TypeScript, builds, and broad tests. Re-run the two desktop commands `node scripts/audit/run-chg20-desktop-acceptance.mjs --local-ollama` and `node scripts/audit/run-stabilization-full-product.mjs`. Store raw results and screenshots under a new Downloads subdirectory.

### Acceptance and remaining verification

**C21-AC1 PASS for the authorized local scope. C21-AC2 remains open.** The factual quality target passed on these fixtures and saved-meeting final paints reached 3.488–5.242 s. The cold-start suites and real rendered first-visible answers missed the two-second target. Live STT with an approved capture source and real model still needs complete trigger-to-paint measurements. Windows desktop, physical Phone Mirror, credentialed real text/vision and separately authorized packaging checks remain external. An independent Copilot Ask request and the exact prompt were saved. VS Code did not expose the response to the automation interface, so that result remains unverified.

**CHG-22 remains gated. C22-AC1 and C22-AC2 have no deletion acceptance evidence.** After the CHG-21 gate and applicable predecessor scope pass, inspect importer/exporter, dynamic, IPC, renderer, database/migration, compatibility, test and runtime replacement evidence for each proposed removal. Then verify equivalence on affected surfaces and record the final diff and checks.

Git started clean on main 95282d41. The index was compared byte for byte after implementation. Native audio, credentials, provider choice/commitment, IPC, RAG storage and packaging paths have no source changes.

## WORK-0080 — Meeting attribution, model residency and desktop timing (2026-11-17)

Continued main `3205976e` with the 21 staged WORK-0079 paths intact. Evidence: `/Users/abitesh/Downloads/Sneak-Peek-WORK0080.C2uoKO`. The Mac is an Apple silicon Mac16,13 with 16 GiB RAM. A disposable Ollama 0.33.0 daemon used only the installed `llama3.2:3b` Q4_K_M weights, a loopback port, cloud disabled, one parallel model slot and a 4096-token context. Logs show all 29 model layers offloaded to Metal and Flash Attention enabled automatically. No model was downloaded. Chromium used software rendering inside the disposable desktop harness. Hardware power consumption was not measured.

### Attribution and factual evaluation

A fresh WORK-0079 baseline reproduced the unsupported claim that a reason for selecting violet leases was attributable to the speaker. Only the decision was present in the record. The global prompt had asked for a reason unconditionally. The corrected prompt cites speakers for reported statements and requires both a request and evidence to give a reason. Separate meeting identities and the after-evidence instruction are retained. Rendered specific and ambiguous multi-meeting controls still require the correct attribution for each meeting.

The unchanged 17 original and 26 expanded cases retained their negative checks. Codex read each distinct answer and checked textual equality across repeats independently of the raw regex. Baseline factual review was 25/26. Every repeat below was 26/26 on those facts and 25/26 by the raw rubric. The French LRU answer still uses the accurate longest-time-since-access wording that the raw rubric misses. The test retained the raw miss. The removed attribution error had passed the raw rubric. The non-mutating sort, Spanish FIFO and stack-versus-queue, denied/missing documents, document and OCR canaries, and follow-ups retained their original checks.

| Model run | First case state | First case useful text | 26-case first-text p95 | Slowest engine completion |
| --- | --- | ---: | ---: | ---: |
| Fresh WORK-0079 baseline | Daemon first unloaded turn | 4487 ms | 1132 ms | 5428 ms |
| Warm smoke with correction | Resident | 643 ms | 815 ms | 2357 ms |
| Repeated unloaded 1 | Unloaded | 1475 ms | 1054 ms | 2429 ms |
| Repeated unloaded 2 | Unloaded | 1490 ms | 1189 ms | 2511 ms |
| Repeated unloaded 3 | Unloaded | 1518 ms | 1396 ms | 2467 ms |
| Repeated preloaded 1 | Resident before action | 667 ms | 1316 ms | 2380 ms |
| Repeated preloaded 2 | Resident before action | 685 ms | 1566 ms | 2392 ms |
| Repeated preloaded 3 | Resident before action | 756 ms | 1448 ms | 2425 ms |

First useful text is five characters after trimming. Only the first case is unloaded in each unload-start run. The other 25 cases are resident. Repeated unload tests do not flush the OS file cache or model runtime caches. The first baseline's model load took 3824 ms, with 622 ms prefill. Later repeated unloads took 797–817 ms to load and 621–670 ms to prefill. The content-free preloads took 799–811 ms on those engine trials and made 2,548,417,166 bytes resident in Ollama's reported memory, before the request. Median planning and evidence assembly each stayed below 0.3 ms in the engine tests, with synthetic retrieval below 0.03 ms. Input changed from 8946 to 8957 tokens across 26 cases. The baseline and final repeats each made 14 reads, with no duplicated read, no emitted canary, and 26/26 prompt integrity checks. The small token increase is the targeted attribution instruction.

### Real macOS search and local provider behavior

The global search harness uses the actual launcher and overlay, real scoped RAG and production Ollama transport with a synthetic binding for one installed model. It timestamps Return, IPC ingress, authorized retrieval, provider dispatch, first five characters from the provider, IPC delivery, and first and final visibility. Visibility checks the answer bounds and ancestor opacity, then waits two renderer frames. Final visible text matched the delivered stream. Both captures of each search type used disposable profiles and preserved the loaded-build and Git-index hashes through same-profile relaunch.

| Workload | Useful attributed results | First-visible p95 | Final visible range |
| --- | ---: | ---: | ---: |
| WORK-0079 comparison | 5/5 | 2904 ms | 3488–5242 ms |
| WORK-0080 unloaded first query, then four resident turns | 5/5 | 5898 ms | 1445–7058 ms |
| WORK-0080 preloaded first query and four resident turns | 5/5 | 2083 ms | 1611–3202 ms |

The production-style unloaded global request took 7 ms to dispatch, 5764 ms in the transport before five characters, and 128 ms from their IPC send to the visibility observation. The Ollama runner spent about 3792 ms loading the weights before it began evaluating the prompt. Thus the cold miss exists before the renderer. The prepared run loaded the same model in 2823 ms ahead of the action. Its first answer took 1893 ms from provider dispatch to five characters and 182 ms from first useful IPC to visibility. Other prepared trials reached visible text in 414–1208 ms. Retrieval took about 1 ms and trigger-to-provider dispatch took 6–56 ms during prepared trials. The earlier mandatory 100 ms renderer delay was removed while preserving timer teardown and the single-submit guard. Frame and polling measurements include the observation delay. These timings establish a limitation of this machine, local provider, and workload under the tested conditions.

Production model activation and the existing authorized Ollama startup path may preload a selected, locally installed text model on a literal loopback endpoint. The preload sends only the model ID and an empty message list, disallows redirects, refuses remote aliases, and has a five-minute residency and eight-second request bound. In-flight preload is cancelled on model or endpoint change. Real generation retains the existing thirty-minute active-turn lease and uses the current provider binding. Immediate unload on switching was avoided because it can race actual in-flight generation. Residency can therefore persist until the bounded lease expires. No output limit, timing definition or model selection policy was changed. See [Ollama model preload and residency](https://docs.ollama.com/faq#how-can-i-preload-a-model-into-ollama-to-get-faster-response-times).

### Listen/Analyze and Auto language diagnostics

The deterministic Listen/Analyze and STOP controls ran on the actual UI with injected English speaker turns. The opt-in real-generation fixture captured the exact compiled prompt with the appropriate local model tier. Three fixed-seed replays of the original prompt answered in transliterated Hindi. Omitting the list of languages and then shortening the automatic language instruction both restored English in each of three replays. The compact version saved 49 input tokens on this prompt. It retains automatic detection, an English default when ambiguous and unchanged explicit pins. At least one replay still gave a misleading overflow analogy. This is preserved in `listen-language-diagnostic.jsonl`; language correctness alone is insufficient to score the full answer. A diagnostic fixture also paired a cloud-tier prompt with the local model. It exposed why prompt tier must match the fixture's bound model and is excluded from the scoped final run. Physical audio capture and STT remain outside the disposable fixture.

The first prepared global harness left the shared local summary fallback enabled and exposed a burst of startup mode-section compilations competing for the single local runner. It stalled the global request. Startup compilation is separate from the timed answer workload. A selected-only preload object exercised the same production preload without changing the shared helper selection for these unrelated startup jobs. The failed run is retained. No production Notes or mode-section scheduling changes were made. This run does not establish concurrent local startup-compilation performance.

### Final rendered regression, measurements and acceptance

Copilot Ask independently checked the source. It confirmed the content-free load, bounded leases, language pins, source provenance and provider commitment. It identified that a closed global request's completion could reset a replacement request's shared buffer and busy flag. The review also found that the global overlay accepted an untagged completion, although current producers consistently tag it. The renderer now uses per-request ownership like the meeting overlay. It accepts scoped terminal events only and prevents a stale callback or finally block from resetting a replacement. The new behavioral test triggers the real renderer callbacks. It failed against the WORK-0079 index because the old finally block reset the active guard. It passed on the final tree. One earlier desktop run independently missed the final repeated-Enter text after both chunks and its completion were sent. Subsequent full desktop runs passed. The earlier timeout's specific cause was not established. The reviewer lacked direct access to the complete Git diff. Codex separately reviewed the complete diff and checked the index. See `copilot-reviewed-findings.md` and `ownership-before.log` in the evidence directory.

The final two-launch run (`ownership-global/result.json`) passed 19 initial observations and one same-profile relaunch. Those observations included 14 deterministic lifecycle and surface checks and five real local-model queries. All five final answers used the requested meeting evidence. First-visible p95 was **2263 ms**, and all final answers painted in **1648–3706 ms**. Ollama reports 1975 ms of prefill and 1647 ms of decoding on the first prepared query. Its initial five characters reached the renderer bridge after 2084 ms of action-to-IPC time in that run, with presentation and sampling adding the rest. A preceding prepared retry also correctly completed the lifecycle, but one answer cited only one of the two relevant meetings even though both source IDs were returned. This reopens the model-completeness portion of ERR-102. Keep the miss visible rather than forcing both citations on the narrower question, for which the same two retrieved results include an irrelevant record. Across the five measured batches, 24/25 real global answers passed the intended attribution. The unchanged single-record case passed in every final engine repeat. The extra final engine preload repeat scored 26/26 factually and 25/26 raw, reached 1719 ms first-useful p95 and 3328 ms maximum engine completion.

The three completed rendered Listen/Analyze runs with real local generation and injected speaker turns first displayed useful text in **636–4566 ms** and painted the final answer in **2733–11010 ms**. The short Auto instruction restored English. Factual review found a correct explanation without the requested example and two imprecise openings about what a bounded queue limits. A narrower example-prompt replay still had imprecise openings on two of three fixed seeds and was rejected. The multilingual diagnostic reproduced Spanish first-in-first-out at both seeds, with unnatural wording. Both French diagnostic answers said LRU never removes the most recently accessed entry, which is too broad for a single-entry cache. The separate frozen French case answered correctly. This is partial real-model coverage. It does not add eligible scored cases to the frozen 26-case workload. The slowest rendered Listen turn spent 283 ms before provider dispatch, 4082 ms in provider prefill, and 6369 ms decoding 177 tokens. The model was already resident. The renderer painted the final answer 244 ms after transport finished. This establishes a warm inference bottleneck at the demonstrated load and explains why preloading alone cannot meet the two targets.

Both final stabilization variants passed 15 product scenarios plus Listen/Analyze and toolbar STOP. The deterministic variant used a fake provider. The opt-in variant used the production Ollama transport only for the injected Listen turns so that a real answer could be timed. STOP retained a delayed synthetic provider to exercise deliberately late output. Observe event counts and abort-to-settlement timings in each `chg21-lifecycle.json`; the STOP run accepted the one pre-click token, rejected the deliberately late chunk, and emitted no extra terminal. Final STOP abort was recorded within the same millisecond and settlement took 109 ms on the real-generation fixture run and 189 ms on the deterministic run. Physical audio, speech recognition and actual capture authorization were not exercised.

| Final command | Passed | Failed | Cancelled | Skipped | TODO |
| --- | ---: | ---: | ---: | ---: | ---: |
| `npm test -- --test-concurrency=4` | 9030 | 0 | 0 | 67 | 0 |
| `npm run test:intelligence -- --test-concurrency=4` including engine tests | 2192 | 0 | 0 | 0 | 9 |
| `npm run test:lib` after the ownership correction | 383 | 0 | 0 | 1 | 0 |
| `npm run test:scripts` after the ownership correction | 99 | 0 | 0 | 0 | 0 |
| Five focused owner, prompt, language, preload and RAG IPC test files | 55 | 0 | 0 | 0 | 0 |

The Electron count is four lower because the old mocked prompt warmers were replaced with seven tests of the production method. Four cloud routing tests now also assert deduplication. The tests retain no-client, local-only, error and switch coverage and add loopback, no prompt, bounded residency and abort checks. The existing language-pin suite adds Auto assertions. Five TypeScript checks passed (`typecheck:electron`, `typecheck:premium`, `typecheck:ts5:electron`, `typecheck:ts5`, `typecheck:ts7`), as did renderer and Electron builds and source-mode `verify:packaged-local-assets`. The renderer checks, both builds, library and scripts suites ran again after the renderer-only ownership correction. Unchanged skips and TODOs are classified in WORK-0079 above. They do not count as passes. Failed desktop and prompt experiments remain in the same evidence directory.

Reproduce with `ELECTRON_RUN_AS_NODE=1 NATIVELY_TEST_USERDATA=DISPOSABLE_PROFILE ./node_modules/.bin/electron scripts/audit/chg21-quality-evaluation.mjs PATH_TO_JSON dist-electron http://127.0.0.1:11436 llama3.2:3b --extended --cold-start` and replace the last flag with `--preload-start` for the corresponding ready trials. Run `node scripts/audit/run-chg20-desktop-acceptance.mjs --local-ollama` or add `--preload` to repeat the prepared comparison. Use a deliberately unloaded local model before the unprepared desktop trial. Run `node scripts/audit/run-stabilization-full-product.mjs --local-ollama` for real local generation with injected speech and omit the flag for the deterministic control. Keep evaluation isolated from builds and parallel test load. The raw evidence records model and compiled-file hashes.

**C21-AC1 PASS for the authorized local scope. C21-AC2 open.** The frozen quality workload passes. Repeated approved rendered workloads still need p95 first useful text at or below 2000 ms and complete useful visible answers within 6000 ms. Test genuinely unloaded and already-resident cases separately. The applied model readiness path helps but does not make unloaded inference meet the limits. Retain complete answers, correct hypothetical examples, every matching meeting, narrow-result exclusions, privacy and first-token commitment. The tested local model still shows output variance. Separately execute the full physical Listen/Analyze STT-to-paint path and applicable Windows desktop, paired Phone Mirror, and credentialed text/vision/model-selection checks in approved environments. Packaging/signing remains separately controlled. An engineering snapshot of the cold and prefill limitations is recorded here. No affected predecessor or external check has been waived.

**CHG-22 Blocked. C22-AC1 and C22-AC2 not tested.** When CHG-21 and applicable predecessors are verified, both CHG-22 criteria require caller, dynamic/IPC, renderer, storage/migration and runtime replacement evidence for each proposed removal, plus paired equivalence and full acceptance. CHG-23 has not begun.

## WORK-0081 — Production chat recovery and physical microphone (2026-11-17)

The real owner's manual chat failure reproduced with the saved Gemini 3.5 Flash model. Gemini returned HTTP 503 before output. The only eligible alternative was Groq, which showed a status-less SDK error in one baseline and HTTP 400 in another. The selector incorrectly took the first catalog entry even if Settings had tested a different model. It now takes the exact streaming-capable live-probed binding, retaining existing disabled-provider and privacy policies. Canonical Groq transport attempts that model once without using the legacy Groq model ladder. Supported hosted text providers on manual chat have a seven-second per-attempt deadline until the first token. Timeout proceeds only through the existing eligible routes. STOP and committed streams retain their existing ownership. The failure message surfaces controlled HTTP and failure categories without vendor response bodies, prompt data or credentials.

The repaired normal app returned a greeting and a correct DBMS definition without changing the saved Gemini setting. The final DBMS route logged Gemini 503 after 981 ms, successful Groq, no private evidence and provider first token at 1755 ms. The final answer was visibly observed. On a separate production launch after macOS granted access, the owner's spoken bounded-queue test generated nonzero microphone data, reached STT at 16 kHz, appeared as the intended transcript and led to a correct final Analyze answer. A later empty-input warning and an idle zero-fill warning are recorded separately. The exact cause of the earlier reported silent capture remains unproven. No capture implementation or macOS permission behavior was changed.

| Fresh local model workload | Frozen raw rubric | Factual review | First case first useful | Mixed-workload first-useful p95 | Maximum engine completion |
| --- | ---: | ---: | ---: | ---: | ---: |
| WORK-0081 unloaded first request | 25/26 | 26/26 | 4567 ms | 1198 ms | 5668 ms |
| WORK-0081 content-free preloaded | 25/26 | 26/26 | 783 ms | 1216 ms | 2729 ms |

Both sets are text-identical to the prior independently reviewed 26 answers, including the accurate French LRU answer that the raw regex misses. In the true unloaded first turn, model loading took 3824 ms and prefill took 702 ms. The preloaded run measured its separate 873 ms preparation before the turn. The other 25 cases in the unloaded-start workload used the resident model. The benchmark summary therefore cannot be used as the first-turn cold service objective. The previous actual 7058 ms unloaded global and 11010 ms resident Listen misses remain part of acceptance history.

For the next product timing pass, report the first genuinely unloaded action, already-resident actions, outage/fallback, and physical STT-to-paint as separate measurements. Show loading/waiting and record model readiness independently of the answer clock. Revisit numeric product thresholds only with repeated comparable rendered data. No existing threshold changed in this work.


| Current verification command | Passed | Failed | Cancelled | Skipped | TODO |
| --- | ---: | ---: | ---: | ---: | ---: |
| Electron focused runner for GenerationController, routing fallback and Change18 RAG IPC | 35 | 0 | 0 | 0 | 0 |
| `npm test -- --test-concurrency=4` | 9032 | 0 | 0 | 67 | 0 |
| `npm run test:intelligence -- --test-concurrency=4` | 2196 | 0 | 0 | 0 | 9 |
| `npm run test:lib` | 383 | 0 | 0 | 1 | 0 |
| `npm run test:scripts` | 99 | 0 | 0 | 0 | 0 |

Renderer and Electron builds, all five TypeScript checks and source-mode asset validation passed. The Electron skips retain their prior classifications: host/Windows checks, optional API and authored-mode fixtures, absent benchmark/backend files and private calibration recordings. The library skip requires the absent backend file. The intelligence TODOs describe deferred systems and the live Hindsight opt-ins were disabled; these do not add production evidence.

`node scripts/audit/run-chg20-desktop-acceptance.mjs` passed all 14 initial cases and the same-profile relaunch case. `node scripts/audit/run-stabilization-full-product.mjs` passed 15 renderer scenarios and the additional Listen/Analyze and toolbar STOP checks. The STOP fixture attempted late output and the UI rejected it. Abort was recorded in the click's millisecond, settled paint took 202 ms, and only one pre-click token appeared. Those two desktop runs used isolated settings and synthetic transport, with injected transcript input in stabilization. The normal app run above provides separate typed-provider and physical STT coverage.

Evidence: `/Users/abitesh/Downloads/Sneak-Peek-WORK0081.IBZV8O` includes `current-verification-status.txt`, `live-verification.md`, `cold-start.json`, `preload-start.json`, `isolated-desktop/result.json` and `stabilization/chg21-lifecycle.json`. Repeat the model runs with the existing disposable-profile commands above. Capture independent unloaded first requests before aggregating a cold-only percentile.

C21-AC1 is supported for authorized local checks, including real chat and a physical Listen/Analyze success. C21-AC2 remains open for repeatable cold and rendered timings, historical model variance, physical capture consistency and the applicable Windows, handset and credentialed vision coverage. CHG-22 caller audit began read-only. No removals are accepted.

## WORK-0082 — Production acceptance matrix and matched renderer checks

Baseline main `0f18dcbc` was clean. A macOS arm64 development build used the same isolated Ollama `llama3.2:3b`, port 11436, disposable profile and synthetic meetings. Before editing we ran the unprepared actual renderer, preload, registered IPC, scoped retrieval and production loopback provider. After cleaning up dead screenshot code we repeated it starting with the production content-free preload and then with the model already resident. We also ran the actual Listen/Analyze toolbar with injected STT events and a real resident model. Before the prepared run, `/api/ps` confirmed no installed model was resident in this isolated server.

| Cohort | Product clock and evidence | Acceptance |
| --- | --- | --- |
| Healthy ready route, local or authorized cloud | From the original action to five meaningful answer characters visibly painted, and to the completed useful answer visibly painted. Record ready model/provider identity and matched retrieval scope. | p95 ≤2000 ms first useful and every useful final ≤6000 ms for the approved workload. Count misses, factual omissions and failed turns. Analyze with finalized text belongs here. |
| Genuinely unloaded startup/selection | Report readiness wait and model load separately from inference. Also report the uninterrupted original click-to-paint if the user submits while loading. Document wait/status, STOP and recovery or clear failure. | Keep absolute 2 s/6 s observations and misses. Startup gets its own cohort because the measured weight load alone exceeded 2 s. Establish its latency ceiling only from independent cold observations. |
| Cloud fallback/recovery | Measure from the first trigger across the actual failed attempt through success/error and visible settlement. Record attempts, authorized binding and commitment. | Existing bounded authorized fallback, no post-commit switch, useful completion or actionable failure. A deliberate outage is a recovery cohort. Healthy cloud retains 2 s/6 s. Do not restart the clock on fallback. A live incident remains in the record. |
| Physical Listen/Analyze | End of actual speech → usable final transcript, Analyze when transcript is finalized → first and final paint, and the full speech-to-final timeline. | Apply the ready-route limits to the finalized-transcript Analyze interval. Report the complete physical journey, source isolation and transcript correctness separately. A synthetic transcript or engine timing supplies partial evidence. |

Freeze workload, model/quantization, provider, readiness, hardware, response shape and expected evidence before comparing. Keep attempts, first visible, final visible and factual verdict for every sample. Report sample sizes and nearest-rank p95. Gather repeated independent runs before generalizing the tail. No threshold was lowered for the ready cohort. An unavailable external test, failed provider and slow answer retain their respective outcomes.

| Real renderer cohort | Useful first visible | Useful final visible | Fact review |
| --- | ---: | ---: | ---: |
| Baseline genuinely unloaded first global turn (n=1) | 5115 ms | 6157 ms | 1/1 |
| Baseline remaining resident global turns (n=4) | 538–862 ms | 1132–1486 ms | 4/4 |
| After 2296 ms of separate preload (n=5) | 547–2187 ms; p95 2187 ms | 1340–2879 ms | 5/5 |
| Separate already-resident global repeat (n=5) | 524–1014 ms; p95 1014 ms | 1396–2142 ms | 5/5 |
| Resident real-model Analyze with injected transcripts (n=1) | 3717 ms | 4965 ms | Imprecise bounded-queue definition |

All rendered global answers included the applicable synthetic meetings and reasons, including both meetings on the singular ambiguous question and only meeting A on the narrow one. This batch supports the existing attribution improvement. It does not erase the earlier ERR-102 miss. The original WORK-0081 frozen 26-case answers remain available, including the raw French rubric miss; we did not rerun that full workload. The latest Listen answer treated a capacity bound as limiting what can be added or removed. The expected fact is a limit on how many items may be held at once. A technically adequate analogy does not repair the imprecise definition. ERR-110 remains open despite the fixture's lifecycle PASS.

Existing content-free preloading shortened the first global response when timed after readiness and preserved complete answers. The first prepared turn spent 1786 ms from provider start to useful output and reached the bridge at 1842 ms. Visibility took 2187 ms. That latter interval includes UI scheduling, visibility and paint sampling. It does not isolate a single renderer defect. All five global requests used a single scoped read (0–1 ms). The resident Listen turn spent 3239 ms inside the provider before useful text, 284 ms from Analyze to dispatch, and 187 ms from provider completion to final paint. This supports keeping the existing preload and measuring provider prefill separately from resident lifecycle and renderer overhead. No prompt shortening, output cap or renderer animation change was adopted on this evidence.

**Decisions:** C21-AC1 PASS for the authorized local scope. C21-AC2 open for ERR-104 and ERR-110, repeated approved model-ready and cold performance, and physical STT-to-paint. The WORK-0081 actual typed fallback and physical answer remain behavioral evidence. A fresh credentialed outage plus timing sample, credentialed vision/model checks, paired physical Phone Mirror and Windows renderer remain outside this run. Packaging/signing requires separate authorization. The proof that removed CHG-22 code cannot affect these checks is recorded in the [candidate audit](chg20-surface-map.md#work-0082--verified-dead-screenshot-path-and-manual-chat-trial).

**Reproduce:** Run `npm run build`, then `npm run build:electron`. Use `OLLAMA_HOST=127.0.0.1:11436 OLLAMA_NO_CLOUD=1 ollama serve` with existing approved local weights. Unload only the disposable daemon’s model with `OLLAMA_HOST=127.0.0.1:11436 ollama stop llama3.2:3b`. Confirm readiness separately. Run `node scripts/audit/run-chg20-desktop-acceptance.mjs --local-ollama` and repeat the unloaded setup with `--preload` for the prepared cohort. Repeat without stopping the ready model for resident turns. Run `node scripts/audit/run-stabilization-full-product.mjs --local-ollama` for the synthetic-STT control and delayed STOP fixture. Keep model runs separate from builds and bulk suites. Raw timings, synthetic screenshots, Git/build hashes and test logs are at `/Users/abitesh/Downloads/Sneak-Peek-WORK0082.dlEgYk`.
