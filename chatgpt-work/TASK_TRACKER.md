# Sneak-Peek — authoritative task tracker

Updated: 2026-11-02. Maintained by the active coding agent; the owner supplies goals and approval, not manual bookkeeping.

## Current state

- **Active implementation focus:** FEAT-010 rebranding, explicitly authorized by owner on 2026-11-02. CHG-17 remains separately in progress by owner report.
- **Next immediate task:** Finish FEAT-010 inventory review and check an isolated app startup, browser extension build, profile migration and packaged display names before acceptance.
- Linked repository: https://github.com/Abitesh/Sneak-Peek. Public snapshot inspected: main @ `6837a7a5d1eaa2531c878f05bb4f873c23af3859`. This is NOT a claim about the owner's local HEAD.
- Previous stages: Not assessed; a Change 16 commit subject and existing tests are historical evidence, not verified completion.
- Verification during pack generation: documentation/source inspection only. No app build/test/install/runtime/model/latency execution.
- Authoritative scope: [ROADMAP.md](../ROADMAP.md). Active defects: [ERROR_LOG.md](ERROR_LOG.md). Work history: [CHANGE_LOG.md](CHANGE_LOG.md).

## Status rules

`Not assessed` = evidence not reconciled; `Planned` = approved/recorded pending work; `In progress` = active work; `Implemented, unverified` = edits exist but acceptance incomplete; `Verified` = all required evidence exists; `Blocked` = named prerequisite prevents progress.

Keep implementation status separate from individual acceptance checks. A checkbox is not a confidence vote. Never infer completion from commits, documents, screenshots of another app, generated code, or compile-only success. Link command, environment, actual outcome and timestamp. Reopen a checked criterion after a relevant regression.

## Execution board

| Task | Current status | Roadmap/error link | Next action / gate |
|---|---|---|---|
| DOC-001 | Implemented, unverified — downloadable pack only | All eight management files | Merge into actual repo with approval; preserve existing root roadmap and ongoing edits; verify instruction discovery. |
| CHG-17 | In progress — owner-reported | ROADMAP CHG-17 | Reconcile current branch/diff and inspect canonical retrieval boundary; do not overwrite work. |
| BUG-001 | Planned | ERR-001, FEAT-005 | Capture failing provider/model IDs and sanitized request/connection evidence. |
| BUG-002 | Planned | ERR-002, FEAT-008 | Reproduce personal-intelligence failure and trace permitted evidence from ingestion to visible answer. |
| BUG-003 | Planned | ERR-003 | Reproduce clean install/package/installed-app failure separately from intelligence migration. |
| BUG-004 | Implemented, unverified — asset gate repaired; intelligence failures remain | ERR-004 | Run clean macOS/Windows smoke; triage the remaining 17 intelligence-test failures separately. |
| QA-001 | Planned | CHG-14/17/21 | Verify engine test discovery; explicitly execute engine tests after prerequisites and approval. |
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
| FEAT-005 | Planned | ROADMAP FEAT-005 | Shares investigation with ERR-001; inspect existing discovery/allow-list/IPC refresh paths. |
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
