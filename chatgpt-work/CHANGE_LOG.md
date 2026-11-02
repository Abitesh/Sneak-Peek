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

```markdown
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
