# Sneak-Peek — authoritative task tracker

Updated: 2026-11-08. Maintained by the active coding agent; the owner supplies goals and approval, not manual bookkeeping.

## Current state — WORK-0026 continuation, 2026-11-08

- **CHG-17 and CHG-18 implementation complete; both Implemented, unverified for full acceptance.** Owner explicitly authorized their combined implementation and this continuation. No further confirmed production defect remains from the scoped synthetic reproductions; production cutover and advancing the next roadmap change are not yet accepted.
- Local `main` / `86923ac5e712cf105e17c6007cd1030aaa10c0be` remains authoritative. Continuation began with 37 tracked dirty paths and 5 untracked paths, no staged paths. Preserve all earlier WORK-0025/0026 code and tests, the Git index and `PROJECT_TREE.txt`.
- **Current evidence:** Both typechecks and Electron build pass; focused native Electron tests 284/284; intelligence 2,099 pass, zero fail, 9 TODO; ProviderRouter and sender-isolation batch 20/20. The actual preload/renderer harness passes with two total reads, generations and completions (one each per meeting/global request). ERR-048 fixed its screenshot timing; the new answer image was visually inspected. Full-suite final comparison is recorded in WORK-0026 in CHANGE_LOG.
- **Next action:** Complete isolated full-product macOS acceptance (project/personal/PDF, active meeting, STOP/restart/clear and six-second completed-answer measurements) and Windows checks. Correlate ERR-038's owner symptom to a real request and source-readiness trace. ERR-039/040 stay separate, unproven causes; the remaining broad-suite failures are not automatically unrelated.
- **Index observation:** No agent staging command was run. Staged entries appeared during the session; they preserve the starting production/test contents and were left untouched. Current documentation updates may remain unstaged. See WORK-0026 final review.
- Source of truth: [ROADMAP.md](../ROADMAP.md) owns acceptance scope; the current matrix below owns execution evidence. [CHANGE_LOG.md](CHANGE_LOG.md#work-0026--combined-chg-1718-implementation-2026-11-07) has exact commands, paths and inventory; [ERROR_LOG.md](ERROR_LOG.md) records ERR-002/038–048. Earlier sections below are historical snapshots, including old CHG-18-blocked statements superseded by the owner's combined implementation authorization. The acceptance/cutover gate itself is retained.

## WORK-0025 — Current Change 17 acceptance reconciliation (2026-11-07)

**Status:** In progress for acceptance; implementation present, not fully verified. Current Mac checkout started clean at `86923ac5`. This request changed `electron/rag/__tests__/Change17ModePageProvenance.test.mjs` to assert page, section and heading in normal, document-grounded and compatible-vector mode retrieval, and `electron/rag/__tests__/Change17FinalCanonicalParity.test.mjs` to connect the actual canonical reader, scoped adapter, coordinator and engine prompt for a synthetic Linkship turn. No production source, feature flag, index schema, protected area, user data or `PROJECT_TREE.txt` was changed.

**Agent-executed checks:** `npm run typecheck:electron` and `npm run typecheck:ts5` exited 0; `npm run build:electron` exited 0. Change 17 Electron-ABI tests passed 55/55 after the test edits. `npm run test:intelligence` passed 2,085, failed 0, TODO 9. A valid temporary two-page synthetic PDF parsed through `extractSafeDocumentText` with 2/2 extracted pages and both page markers; this is parser evidence, not desktop upload/index/answer evidence. Full `npm test` exited 1: 8,684 pass, 170 fail, 67 skipped; historical WORK-0020 also recorded 170 failures, but exact failing identities were not compared. A separate two-file profile factual-recall run reproduced 8 failures among 24 tests, including missing synthetic achievement/certification grounding and overbroad skills context. The broad RAG-only run also failed; its log contains profile/knowledge/reranker and other existing test families. Logs: `/tmp/chg17-final-focused.log`, `/tmp/chg17-current-intelligence.log`, `/tmp/chg17-current-full.log`, `/tmp/chg17-current-personal.log`, `/tmp/chg17-current-rag.log`.

**Gate:** ERR-042's known page-loss reproduction is fixed and current production path is focused-verified, but ERR-038's owner-reported live project answer is not independently reproduced or explained. A minimal Electron probe with `env -u ELECTRON_RUN_AS_NODE NATIVELY_TEST_USERDATA=/tmp/chg17-electron-profile-probe/data node_modules/.bin/electron /tmp/chg17-electron-profile-probe/main.js --user-data-dir=/tmp/chg17-electron-profile-probe/data` confirmed both `userData` and `sessionData` resolve to that temporary path; `appData` remains the normal macOS root. The full app was not launched because other startup services might access credentials/paths outside this profile, and no isolated provider answer was configured. No paid/local provider answer, Mac GUI, Windows, live STOP/restart, active meeting or six-second final-answer measurement occurred. C17-AC1–7, AC9 and AC10 remain partial; AC8 and AC11 have scoped passes below. **CHG-17 fully verified: NO; safe to start CHG-18: NO.**

## WORK-0022 — Linkship project follow-up scope revalidation (2026-11-06)

**Status:** The WORK-0022 implementation is present in the current staged tree and was verified in a disposable copy. The initial patch-only state described below is historical; current branch is `main` at `d53f1ac11f32769a35d3305a963915b1659fc0fd`. `git status --short` showed the existing 39 staged paths and no unstaged changes before this verification. `PROJECT_TREE.txt` was preserved. Source audit of `ProjectFileScope.ts` and manual/meeting `ipcHandlers.ts` confirmed that the earlier implementation resolved scope from only the current raw question, risking an undefined exact `projectSourceIds` allowlist on a follow-up. This was an authorization-scope risk, not proof of a historical privacy leak.

**Implemented behavior:** `resolveProjectFileScopeForTurn` uses the immediately preceding completed, same-session user/assistant exchange as an identity hint, then reselects exact project IDs from the current authorized file listing. Cancelled/failed/incomplete turns, ambiguous references, missing/retired project files, changed source/request identity, and chat reset fail closed with an empty allowlist. An explicit new project name overrides prior context; generic DBMS questions and broad plural project history keep their existing behavior. Manual and meeting request constructors pass the full canonical conversation turns to the resolver and suppress profile fallback for an unresolved singular project reference. The explicit project parser recognizes two-word subject-before-verb names like Linkship Legacy. This follow-up work does not change RAG storage, feature flags, legacy answer generation, credentials or user data.

**Checks performed:** The disposable source copy passed `npm run typecheck:electron`, `npm run typecheck:ts5`, `npm run build:electron`, the six-file focused Electron ABI command (54 passed, 0 failed), and `npm run test:intelligence` (2,085 passed, 0 failed, 9 TODO). Its suite includes WORK-0022 cases for explicit Linkship then completed same-session Redis follow-up, Linkship Legacy override, failed/cancelled/incomplete exchanges, removed sources, intervening requests, general DBMS, cleared state, and both IPC routes. A separate disposable actual-mode harness used `ModeHybridRetriever`, `ModeRagAdapter`, canonical storage/read, synthetic READY data, and deterministic embeddings; it verified source/scope, lexical/vector hits, current/READY filtering, superseded revision exclusion, and incompatible-space rejection, but found page provenance is lost on the legacy mode path (ERR-042). Previous isolated synthetic personal retrieval used the actual `PersonalKnowledgeManager`/`PersonalRagAdapter` and canonical read path; it does not establish desktop behavior or valid PDF ingestion.

**Gate:** WORK-0022's scoped follow-up implementation and automated cases are present and passing. CHG-17 remains **Implemented, unverified** because mode page provenance failed parity, local reranking and source-local fallback remain untested, the real indexed project first-turn/desktop workflow is not confirmed, valid PDF ingestion is untested, and Mac STOP/restart/completed-answer latency and Windows checks remain pending. ERR-038 remains open; ERR-039 and ERR-040 remain separate with unknown causes. No production code, provider settings, user database, native modules, staged index, or `PROJECT_TREE.txt` were changed by this verification.

## WORK-0023 — CHG-17 final synthetic retrieval acceptance (2026-11-06)

**Request:** Verify WORK-0022 and the remaining CHG-17 acceptance evidence before deciding whether CHG-18 may start. Links: CHG-17 C17-AC1–11, WORK-0022, ERR-038–042.

**Baseline and protection:** Branch `main`, HEAD `d53f1ac11f32769a35d3305a963915b1659fc0fd`. The initial status was 39 staged paths, no unstaged/untracked paths. The current staged work and `PROJECT_TREE.txt` were preserved; no production/test source, database, user data, provider settings, native/audio code, or Git index was modified. A disposable source copy reused installed dependencies; no install, paid provider, desktop app, or user profile was used. The temporary mode harness and generated data existed only in that copy.

**Evidence:** Both typechecks and `build:electron` passed. The focused Electron command in WORK-0022 completed 54/54; `npm run test:intelligence` completed 2,085 passed, 0 failed, 9 TODO. `git diff --cached --check -- . ':!chatgpt-work/PROJECT_TREE.txt'` passed. Synthetic actual mode parity matched authorized source/content, confirmed compatible vectors and no incompatible-space/unready/superseded hits, but legacy omitted the page locator that canonical retained; ERR-042 records the reproducible defect. Actual synthetic personal-path evidence is recorded under WORK-0022. No source-local fallback or local reranking result is claimed.

**Manual and platform gaps:** No Electron GUI interaction, six-second complete-answer timing, STOP during live retrieval/streaming, restart/supersession, manual chat during an active meeting, valid PDF ingestion, or Windows execution was performed. These remain pending; passing offline engine tests do not establish UI behavior. ERR-039 embedding batch timeout and ERR-040 native quit crash remain separately tracked, with no established CHG-17 causation.

**Acceptance decision:** C17-AC5 FAILS on mode page provenance; C17-AC1–4, 6–7 and 10 remain PARTIAL pending the listed runtime/source-family checks; C17-AC8, AC9 and AC11 PASS for the verified preservation, automated checks and legacy-caller inventory. **CHG-17 implementation complete: NO; fully verified: NO; safe to start CHG-18: NO.** Minimum next step: repair and test mode provenance, then complete required Mac and Windows acceptance.

## WORK-0021 — Mac runtime and test-log acceptance evidence (2026-11-06)

**Status:** CHG-17 remains **Implemented, unverified**; CHG-18 gate remains **blocked**. Owner supplied `Terminal output(5).rtf` (live startup/answer/quit) and `Terminal output(6).rtf` (actual Mac verification). `npm run typecheck:electron`, `npm run typecheck:ts5` and `npm run build:electron` exited without errors. The new `Change17NoDuplicateFallbackRegression.test.mjs` passed **6/6**; `npm run test:intelligence` ended with **2,076 passed, 0 failed, 9 TODO** (2,085 total). `npm start` built and launched the UI and ran the primary manual-chat engine. These are owner-executed results, reviewed here, not locally rerun by this reviewer.

**Outstanding live evidence:** A project/Redis question was answered without a grounded project fact. The corresponding reported session trace had `profile` empty with 0 items and 0 included evidence; no question text was logged, so the exact request association and root cause are not proven (ERR-038). A 30-second Gemini background embedding batch timeout (ERR-039) and a native `Napi::Error`/`SIGABRT` on app exit (ERR-040) were independently recorded for triage, with causation unknown. The native crash is not permission to edit protected audio/native subsystems during CHG-17.

**Gate:** C17-AC9 has current Mac typecheck/build/engine test evidence; C17-AC11 caller inventory remains previously recorded. C17-AC10 documents real startup but still lacks owner-approved STOP/restart and other end-to-end behavior evidence. C17-AC1/2/5/6/7 remain partial; actual mode/personal source-family retrieval parity, synthetic READY project and résumé/PDF facts, privacy isolation, cancellation, restart, Windows, and six-second **final visible answer** remain to be confirmed. A known-fact Linkship synthetic project retrieval and same-session follow-up are the smallest immediate diagnostic. Do not mark a legacy/profile failure unrelated solely because it predates this change.

**Files changed in this recording-only patch:** `chatgpt-work/ERROR_LOG.md`, `TASK_TRACKER.md`, `CHANGE_LOG.md`, `HANDOFF.md`. No production code, tests, feature flag, schema, native module or owner `PROJECT_TREE.txt` modified. This ZIP does not itself change the owner checkout until applied.

## Status rules

`Not assessed` = evidence not reconciled; `Planned` = approved/recorded pending work; `In progress` = active work; `Implemented, unverified` = edits exist but acceptance incomplete; `Verified` = all required evidence exists; `Blocked` = named prerequisite prevents progress.

Keep implementation status separate from individual acceptance checks. A checkbox is not a confidence vote. Never infer completion from commits, documents, screenshots of another app, generated code, or compile-only success. Link command, environment, actual outcome and timestamp. Reopen a checked criterion after a relevant regression.

After each change, complete its relevant checks, record the commands/results, and explicitly report whether the change is complete and safe to move to the next roadmap change. Keep it open and state what remains whenever acceptance evidence is incomplete.

## Execution board

| Task | Current status | Roadmap/error link | Next action / gate |
|---|---|---|---|
| DOC-001 | Implemented, unverified — downloadable pack only | All eight management files | Merge into actual repo with approval; preserve existing root roadmap and ongoing edits; verify instruction discovery. |
| CHG-17 | Implemented, unverified — implementation complete | ROADMAP CHG-17 / TASK-0001 / WORK-0026 / ERR-038–048 | Full-product Mac, Windows and measured complete-answer acceptance remain. |
| CHG-18 | Implemented, unverified — implementation complete | ROADMAP CHG-18 / WORK-0026 / ERR-043 | Meeting/global routes migrated; complete desktop/platform acceptance before production cutover. |
| CHG-14 / WORK-0010–0011 | In progress — intelligence suite green, acceptance unverified | ROADMAP CHG-14; ERR-016–020; ERR-008 | Fresh `test:intelligence`: 2,043 pass, 0 fail, 9 todo; engine tests included. Full Electron suite still has 172 failures; manual/runtime and Windows checks pending. CHG-01–17 are not Verified; CHG-18 stays gated. |
| BUG-001 | In progress — provider fixes + durable-save acknowledgement implemented; live verification pending | ERR-001, ERR-010–014, FEAT-005 / WORK-0008/0009 | Apply WORK-0009 after WORK-0008, save/restart/recheck a provider key, then retest Claude/NVIDIA/LiteLLM and model availability. |
| BUG-002 | Implemented, unverified — scoped profile defects repaired | ERR-002, FEAT-008 / WORK-0026 | Profile 24/24 and actual synthetic personal/PDF engine pipeline pass; owner full-product symptom still needs acceptance. |
| BUG-003 | Planned | ERR-003 | Reproduce clean install/package/installed-app failure separately from intelligence migration. |
| BUG-004 | In progress — full suite remains red | ERR-004 / ERR-008 / WORK-0026 | Fresh Mac `npm test`: 8,702 pass, 157 fail, 67 skipped. Identical 157 failing identities to previous WORK-0026; zero new/13 absent versus WORK-0025. Remaining roots not all classified; smoke is not resolved. |
| BUG-005 | Implemented, unverified — Router/readiness repair and isolated diagnostic | ERR-009 / ERR-015/018 / WORK-0011 | Runtime-config tests and Hindsight focused tests pass; actual server unavailable on localhost and paid live diagnostic intentionally not run. Verify Router, DB, retain/recall with permitted isolated bank. |
| QA-001 | Planned | CHG-14/17/21 | Verify engine test discovery; explicitly execute engine tests after prerequisites and approval. |

## WORK-0019 verification checkpoint — 2026-11-04

Status: **Implemented, unverified**; CHG-17 is not fully accepted and CHG-18 remains blocked. The owner applied the supplied three-file patch after `git apply --check` exited 0. Existing staged work, including the owner-modified `PROJECT_TREE.txt`, was preserved.

Changed patch paths: `electron/rag/canonical/CanonicalRagStorage.ts`, `electron/rag/__tests__/CanonicalRagStorage.test.mjs`, and `electron/rag/__tests__/CanonicalRagReadProduction.test.mjs`. The test file already had staged WORK-0017/0018 changes; WORK-0019 is the separate unstaged addition. No canonical flag default change.

Verification:
- Owner checkout: `npm run typecheck:electron` and `npm run typecheck:ts5` both exit 0.
- Isolated copy `/tmp/chg17-work0019-applied.pUt5EM/repo`: `npm run build:electron` exit 0; `node scripts/run-with-env.mjs --default-tmpdir NATIVELY_TEST_USERDATA=chg17-work0019-test-userdata --set ELECTRON_RUN_AS_NODE=1 -- electron --test electron/rag/__tests__/CanonicalRagStorage.test.mjs electron/rag/__tests__/CanonicalRagReadProduction.test.mjs` exit 0 (**45 passed, 0 failed, 0 skipped/TODO**); `npm run test:intelligence` exit 0 (**2,073 pass, 0 fail, 9 TODO**, 2,082 tests / 405 suites). Intelligence log: `/var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/1793814126815-copilot-tool-output-33756-268c0547-660f-4461-8214-1e25a3b06793.txt`.
- Actual meeting adapter/RAGRetriever-vs-canonical lexical fixture passed for `Which cache did the team select?`; same source and content, canonical provenance returned, canonical selected without fallback. Scores differ; legacy vector used its JS fallback in this fixture. This is not semantic/ranking parity and does not establish mode or personal parity.
- Patch-target `git diff --check` passed. `git diff --cached --check` still reports the pre-existing trailing whitespace in `chatgpt-work/PROJECT_TREE.txt`; it was not edited.
- No full Electron suite, desktop UI, owner-data, provider, Windows, or full-answer latency test was run.

## WORK-0011 verification checkpoint — 2026-11-03

Status: **Implemented, unverified**. Scoped EvidenceResolver association, engine continuity/outcome, Hindsight readiness and diagnostics, fail-closed license compatibility, and test discovery/harness repairs are saved in the uncommitted local repository. Four tests for proven retired node-embedding APIs were preserved as `.historical.mjs`; no production subsystem was deleted. The audit at `scripts/audit/work0011-current-failures.md` records proof and the current failure inventory.

Mac checks: Electron and renderer typechecks pass; Electron build passes; `npm run test:intelligence` reports 2,043 pass, zero fail, nine historical TODO; full `npm test` reports 8,639 pass, 172 fail, zero cancelled, 81 skipped. Focused Hindsight tests report 78 pass and one opt-in live skip; provider/config 20/20, library 380 pass/one skip, scripts 97/97, truncated-answer 26/26. Local app UI, Windows/CI, live provider fallback, real Hindsight retain/recall, and full Electron green remain unverified. The historical 5433 endpoint origin remains unproven. **Not safe to advance to CHG-18.**

## WORK-0008 provider repair evidence — 2026-11-03

Current input is a source-only ZIP reconstruction supplied by the owner, not a Git checkout. The upload has no `.git` metadata or `node_modules`; therefore branch/HEAD/status checks, normal project typechecks/builds and dependency-backed runtime tests could not be performed. The source ZIP is treated as authoritative for this patch and was compared against untouched copies of every edited path. No dependency install, provider credential use, paid request, commit, push, package/signing action or destructive user-state operation occurred.

BUG-001 / FEAT-005 remains **In progress, not verified resolved**. Implemented scope: normalize NVIDIA NIM model ids at the external API boundary; preserve prefixed ids internally; report the actual failed probe model; validate/canonicalize LiteLLM URLs in renderer and IPC and avoid logging the raw URL; align backend Claude fallbacks with the existing Sonnet 4.6 renderer model; compatibility-map the retired persisted Claude default/preference at read time; improve provider error classification so response-body details and 403 permission failures are distinguishable. No RAG, canonical storage, audio/STT, packaging/signing, license/auth/billing or unrelated UI behavior was changed.

Verification actually run on the uploaded source: all 1,402 JavaScript/MJS/CJS files pass `node --check`; the focused provider/Hindsight source batch passes 65/65; an isolated compiled `ProviderErrorNormalizer` probe verifies Claude HTTP-400 detail propagation, 403 permission classification and NVIDIA model-not-found attribution. A no-resolve TypeScript parse of the changed TS/TSX files reports zero TS1xxx syntax diagnostics; unresolved dependency/type diagnostics are expected because `node_modules` is absent. A repository-wide no-resolve scan is not a substitute for the real project typecheck and includes configuration/type-semantic diagnostics. Live provider calls, app launch, `npm run typecheck:electron`, `npm run typecheck:ts5`, `npm run build:electron`, package/install and Windows checks remain pending. It is **not safe to mark BUG-001/FEAT-005 complete** until those acceptance checks are run on the owner's checkout.

Roadmap scope did not change in WORK-0008, so `ROADMAP.md` is intentionally unchanged; execution status belongs here.

## WORK-0009 provider persistence + Hindsight Router repair — 2026-11-03

Owner confirmed WORK-0008 replacement files were already applied. The old WORK-0008 patch must **not** be applied again. Inputs for this request are the current source reconstruction plus the owner-supplied Hindsight startup history and GitHub Build Smoke #6 transcript. This workspace still has no `.git` metadata or `node_modules`, so local branch/HEAD/status, normal Electron build/typechecks and full dependency-backed tests are unavailable here.

BUG-001: confirmed false-save acknowledgement path in the six cloud-provider key setters and LiteLLM config. WORK-0009 returns durable persistence status, rolls memory back on a failed write, blocks runtime reconfiguration when persistence fails, and surfaces the error in AI Providers Settings. BUG-005: confirmed Hindsight Router activation mismatch. WORK-0009 selects `litellmrouter/default`, emits Hindsight-compatible Router deployment names/fallback aliases and accepts Router-managed provider credentials. The upstream Gemini `403 PERMISSION_DENIED` remains an account/project authorization condition; fallback only helps when another valid configured provider exists.

BUG-004 remains open. The newly supplied Build Smoke #6 output shows the BGE download parse warning is non-terminal, while the Electron `npm test` stage reports 237 failed tests / 15 cancelled / 96 skipped across many subsystems. WORK-0009 only repairs the directly confirmed credential/Hindsight defects and one stale `set-stt-provider` test locator; it does not claim that broad CI suite is green. A fresh CI run after the user's current local changes are committed is required before using the old failure count as current truth.

Verification actually executed here: `node --test` provider/Hindsight batch passes 63/63; targeted credential source guards pass 2/2 and the degraded-store source guard passes 1/1; `bash -n scripts/hindsight-start.sh`, `python3 -m py_compile scripts/hindsight-dev-server.py`, and Node syntax checks for the changed JS/MJS tests/scripts pass. Real OS keychain persistence, app restart, Hindsight live provider fallback, full `npm test`, `npm run test:intelligence`, macOS/Windows Build Smoke and application UI behavior remain pending.

## Changes 1–17 reconciliation — 2026-11-02

Baseline: local `main` at `7e07d99adb16d9988ca9050b247caebc7c8be99e`; clean when the investigation began. The checked-in project has engine modules and tests through a Change 17 adapter, but filenames and historical comments do not establish acceptance. This is a preliminary static reconciliation, not a complete runtime audit. No criterion below is verified solely by file presence. The code-review graph was unavailable; targeted source searches and GitHub CI logs were used.

| Change | Current evidence and remaining gate |
|---|---|
| CHG-01 | Not verified: map all actual renderer, preload, IPC, manual, live, global, follow-up and screen callers; record protected-boundary review and runtime traces. |
| CHG-02 | Engine request/result types and lifecycle exist in `electron/intelligence/engine/types.ts` and `SneakPeekIntelligenceEngine.ts`; execute contract and cancellation checks and record manual evidence. |
| CHG-03 | Conversation-state store is consumed by the engine; verify append, update, reset, isolation and follow-up behavior. |
| CHG-04 | `TranscriptContext.ts` implements a bounded window; run the 100-turn and current-question tests and a long-session manual check. |
| CHG-05 | Engine calls `question-resolver` and `understandTurn`; verify all C05-AC1 cases, including project-name and source-code routing. Latest CI includes routing failures. |
| CHG-06 | `ContextPlanner.ts` selects sources; verify general vs project, authorized private sources and denied/empty cases. ERR-006 remains open. |
| CHG-07 | `RetrievalCoordinator.ts` exists; trace actual planned vs executed source calls and prove no duplicate retrieval. |
| CHG-08 | Engine calls `context-os/evidencePack`; verify mixed-source isolation, authority, revision and provenance. |
| CHG-09 | `PromptAssembler.ts` exists; verify one final prompt with correct question/evidence, no duplicated injection and no internal markers. |
| CHG-10 | `ResponsePlanner.ts` exists and is called by engine; verify answer shapes, grounded first-person claims and requested length/code. |
| CHG-11 | `GenerationController.ts` and provider routing exist; verify pre-commit fallback, no post-commit switch, selected provider and STOP. CI has related failing assertions. |
| CHG-12 | Generation lifecycle is present; verify supersession, cancellation and late-chunk isolation with real request-level behavior. |
| CHG-13 | `ipcHandlers.ts` contains the primary manual engine path; trace actual renderer-to-provider execution and visible stream, including compatibility paths. |
| CHG-14 | Engine and behavioral test files exist, but aggregate `test:intelligence` does not include `engine/__tests__`; classify tests, run engine suite explicitly and investigate failures. |
| CHG-15 | Meeting/live test files and engine integration exist; verify transcript, retrieval, stream, STOP and audio-boundary preservation in simulation and manual checks. |
| CHG-16 | Project/My Files/personal tests and wiring exist; prove authorized source isolation, correct selection and no duplicate injection with fixtures and manual checks. |
| CHG-17 | `CanonicalRagRetrievalAdapter.ts` preserves identifiers and uses a scoped injected read; trace its active callers through canonical storage, verify score/provenance parity, cancellation and C17-AC3–11. ERR-006 and clean-platform verification remain open. |

All Changes 1–17 remain unverified pending their criteria and relevant platform/manual evidence. Change 18 remains gated. ERR-008 records the new smoke failures; the project-name fix is only one failure family.

## Execution board continued

| Task | Current status | Roadmap/error link | Next action / gate |
|---|---|---|---|
| CHG-01 | Not assessed | ROADMAP CHG-01 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-02 | Not assessed | ROADMAP CHG-02 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-03 | Not assessed | ROADMAP CHG-03 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-04 | Not assessed | ROADMAP CHG-04 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-05 | Not assessed | ROADMAP CHG-05 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-06 | Not assessed | ROADMAP CHG-06 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-07 | Not assessed | ROADMAP CHG-07 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-08 | Not assessed | ROADMAP CHG-08 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-09 | Not assessed | ROADMAP CHG-09 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-10 | Not assessed | ROADMAP CHG-10 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-11 | Not assessed | ROADMAP CHG-11 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-12 | Not assessed | ROADMAP CHG-12 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-13 | Not assessed | ROADMAP CHG-13 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-14 | Not assessed | ROADMAP CHG-14 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-15 | Not assessed | ROADMAP CHG-15 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-16 | Not assessed | ROADMAP CHG-16 | Reconcile historical implementation/evidence; do not reimplement blindly. |
| CHG-18 | Planned | ROADMAP CHG-18 | Wait for predecessor acceptance; do not start by deleting legacy code. |
| CHG-19 | Planned | ROADMAP CHG-19 | Wait for predecessor acceptance; do not start by deleting legacy code. |
| CHG-20 | Planned | ROADMAP CHG-20 | Wait for predecessor acceptance; do not start by deleting legacy code. |
| CHG-21 | Planned | ROADMAP CHG-21 | Wait for predecessor acceptance; do not start by deleting legacy code. |
| CHG-22 | Planned | ROADMAP CHG-22 | Wait for predecessor acceptance; do not start by deleting legacy code. |
| FEAT-001 | Planned | ROADMAP FEAT-001 | Separate explicitly approved audio/UI integration task; do not rewrite capture during CHG-17. |
| FEAT-002 | Planned | ROADMAP FEAT-002 | Performance target; depends on transcript handoff, retrieval, provider health and agreed output bounds. |
| FEAT-003 | Planned | ROADMAP FEAT-003 | UI/context task after stable source-boundary integration. |
| FEAT-004 | Planned | ROADMAP FEAT-004 | Modes are answer intent/style, not a duplicate document section. |
| FEAT-005 | In progress — provider health/model-discovery repair underway | ROADMAP FEAT-005; ERR-001, ERR-010–012 | WORK-0008 repairs concrete probe/default/config defects; verify live provider/catalog parity before acceptance. |
| FEAT-006 | Planned | ROADMAP FEAT-006 | Depends on FEAT-002 metrics and healthy provider/model routing. |
| FEAT-007 | Planned | ROADMAP FEAT-007 | Ongoing bounded audit; create individual tasks for findings, not a giant automatic rewrite. |
| FEAT-008 | Planned | ROADMAP FEAT-008 | Depends on CHG-17 canonical evidence invariants and ERR-002 investigation. |
| FEAT-009 | Planned | ROADMAP FEAT-009 | Needs actual Sneak-Peek app screenshots; supplied screenshots are ChatGPT settings/project sources. |
| FEAT-010 | Implemented, unverified — naming changes saved, acceptance incomplete | ROADMAP FEAT-010; WORK-0002 | Local checkout started clean at main 417db933 and now has 524 unstaged status entries from the rebrand. Main typechecks, renderer build, focused identity tests and isolated profile test pass. Browser extension typecheck lacks installed `@types/chrome`; app startup/packaging, asset replacement, notice review and remaining-reference review are pending. Existing service/update URLs stay by owner decision. |

## DOC-001 — install and reconcile tracking pack

Scope: documentation-only installation/merge. Do not change app code or install dependencies.

- [ ] DOC-AC1: Agent inspects actual local branch, HEAD, status and applicable instructions; notes overlapping owner changes.
- [ ] DOC-AC2: Existing AGENTS/CLAUDE/Copilot guidance and root roadmap are reconciled without silent replacement.
- [ ] DOC-AC3: All eight requested files saved in agreed locations; links/IDs reviewed; no secrets/private documents copied.
- [ ] DOC-AC4: Owner's current Change 17 progress and unresolved errors reconciled; earlier stages remain unverified unless evidence exists.
- [ ] DOC-AC5: Agent discovery is checked in VS Code; a harmless documentation update proves actual write access and saved-state verification.
- [ ] DOC-AC6: Handoff and work log reflect actual installed state; no claim of app test success.

Delivery-generation checks are documented under WORK-0001. They are not local installation acceptance.

## CHG-17 — current work packet

Goal: engine decides context/answer; canonical RAG returns correct scoped evidence without losing storage/indexing behavior or current work.

Current implementation status: owner says in progress; actual local files not inspected. Public source indicates existing engine/coordinator/canonical areas and retained legacy global-generation path.

Allowed scope: inspect current canonical/read adapters, affected coordinator/retrieval ports and necessary IPC wiring; smallest approved code/test changes only.

Protected: current chat/RAG repair; canonical database and identities; audio/capture/STT; provider credentials; packaging/signing/native builds; Notes and unrelated UI/settings.

### Work checklist

- [ ] C17-T01: Reconcile local worktree, branch/commit and partial Change 17 edits without reset/stash/revert.
- [ ] C17-T02: Trace active source planning, retrieval ports, canonical adapter/search path and actual answer-producing callers.
- [ ] C17-T03: Identify test/build prerequisites and preserve baseline failures; confirm focused engine tests will execute.
- [ ] C17-T04: Propose/approve the smallest remaining integration step and exact files.
- [ ] C17-T05: Implement that step without parallel storage, scope leakage or retrieval-score semantic changes.
- [ ] C17-T06: Add/run focused canonical/engine/source-scope/cancellation regression tests.
- [ ] C17-T07: Run relevant typechecks/build; inspect diff and source references.
- [ ] C17-T08: Perform applicable project/personal/general and STOP/restart manual checks, or leave them explicitly pending.
- [ ] C17-T09: Update status/evidence/error/work/handoff records; list direct-generation cleanup deferred to Change 18.

### FEAT-010 — current naming task evidence

Owner authorized a naming-only rebrand and confirmed `Sneak-Peek`. The local repository was clean on `main` at `417db9337120494bb484c82d36172a6bdf0673c6` before edits. Source, paths, display text, metadata and an existing-profile selector were edited; the full path list is in [REBRAND_CHANGED_PATHS.txt](REBRAND_CHANGED_PATHS.txt). The remaining-reference line inventory is in [REBRAND_REMAINING_REFERENCES.md](REBRAND_REMAINING_REFERENCES.md). Source-based tests have three failures reproduced on the starting commit (ERR-007); the engine retrieval assertion also fails on the starting commit (ERR-006).

| Criterion | Status / evidence still needed |
|---|---|
| F10-AC1 | Unverified: owner confirmed permission but explicitly declined current license/notice inspection. Notice content was not edited. |
| F10-AC2 | Partly met by owner-confirmed spelling and scope. New logo artwork is not supplied; existing icon still shows an N. |
| F10-AC3 | Inventory saved with a reason category for each remaining matching line; necessity of some legacy provider/state references and legal content is still unverified. |
| F10-AC4 | Implemented, unverified: existing profile selector has a passing isolated test; provider IDs, saved keys, external URLs and update identifiers are retained. Installed-app upgrade and packaged runtime remain untested. |
| F10-AC5 | Unverified: renderer build passed on macOS, but no UI walkthrough, packaged app, Windows check or new icon artwork. |

When any other task becomes active, create a small task packet here listing its roadmap acceptance IDs, implementation checklist, required evidence and blockers. Keep the normative acceptance wording in ROADMAP.md; record live verification only here.

### Acceptance evidence

The normative wording is in ROADMAP.md; this table tracks verification, not a second scope definition.

| Criterion | Verified? | Evidence / outstanding check |
|---|---|---|
| C17-AC1 | PARTIAL | Scoped implementation complete; detailed automated criteria pass. Required full-product Mac/Windows acceptance remains. WORK-0026. |
| C17-AC2 | PARTIAL | Typechecks/build, diff and records reviewed; protected boundaries preserved. Desktop/platform completion is pending. |
| C17-AC3 | PASS — scoped | Active manual/meeting/live/global callers traced to engine, coordinator and planned canonical/source reader; executed IPC registration snippets and real-preload desktop harness. No second database. |
| C17-AC4 | PASS — scoped | Actual engine tests run through evidence, one final prompt and deterministic provider/GenerationController; RAG answer methods/prompt helper removed. Real provider behavior is not inferred. |
| C17-AC5 | PASS — synthetic regression scope | 284-test batch exercises revisions, READY/native compatible vectors, relevance/rerank/fallback, mode page/section and actual personal PDF page/chunk/revision EvidencePack; revoked/deleted sources absent from search. No claim of real-model ranking equivalence or quality. |
| C17-AC6 | PASS — synthetic regression scope | Actual ingestion → reader with real relevance gate → engine → deterministic generation covers Linkship first/follow-up, sibling isolation, missing/deleted/denied/clear/failure and DBMS no-private retrieval. Profile 24/24. Owner ERR-038 remains independently unconfirmed. |
| C17-AC7 | PASS — automated | Actual cancellation during retrieval/fallback/reranking and committed generation, supersession and sender/scope clear isolation; one planned read and one final completion per successful IPC request. Physical STOP/restart acceptance remains in AC10. |
| C17-AC8 | PASS | Canonical/source storage and provenance retained; deletions use existing tombstone lifecycle transactionally, not reset/migration. Existing source/test edits and PROJECT_TREE preserved; externally staged index entries left untouched (WORK-0026 final review). |
| C17-AC9 | PASS — scoped checks | Electron and TS5 typechecks/build pass; focused native batch 284/284, intelligence 2,099 pass/9 TODO, routing/isolation 20/20. Broad suite remains red; exact identity comparison and limits in WORK-0026, not waived. |
| C17-AC10 | PARTIAL | Real Electron BrowserWindow + production preload displays a synthetic answer with inspected screenshot. Full product UI, real provider, active meeting, STOP/restart, six-second final-answer timing and Windows not exercised. |
| C17-AC11 | PASS | Production callers inventoried; meeting/global migrated in owner-authorized CHG-18; no production RAG queryMeeting/queryGlobal/buildRAGPrompt generation survives. Intentional non-RAG compatibility APIs retained and listed in WORK-0026. |
| C18-AC1 | PASS — implementation/automated | Meeting/global/live answer routes share Intelligence Engine and compatible RAG stream events; sender-scoped cancellation/session identity tested. No direct RAGManager-to-LLM answer bypass. |
| C18-AC2 | PARTIAL | Combined build/type/automated checks and minimal desktop bridge pass; full-product and Windows manual checks remain pending. |

Do not mark Change 17 Verified until all applicable criteria have evidence. An intentionally deferred criterion requires explicit owner agreement and must not be silently checked.

## WORK-0020 verification checkpoint — 2026-11-04

Status: **Implemented, unverified**; CHG-17 is not fully accepted and CHG-18 remains blocked. The consolidated patch is based on the pre-WORK-0019 state, so its `git apply --check` failed at the overlapping canonical storage hunk. No `git apply --force`, `--reject`, reset, or stash was used. The equivalent intent was manually integrated against current code after inspecting the mismatch. A first grouped edit stopped at an `ipcHandlers.ts` context mismatch after changing only the adapter type; the current code was inspected and the remaining edits were applied surgically.

Purpose: Keep the Intelligence Engine's project-source decision authoritative, pass the explicit authorized project file IDs through canonical lexical/vector reads and the compatibility fallback, and avoid re-planning the structured-knowledge query. `canonicalRagRead` remains default-off. No provider credentials/routing, audio, STT, packaging/signing, Hindsight, source PDFs, user database, or CHG-17 canonical storage/revision/index migration was changed.

Paths changed by this work: `electron/intelligence/engine/CanonicalRagRetrievalAdapter.ts`, `electron/intelligence/engine/__tests__/Change17CanonicalRagRetrievalAdapter.test.mjs`, `electron/intelligence/engine/__tests__/Change17SafetyGateRegression.test.mjs`, new `electron/intelligence/engine/__tests__/Change17PlannedProjectCapability.test.mjs`, `electron/ipcHandlers.ts`, `electron/rag/RAGManager.ts`, `electron/rag/canonical/CanonicalRagQueryTypes.ts`, `electron/rag/canonical/CanonicalRagReadService.ts`, `electron/rag/canonical/CanonicalRagStorage.ts`, and new `electron/rag/__tests__/Change17FinalCanonicalParity.test.mjs`. `chatgpt-work/ERROR_LOG.md` records ERR-037; this tracker, `CHANGE_LOG.md`, `HANDOFF.md`, and `PROJECT_OVERVIEW.md` were refreshed. `chatgpt-work/PROJECT_TREE.txt` was not edited or regenerated because it contains the owner's protected staged changes.

Verification:
- Owner checkout: `npm run typecheck:electron` initially reported TS2322 because the adapter's source union omitted `project_knowledge`; that union was corrected. Re-run `npm run typecheck:electron` and `npm run typecheck:ts5` both exited 0.
- Isolated `/tmp/sneak-peek-chg17-work0020.GIzDvg/repo`: `npm run build:electron` exited 0. The exact focused command from the supplied `VERIFY.md`—`node scripts/run-with-env.mjs --default-tmpdir NATIVELY_TEST_USERDATA=chg17-consolidated-synthetic --set ELECTRON_RUN_AS_NODE=1 -- electron --test electron/intelligence/engine/__tests__/Change17PlannedProjectCapability.test.mjs electron/intelligence/engine/__tests__/Change17CanonicalRagRetrievalAdapter.test.mjs electron/intelligence/engine/__tests__/Change17SafetyGateRegression.test.mjs electron/rag/__tests__/Change17FinalCanonicalParity.test.mjs electron/rag/__tests__/CanonicalRagReadProduction.test.mjs electron/rag/__tests__/CanonicalRagStorage.test.mjs`—exited 0 (**70 passed, 0 failed, 0 skipped/TODO**). `npm run test:intelligence` exited 0 (**2,076 passed, 0 failed, 9 TODO**, 2,085 total). Focused test output: `/var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/1793818140648-copilot-tool-output-33756-6a32e671-a43e-4374-b4a1-84aa4b18c6a4.txt`; intelligence output: `/var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/1793818151640-copilot-tool-output-33756-9d4bf39a-f80b-451f-a375-ff0d69ac70b8.txt`.
- Isolated full `npm test` exited 1 (**8,675 passed, 170 failed, 67 skipped**). Compared with the recorded baseline (`chg17-npm-test.log`: 8,661/171/67), no failing test identity is new; one previously failing `gemini-chat-stream retrieves through RAGManager, then the planner` assertion now passes. Full output: `/var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/1793818451249-copilot-tool-output-33756-9233d817-0249-4168-b761-e26e48a473b1.txt`. This is not a classification of every pre-existing failure. CHG-17-relevant legacy query and profile tests still fail; missing/invalid résumé/PDF fixtures were confirmed (profile PDF/DOCX paths are absent; the named seminar PDF is a 131-byte ASCII file and fails PDF parsing).
- `git diff --check` passed for unstaged edits. `git diff --cached --check` continues to report the pre-existing trailing whitespace in `PROJECT_TREE.txt`; it was not changed. No dependencies were installed and no commit/push occurred.

Inspected failure groups: `electron/audio/__tests__/RagQueryKeyIsolation.test.mjs` uses source regexes that require meeting/live IPC handlers to mint RAG query keys and manage `activeRAGQueries`; those handlers now delegate to the Intelligence Engine's `streamSneakPeekMeetingAnswer`, so those particular assertions are stale-shape checks, not proof the new engine cancellation is broken. The global IPC cancellation assertions pass. This does not replace owner STOP/supersession runtime evidence. `KnowledgeOrchestratorIngest.test.mjs` synthetic resume/JD cases fail on missing profile nodes/shape; `ProfileFactualRecallProductionPath.test.mjs` and `PersonaFabricationFallbackProductionPath.test.mjs` return only candidate identity where synthetic experience/achievement facts were expected. These behavior assertions match the prior baseline, but their root cause is not established; they directly block personal-grounding acceptance. PDF failures are fixture/environment gaps (invalid 131-byte ASCII "PDF", absent profile PDF/DOCX), not proof of parser behavior. A source scan also references absent `premium/src/ModesSettings.tsx`, a stale path assertion unrelated to CHG-17. These are the inspected groups, not a classification of all 170 failures.

Acceptance remains incomplete: actual mode and personal legacy-vs-canonical parity, a valid synthetic PDF/resume, desktop general/private isolation, conversation follow-up/clear, active-meeting behavior, STOP/restart/supersession, full-answer latency, and Windows checks remain. Full suite identity comparison shows no new failure but does not erase the existing personal/profile grounding failures or prove runtime behavior.

## New error and requirement intake

- Error report: create/update ERR entry first, create linked BUG/task if needed, record reproduction and redacted evidence, then investigate. Preserve unresolved errors across chats.
- New desired change: append a stable FEAT/TASK ID and roadmap criterion; note dependencies/approval; never renumber Changes 1–22.
- Out-of-scope blocker: explain its relationship to the active task and request a priority decision before switching workstreams.
- Resume next chat: read handoff and tracker, inspect actual code/status, reconcile stale claims and continue one task.

## Evidence record template

```markdown
### EVID-YYYYMMDD-NNN
Task / criteria:
Source: Agent-executed / Owner-confirmed / CI-reported / Static inspection
Branch / starting commit / relevant dirty changes:
Environment: OS, CPU, Node, Electron, provider/model as relevant
Command or manual steps actually performed:
Result: Passed / Failed / Skipped / Incomplete
Observed output / sanitized evidence location:
Baseline vs introduced failure:
Unverified limitations:
Recorded at:
```

Do not store raw private resumes, credentials, transcripts or entire logs in this document. Code changes stay in Git; concise evidence links stay here.

## Initial evidence register

| Evidence | Type | Observation | Limit |
|---|---|---|---|
| EVID-INIT-001 | Static inspection | main snapshot 6837a7a; Change 16 subject; engine/canonical/model/IPC files inspected. | Not the owner's local worktree; no tests run. |
| EVID-INIT-002 | CI-reported | Run 40354373940: macOS/Windows smoke failures include source asset verification and intelligence unit-test steps. | Full failing output/root cause and relation to local packaging unverified. |
| EVID-INIT-003 | User-reported | Change 17 active; model loading, personal intelligence and packaged-app/dependency failures. | Need exact reproduction and sanitized output. |

## Ownership

Agent updates records itself after meaningful steps and before finishing a request, when writable access exists. Owner approves goals/sensitive changes and can edit any document. Files do not self-execute; no background watcher or upload-sync service is included. Report failed writes and proposed-only changes explicitly.


## TASK-0001 — Applying personal vector and résumé/project routing repair

- **Roadmap:** CHG-17 (C17-AC6, C17-AC8, C17-AC9).
- **Status:** Implemented, unverified.
- **Implementation:** Applied the owner-provided combined patch after `git apply --check` passed. Build passed.
- **Acceptance:** `git apply --check` passed. Final `npm run build:electron` passed. The prescribed system-Node focused command returned 19 pass / 3 fail due only to the native ABI mismatch (ERR-005); the same four files passed 22/22 under installed Electron 43 (ABI 148), including the missing-source/no-native regression. `git diff --check` passed; final diff review confirmed protected paths are unchanged.
- **Blockers / limits:** No dependency rebuild was performed. Real-app/manual acceptance and Windows checks remain pending; therefore CHG-17 acceptance is not marked verified. The expected `chatgpt-work` records were absent before this task.
- **Next step:** Run the bundle's manual real-app acceptance with authorized sample data; Windows checks remain pending.


## WORK-0014 — CHG-17 remaining safe integration repairs (2026-11-04)

**Status:** Implemented in a downloadable patch bundle, **unverified on the owner checkout**. Approval: owner explicitly requested implementation and one ZIP. Baseline: uploaded source ZIP reconstruction corresponding to owner/Copilot `main` HEAD `d53f1ac11f32769a35d3305a963915b1659fc0fd`; Copilot reports the only local edit was `chatgpt-work/PROJECT_TREE.txt` (105,294 additions / 2,595 deletions). The uploaded tree file was deliberately NOT edited or packaged. No Git metadata or dependencies are present in the upload workspace.

**Scope implemented in package:** Broad candidate-project-history cue; completed manual/meeting referent synchronization (including exact Singleton/code shape); explicit denial of private fact claims when no evidence is returned; truthful canonical versus source-fallback provenance; safe per-source execution metadata for denied/unavailable/empty/cancelled reads; exclude already-available conversation context from external capability dispatch; drop post-abort evidence; pass resolved question to planned retrieval. Existing canonical RAG storage, indexing, project-only compatibility, legacy answer callers, privacy permissions, capture/STT, native modules and user data are unchanged. `canonicalRagRead` remains OFF by default until index/score/source-parity checks are real.

**C17 evidence matrix (patch stage, not end-to-end acceptance):**

| Criterion | State | Remaining evidence |
|---|---|---|
| C17-AC1 | Partial | Detailed criteria not all verified; real app acceptance and native test results missing. |
| C17-AC2 | Partial | Mac post-apply diff and manual verification; full-suite classification and tracking reconciliation. |
| C17-AC3 | Partial | Primary manual + meeting IPC source trace available, legacy compatibility paths remain; runtime trace needed. |
| C17-AC4 | Partial | New-engine planning/prompt boundary preserved; CHG-18 global legacy generation explicitly deferred. |
| C17-AC5 | Partial | Adapter provenance and bounded diagnostics tested; canonical index parity and ownership not inspected. |
| C17-AC6 | Partial | Focused project-history, Singleton and empty evidence fixtures pass; real résumé/PDF remains unverified. |
| C17-AC7 | Partial | Focused no-duplicate and post-abort tests pass; real STOP/supersession in app unverified. |
| C17-AC8 | Partial | No migrations/resets/changes to storage; source-owner/projection parity and uncommitted tree preservation require confirmation after apply. |
| C17-AC9 | Partial | 140 focused Node test assertions passed with temporary TypeScript transpilation; owner Mac typecheck/build/full tests not run on modified patch. |
| C17-AC10 | Partial | Manual Mac/Windows questions, STOP, restart and latency checks not performed. |
| C17-AC11 | Pass for inventory only | Copilot read-only audit inventoried `rag:query-global → queryGlobal`, `queryMeeting`, `buildRAGPrompt`, source compatibility callers; migration deferred to CHG-18. |

**Tests in this ZIP workspace:** `node --test` on all available engine suites except one dependency-backed profile ingestion suite, plus the named canonical conversation-state and question-resolver suites: **140 tests passed / 0 failed / 0 skipped**; see `VERIFY.md` for exact limitations. All eight edited `.ts` files passed TypeScript parser syntax checks; new `.mjs` passed `node --check`. Full Electron typecheck fails here at initialization due to absent `@types/node`, not a changed-source diagnostic. A separate broad local attempt that included `ProfileIngestionIndependence.test.mjs` produced 139 pass / one module-load failure (`better-sqlite3` missing). No dependencies were installed. Owner-provided *pre-patch* Mac logs: typechecks and build pass; intelligence 2,053 pass, 0 fail, 9 TODO; full Electron 8,661 pass, 171 fail, 67 skip. These are not post-patch results.

**Required next actions:** User applies the bundle via **one** method; checks that no newer local code overlaps; runs `npm run typecheck:electron`, `npm run typecheck:ts5`, `npm run build:electron`, `npm run test:intelligence` and scoped canonical tests under Electron ABI; tests authorized résumé/PDF and same-session manual/meeting Singleton, STOP/restart, perf, and Windows. Keep CHG-17 open / CHG-18 blocked until all evidence is returned. Related defects: ERR-023–025. No commit/push was made by ChatGPT.


## WORK-0015 — CHG-17 post-audit repair package (2026-11-04)

**Status:** Implemented in a new patch ZIP, **unverified on owner checkout**. Owner provided Copilot's read-only WORK-0014 audit. Baseline: uploaded files overlaid with the exact WORK-0014 replacement files, consistent with Copilot's reported staged state on `main` at `d53f1ac`. Copilot found the WORK-0014 patch applied, `PROJECT_TREE.txt` independently staged, and the tracker/handoff stale; the new patch excludes `PROJECT_TREE.txt`. Owner must apply this incremental patch only after `git apply --check` confirms an exact match. Do not apply WORK-0014 again.

- **ERR-026:** preserve code, example and simplification shape independently from resolved follow-up referent.
- **ERR-027:** recognize explicit named-project questions from authorized file metadata, select only matching project IDs, and avoid searching unrelated projects; when no matching filename exists, permit existing authorized profile fallback, never treat another project file as proof of availability. Filename matching is intentionally conservative; content-only project identity still needs manual verification.
- **ERR-028:** new sender-scoped `gemini-chat-stream-clear-context` IPC resets canonical/manual/coding referents whenever renderer resets visible chat, without clearing other WebContents or meeting sessions. Needs in-app race/restart checks.
- **ERR-029:** expose sanitized `failed` retrieval outcome instead of silently masking thrown capabilities; expose only aggregated per-source prompt inclusion counts and align planner availability warnings with IPC permissions.
- **Performance/canonical:** `canonicalRagRead` remains default OFF; request-time repair/embedding timeout risks and canonical parity require separate guarded work and Mac checks. No migration, database reset, provider call, native-audio, license, packaging or STT changes.

**Evidence:** in-container TypeScript temporary transpilation of 503 Electron source modules (not `npm run build:electron`); focused `node --test` against all 21 engine test files except the dependency-backed `ProfileIngestionIndependence.test.mjs`: **106 pass, 0 fail, 0 skip, 0 TODO**. An initial 105/106 run exposed one stale source-scan assertion in `ResumeProjectRoutingRegression.test.mjs` about the former unrestricted memory flag; the test was migrated to assert the new named-project fail-closed scope, and all 106 passed on rerun. A smaller 3-file run also reported 15/15. Targeted unbundled runtime probing also passed four follow-up formats, three project-source resolution cases, and a failed-source trace case. TypeScript parser/syntax checks on modified `.ts`/`.tsx` passed; formal project typechecks/full Electron runs need owner's installed dependencies.

**Copilot WORK-0014 audit (owner-provided, not run by ChatGPT):** both typechecks and isolated Electron build exit 0; `test:intelligence` 2,059 pass / 0 fail / 9 TODO; `npm test` 8,633 pass / 176 fail / 88 skip (8,897 total), compared with 8,629 pass / 180 fail / 88 skip at identical HEAD baseline. This does not establish canonical-on parity, desktop STOP/restart, real résumé/PDF retrieval or Windows behavior.

**C17 status after WORK-0015:** AC1–7 and AC9 partial; AC8 PASS for protected-scope preservation pending runtime ownership verification; AC10 NOT TESTED; AC11 PASS for caller inventory/deferment. **CHG-17 fully verified: NO. CHG-18: BLOCKED.** Next: apply WORK-0015 patch (one method), Mac typechecks/build/focused + intelligence tests, classify broad failures, manual authorized project/resume/PDF/STOP/reset/performance checks, canonical-on parity under isolated fixtures, Windows acceptance as required.


## WORK-0016 — Post-WORK-0015 audit corrections (2026-11-04)

**Scope:** ERR-030–033; C17-AC3/6/7/8/9/10. Owner-provided Copilot post-WORK-0015 audit verified that WORK-0014 staged and WORK-0015 unstaged source were present, that Electron/TS typechecks and build passed, and intelligence **2,063 passed, 0 failed, 9 TODO**. The full suite had **180 baseline failures** (not newly attributable to this change); no real résumé/PDF Mac acceptance.

**Implemented in a patch-only work package:** conservative named-project identity filtering including lowercase/sibling negatives, sender-key manual session during meeting, sanitized source failures and final inclusion counts, query-time no-repair discipline, coalesced background repair and an abort-aware query-embedding wait budget with lexical fallback. Added focused regression coverage. No DB reset, storage/schema changes, canonical global enablement, STT/audio/native module edits, or deletion of live legacy RAG callers.

**Agent-run checks:** syntax/transpilation and focused tests passed **20/20**; expanded engine test run **116 pass / 1 dependency load failure** without better-sqlite3; native Electron/semantic typecheck not available in uploaded archive workspace. Patch check/reverse validation is part of package finalization. Owner Mac/Windows and isolated real source checks pending.

**Acceptance:** C17-AC6 remains PARTIAL until real named/sibling project files, authorized résumé/PDF and owner-scope cases are verified; C17-AC7/8 remain PARTIAL until cancellation/index lifecycle/latency proof; C17-AC3/9 need end-to-end diagnostics evidence; C17-AC10 manual tests pending. C17-AC11 inventory remains recorded. **CHG-17 fully verified: NO; safe to start CHG-18: NO.** The owner should apply only the incremental WORK-0016 patch after checking working-tree overlap and preserve the staged `PROJECT_TREE.txt`.


## WORK-0017 — Canonical query-embedding timeout and cancellation (2026-11-04)

**Scope:** CHG-17 / ERR-034 (Copilot's post-WORK-0016 DEF-01). Owner requires **patch-only** delivery. Patch baseline was reconstructed from the provided source ZIPs plus exact WORK-0014 and WORK-0015 replacement files and WORK-0016 incremental patch; this is **not** a live read of the owner's Mac checkout. Copilot's latest report confirms owner WORK-0016 was applied with local typechecks/build passing and 2,073/0/9 intelligence, 8,639/171/87 full tests.

**Implementation:** Bound the canonical query embedding wait to the existing 2-second abort-aware helper, propagate `AbortSignal` from both planned-source and legacy search call sites, preserve READY canonical lexical results when embedding times out, and discard late embedding output or post-STOP results. Add canonical production regression cases for valid embedding identity, pending provider lexical fallback, STOP and late result, plus source-level call-site assertions. Preserve canonical-read default **OFF**, source permission rules, DB/revisions/chunks/embeddings, existing legacy callers and owner `PROJECT_TREE.txt`.

**Verification in the owner checkout (2026-11-04):** the patch preflight and reverse-check passed; patch whitespace check passed excluding the owner's staged `PROJECT_TREE.txt`. In an isolated source/test-data copy using the existing dependencies and Electron ABI, `npm run typecheck:electron`, `npm run typecheck:ts5`, and `npm run build:electron` exited 0; the focused canonical/safety command passed **30/30**; `npm run test:intelligence` passed **2,073**, failed 0, with 9 TODO; `npm test` exited 1 with **8,643 pass / 171 fail / 87 skipped**. The full-suite failing test names match the preceding WORK-0016 run; the four additional cases pass. Do not treat this as root-cause classification of the historical failures. No live provider, user database, dependency install, native rebuild, commit, push, or CHG-18 implementation.

**C17-AC1–8 and C17-AC10:** PARTIAL pending canonical-on parity, owner/project identity, PDF/résumé, desktop STOP/restart, full-answer latency and Windows evidence; the full-suite failures also need root-cause classification. **C17-AC9:** PASS for the required focused tests, typechecks, build and diff review (not a claim that the full suite is green). **C17-AC11:** PASS for the current caller inventory; legacy migration deferred to CHG-18. **CHG-17 FULLY VERIFIED: NO. SAFE TO START CHG-18: NO.**

## WORK-0018 — CHG-17 focused test-evidence patch (2026-11-04)

**Status:** Applied and focused-verified; CHG-17 acceptance remains incomplete. Branch `main`, HEAD `d53f1ac11f32769a35d3305a963915b1659fc0fd`. The checkout had substantial pre-existing staged WORK-0014–0017 changes and the owner's staged `PROJECT_TREE.txt`; the patch was limited to two test files and did not alter those staged changes.

**Changes:** `CanonicalChatIntegration.test.mjs` now asserts the current manual-chat planned-source/Intelligence Engine boundary instead of requiring a stale inline `RagQueryPlanner.plan()` call inside `RAGManager.search()`. `CanonicalRagReadProduction.test.mjs` adds same-fixture canonical-on/off meeting evidence and selected-source-empty/sibling-isolation cases. The compatibility side is a deterministic mocked adapter, not the production `RAGRetriever`; no ranking/score or real legacy parity claim follows from these tests. Canonical read remains default-off. No application source, storage, schema, feature flag, credential, audio/STT/native, or `PROJECT_TREE.txt` changes were made by WORK-0018.

**Verification:** `git apply --check` passed before application. In isolated source/data copy `/tmp/chg17-work0018-Y3jahN`, `npm run build:electron`, `npm run typecheck:electron`, and `npm run typecheck:ts5` all exited 0. Focused command `node scripts/run-with-env.mjs --default-tmpdir NATIVELY_TEST_USERDATA=chg17-work0018-focused-userdata --set ELECTRON_RUN_AS_NODE=1 -- electron --test electron/rag/__tests__/CanonicalChatIntegration.test.mjs electron/rag/__tests__/CanonicalRagReadProduction.test.mjs` exited 0: **24 pass, 0 fail, 0 skipped/TODO**. `npm run test:intelligence` exited 0: **2,073 pass, 0 fail, 9 TODO**. No full `npm test`, actual indexed personal-data, desktop UI, paid provider, Windows, or six-second full-answer test was run for WORK-0018. Applying the complete staged diff to the temporary copy warned about the owner's pre-existing trailing whitespace in `PROJECT_TREE.txt`; that file was not edited, and the isolated build/tests passed.

**Acceptance:** C17-AC9 has focused test/build/typecheck evidence for this change. C17-AC1–8 and C17-AC10 remain partial; C17-AC11 remains the prior caller-inventory pass. True live legacy-versus-canonical parity and owner-performed Mac/Windows checks remain pending. **CHG-17 FULLY VERIFIED: NO. SAFE TO START CHG-18: NO.**

## WORK-0027 — PRE-CHANGE-19 STABILIZATION (2026-11-08)

STAB-001 / CHG-17/18 acceptance: In progress. Owner authorized safe production/regression repairs, full-product isolation/acceptance, React Doctor diagnosis, performance measurement and available Windows checks. Baseline main/0fb55abecd390561a435a5474bf784bb511577bf, clean tree. Preserve canonical architecture, credentials/user data, PROJECT_TREE, native/audio/STT/packaging and Git index. Do not start Change 19 or future modes. Read-only graph tools unavailable; targeted searches used. Full baseline suite running; older results are historical.

## WORK-0028 — STAB-001 follow-up source-scope and acceptance-harness patch (2026-11-08)

**Status:** Prepared externally; pending safe application and Mac-side verification. Source baseline is the user's 24-file WORK-0027 ZIP. ERR-055: explicit Linkship overview modifiers failed exact source ID resolution; offline patched regression 16/16. ERR-056: full-app acceptance called résumé upload without required picker authorization; patch uses real profile selection IPC. Remaining full macOS acceptance, 157 failure triage, React Doctor and Windows checks stay under WORK-0027. Do not start Change 19 solely because these offline checks passed. See WORK-0028 CHANGE_LOG and the accompanying patch README for commands and limitations.

## WORK-0041 / TASK-0002 — CHG-19 safe duplicated-responsibility cleanup (2026-11-09)

In progress. Owner explicitly requested CHG-19 on clean main/9e19e964 after owner-reported WORK-0032–0040; those IDs are reserved although their entries are not present in this repository's records. Preserve baseline and do not implement CHG-20. Inventory: scripts/audit/chg19-responsibility-inventory.md. C19-AC1: inventory complete, safe cancelled-path consolidation pending equivalence. C19-AC2: builds/full suites/manual limitations pending. Active legacy callers remain blockers to wholesale deletion. No uncommitted owner edits at start.
