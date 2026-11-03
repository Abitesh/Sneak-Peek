# Sneak-Peek — agent work log

This is the agent's per-substantive-request history. It is distinct from existing root `CHANGELOG.md` (release history): do not rename or overwrite the release log.

Append one stable WORK ID per substantive work request; update its entry during that request if useful. Include actual paths changed, related criteria/errors, checks, failures, remaining work and saved-document status. Log meaningful failed attempts. Do not copy the entire diff or create a recursive entry for updating this log. Pure conversation with no durable change/decision/error needs no entry.

## WORK-0001 — prepare repository-specific workpack

Date: 2026-11-01.

Owner request: create persistent agent rules, overview/tree, full roadmap, task/error/change tracking and cross-chat handoff; have the agent maintain records on future changes and errors.

Inputs: owner's current requirements; user-provided Changes-roadmap.rtf; targeted static inspection of public main commit 6837a7a5d1eaa2531c878f05bb4f873c23af3859; current VS Code instruction documentation; public CI API job/step status.

Related tasks: DOC-001, CHG-17, FEAT-001–010, BUG-001–004. Errors seeded: ERR-001–005. No reported error was fixed by this documentation delivery.

State: management files generated and document checks completed; installation/local reconciliation and application verification remain pending. DOC-001 remains Implemented, unverified.

Actual deliverable paths created in the pack:
- `AGENTS.md` — scoped agent instructions, automatic record-maintenance contract, worktree protections and completion rules.
- `ROADMAP.md` — Changes 1–22, original owner-source appendix, current Change 17 gate, final user requirements and acceptance criteria.
- `chatgpt-work/PROJECT_OVERVIEW.md` — verified snapshot facts, target-vs-current architecture, commands, onboarding, source links, privacy and license caveats.
- `chatgpt-work/PROJECT_TREE.txt` — real sanitized navigation snapshot with separate proposed management layout.
- `chatgpt-work/TASK_TRACKER.md` — active task, earlier unverified stages, future gates, acceptance evidence and new intake.
- `chatgpt-work/CHANGE_LOG.md` — this append-oriented work record.
- `chatgpt-work/ERROR_LOG.md` — owner-reported defects plus carefully bounded observed CI evidence.
- `chatgpt-work/HANDOFF.md` — current continuation state and new-session prompt.

Source review observations incorporated:
- Existing manual engine/coordinator/canonical infrastructure; meeting/live migrated vs global direct-generation path at inspected snapshot.
- Model allow-lists/credential-refresh plumbing already exists; diagnose rather than blindly replace.
- Engine tests need explicit discovery review; build:electron does not typecheck.
- Prior public root roadmap must be merged, not silently overwritten.
- Existing license requires attribution/notice and rebranding review. Blanket brand removal is blocked pending rights; no legal/auth/licensing mechanism changes.
- Supplied images are ChatGPT settings/project sources, not application UI evidence.

Verification actually performed for the deliverable:
- Read the supplied RTF and preserve the complete extracted text as an appendix.
- Verify eight expected paths, seven .md and one .txt, UTF-8 readability and no empty files.
- Verify Changes 1–22 and final FEAT requirements appear, CHG-17 remains current/unverified, all error records exist, and local Markdown links resolve within the bundle.
- Verify tree metadata identifies the inspected commit, records exclusions and does not claim to be the owner's live workspace.
- Build and inspect a ZIP containing exactly these eight relative paths; no app source, binaries, credentials, personal documents or dependency tree included.

Application checks NOT performed:
- No app dependency install/postinstall, compile/typecheck/test execution, app launch, audio session, LLM request, retrieval benchmark, packaging/signing/notarization, installed artifact test, Windows execution or CI rerun.
- No access to owner local Change 17 code/diff; no git commit/push/PR.

Remaining: owner-approved documentation merge, local branch/worktree reconciliation, instruction-discovery/write check and focused Change 17 continuation. Agent must revise installed records using actual local evidence before claiming progress.

## Entry template

## WORK-0002 — owner-authorized naming rebrand

Date / timezone: 2026-11-02, Asia/Kolkata.

Request: rename owned Natively branding to Sneak-Peek while preserving behavior and saved user state.

Links: FEAT-010 / F10-AC1–AC5; ERR-006 and ERR-007 are starting-commit test failures found during verification. A transient new STT provider-key type error and a new identity-test mismatch were corrected during this task.

