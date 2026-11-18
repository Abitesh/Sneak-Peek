# Sneak-Peek Roadmap 2.0

**Authoritative from 2026-11-18. Owner-approved in WORK-0084.** This plan adopts the product direction and scope proposed in WORK-0083 / TASK-0006. [Task tracker](chatgpt-work/TASK_TRACKER.md) · [Work history](chatgpt-work/CHANGE_LOG.md)

[Roadmap v1 archive](ROADMAP-v1.md) preserves CHG-01–23, their evidence, historical plans and unresolved acceptance results. CHG-21 and CHG-22 are retired as milestone gates. Their open work retains its recorded status under the owners below. New changes must pass the checks relevant to their own behavior and dependencies.

## Operating requirements

- Keep one canonical Intelligence Engine, with one plan, authorized evidence, one assembled prompt and one owned answer stream. Keep existing modes, RAG storage and provenance, persisted user data, provider choice and privacy controls.
- Preserve exact binding at the request boundary, bounded authorized fallback before commitment, STOP and supersession. Documents, screenshots and transcripts supply evidence. They cannot grant authority.
- Verify the actual renderer and the affected Electron IPC alongside compiled tests. Say explicitly whether evidence is synthetic, physical, local, hosted, macOS or Windows.
- Prioritize production defects wherever they affect the active work. Keep platform, device, model asset, paid API, packaging and distribution verification separate when those resources or permissions are unavailable.
- Keep source-available licensing and notices. Capture, credentials, databases and native systems should change only for an authorized, demonstrated need.

## High priority — Microphone and production reliability

**TASK-0007 / WORK-0084.** Maintain the immediate repairs for truthful permission UI, turn-scoped STT and live two-speaker captions. Keep the production backlog active alongside all product milestones.

| Responsibility | Acceptance |
| --- | --- |
| Live two-speaker captions and Listen lead-in | Authorized meeting transcription displays current mic and system text near the top of the overlay. When Listen starts, reuse the bounded recent text once without replaying PCM or starting extra background STT. Clear lead-in at Stop, Analyze, meeting and device boundaries. Ambient AI Chat keeps capture off until a Listen turn. Verify that both speaker names and recent interviewer context reach the owning turn and that old callbacks never reappear. |
| Stop → fresh Listen | Allocate fresh owner/request and provider instances across both audio channels. Stop discards pending audio, cancels or closes recognizers and rejects late results at the source and renderer. Analyze finalizes only the owning turn under a bounded wait and sends the authorized transcript to the canonical answer pipeline. Rapid cycles and delayed callbacks must pass. |
| Permissions, capture and provider readiness | Report actual OS results and distinguish missing/unknown/restricted permission, opened capture, bad device or zero samples, transcription configuration and provider activity. Recheck after settings changes. Keep ERR-113 physical silence diagnosis open until reproduced. |
| Device and speech robustness | Repeat grant/revoke, default/USB/Bluetooth switching, route loss, sleep/resume, silence and VAD/endpointer cases. Confirm PCM format and capture recovery without crossing identities or duplicating samples. Measure ready latency, ongoing CPU/memory and battery on representative hardware. |
| Speech-to-answer performance | Measure physical speech end → finalized transcript → Analyze → first and final visible answer. Record model readiness, retrieval, dispatch, network or inference, render and cancellation stages. Use approved content and scopes. |
| Other critical reliability | Track toolbar clipping under V2-03, provider recovery under V2-04, and factual, attribution and latency misses under V2-05. Native or platform work that needs external verification remains explicitly open. |

## macOS installer integrity — TASK-0009

Prevent ARM64 startup crashes caused by incomplete disk images (ERR-119). Size the image staging volume for the bundled runtime and models, finish nested signing before sealing the app, and reject an installer if its mounted bundle fails framework, architecture or strict signature verification. Launch the mounted app with a disposable profile before replacing the installed app. Verify the replacement in Applications and preserve the old bundle for rollback.

