# Sneak-Peek — error and investigation register

Updated: 2026-11-04. Agent-maintained. New errors go here before a fix is attempted. This file contains sanitized summaries, not raw secrets, personal documents or private conversations.

## Status rules

Use `Reported`, `Reproduced`, `Investigating`, `Fix implemented, unverified`, `Verified resolved`, or `Cannot reproduce`. Keep task status in TASK_TRACKER.md. An error is Verified resolved only with evidence covering its actual reproduction and relevant regression paths. “Cannot reproduce” is not “fixed.” Preserve history; append new observations and reopen on recurrence.

Known error does not mean known root cause. Separate observations, hypotheses and confirmed causes. Do not call all CI failures deployment failures; identify install, compile, tests, asset checks, packaging, signing, artifact launch or runtime stage.

## Open index

## ERR-017 — answer-bearing subsections rejected without entity association

2026-11-03, WORK-0011, CHG-16/17: four current EvidenceResolver tests retrieve the requested value but return insufficient because the value chunk omits the target entity. The existing gate requires entity support before later selection. Repair must prove association from the authorized document's structural context and preserve cross-entity rejection; no global entity bypass is authorized.

State: Fix implemented, unverified for app acceptance. Authorized same-source heading association and negative cross-entity cases pass within `test:intelligence` (2,043 pass, zero fail, nine TODO). Full Electron and live app remain failing/unverified.

## ERR-018 — Hindsight HTTP readiness does not establish memory readiness

2026-11-03, WORK-0011, BUG-005: owner audit shows a worker ConnectionRefusedError at loopback port 5433 while HTTP health remains 200. Current manager health is HTTP-only. The exact historical database endpoint source is under investigation; current installed Hindsight is 0.9.2 and supports `db_url="pg0"`. Old direct Gemini startup logs predate the current router fix and do not alone prove a present router regression. No credentials or user memories have been accessed.

State: Fix implemented, unverified. Current launcher defaults to embedded pg0 and isolates generic DB environment variables; readiness now distinguishes HTTP/database from memory. The old 5433 source is unproven. The actual server was unavailable and paid retain/recall was not run.

## ERR-019 — primary manual turns omit generation outcome metadata

2026-11-03, WORK-0011, CHG-03/12/16: newly discovered engine tests expose current IPC turns appended without generationStatus even though the canonical store supports it. Cancellation/failed exchanges can therefore remain indistinguishable from usable completed context. Investigate and propagate outcome state without storing partial answers as completed history.

State: Fix implemented, unverified for app acceptance. Pending/completed/cancelled/failed statuses are saved and unusable past turns excluded. Engine tests are included in the passing intelligence command; desktop stream behavior still needs manual verification.

## ERR-020 — own-résumé questions can select generic document retrieval

2026-11-03, WORK-0011, CHG-05/16: isolated engine regression for an explicit own-résumé question executed zero authorized profile calls. Turn understanding checks document cues before own-profile cues and does not recognize accented résumé. Add selective own-profile routing; unrelated general CS and third-party candidate attachments must remain separate.

State: Fix implemented, unverified for app acceptance. Focused own-profile and general CS fixture tests pass; real owner documents were not accessed.

## ERR-021 — license compatibility assertions remain failing after absent-module premise is isolated

2026-11-03, WORK-0011: full Electron suite initially failed the absent-native-module premise. The test now deliberately masks only the native-module binary and accepts the current unavailable sentinel case. Four remaining assertions exposed default handling of legacy providerless licenses and preservation of unverifiable perpetual-license files during API activation. `premium/electron/services/LicenseManager.ts` now treats providerless legacy records as legacy and rejects API-key activation that would overwrite a perpetual file unless safe replacement is proved. The focused absent-native-module suite passes; full-suite and app runtime verification remain pending. No entitlement check was bypassed.

State: Fix implemented, unverified. The fresh full suite no longer lists this file among failures, but the suite has 172 other failures; actual license activation was not performed.

| ID | Symptom | State | Task / next evidence |
|---|---|---|---|
| ERR-001 | Some AI models fail to connect/load; in-chat choices differ from setup | Investigating; scoped provider fixes implemented, live verification pending | BUG-001 / FEAT-005 / WORK-0008: retest Claude, NVIDIA NIM and model picker in the app. |
| ERR-002 | Personal intelligence does not work as expected | Reported | BUG-002 / FEAT-008: exact question, expected supporting document and visible output needed. |
| ERR-003 | Dependency/package/installed-app failure | Reported | BUG-003: separate install/build/package/launch stage; get macOS/CPU and exact command/output. |
| ERR-004 | Public Build Smoke has failed steps on macOS and Windows | Investigating; asset-gate fix implemented, 17 test failures unresolved | BUG-004: address test failures and rerun clean macOS/Windows smoke before resolving. |
| ERR-005 | Fast-answer option appears ineffective | Reported | FEAT-006: persisted setting, effective route/model and real full-answer timing needed. |
| ERR-006 | Focused intelligence-engine test expects project retrieval but receives none | Reproduced on starting commit | CHG-17: investigate retrieval behavior separately from FEAT-010. |
| ERR-007 | Three source-based UI tests fail in current and starting tree | Reproduced on starting commit | FEAT-010 verification limitation; investigate stale test assumptions separately. |
| ERR-008 | Latest Build Smoke fails Electron and intelligence tests | Investigating | BUG-004 / WORK-0006: reproduce and repair scoped failures; CI verification pending. |
| ERR-009 | Local Hindsight startup/provider verification fails | Investigating | BUG-005 / WORK-0007/0008: source guardrails pass; live provider verification remains. |
| ERR-010 | NVIDIA NIM connection probe sends the app-internal `nvidia_nim/` model prefix upstream | Fix implemented, unverified | BUG-001 / WORK-0008: source regression passes; retest a real NVIDIA key/model. |
| ERR-011 | LiteLLM Base URL accepts pasted cURL/shell text and may persist/log credential-bearing input | Fix implemented, unverified | BUG-001 / WORK-0008: URL validation and origin-only logging added; user must rotate the exposed key and replace malformed saved config. |
| ERR-012 | Live Claude fallback paths still select retired `claude-sonnet-4-20250514` | Fix implemented, unverified | BUG-001 / WORK-0008: defaults aligned to Sonnet 4.6; retest Claude connection/generation. |
| ERR-013 | Provider source-inspection tests use pre-rebrand/old-indentation locators | Verified resolved | QA-001 / WORK-0008: reproduced, repaired without production-behavior weakening; focused batch passes 65/65. |
| ERR-014 | Provider Settings can report Saved even when credential persistence failed | Fix implemented, unverified | BUG-001 / WORK-0009: cloud-key/LiteLLM setters now return persistence status; IPC and renderer surface failure. |
| ERR-015 | Hindsight Router config is generated but Hindsight still starts on the direct Gemini provider | Fix implemented, unverified | BUG-005 / WORK-0009: activate `litellmrouter` + `default` logical model and explicit fallback aliases; live server retest pending. |
| ERR-016 | Renderer TypeScript 5 check fails on an untyped provider save result | Verified resolved locally | CHG-14 / WORK-0010: `npm run typecheck:ts5` passes. |
| ERR-036 | Punctuated natural-language questions fail canonical FTS5 MATCH | Fix implemented; focused lexical path verified, broader parity pending | CHG-17 / WORK-0019: tokenized quoted FTS expression and production-boundary regression pass; source-family parity remains open. |

## ERR-016 — provider Settings TypeScript check

Owner supplied terminal output on 2026-11-03 showing TS7034 at `AIProvidersSettings.tsx:3072` and TS7005 at line 3102. Clean starting checkout `948ec1cd` contained the untyped `let result`. WORK-0010 added the declared result type. `npm run typecheck:ts5` and `npm run typecheck:electron` both pass on local macOS; provider runtime health remains separate and unverified.

## ERR-014 — provider Settings falsely reports a credential as saved

Reported by owner 2026-11-03 after applying WORK-0008. The Settings UI displayed a successful save, but the provider remained unavailable and the key did not survive/read back as expected. Static inspection confirmed a real acknowledgement bug independent of key validity: `CredentialsManager` cloud-key setters and `setLitellmConfig` discarded `saveCredentials()`'s boolean result, while the dedicated Settings IPC handlers continued to update runtime clients and returned `{ success: true }`. The renderer therefore had no way to distinguish a durable save from a refused/unwritable credential-store write.

WORK-0009 changes the six cloud-provider setters and LiteLLM config setter to return a boolean persistence acknowledgement and roll their in-memory field(s) back when the write fails. The IPC handlers now stop before runtime reconfiguration and return a visible error when persistence fails. `AIProvidersSettings` now renders that error instead of showing/retaining the Saved state. Source regression `CloudCredentialSaveAck2026_11_03.test.mjs` passes. No real OS keychain write was exercised in this source-only workspace, so the state is **Fix implemented, unverified** until the owner saves a key, restarts Sneak-Peek and confirms the provider remains configured.

## ERR-015 — Hindsight LiteLLM Router was configured but never activated