Starting state: local project `/Users/abitesh/Documents/Sneak-Peek`, branch `main`, HEAD `417db9337120494bb484c82d36172a6bdf0673c6`, clean worktree. The workpack is a separate non-Git folder. Owner confirmed rebranding permission and final visible spelling. Owner explicitly instructed not to read the license; no license/notice content was inspected in this request.

Inventory: 2,577 tracked paths; 89 originally contained the old brand. Roughly 6,594 case-insensitive occurrences across 923 tracked text files outside LICENSE and selected binary formats at the start. A current line-by-line inventory of 3,336 remaining brand-prefix occurrences across 2,998 lines is saved in `chatgpt-work/REBRAND_REMAINING_REFERENCES.md`. Each line has a reason category, but the necessity of some legacy provider/state references remains unverified. Code-review-graph tools were not available; targeted searches were used.

Changes: renamed 455 TypeScript/JavaScript identifier occurrences across 99 existing project files; renamed 28 brand-bearing source/test/asset basenames, two directories and two historical documentation basenames, updating imports and path references. Updated visible UI strings, translations, browser extension manifest/docs, package name/lockfile, `build.productName`, icon references, signed-build metadata flag and focused source tests. Added `electron/preserveLegacyUserData.ts` before storage imports and `electron/__tests__/preserveLegacyUserData.test.mjs` so existing profile directories remain selected. Retained serialized STT/provider IDs, CSS-safe mappings, old external URLs, model routing names, native-module identifiers and persistent storage keys. Corrected changed provider-map keys back to `natively` in `src/components/ui/BrandMark.tsx`, `src/components/ui/aiProviderMarks.ts`, `src/components/ui/ChannelCard.tsx` and `electron/LLMHelper.ts`; corrected native-module root detection to recognize new package name. The complete unstaged path/status list is in `chatgpt-work/REBRAND_CHANGED_PATHS.txt` (524 status entries at record time). No commit or branch change.

Checks on macOS: baseline `npm run typecheck:electron` and `npm run typecheck:ts5` passed; both pass again after latest edits. `npm run build:electron` passed; direct Vite production build (`node node_modules/vite/bin/vite.js build`) passed. Isolated `node --test electron/__tests__/preserveLegacyUserData.test.mjs` passed 2/2. Four focused intelligence test files passed 67/67 after adding new-name identity and project-question recognition. Direct `planAnswer` probes confirmed both new and legacy wording. Focused engine/keychain/UI test batch passed 14/15; the one engine assertion fails identically in an isolated starting-commit build (ERR-006). Three source-based UI test failures also reproduce identically on starting commit (ERR-007). `git diff --check` passed. Browser extension `npm run typecheck` failed because `@types/chrome` is absent; no dependency installation was done. No app launch, installed upgrade, signed/packaged build, Windows check, paid provider request, or visual UI check was performed.

Status: Implemented, unverified. The existing icon artwork still shows an N. Current service/update URLs stay by owner decision, and the current LICENSE/notices were not inspected under the owner's explicit instruction. Remaining reference categories and unresolved individual lines are in the inventory. Workpack files saved during this request: `ROADMAP.md`, `chatgpt-work/TASK_TRACKER.md`, `chatgpt-work/ERROR_LOG.md`, `chatgpt-work/CHANGE_LOG.md`, `chatgpt-work/HANDOFF.md`, `chatgpt-work/PROJECT_TREE.txt`, `chatgpt-work/REBRAND_CHANGED_PATHS.txt`, `chatgpt-work/REBRAND_REMAINING_REFERENCES.md`. Next: review the remaining inventory, then run isolated app/extension/packaged checks when prerequisites are available. Do not claim FEAT-010 verified.

## WORK-0003 — investigate current Build Smoke failure

Date / timezone: 2026-11-02, Asia/Kolkata.

Request: inspect the GitHub failure email and run, record the error as unsolved, research the cause and a repair approach; do not change application code.

Links: BUG-004 / ERR-004. No roadmap scope or priority was changed.

Evidence inspected: Gmail notification `[Abitesh/Sneak-Peek] Run failed: Build Smoke - main (db7acff)` and GitHub Actions run `41488866035` for public `main` commit `db7acff2f09b9cdd83c59eb477a22d085a816172`; workflow, asset verifier, model downloader, affected test sources and relevant generation/routing code in the local project.