**ERR-120.** Keep startup permission checks passive. Persist dismissal of the setup guide across launches. Check microphone, screen capture and system audio separately. Verify that an eligible Core Audio fallback can be attempted under the OS System Audio Recording grant when the separate screen check is denied. The Audio settings meter must exercise the selected route. Record any macOS reauthorization required for a new locally signed build.

## Desktop CI and subprocess reliability — TASK-0010

Prove that the two-slot local code runner closes subprocess output and removes each owned temporary directory on success, execution error, timeout, output overflow and cancellation. Treat cleanup failure as a reported execution error. Keep the test independent of other processes' temporary directories and exercise parallel workers without reducing the CI matrix.

Keep startup and capture verification separate from fixture compatibility. Confirm portable Windows capture fixtures reach their assertions, report the actual Windows Electron result even when its job remains advisory, and bound the real-model test's teardown so a failed fixture cannot stall the matrix. Record installed macOS and new ARM64 bundle results separately from isolated screen and STT regression tests. WORK-0087 verified the local full macOS suite, fresh ARM64 startup and the installed Core Audio meter on Default Speakers. The patched hosted matrix, physical speech, separate screen grant and Windows GUI remain open.

## Release ownership and branding — TASK-0011

Configure update metadata, release notes, manual download links and release validation for Abitesh/Sneak-Peek. Require an explicitly configured and verified destination for Drive upload. Preserve existing settings and signing compatibility. Verify built updater metadata and a real release when available. Audit separately the existing speech relay and other service dependencies before replacement.

## Application icon refresh — TASK-0008

The owner supplied the official icon for macOS, Windows and Linux. Verify the generated multi-resolution assets, runtime paths and actual Apple Silicon application bundle. Windows and Linux installed appearance remain platform checks.

## V2-01 — Dedicated Answer Modes

**First product milestone · Planned.** Give each new mode a stable identity and explicit context policy using the existing mode registry, settings, ContextPlanner, RetrievalCoordinator and ResponsePlanner. Coding / DSA and CS Fundamentals use the selected model and permitted turn input with zero private retrieval. Resume & Projects attempts scoped, authorized retrieval each turn, including follow-ups, and reports missing support honestly. Preserve General and Technical Interview’s existing mixed behavior and saved settings.

**Acceptance.** Verify existing-profile upgrade and relaunch, mode switching with revoked and decoy sources, zero private reads and outbound leaks in no-RAG modes, file/page/revision provenance in Resume & Projects, concise CS explanations, executable coding cases in Python and one alternative language, model pinning, STOP and supersession. Use routed manual chat and relevant live/IPC controls. Track actual external coverage separately. The accepted canonical seams are available for implementation. No retired milestone is a prerequisite.

## V2-02 — Session Preparation

**Planned.** Reuse Launcher, Notes, mode settings and the current document/meeting stores. Add session types, drafts and four labeled cards for Session & Role, Sources, Model & Language, and Answer Preferences. Include company, role, interview round, job description, résumé, authorized projects/documents, answer and transcription languages, style, length, coding language, user instructions, opt-in automation, capture and retention. A session type sets defaults. A mode governs the answer and retrieval policy.

**Acceptance.** Verify create/reopen/edit/start, existing meeting and Notes preservation, accurate source readiness, no capture from drafts, revoked/denied/failed source handling and cross-session isolation. Keep global settings by default. Depends on V2-01 policy contracts.

## V2-03 — Responsive Desktop

**Planned.** Fix the clipped toolbar first. Then support reliable moving and two-axis resizing, compact and expanded layouts, visible essential controls, readable messages and stable composer. Reuse existing window bounds and appearance infrastructure. Preserve draft, scroll, focus, shortcuts and stream ownership during layout changes. Integrate the V2-02 session navigation. Keep Notes reachable.

**Acceptance.** Test macOS and supported Windows display configurations, small and large windows, edge and multi-display placement, display changes, zoom, long translations, keyboard and screen reader controls, flicker, click targets, and STOP while resizing. Independently verified toolbar repairs can ship before the larger redesign. ERR-115 remains open.

## V2-04 — Models and Provider Health

