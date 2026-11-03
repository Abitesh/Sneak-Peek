# Sneak-Peek — authoritative task tracker

Updated: 2026-11-03. Maintained by the active coding agent; the owner supplies goals and approval, not manual bookkeeping.

## Current state

- **Active implementation focus:** WORK-0011, owner-authorized intelligence and Hindsight repairs on local `main` starting at `1c68d27a`. WORK-0010 is already committed; no staged changes existed when this run began.
- **Next immediate task:** Repair the remaining 172 active full Electron failures using the per-file audit, starting with current production behavior and preserving mixed active tests. WORK-0011 Electron/renderer typechecks and build pass; intelligence tests pass 2,043 with nine TODOs. Keep CHG-14/16/17 acceptance separate from passing tests; CHG-18 remains gated.
- Linked repository: https://github.com/Abitesh/Sneak-Peek. Public snapshot inspected: main @ `6837a7a5d1eaa2531c878f05bb4f873c23af3859`. This is NOT a claim about the owner's local HEAD.
- Previous stages: Not assessed; a Change 16 commit subject and existing tests are historical evidence, not verified completion.
- Verification during pack generation: documentation/source inspection only. No app build/test/install/runtime/model/latency execution.
- Authoritative scope: [ROADMAP.md](../ROADMAP.md). Active defects: [ERROR_LOG.md](ERROR_LOG.md). Work history: [CHANGE_LOG.md](CHANGE_LOG.md).

## Status rules

`Not assessed` = evidence not reconciled; `Planned` = approved/recorded pending work; `In progress` = active work; `Implemented, unverified` = edits exist but acceptance incomplete; `Verified` = all required evidence exists; `Blocked` = named prerequisite prevents progress.

Keep implementation status separate from individual acceptance checks. A checkbox is not a confidence vote. Never infer completion from commits, documents, screenshots of another app, generated code, or compile-only success. Link command, environment, actual outcome and timestamp. Reopen a checked criterion after a relevant regression.

After each change, complete its relevant checks, record the commands/results, and explicitly report whether the change is complete and safe to move to the next roadmap change. Keep it open and state what remains whenever acceptance evidence is incomplete.

## Execution board

| Task | Current status | Roadmap/error link | Next action / gate |
|---|---|---|---|
| DOC-001 | Implemented, unverified — downloadable pack only | All eight management files | Merge into actual repo with approval; preserve existing root roadmap and ongoing edits; verify instruction discovery. |
| CHG-17 | In progress — owner-reported | ROADMAP CHG-17 | Reconcile current branch/diff and inspect canonical retrieval boundary; do not overwrite work. |
| CHG-14 / WORK-0010–0011 | In progress — intelligence suite green, acceptance unverified | ROADMAP CHG-14; ERR-016–020; ERR-008 | Fresh `test:intelligence`: 2,043 pass, 0 fail, 9 todo; engine tests included. Full Electron suite still has 172 failures; manual/runtime and Windows checks pending. CHG-01–17 are not Verified; CHG-18 stays gated. |
| BUG-001 | In progress — provider fixes + durable-save acknowledgement implemented; live verification pending | ERR-001, ERR-010–014, FEAT-005 / WORK-0008/0009 | Apply WORK-0009 after WORK-0008, save/restart/recheck a provider key, then retest Claude/NVIDIA/LiteLLM and model availability. |
| BUG-002 | Planned | ERR-002, FEAT-008 | Reproduce personal-intelligence failure and trace permitted evidence from ingestion to visible answer. |
| BUG-003 | Planned | ERR-003 | Reproduce clean install/package/installed-app failure separately from intelligence migration. |
| BUG-004 | In progress — local full Electron run still failing | ERR-004 / ERR-008 / WORK-0011 | Fresh macOS local `npm test`: 8,639 pass, 172 fail, 0 cancelled, 81 skipped. See `scripts/audit/work0011-current-failures.md`; fix active failures and rerun CI after owner commit. |
| BUG-005 | Implemented, unverified — Router/readiness repair and isolated diagnostic | ERR-009 / ERR-015/018 / WORK-0011 | Runtime-config tests and Hindsight focused tests pass; actual server unavailable on localhost and paid live diagnostic intentionally not run. Verify Router, DB, retain/recall with permitted isolated bank. |
| QA-001 | Planned | CHG-14/17/21 | Verify engine test discovery; explicitly execute engine tests after prerequisites and approval. |

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
| C17-AC1 | No | Focused integration/tests/typechecks/manual checks not run. |
| C17-AC2 | No | Runtime procedure, protected diff review and record reconciliation pending. |
| C17-AC3 | No | Local active request trace needed. |
| C17-AC4 | No | Canonical retrieval vs answer-strategy ownership needs local verification. |
| C17-AC5 | No | ID/revision/provenance/ranking parity checks needed. |
| C17-AC6 | No | Project/personal/general and denied/empty-source cases needed. |
| C17-AC7 | No | Duplicate retrieval and stale-request cancellation tests needed. |
| C17-AC8 | No | Owner's ongoing work/storage protections not yet reconciled. |
| C17-AC9 | No | Explicit engine/canonical runs plus typecheck/build evidence needed. |
| C17-AC10 | No | Manual behavior checks not executed. |
| C17-AC11 | No | Remaining active direct-generation callers need complete inventory. |

Do not mark Change 17 Verified until all applicable criteria have evidence. An intentionally deferred criterion requires explicit owner agreement and must not be silently checked.

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