Findings: both macOS and Windows failed the source-mode packaged-asset verifier because Smart Turn ONNX is required by `scripts/verify-packaged-local-assets.mjs` but absent from the public commit. The committed directory has only the manifest; the binary is ignored locally. `scripts/download-models.js` catches a Smart Turn download failure as optional, so a clean CI installation can continue and then fail the required verifier. The jobs also fail 17 intelligence tests. These remain unresolved and require a separate scoped repair; no test gate was bypassed.

Actual changed files: `chatgpt-work/ERROR_LOG.md`, `chatgpt-work/TASK_TRACKER.md`, `chatgpt-work/CHANGE_LOG.md`, `chatgpt-work/HANDOFF.md` only. No application source, workflow, dependency, GitHub setting, commit or push changed.

Checks actually run: read-only Git status/HEAD/tree inspection; local model-file inventory; targeted source searches; inspection of CI job/step logs. A prior local `npm run verify:packaged-local-assets` passed only because the ignored Smart Turn binary exists in this local workspace; that is not a clean-CI success. Intelligence-test output showed 17 failures and was used as diagnostic evidence, not as a passing verification.

Status: investigation complete; error remains unresolved. Next: obtain owner approval for a narrowly scoped repair and choose the supported asset-distribution policy before edits.

## WORK-0004 — align Smart Turn asset gate with optional runtime behavior

Date / timezone: 2026-11-02, Asia/Kolkata.

Request: implement the approved scoped repair for the confirmed Build Smoke asset failure.

Links: BUG-004 / ERR-004. Protected boundary: no intelligence-test, provider, packaging, credential, or application-flow rewrite.

Actual application path changed: `/Users/abitesh/Documents/Sneak-Peek/scripts/verify-packaged-local-assets.mjs` — removed Smart Turn manifest/ONNX from fatal required assets and added source/package optional warnings. Core local fallback assets remain fatal requirements.

Checks: `npm run verify:packaged-local-assets` passed locally; `node --test scripts/__tests__/download-models.test.mjs` passed 9/9; `git diff --check` passed. Clean CI rerun and Windows execution were not performed. The 17 intelligence-test failures from run `41488866035` remain open.

Status: Implemented, unverified. No commit, push, workflow dispatch, dependency install, or application runtime change was performed.

## WORK-0005 — verify asset fix and define change-completion gate

Date / timezone: 2026-11-02, Asia/Kolkata.

Request: verify whether the reported smoke error is gone, update its records, and add the owner's rule that each roadmap change must be verified and explicitly declared complete/safe before proceeding.

Actual paths changed: `scripts/verify-packaged-local-assets.mjs` remains the asset fix from WORK-0004; `AGENTS.md` and `chatgpt-work/TASK_TRACKER.md` now require relevant verification plus an explicit safe-to-advance decision. `chatgpt-work/ERROR_LOG.md` now states ERR-004 remains unresolved because the 17 intelligence-test failures and clean CI rerun are pending; tracker BUG-004 remains In progress.

Checks: re-read local instructions, workflow, current diff/status and project test scripts. `npm run verify:packaged-local-assets` passed on macOS; `node --test scripts/__tests__/download-models.test.mjs` passed 9/9; project `git diff --check` flagged two pre-existing trailing spaces in the independently modified ROADMAP.md, while the asset-verifier patch itself has clean whitespace. The full `npm run test:intelligence` remains unverified against this change; prior CI evidence lists 17 failures. No GitHub rerun or Windows execution performed.

Status: asset-gate change is locally verified for its focused source-mode check, but BUG-004 is not complete and it is not yet safe to advance to the roadmap. Next: repair/triage the 17 intelligence failures and obtain a clean Build Smoke run on macOS and Windows.

## WORK-0006 — reconcile roadmap and investigate latest smoke failure

Date / timezone: 2026-11-02, Asia/Kolkata. Owner requested a Changes 1–17 assessment recorded in the workpack, then diagnosis and repair of the latest failed smoke run. Local project `main` started clean at `7e07d99adb16d9988ca9050b247caebc7c8be99e`. Graph tools were unavailable; used targeted source searches. Screenshots could not be read from their temporary paths; inspected actual GitHub run 41495334540 logs instead.

Task/error: CHG-01–17, BUG-004 / ERR-008. Static reconciliation and remaining criteria are recorded in TASK_TRACKER; complete runtime evidence is not established. Change 18 remains gated. The latest CI confirms the asset check passed, but Electron and intelligence test steps still fail.