**Planned.** Add up to three ordered favorite chat models per configured provider and a full selector. Reuse the provider allow lists, app-owned health checks and request snapshots. Report configured, advertised, verified, stale and unavailable route states and capabilities. Show exact selected and actual answering bindings. Use documented scoped quota data or clearly labeled estimates. Do not invent remaining balances.

**Acceptance.** Round-trip favorites and preferences through relaunch, keep in-flight binding pinned, switch only on new requests, and reject unsupported image or unauthorized fallback routes. Test auth errors, invalid/missing model, rate limit, explicit quota, 503 and timeout, bounded retry and stale cache. Require synthetic recovery and applicable authorized text/vision verification. Depends on session config and usable picker UI. ERR-112’s app-level repair remains evidenced, while external availability and fresh recovery timing remain open.

## V2-05 — Intelligence Quality, Speed and Cost

**Planned.** Improve actual retrieval, attribution, correctness, latency and token use using the existing canonical stores and evaluation suites. Design deterministic turn triage and duplicate suppression first. Consider small background models only after measured quality gains, privacy review, resource and usage budgets. Keep default idle generation calls at zero.

**Acceptance.** Preserve the frozen and expanded benchmarks, previous misses and relevant negative assertions. Compare factual reviews with the original rubrics. Count denied and stale evidence, citation correctness, missing-evidence decisions, repeated turns and latency by stage. On the approved healthy ready workload require ≥90% factual quality, p95 ≤2 s useful visible text, and a complete useful final within 6 s. Separate cold readiness and uninterrupted cold results, cloud recovery, post-STT Analyze and physical speech-to-paint. Report actual misses and applicable external coverage. No threshold change without evidence and explicit approval.

## V2-06 — Practice and Session Review

**Planned.** Add text-first practice with deterministic questions, optional authorized feedback, and review of saved notes or transcripts. Reuse session state and the existing canonical action pipeline. Mark hypothetical examples and separate feedback from supported facts.

**Acceptance.** Preserve practice and meeting state across relaunch. Keep question-bank use available without audio or cloud calls. Respect saved scopes, selected provider and retention. Validate optional feedback and missing-evidence responses. Depends on session/mode and quality/cost contracts. Voice interviewer and external job integrations need separate scope and evidence.

## Retired milestone work and ongoing maintenance

| Historical record | Active owner and next evidence |
| --- | --- |
| CHG-21 / TASK-0004. C21-AC1 passed locally. C21-AC2 remained open. | V2-05 carries ERR-102 ambiguous meeting attribution, ERR-104 ready/cold latency and ERR-110 Listen factual precision. Repeat frozen, expanded and visible workload cohorts. The microphone track carries physical STT timing and ERR-113 intermittent silence. |
| CHG-22 / TASK-0005. Scoped dead screenshot cleanup verified locally. Full C22-AC1/AC2 remained open. | Maintenance backlog, ERR-114. Migrate the legacy manual body’s source assertions to current production privacy, grounding, provider and lifecycle behavior before retrying deletion. Audit callers, IPC, data and rendered equivalence per removal. Keep exposed compatibility and shared transports until their replacements and users are proved. |
| CHG-23 / C23-AC1–6 and FEAT-003/004 | V2-01 owns the mode deliverables and related acceptance. Historical dependency ordering is retired. |
| ERR-115 toolbar clip | V2-03. Fix reachability independently of native window resizing and verify at affected display sizes. |
| ERR-116 permission/STT copy, ERR-117 stale Listen, ERR-118 permission display | TASK-0007. Track corrected local behavior and required owner/production device checks in the error log. |
| Previously untested Windows GUI, paired Phone Mirror, real credentialed text/vision, packaged launch, hosted Build Smoke | Keep as separate platform/release/maintenance verification in the existing tracker. Local or synthetic results do not verify those environments. |

Historical measurements and supported prior results remain in the [quality evaluation](scripts/audit/chg21-quality-evaluation.md), [surface map and cleanup audit](scripts/audit/chg20-surface-map.md) and [error log](chatgpt-work/ERROR_LOG.md).