Reproduced from the owner-supplied Hindsight log plus current launcher source on 2026-11-03. The log prints a router chain using Gemini 3.x models, but the server immediately verifies a direct Gemini baseline and earlier boots call a retired `gemini-2.5-flash`; later boots hit Gemini `403 PERMISSION_DENIED` while still declaring the server READY. The current launcher exported `HINDSIGHT_API_LLM_LITELLMROUTER_CONFIG` but did not select Hindsight provider `litellmrouter`. The router builder also named every deployment `hindsight-llm`, while current Hindsight calls Router completions against logical `model_name: "default"`. Therefore the printed chain was not the active Hindsight generation path.

WORK-0009 explicitly selects `HINDSIGHT_API_LLM_PROVIDER=litellmrouter` and `HINDSIGHT_API_LLM_MODEL=default` whenever a Router config exists; the embedded server honors the canonical Hindsight env names and permits Router-managed credentials without requiring one global Gemini/OpenAI key. The Router config now gives the first deployment `default` and each later deployment an ordered fallback alias, with Router-level retries off by default to avoid multiplying Hindsight's own retries. Focused Router/source tests pass 15/15. This does **not** make a denied Gemini project valid: the supplied log's `403 PERMISSION_DENIED` is an upstream account/project authorization response. With another valid configured provider the corrected Router can fall through; with only the denied Gemini credential, the user must use a Gemini project/key that has access. Live Hindsight retain/recall remains pending, so state is **Fix implemented, unverified**.

## ERR-010 — NVIDIA NIM connection probe leaks internal model prefix upstream

Observed 2026-11-03 from the current uploaded source and owner screenshot. `electron/utils/modelFetcher.ts` intentionally stores NVIDIA chat models as `nvidia_nim/<provider-id>` so the app can route them, while `electron/LLMHelper.ts` strips that prefix before real generation. `electron/ipcHandlers.ts` did not strip it in `probeChatModel()`, so Test Connection could POST an internal id that NVIDIA does not recognize. The degraded-health branch also normalized the error without the failed model id, producing the screenshot symptom `Model "unknown" not found or unavailable...`. WORK-0008 adds a provider-boundary normalizer, matches preferred probe candidates against bare ids, sends only the bare id upstream, recognizes additional model-gone wording and supplies the actual failed id to error normalization. Source guardrails pass; no live NVIDIA request was made, so state is Fix implemented, unverified.

## ERR-011 — LiteLLM Base URL accepts shell/cURL text and can expose credential-bearing input

Observed 2026-11-03 from the current uploaded source and owner screenshot. The renderer and IPC save path accepted any non-empty string as `baseURL`; discovery/test then interpolated that value into `fetch()`, and connection-test logging included the raw base URL. The supplied screenshot shows a whole cURL command pasted into the Base URL field and visibly contains a Gemini credential. WORK-0008 validates/canonicalizes only absolute `http://` or `https://` URLs in both renderer and main process, rejects cURL/newline text, userinfo, query strings and fragments, and logs only the parsed proxy origin. Existing malformed saved state is not automatically deleted. The exposed credential must be rotated by the owner and the LiteLLM config re-entered with the actual proxy URL. Source guardrails pass; no live proxy call was made, so state is Fix implemented, unverified.

## ERR-012 — retired Claude Sonnet 4.0 remains in live fallback paths

Observed 2026-11-03 in the current uploaded source while investigating the owner screenshot showing Claude Test Connection HTTP 400. The renderer already offered `claude-sonnet-4-6`, but live backend defaults in `LLMHelper`, `ProviderRouter`, model-version baselines, screen vision registry, runtime fallback and connection-probe preference still used `claude-sonnet-4-20250514`; the probe preference also included old Opus 4.1. Anthropic's current model/deprecation documentation was checked during WORK-0008 and confirms the old Sonnet id is retired. WORK-0008 aligns operational fallbacks with the renderer's already-supported `claude-sonnet-4-6` and compatibility-maps an old persisted default/preference at read time instead of destructively rewriting credentials. The exact screenshot 400 is not claimed proven to have this single cause; a live Claude test is still required. State: Fix implemented, unverified.

## ERR-013 — stale provider source-inspection tests after rebrand/source formatting

Reproduced 2026-11-03 against the current uploaded source. The focused provider/Hindsight batch initially reported 15 failures out of 67; inspection showed most were source-locator drift rather than runtime defects: an AI Providers guard still expected `hasStoredKey.natively`, `TestLlmConnectionHealthWiring` required historical indentation around the handler marker, and `ProviderVisibilityFilters` used indentation-sensitive anchors and the old LiteLLM guard shape. WORK-0008 updates the tests to locate behavior rather than formatting and adds regressions for the actual provider fixes. Final focused batch: 65/65 passing. State: Verified resolved for this source-test failure family.

## ERR-009 — local Hindsight startup and provider verification

Reported 2026-11-03. The owner supplied a Hindsight startup history. Sanitized evidence: repeated Gemini 404 for a retired model in older starts, repeated Gemini 403 `PERMISSION_DENIED` during connection verification, and one start with no provider key. The server also reports READY after some connection-verification failures, so readiness does not prove usable generation. The short `natively_debug.log` contains shutdown credential-scrub messages and no actionable startup error. These observations concern Hindsight and do not yet prove why the desktop chat providers fail. Current status: Investigating; no provider access is claimed fixed. ERR-004/ERR-008 smoke failures are deferred by owner instruction and remain open.

2026-11-03 follow-up (WORK-0009): the newly supplied Hindsight history is stronger evidence than WORK-0007. It repeatedly shows a router chain printed by Sneak-Peek while Hindsight verifies a direct Gemini model, and later shows direct Gemini 403 `PERMISSION_DENIED` responses while the server health endpoint still becomes READY. Static inspection confirms the router provider/model activation defect recorded as ERR-015. WORK-0009 implements the activation/fallback fix; no live provider request was executed here.

## ERR-008 — Electron and intelligence smoke tests fail after asset check passed

Reported by owner 2026-11-02; related to ERR-004 / BUG-004. GitHub run https://github.com/Abitesh/Sneak-Peek/actions/runs/41495334540 at `7e07d99adb16d9988ca9050b247caebc7c8be99e` passes the asset gate on macOS and Windows; macOS fails Electron and intelligence tests, Windows reports intelligence failure. Logs show numerous separate assertions, including hyphenated project entity extraction, routing, source-based wiring checks, settings and other suites. Copilot's explanation is an unverified hypothesis until checked against actual assertions. No full-cause claim: investigate each failure family without weakening safety or hiding tests. The owner supplied screenshots whose temporary paths were inaccessible; GitHub job logs were retrieved instead. No CI rerun or fix yet.

2026-11-02 follow-up: `transcriptEntityExtractor.ts` now retains hyphenated project names and recognizes the explicit new product name for the existing cross-mode invite; 62 focused extraction/follow-up/privacy tests passed. `answerPlannerPatterns.ts` now recognizes explicitly requested exact project code and the product's source-availability question. Its focused 110-test batch passes 108 and fails two unrelated identity wording assertions. An initial attempt to change the safety classifier was reversed after focused tests did not support it. `npm run test:intelligence` after the entity fix but before the final routing change failed 17 tests (1,926 passed, nine skipped/todo); explicit engine suite failed 12 of 74. The remaining test failures and entire smoke run are unresolved. No CI rerun was performed.

2026-11-03 owner-supplied Build Smoke #6 transcript: `npm ci` logs a BGE reranker download JSON parse error but continues through postinstall, so that line is not the job's terminal failure. The macOS Electron `npm test` stage later reports 237 failed tests, 15 cancelled and 96 skipped; the failure list spans audio/source guards, RAG/knowledge re-embed, provider/routing, profile ingestion, license/native-module-absent behavior and renderer/source assertions. This is broader than the prior 17 `test:intelligence` failures and must not be collapsed into one cause. WORK-0009 fixes one confirmed stale locator in `CredentialPersistenceBehavior.test.mjs` plus provider/Hindsight defects, but does not claim the 237-failure suite is resolved. BUG-004 remains open and requires a fresh run after the current uncommitted/local fixes are committed.

## ERR-007 — existing source-based UI test failures

Observed by agent on 2026-11-02 while checking FEAT-010. `node --test src/components/__tests__/ModelPickerProviderMarkCoverage.test.mjs src/components/__tests__/PlansMotionCompositing.test.mjs src/components/__tests__/SettingsPeriwinklePortalScopeGuard.test.mjs` reported 25 pass, 3 fail on the edited tree. The same command on an isolated `git archive HEAD` copy of starting commit `417db933` reported the same 25 pass, 3 fail. Failures are the model picker provider-row assertion, absent private premium settings files, and a stale guarded settings file list. The rebrand did not cause these observed failures. No unrelated test repair was attempted. FEAT-010 acceptance remains unverified.

## ERR-006 — project retrieval expectation in focused engine test

Observed by agent on 2026-11-02 during FEAT-010 verification. Local project `main` started clean at `417db9337120494bb484c82d36172a6bdf0673c6` on macOS. After identifier/path renames and Electron build, `node --test electron/intelligence/engine/__tests__/SneakPeekIntelligenceEngine.test.mjs electron/services/__tests__/KeychainEntitlement.test.mjs src/components/__tests__/SneakPeekInterfaceStreamingMathWiring2026_08_07.test.mjs` passed 14 of 15 tests. The failing subtest expected `['project_knowledge']` and received `[]`.