Application edits: `electron/llm/transcriptEntityExtractor.ts` preserves hyphenated names and recognizes an explicit Sneak-Peek invite; `electron/llm/answerPlannerPatterns.ts` recognizes specific exact-source requests and the product's source-availability question. An experimental safety-classifier edit was reversed after verification did not support it. Workpack edits: `chatgpt-work/TASK_TRACKER.md`, `chatgpt-work/ERROR_LOG.md`, `chatgpt-work/CHANGE_LOG.md`, `chatgpt-work/HANDOFF.md`.

Checks on local macOS: `npm run build:electron` and `npm run typecheck:electron` passed. Focused entity/follow-up/privacy batch passed 62/62. Focused routing batch passed 108/110; two identity wording assertions failed. `npm run test:intelligence` after entity fix and before final routing change failed 17, passed 1,926, with nine todo; output `/private/tmp/sneak-peek-work0006-intelligence.log`. Explicit `node --test electron/intelligence/engine/__tests__/*.test.mjs` failed 12/74; output `/private/tmp/sneak-peek-work0006-engine.log`. Full Electron suite, clean Windows/macOS CI and manual app behavior were not verified. No commit or push.

Status: In progress; the reported failure and roadmap acceptance remain unresolved. Next: analyze remaining failures against active contracts, repair in scoped increments, then run both smoke jobs and required manual checks.

```markdown
## WORK-0007 — diagnose local startup and provider failures

2026-11-03. Owner asked to defer Build Smoke and restore local app/provider functionality. Linked BUG-005, ERR-009, ERR-001; ERR-004/ERR-008 remain open. Inspected current clean code checkout at `382e9becd9f53994ecd5248d5dab794f38d2794d`, package scripts, Hindsight launcher/config/server paths, short debug log, supplied long startup history, prior RAG roadmap headings, and one screenshot from the supplied chat ZIP. The long history shows Hindsight 404 on an older retired model, repeated provider 403, and a missing-key startup; current Hindsight default is `gemini-3.1-flash-lite`, so the older 404 does not establish a current code defect. `npm run typecheck:electron` passed on macOS. No `npm start`, live provider request, model download, CI run, or application code edit was performed. Current desktop chat failure remains unproven and unresolved. Files changed: `chatgpt-work/ERROR_LOG.md`, `chatgpt-work/TASK_TRACKER.md`, `chatgpt-work/CHANGE_LOG.md`, `chatgpt-work/HANDOFF.md`. Next: collect a sanitized current desktop request/status trace and verify a selected provider in an isolated test session.

## WORK-0008 — repair current AI provider connection/configuration defects

Date / timezone: 2026-11-03, Asia/Kolkata.

Request: inspect the owner's current source ZIPs, external reference projects and app screenshots, find current provider failures, implement the code changes, follow AGENTS.md tracking requirements and deliver all changed/new files in one ZIP for the owner to apply through VS Code/Copilot.

Task / errors: BUG-001 / FEAT-005; existing ERR-001 and ERR-009; new ERR-010 NVIDIA probe-id mismatch, ERR-011 LiteLLM malformed/credential-bearing Base URL handling, ERR-012 retired Claude operational fallbacks, ERR-013 stale provider source-inspection tests. CHG-17/RAG, audio/STT capture, packaging/signing and unrelated UI were protected and not modified.

Starting evidence boundary: reconstructed current source from the owner-supplied ZIPs (~2,526 project files) plus four external reference projects and 37 screenshots. The upload contains no `.git` directory and no `node_modules`, so AGENTS read-only Git checks and normal dependency-backed typecheck/build could not be run against this artifact. The uploaded source is newer than the older public/rebrand snapshots in several provider-state paths and is treated as authoritative. No current debug/Hindsight runtime log file was present in the supplied ZIP inventories; only test fixtures with debug/error names were found. Historical sanitized Hindsight evidence remains in ERR-009.

Implementation: `electron/ipcHandlers.ts` now strips the app-only `nvidia_nim/` prefix only at NVIDIA's outbound probe boundary, matches preferred NVIDIA candidates using bare ids, tracks the failed candidate for provider-health errors, recognizes more model-gone messages, validates/canonicalizes LiteLLM URLs before save/discovery/test and logs only proxy origin, and uses Sonnet 4.6 for Claude fallback/probe preference. `src/components/settings/AIProvidersSettings.tsx` blocks malformed LiteLLM Base URL/cURL input before IPC. `electron/LLMHelper.ts`, `electron/llm/ProviderRouter.ts`, `electron/services/ModelVersionManager.ts` and `electron/services/screen/VisionProviderRegistry.ts` align live Claude defaults with the already-supported `claude-sonnet-4-6`; `CredentialsManager.ts` maps the retired persisted default/preference at read time without destructive rewrite. `ProviderErrorNormalizer.ts` now classifies against provider response details, distinguishes forbidden access and surfaces useful HTTP-400 provider detail. Provider source-inspection tests were repaired to be rebrand/formatting tolerant; new guards pin NVIDIA normalization, LiteLLM validation/log redaction and current Claude defaults.

Reference-project review: the requested provider/client/session files from MinhOmega/interview-assistant, ericwang915/interview-copilot, naxhq/NexQ and npmsami/AgentSami were used only as architectural references. No external RAG/audio/storage implementation was copied. The useful common pattern was keeping provider-specific id/config normalization at the provider boundary and refreshing clients when configuration changes.

Checks actually run: repository-wide `node --check` passed for 1,402 JS/MJS/CJS files. Focused provider/Hindsight source tests passed 65/65 after the fixes. `ProviderErrorNormalizer.ts` was compiled standalone with the available global TypeScript compiler and three runtime probes passed (Claude 400 response detail, 403 permission classification, NVIDIA model attribution). Changed TS/TSX files had zero TS1xxx syntax diagnostics under a no-resolve parse; unresolved import/type diagnostics remain expected because dependencies are absent. No live provider request, desktop launch, standard project typecheck/build, package, Windows test or CI run was performed.

Status: fixes implemented, unverified in the running application. BUG-001/FEAT-005 remain open. The owner must rotate the Gemini credential visible in the supplied LiteLLM screenshot, remove/re-enter the malformed LiteLLM config with the actual proxy URL, apply the WORK-0008 ZIP, run the normal project typechecks/build and then retest Claude, NVIDIA NIM, LiteLLM and model-picker parity. No commit, push, dependency install or user-state deletion was performed.

## WORK-XXXX — brief task title
Date / timezone:
Request summary (sanitized):
Task / criteria / ERR links:
Starting branch / commit / relevant existing edits:
Scope / approval / protected boundaries:
Implementation status:
Actual changed files:
- path — why changed
Decision and architecture changes:
Checks actually run (environment, exact command/steps, result):
Baseline failures vs introduced failures:
Checks skipped and why:
Criteria verified vs still unverified:
Tracking files actually saved / failed writes:
Uncommitted remaining work / next action:
```

