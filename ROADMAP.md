# Sneak-Peek — authoritative roadmap

Updated: 2026-11-01. Owner-defined scope plus proposed acceptance criteria. Edit desired outcomes here; agents maintain execution in [TASK_TRACKER.md](chatgpt-work/TASK_TRACKER.md).

## Current focus and truth boundary

**Current work: CHG-17, owner-reported in progress.** The linked repository is [Abitesh/Sneak-Peek](https://github.com/Abitesh/Sneak-Peek). The inspected public main commit is `6837a7a5d1eaa2531c878f05bb4f873c23af3859` with a Change 16 subject. The owner's ongoing local changes were not available. Changes 1–16 have historical implementation indicators but are **Not assessed**, not automatically complete. No application checks were run for this documentation pack.

Source: owner's current message and `Changes-roadmap.rtf`, supplied 2026-11-01. The complete supplied 22-change roadmap is retained as an owner-source appendix below. It is a plan, not a record of verified behavior. Historical internal names in that appendix are preserved for traceability, not instructions to bypass the rebranding/legal gate.

## Scope and ownership

- This root file is the single active roadmap. Do not create a competing roadmap inside chatgpt-work.
- Keep Changes 1–22 IDs and intended dependency order. New feature/error work receives separate IDs and explicit priority decisions.
- The prior root roadmap contains unrelated historical ideas. Preserve it through Git history or a deliberate approved documentation merge; do not delete its contents silently. Its legacy themes are diagrams, personas, community/token access and other expansion ideas. They are not approved ahead of the current repair work.
- No blanket repository rewrite, no dependency changes merely to modernize, and no unverified “complete” reports.
- Preserve the current uncommitted chat/RAG repair. A public snapshot cannot replace the local worktree.
- Keep source authority, privacy, first-token provider commitment, STOP/cancellation, and request supersession intact.
- Audio/STT/native capture and packaging/signing are protected during intelligence migration; their explicit defect/feature tasks do not authorize unrelated migration edits.
- Preserve required copyright/license/attribution and data compatibility. Blanket removal of Natively is gated, not pre-approved.
- Use the app only for authorized/consented recording and permitted assistance. Do not add covert-assessment bypass requirements.

## Workstream order

1. DOC-001: safely merge these records and reconcile the actual local branch/diff.
2. Continue CHG-17 using the smallest verified canonical-RAG integration step. Validate relevant existing protections before advancing.
3. Capture ERR-001–ERR-004 evidence now. A reproducible blocker can become an explicitly approved focused repair; do not interleave an uncontrolled packaging/audio rewrite.
4. Advance CHG-18–22 only after their gates. CHG-23 is a deferred user-approved enhancement after CHG-22; assess earlier migration evidence where needed and do not repeat prior changes blindly.
5. Schedule final user-facing FEAT items by dependency and owner priority. Preserve every final requirement even if outside Change 17.

## Changes 1–23 index

Statuses in this table are the initial 2026-11-01 baseline only; TASK_TRACKER.md owns live execution status.

| ID | Scope | Initial status | Gate |
|---|---|---|---|
| CHG-01 | Current architecture baseline and safety lock | Not assessed (historical stage) | None; inspect historical Change 1 artifact rather than restarting blindly. |
| CHG-02 | Central intelligence contract | Not assessed (historical stage) | CHG-01 |
| CHG-03 | Structured conversation state | Not assessed (historical stage) | CHG-02 |
| CHG-04 | Recent transcript window | Not assessed (historical stage) | CHG-03 |
| CHG-05 | Turn understanding | Not assessed (historical stage) | CHG-03, CHG-04 |
| CHG-06 | Context planner | Not assessed (historical stage) | CHG-05 |
| CHG-07 | Retrieval coordinator | Not assessed (historical stage) | CHG-06 |
| CHG-08 | Scoped evidence pack | Not assessed (historical stage) | CHG-07 |
| CHG-09 | Single final prompt assembler | Not assessed (historical stage) | CHG-08; response-plan integration completes with CHG-10 |
| CHG-10 | Response planning and answer shape | Not assessed (historical stage) | CHG-05, CHG-09 |
| CHG-11 | Pure provider generation boundary | Not assessed (historical stage) | CHG-09, CHG-10 |
| CHG-12 | Unified generation lifecycle | Not assessed (historical stage) | CHG-11 |
| CHG-13 | Primary manual-chat integration | Not assessed (historical stage) | CHG-12 |
| CHG-14 | Behavioral evaluation safety net | Not assessed (historical stage) | CHG-13 |
| CHG-15 | Meeting/live intelligence migration | Not assessed (historical stage) | CHG-13, CHG-14 |
| CHG-16 | Project/My Files/personal sources | Not assessed (historical stage) | CHG-14, CHG-15 |
| CHG-17 | Canonical RAG under the intelligence engine | In progress (owner-reported; local reconciliation pending) | Reconcile actual CHG-01–16 state; preserve uncommitted Change 17/chat-RAG repair. |
| CHG-18 | Legacy meeting/global RAG answer paths | Planned | CHG-17 verified; preserve CHG-15 behavior. |
| CHG-19 | Duplicated responsibility cleanup | Planned | CHG-18 and active behavioral protection. |
| CHG-20 | One primary intelligence pipeline | Planned | CHG-19 |
| CHG-21 | Final intelligence quality/regression pass | Planned | CHG-20; packaging work requires separate authorization. |
| CHG-22 | Final verified-dead architecture deletion | Planned | CHG-01–21 verified for affected responsibilities. |
| CHG-23 | Dedicated Coding, CS Fundamentals, and Resume & Projects modes | Planned — owner-approved future scope | CHG-22 verified; coordinate FEAT-003/004, preserve existing Technical Interview. |

## Change acceptance contracts

All criteria below start unverified; completion evidence and live status belong in the task tracker. These bullets define scope, not a duplicate completion checklist. The source appendix provides the original file candidates; inspect actual current files before editing.

### CHG-01 — Current architecture baseline and safety lock

Goal: Map every answer-producing surface and alternate path before further deletion.

Scope: Inventory UI → preload → IPC → engine → question/context → retrieval/evidence → prompt/provider → stream. Identify manual, live, follow-up, meeting, global, project, personal, coding, screen and automatic paths.

Gate: None; inspect historical Change 1 artifact rather than restarting blindly.

- C01-AC1: Runtime map and caller evidence exist for all surfaces; no code removal in baseline.
- C01-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-02 — Central intelligence contract

Goal: Keep one explicit request/result boundary for the engine.

Scope: Represent request/session IDs, turn and conversation, transcript/screen/mode/profile context, provider preferences, permissions and cancellation; represent plan, evidence, prompt, generation and diagnostics.

Gate: CHG-01

- C02-AC1: Contract tests use fake providers; request/result compile; cancellation is represented.
- C02-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-03 — Structured conversation state

Goal: Use canonical structured turns rather than one giant transcript string.

Scope: Preserve role, speaker, text, timestamps, turn IDs, finalization/source metadata and session isolation; map overlapping memory services.

Gate: CHG-02

- C03-AC1: Append/update/window/reset tests, latest-turn identity, follow-ups and no cross-session leakage.
- C03-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-04 — Recent transcript window

Goal: Select bounded recent context separately from long-term retrieval.

Scope: Consume transcript state, not capture internals; preserve the current question while bounding older turns.

Gate: CHG-03

- C04-AC1: 100-turn test selects the configured window; current question retained; long-session manual check documented.
- C04-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-05 — Turn understanding

Goal: Resolve question, intent, follow-up, subject and required context signals.

Scope: Cover general/project/personal/document/screen/coding/refinement requests with and without question marks; migrate duplicates only after equivalence.

Gate: CHG-03, CHG-04

- C05-AC1: Behavior tests include Redis, project Redis, tell me about project, and why, explain again, make it longer, code, personal DB use, screenshot/error, and contextual statements.
- C05-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-06 — Context planner

Goal: Decide which information is necessary, allowed and forbidden.

Scope: Make source selection explicit for conversation, transcript, project, personal, files, modes, screen and profile.

Gate: CHG-05

- C06-AC1: General Python does not retrieve private project data; project Redis retrieves project context; prior conversation, screen and profile cases select only authorized sources.
- C06-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-07 — Retrieval coordinator

Goal: Execute a context plan without independent answer-strategy decisions.

Scope: Adapt existing retrieval ports; avoid duplicate execution for concrete project source plus generic RAG flag.

Gate: CHG-06

- C07-AC1: Trace planned vs executed sources and intended call count; no unintended parallel retrieval chain for one source.
- C07-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-08 — Scoped evidence pack

Goal: Unify retrieved facts with provenance and authority.

Scope: Preserve source IDs, revision/chunk references, text, relevance, scope, citations, selection reason and applicable confidence/authority.

Gate: CHG-07

- C08-AC1: Mixed evidence test keeps project, personal, meeting and document sources distinct; no scope relabeling/leakage.
- C08-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-09 — Single final prompt assembler

Goal: Assemble only planned question, response policy, context and evidence.

Scope: Transfer final prompt ownership carefully; remove duplicated injection only after callers migrate.

Gate: CHG-08; response-plan integration completes with CHG-10

- C09-AC1: SingleFinalPromptInvariant: one final assembled prompt, current question present, no duplicated/unrelated evidence or internal routing markers.
- C09-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-10 — Response planning and answer shape

Goal: Separate knowledge selection from output style.

Scope: Plan direct, coding, troubleshooting, project-grounded, spoken/first-person, duration and detail requirements.

Gate: CHG-05, CHG-09

- C10-AC1: General Redis differs from project Redis; project story uses supported first-person facts; requested duration/code shape honored.
- C10-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-11 — Pure provider generation boundary

Goal: Keep provider HTTP/model details below intelligence decisions.

Scope: Centralize provider choice, first-token timing, error/fallback behavior and cancellation without provider-driven private retrieval.

Gate: CHG-09, CHG-10

- C11-AC1: Pre-token failure may fall back once; success does not fall back; committed stream failure never appends another provider answer; STOP works.
- C11-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-12 — Unified generation lifecycle

Goal: Use one cancellable request lifecycle with provider commitment.

Scope: IDLE → PLANNING → RETRIEVING → GENERATING → COMMITTED → COMPLETED, plus cancellation/failure paths; preserve existing stream contracts until migration proves replacement.

Gate: CHG-11

- C12-AC1: Stop then immediate restart cannot leak chunks; superseded generation cannot write into a new answer; lifecycle tests cover failures.
- C12-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-13 — Primary manual-chat integration

Goal: Wire manual chat into the central pipeline.

Scope: Trace renderer/preload/IPC and active engine/generation ports; old routes remain only intentional compatibility until migrated.

Gate: CHG-12

- C13-AC1: A real/request-level trace shows one plan, evidence pack, assembled prompt, provider call and visible stream.
- C13-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-14 — Behavioral evaluation safety net

Goal: Evaluate behavior before deleting architecture.

Scope: Cover general/follow-up/project/personal/files/coding/screen/conversation, no-context vs retrieval, length/duration, fallback/STOP, contamination, source authority, scope and language.

Gate: CHG-13

- C14-AC1: Classify existing tests keep/migrate/obsolete; inspect decisions, selected context, final prompt, provider call and visible behavior; run required engine tests explicitly.
- C14-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-15 — Meeting/live intelligence migration

Goal: Use the same engine while keeping transcription infrastructure independent.

Scope: Migrate answer paths without rewriting system audio, mic/native capture or STT; preserve meeting indexing and cancellation.

Gate: CHG-13, CHG-14

- C15-AC1: Meeting simulation: transcript, latest question/window, necessary retrieval, stream and STOP work; audio implementation remains unchanged.
- C15-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-16 — Project/My Files/personal sources

Goal: Use explicit source boundaries with canonical context decisions.

Scope: Preserve existing project routing repair; eliminate duplicate injection only after new planner ownership is active.

Gate: CHG-14, CHG-15

- C16-AC1: General Django avoids personal data; project Django uses project evidence; certifications use personal evidence; document questions use the selected document; scope/authority isolation tested.
- C16-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-17 — Canonical RAG under the intelligence engine

Goal: Continue the current migration without replacing canonical storage/retrieval.

Scope: Trace ContextPlanner → RetrievalCoordinator → existing canonical RAG adapter/search boundary. Keep documents, revisions, chunks, embeddings, indexing, hybrid retrieval and provenance in canonical infrastructure. Move answer-strategy decisions above it, without prematurely deleting still-used legacy generation.

Gate: Reconcile actual CHG-01–16 state; preserve uncommitted Change 17/chat-RAG repair.

- C17-AC1: All detailed CHG-17 acceptance criteria below verified; focused engine and canonical tests, typechecks, diff review and relevant manual checks have real evidence.
- C17-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-18 — Legacy meeting/global RAG answer paths

Goal: Finish migrating remaining active direct RAG-to-LLM callers.

Scope: Public snapshot already routes meeting/live IPC through the engine; global still uses RAGManager.queryGlobal. Recheck local code, finish remaining routes, then consider prompt-helper removal only when all callers are gone.

Gate: CHG-17 verified; preserve CHG-15 behavior.

- C18-AC1: All active meeting/global answer surfaces converge on engine; cancellation/stream events preserved; remaining buildRAGPrompt/queryMeeting/queryGlobal references classified.
- C18-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-19 — Duplicated responsibility cleanup

Goal: Remove only responsibilities demonstrably transferred.

Scope: Candidates: context routing, prompt composition, retrieval decisions, question/answer planning, generation state. Split mixed-responsibility files rather than deleting wholesale.

Gate: CHG-18 and active behavioral protection.

- C19-AC1: Each deletion has old responsibility, replacement owner, callers, equivalence tests and safe-removal evidence; searches/typechecks/build/focused tests pass or failures are classified.
- C19-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-20 — One primary intelligence pipeline

Goal: Converge all answer-producing surfaces on one conceptual engine.

Scope: Manual, meeting, global, live, personal/project, coding, follow-up and screen routes may retrieve differently but must not have independent hidden brains.

Gate: CHG-19

- C20-AC1: Repository-wide runtime/call map covers every surface and intentional compatibility exception; no unowned second prompt/provider orchestration.
- C20-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-21 — Final intelligence quality/regression pass

Goal: Measure correctness and behavior, not just compilation.

Scope: Compare baseline vs current grounding, hallucination, relevance, scope, style/length, language, latency, first useful token, full completion, fallback, STOP, duplicate answers, retrieval frequency and prompt size.

Gate: CHG-20; packaging work requires separate authorization.

- C21-AC1: Full required suites, explicit engine tests, typechecks, approved packaging and manual smoke checks recorded; baseline vs introduced failures separated.
- C21-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-22 — Final verified-dead architecture deletion

Goal: Clean up only after all earlier gates.

Scope: Delete dead prompt builders/routing/adapters/flags/compatibility/tests only when replaced and unused; no deletion merely to reduce file count.

Gate: CHG-01–21 verified for affected responsibilities.

- C22-AC1: For every module: importer/symbol search, test/compile/build/runtime evidence, migration impact and final diff reviewed; no lost behavior or data.
- C22-AC2: Required automated and manual verification recorded; protected boundaries unchanged; diff and tracking records reviewed.

### CHG-23 — Dedicated Coding, CS Fundamentals, and Resume & Projects modes (post-roadmap)

**Owner decision (2026-11-07):** After Changes 1–22 are complete, introduce **three additional selectable modes** while **retaining the existing Technical Interview mode and its current LLM + authorized RAG behavior**. Do not implement this feature during CHG-17/18. This refines the earlier FEAT-003/FEAT-004 plans: preserve existing mode labels and saved settings rather than replacing Technical Interview or forcing a new menu taxonomy.

**Goal:** Make retrieval policy predictable by mode, while continuing to use the single Intelligence Engine for response strategy and streaming. Modes are configuration/policies of the existing engine, **not separate LLM pipelines, RAG managers, databases, or provider routers**.

**Modes and required behavior:**

1. **Coding / DSA — LLM-only.** For algorithms, data structures, debugging, programming and code-writing questions, do not invoke RAG, personal/project/resume documents, profile memories or private reference retrieval by default. Use the selected LLM and authorized same-mode conversation context. Prefer an interview-ready response: a brief intuition, working code in the user's selected language (Python by default if not otherwise configured), meaningful inline comments explaining key operations, complexity analysis, edge cases and sample input/output when relevant. Respect explicit code-only requests and language choices; avoid unnecessary lengthy prose.
2. **CS Fundamentals — LLM-only.** For operating systems, DBMS, networks, OOP, system design basics and computer-science theory, do not invoke personal/project/resume RAG or private reference retrieval by default. Provide a concise correct definition, explanation or comparison, and an example when it helps. Clearly distinguish uncertain, version-dependent claims; do not invent personal experience. Keep the same selected model/provider and cancellation lifecycle.
3. **Resume & Projects — document-grounded RAG on each query.** Every request in this mode **plans an authorized retrieval attempt** against the user's available resume/profile, specifically selected projects and their uploaded PDF/Markdown/reference documents, including relevant follow-ups. Only select sources permitted for that session and project; scope named projects to exact current authorized file IDs and preserve document/revision/chunk/page/section provenance. Resume claims must be supported by resume/profile evidence; project implementation claims by the correct project's documents. If files are missing, unavailable, not indexed/READY, denied, irrelevant or insufficient, clearly say evidence is unavailable or ask for the correct document instead of fabricating implementation details. Do not automatically widen to sibling projects or unrelated private files. General explanations may supplement clearly separated, source-grounded personal claims, but must never be represented as facts from the user's documents.
4. **Existing Technical Interview — keep unchanged.** Preserve its existing mixed LLM + RAG behavior, source permissions, UI label, saved settings, model selection, answer style, and all known integrations unless a separately approved change and regression requires otherwise. Other existing modes also remain available.

**Architecture:** Mode policy → existing Intelligence Engine → ContextPlanner → RetrievalCoordinator (when permitted/required) → existing canonical RAG adapter and authorized source-local readers → EvidencePack → PromptAssembler → chosen provider → one answer stream. The two LLM-only modes bypass retrieval capabilities, **not** the Intelligence Engine, provider/cancellation protections or safe conversational context. The Resume & Projects mode attempts retrieval per request; this does not authorize hidden access to documents or the guarantee of a retrieved hit.

**Gate:** CHG-01–22 verified for the affected responsibilities; explicitly schedule after the architecture cleanup. Reconcile FEAT-003 and FEAT-004 during implementation without removing or silently migrating the existing Technical Interview choice.

- C23-AC1: UI exposes and persists the three new modes with clear labels and accessible navigation; old Technical Interview and other mode choices, existing saved selections, provider/model preferences and migration fallbacks continue to work.
- C23-AC2: Coding/DSA and CS Fundamentals make **zero** RAG/personal/project/profile retrieval calls in deterministic engine and real IPC tests; source availability or a previous RAG-mode session cannot silently leak document evidence after switching modes.
- C23-AC3: Coding output follows the defined thought/code-with-explanatory-comments/complexity contract for Python and explicit alternative languages, including edge cases; CS Fundamentals answers are succinct, accurate and example-ready. Output formatting is performed by the existing response/prompt planner, not RAGManager.
- C23-AC4: Resume & Projects attempts authorized, scoped retrieval on each query, including completed same-session follow-ups. Correct resume/project evidence and file/page/revision provenance are included; sibling projects, stale/denied files, cancelled requests and unrelated memories are excluded. Empty or missing evidence is visibly honest, never fabricated.
- C23-AC5: Technical Interview retains mixed LLM+RAG behavior in comparable before/after tests; switching modes does not merge private conversation/evidence, change the selected model unexpectedly, or allow late streams/cancellation results to cross the boundary.
- C23-AC6: Both typechecks, focused intelligence/RAG/IPC regressions, relevant build, owner Mac functional tests and applicable Windows checks are actually run or explicitly marked pending. No canonical store replacement, destructive migration, credential/billing modification, native/audio rewrite or unsupported “fully verified” claim.

## CHG-17 detailed continuation gate

Do not begin with deletion. First reconcile the in-progress work and identify which adapter/search boundary already exists.

- C17-AC3: Trace each affected UI/IPC request through ContextPlanner → RetrievalCoordinator → the current canonical read/retrieval boundary, with actual active callers recorded. No parallel canonical database/store is introduced.
- C17-AC4: Retrieval returns typed, scoped evidence/data; the intelligence pipeline owns answer strategy, response shape, final prompt and provider selection for the affected new-engine paths.
- C17-AC5: Preserve document/revision/chunk IDs, page/section locators, embeddings/indexing, hybrid/rerank/relevance behavior and provenance. Lexical scores are not falsely presented as ranking parity.
- C17-AC6: Project questions retrieve the right project; personal/resume questions use authorized personal evidence; general questions do not accidentally retrieve private files. Empty/denied/missing evidence is explicit.
- C17-AC7: One intended source decision cannot fan out into duplicate retrieval. Retrieval cancellation and supersession prevent late writes to a new request.
- C17-AC8: Existing storage/indexing, source ownership, project routing repair and uncommitted owner edits are preserved. No database reset/destructive migration is used as a shortcut.
- C17-AC9: Engine/canonical/affected source-routing tests actually execute; the observed aggregate test script's lack of explicit engine-directory inclusion is handled. Typecheck, relevant build and diff review have evidence.
- C17-AC10: Manual project/personal/general question checks and STOP/restart checks are recorded as executed or explicitly pending. No inferred pass from a filename/test count.
- C17-AC11: Active direct RAG-generation callers are inventoried and deferred to CHG-18 where appropriate; do not delete queryMeeting/queryGlobal/buildRAGPrompt while required callers remain.

Candidate areas from the owner roadmap: `electron/rag/RAGManager.ts`, `RAGRetriever.ts`, `VectorStore.ts`, `electron/rag/canonical/`, retrieval ports, engine RetrievalCoordinator and actual IPC wiring. This list is navigation guidance, not permission to edit every file.

## Final user requirements

The following acceptance criteria are proposed operational definitions of the owner's requirements. They preserve the user's intent; disputed details remain explicit decisions rather than invented facts.

### FEAT-001 — Fresh Listen → live transcript → Stop → answer

Source: Owner requirements 1–2.

Gate / boundary: Separate explicitly approved audio/UI integration task; do not rewrite capture during CHG-17.

- F01-AC1: Listen creates a new listening-cycle/request ID, clears current-cycle draft buffers, and shows Listening plus visible incremental transcript while permitted capture runs.
- F01-AC2: Stop ends capture for that cycle, waits only for bounded final transcript flush, and submits that finalized current-cycle text to chat exactly once.
- F01-AC3: An empty/no-speech cycle does not generate a misleading answer; permission/provider errors are visible and retryable.
- F01-AC4: A second Listen starts fresh: late callbacks, previous transcripts, chunks, queued audio and cancelled answers cannot enter the new cycle. Persistent session history is not destructively erased.
- F01-AC5: Default proposed behavior: no pre-roll and no artificial one-second delay. Confirm whether the owner wants up to one second immediately before Start; never include older speech without explicit authorization.
- F01-AC6: Rapid Start/Stop/Start and delayed final STT events are covered by behavioral tests plus a real permitted-audio test. Transcription Stop and answer-generation STOP have distinct tested effects.

### FEAT-002 — Complete useful answer within six seconds

Source: Owner requirement 3.

Gate / boundary: Performance target; depends on transcript handoff, retrieval, provider health and agreed output bounds.

- F02-AC1: Define the primary interval as Stop click to final useful answer visibly completed; also measure submitted-text-to-completion separately. Do not count only first token.
- F02-AC2: Record first useful token, STT finalization, planning/retrieval/provider duration, output size, model, warm/cold state, network/hardware and sample count.
- F02-AC3: Run an agreed repeatable benchmark for general, project, resume and coding prompts; retain p50/p95/max and every >6000 ms miss. Any relaxed service-level threshold needs owner approval; do not replace the six-second goal silently.
- F02-AC4: Show honest progress/deadline/errors; no fabricated or unsupported personal answer just to meet a timer. Document provider-dependent limits and do not promise a universal guarantee.

### FEAT-003 — General / Project / Resume sections

Source: Owner requirement 4.

Gate / boundary: UI/context task after stable source-boundary integration.

- F03-AC1: Expose the three requested sections with clear active state, persistence and keyboard-accessible navigation.
- F03-AC2: General avoids private retrieval by default; Project uses the selected project evidence; Resume uses authorized resume/profile evidence.
- F03-AC3: Switching sections does not leak context or late stream output, erase documents, or silently select a different project/model.

### FEAT-004 — Coding / Project / General (CS basics) answer modes

Source: Owner requirement 5.

Gate / boundary: Modes are answer intent/style, not a duplicate document section.

- F04-AC1: Offer Coding, Project, and General (CS basics) labels/behaviors in place of confusing interview-mode labels; map/migrate saved values deliberately.
- F04-AC2: Coding gives requested language/code plus concise reasoning; Project grounds personal claims; General explains CS concepts without unrelated private data.
- F04-AC3: Changing mode preserves selected provider/model and source permissions; tests cover existing saved settings and invalid/legacy values.

### FEAT-005 — Consistent configurable models inside chat

Source: Owner requirement 6 and model-loading defect.

Gate / boundary: Shares investigation with ERR-001; inspect existing discovery/allow-list/IPC refresh paths.

- F05-AC1: Configured valid models available before launch are also selectable inside chat, subject to explicit user allow-list and provider capability rules rather than an unexplained four-model cap.
- F05-AC2: Persist selected models/defaults and refresh lists on credential/provider changes without restarting; display loading/empty/auth/rate-limit/unsupported states.
- F05-AC3: A selected model is the effective model for the next request; no silent substitution. Confirm whether the owner wants a chosen subset; do not assume simultaneous multi-model generation.
- F05-AC4: Provider connectivity, model IDs, streaming, persistence, cancellation and restart behavior are tested; user keys never enter logs.

### FEAT-006 — Working fast-answer mode

Source: Owner requirement 7.

Gate / boundary: Depends on FEAT-002 metrics and healthy provider/model routing.

- F06-AC1: The toggle persists correctly and changes the actual request policy, not only UI state; inspect current fast-mode eligibility instead of adding a second toggle.
- F06-AC2: Explicitly show effective provider/model and eligibility or unavailability; fast mode does not silently override the selected model without an approved visible policy.
- F06-AC3: Bounded context/output and warmed eligible infrastructure improve measured end-to-end latency without skipping necessary project/resume evidence.
- F06-AC4: On/off, restart, credential change, unsupported model, fallback-before-commit, STOP and full-completion timings are tested; no double answer after commitment.

### FEAT-007 — Evidence-based audit and defect repair

Source: Owner requirement 8.

Gate / boundary: Ongoing bounded audit; create individual tasks for findings, not a giant automatic rewrite.

- F07-AC1: Inventory relevant error logs, test failures, callers and CI output; classify confirmed defects, hypotheses, pre-existing failures and new regressions.
- F07-AC2: Each fix has a linked ERR/task, reproduction, smallest patch, regression test, executed evidence and manual check where applicable.
- F07-AC3: Audit includes provider loading, personal intelligence, canonical source selection, stream races, fresh listening sessions, install/build/package/runtime boundaries and safe log redaction.

### FEAT-008 — PDF/Markdown-grounded personal and project answers

Source: Owner requirement 9.

Gate / boundary: Depends on CHG-17 canonical evidence invariants and ERR-002 investigation.

- F08-AC1: Supported PDF and Markdown ingestion produces readable text/chunks with source identity, revisions and relevant locators. Empty/encrypted/scanned/failed files show explicit status; OCR support is an explicit decision.
- F08-AC2: Question-specific retrieval uses the selected project/resume documents with provenance; updating/removing a file cannot leave stale active evidence.
- F08-AC3: Personal achievements, skills, experience and project architecture are not invented. Missing/conflicting evidence produces an honest gap/clarification, not a plausible first-person fabrication.
- F08-AC4: General CS explanations may use general knowledge; personal assertions remain source-grounded. Document text cannot override tool permissions or system instructions.
- F08-AC5: Tests include correct source, wrong project, no evidence, contradictory revision, removed file, PDF-vs-MD parity, source injection and permission denial; authorized manual examples verified.

### FEAT-009 — UI review from actual app screenshots

Source: Owner requirement 10.

Gate / boundary: Needs actual Sneak-Peek app screenshots; supplied screenshots are ChatGPT settings/project sources.

- F09-AC1: Collect current screenshots of listening/transcript, sections/modes, model picker, fast mode, document state, and errors with private details removed.
- F09-AC2: Review visible state, loading/errors, accessibility, long answers/transcripts and consistency; prioritize owner-approved improvements individually.
- F09-AC3: Do not claim app-UI defects from unrelated screenshots; verify implemented changes at the owner’s actual display scale/theme.

### FEAT-010 — Permission-aware Sneak-Peek rebranding

Source: Owner requirement 11.

Gate / boundary: Owner authorized a naming-only rebrand on 2026-11-02 and confirmed the visible spelling `Sneak-Peek`. Owner explicitly declined current license/notice inspection. Existing external service and update URLs must remain until replacement endpoints are supplied. Preserve compatibility identifiers and notices; full removal and packaged acceptance remain unverified.

- F10-AC1: Read applicable current LICENSE and provenance; preserve required notices/attribution/license checks and obtain permission for restricted changes. Record decision without treating agent analysis as legal advice.
- F10-AC2: Owner confirms final name/spelling/logo and approved scope: visible strings, docs/assets, packaging, internal symbols and persistent identifiers are separate migration steps.
- F10-AC3: Inventory current-brand references and classify keep-by-obligation, safe visible replacement, compatibility key, external URL/protocol, generated/historical and permission-dependent.
- F10-AC4: No blind global replacement: preserve user data/keychain/database/settings, update identities, IPC contracts, signing/notarization and native dependency paths; test approved migrations.
- F10-AC5: Check approved visible surfaces and packaged artifacts for old display branding while retaining mandated legal attribution; complete removal cannot be claimed if required references remain.

## Six-second measurement contract

The requested outcome is **a useful answer completed within six seconds**, not merely a spinner or first token. Proposed primary measurement is Stop-click → final answer rendered; also retain question-submission → completion and time to first useful token. Confirm intended output lengths, model/provider, local hardware, network, cold/warm state, PDF/retrieval state and whether speech finalization is inside the budget before claiming success.

Do not invent timing results. Retain failed/slow samples. Report sample count, percentiles and worst-case observations without turning finite testing into a universal guarantee. If output requirements or external services make the target unattainable, explain the evidence and ask the owner to approve a changed trade-off. Do not silently substitute “starts answering in six seconds.”

## Cross-cutting definition of done

- Relevant automated regression tests plus a repeatable manual verification procedure for each implementation change.
- Required manual/runtime checks must actually be executed, or remain pending; writing a procedure is not performing it.
- Permission/scope isolation and unsupported-personal-claim behavior are tested.
- Selected model, pre-commit fallback, no post-commit duplicate answer, STOP, and stale-request suppression remain correct.
- Baseline failures are separated from introduced failures with evidence. Pre-existing failures may block release even if unrelated to the patch.
- Installation, compilation, tests, packaging, signing, and installed-artifact launch are separate gates. “Works in dev” is not release completion.
- Owner worktree preserved; focused diff reviewed; authoritative tracker/error/change/handoff records saved by the agent.
- No secret/private content committed. Required attribution/legal notices retained.
- No auto-commit/push/release without authorization.

## Decision register

| ID | Question | Initial handling |
|---|---|---|
| DEC-001 | Which local branch/commit and uncommitted Change 17 edits are current? | Read-only reconciliation first; blocking for code work. |
| DEC-002 | Does the one-second audio wording mean pre-roll or simply no previous recording? | Default proposal: fresh cycle, no pre-roll, no artificial delay. Confirm before implementing optional pre-roll. |
| DEC-003 | What output/hardware/network/model benchmark defines six-second completion? | Preserve complete-answer target; benchmark agreement required before declaring it met. |
| DEC-004 | Final product spelling/logo and license permissions? | Owner confirmed `Sneak-Peek` and rebranding permission on 2026-11-02; logo artwork is still the original N mark. Owner declined current license/notice inspection. Existing service/update URLs stay for now. No legal verification or packaged acceptance claimed. |
| DEC-005 | Which provider/model combinations and exact personal-intelligence symptoms fail? | Log sanitized evidence in ERR-001/ERR-002; no invented diagnosis. |
| DEC-006 | Are scanned PDFs/OCR required? | Support must be explicit; never silently ingest an empty scanned PDF as success. |
| DEC-007 | Chosen model subset or simultaneous multi-model answers? | Proposed scope: choose enabled models and switch one effective model; simultaneous generation is not requested by default. |

## Original owner roadmap — preserved source

The section below preserves the text of the user-provided RTF for traceability. It may describe desired future behavior and historical names. Apply the current evidence boundary, protected-system rules, and legal gate above when interpreting it. No source statement is a verification claim.

<details>
<summary>Expand the original Changes 1–22 roadmap</summary>

```text
NATVIELY AI ASSIT CHANGES THAT I NEED TO MADE
NATIVELY INTELLIGENCE REBUILD
=============================

GLOBAL RULES FOR EVERY CHANGE
=============================

1. Do NOT touch the system-audio implementation.
2. Do NOT touch microphone/audio capture unless a change explicitly requires an integration point.
3. Do NOT reset, revert, stash, overwrite, or discard the current uncommitted chat/RAG repair.
4. Do NOT delete an existing subsystem merely because it looks old.
5. Before removing anything:
   - find every importer;
   - find every caller;
   - identify database tables used;
   - identify IPC channels;
   - identify renderer consumers;
   - identify tests;
   - identify the replacement;
   - prove the replacement is active;
   - prove the old path is unused;
   - only then remove it.
6. The new Natively Intelligence Engine must become the main intelligence path.
7. RAG must become a capability/tool used by the Intelligence Engine, NOT the Intelligence Engine itself.
8. The LLM provider layer must remain provider-agnostic.
9. Once the first answer token is committed from a provider, do not switch providers and produce a second answer.
10. STOP/cancellation must remain functional throughout the migration.
11. Do not blindly copy code from the four reference repositories.
12. Reference repositories are architectural references only.
13. Prefer simple, understandable TypeScript contracts over adding another giant abstraction layer.
14. Every change must have automated tests.
15. Every change must have a manual verification procedure.
16. Do not change packaging/native/audio functionality as part of the intelligence migration.

CHANGE 1: 
CURRENT ARCHITECTURE BASELINE AND SAFETY LOCK

what need to be changed:
Before implementing the new intelligence system, create a precise dependency map of the current answer pipeline.

We need to identify every current path that can produce an answer:
- normal/manual chat
- live/what-to-answer
- follow-up
- meeting chat
- global chat
- mode/reference-file chat
- personal/My Files questions
- project-specific questions
- coding questions
- screen-context questions
- any auto-answer path

The current project contains multiple intelligence/retrieval generations and does not have one universal runtime path.

which files need to be changed:
Preferably:
- no production source files initially
- add/update architecture documentation
- add an architecture audit document if one does not already exist
- add tests only if needed to establish the current path

Files that must be inspected:
- electron/IntelligenceEngine.ts
- electron/IntelligenceManager.ts
- electron/ipcHandlers.ts
- electron/context-intelligence/orchestration/engine-bridge.ts
- electron/context-intelligence/orchestration/orchestrator.ts
- electron/context-intelligence/question/*
- electron/context-intelligence/generation/*
- electron/intelligence/*
- electron/llm/*
- electron/rag/*
- electron/intelligence/context-os/*

what should be removed:
Nothing.

what should be added:
A written runtime map showing:
UI
→ preload
→ IPC
→ intelligence entry point
→ question understanding
→ context decision
→ retrieval
→ evidence
→ prompt
→ provider
→ stream

Also record every alternate path.

consecutive changes:
This becomes the reference document for every later change.

extra information on how to check if the change is made:
Run repository-wide searches for:
- RAGManager
- WhatToAnswerLLM
- IntelligenceEngine
- orchestrator
- streamChatWithGemini
- ProviderRouter
- buildRAGPrompt
- promptComposer
- ContextFusionEngine
- EvidenceResolver

For every answer-producing call, there must be a documented path explaining where it enters the new architecture.

SELF NOTE:
Do not start deleting anything until this map exists.


CHANGE 2:
CREATE THE NATIVELY INTELLIGENCE CONTRACT

what need to be changed:
Create the central contract for the new intelligence system.

The core request should represent:
- request ID
- session ID
- surface
- user message
- current turn
- recent conversation
- transcript context if available
- manual question if supplied
- screen context if available
- active mode/project/profile information
- cancellation signal
- requested response shape
- provider preferences
- context permissions

The result should represent:
- resolved question
- intent
- response type
- selected context
- retrieval plan
- evidence
- prompt
- provider attempt
- stream lifecycle
- diagnostics/trace
- final answer

Suggested new area:
electron/intelligence/engine/

Suggested files:
- electron/intelligence/engine/types.ts
- electron/intelligence/engine/NativelyIntelligenceEngine.ts

Do not create 30 files immediately.

what should be removed:
Nothing.

what should be added:
A small, stable contract layer.

The central concept should be:

NativelyIntelligenceEngine.handle(request)

and internally:

understand
→ plan context
→ retrieve if required
→ build evidence
→ assemble prompt
→ route LLM
→ stream

consecutive changes:
Every later intelligence component must consume these contracts.

extra information on how to check if the change is made:
TypeScript must compile.

Add contract tests that create a fake request and verify that:
- it can enter the engine;
- the engine can produce a decision;
- no provider is required for the unit test;
- cancellation can be represented.

SELF NOTE:
The engine contract is the most important new boundary. Keep it boring and explicit.


CHANGE 3:
BUILD STRUCTURED CONVERSATION STATE

what need to be changed:
Replace the idea of "conversation = giant text blob" with structured conversation state.

Use the strongest concept from Interview Assistant and NexQ.

Represent turns with:
- role
- speaker
- text
- timestamp
- turn ID
- finalized/non-finalized state
- source
- optional metadata

The current conversation-state files should become the canonical source for conversational context.

which files need to be changed:
Primary:
- electron/context-intelligence/question/conversation-state.ts
- electron/context-intelligence/question/conversation-state-store.ts
- electron/intelligence/ConversationMemoryService.ts

Potentially:
- electron/intelligence/MeetingMemoryService.ts
- electron/intelligence/LiveTranscriptBrain.ts

what should be removed:
Do not remove existing memory services yet.

Remove only duplicated representations after the new state is proven.

what should be added:
A canonical ConversationState interface and store.

It must support:
- append turn
- update turn
- retrieve recent turns
- retrieve conversation window
- clear/reset session
- identify current turn
- associate turn with request sequence

consecutive changes:
Change 4 and Change 5 depend on this.

extra information on how to check if the change is made:
Create tests for:
1. user → assistant → user sequence.
2. timestamps preserved.
3. newest turn is always identifiable.
4. old turns can be retrieved without mutating state.
5. separate sessions do not leak turns.
6. follow-up questions can access previous turns.

SELF NOTE:
This is our equivalent of the useful parts of ConversationManager.ts and NexQ transcript state, but implemented natively for Natively.


CHANGE 4:
CREATE THE TRANSCRIPT WINDOW / RECENT-CONTEXT LAYER

what need to be changed:
Adopt the useful NexQ idea of a bounded recent transcript window.

The intelligence engine should distinguish:
- current turn
- immediate previous turns
- recent transcript window
- older conversation
- long-term knowledge

Do not send the entire meeting transcript to the LLM every time.

which files need to be changed:
Potentially:
- electron/intelligence/LiveTranscriptBrain.ts
- electron/context-intelligence/question/conversation-state-store.ts
- new:
  electron/intelligence/engine/TranscriptContext.ts

Do NOT modify:
- audio/SystemAudioCapture.ts
- native audio capture
- STT provider implementations

what should be removed:
Any duplicated transcript-window logic that is proven to perform the same responsibility.

what should be added:
A single function/concept:

getRecentConversationContext(request)

which returns only the appropriate recent context.

consecutive changes:
Question understanding and context planning depend on this.

extra information on how to check if the change is made:
Test:
- 100 transcript turns entered.
- request asks about the latest turn.
- only configured recent context is selected.
- current question is never lost.
- older relevant context can still be requested separately.

Manual:
Have a long conversation and verify the answer does not degrade simply because the transcript became long.

SELF NOTE:
Recent context and retrieval context are NOT the same thing.


CHANGE 5:
REBUILD QUESTION / TURN UNDERSTANDING

what need to be changed:
Turn the current question system into a dedicated understanding stage.

Use ideas from:
- Interview-Copilot question extraction
- NexQ question detector
- current Natively question resolver
- current Natively turn classifier

The system must understand:
- Is this a question?
- What is the actual question?
- Is it a follow-up?
- Is it referring to previous context?
- Is it a coding request?
- Is it asking about the user's project?
- Is it asking about the user's personal information?
- Is it asking about a document?
- Is it asking about the screen?
- Is it a refinement such as "make it longer"?
- Is it a conversational statement that requires a response?

which files need to be changed:
- electron/context-intelligence/question/question-resolver.ts
- electron/context-intelligence/question/turn-classifier.ts
- electron/context-intelligence/question/conversation-state.ts
- electron/context-intelligence/question/conversation-state-store.ts

Possibly:
- electron/llm/resolveCanonicalTurn.ts
- electron/llm/codingPromptSignals.ts

what should be removed:
Remove duplicated question-resolution decisions only after their behavior is represented in the new resolver.

Do NOT remove the existing resolver immediately.

what should be added:
A canonical TurnUnderstanding result.

Example conceptual output:

question
intent
followUp
confidence
subject
entities
requestedDuration
responseShape
requiresPersonalContext
requiresProjectContext
requiresDocumentContext
requiresMeetingContext
requiresScreenContext
requiresRetrieval

consecutive changes:
Change 6 uses this result.

extra information on how to check if the change is made:
Test these exact categories:
- "What is Redis?"
- "Why did you use Redis in Linkship?"
- "Tell me about your project."
- "And why?"
- "Explain that again."
- "Make it longer."
- "Give me code."
- "What did I use PostgreSQL for?"
- "What is this error?"
- "Can you explain this?"
- a non-question statement requiring contextual response.

Verify the resolver produces the same expected intent independent of whether a question mark is present.

SELF NOTE:
Regex/question-mark detection is a cheap signal, not the brain.


CHANGE 6:
CREATE THE CONTEXT PLANNER

what need to be changed:
This becomes the most important new intelligence component.

The planner decides what information the LLM actually needs.

Possible context sources:

NONE
RECENT_CONVERSATION
LONGER_CONVERSATION
MEETING_TRANSCRIPT
PERSONAL_KNOWLEDGE
PROJECT_KNOWLEDGE
MY_FILES
MODE_DOCUMENTS
RAG
SCREEN
PROFILE
STRUCTURED_KNOWLEDGE

The planner must answer:

"What context is necessary to answer this question correctly?"

not:

"Which context can I stuff into the prompt?"

which files need to be changed:
New:
- electron/intelligence/engine/ContextPlanner.ts
- electron/intelligence/engine/ContextTypes.ts

Existing integration points:
- electron/context-intelligence/orchestration/orchestrator.ts
- electron/llm/contextRoute.ts
- electron/llm/retrievalQueryPolicy.ts
- electron/intelligence/ContextRouter.ts

what should be removed:
Eventually remove duplicated context-selection logic from:
- IntelligenceEngine.ts
- WhatToAnswerLLM.ts
- ContextRouter.ts
- contextRoute.ts
- orchestrator.ts

But only after migration.

what should be added:
One canonical ContextPlan.

Example:

conversation: required
project: required
personal: forbidden
rag: required
screen: not_required

consecutive changes:
Changes 7-9 consume this.

extra information on how to check if the change is made:
Unit tests must prove:
"What is Python?" does NOT trigger project RAG.

"Why did you use Redis in Linkship?" DOES trigger project retrieval.

"What did I say earlier?" DOES trigger conversation retrieval.

"What does this screenshot error mean?" DOES trigger screen context.

"Tell me about yourself" DOES trigger profile/personal context.

A general question must not accidentally retrieve the user's private files.

SELF NOTE:
This is where Natively becomes intelligent instead of becoming a larger RAG pipeline.


CHANGE 7:
MAKE RETRIEVAL A TOOL OF THE INTELLIGENCE ENGINE

what need to be changed:
Create one RetrievalCoordinator.

The Intelligence Engine should call:

RetrievalCoordinator.retrieve(contextPlan)

instead of individual answer components independently deciding to call RAG.

which files need to be changed:
New:
- electron/intelligence/engine/RetrievalCoordinator.ts

Integrations:
- electron/context-intelligence/retrieval/meeting-retrieval-port.ts
- electron/context-intelligence/retrieval/mode-retrieval-port.ts
- electron/context-intelligence/retrieval/personal-file-retrieval-port.ts
- electron/context-intelligence/retrieval/profile-retrieval-port.ts
- electron/context-intelligence/retrieval/legacy-retrieval-port.ts

Existing:
- electron/rag/RAGManager.ts
- electron/rag/RAGRetriever.ts

what should be removed:
Not the retrieval implementations.

Remove duplicated retrieval DECISIONS from answer generation.

RAGManager should eventually stop deciding why a question needs RAG.

what should be added:
RetrievalCoordinator receives an explicit plan and calls the appropriate retrieval capability.

consecutive changes:
Change 8 defines evidence.

extra information on how to check if the change is made:
Instrument every retrieval call.

For one question, verify there is exactly one intended retrieval decision.

Example:
"Why did I use Redis in Linkship?"

Expected:
Context planner → project retrieval → evidence.

Not:
WhatToAnswerLLM → RAGManager → personal search → profile search → another RAG search.

SELF NOTE:
Retrieval should execute a decision. It should not make the intelligence decision itself.


CHANGE 8:
CREATE ONE EVIDENCE PACK

what need to be changed:
Unify retrieved information into one typed evidence representation.

Use the strongest ideas from current Context OS and NexQ.

Evidence should contain:
- source
- source ID
- text
- relevance
- provenance
- citation information where applicable
- authority
- scope
- confidence
- reason it was selected

which files need to be changed:
Existing:
- electron/intelligence/context-os/evidencePack.ts
- electron/intelligence/context-os/EvidenceResolver.ts
- electron/intelligence/context-os/evidenceSufficiency.ts
- electron/intelligence/context-os/SourceAuthorityKernel.ts
- electron/intelligence/context-os/promptRenderer.ts

Potentially:
- electron/intelligence/ContextFusionEngine.ts

what should be removed:
Do not immediately delete Context OS.

Instead:
make it the evidence boundary where useful.

Remove duplicate evidence representations only after all callers move to the new contract.

what should be added:
One canonical EvidencePack consumed by prompt assembly.

consecutive changes:
Change 9 uses this.

extra information on how to check if the change is made:
A test should construct:
- project evidence
- personal evidence
- meeting evidence
- document evidence

and verify the pack preserves source identity and scope.

Test that personal information cannot accidentally become project evidence.

SELF NOTE:
Evidence is data with provenance, not just text pasted into a prompt.


CHANGE 9:
BUILD THE NATIVELY PROMPT ASSEMBLER

what need to be changed:
Create one final prompt assembly stage.

The final prompt should be built from:

SYSTEM INSTRUCTIONS
+
RESPONSE POLICY
+
CURRENT QUESTION
+
RELEVANT CONVERSATION
+
EVIDENCE
+
OPTIONAL SCREEN CONTEXT
+
OPTIONAL USER/PROJECT CONTEXT

Nothing else should directly inject arbitrary context into the provider call.

which files need to be changed:
New:
- electron/intelligence/engine/PromptAssembler.ts

Existing:
- electron/context-intelligence/generation/prompt-composer.ts
- electron/context-intelligence/generation/context-packer.ts
- electron/intelligence/PromptAssemblerV2.ts
- electron/intelligence/context-os/promptRenderer.ts
- electron/llm/WhatToAnswerLLM.ts
- electron/rag/prompts.ts

what should be removed:
Eventually remove duplicate final-prompt construction from:
- RAGManager
- WhatToAnswerLLM
- PromptAssemblerV2
- legacy RAG prompt builders

But only after the new assembler is active.

No blind deletion.

consecutive changes:
Change 10 connects this to provider generation.

extra information on how to check if the change is made:
Add a test called something like:

SingleFinalPromptInvariant

The provider must receive exactly one final prompt produced by the new assembler.

The prompt must:
- contain the actual question;
- contain only selected context;
- not contain unrelated personal/project information;
- not contain internal routing markers;
- not contain duplicated evidence;
- respect output length intent.

SELF NOTE:
The prompt assembler should assemble. It should not decide what knowledge is relevant.


CHANGE 10:
BUILD RESPONSE PLANNING / ANSWER SHAPE

what need to be changed:
Separate "what should I answer?" from "how should I answer it?"

Use useful ideas from:
- AgentSami natural interview style
- Interview Assistant answer generation
- current Natively AnswerPlanner

Response planning should determine:
- direct answer
- explanation
- project-grounded answer
- first-person interview answer
- coding answer
- troubleshooting answer
- example
- summary
- spoken answer
- requested duration
- requested detail level

which files need to be changed:
- electron/llm/AnswerPlanner.ts
- electron/llm/WhatToAnswerLLM.ts
- electron/intelligence/OutputShapeNormalizer.ts

Potential new:
- electron/intelligence/engine/ResponsePlanner.ts

what should be removed:
Do not remove AnswerPlanner until its responsibilities have moved.

Remove duplicated answer-shape logic from unrelated files.

consecutive changes:
PromptAssembler consumes the ResponsePlan.

extra information on how to check if the change is made:
Test:
"What is Redis?"
→ direct technical explanation.

"Why did you use Redis in Linkship?"
→ project-grounded explanation.

"Tell me about Linkship."
→ first-person interview response.

"Give me a 2-minute answer."
→ duration-aware response.

"Write binary search."
→ coding response.

SELF NOTE:
Context selection and response style are different decisions.


CHANGE 11:
MAKE LLM PROVIDERS A PURE GENERATION LAYER

what need to be changed:
The Intelligence Engine should not know Gemini/Groq/Qwen HTTP details.

ProviderRouter chooses a provider/model.

The generation controller handles:
- streaming
- cancellation
- first-token timing
- provider fallback
- provider commit
- errors
- completion

which files need to be changed:
- electron/llm/ProviderRouter.ts
- electron/LLMHelper.ts
- potentially provider-specific modules
- new:
  electron/intelligence/engine/GenerationController.ts

what should be removed:
Provider-specific intelligence decisions.

No provider should decide:
- whether RAG is needed
- whether personal context is needed
- whether project context is needed
- what the user meant

Those decisions belong above the provider layer.

consecutive changes:
Change 12 validates fallback and streaming.

extra information on how to check if the change is made:
Test:
1. Gemini unavailable before first token.
2. Qwen/Groq fallback starts.
3. Only one final answer appears.
4. Gemini succeeds → no fallback.
5. Gemini starts streaming → force failure → no second provider answer is appended.
6. STOP cancels generation.
7. New generation supersedes previous generation correctly.

SELF NOTE:
The reference Interview-Copilot fallback/commit principle is valuable. Keep it.


CHANGE 12:
UNIFY STREAMING AND GENERATION LIFECYCLE

what need to be changed:
Create one generation lifecycle.

State:

IDLE
→ PLANNING
→ RETRIEVING
→ GENERATING
→ COMMITTED
→ COMPLETED

Cancellation can occur before completion.

Provider switching is allowed only before COMMITTED.

which files need to be changed:
- new GenerationController.ts
- electron/IntelligenceEngine.ts
- electron/LLMHelper.ts
- electron/llm/ProviderRouter.ts
- electron/ipcHandlers.ts
- relevant renderer streaming handler

what should be removed:
Duplicate generation state machines.

Do not remove old stream support until the new path is proven.

consecutive changes:
Renderer verification and old-path migration depend on this.

extra information on how to check if the change is made:
Manual test:
- ask a question;
- see streaming begin;
- press STOP;
- verify no additional tokens arrive;
- ask another question immediately;
- verify the old generation cannot write into the new answer.

Run existing STOP/generation tests as well.

SELF NOTE:
Never sacrifice stream correctness for architectural cleanup.


CHANGE 13:
MAKE THE NEW INTELLIGENCE ENGINE THE PRIMARY MANUAL CHAT PATH

what need to be changed:
Move the main/manual chat path behind:

IPC
→ NativelyIntelligenceEngine
→ Turn Understanding
→ Context Planner
→ Retrieval Coordinator
→ Evidence
→ Prompt
→ Provider
→ Stream

which files need to be changed:
- electron/ipcHandlers.ts
- electron/context-intelligence/orchestration/engine-bridge.ts
- electron/IntelligenceEngine.ts
- electron/intelligence/engine/NativelyIntelligenceEngine.ts
- preload only if the contract requires changes
- renderer only if stream events change

what should be removed:
Do not remove old paths yet.

Instead:
make the new engine the primary route.

Old paths should become fallback/compatibility only temporarily.

consecutive changes:
Change 14 compares old and new behavior.

extra information on how to check if the change is made:
Trace one manual chat request from renderer to provider.

The trace must show:

manual-chat
→ NativelyIntelligenceEngine
→ TurnUnderstanding
→ ContextPlan
→ RetrievalCoordinator
→ EvidencePack
→ PromptAssembler
→ ProviderRouter
→ GenerationController

There must not be an unexpected second prompt-generation path.

SELF NOTE:
This is the first point where the new architecture becomes real.


CHANGE 14:
BUILD A BEHAVIORAL EVALUATION SUITE FOR THE NEW ENGINE

what need to be changed:
Use the existing intelligence evaluation results and current tests as behavioral protection.

Create a dedicated Natively Intelligence Engine test suite.

Categories:

A. General questions
B. Follow-ups
C. Project questions
D. Personal questions
E. My Files
F. Coding
G. Screen context
H. Conversation context
I. No-context questions
J. Retrieval-required questions
K. Retrieval-not-required questions
L. Long answers
M. Short answers
N. Requested duration
O. Provider fallback
P. STOP
Q. prompt contamination
R. source authority
S. evidence scope
T. language behavior

which files need to be changed:
- existing intelligence tests
- electron/context-intelligence/__tests__/*
- electron/llm/__tests__/*
- electron/intelligence/__tests__/*
- new engine test directory if appropriate

what should be removed:
Do not remove existing tests.

Some tests currently encode old behavior and should be reclassified:
- keep
- migrate
- obsolete after replacement

consecutive changes:
This is required before deleting old architecture.

extra information on how to check if the change is made:
Run the focused intelligence suite.

For every new test:
- test the decision;
- test the selected context;
- test final prompt;
- test provider call;
- test visible answer behavior where appropriate.

SELF NOTE:
The test suite is our safety net while removing the old architecture.


CHANGE 15:
MIGRATE MEETING/LIVE INTELLIGENCE

what need to be changed:
Move meeting/live answer generation onto the same Intelligence Engine.

The transcript system remains separate.

The flow becomes:

audio/STT
→ transcript state
→ Intelligence Engine
→ question understanding
→ context plan
→ meeting retrieval if needed
→ evidence
→ answer

which files need to be changed:
Potentially:
- electron/intelligence/LiveTranscriptBrain.ts
- electron/intelligence/MeetingMemoryService.ts
- electron/rag/LiveRAGIndexer.ts
- electron/rag/RAGManager.ts
- meeting/live IPC handlers
- relevant renderer meeting components

DO NOT CHANGE:
- SystemAudioCapture
- microphone capture
- native audio capture
- STT provider implementations unless required for data-contract integration

what should be removed:
Duplicate meeting-answer prompt paths.

Do not remove meeting indexing/retrieval itself.

consecutive changes:
Only do this after manual chat is stable.

extra information on how to check if the change is made:
Run a real meeting simulation.

Verify:
- transcript still arrives;
- current question is detected;
- recent transcript is available;
- retrieval happens only when needed;
- answer streams;
- STOP works;
- audio capture is unchanged.

SELF NOTE:
Audio is infrastructure. Intelligence consumes its output.


CHANGE 16:
MIGRATE PROJECT / MY FILES / PERSONAL KNOWLEDGE INTO THE NEW CONTEXT MODEL

what need to be changed:
Project files, My Files, profile information and personal knowledge should become explicit context sources.

The Intelligence Engine decides whether to use them.

Example:

"What is Django?"
→ no personal/project retrieval.

"Why did I use Django in Linkship?"
→ project context.

"What certifications do I have?"
→ personal/profile context.

"What does this uploaded document say?"
→ document context.

which files need to be changed:
- electron/personalKnowledge/*
- electron/services/ModesManager.ts
- electron/services/ModeContextRetriever.ts
- electron/context-intelligence/retrieval/*
- electron/intelligence/context-os/*
- electron/llm/WhatToAnswerLLM.ts
- project routing tests

what should be removed:
Duplicate retrieval calls and duplicated context injection after the new ContextPlanner owns the decision.

consecutive changes:
Change 17 handles the RAG cleanup.

extra information on how to check if the change is made:
Create tests proving that:
- project questions retrieve project evidence;
- general questions do not;
- personal questions retrieve personal evidence;
- project evidence cannot leak into unrelated questions;
- profile evidence cannot override project-specific evidence.

SELF NOTE:
This is where the recent project-routing repair must be preserved during migration.


CHANGE 17:
PUT CANONICAL RAG UNDER THE INTELLIGENCE ENGINE

what need to be changed:
Do NOT replace the canonical RAG storage/retrieval system with one of the reference repositories.

Instead:

Intelligence Engine
→ Context Planner
→ Retrieval Coordinator
→ canonical RAG adapter

The canonical RAG system remains responsible for:
- document storage
- revisions
- chunks
- embeddings
- indexing
- hybrid retrieval
- provenance

It should NOT decide overall answer strategy.

which files need to be changed:
- electron/rag/RAGManager.ts
- electron/rag/RAGRetriever.ts
- electron/rag/VectorStore.ts
- electron/rag/canonical/*
- electron/context-intelligence/retrieval/*
- electron/intelligence/engine/RetrievalCoordinator.ts

what should be removed:
Gradually remove intelligence responsibilities from RAGManager.

Eventually RAGManager should NOT:
- decide whether the user needs RAG;
- build the final LLM prompt;
- own response style;
- directly decide provider;
- be the final answer orchestrator.

Its job becomes retrieval/indexing/storage.

consecutive changes:
Change 18 removes old RAG answer paths.

extra information on how to check if the change is made:
Search for:

RAGManager → LLMHelper
RAGManager → buildRAGPrompt
RAGManager → streamChat

The final architecture should eventually have retrieval returning evidence/data, not directly generating the final answer.

SELF NOTE:
This is the most important RAG change.


CHANGE 18:
MIGRATE LEGACY MEETING/GLOBAL RAG ANSWER PATHS

what need to be changed:
Move:

rag:query-meeting
rag:query-global

away from:

RAGManager
→ buildRAGPrompt
→ LLMHelper

and toward:

IPC
→ NativelyIntelligenceEngine
→ ContextPlanner
→ Meeting/Global Retrieval
→ EvidencePack
→ PromptAssembler
→ Provider

The current project documentation explicitly identifies these as parallel/legacy RAG answer paths. 

which files need to be changed:
- electron/ipcHandlers.ts
- electron/rag/RAGManager.ts
- electron/rag/prompts.ts
- electron/components/meeting/global renderer callers if required
- preload if IPC contract changes

what should be removed:
Old direct RAG-to-LLM generation path.

Only after new path passes all tests.

consecutive changes:
Then old RAG prompt helpers can be removed if no other callers remain.

extra information on how to check if the change is made:
Run:

grep -R "buildRAGPrompt" electron
grep -R "queryMeeting" electron
grep -R "queryGlobal" electron
grep -R "streamChatWithGemini" electron/rag

Every remaining call must be intentional and documented.

SELF NOTE:
Never delete buildRAGPrompt until the search proves it has no required callers.


CHANGE 19:
REMOVE DUPLICATED INTELLIGENCE LAYERS

what need to be changed:
After the new engine is proven, identify duplicated responsibilities.

Candidates include:
- old ContextRouter logic
- duplicated prompt assembly
- duplicated retrieval decisions
- duplicate question resolution
- old direct RAG prompt paths
- duplicated answer planning
- duplicated generation state

which files need to be changed:
Potential candidates:
- electron/IntelligenceEngine.ts
- electron/intelligence/ContextRouter.ts
- electron/intelligence/ContextFusionEngine.ts
- electron/intelligence/PromptAssemblerV2.ts
- electron/llm/WhatToAnswerLLM.ts
- electron/context-intelligence/orchestration/orchestrator.ts
- electron/context-intelligence/generation/*
- electron/context-intelligence/question/*
- electron/rag/prompts.ts

what should be removed:
Only code whose responsibility has been completely transferred.

For every deletion:
document:
1. old responsibility;
2. new owner;
3. all old callers;
4. new caller;
5. tests proving equivalence;
6. reason it is safe to delete.

consecutive changes:
None unless new dependencies are discovered.

extra information on how to check if the change is made:
After every deletion:

npm run typecheck:electron
npm run typecheck:ts5
npm run build:electron
npm run build
npm run <focused intelligence tests>

Also perform repository-wide search for the deleted symbol.

SELF NOTE:
If a file still has multiple responsibilities after migration, do not automatically delete the whole file. Split responsibility first.


CHANGE 20:
MAKE THE NEW ENGINE THE ONLY PRIMARY INTELLIGENCE PATH

what need to be changed:
After all surfaces are migrated:

manual chat
meeting chat
global chat
live assistant
project questions
personal questions
coding
follow-ups
screen questions

should all enter the same conceptual intelligence pipeline.

The retrieval capability can differ.

The intelligence decision must not.

which files need to be changed:
Final integration:
- electron/IntelligenceEngine.ts
- electron/IntelligenceManager.ts
- electron/intelligence/engine/*
- electron/ipcHandlers.ts
- electron/context-intelligence/*
- electron/llm/*
- electron/rag/*
- renderer integrations if required

what should be removed:
All proven-dead duplicate intelligence paths.

consecutive changes:
Only optimization and feature work after this.

extra information on how to check if the change is made:
Run a repository-wide call graph search.

Every answer-producing surface must eventually converge on:

NativelyIntelligenceEngine
→ Context Plan
→ Evidence
→ Prompt
→ Provider
→ Stream

There should not be a second independent "brain" hidden inside RAGManager, WhatToAnswerLLM, IntelligenceEngine, or a renderer-specific path.

SELF NOTE:
This is the architectural finish line.


CHANGE 21:
FINAL INTELLIGENCE QUALITY / REGRESSION PASS

what need to be changed:
After migration, run the entire intelligence evaluation suite and compare behavior against the current baseline.

Do not judge success only by compilation.

Measure:
- correctness
- relevance
- context selection
- hallucination
- project grounding
- personal-data isolation
- response length
- response style
- latency
- first useful token
- provider fallback
- cancellation
- duplicate answer prevention
- retrieval frequency
- unnecessary retrieval
- prompt size

which files need to be changed:
Tests/evaluation only unless defects are discovered.

what should be removed:
No code should be removed during this change.

what should be added:
Evaluation cases for the new architecture.

consecutive changes:
Defect fixes become individual changes with their own tests.

extra information on how to check if the change is made:
Run:
- full typecheck
- build
- focused intelligence tests
- full intelligence suite
- packaging build
- manual smoke tests

Compare failures against the baseline.

Do NOT assume every pre-existing failing test is caused by the new engine.

SELF NOTE:
A green build does not prove intelligence quality.


CHANGE 22:
ONLY AFTER EVERYTHING ABOVE, DELETE THE OLD ARCHITECTURE

what need to be changed:
Perform the final cleanup.

Candidates:
- dead legacy prompt builders
- dead routing logic
- dead RAG-to-LLM paths
- unused adapters
- obsolete flags
- obsolete compatibility layers
- unused tests that exclusively protect deleted behavior

which files need to be changed:
Determined only after Changes 1-21.

what should be removed:
Only verified dead code.

what should be added:
Migration/deletion tests where necessary.

consecutive changes:
None.

extra information on how to check if the change is made:
For every deleted module:
- grep for imports;
- grep for symbol references;
- TypeScript compile;
- test suite;
- build;
- runtime smoke test.

Then inspect git diff.

SELF NOTE:
Do not turn this into a "delete everything old" operation. The objective is a smaller, cleaner architecture, not a smaller file count.


FINAL TARGET ARCHITECTURE
=========================

The final Natively architecture should conceptually be:

USER / TRANSCRIPT / SCREEN / CHAT
                |
                v
      NATIVE INTELLIGENCE ENGINE
                |
                v
       CONVERSATION STATE
                |
                v
        TURN UNDERSTANDING
                |
                v
         CONTEXT PLANNER
                |
        +-------+--------+
        |       |        |
        v       v        v
    Conversation RAG   Screen
    / Memory           / Files
        |       |        |
        +-------+--------+
                |
                v
           EVIDENCE PACK
                |
                v
         RESPONSE PLANNER
                |
                v
         PROMPT ASSEMBLER
                |
                v
           LLM ROUTER
                |
        +-------+--------+
        |       |        |
      Gemini   Qwen     Groq
        |       |        |
        +-------+--------+
                |
                v
       GENERATION CONTROLLER
                |
                v
             STREAM


IMPORTANT ARCHITECTURAL RULE:

RAG is NOT the brain.

RAG is a tool used by the brain.

The LLM provider is NOT the brain.

The provider generates the answer selected by the intelligence engine.

The transcript is NOT the brain.

The transcript supplies conversational information.

The renderer is NOT the brain.

The renderer displays the result.

The new Natively Intelligence Engine is the brain.


IMPLEMENTATION ORDER
====================

Do NOT give Copilot one giant prompt to implement everything.

Implement in this order:

1. Change 1 — baseline/dependency map
2. Change 2 — intelligence contracts
3. Change 3 — conversation state
4. Change 4 — transcript context
5. Change 5 — turn understanding
6. Change 6 — context planner
7. Change 7 — retrieval coordinator
8. Change 8 — evidence pack
9. Change 9 — prompt assembler
10. Change 10 — response planner
11. Change 11 — provider/generation boundary
12. Change 12 — generation lifecycle
13. Change 13 — activate new engine for manual chat
14. Change 14 — behavioral evaluation
15. Change 15 — meeting/live migration
16. Change 16 — project/personal/My Files migration
17. Change 17 — canonical RAG integration
18. Change 18 — legacy RAG answer-path removal
19. Change 19 — duplicated intelligence cleanup
20. Change 20 — single primary intelligence architecture
21. Change 21 — final evaluation
22. Change 22 — final deletion/cleanup


MOST IMPORTANT RULE FOR COPILOT
================================

Before modifying any file, Copilot must inspect the actual current file.

Never implement based only on:
- filename;
- previous conversation;
- old architecture documentation;
- reference repositories;
- assumptions.

For every change:

1. inspect current implementation;
2. identify callers;
3. identify dependencies;
4. identify tests;
5. make the smallest change necessary;
6. run focused tests;
7. run typecheck;
8. inspect git diff;
9. verify no unrelated subsystem changed;
10. only then continue to the next change.


PROTECTED SYSTEMS
=================

The following must not be changed as part of this intelligence rebuild unless a later change explicitly proves an integration change is required:

- SystemAudioCapture
- microphone capture
- native audio capture
- STT provider implementations
- native speaker/audio module
- packaging configuration
- macOS signing
- Electron native-module build logic
- Notes functionality
- unrelated renderer UI
- unrelated settings
- current provider credentials/configuration


THE BIGGEST THING TO REMEMBER
=============================

We are NOT building:

RAG + LLM + more routing.

We are building:

NATIVELY INTELLIGENCE ENGINE

The engine understands the user's request,
decides what context is necessary,
retrieves only what is necessary,
constructs trustworthy evidence,
decides how the answer should be shaped,
builds one final prompt,
chooses a provider,
streams one answer,
and handles cancellation/fallback safely.

Everything else is a capability underneath that engine.
```

</details>

## STAB-001 — Pre-Change-19 stabilization (owner-authorized 2026-11-08)

Dependency: implemented CHG-17/18; prerequisite to accepting readiness for CHG-19. No roadmap renumbering or gate relaxation. Owner-requested S1–S11 cover architecture, isolated full-product macOS, retrieval/profile correctness, generation reliability, all baseline failure identities classified or explicitly unresolved, React errors, measured local/real-provider latency distinction, available Windows checks, regression and data/Git safety. Scope excludes Change 19 implementation and protected native/audio/STT/packaging. Execution and evidence: TASK_TRACKER STAB-001 / WORK-0027.