Baseline status: confirmed existing. An isolated `git archive HEAD` copy of `417db933` was built with `node scripts/build-electron.js`; `node --test electron/intelligence/engine/__tests__/NativelyIntelligenceEngine.test.mjs` failed the same subtest with the same expected/actual values (4 passed, 1 failed). This excludes the FEAT-010 rename as the cause of this observed assertion failure. Root cause remains unknown. Next: investigate under CHG-17. No fix was attempted during rebranding.

## ERR-001 — provider/model loading and model-picker parity

Reported by: owner, 2026-11-01. Task: BUG-001; FEAT-005. Priority: high impact, exact severity pending reproduction.

Observed: owner reports connections/loading fail for some LLMs and chat offers only a small default model list even when setup displays more models after key configuration. These may be related or separate defects; split IDs when evidence warrants.

Environment: owner's Mac/VS Code; macOS version, CPU, installed app vs dev, branch/commit, Node and provider/model IDs not supplied.

2026-11-03 WORK-0008 follow-up: current uploaded source plus app screenshots now establish three concrete provider-path defects tracked as ERR-010–012: NVIDIA probe-id normalization, unsafe/malformed LiteLLM Base URL handling, and retired Claude operational fallbacks. These have source-level fixes and passing focused guards, but ERR-001 remains open because no live credentialed provider request or desktop app run was performed in this source-only handoff.

Reproduction to collect:
1. Record sanitized environment, configured provider and requested model ID; do not copy the API key.
2. Test provider/model discovery in settings, then inspect the in-chat list and enabled-model allow-list.
3. Select an affected model, submit one short permitted prompt, and record request ID, effective provider/model, timeout/error and visible result.
4. Reproduce after key/model setting changes and restart. Note whether issue affects one provider or all.

Static observations, not diagnosis: ModelSelectorWindow.tsx already uses allow-list filtering, model-change and credential-change subscriptions. Model loading can fail at multiple stages; do not simply remove an allow-list or add hardcoded IDs.

Hypotheses: discovery vs UI cache/allow-list mismatch, invalid/retired model ID, provider credentials/capabilities, timeout, local readiness or packaged resource path. NONE confirmed.

Confirmed root cause: unknown.

Fix: none performed by this workpack.

Verification required: exact failing model works or returns an actionable error; full settings→IPC→request→provider trace; permitted configured models visible; selection persists and controls actual next request; streaming/STOP/fallback regression checked. Never silently substitute a model to claim success.

History:
- 2026-11-01: Seeded from owner report and targeted static inspection. No live model request executed.

## ERR-002 — personal-intelligence / grounded-answer failure

2026-11-07 WORK-0026 investigation before repair: the eight reproduced assertions map to concrete legacy structured-profile behavior. `ContextAssembler` matches singular `achievement` and a word-bounded `certif` prefix, omitting plural achievements/certifications; includes experience for skills-only questions; and has no candidate-fit experience/achievement grounding. `generateCandidateIntro` truncates the extracted full name to its first token. These are confirmed source-level causes for seven failures. The eighth expects automatic profile inclusion for an ambiguous non-personal question; the current engine's fail-closed private-source policy must be verified before updating that obsolete expectation. Repair scope is structured fact rendering, with no invented facts or private retrieval permission expansion.

Reported by: owner, 2026-11-01. Task: BUG-002; FEAT-008; relevant CHG-16/17 protections. Priority: high impact.

Observed: personal intelligence is described as failing. Exact error/incorrect answer and source documents are unavailable. No assertion that the database, embeddings or planner is broken is justified yet.

Reproduction to collect:
1. Use a sanitized minimal PDF/Markdown fixture containing a known personal/project fact; use isolated test data rather than the owner's real database.
2. Record ingestion/readability/index status, source ID/revision, selected section/project and explicit permissions.
3. Ask one fact-specific personal/project question; record planner source selection, retrieved evidence IDs, assembled grounding policy and visible answer.
4. Ask an unrelated general CS question and the same question with permission denied or evidence absent.

Hypotheses to distinguish: parsing failure, unindexed/empty document, stale revision, wrong source scope, planner not selecting evidence, retrieval miss, evidence dropped before prompt, provider error or unsupported generated claims. NONE confirmed.

Confirmed root cause: unknown.

Fix: none performed.

2026-11-07 WORK-0025 evidence: an Electron-ABI run of the existing synthetic `ProfileFactualRecallProductionPath.test.mjs` and `PersonaFabricationFallbackProductionPath.test.mjs` passed 16 and failed 8. Failures include absent achievement/certification facts in the context and skills-only context including experience; this reproduces a personal-grounding concern without using owner data. These tests exercise a legacy `KnowledgeOrchestrator` stub path and do not by themselves establish the current desktop Intelligence Engine's behavior. Exact failing identities were not compared with the older full-suite baseline. Root cause remains unconfirmed; no profile production code was changed.

Verification required: supported facts use the right current source; unrelated private sources excluded; missing evidence does not cause invented first-person claims; updated/deleted documents behave correctly; PDF/MD parity and scope tests; manual owner-approved example. General CS questions must remain answerable without personal retrieval.

History:
- 2026-11-01: Seeded from owner report; no personal file contents copied or queries executed.

**2026-11-08 WORK-0026 resolution:** The confirmed structured-profile defects are repaired in ContextAssembler (full name, plural achievement/certification matching, category-specific context and factual candidate-fit grounding). The two actual production-path profile files pass 24/24 within the fresh 284-test batch. The obsolete ambiguous-question inclusion-bias assertion was replaced only after executing the engine to prove no private retrieval on that nonpersonal question. Actual synthetic personal/PDF ingestion, canonical vectors, EvidencePack and deterministic answer generation also pass. These scoped causes are resolved; the broader owner-reported personal-intelligence outcome remains Implemented, unverified pending full-product acceptance. Earlier “unknown/no fix” statements above are historical.


## ERR-003 — dependencies, packaging or installed application fails

Reported by: owner, 2026-11-01. Task: BUG-003; related CI evidence in ERR-004. Priority: release blocking when reproduced.

Observed: owner says converting the project into an app does not work and mentions dependency/install/deployment-like failures. The exact failing stage is not known. A CI smoke failure does not prove an installed macOS artifact failed for the same reason.

Environment needed: macOS version, arm64/x64/Rosetta status, Node/npm/Electron versions, clean vs existing install, exact command, branch/commit/dirty state, output artifact, signed vs unsigned and first-launch behavior.

Reproduction plan (separate approved workstream):
1. Preserve current work and use a safe separate workspace; inspect lockfile, install hooks and packaging scripts before installation.
2. Record the first failing stage independently: dependency resolution → postinstall/native rebuild → frontend/Electron compilation → tests/assets → packaging → signing/notarization → installed launch → model/native runtime.
3. Obtain relevant sanitized stdout/stderr, stack trace and artifact resource paths. Never collect signing secrets.
4. Test artifact launch outside the source folder on supported hardware; verify native modules, local models, sqlite-vec and packaged assets are available without dev-relative paths.

Static facts: observed postinstall rebuilds sharp/native Electron modules, downloads models and prepares sqlite-vec/canvas/plist/architecture. Packaging uses app:build and asset-verification scripts. Multiple stages can fail; none has a confirmed local cause yet.

Confirmed root cause: unknown.

Fix: none performed. Do not alter packaging/signing/native modules as a side effect of CHG-17.

Verification required: agreed clean install, packaging command, asset/native checks and real installed-artifact launch; authorized model/DB/transcript smoke check; platform/architecture results reported separately. Development startup alone is insufficient.

History:
- 2026-11-01: Seeded from owner report; no dependencies installed or artifact built.

## ERR-004 — Build Smoke failed steps (observed CI evidence)

Evidence source: GitHub Actions API inspected 2026-11-01.

Run: https://github.com/Abitesh/Sneak-Peek/actions/runs/40354373940

Commit: 6837a7a5d1eaa2531c878f05bb4f873c23af3859.

Status: Investigating; asset-gate fix implemented, unverified; intelligence failures unresolved. Task: BUG-004. Priority: build/release gate requiring clean platform confirmation.

Observed jobs:
- Electron entry smoke (windows-latest): failure. Failed steps include `Verify packaged local fallback assets (source mode)` and `Run intelligence unit tests`.
- Electron entry smoke (macos-latest): failure. Failed steps include the same source-asset and intelligence-test stages.
- API Smoke (weekly): success in this run. This does not prove model loading or application packaging works.

Observed annotations also mention a missing SUBMODULE_TOKEN/GH_APP_TOKEN/private-premium checkout warning and a Node action-runtime deprecation warning. They are **observations, not established causes** of the two failed steps. Never suggest bypassing private access controls or license checks. If entitlement is needed, request authorized setup or a legitimately supported public build path.

Missing evidence: complete failing step logs, failed test names/assertions, missing asset path(s), current-run comparison and relationship to the owner's local branch.

Next investigation:
1. Open this and the latest run; capture exact failed command/output with secrets redacted.
2. Classify asset-validation failures separately from intelligence unit-test failures; split ERR IDs if independently actionable.
3. Confirm required assets/submodules/scripts and documented supported build prerequisites.
4. Reproduce a minimal relevant check in authorized isolated setup; compare baseline and Change 17 branch.
5. Fix the identified cause in its scoped task; do not disable checks or declare all failures unrelated without evidence.