Never fill the template with invented results, future commit hashes or “all tests pass” without execution evidence. Keep personal data out of request summaries and logs.

## WORK-0009 — fix false provider saves and activate Hindsight Router

Date / timezone: 2026-11-03, Asia/Kolkata.

Owner request: after applying WORK-0008 replacement files, investigate the new Hindsight startup history, GitHub Build Smoke transcript and the Settings symptom where a provider key displayed Saved but did not persist; prioritize getting the app/providers operational. Owner asked whether to apply the prior patch: no — the WORK-0008 patch is an alternative representation of files already replaced and must not be applied again.

Links: BUG-001 / ERR-014, BUG-005 / ERR-009 / ERR-015, BUG-004 / ERR-004 / ERR-008. Roadmap scope unchanged.

Evidence and confirmed causes: cloud-provider setters discarded `saveCredentials()`'s persistence boolean and the Settings IPC paths returned success anyway, allowing a false Saved state. Hindsight launcher generated a Router JSON but never selected provider `litellmrouter`; its deployments were also named `hindsight-llm` although current Hindsight routes against logical model `default`. The supplied startup history is consistent with this mismatch: it prints a Gemini 3.x Router chain then verifies a direct Gemini baseline; later direct Gemini calls return 403 project access denied while `/health` still becomes ready. The supplied Build Smoke #6 transcript continues after the BGE reranker download JSON error, then the Electron suite reports 237 failures / 15 cancelled / 96 skipped, so CI is a multi-family defect set rather than one package-download failure.

Actual application paths changed: `electron/services/CredentialsManager.ts`, `electron/ipcHandlers.ts`, `src/components/settings/AIProvidersSettings.tsx`, `scripts/hindsight-start.sh`, `scripts/hindsight-llm-config.mjs`, `scripts/hindsight-dev-server.py`. Test paths changed/added: `scripts/hindsight-llm-config.test.mjs`, `scripts/__tests__/hindsight-default-model.test.mjs`, `electron/services/__tests__/CredentialPersistenceBehavior.test.mjs`, `electron/services/__tests__/CredentialDegradedStoreGuard2026_08_05.test.mjs`, new `electron/services/__tests__/CloudCredentialSaveAck2026_11_03.test.mjs`. Records changed: `chatgpt-work/CHANGE_LOG.md`, `ERROR_LOG.md`, `TASK_TRACKER.md`, `HANDOFF.md`. No audio capture, STT implementation, canonical RAG, packaging/signing, licensing/auth bypass or dependency version was changed.

