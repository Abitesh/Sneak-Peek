# Sneak-Peek — error and investigation register

Updated: 2026-11-03. Agent-maintained. New errors go here before a fix is attempted. This file contains sanitized summaries, not raw secrets, personal documents or private conversations.

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

Verification required: supported facts use the right current source; unrelated private sources excluded; missing evidence does not cause invented first-person claims; updated/deleted documents behave correctly; PDF/MD parity and scope tests; manual owner-approved example. General CS questions must remain answerable without personal retrieval.

History:
- 2026-11-01: Seeded from owner report; no personal file contents copied or queries executed.

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