Confirmed asset-gate cause: Smart Turn is optional at runtime and in the downloader, but the packaged-assets verifier required the ignored ONNX binary. On 2026-11-02, the verifier was changed to report missing Smart Turn files as optional warnings while keeping core fallback models required. Local verifier and downloader unit tests pass. The complete error is NOT resolved: the GitHub run also reported 17 intelligence-test failures, and no clean GitHub rerun has been performed. Resolution gate: repair the failing tests or prove platform-specific expected behavior with focused evidence, then obtain a successful clean macOS/Windows Build Smoke run. Packaging/runtime acceptance remains separate.

History:
- 2026-11-01: API job/step status inspected; no claim that full downloadable logs were read or CI rerun.
- 2026-11-02: Owner requested investigation only. GitHub notification and run `41488866035` for `main` commit `db7acff2f09b9cdd83c59eb477a22d085a816172` were inspected. Both macOS and Windows jobs passed setup, compilation and Electron build but failed `Verify packaged local fallback assets (source mode)` and `Run intelligence unit tests`; the API Smoke job was skipped. The asset check explicitly reports missing `resources/models/pipecat-ai/smart-turn-v3/smart-turn-v3.1-cpu.onnx`. `git ls-tree` confirms the public commit contains only that directory's `manifest.json`; the ONNX file is locally present but ignored by the repository's ONNX/model ignore rules. The model downloader deliberately treats Smart Turn download failure as optional, whereas the smoke verifier makes it required. This conflicting contract is the confirmed asset-gate cause. The same CI test stage reports 17 failures; representative failures include a brittle manual-chat source assertion, profile/routing expectations, conversation-memory bounds, and provider pre-commit fallback. They remain unresolved; no application code, test, workflow, dependency, or CI configuration was changed. Proposed repair: make Smart Turn provisioning deterministic for the required CI/release gate (or formally make it optional in every consumer and verifier), then repair or realign each failing intelligence contract with focused tests and rerun both OS smoke jobs.
- 2026-11-02 (follow-up): Owner approved a scoped repair. `scripts/verify-packaged-local-assets.mjs` now treats the Smart Turn manifest/ONNX pair as optional warnings, matching `scripts/download-models.js` and `electron/services/LocalFallbackAssets.ts`; core intent/embedding/reranker assets remain required. Local verifier passed and `node --test scripts/__tests__/download-models.test.mjs` passed 9/9. Clean GitHub macOS/Windows rerun is still pending, and the 17 intelligence-test failures remain unresolved.

## ERR-005 — fast-answer option has no useful effect

Reported by: owner, 2026-11-01. Task: FEAT-006; FEAT-002. Status: Reported.

Observed: owner says the existing fast-answer option is not working well. No timing values, selected model or effective provider policy supplied.

Static observation: settings maintain fastResponseMode, load persisted state/credentials, and compute canUseFastMode from available configuration. That does not prove the active request follows the desired fast policy.

Reproduction: compare toggle off/on using identical agreed prompts and conditions; inspect persisted value, eligibility, chosen/effective provider/model and actual request. Measure Stop→complete answer as well as first useful token, retrieval and provider time. Record cold/warm and credentials-change cases.

Confirmed root cause: unknown. Fix: none performed.

Resolution: real policy behavior and persistence verified, model overrides explicitly communicated, grounding/STOP/commit invariants retained, repeatable speed evidence recorded. Starting a stream quickly does not meet the owner's complete-answer six-second requirement.

History:
- 2026-11-01: Seeded from owner report; no benchmark executed.

## New error template

Copy this section, allocate the next unused ERR ID and add it to the index. Use real observations, not invented log text.

```markdown
## ERR-XXX — brief symptom
Reported at / source:
Status:
Task / roadmap / WORK links:
Severity / owner impact:
Environment: OS, CPU, app/Node/Electron version, dev vs packaged
Branch / commit / relevant local changes:
Expected:
Observed:
Reproduction steps:
Sanitized error excerpt or access-controlled log reference:
Request / listening-cycle / generation ID (if applicable):
Hypotheses (unconfirmed):
Confirmed cause and evidence:
Fix and actual changed paths:
Automated checks actually run:
Manual/runtime checks actually performed:
Checks still pending / blocker:
Resolution evidence / resolved at:
History (append; do not erase previous investigation):
```

Do not mark resolved because an agent proposed code. If another error appears after a fix, record whether it is a recurrence, regression or independent issue. Keep tests against safe fixtures; never reset the owner's personal database to make a test pass.


## ERR-006 — Personal vector writes and résumé/project source routing

- **Status:** Repair and missing-source guard verified under Electron; the prescribed system-Node invocation is ABI-blocked by native ABI mismatch.
- **Roadmap:** CHG-17, especially C17-AC6, C17-AC8, and C17-AC9.
- **Task:** TASK-0001.
- **Reported evidence:** The supplied repair bundle describes duplicate-key failures in personal `sqlite-vec` writes and résumé/project questions receiving no authorized profile evidence. It expects no destructive change to source files or chunks.
- **Local pre-fix evidence:** In `electron/rag/VectorStore.ts`, `storePersonalEmbedding` updated the source row separately, used `INSERT OR REPLACE` for the native vec row, and logged/suppressed native-write failures. Final diff review also found that the new path did not throw for a missing source row when native vec support is disabled. In `electron/intelligence/engine/ContextPlanner.ts`, project questions always required `project_knowledge`. These are source observations, not a reproduced runtime failure.
- **Hypotheses:** Unsupported replace semantics or swallowed native write failures can leave the vector index stale; broad project-summary questions and meeting requests can choose unavailable project evidence instead of available profile/personal evidence.
- **Resolution history:** The bundle passed `git apply --check` against clean `main` at `0a27794e` and was applied. A separate fallback interaction was fixed and is tracked as ERR-006. The missing-source/no-native edge now checks the source row before updating and has a focused regression test.
- **Verification:** Final `npm run build:electron` passed. The prescribed system-Node command completed 19 pass / 3 fail because better-sqlite3 ABI 148 cannot load under system Node ABI 127. All 22 tests in the same four files passed with the installed Electron 43 Node runtime (ABI 148), including vector write, derived-index repair, and missing-source checks. No dependency rebuild was performed. Real-app behavior and manual acceptance remain unverified.

## ERR-007 — Named project fallback does not require profile evidence

- **Status:** Fixed and verified in focused tests; manual app acceptance pending.
- **Roadmap:** CHG-17, C17-AC6 and C17-AC9.
- **Task:** TASK-0001.
- **Evidence:** In the supplied focused test command, `ResumeProjectRoutingRegression.test.mjs` failed the case “named project question falls back to profile when no project file exists”; the planner result did not include `profile` in `requiredSources`. The named-project-with-project-file and broad-project-summary cases passed.
- **Confirmed cause:** After selecting the no-project-file profile/personal fallback, the planner's later unconditional `understanding.requiresProjectContext` rule re-required `project_knowledge` and `rag`. That made the final project-authority pruning remove profile/personal evidence.
- **Resolution history:** `ContextPlanner` now records when the fallback branch is selected and skips only that later project-context override. The system-design branch and project-authority pruning remain unchanged. The related existing permission-denial regression was updated to expect authorized profile fallback while asserting the project capability remains forbidden and unexecuted.
- **Verification:** The pre-fix failure was reproduced on macOS. `npm run build:electron` passed; all 19 routing/planner tests passed in the exact system-Node run but three vector tests could not load due to ERR-005. All 22 focused tests passed under Electron 43's matching Node ABI, including named-project fallback, project authority when available, and general-question privacy. Real-app/manual and Windows checks remain pending.


## ERR-023 — completed manual/meeting exchanges do not advance derived follow-up referents

- **Source:** Owner-observed same-session Singleton → "Can you give me its code?" failure; reproduced from uploaded `conversation-state-store.ts` and engine via an isolated in-container fixture.
- **Cause:** primary manual handler appended atomic turns but never called `advance` for completed responses; the derived `previousQuestion`/`activeTopic` remained empty. After referent recovery, generic/coding turn classification still overrode the follow-up, and ResponsePlanner could request prose instead of code.
- **Repair:** only on a completed same-session matching question/answer pair, advance derived referents without synthetic duplicate turns or dependence on Hindsight. Meeting user turns now mark pending/completed/cancelled/failed. Use recovered referent for retrieval query and treat explicit code shape as code in ResponsePlanner.
- **Checks:** exact Singleton prompt, response shape, session isolation and incomplete-state focused tests pass in temporary transpiled Node suite. Actual Mac UI STOP/restart/supersession and Windows remain unverified.
- **Status:** Fix implemented in WORK-0014 bundle, unverified on owner's app.

## ERR-024 — broad project-history wording can disable private retrieval

- **Source:** Copilot read-only compiled routing probe: "Explain the projects I worked on" planned no sources. Verified from uploaded resolver cue and reproduced with isolated `understandTurn` call.
- **Cause:** project-summary cue accepted "my/your projects" but not first-person "projects I worked on" wording.
- **Repair:** narrow explicit first-person project-history cue, preceding project/detail branching; named implementation requests retain project-file precedence. No general-question private retrieval widening.
- **Checks:** four candidate-history and named-project/general negative fixtures pass. Real authorized résumé/PDF still requires app verification.
- **Status:** Fix implemented in WORK-0014 bundle, unverified on owner's app.