Checks executed: focused source tests 66/66 passing across three targeted runs; Bash syntax, Python bytecode compile and changed JS/MJS syntax checks pass. Full compiled credential behavior tests cannot run in this source-only reconstruction because `dist-electron`/installed dependencies are absent. No real API key, live paid request, Hindsight retain/recall, app launch, full Electron suite, CI rerun, commit or push occurred.

Status: ERR-014 and ERR-015 are Fix implemented, unverified. BUG-001/BUG-005 remain In progress until save→restart→readback and live Hindsight/provider checks succeed. BUG-004 remains open; one stale smoke-test locator was repaired, but the attached 237-failure run is not claimed resolved.

## WORK-0010 — repair current intelligence test infrastructure and scoped regressions

Date: 2026-11-03, Asia/Kolkata. Owner requested continuation of CHG-01–17 and fixes for the supplied issue analysis/terminal output. Local repo `main` was clean at `948ec1cd` at the start of this follow-up. The supplied analysis was treated as hypotheses and checked against current source and tests. Code-review graph tools were unavailable; targeted source and caller inspection was used.

Links: CHG-14/CHG-16/CHG-17, ERR-008 and ERR-016. Application edits: `src/components/settings/AIProvidersSettings.tsx` (typed credential-save result); `package.json` (`test:intelligence` now runs under Electron ABI with isolated temp user data); `electron/context-intelligence/retrieval/mode-retrieval-port.ts` (mode-attached candidate résumé takes candidate authority when both source types are allowed); `electron/intelligence/ConversationMemoryService.ts` (incomplete Q/A pairs no longer create synthetic prior answers). Test edits: `electron/intelligence/__tests__/ConversationMemoryWiring.test.mjs` (canonical bounds, isolation and empty-answer assertion), `SettingIgnoredFlags.test.mjs` (current singleton), and `SneakPeekIntelligenceBehavioralEvaluation.test.mjs` (completed fallback state). Tracking edits: `chatgpt-work/ERROR_LOG.md`, `TASK_TRACKER.md`, `CHANGE_LOG.md`, `HANDOFF.md`. No commit or push.

Checks: `npm run typecheck:ts5`, `npm run typecheck:electron`, and `npm run build:electron` pass on macOS. Deep source-authority suite passes 39/39; memory wiring passes 21/21; focused settings/behavioral tests pass 25/25. The stale manual `buildV3Prompt` source-layout assertion was replaced with a check of the current engine request path; focused coding tests pass 5/5. Four profile-policy test files were updated for the Change 16 source model while retaining no-fabrication checks; focused batch passes 91/91. These additional test paths are `electron/context-intelligence/__tests__/CodingTaskFromRouter2026_08_11.test.mjs`, `ModeIdentityIntegrity2026_08_09.test.mjs`, `ProfileRetrievalPort2026_07_31.test.mjs`, `OpenKnowledgePersonalAdvice2026_08_06.test.mjs`, and `PromptComposition.test.mjs`.

Latest `npm run test:intelligence` under Electron runs 1,954 tests: 1,941 pass, four fail, nine todo, with no native SQLite ABI mismatch observed. Log: `/tmp/sneak-peek-work0010-intelligence-latest.log`. All four failures are EvidenceResolver subsection/entity association cases. No claims of full suite, Windows, manual app, paid provider or CHG-01–17 completion. A broad relaxation of entity checks was deliberately avoided because it could admit another subject's fact. Next: design a scoped association rule and negative cross-entity tests, then perform relevant runtime checks before any change is marked Verified.

## WORK-0011 — intelligence and independent memory path repair

2026-11-03, Asia/Kolkata. In progress. Owner supplied two explicit task documents and a Hindsight runtime audit. Starting `main` HEAD `1c68d27aeca9dd58211e4d34f9d6b064b623340b` was clean: the prompt's previously staged WORK-0010 had already been committed by the owner. No reset, unstage, commit, push, dependency install, credential access or live paid request. Workpack records remain in this separate folder because `chatgpt-work` is absent from the application checkout. Graph tools unavailable; targeted reads/searches used. One attempted record patch failed to match the log heading; tracker/log were reread and patched separately.

