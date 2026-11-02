# Sneak-Peek — error and investigation register

Updated: 2026-11-02. Agent-maintained. New errors go here before a fix is attempted. This file contains sanitized summaries, not raw secrets, personal documents or private conversations.

## Status rules

Use `Reported`, `Reproduced`, `Investigating`, `Fix implemented, unverified`, `Verified resolved`, or `Cannot reproduce`. Keep task status in TASK_TRACKER.md. An error is Verified resolved only with evidence covering its actual reproduction and relevant regression paths. “Cannot reproduce” is not “fixed.” Preserve history; append new observations and reopen on recurrence.

Known error does not mean known root cause. Separate observations, hypotheses and confirmed causes. Do not call all CI failures deployment failures; identify install, compile, tests, asset checks, packaging, signing, artifact launch or runtime stage.

## Open index

| ID | Symptom | State | Task / next evidence |
|---|---|---|---|
| ERR-001 | Some AI models fail to connect/load; in-chat choices differ from setup | Reported | BUG-001 / FEAT-005: provider/model IDs, state transitions and sanitized errors needed. |
| ERR-002 | Personal intelligence does not work as expected | Reported | BUG-002 / FEAT-008: exact question, expected supporting document and visible output needed. |
| ERR-003 | Dependency/package/installed-app failure | Reported | BUG-003: separate install/build/package/launch stage; get macOS/CPU and exact command/output. |
| ERR-004 | Public Build Smoke has failed steps on macOS and Windows | Fix implemented, unverified | BUG-004: rerun clean macOS/Windows smoke and separately address the 17 intelligence-test failures. |
| ERR-005 | Fast-answer option appears ineffective | Reported | FEAT-006: persisted setting, effective route/model and real full-answer timing needed. |
| ERR-006 | Focused intelligence-engine test expects project retrieval but receives none | Reproduced on starting commit | CHG-17: investigate retrieval behavior separately from FEAT-010. |
| ERR-007 | Three source-based UI tests fail in current and starting tree | Reproduced on starting commit | FEAT-010 verification limitation; investigate stale test assumptions separately. |

## ERR-007 — existing source-based UI test failures

Observed by agent on 2026-11-02 while checking FEAT-010. `node --test src/components/__tests__/ModelPickerProviderMarkCoverage.test.mjs src/components/__tests__/PlansMotionCompositing.test.mjs src/components/__tests__/SettingsPeriwinklePortalScopeGuard.test.mjs` reported 25 pass, 3 fail on the edited tree. The same command on an isolated `git archive HEAD` copy of starting commit `417db933` reported the same 25 pass, 3 fail. Failures are the model picker provider-row assertion, absent private premium settings files, and a stale guarded settings file list. The rebrand did not cause these observed failures. No unrelated test repair was attempted. FEAT-010 acceptance remains unverified.

## ERR-006 — project retrieval expectation in focused engine test

Observed by agent on 2026-11-02 during FEAT-010 verification. Local project `main` started clean at `417db9337120494bb484c82d36172a6bdf0673c6` on macOS. After identifier/path renames and Electron build, `node --test electron/intelligence/engine/__tests__/SneakPeekIntelligenceEngine.test.mjs electron/services/__tests__/KeychainEntitlement.test.mjs src/components/__tests__/SneakPeekInterfaceStreamingMathWiring2026_08_07.test.mjs` passed 14 of 15 tests. The failing subtest expected `['project_knowledge']` and received `[]`.

Baseline status: confirmed existing. An isolated `git archive HEAD` copy of `417db933` was built with `node scripts/build-electron.js`; `node --test electron/intelligence/engine/__tests__/NativelyIntelligenceEngine.test.mjs` failed the same subtest with the same expected/actual values (4 passed, 1 failed). This excludes the FEAT-010 rename as the cause of this observed assertion failure. Root cause remains unknown. Next: investigate under CHG-17. No fix was attempted during rebranding.

## ERR-001 — provider/model loading and model-picker parity

Reported by: owner, 2026-11-01. Task: BUG-001; FEAT-005. Priority: high impact, exact severity pending reproduction.

Observed: owner reports connections/loading fail for some LLMs and chat offers only a small default model list even when setup displays more models after key configuration. These may be related or separate defects; split IDs when evidence warrants.

Environment: owner's Mac/VS Code; macOS version, CPU, installed app vs dev, branch/commit, Node and provider/model IDs not supplied.

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

Status: CI-reported failure; no local reproduction. Task: BUG-004. Priority: build/release gate requiring current confirmation.

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

Confirmed root cause: unknown. Fix: none performed. Resolution gate: actual failed checks rerun successfully with current-code evidence; packaging/runtime acceptance remains separate.

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