## ERR-025 — missing evidence and source fallback are not accurately represented at the engine boundary

- **Source:** Copilot read-only audit and source inspection of `CanonicalRagRetrievalAdapter`, `RetrievalCoordinator` and the engine's evidence-empty prompt condition.
- **Cause:** fallback evidence was tagged as canonical, backend and empty/fallback reason metadata was not propagated, and `retrievalRequired` only flagged generic `rag` (not concrete personal/profile evidence). A late backend read could append results after abort.
- **Repair:** truthful per-evidence fallback label; whitelisted source outcomes only (backend, reason, count, status); explicit no-fabrication instructions for required private/document sources; cancellation guard before evidence collection. Do not log retrieved text or private source IDs in outcome metadata.
- **Checks:** canonical and fallback metadata, missing/denied source, no late-write and no-general-private-source regression tests pass. Canonical rollout/readiness/parity, real-owner DB and Windows remain unverified.
- **Status:** Fix implemented in WORK-0014 bundle, unverified on owner's app.


## ERR-026 — Follow-up answer format lost after referent resolution

- **Source:** Owner-provided Copilot read-only WORK-0014 audit, three offline follow-up probes.
- **Observed:** `Can you give me its Python implementation?`, `Can you explain that more simply?`, and `Give me another example.` retained prior topic but planned prose/direct answers.
- **Cause:** derived intent became `follow-up`, while `responseShapeOf` and `isExampleRequest` omitted explicit implementation, simplification and another-example cues.
- **WORK-0015 repair:** preserve original explicit output-shape cues after reference resolution; map simplification to concise explanation and another example to example kind.
- **Verification:** 4 variations passed in temporary TypeScript runtime; 106 engine tests including new regression suite passed after migrating a stale source scan. Desktop behavior pending. **Implemented, unverified.**

## ERR-027 — Named project evidence could come from another uploaded project

- **Source:** Owner-provided Copilot audit: project permission relied on presence of *any* file tagged `project`.
- **Cause:** no named-project file identity was bound through request to personal project search.
- **WORK-0015 repair:** narrow explicit name extraction from question; match against authorized project filenames, pass original file IDs to project retrieval and restrict lexical/semantic candidate searches. When no filename match exists, fail closed on project source and allow separately authorized profile facts; do not authorize personal/project PDF retrieval from other projects.
- **Limit:** a document whose filename does not identify its internal project cannot be matched using metadata alone. This requires a later verified project-id metadata source or isolated manual verification.
- **Verification:** pure project-scope tests and source boundary checks passed. Real DB/file and Mac acceptance pending. **Implemented, unverified.**

## ERR-028 — Renderer chat clear did not clear main-process session referents

- **Source:** Copilot read-only static trace: UI `resetChatState()` only cleared messages, while main-process canonical memory was indexed by stable WebContents ID.
- **WORK-0015 repair:** sender-scoped `gemini-chat-stream-clear-context` IPC cancels that sender's active manual stream and clears its canonical, manual and coding state; typed preload bridge invoked from renderer reset. No other sender or meeting session is cleared.
- **Verification:** static bridge assertion and isolated canonical clear test passed in the 106-engine-test run. Same-WebContents rapid clear/submission and actual restart pending. **Implemented, unverified.**

## ERR-029 — Missing failed-source and prompt-inclusion diagnostics

- **Source:** Copilot read-only retrieval trace: throwing capability gave no `failed` outcome; planner warnings presumed missing private sources despite registered capability.
- **WORK-0015 repair:** record sanitized failed/cancelled outcomes before rethrow; compute source-level aggregate counts of evidence included in final prompt; planner availability uses IPC-derived permission/source flags. No private text or IDs in source-level outcomes.
- **Verification:** failure propagation/tracing regression passed. Full IPC/real source checks pending. **Implemented, unverified.**


## ERR-030 — Named-project alias and casing may widen project retrieval (2026-11-04)

- **CHG-17:** C17-AC6; source: owner-provided post-WORK-0015 Copilot read-only audit (AF-1).
- **Confirmed:** `ProjectFileScope` previously searched filenames by a subset of name tokens and inferred named projects mainly from capitalized wording. With `Linkship Architecture.pdf` and `Linkship Legacy Notes.pdf`, a question about Linkship selected both; a lowercase named project could leave the project filter undefined.
- **WORK-0016 source repair:** normalize exact project identities from filename/doc-descriptor suffixes (or explicit `projectName` metadata), preserve case-insensitive named-project parsing, fail closed when an explicit name has no matching file ID, and forward scoped IDs into legacy project retrieval. Sibling-prefix and lowercase positive/negative tests added.
- **Limitation:** filenames are not a stable project ID; ambiguous naming and documents without identifying metadata still require a dedicated identity mapping and runtime data check. No user data inspected or updated.
- **Status:** Implemented, unverified. Temporary source-transpiled tests passed; Mac/real project documents still pending.

## ERR-031 — Query-time repair and embedding stalls (2026-11-04)

- **CHG-17:** C17-AC7/8/10; source: Copilot AF-2.
- **Confirmed:** `PersonalKnowledgeManager.searchRelevantAsync` synchronously awaited `repairLegacyChunking` and `repairUnreadableIndexes`; `searchSemantic` could wait 15 seconds for readiness then attempt 30-second primary and fallback embeddings without a caller abort signal.
- **WORK-0016 source repair:** run coalesced index repairs on the existing readiness/retry lifecycle, not inside question retrieval; cap query embedding wait to 2 seconds with an abort-aware wrapper and deterministic lexical fallback; propagate signal through project/personal adapter paths. Distinguish cancellation of the caller's wait from cancellation of the underlying provider operation (not supported by current provider API).
- **Status:** Implemented, unverified. Timeout/abort helper tests pass; true source-level abort, actual retrieval latency and indexing lifecycle on Mac remain pending.

## ERR-032 — Profile failure and retrieval diagnostics not surfaced in production (2026-11-04)

- **CHG-17:** C17-AC3/4/9; source: Copilot AF-3.
- **Confirmed:** `createPrimaryManualSneakPeekEngine` did not pass `onDecision` to `RetrievalCoordinator`; a profile retrieval exception was returned as `{items: []}`; completion logging printed evidence IDs but not source status/inclusion counts.
- **WORK-0016 source repair:** preserve profile exceptions for the coordinator's failed status; log only whitelisted source/status/count/backend metadata and final per-source included counts. Do not log profile text, query text, source IDs, error messages or secrets in these new diagnostics.
- **Status:** Implemented, unverified. Source-scan and coordinator regression tests pass; real IPC/provider-error exercise still pending.

## ERR-033 — Chat reset during active meeting clears wrong session (2026-11-04)

- **CHG-17:** C17-AC6/7/10; source: Copilot AF-4.
- **Confirmed:** Manual chat stored canonical turns under active `meetingMetadata.id ?? senderId`, whereas `gemini-chat-stream-clear-context` cleared only sender ID. Thus clear could retain a meeting-keyed manual referent.
- **WORK-0016 source repair:** manual chat state uses stable sender/WebContents key regardless of meeting activity; active meeting ID stays separately available to authorized meeting-transcript retrieval. The existing sender-scoped clear/abort path now addresses the same state key.
- **Status:** Implemented, unverified. Source-path regression test passes; Mac active-meeting clear/restart and race tests remain pending.


## ERR-034 — Canonical query embedding had no caller timeout or abort (2026-11-04)

- **Source:** Owner-supplied Copilot read-only WORK-0016 audit (DEF-01); CHG-17 C17-AC3/5/7/9/10.
- **Confirmed root cause in uploaded WORK-0016 source:** `RAGManager.resolveCanonicalQueryEmbedding()` directly awaited `embeddingPipeline.getEmbeddingForQuery(query)` with neither a retrieval budget nor `AbortSignal`. Both the engine's `readPlannedCanonicalSource()` and the legacy `search()` canonical-enabled branch used this shared helper. A stalled provider could hold up lexical reads despite canonical readiness and could ignore a request STOP while awaiting the embedding.
- **WORK-0017 repair:** Reuse the already-existing `withinQueryEmbeddingBudget` helper (2,000 ms caller wait, abort-aware). Propagate planned-source and search request signals. Return `null` embedding on timeout/abort/provider mismatch and retain canonical lexical-only retrieval; a cancelled planned-source request returns no evidence. The provider itself is **not** stopped (the current provider API does not accept an abort signal). No storage/index/schema, profile scope, first-token commitment or canonical-read default flag changes.
- **Agent verification:** The applied code passed the focused Electron-ABI canonical/safety tests (**30/30**) in an isolated copy. Both typechecks and Electron build exited 0; `test:intelligence` passed **2,073**, failed 0, 9 TODO. Full `npm test` exited 1 (**8,643 pass / 171 fail / 87 skipped**); all 171 failing test names match the preceding WORK-0016 run, so no new full-suite failure name was observed, but their root causes remain unclassified. No live provider or user database was used.
- **State:** The timeout/abort fix is verified at the focused production-boundary test level; actual app/runtime acceptance remains **unverified**. Canonical-on parity and remaining C17 acceptance gates remain open; CHG-18 blocked.