Linked CHG-03/05/07/12/14/16/17, BUG-005, ERR-006/017–020. EvidenceResolver now explicitly associates a value subsection only through a unique matching section in the authorized document's entity-heading path, with property/term/value checks and conflict rejection. Four prior fixtures now include actual source headings rather than placeholder document content. Nine added cases cover competing entities, ambiguous rows, unrelated sections, wrong source, weak overlap, conflicts and direct evidence. Focused resolver 23/23 passes.

Permanent intelligence script now includes engine tests. Discovered engine failures included wrong compiled imports, old rebrand symbols, a class-identity check invalidated by per-entry bundling, and missing manual generation statuses. Imports/source checks were migrated; the coordinator port is recognized structurally; manual completion/cancellation/failure is recorded and post-visible-token exceptions cannot fall back into a second answer. Failed/cancelled past turns are filtered from engine context. Explicit own-résumé and employment-history questions now select profile intent. Engine suite including deterministic Hindsight-independent continuity/profile tests passes 86/86.

Hindsight installed system package: 0.9.2, Python `/usr/local/bin/python3`; embedded `pg0` is supported and is the HindsightServer constructor default. Current library health checks SELECT 1. No current launcher hardcodes port 5433; historical audit's failing worker ran from an old project environment no longer available for inspection, so the historical endpoint source remains unproven. Launcher now explicitly defaults its child to pg0, preserves explicit Hindsight DB configuration, removes generic PostgreSQL child variables, prefers current-repo venv and rejects incidental foreign venv PATH candidates. Router config forces litellmrouter/default; retired direct model overrides map at read time. Manager distinguishes HTTP/database/memory readiness; live memory verification is an explicit diagnostic. Added isolated UUID-bank probe and opt-in CLI. No live memory verification executed, per owner prohibition on paid provider requests.

Checks so far: provider/config source+behavior batch 20/20; Hindsight-focused batch 78 pass, one intentionally live-only skip; engine 86/86; normal typechecks and broader suites are running. Exact edited paths and final results will be recorded before completion. CHG-14/16/17 remain In progress; not safe to advance CHG-18.

Continuation: Added a real isolated profile-ingestion-to-engine fixture (`ProfileIngestionIndependence.test.mjs`) and two more section-association negative cases. Migrated only four tests whose old Knowledge node-embedding APIs were proven retired into `.historical.mjs`, retaining their contents. Repaired current singleton fixtures and local-runtime mocks in eight service/LLM tests, bounded the semaphore test by the actual concurrency setting, and isolated the absent-native-module license test premise. A temporary trace of the routing cascade identified a second Ollama-model fallback; the trace instrumentation was removed after the fixture was corrected. The production license repair rejects replacement of an unverifiable perpetual license and treats providerless records as legacy, without bypassing entitlements. The truncated-answer test locators were updated to the current V3 branch, preserving all its guards.

Actual application paths edited: `electron/context-intelligence/question/question-resolver.ts`, `electron/intelligence/context-os/{EvidenceResolver.ts,sectionEntityAssociation.ts}`, `electron/intelligence/engine/{SneakPeekIntelligenceEngine.ts,TranscriptContext.ts}`, `electron/ipcHandlers.ts`, `electron/preload.ts`, `electron/services/HindsightManager.ts`, `electron/intelligence/memory/HindsightMemoryProbe.ts`, `premium/electron/services/LicenseManager.ts`, `scripts/{hindsight-dev-server.py,hindsight-start.sh,verify-hindsight-memory.mjs}`, `src/types/electron.d.ts`, `package.json`. Test paths edited/added: `electron/intelligence/__tests__/EvidenceResolver.test.mjs`, `electron/intelligence/engine/__tests__/{Change13PrimaryManualPath,Change15MeetingLiveIntelligence,Change16ManualCancellation,GenerationController,GenerationLifecycle,PromptAssembler,ProviderGenerationRouting,MemoryIndependence,ProfileIngestionIndependence}.test.mjs`, `electron/llm/__tests__/{RoutingFallbackCascade2026_08_31,TruncatedAnswerNotStored2026_08_12}.test.mjs`, `electron/services/__tests__/{CodexVisionPayload2026_08_05,DisabledProviderRouting2026_08_01,HindsightManager,HindsightReadiness,LicenseNativeModuleAbsent,OutboundBoundaryUniversality2026_08_01,ScreenUnderstandingModeEnforcement2026_08_01,SettingsDegradedStoreMutators2026_08_22,SingletonCrossBundleSweep2026_07_31}.test.mjs`, `scripts/__tests__/hindsight-runtime-config.test.mjs`, and four `electron/rag/__tests__/{CrossFeatureReindexConcurrency,KnowledgeDegradeToLocal,KnowledgeIngestSpaceMetadata,KnowledgeSpaceReembed}` files renamed from `.test.mjs` to `.historical.mjs`. Audit path: `scripts/audit/work0011-current-failures.md`. Tracking paths: `chatgpt-work/TASK_TRACKER.md`, `chatgpt-work/ERROR_LOG.md`, `chatgpt-work/HANDOFF.md`, and `chatgpt-work/PROJECT_TREE.txt`. This log does not recursively record its own update.