## ERR-035 — Canonical chat integration test asserted a retired planner call shape (2026-11-04)

- **Source:** WORK-0017 final acceptance audit; CHG-17 C17-AC3/9.
- **Confirmed cause:** `electron/rag/__tests__/CanonicalChatIntegration.test.mjs` required `this.queryPlanner.plan()` to appear inside `RAGManager.search()`. The current Intelligence Engine path owns planning and calls the planned-source reader, so this source-shape assertion failed despite the production path being structured differently. It was a stale test expectation, not by itself proof of a production retrieval defect.
- **WORK-0018 correction:** Replace the retired inline-planner assertion with checks for manual-chat primary engine wiring, planned canonical-source capability wiring, and absence of replanning through the planned reader. Add isolated canonical-on/off evidence and selected-source-empty/sibling-scope tests in `CanonicalRagReadProduction.test.mjs`.
- **Verification:** In `/tmp/chg17-work0018-Y3jahN`, focused canonical tests passed 24/24 and build/typechecks passed. The comparison's compatibility adapter is mocked; actual legacy `RAGRetriever` ranking/source parity remains unverified.
- **State:** Stale assertion corrected. No application-code fix is established by this error; CHG-17 remains unverified and CHG-18 blocked pending actual parity and runtime acceptance.

## ERR-036 — Punctuated questions were passed to canonical FTS5 as query syntax (2026-11-04)

- **Source:** Actual synthetic meeting parity audit; CHG-17 C17-AC5/6/9.
- **Observed behavior:** `CanonicalRagStorage.searchLexical()` passed natural-language query text directly to `rag_chunks_fts MATCH ?`. A query such as `Which cache did the team select?` caused an FTS5 syntax error in the canonical path; the read service fell back to legacy retrieval.
- **Confirmed cause:** Raw user punctuation/operators were treated as FTS5 grammar, unlike the meeting `VectorStore.searchLexical()` tokenization.
- **WORK-0019 repair:** Normalize query to at most 32 alphanumeric tokens, quote tokens, and OR them; retain parameterized SQL and the existing source type/source ID/scope, READY, current revision, deletion, and provenance handling. No source is created or activated by lexical search; canonical read remains default-off.
- **Verification:** WORK-0019 punctuation/operator unit and production-boundary tests pass in isolated Electron-ABI runs. An actual synthetic meeting legacy-vs-canonical lexical comparison with a punctuated question passes for source/content/provenance and reports canonical use without fallback. Scores differ; vector/rerank and mode/personal parity remain untested. Owner-checkout typechecks pass. No private database or provider was used.
- **State:** The punctuated meeting lexical failure is fixed in the applied code for the tested cases; broader source-family and app runtime acceptance remains unverified. CHG-17 is not complete; CHG-18 remains blocked.

## ERR-037 — Project source was missing from the canonical capability type (2026-11-04)

- **Source:** WORK-0020 Electron typecheck after adapting the consolidated CHG-17 patch.
- **Observed behavior:** `npm run typecheck:electron` reported TS2322 because the production capability rejected `project_knowledge` as a supported source, although the planned project path now uses the canonical adapter.
- **Confirmed cause:** `CanonicalRagRetrievalAdapterOptions.source` did not include `project_knowledge`.
- **Resolution:** Add the already-defined project source to the adapter's allowed source union and retain the same source identity through evidence mapping.
- **Verification:** `npm run typecheck:electron` passed after the type change; `npm run typecheck:ts5` passed. In the isolated WORK-0020 copy, the focused planned-project capability and canonical tests passed as part of the 70/70 Electron-ABI batch. No user-data or provider access was involved.
- **State:** Verified resolved for the type mismatch. This verifies the capability type/wiring tests, not complete project-source parity or desktop behavior; those remain CHG-17 acceptance gaps.

## ERR-038 — Live project/Redis answer has no grounded project evidence (2026-11-06)

- **Source / owner report:** Mac `npm start` runtime, `Terminal output(5).rtf`; owner reported the app answered a Redis-in-project question with a no-Linkship-evidence notice. Related: CHG-17 C17-AC3/4/6/10; WORK-0021 evidence review.
- **Observed, sanitized:** One primary manual-chat request reports a single `profile` retrieval outcome, `status=empty`, `itemCount=0`, `callCount=1`; its final trace has `evidenceCount=0`, `includedEvidenceCount=0`. No `project_knowledge` outcome is present in that request's trace. The log does not print the question text, so association with the user-reported Redis question is based on the owner's observation, not an exact request-ID/content correlation. The app chose not to invent an unsupported project-specific fact.
- **Unproven hypotheses:** The file/project might not be uploaded or READY/indexed; the query might be an ambiguous pronoun follow-up without a stored Linkship referent; the ContextPlanner might omit project retrieval; or the profile port might not expose available project evidence. An empty result alone does **not** establish that canonical RAG returned an incorrect result. No private project database or document was inspected.
- **Next targeted acceptance:** In a separate temporary app-data profile, ingest an authorized synthetic `Linkship` project containing a unique Redis reason; confirm READY/index status and the original authorized source ID. Ask explicitly `Why does Linkship use Redis?` and then, after a completed Linkship turn in the same session, ask `Why is Redis used in your project?`. Record sanitized selected-source outcomes, included evidence count, source IDs only in locally protected audit, and the final factual answer. Also check a similarly named sibling project is excluded. Do not enable the canonical read flag globally or fabricate the fact.
- **State:** Open / root cause not established; CHG-17 project/personal grounding acceptance remains incomplete. Do not reclassify as unrelated until source availability and engine routing are checked.
- **2026-11-07 WORK-0025:** Current exact-name/follow-up/scoped-reader tests pass. An actual canonical-reader → RetrievalCoordinator → Intelligence Engine test takes a READY synthetic Linkship chunk into the assembled prompt while excluding Linkship Legacy and résumé facts, with no fallback. A separate valid synthetic PDF parses 2/2 pages through the production extractor. This test has no provider generation or desktop UI; no request-ID/question correlation was obtained for the owner trace. The live symptom and root cause remain open.

**2026-11-08 WORK-0026 reconciliation:** Actual synthetic Linkship ingestion → production PersonalRagAdapter → planned reader with unchanged relevance gate → engine → deterministic provider now passes the initial question and completed-session follow-up, with exact original IDs; Linkship Legacy, deleted/failed/cleared turns and DBMS controls pass. This exposed and repaired ERR-044/045, but does not establish the cause of the owner first-turn trace or real source READY state. Status remains In progress; do not close this reported symptom or infer real-provider/desktop acceptance.


## ERR-039 — Cloud batch embedding timeout with local fallback (2026-11-06)

- **Source:** Mac `npm start` runtime, `Terminal output(5).rtf`; WORK-0021 evidence review.
- **Observed, sanitized:** `EmbeddingPipeline` reported a primary Gemini `embedBatch()` timeout after 30,000 ms for 66 chunks and selected the configured local fallback. A distinct earlier startup message said queue processing was skipped while no provider was ready; subsequently the provider became ready. These lines do not by themselves prove any query-time wait, missing project index or user-facing failure.
- **Hypotheses:** Provider/network latency, batch sizing, startup readiness, or background index repair. No provider-side root cause was diagnosed, and the 2-second canonical query-embedding caller budget is a different operation.
- **Next:** Investigate separately with a non-private synthetic batch and count ready/indexed chunks before and after the fallback, without exposing credentials or touching the user's DB. If it explains the missing authorized project fact, link back to ERR-038 and treat it as a CHG-17 dependency.
- **State:** Open / provider-indexing triage; no claim of CHG-17 causation or harmlessness.

**2026-11-08 WORK-0026 reconciliation:** No cloud batch embedding call was made; root cause and actual local-fallback outcome remain unverified. Kept separately deferred under provider/indexing triage, not asserted unrelated or harmless.


## ERR-040 — Uncaught native Napi::Error during app quit (2026-11-06)

- **Source:** Mac `npm start` runtime, `Terminal output(5).rtf`; WORK-0021 evidence review.
- **Observed, sanitized:** After `[Lifecycle] will-quit reason=user-quit`, `libc++abi` reported an uncaught `Napi::Error`; Electron exited with `SIGABRT`. The `concurrently` runner subsequently terminated the Vite process with `SIGKILL`, which is an effect of the Electron process failure rather than a second independent defect. No native stack trace was provided.
- **Root cause:** Unknown. It may involve native shutdown/cleanup; it is not established as an intelligence/RAG regression. Do not modify protected microphone/audio/native modules under CHG-17.
- **Next:** File as a separate native lifecycle issue, reproduce with a fresh temporary data profile and an ordinary close (preferably before starting capture); obtain a sanitized native backtrace and compare with the exact-HEAD baseline before a separately authorized repair. Check that it does not corrupt user data or prevent safe restart.
- **State:** Open / separate lifecycle investigation. Do not mark unrelated as proven until reproduced and traced; CHG-17 is blocked independently by grounding/parity acceptance.

**2026-11-08 WORK-0026 reconciliation:** The minimal Electron harness exits cleanly but does not load full main/native capture. It cannot close the owner native-quit crash. Separate lifecycle investigation remains pending; no audio/native implementation changed.


## ERR-041 — Unnamed singular project follow-up can lose exact original file-ID scope (2026-11-06)

- **Related:** ERR-038 / CHG-17 C17-AC3/6/7/9; WORK-0022.
- **Confirmed source-level cause:** Both active manual and meeting request builders called `resolveProjectFileScope(rawQuestion, personalFiles)` without checking the previous completed conversation exchange. For “Why is Redis used in your project?” the previous project name was absent from the raw turn; the scope resolver returned an undefined `selectedFileIds` allowlist while reporting that project files were available. The `projectFilesOnly` adapter can then run without a named project's exact IDs. This is a reproducible authorization-scoping *risk*, not evidence that private sibling material was actually sent to any provider.
- **Proposed WORK-0022 fix:** Rebind singular pronoun project follow-ups only to the immediately preceding, completed, same-session Q/A's explicit project name; revalidate original IDs against current available `fileType=project` files. Fail closed on cancelled/failed/unpaired exchange, missing project, changed referent, or cleared state. Suppress profile substitution for unresolved singular project references. Support an explicit two-word subject project name (Linkship Legacy), which overrides the previous name.
- **Verification:** 11 scope checks against temporary transpilation of the actual helper and nine targeted Node tests against actual temporarily transpiled project scope, adapter, and canonical conversation state modules pass. Mac Electron build/native tests and in-app authorized Linkship/Redis evidence/latency remain pending. The owner must apply the patch first.
- **State:** WORK-0022 scope repair is present in the current staged tree; its completed-turn, sibling override, failure, removed-file and clear-state tests pass in the isolated intelligence suite. End-to-end desktop retrieval remains unverified. ERR-038 remains open independently: synthetic retrieval tests do not establish the owner-reported first-turn result.
- **2026-11-07 WORK-0025:** The current checkout starts clean at `86923ac5`; the scope repair is committed in the current source, not staged. Its focused Change 17 tests pass, including exact Linkship identity, completed follow-up, sibling override, cancelled/failed/cleared and removed-file cases. The known source-scope defect is resolved in isolated tests; desktop end-to-end acceptance remains pending under ERR-038.

**2026-11-08 WORK-0026 reconciliation:** Existing exact-ID scope repair is preserved and its actual synthetic ingestion/reader/engine follow-up path is now exercised through deterministic generation; cancelled/failed/missing/sibling/cleared cases pass. Known scope defect Verified in this regression environment. Retrieval-query relevance was a distinct defect (ERR-044); owner full-product acceptance remains pending.


## ERR-042 — Mode retrieval drops page provenance on the legacy result path (2026-11-06)

- **Related:** CHG-17 C17-AC5; WORK-0023.
- **Reproduction:** In a disposable source copy, actual `ModeHybridRetriever.indexFile` indexed a synthetic mode reference with page 7 and an active deterministic embedding space. Actual `ModeRagAdapter.retrieve` returned the matching source/content and vector result, but its chunk had no page locator. The canonical read over equivalent READY/current data returned the same original source and content with `pdf:page:7`. The test also confirmed canonical matching-space vector hits, incompatible-space rejection, no non-READY hits, and superseded-revision exclusion.
- **Confirmed cause:** `ModeHybridRetriever.retrieve` builds returned chunks from selected candidates but omits their `pageStart`/`pageEnd` metadata. `ModeRagAdapter` can recover page numbers only by parsing `[Page n]` markers in returned text; the actual retrieved chunk text does not retain the locator, so the adapter returns no page provenance even though indexing had it.
- **Impact:** Legacy mode retrieval cannot provide the page locator that canonical retrieval preserves; this is a real provenance parity failure for C17-AC5. The reproduction is synthetic/offline and does not establish a desktop UI symptom.
- **Resolution:** WORK-0024's production `ModeHybridRetriever` selected-chunk mapping now carries page/section/heading, and `ModeRagAdapter` prefers structured locators with a legacy text-marker fallback. This source change was already present at current HEAD before WORK-0025. Canonical reads remain default-off.
- **2026-11-07 verification:** Current Electron-ABI `Change17ModePageProvenance.test.mjs` passes 4/4 with the actual `ModeHybridRetriever`/`ModeRagAdapter`: normal and document-grounded page 7, structured section/heading, compatible-vector indexing/retrieval, and legacy marker fallback. The broader Change 17 suite passes 55/55. These are isolated production-component checks, not desktop or final EvidencePack proof.
- **State:** Known page-loss reproduction resolved and focused-verified; full CHG-17 provenance acceptance remains partial pending end-to-end EvidencePack and broader source-family checks.

**2026-11-08 WORK-0026 reconciliation:** Actual mode adapter page/section/heading and compatible-vector regression tests pass within the fresh focused batch. Known mode-page defect remains Verified in the scoped synthetic environment. Separate final EvidencePack metadata mismatch found for a valid personal PDF is repaired under ERR-046; no real-model semantic quality claim.


## ERR-043 — RAG query cancellation and session ownership are not sender-scoped (2026-11-07)

- **WORK-0026 / CHG-18; confirmed before repair:** Global/meeting/live active query keys omit the sending WebContents identity. `abortPriorRAGQueriesOfClass` and `rag:cancel-query` therefore cancel another window's same-class request. Historical meeting request construction also prefers the active meeting's session ID over the requested historical meeting ID. These are source-confirmed isolation defects; no real user session was accessed.
- **Required repair:** Sender-scoped query keys, selected-meeting session identity, exact current-controller checks before every output and settlement, compatible existing IPC payloads, and abort-aware transport settlement. Verify with synthetic real-engine stream tests; preserve source permissions and first-token commitment.
- **State:** In progress; production cutover requires focused regression evidence.

**2026-11-08 WORK-0026 resolution — Verified, scoped:** Sender/surface/encoded meeting prefixes now isolate active controllers and conversation sessions; requested historical meeting identity is preserved. Current-controller and abort checks protect chunks/completion/settlement. Actual registered IPC handler snippets, real engine transport and provider/isolation tests pass, including cancellation, supersession and clear-context ownership. Production preload bridge and stream payloads pass in the disposable desktop harness. Full-product physical STOP/restart and Windows remain acceptance checks.


## ERR-044 — Authorized project follow-up loses identity in retrieval query (2026-11-07)

- **Reproduction before fix, WORK-0026:** Actual `PersonalKnowledgeManager.ingestFile`/`listFiles`, `PersonalRagAdapter`, `RAGManager.readPlannedCanonicalSource` with production relevance gate, engine and deterministic provider return the correct Linkship first answer. The next completed-session “Why is Redis used in your project?” returns zero evidence despite the correct original-file allowlist. The same fixture's explicit first question passes the real gate.
- **Confirmed cause:** WORK-0022 revalidates IDs but IPC drops `projectScope.namedProject`. The engine sends the deictic “your project” query unchanged into source-owned retrieval/relevance; its terms do not identify Linkship. Prior WORK-0025 bypassed the relevance gate in its test harness, so it could not reveal this failure. This establishes a synthetic follow-up defect, not the uncorrelated owner first-turn symptom.
- **Required repair:** Carry the revalidated name with the existing ID allowlist, let the engine resolve the retrieval-only project referent after planning, preserve the original question, permissions and relevance thresholds. No hardcoded project/Redis rule and no global search fallback.
- **State:** Reproduced, in progress.

**2026-11-08 WORK-0026 resolution — Verified, scoped:** IPC retains revalidated projectScope.namedProject alongside exact IDs. Engine resolves singular project references only in the retrieval query after context authorization; original question, thresholds and permissions remain unchanged. Actual Linkship first/follow-up pipeline passes with production relevance gate and no hardcoded Redis/project exception. Part of /tmp/chg1718-resume-focused.log (284/284).


## ERR-045 — Previous project answer remains in prompt after an exact project switch (2026-11-07)

- **Reproduction before fix, WORK-0026:** The actual synthetic Linkship → completed follow-up → Linkship Legacy path now retrieves only the sibling's original ID, but the final prompt also contains the old Linkship rationale in recent conversation. A deterministic provider consequently selects that old rationale. Current evidence itself is correctly scoped.
- **Confirmed layer:** `PromptAssembler` renders recent conversation independently of the exact current project source-ID scope. Conversation text is not revalidated source evidence and can reintroduce facts from a removed or different project.
- **Required repair:** For an exact project-file scope (including a zero-ID missing scope), use conversation only for upstream turn understanding/referent resolution; assemble factual prompt context from the newly scoped evidence. Keep general/code conversation continuity unchanged. Regression must assert both sibling evidence IDs and absence of old rationale from the final prompt.
- **State:** Reproduced, in progress.

**2026-11-08 WORK-0026 resolution — Verified, scoped:** PromptAssembler uses conversation for upstream referent understanding but excludes its answer text from exact-project-file factual context, including empty/denied file scopes. Actual sibling switch verifies current evidence IDs and absence of old rationale from final prompt. General/code continuity retains existing behavior. Focused 284/284 and intelligence 2,099 pass/9 TODO.


## ERR-046 — Canonical adapter locator field names do not populate structured EvidencePack fields (2026-11-07)