Final macOS checks: `npm run typecheck:electron`, `npm run typecheck:ts5`, `npm run build:electron` pass. `npm run test:intelligence`: 2,052 total, 2,043 pass, zero fail, nine TODO. `HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 npm test`: 8,892 total, 8,639 pass, 172 fail, zero cancelled, 81 skipped. The baseline was 8,910 total, 8,589 pass, 225 fail, 15 cancelled, 81 skipped. Focused truncated-answer 26/26; earlier focused Hindsight 78 pass/one live skip, provider/config 20/20, library 380 pass/one skip, scripts 97/97. Full-suite log `/tmp/sneak-peek-work0011-npm-test-final.log`; intelligence log `/tmp/sneak-peek-work0011-intelligence-final.log`. Live app/UI, Windows/CI, paid provider/Router fallback, actual Hindsight retain/recall and full-suite green were skipped/not achieved. No commit, push, install, key access, or live paid call. WORK-0011 remains Implemented, unverified; CHG-18 is gated.



## WORK-0012 — Apply personal vector and résumé/project routing repair

- **Request:** Apply the supplied combined patch against the clean working tree; preserve protected subsystems and CHG-17 canonical adapter migration; run Electron build and the focused command in `VERIFY.md`; do not commit or push.
- **Roadmap / task / errors:** CHG-17 (C17-AC6, C17-AC8, C17-AC9); TASK-0001; ERR-005 and ERR-006.
- **Paths changed:** `electron/rag/VectorStore.ts`, `electron/personalKnowledge/PersonalKnowledgeManager.ts`, `electron/context-intelligence/question/question-resolver.ts`, `electron/intelligence/engine/ContextPlanner.ts`, `electron/ipcHandlers.ts`, `electron/rag/__tests__/PersonalVectorUpsertRegression.test.mjs`, `electron/intelligence/engine/__tests__/ResumeProjectRoutingRegression.test.mjs`, `electron/intelligence/engine/__tests__/Change16ProjectMyFilesPersonalContext.test.mjs`, `chatgpt-work/TASK_TRACKER.md`, `chatgpt-work/ERROR_LOG.md`, `chatgpt-work/HANDOFF.md`.
- **Verification:** On macOS, `git status --short` was clean on `main` at `0a27794e`; bundle `git apply --check` passed and the patch applied. Final `npm run build:electron` passed. The exact prescribed system-Node test command returned 19 pass / 3 fail because better-sqlite3 ABI 148 cannot load under system Node ABI 127. The same four files under installed Electron 43 (ABI 148) passed 22/22, including native vector write, repair, and missing-source tests. Final `git diff --check` passed and review found no protected-path changes.
- **Unsuccessful attempts / skipped checks:** The exact system-Node command remains blocked on three native tests by the ABI mismatch; no dependency rebuild was done. Full intelligence suite, real-app smoke test, manual acceptance, and Windows run were skipped. The user database was not accessed. No commits or pushes.
- **Follow-up fix:** The failed profile-fallback test exposed that the planner's later `requiresProjectContext` rule overrode the selected fallback. `ContextPlanner` now skips that override only when the profile/personal fallback was selected. Updated the related permission-denial regression to reflect the approved fallback behavior while confirming project retrieval remains forbidden.
- **Diff-review follow-up:** Review found the transaction path could still silently update zero rows when native vec support is disabled. Added a pre-update row lookup and a focused regression test. The final Electron-runtime suite now passes 22/22.
- **Current next step:** Run the bundle's manual real-app acceptance with authorized sample data; Windows checks remain pending.