- **Reproduction before fix, WORK-0026:** A valid generated two-page PDF is parsed/ingested by actual personal storage, projected to a READY canonical revision, and read through the engine's canonical adapter. Page 2 exists on the retrieved chunk and in provenance, but `EvidencePack.items[].pageStart` and `chunkId` are absent.
- **Confirmed cause:** The canonical adapter emits metadata `page` and `canonicalChunkId`, while `buildEvidencePackFromSneakPeekEvidence` consumes `pageStart` and `chunkId`; heading is omitted as a separate field. Preserve existing metadata keys and additionally populate the canonical structured fields/pointer.
- **State:** Reproduced, in progress; no storage or locator rewrite required.

**2026-11-08 WORK-0026 resolution — Verified, scoped:** Canonical adapter emits pageStart, heading, chunkId and typed pointer in addition to compatible metadata. A real generated two-page PDF is parsed/ingested/projected and read through engine EvidencePack; page 2, chunk/revision and prompt evidence assertions pass with native sqlite-vec. No locator or storage rewrite. Focused 284/284.


## ERR-047 — Personal-file deletion leaves its READY canonical projection searchable (2026-11-07)

- **Reproduction before fix, WORK-0026:** The real personal manager deletes the synthetic two-page PDF after successful canonical projection. A subsequent actual canonical read with that original source ID still returns its Zeta fact. No owner data was involved.
- **Confirmed cause:** `PersonalKnowledgeManager.deleteFile` invalidates the async index attempt and deletes legacy chunks/status/file, but does not tombstone the corresponding canonical document. Current-file project allowlists mask this for project queries; a generic canonical personal read remains exposed.
- **Required repair:** In the existing file-delete transaction, use canonical storage's existing soft-delete lifecycle for this source when a canonical schema/projection exists. Preserve revision history; do not reset/migrate a DB or hard-delete source history. Failure must roll back the logical deletion rather than silently leave searchable data.
- **State:** Reproduced, in progress.

2026-11-07 WORK-0026 extension of ERR-047: synthetic tests of actual `DatabaseManager.deleteReferenceFile`, `deleteMode`, `deleteMeeting`, and `clearAllData` reproduce the same orphaned canonical searchability for mode/meeting sources. The first reduced meeting fixture omitted `meeting_id` and was corrected before accepting the reproduction; all four source-delete operations then complete yet leave their READY canonical facts searchable. Use the same existing soft-delete lifecycle at these source-owner boundaries; retain unrelated source families and revision history.

**2026-11-08 WORK-0026 resolution — Verified, scoped:** Existing CanonicalRagStorage softDeleteDocument lifecycle is called within personal/file/mode/meeting source-delete transactions via revokeCanonicalSources. MeetingStorageAdapter and clearAllData meeting family also revoke projections. Five actual DatabaseManager lifecycle tests plus personal PDF deletion verify absent canonical search results, retained revision history, preserved other families, and rollback on forced source-delete failure. No real database/reset/migration. Focused 284/284.


## ERR-048 — Desktop verification screenshot precedes answer paint (2026-11-08)

- **WORK-0026 continuation, CHG-17/18 acceptance harness:** The fresh disposable Electron run returns correct renderer DOM answer text and two total completions, but visual inspection of `/var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/chg1718-desktop-EXCoE6/visible-answer.png` shows only the heading. This is a confirmed verification-evidence mismatch, not an established application streaming defect.
- **Hypothesis before repair:** `capturePage()` runs immediately after the renderer promise resolves; DOM settlement is not a compositor-paint barrier. Add an explicit renderer animation-frame barrier and inspect the new image before accepting visible-answer evidence. No production behavior or test assertion will be weakened.
- **State:** In progress; DOM assertions pass, visual acceptance pending.

**2026-11-08 WORK-0026 resolution — Verified:** Added two renderer requestAnimationFrame boundaries before screenshot capture. Rerun exits 0 with two reads/generations/completions, correct DOM text and a visually inspected image showing the answer. Evidence: /var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/chg1718-desktop-84cF3r/result.json and visible-answer.png; stdout /tmp/chg1718-resume-desktop-painted.log. This confirms a harness capture-before-paint defect; no production fix was necessary.

## ERR-049 — Overlay delayed submission survives close/unmount (2026-11-08)

WORK-0027 / STAB-001. Installed React Doctor 0.2.10 reproduced exactly two effect-needs-cleanup errors in GlobalChatOverlay.tsx:168 and MeetingChatOverlay.tsx:224 (48 warnings). Both opening effects schedule submitQuestion after 100 ms without cancelling on close, initial-query replacement or unmount. Confirmed source defect; stale submission can start after closing and clearing. Repair with effect-owned timeout cleanup, verify executed effect lifecycle and rerun installed tooling. In progress.

## ERR-050 — Compatibility project routing and entity validation omit hyphenated names (2026-11-08)

WORK-0027 / STAB-001. Saved baseline ResidualFixes/RoutingReleaseFixes/WtaManualParity and CustomModeSourceIsolation failures assert wrong project route or split Sneak-Peek entity. Production answerPlannerPatterns retains old alias-only named-project patterns; extractCandidateEntities splits a hyphenated proper noun into unrelated parts. Repair generic hyphenated entity recognition and support current project alias alongside existing compatibility aliases; preserve source authorization. Existing failing cases plus a nonbrand hyphenated name regression required. In progress.

## ERR-051 — Parser regressions depend on missing/invalid binary fixtures (2026-11-08)

WORK-0027 / STAB-001. Fresh baseline reproduces six failures: SafeDocumentTextExtractor PDF/DOCX paths absent, parser-timeout assertion fails on ENOENT before parsing, RealPdfIngestion fixture is not parseable PDF. These are fixture failures, not established extractor defects. Replace with generated valid synthetic PDF/DOCX in disposable test directories, retain actual parser/destroy/timeout assertions, and add supported TXT/CSV cases. No owner document or fixture binary overwritten. In progress.

## ERR-052 — Compatibility profile processing ignores planned source exclusions (2026-11-08)

WORK-0027/STAB-001. Fresh baseline ProfileIntelligenceE2E reproduces JD context on coding/sales questions. KnowledgeOrchestrator.processQuestion computes canonicalResumeAllowed but passes every loaded resume/JD/company into ContextAssembler regardless. It also returns early without a resume even for authorized JD-only questions and emits an intro fallback for non-intro requests. Source-confirmed privacy/grounding boundary defect; use the existing plan's layer permissions before assembly, preserve canonical engine ownership, and test denied and JD-only cases. In progress.

## ERR-053 — Regression spies/assertions target superseded implementation boundaries (2026-11-08)

WORK-0027/STAB-001. ModeHybridChunkCache's four failures spy on chunkText while current locator-preserving retrieval calls chunkRecords and caches by original ID/content hash. ProfileIntelligenceGate compares classification order to removed inline ragManager; actual handler delegates to engine. Update these boundary references only; retain executed cache invalidation/count and source exclusion assertions. In progress.

## ERR-054 — Named project overview loses exact source scope in actual app (2026-11-08)

WORK-0027 / STAB-001. Before fix, actual production main/preload/React overlay in OS-isolated macOS app: synthetic Linkship and Linkship Legacy ingested through real personal-files IPC. “Why did you use Redis in Linkship?” selects only Linkship; next “Tell me about Linkship.” omits projectFileIds and retrieves both files, placing both canary facts in final prompt and visible deterministic answer. Evidence: /var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/sneak-stabilization-kpwub3iu/scenarios.json. Confirmed in-scope source isolation defect, not provider hallucination. In progress; investigate ProjectFileScope and IPC scope propagation before repair.

## ERR-055 — Explicit project overview with trailing modifier loses exact file scope (2026-11-08)

WORK-0028 / STAB-001. Source-level reproduction against the owner-supplied WORK-0027 snapshot: `resolveProjectFileScope("Tell me about Linkship in detail.", ...)` returns no `selectedFileIds` while `Linkship` and `Linkship Legacy` are present. Incidental `in detail` can defeat anchored overview parsing, so the downstream engine may lack its intended project-ID allowlist. Patch prioritizes explicit overview extraction over incidental prepositions, recognizes common polite/detail modifiers, and rejects pronoun subjects when an explicit named-source phrase exists. An isolated compiled TypeScript module passed 16 source-scope tests, including exact sibling exclusion, absent named source and unbound follow-up. **Status: offline-focused verified; full macOS application rerun required before marking runtime resolved.** Do not widen retrieval on missing identity.

## ERR-056 — Stabilization harness skips mandatory résumé picker authorization (2026-11-08)

WORK-0028 / STAB-001. Source-level check of actual production `profile:upload-resume` reveals it deliberately consumes an expiring allowlist populated only by `profile:select-file`. The owner-supplied `stabilization-full-product.cjs` tried `profileUploadResume(resumePath)` directly, causing an expected rejection unrelated to résumé ingestion quality. Patch performs `profileSelectFile()` through the real preload/IPC route after supplying its disposable selected file to the test dialog stub; then uses the returned path in `profileUploadResume()`. Clear-chat actions are awaited and their success checked. JavaScript syntax checked; **full app scenario not executed outside macOS**. Production path-selection checks must stay intact.
