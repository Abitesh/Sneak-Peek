# Sneak-Peek — error and investigation register

## ERR-118 — App permission controls can disagree with macOS grants (2026-11-18)

WORK-0084 / TASK-0007. Owner screenshot showed enabled macOS Screen & System Audio Recording for Electron and microphone access for launch hosts. The running development Electron process independently reported both grants, opened the real microphone and forwarded 16 kHz PCM. No system reset or permission change is justified by that evidence. The compact permissions card writes synthetic granted/denied states on user clicks. A grant warning can also remain visible after a later successful check. Keep those UI issues separate from physical silence and STT availability.

**WORK-0084:** Both onboarding cards use refreshed OS results and reject out-of-order checks. The compact card no longer simulates permission toggles. The overlay rechecks permission warnings and keeps hardware/recognizer issues separate. Actual process-level grants were observed. A post-relaunch owner confirmation of the warning UI is pending.

## ERR-117 — Listen after Stop can accept old transcription (2026-11-18)

WORK-0084 / TASK-0007 / Reliability track. Owner reported stale text after Stop → Listen. Source inspection confirmed Stop called the same finalization IPC as Analyze, kept meeting-wide STT running, and the renderer used an unscoped recording flag to accept subsequent callbacks. Analyze could also consult meeting-level history by callback time rather than Listen ownership. The planned correction is fresh provider/request ownership and distinct Stop and Analyze boundaries. Owner confirmed the immediate Stop → Listen reproduction no longer inherits the old turn. WORK-0084 rebuilt desktop proof also verified old recognizer, wrong sender and queued renderer result rejection. Physical two-speaker lead-in on the final revision remains pending.

## ERR-115 — Overlay toolbar clips the right-hand model control (2026-11-17)

WORK-0083 / TASK-0006. Reproduced on macOS in the installed development renderer with the isolated profile and synthetic transport. The default overlay screenshot shows only the left edge of the top model control. The lower model picker and composer remain visible. TopControlBar uses a single horizontal scroll row with nonshrinking controls, inside a deliberately fixed-width overlay. The reported whole-window and top-edge failures still need reproduction on the original display setup.

**Status: Not fixed.** Capture logical bounds, display work area and control rectangles on affected configurations. Verify that core controls are reachable without horizontal scrolling at supported sizes and that compact/expanded layout changes preserve STOP, focus and composer access. Synthetic screenshot: /Users/abitesh/Downloads/Sneak-Peek-Roadmap-2.0.fo16xZ/overlay.png.

## ERR-116 — Microphone and transcription banners disagree (2026-11-17)

WORK-0083 / TASK-0006. The same isolated launch forced macOS media permission denial and configured no STT provider. The renderer displayed Microphone Blocked and a separate Transcription Not Configured notice whose copy says the microphone is ready. The STT banner is independently gated and its copy is unconditional. This finding concerns UI state and does not establish the original physical silence cause in ERR-113.

**WORK-0084:** Removed the false microphone-ready text from the STT configuration banner. The rebuilt disposable renderer passed permission denial, grant and revocation with configuration distinguished. Actual hardware/device repeat remains in TASK-0007.

## ERR-114 — Whole manual-chat legacy deletion invalidates source-based checks (2026-11-17)

WORK-0082 / TASK-0005 / CHG-22. A trial removed only the unreachable portion of the registered manual handler (96 AST statements after an always-true terminal block) while preserving the canonical route, sender ownership and setup catch. The explicit IPC/ProcessingHelper reference sweep failed 142 of 1677 tests. The same sweep on the baseline failed 7 of 1677. These failures include layout pins and assertions for earlier security, evidence, cancellation and provider behavior. Runtime reachability and test migration are separate proofs. Restore the manual trial before delivering the independent screenshot cleanup. Classify the failures by test and remap each applicable invariant to the canonical owner before deleting the whole branch. The broader sweep includes nonstandard suites and fixtures; the usual regression commands remain required.

**Trial reconciled:** Final scoped tree 1670/1677 passed, with the identical seven baseline failures in the broadened sweep. Baseline failures include old optional OKF/premium assertions and absent authored E2E fixtures. They are outside the standard four suites. The 135 added failures only exist in the restored full-deletion trial. The failures are listed by test and location in `/Users/abitesh/Downloads/Sneak-Peek-WORK0082.dlEgYk/err-114-inventory.tsv`. Keep ERR-114 open for full manual-body cleanup even though the scoped removals introduced no new failures.

## WORK-0082 — CHG-21 follow-up on ERR-102, ERR-104 and ERR-110

- ERR-102: 15/15 newly reviewed real local-model global cases preserved matching meeting identities and reasons, with the narrow lookup staying narrow. Keep the previous inconsistent run in the record.
- ERR-104: Open. Genuine unloaded global first useful/final visible 5115/6157 ms. Prepared global p95 reached 2187 ms. A separate resident global batch passed. Resident Analyze reached 3717/4965 ms with injected transcript. Source stage evidence separates startup, provider latency and renderer overhead. Accepted workloads keep both numerical thresholds.
- ERR-110: Open. Latest resident Listen generation still misstated the capacity definition. The synthetic lifecycle succeeded and the factual quality check failed.
- ERR-112: Previously verified for authorized live fallback. Fresh controlled fallback worked at the actual desktop boundary. Live Gemini availability and cloud recovery timings were not re-exercised.
- ERR-113: Previous physical transcript and Analyze evidence remains valid at its scope. This run injected STT events and did not retest physical timing or diagnose earlier silence.


## ERR-112 — Owner's saved provider route fails before first token (2026-11-17)

WORK-0081 / TASK-0004. Owner observed both a greeting and a general technical question fail in the real app. Requested route reported `gemini_flash` and `maxAttempts: 3`. Determine actual configured/eligible attempts, transport and response classification, then verify with synthetic questions in the owner's selected route. Provider response data and credentials must stay private.

**WORK-0081: Verified resolved for the application's fallback and error-delivery defect.** Real Gemini 3.5 Flash requests returned HTTP 503. The alternative returned HTTP 400 or a status-less SDK error in the instrumented baseline. Exact original Groq rejection parameter is unknown. Source confirmed that the candidate builder used the first catalog model regardless of the live probe and canonical Groq could switch models inside transport. The corrected path uses the exact verified streaming binding, avoids an internal retry/model ladder and bounds each supported hosted text attempt before first output. Real greeting and DBMS questions completed after repair while the saved Gemini model stayed selected. Direct Gemini availability is still external. Sanitized failures distinguish auth, quota/rate limiting, request rejection, unavailable model and timeouts. See the [production evidence](../scripts/audit/chg21-quality-evaluation.md#work-0081--production-chat-recovery-and-physical-microphone-2026-11-17).

## ERR-113 — Owner's microphone feeds near-zero PCM before speech recognition (2026-11-17)

WORK-0081 / TASK-0004. Owner reported zero-filled chunks over 12 s, RMS 0.00 and no transcript. Distinguish macOS input level, permission and launch identity, device selection, DSP/capture, STT and the renderer handoff. A zero-fill warning supplies a symptom; TCC denial, device mute and capture defects remain hypotheses. The owner has authorized the ordinary macOS/real-app test flow.

**WORK-0081: Intermittent or environment-dependent; successful live verification, original cause open.** After macOS granted access, the user spoke the test question in the normal app. The native input was nonzero, STT processed at 16 kHz, the transcript appeared, and Analyze reached a correct final answer. The initial zero-filled signal did not recur during that spoken trial. An idle warning and a separate Analyze without a verified speech input do not establish capture failure. No native or STT code was changed. Physical repeatability and STT-to-paint timing remain open. See the [production evidence](../scripts/audit/chg21-quality-evaluation.md#work-0081--production-chat-recovery-and-physical-microphone-2026-11-17).

## WORK-0081 — CHG-21 issue reconciliation

- ERR-102 and ERR-110 remain open at their prior real-model completeness and precision scope. The two frozen model evaluations and the successful physical bounded-queue turn exercise different scenarios from the failed rendered trials.
- ERR-104 remains open. Model loading was 3824 ms on the genuinely unloaded first case, which reached first useful text in 4567 ms. Earlier visible cold-global and resident Listen overruns remain recorded. Physical STT-to-paint is still unmeasured.
- ERR-103's scoped factual correction and ERR-111's scoped request-ownership correction retain their verified dispositions. Fresh factual and desktop repeats support those dispositions. The French rubric mismatch is retained.
- The WORK-0079 historical reconciliation and WORK-0080 dispositions still govern older open records. Current suites reaffirm the exercised source scopes and lifecycle checks, including ERR-076, while hosted Build Smoke, installed/native behavior, live Hindsight, Windows GUI, paired Phone Mirror and untested external provider scopes remain separate. Successful verified Groq text fallback gives partial credentialed coverage for the owner profile only.

## ERR-111 — Rendered repeated-Enter completion was not observed in one desktop run (2026-11-17)

WORK-0080 / TASK-0004. The later prepared rebuild completed all five model search observations. In the following repeated-Enter scenario, it issued one request, sent both expected chunks and one completion, and returned success. The fixture never saw the second chunk's text in the renderer. The two earlier two-launch runs covered the same repeated-Enter behavior successfully. Add failure-only renderer state and event capture and repeat before attributing this to app lifecycle or the fixture. Independent Copilot Ask identified a separate source-proven race: a closed global query's finally block can reset the shared buffer and busy flag after a replacement query starts. Reproduce this exact ordering with the actual renderer callback and mirror the meeting overlay's ownership guard. The connection to the one failed desktop attempt is unproven.

## ERR-110 — Listen/Analyze real-model fixture returned an irrelevant and ungrounded answer (2026-11-17)

WORK-0080 / TASK-0004. Using real renderer controls, two injected finalized English turns asked how a bounded queue works and requested a small example. The compiled selected-model stream returned a repetitive transliterated Hindi description with no capacity constraint. The real-model acceptance failed its capacity assertion. Preserve the exact fixture and failed output. Inspect the final production prompt and how the current Analyze input carries interviewer question, user formatting request, and language. Physical STT was not used.

After shortening the Auto instruction, two real-model rendered runs answered in English. One defined the fixed capacity correctly but omitted the requested tiny example. Another described a limit on the total amount added or removed instead of the number held at once. Both passed keyword assertions. The response planner's example signal does not recognize “use a tiny example”. Verify a small-example response instruction with the captured prompt and the original controls. Keep previous failing artifacts.

## ERR-109 — Opt-in prepared global search stalled behind synthetic startup summaries (2026-11-17)

WORK-0080 / TASK-0004. Production preload succeeded in 2812 ms. The prepared desktop run then timed out before visible text. The harness kept the shared helper's local fallback enabled while startup's synthetic demo-meeting jobs were running. These long summary requests saturated the deterministic single-runner endpoint and the global stream hit its existing stall guard. Isolate the readiness probe from unrelated scheduled demo summaries and retain the failed run separately. Investigate applicability to ordinary app startup before making a production change.

## WORK-0080 continuation of ERR-103 and ERR-104 (2026-11-17)

The fresh WORK-0079 build again attributed a decision's reason to the reporting speaker despite evidence containing only the decision. The global prompt had asked the model to attribute a reason on every match. A freshly unloaded model took 3824 ms to load and 4487 ms to produce the first five characters on the first case, although p95 over the mostly resident workload was 1132 ms. Existing Ollama warmup decodes legacy prompt text and pins weights indefinitely. Both meeting overlays still contain a 100 ms pre-dispatch timer. Record the prompt repair, a bounded content-free selected-model warmup, and dispatch measurements against the existing privacy and lifecycle tests.

## ERR-108 — Generic interview preparation receives a missing meeting-evidence policy (2026-11-17)

WORK-0079 / TASK-0004. The independent reading of the repeated local-model outputs found a raw rubric pass that conflated recency and frequency. The case asked how to explain a technical concept “in an interview”. Compiled traces classified the generic situation as a meeting fact and added the unrelated missing-evidence instruction. Remove the indefinite interview phrase from that one heuristic's input while preserving the current question and factual interview-transcript routing.

## ERR-107 — Initial project-snapshot guard blocked unrelated image continuity (2026-11-17)

WORK-0079 / TASK-0004. The first two-launch acceptance stopped at the actual image preload stream. A generic image-description prompt has an empty inferred project lookup scope from its “Describe” opener; the narrow image route still needs its explicitly authorized history. Require a selected image and absence of a factual grounding requirement before allowing that snapshot on an empty project scope. Preserve exclusion when the project IDs restrict an actual project request. Keep the original typed attachment and history assertions.

## ERR-106 — Explicit portfolio loses authorized tagged project files (2026-11-17)

WORK-0079 / TASK-0004. After exact-project continuity and the renderer reset check passed, the existing full-product portfolio scenario returned only résumé facts. It planned `project_knowledge` but made no storage read. The active request supplied no project IDs for an explicit portfolio search, and the adapter correctly rejects a missing allowlist. Enumerate the current tagged project IDs for this explicit scope, preserve the adapter's pre-read denial and exact named/empty scope semantics, and use the authorized profile source instead of prior mixed answers for résumé projects.

## ERR-105 — Desktop named-project follow-up requires an unrelated résumé (2026-11-17)

WORK-0079 / TASK-0004. The rendered full-product fixture ingested exact synthetic Linkship and Linkship Legacy files. Both direct Linkship turns retrieved the expected reason. The immediate completed-session question “Why is Redis used in your project?” selected no evidence. The captured provider prompt had `owner="clarify" outcome="source_unavailable"` under the default mixed mode. Canonical source resolution treats the possessive project as a profile-family request but checks only résumé availability, even when the authorized request has exact project IDs. Preserve mode grants and source labels while evaluating a separate project-only availability signal. Prove clear-history, strict-mode, résumé-only and general-CS denial paths.

The second rendered run recovered the exact scoped follow-up and then reopened **ERR-045** at the next sibling switch. The sole authorized evidence item was from Linkship Legacy, but the untyped manual session snapshot still forwarded the older project's reason. The prior fix covered structured conversation rendering. Apply the existing exact/empty project scope exclusion to the untyped snapshot as well, while preserving its authorized use in ordinary conversation and explicit actions.

## ERR-103 — Local factual answers can pass the rubric despite an incorrect definition (2026-11-17)

WORK-0079 / TASK-0004. The WORK-0078 real-model artifacts exhibit an incorrect priority-queue label for FIFO and an incorrect stack/queue comparison. The original FIFO rubric checks for ordering words, so its pass cannot settle factual correctness. The French LRU case also requires reviewing meaning independently of its expected phrases. Reproduce with the unchanged fixtures, assess real answers, and evaluate generic factual guidance without hardcoding definitions or weakening checks.

## ERR-104 — Repeated local response times exceed CHG-21 budgets (2026-11-17)

WORK-0079 / TASK-0004. WORK-0078 reached 2.052 s first-useful p95, a 6.887 s engine response dominated by decode, and 6.268 s action-to-paint for a fully attributed saved-meeting answer. Repeat against the installed model, distinguish warm and cold latency and the stages actually observed, and retain misses. The full Listen/Analyze path remains a separate measurement gap.

Source inspection found an unconditional 200 ms cosmetic pre-dispatch wait in both meeting overlays. The earlier global desktop evidence spent about 307 ms between Enter and IPC. Remove the cosmetic wait while preserving initial-open cancellation, request ownership, and listener installation before IPC. Longer completion misses also occurred during model decoding and need separate measurement.

## ERR-102 — Global answer loses meeting attribution across two matching records (2026-11-17)

WORK-0078 / TASK-0004. After fixing query pollution, one source read returned both authorized meetings. Across three real-model rendered runs the model reported only one reason with no meeting title. One response misattributed the claim to ContextPlan. The exact titles were buried in serialized internal provenance. Present global meeting title and speaker as concise source fields, keep internal provenance in the evidence pack and instruct the model to report each independently relevant match. The first all-meetings variant removed the saved-meeting fallback provenance marker and dropped citation from the single-meeting model fixture. Keep the single-meeting prompt and fallback markers intact. The first focused check of the narrowed global branch also failed because the test builder discarded retrievalScope. Forward the scope in the fixture and retain the title, speaker, and provenance assertions.

WORK-0079: Putting stronger attribution before the question still produced three incomplete ambiguous answers. Removing model-visible ranking scores alone also omitted the second record. A loopback diagnostic using the actual captured prompt covered both matches when the factual output requirement followed the evidence. Only that variant also retained the narrow answer for the specific question. The implementation keeps ranking and provenance in the evidence pack and keeps identical text separately attributable across different meetings.

## ERR-100 — Global meeting lookup treats answer formatting as evidence terms (2026-11-17)

WORK-0078 / TASK-0004. Three real-model macOS global overlay trials used “According to the meetings, which one selected violet leases, and why? Reply in one sentence.” The local transport completed in 844–1394 ms, but the scoped meeting reader returned zero rows. The known meeting chunks contain the decision and the reason. The existing strict-majority lexical gate receives the response wrapper as factual terms. Remove only explicit meeting wrappers and narrowly matched answer-length suffixes at the canonical retrieval-query boundary. Preserve the verbatim current question, single source read, scope, scores and storage. Reuse the same desktop question in the rerun.

## ERR-101 — Retrieved OCR prompt text quoted an unrelated directive (2026-11-17)

WORK-0078 / TASK-0004. After the Spanish OCR route fix, the actual local model identified the permission error but quoted the synthetic directive from the OCR. Image policy covered pixels; rendered screen text lacked adjacent use instructions. Apply data-only guidance at the screen-text section and recheck the unchanged expanded case.

## ERR-099 — Explicit non-English screen reference drops available OCR (2026-11-17)

WORK-0078 / TASK-0004. Expanded local evaluation asked about “el error en mi pantalla” with OCR attached. The canonical planner chose no screen evidence, and the model guessed generic causes instead of explaining the visible permission error. The screen detector recognized only English. Add explicit Spanish, French and German references, preserving the existing screen-attachment and permission requirements.

## ERR-097 — Denied conversation can influence the provider-facing question (2026-11-17)

WORK-0078 / TASK-0004. Compiled negative case: same-session stored conversation resolved “that queue” to a synthetic private topic before the planner respected the denied conversation permission. Even with no rendered conversation section, the rewritten current question carried the topic. Guard stored context before understanding, including cancellation.

## ERR-098 — Explicit follow-up drops an authorized snapshot without a stored referent (2026-11-17)

WORK-0078 / TASK-0004. Fresh local evaluation kept the follow-up failure. The Follow-up surface had a supplied snapshot and an understood referential question; the general-question branch did not select recent conversation, so the model could not see it. Reproduced through the actual compiled engine. Preserve source permissions and reference-only treatment.

## ERR-096 — Manual lifecycle fixture can match a previous scenario in conversation history (2026-11-16)

WORK-0077 / TASK-0004. Final desktop rerun failed before cancelling: the STOP request completed and the fixture did not observe its pre-STOP token. The transport selected the first marker anywhere in the final prompt, so a retained previous request could select the wrong mock behavior. Read the marker only from the canonical current-question section. Wait for observed pre-STOP text and terminal events instead of relying on invoke completion ordering.

## ERR-095 — Model misreads raw meeting timestamp as elapsed seconds (2026-11-16)

WORK-0077 / TASK-0004. Real local baseline named the correct meeting and speaker but called a raw 42000 locator “42,000 seconds”. The first CHG-21 iteration still printed the raw value. Meeting adapters may supply elapsed or epoch milliseconds. Record the raw values internally, but omit those machine locators from model-visible provenance and request only human-readable time already present in the evidence. Verify that original typed evidence is preserved and the cited meeting and speaker remain correct.

## ERR-094 — Local model repeats an instruction embedded in document evidence (2026-11-16)

WORK-0077 / TASK-0004 / CHG-21. Synthetic real-model baseline returned both requested facts (JWT/EdDSA) and an unrelated imperative canary from the same document chunk. The existing system data-only instruction prohibited following directives but did not explicitly prohibit quoting unrelated directives as answer facts. Add a narrow relevance policy adjacent to the serialized evidence. Recheck the exact same fixture and record residual outcomes.

## ERR-093 — Retrieved but nonfactual rows suppress the missing-evidence instruction (2026-11-16)

WORK-0077 / TASK-0004 / CHG-21. Reproduced in the compiled canonical behavioral suite. A document adapter returns a referent-only row. The assembler removes it correctly, but the engine used the raw retrieval count to decide whether to warn of missing evidence. The same mismatch applies to blank or sanitized-away rows. Base the instruction on successfully rendered authorized factual evidence, including the separately authorized email form input.

## ERR-092 — Desktop paint wait can outlive its scenario (2026-11-16)

WORK-0077 / TASK-0003. During the strengthened run, manual STOP passed and the first meeting close completed, then the run stopped progressing before the next recorded scenario. The two-animation-frame wait was unbounded and depended on Chromium foreground scheduling. Disable background throttling in the disposable test window, and bound the paint wait with a diagnostic timeout so failure cannot be reported as a screenshot pass.

## ERR-091 — Manual STOP desktop test ended observation before provider release (2026-11-16)

WORK-0077 / TASK-0003. The existing scenario proved cancellation settled while generation was parked, but detached preload listeners before the provider could attempt its late token. Preserve that assertion and add a post-release observation through a new completed manual request. This is a verification gap.

## ERR-090 — Blind non-code screenshot unexpectedly inherits prior answer (2026-11-16)

**WORK-0076 / TASK-0003 / CHG-20.** Owner post-WORK-0075 macOS `test:node-runner` has 8,966 cases / 8,898 pass / **1 fail** / 67 skip / 0 cancelled. Exact failing test: `electron/llm/__tests__/suggestionPromptAssembly.test.mjs:273`, “WhatToAnswerLLM assembles runtime intent, prior responses, and screen context as user content.” The emitted untrusted user message contained an escaped `Prior <answer> & phrase` as `<previous_responses>` although the unqualified screenshot was supposed to be answered from fresh screen evidence, and lacked the repeat-press directive.

**Source-confirmed cause:** WORK-0075 correctly tightened `isPromotedScreenCodingTurn` to avoid falsely coding a screenshot with readable *non-code* OCR (“stack trace says permission denied”). The retained compatibility `WhatToAnswerLLM.generateStream` accidentally used that *coding promotion* predicate as the unrelated *blind-screen repeat* predicate for prior-answer exclusion and repeat instructions. A valid non-code screen is blind but not coding; the two policies must be independent. This is a newly exposed compatibility regression, not evidence of a second active CHG-20 provider pipeline.

**Prepared repair (Mac verification pending):** Identify an image/DOM/OCR screen without a resolved question separately from coding promotion. Preserve the existing coding repeat contract when promoted; give other blind screens a neutral repeat-press directive and omit stale prior responses from prompt, optional V2 context/fusion, and the transport `profile_history` scope. Keep requested questioned-turn history and coding promotion rules unchanged. Extend the existing *behavioral* regression to assert the generic, non-code directive without relaxing history exclusion. Source/JS checks and patch applicability must be recorded separately from the owner's compiled Electron test result.

**Status:** Repair prepared, owner `npm run test:node-runner`, `npm test` and desktop post-patch confirmation PENDING. C20-AC2 remains pending; do not report CHG-20 Verified until current-tree evidence is complete.

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

## ERR-057 — Full-app acceptance rejects intentional broad portfolio retrieval (2026-11-09)

WORK-0041 / TASK-0002 / CHG-19 verification. Existing isolated macOS harness reaches 14 scenarios then fails because “What projects have I built?” includes the two authorized project-tagged files as well as résumé project facts. Evidence: /var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/sneak-stabilization-T1aKps/scenarios.json and failure.txt. Current committed ProjectOverviewIntent, ContextPlanner and StabilizationPortfolioRetrieval.test.mjs explicitly require tagged-project + résumé retrieval for that question. Confirmed stale harness exclusion, not established production leak and not caused by cancelledResult refactor (request not cancelled). Before repair: retain exact-name exclusion assertions; replace only broad-portfolio exclusion with positive expected project facts and exact allowed project IDs; add unrelated general-file canary exclusion. No production authority change. In progress.

ERR-057 follow-up: first corrected run reached all 15 scenarios but its new positive regex incorrectly required adjacent project facts, while the deterministic transport legitimately included other authorized profile fields between them. Split into three independent fact assertions; keep original-ID equality and unrelated-file exclusion. Evidence: sneak-stabilization-W2rz1X/failure.txt. This was a verification assertion mistake, not a production change.

## ERR-058 — Intelligence queue test's fixed sleep is insufficient under concurrent load (2026-11-09)

WORK-0041 verification. /tmp/chg19-intelligence.log: HindsightMemory.test.mjs “enqueue returns immediately and drains in background” sees ['a'] instead of ['a','b'] after sleep(40); duration145ms. Full npm test/native inference and app harness were concurrently executing. Test uses two sequential sleep(5) callbacks and a fixed40ms wait, so scheduler delay can allow the assertion before the second callback. Scheduling cause is a hypothesis pending idle rerun; no evidence the cancelledResult consolidation touches this queue. No memory subsystem rewrite or assertion weakening. In progress.

ERR-048 / WORK-0041 verification follow-up: after fixing ERR-057, the full-app run exited0 with 15 DOM-visible results, but visual review of sneak-stabilization-zEbCvj/answer.png showed the final reveal still incomplete. Existing barrier ran before the reveal-completion wait. Added a second two-frame barrier after the actual visible-text condition; no renderer behavior changed. Final image reinspection pending.

### WORK-0041 continuation / ERR-057–058 verification disposition (2026-11-09)

Owner-uploaded harness now includes corrected broad portfolio policy checks (authorized tagged projects, exact IDs, unrelated general-file canary), plus a second paint barrier after final DOM text. ERR-057's harness mismatch has a proposed correction but the final painted screenshot and Mac end-to-end rerun are **not agent-verified here**. Do not loosen exact named-project isolation. ERR-058 currently includes fixed 40/30ms sleep assertions that can fail under scheduling load; a **test-only proposed patch** waits for the observable queue outputs with a 1500ms upper bound and preserves exact ordering assertions. Runtime queue implementation is unchanged. Rerun on the owner's Mac without overlapping test suites before marking ERR-058 resolved.


## ERR-059 — Pre-cancelled follow-up reports inconsistent question metadata (2026-11-10)

**Related:** CHG-19 / TASK-0002 / WORK-0042. **State:** Source-confirmed inconsistency; small patch prepared, Mac regression pending. The prior read-only Copilot review is a lead, not a substitute for inspecting the source. In `electron/intelligence/engine/SneakPeekIntelligenceEngine.ts`, `cancelledResult()` previously computed its response plan from `cancelledUnderstanding.question || resolvedQuestion` but returned raw `this.resolveQuestion(request)` as top-level `resolvedQuestion`. With a stored conversation referent, `understandTurn()` can expand "Give me its code." into a follow-up anchored to the earlier topic, creating mismatched public metadata on an already-aborted request. This is not evidence of unauthorized retrieval or provider generation.

**Proposed resolution:** compute one `cancelledUnderstanding.question || this.resolveQuestion(request)` and reuse it for both the response plan and top-level `resolvedQuestion`; preserve the intentionally empty cancelled prompt, evidence and retrieval plan. Add a seeded-session test asserting an actual referent resolution, question consistency, request/trace identity, zero retrieval/generation and a cancelled lifecycle. **Verification:** JavaScript test syntax can be checked outside Mac; full Electron test and final acceptance are not claimed until owner execution. No legacy module was deleted.

## ERR-060 — macOS GitHub Build Smoke: BGE reranker tokenizer is a Git LFS pointer (2026-11-10)

**Scope:** CI-MAC-001, separate from CHG-19. **State:** Diagnosed, unresolved; macOS first, Windows intentionally deferred at owner's instruction. The attached full macOS `npm test` step from GitHub Actions run 42622632335 (commit `9e19e964`) reports **9,056 tests; 8,973 pass, 1 fail, 82 skipped**. The one failure is `electron/rag/__tests__/LocalRerankerModel.test.mjs` around lines 40–46: `ranks a relevant passage above an irrelevant one` -> `AssertionError [ERR_ASSERTION]: bundled reranker should load` (`actual:false`, `expected:true`). Earlier in the same log, `LocalReranker` reports `missing/invalid tokenizer.json (possibly a Git LFS pointer)`. The subsequent smoke run 42631802303 (commit `3e37608c`) also fails its macOS Electron-unit-test stage on this same test.

**Confirmed evidence and mechanism:** `resources/models/Xenova/bge-reranker-base/tokenizer.json` is declared LFS-managed by `.gitattributes`. Its GitHub repository-content representation and the owner-supplied resources ZIP contain a **133-byte Git LFS pointer** starting `version https://git-lfs.github.com/spec/v1`; the pointer advertises a real 17,098,079-byte tokenizer. `electron/rag/RerankerAssetPreflight.ts` correctly rejects pointer files, so `LocalReranker.isAvailable()` returns false rather than running invalid inference. `LocalRerankerModel.test.mjs` decides to run based only on existence of `onnx/model_quantized.onnx`, and then asserts availability. The workflow checkout uses `actions/checkout@v4` without explicit `lfs: true`, which leaves a plausible route for the placeholder to survive. `scripts/download-models.js` uses existence plus size >0 for required-model checks; therefore `--verify` and postinstall skip decisions can accept a 133-byte pointer as a present tokenizer. This explains how source asset checks may pass while a real-model test fails.

**Attribution:** The placeholder tokenizer content and false-positive size-only verification are confirmed. The full CI-specific chain (including any postinstall attempts and whether other assets need hydration) must be revalidated on a fresh runner before declaring an end-to-end fix. A successful typecheck/build, unrelated audio/STT test warnings, optional native-license-method warnings and model path-existence checks do not prove this BGE model can load. This is a model-asset/CI hydration problem, **not a demonstrated Change 19 regression**.

**Safe follow-up AFTER CHG-19 acceptance:** inspect CI checkout/asset fetch, authenticate/access Git LFS only if permitted, hydrate the **real** BGE tokenizer (and necessary ONNX assets) rather than changing model-inference semantics, and strengthen `scripts/download-models.js --verify` so pointer text is rejected for JSON and ONNX. Prefer a scoped LFS checkout or explicit, integrity-checked asset restoration to a broad unreviewed model download. Verify actual JSON parse, ONNX model usability and the focused `LocalRerankerModel.test.mjs` locally and in the macOS workflow, then rerun all enforcing macOS smoke steps. Do not skip the failing test, return `true` unconditionally, weaken `RerankerAssetPreflight`, commit pointer substitutes, alter unrelated audio/native code, or infer Windows was fixed. **No CI/workflow/model-production source change is included in WORK-0042.**


### CHG-19 / WORK-0044 defect disposition after owner Mac run (2026-11-10)

- **ERR-057 (harness portfolio assertion):** Resolved for the isolated synthetic test scenario: matching owner desktop harness exited 0; the prior audit inspected 15 scenarios, expected project IDs and unrelated-file canary exclusion. This does not prove production-source isolation with real private files.
- **ERR-058 (Hindsight fixed-sleep test race):** Resolved for the tested regression: the modified queue checks passed in the owner focused test run and the intelligence suite (`2,142 pass, 0 fail, 9 TODO`). Production queue implementation was not altered.
- **ERR-059 (pre-cancelled follow-up metadata mismatch):** Resolved for the seeded referent-resolution regression: post-WORK-0042 owner test output includes `CHG-19 pre-cancelled follow-up uses one resolved question across result and response plan` and focused total `37/37`; code uses one understanding-derived canonical question. No retrieval/provider generation is expected for an already-cancelled request.
- **ERR-060 (macOS CI BGE tokenizer LFS pointer):** Still **Diagnosed, unresolved**. The latest screenshots depict old pushed Build Smoke, which does not contain local WORK-0041/0042. Fix model hydration/content verification **after** CHG-19; do not silence or skip inference checks. Windows CI source-test path failures remain separate.

These dispositions use owner-supplied Mac test transcript and the prior Copilot read-only review. They are **not a fresh re-execution or final full-product/meeting/physical-STOP acceptance**.

### WORK-0046 — CHG-19 desktop gate disposition (2026-11-10)

No new production defect found in actual isolated meeting/global Escape/X, sender isolation, supersession or same-profile relaunch. G19-01–05 PASS; C19-AC2 closed for scoped acceptance. Evidence `/var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/sneak-chg19-desktop-F7Q136`; exact IDs/counts and screenshots in initial/relaunch/result JSON. Previously fixed ERR-059 metadata regression is included in fresh29/29 engine/IPC pass; ERR-058 queue checks included in separate16/16 Hindsight pass. Production code unchanged in WORK-0046. ERR-060 remains diagnosed/unresolved and intentionally deferred with Windows CI.

Harness-only unsuccessful attempts are retained: qMpBB0 (nonexistent read probe returned ENOENT; actual directory read/write negative probes now return EPERM before data access) and nQhLM6 (non-cloneable subscription callbacks returned by executeJavaScript; return void0). Both corrected before accepted functional runs. Duplicate screenshot filenames across repeated global Escape scenarios were made request-unique in final F7Q136. No application assertion/test/security restriction was weakened, and these setup issues are not misreported as application fixes. No new ERR ID allocated for an application defect that did not occur.

### WORK-0047 CI evidence update — current `main` run (2026-11-10)

**Run:** [Build Smoke 42835657466](https://github.com/Abitesh/Sneak-Peek/actions/runs/42835657466), `main` at `0fd4731a38ea9a20fcb1897eea2a165dbb094516`, matching the current clean local HEAD inspected for WORK-0047. GitHub Actions job metadata confirms the macOS Electron unit-test step and Windows intelligence unit-test step failed. The specific macOS assertion and aggregate counts below are from the owner-provided output; the current local asset was independently checked.

**ERR-060 update:** The owner-provided macOS output reports 9,056 tests, 8,959 pass, 1 fail and 96 skipped. The failing assertion remains `LocalRerankerModel.test.mjs`'s “bundled reranker should load.” On the current local checkout, `git check-attr` reports `filter: lfs` for the tokenizer, and `resources/models/Xenova/bge-reranker-base/tokenizer.json` is 133 bytes and begins with the Git LFS pointer signature. The ONNX model file exists at 279,301,077 bytes. `RerankerAssetPreflight` rejects the pointer, while `scripts/download-models.js`'s `modelFileOk()` accepts any existing non-empty file. This is separate from CHG-19 and remains unresolved. The current-run GitHub metadata was checked, but its macOS log excerpt containing the detailed assertion was not independently retrieved; the assertion text/counts remain owner-supplied.

## ERR-061 — Windows intelligence tests resolve source paths with a doubled drive (2026-11-10)

**Related:** CI-WIN-001, WORK-0047. **State:** Diagnosed, unresolved; no code fix was applied. Windows intelligence suite: 2,151 tests, 2,131 pass, 11 fail, 9 TODO (owner-provided totals). The exact current-run job log lists all 11 failures:

- `Change13PrimaryManualPath.test.mjs`: “Single primary manual-chat path is wired through Sneak-Peek Intelligence” (line 9), “Primary route has exactly one generation handoff and legacy is fallback-only” (line 35), “Primary route does not let ordinary context or STOP fall through into a second generation” (line 46), and “Primary route keeps proven compatibility-only turns out of the migration” (line 59).
- `Change15MeetingLiveIntelligence.test.mjs`: “meeting/live IPC handlers no longer invoke RAGManager answer generation” (line 111), “live STOP aborts the migrated live-engine controller” (line 135), “meeting IPC query keys retain sender and meeting identity for STOP and supersession” (line 146), and “manual and V3 meeting identity use the public IntelligenceManager metadata API” (line 160).
- `Change16ManualCancellation.test.mjs`: “primary manual cancellation settles the engine result after consumer closure” (line 9), “primary manual conversation turns persist generation outcomes” (line 17), and “superseded manual generations never fall through to legacy generation” (line 31).

**Same failure for all 11:** Each test fails before evaluating its source assertions. The helper at line 6 of each file builds `root` from `new URL(import.meta.url).pathname`. On Windows, that URL pathname starts `/D:/...`; passing it through Windows `path.resolve()` produces `D:\D:\a\Sneak-Peek\Sneak-Peek\...`. The log shows `ENOENT` opening `D:\D:\a\Sneak-Peek\Sneak-Peek\electron\ipcHandlers.ts` (and, in one case, `...\electron\intelligence\engine\SneakPeekIntelligenceEngine.ts`). This is a test-path portability defect, not evidence that these production routes or cancellation implementations failed.

**Minimal safe correction recommendation:** In these three test files import `fileURLToPath` from `node:url`, convert `import.meta.url` to a native filesystem path first, then retain the existing relative-root calculation. Keep each assertion and source target unchanged. Alternatively centralize a shared test-only root helper if existing test conventions support it. Do not edit `ipcHandlers.ts`, engine behavior, cancellation, or compatibility routing to compensate for a test root error.

**Verification still required:** Correct the three test helpers without changing assertions, rerun these three files under Electron on both Windows and macOS, then rerun the Windows intelligence suite. The source-text tests do not exercise live UI or providers, so their passing result should be treated as static wiring evidence only. No Windows code or runtime was exercised locally in WORK-0047.

### WORK-0052 — Current error disposition after rollback and macOS commit (2026-11-10)

**Scope/evidence:** Owner's local test transcripts and full sequential verification summary; previous WORK-0047 log; GitHub commit metadata/compare for `0fd4731a` → `d90bc8a3`. The uploaded ERR register ended at WORK-0047. These statements supersede earlier time-specific statuses without erasing their investigation history.

- **ERR-048 — Verified resolved, scoped.** Screenshot capture's compositor-paint barrier was already fixed and a painted screenshot visually inspected in WORK-0026. This remains a harness fix, not evidence of arbitrary live-provider latency.
- **ERR-049 — Verified resolved, scoped.** `src/lib` regression coverage for both overlays' delayed initial submission on close/replacement/unmount passed in the owner Mac suite; CHG-19 rendered meeting/global Escape/X acceptance (G19-01/02) also passed. This does not prove every physical microphone/provider scenario.
- **ERR-057 — Verified resolved, scoped.** Broad portfolio assertions were corrected without relaxing exact project isolation; isolated fifteen-scenario acceptance passed. No real private-source security claim.
- **ERR-058 — Verified resolved, scoped.** Bounded observable Hindsight queue polling replaces fragile sleeps; focused Hindsight and full intelligence suites passed in owner runs.
- **ERR-059 — Verified resolved, scoped.** One understanding-derived follow-up question is reused across cancelled result/response plan; seeded regression plus CHG-19 GUI/IPC acceptance passed. No new engine changes in this work.
- **ERR-060 / CI-MAC-001 — Fix implemented, unverified on GitHub.** WORK-0050 restores/checks the BGE tokenizer from a pinned upstream revision on macOS before Electron test execution. WORK-0051 stabilizes an unrelated compiler-timeout test. The owner reports complete local macOS suite/build/typecheck success and pushed `d90bc8a3`. **GitHub Build Smoke [42865159761](https://github.com/Abitesh/Sneak-Peek/actions/runs/42865159761) was in progress** when checked on 2026-11-10. Await its macOS reranker real-inference result before marking `Verified resolved`; no CI pass is claimed here.
- **ERR-061 / CI-WIN-001 — Diagnosed, unresolved.** Eleven Windows test-path `ENOENT` failures remain uncorrected after WORK-0048 revert. Do not mark solved until the fixed tests run on Windows.
- **ERR-038, ERR-039, ERR-040 and earlier open provider/grounding issues — remain independently open unless their exact reproductions have evidence.** Current green macOS unit tests do not establish paid-provider health, native quit stability, six-second complete answers, or real-file authorization parity. The register's older entries are historical evidence; do not blanket-close them.

## ERR-062 — WORK-0048 CI hydration step depended on a missing GitHub LFS object (2026-11-10)

**State:** Fix implemented, unverified in fresh CI; source-level rollback confirmed. WORK-0048 added unconditional Git LFS hydration to Build Smoke, but both macOS/Windows runner logs returned HTTP 404 for tokenizer object `sha256:48564c5c7d3fa64d85d95e65414a542385f88b0f128fd8d4163fd7a57f2be05c`. That failure occurred before `npm ci` and caused misleading downstream missing `esbuild`/TypeScript failures. **No inference/test regression was established from those install-stage errors.**

**Correction:** The owner created and pushed revert `ab3f74bb`, exactly restoring pre-WORK-0048 file contents. New `d90bc8a3` includes a macOS-only pinned publisher download and SHA-256 check, **not** a GitHub LFS pull. Comparison from `0fd4731a` to `d90bc8a3` shows only the workflow and C++ test. Verify on a new clean macOS CI job before declaring end-to-end prevention.

## ERR-063 — C++ Two Sum correctness test may hit the 10-second compiler budget under full-suite load (2026-11-10)

**State:** Fix implemented; full local suite verified, CI still unverified. In the first WORK-0050 sequential macOS verification, Electron `npm test` had one failure at `CppRunner.test.mjs` while the other full suites and builds passed. Its C++ Two Sum test hit the production C++ compile timeout (10,000 ms) under concurrent test load. This is **not** the reranker failure and is not proven to reflect a production correctness defect.

**Correction:** WORK-0051 modifies only `electron/llm/codeVerification/__tests__/CppRunner.test.mjs` to retry **once only** for a compilation timeout. Wrong answers, other compiler errors and runtime timeouts still fail; the real application timeout remains 10 seconds. After owner application, the complete Mac runner recorded Electron **8,992 pass/0 fail/67 skip** and the other suites green. A fresh CI run is needed to establish stability on hosted runners.

## ERR-064 — Intermittent local Electron test run lost compiled `dist-electron` modules (2026-11-10)

**State:** Cannot reproduce in subsequent sequential runs; underlying cause unconfirmed. A user-provided `npm test` log during WORK-0049 investigation showed 229 failing tests with missing compiled `dist-electron` modules despite an earlier successful Electron build. WORK-0049 changed only a workflow YAML file and therefore cannot by itself explain local compiled output disappearing. Builds running concurrently or transient output state are hypotheses, **not established root causes**. The owner discarded WORK-0049 and later sequential tests, including the full WORK-0050/0051 run, passed. No production source fix was attributed to this symptom. Reopen with process/build timing evidence if it recurs.

### ERR-060 / CI-MAC-001 — new evidence at d90bc8a3 (WORK-0053, 2026-11-10)

**State: Fix implemented, locally verified; hosted CI unverified (open).** [Run 42865159761](https://github.com/Abitesh/Sneak-Peek/actions/runs/42865159761) confirmed the pinned upstream BGE tokenizer was downloaded and SHA-256 verified, yet `LocalRerankerModel.test.mjs` still returned unavailable. The preflight reported `missing/invalid tokenizer.json`; a separate packaged-layout inference test successfully loaded the model. Under `ELECTRON_RUN_AS_NODE`, the real-model test's selected root could differ from `<repo>/resources/models`. Owner applied WORK-0053 as a **test-only** model-root fixture correction with environment restoration, keeping real inference, the ranking assertions and production preflight intact. The focused test passed **2/2** with an intentionally invalid externally supplied model path; the real cross-encoder loaded. Owner's sequential macOS check passed Electron **8,992/0/67**, intelligence **2,142/0 (9 TODO)**, lib **382/0 (1 skip)**, scripts **97/0**, and all reported builds/typechecks/model/native checks. This establishes local verification only; **no CI rerun containing WORK-0053 has completed**. Do not mark Verified resolved until a hosted macOS run passes the enforcing Electron test.

### ERR-061 / CI-WIN-001 — repeated current Windows run (WORK-0054, 2026-11-10)

**State: Investigating; fix prepared, unverified.** The current Windows run still has **11 failing intelligence source-text assertions** rooted in three `URL.pathname` path helpers. The same job's install/build/`src/lib`/script checks pass. WORK-0054 proposes `fileURLToPath(import.meta.url)` in exactly the three failing test sources, without changing intelligence or IPC behavior. Full Windows rerun is still required. Windows `npm test` is advisory and outside the claim of this scoped patch.

### WORK-0052 original patch application mismatch — not a product defect

The owner's `git apply --check` failed before mutation because the patch expected the newer WORK-0047 tracking snapshots, whereas the actual committed documents ended earlier. The revised patch uses the actual uploaded CHG19 Final Review ZIP with Git blob hashes matching current GitHub `d90bc8a3`. Do not force the superseded records patch.

## ERR-065 — Global meeting search can widen its source scope

WORK-0055 / TASK-0003. Source-confirmed at 96cfd2c: an unavailable global RAG result makes GlobalChatOverlay invoke ordinary gemini-chat-stream. That path can authorize personal, project and mode sources based on the question. This establishes a reachable scope mismatch. No owner data disclosure was observed. Preserve global meeting-only retrieval and end the request with a visible unavailable message when the scoped backend cannot serve it.

**State: Verified in WORK-0055 patch; owner application pending.** The actual sandboxed global overlay displayed the unavailable notice for a project-like synthetic question and called the ordinary chat IPC handler zero times. Scoped meeting and global Escape/X, sender isolation, late-event rejection and same-profile relaunch passed in the same run. Evidence: `/tmp/sneak-chg20.xszQTf/desktop-evidence/result.json` and `initial-global-unavailable.png` in that directory. The first run's DOM assertion passed before the notice animation had painted. The final harness waits for painted bounds and opacity, and the final screenshot was visually inspected.

## ERR-066 — Superseded passive assist can clear its replacement's cancellation controller

WORK-0056 / TASK-0003. Source-confirmed. The old passive assist run unconditionally cleared the shared controller in its finally block and reset the shared mode after noticing its own abort. An older provider returning after its replacement started could leave STOP unable to cancel the new assist. The new dispatch checks controller identity before delivery or cleanup. Behavioral verification follows in WORK-0056.

**State: Locally verified.** A deterministic test parks two passive assist providers, supersedes the first and then calls STOP. Both request-owned signals abort, both requests settle, and neither emits a final observation. See `CanonicalConversationActions.test.mjs` and WORK-0056. ERR-065 also passed again on the real global overlay with zero ordinary chat invocations.

## ERR-067 — Canonical generation drops provider-routing failure reason before IPC error delivery (2026-11-14)

**Related:** CHG-20 / TASK-0003 / WORK-0058 → WORK-0059. **State:** RESOLVED — owner-verified on macOS and independently reviewed by Copilot. Owner's WORK-0058 focused run reported 40 pass/1 fail; full Electron run 9,020 pass/1 fail/67 skipped. The only failure was `CanonicalConversationActions.test.mjs`'s denied screenshot-derived text scope check: cloud transport was not called, no history or usage was recorded, but the error event said `Answer generation ended without completion.` instead of exposing provider unavailability.

**Confirmed mechanism:** `GenerationController` transitions the shared lifecycle to `FAILED` with reason `no available provider` when routing excludes every provider. `SneakPeekIntelligenceEngine.prepareAndStream()` creates a failed `providerAttempt` without copying that lifecycle reason into `providerAttempt.error`; `RagIpcStream` consequently substitutes its generic failure message. This is an error-propagation defect, **not** evidence of screenshot data exfiltration or an incorrect scope permission.

**Proposed correction:** copy the terminal `FAILED` lifecycle reason into `providerAttempt.error` only for a failed result, preserving successful/cancelled object shapes, provider routing, cancellation, and the existing privacy gate. Add a focused engine-level regression test that simulates a denied cloud scope and asserts no provider dispatch, a failed result, and a meaningful failure reason. Retain the WORK-0058 privacy test unchanged. Re-run Electron typecheck/build and focused tests on macOS before treating the fix as verified; full Electron regression follows if focused tests pass.


**ERR-067 verification update (2026-11-14):** Owner applied WORK-0059 and executed Electron typecheck and build successfully. Focused 57/57 passed; full Electron 9,021 passed, 0 failed, 67 skipped (`npm test -- --test-concurrency=4`). The previously failing denied-screenshot-scope test and the new engine failure-reason test both passed, with zero provider dispatch in the scoped denial fixture. The owner supplied `WORK0059-Focused.log` and `WORK0059-Electron.log`. Read-only Copilot subsequently accepted WORK-0058/0059 and independently reran 42 targeted tests with 0 failures. This resolves ERR-067 in tested scope; CHG-20 architecture acceptance remains separate.

## ERR-068 — Default General mode kept image chat outside canonical dispatch

WORK-0061 / TASK-0003. The new manual image branch initially required no active mode. The disposable desktop had the built-in General mode, so production preload reached the legacy vision path and returned its unavailable response. The fake canonical vision transport was never called. Evidence: `/tmp/sneak-work0061.s756pZ/desktop-manual-image-first.log` and its initial JSON. Preserve the selected model, attachment validation, mixed-history authorization, and custom-mode gate when admitting the built-in General mode.

**Resolution verified.** Database-seeded General mode migrates to `migrated_from_prompt / ask_if_ambiguous`. The image-chat route now accepts that default contract and a fresh General default when no files, custom instructions, or explicit strict grounding exist. It uses supplied history as referent-only material with conservative provider scopes. The production preload stream in the final desktop run observed one canonical vision dispatch, one token and one matching completion. Intermediate failed desktop runs are retained under the same evidence directory. Final runner log: `/tmp/sneak-work0061.s756pZ/desktop-final.log`.


## ERR-069 — Phone Mirror meeting evidence granted from untyped or incomplete transcript (2026-11-14)

**Task:** TASK-0003 / CHG-20. **State:** Correction prepared in WORK-0064; macOS runtime verification pending.

**Evidence:** At the supplied November 14 source snapshot, `PhoneMirrorRequest.ts` set `contextPermissions.transcript` from `actualMeetingTranscript.turns.length` without validating `source === 'meeting'` or nonblank content. `ContextPlanner.ts` could classify an unpermitted Phone Mirror meeting source as merely `not_required` instead of explicitly `forbidden`. The existing `PhoneMirrorCanonicalRequest.test.mjs` expected the explicit denial. This is an authorization-contract inconsistency; no actual data disclosure has been demonstrated.

**Prepared correction:** Require independently supplied, nonempty typed meeting evidence in the Phone Mirror request adapter. In `ContextPlanner`, explicitly deny meeting evidence and unrelated general-knowledge fallback for a meeting question when those conditions are absent, including a crafted request with a forged transcript permission; enforce the resulting meeting-evidence-unavailable policy in `PromptAssembler`; preserve valid authorized meeting input. Regression tests cover absent, imported, live, empty and authorized meeting cases.

**Checks completed on isolated uploaded source copy:** TypeScript syntax parsing and isolated transpilation of all three modified production files; nine isolated request/planner/prompt scenarios using mocked external dependencies; Node syntax checks of the edited `.mjs` tests. A full Electron build, test suite, actual Phone Mirror desktop/phone behavior, and macOS/Windows runtime have **not** been executed. Do not claim an installed fix or resolved error until the owner applies the patch and supplies matching verification.

## ERR-070 — CHG-20 canonical import and unreachable legacy type narrowing break Electron builds (2026-11-14)

**Related:** TASK-0003 / CHG-20 / WORK-0065. **State:** Corrective patch prepared; owner macOS verification pending.

**Owner evidence:** After successfully applying WORK-0064, the owner reported 138 Electron TypeScript errors (one `AnswerValidation.ts` missing export and 137 in `ipcHandlers.ts`), repeated under TypeScript 5, and a failed `build:electron` with 12 reports of the same missing export. Focused tests reported 6 pass / 2 module-loading failures: `ContextPlanner.js` and `PhoneMirrorRequest.js` were missing from `dist-electron` following the failed build. These are dependency-load failures, not failed planner assertions. `build` clears dist and dist-electron before compiling; a failed `build:electron` leaves tests without expected compiled modules.

**Confirmed source causes:** `AnswerValidation.ts` imported `validateAnswerStructure` from `AnswerPlanner.ts`, while it is exported by `AnswerValidator.ts`. In `ipcHandlers.ts`, the canonical manual-chat block has terminal returns on all paths, leaving the retained CHG-22 legacy code statically unreachable. TypeScript's control-flow analysis then narrowed many historical nullable variables to null/undefined. Do not suppress TS checks or add ~137 unjustified non-null assertions. These failures originated in the broader unverified CHG-20 working tree; WORK-0064 modified neither file.

**WORK-0065 proposed correction:** Import the validator from its actual owner. Use an always-true runtime condition typed as `boolean` around the canonical block so TypeScript can analyze the preserved historical block without treating it as following an unconditional return. The generated JavaScript still executes only the canonical branch. Add compile-wiring and validation-load regression tests. No provider, audio, source, renderer, or legacy dispatch behavior is intentionally changed.

**Checks:** Source-grounded export inspection and a minimal isolated TypeScript 5.8 flow-control reproduction completed; additional local test/patch checks recorded in WORK-0065. Full TypeScript 7/5 project compilation, Electron build, owner macOS tests, and desktop/Windows validation remain pending.

**Owner follow-up (2026-11-14):** WORK-0065 patch forward and reverse checks succeeded. `node --test scripts/__tests__/chg20-build-wiring.test.mjs` passed 2/2. All three typechecks (`typecheck:electron`, `typecheck:premium`, `typecheck:ts5:electron`) and both builds (`build`, `build:electron`) passed on macOS. The later focused batch passed 24/25 and failed only the separate stale Phone Mirror source assertion (ERR-071), not the former compilation issue. **ERR-070 state:** Verified resolved for the reported compiler/build blocker using owner-run macOS checks; full CHG-20 behavioral/desktop acceptance remains pending. Browserslist age and Vite chunk-size notices were non-fatal warnings, not failed checks.

## ERR-071 — Phone Mirror production lineage assertion targets the retired IPC location (2026-11-14)

**Task:** TASK-0003 / CHG-20 / WORK-0066. **Initial state:** Reproduced from owner-provided focused Electron output; investigation and patch verification pending at registration.

**Owner evidence:** After applying WORK-0065, all three TypeScript checks and both production builds passed on macOS. The focused four-file Electron batch reported 24 passing tests and one failing source-level test, `PhoneMirrorCanonicalRequest.test.mjs` ("Phone Mirror actual production chat uses canonical engine and guards source lineage"). Its final `assert.match` expected `conversationActionDataScopes({ context: request.sessionSnapshot ?? request.imageConversationSnapshot })` inside `electron/ipcHandlers.ts`. The failure printed source text rather than reporting a Phone Mirror provider response.

**Investigative boundary:** Check the current canonical runtime and the phone IPC caller before changing either. A stale test-location assumption is not proof that provider scope enforcement was removed. Preserve the test's security purpose: phone dispatch and runtime generation must retain conservative mixed-session lineage scopes for provider policy. No production privacy relaxation is authorized.

**WORK-0066 source confirmation and correction:** In the current source, `electron/ipcHandlers.ts` routes Phone Mirror through `buildPhoneMirrorCanonicalRequest` and `streamRagEngineAnswer` using `createPrimaryManualSneakPeekEngine`; `electron/intelligence/engine/CanonicalRuntime.ts` builds conservative data scopes using `conversationActionDataScopes` and passes the resulting scopes to both pinned and selected-provider routes before `streamCanonicalProvider`. The test was still asserting the pre-migration location, and should inspect the actual runtime's scope handoff rather than eliminate its privacy assertion. Updated only the test (no production behavior change). Locally checked the exact replacement expressions against current source and `node --check` passed; full focused Electron re-run remains pending on the owner's Mac. **State:** Fix implemented, unverified in actual Electron test execution.

## ERR-072 — CHG-20 full regression suites fail after focused 25/25 (2026-11-14)

**Task:** TASK-0003 / CHG-20 / WORK-0067. **State:** OPEN / partially mitigated in prepared patch; no Mac verification of patched tree. Do not close before current tree suites pass.

**Owner evidence:** WORK-0066 25/25 engine-focused tests, three Electron typechecks and two builds passed on macOS. Subsequent full `npm run test:intelligence`: 2,170 tests, 2,142 passed, 19 failed, 9 todo. `npm test -- --test-concurrency=4`: 9,096 tests, 8,919 passed, 107 failed, 67 skipped, 3 cancelled; owner interrupted after a long run. `test:lib` / `test:scripts` were not completed. A single `git diff --check` whitespace warning named `CanonicalRuntime.ts` blank line at EOF, an existing staged/new-file condition that this patch does not manipulate.

**Failure families found, not all proven equivalent:** stale source-level owner checks still looking in IPC instead of `CanonicalRuntime.ts`/`AnswerExecution.ts`; WTA test fakes missing `isUsingOllama` and current canonical provider route/transport; source-path validity check requiring actual file-backed images; potentially real regressions in WTA always-on answer cleaning, schema-stub suppression, repetition tracing, provider denial, image policy, STOP/supersession, no-history-on-error and renderer event consistency. The same missing fake methods affect many test names; do **not** count each as a separately verified production defect. See `scripts/audit/chg20-regression-inventory-work0067.md` for the complete input failure-name list.

**Repair hypothesis / bounded implementation:** Restore noncoding deterministic cleanup and diversity observability within the active canonical WTA route, fail closed on leaked schema stubs, make model-deadline probe optional for simplified test transports, relocate only demonstrably stale static assertions, replace nonexistent vision fixture paths with disposable real PNG files. Preserve first-token/provider commitment, source authority, STOP, prompt ownership, event/history rules, existing staged changes and audio. This does NOT fix or verify all failed runtime cases.

**Attempt/verification history:** A first Change13 static assertion assumed one closing brace between the primary return and historical comment; the actual branch has two, so the assertion failed locally. Corrected it and reran: 4/4 Change13 source-only tests passed. The WTA source-only three-test block and four Change10 assertions passed on the isolated copy. Attempts to run compiled-dependent integration suites in the isolated upload failed at import before assertions (`dist-electron` absent): this is *not* a Mac regression and must not be counted as a behavior failure. The owner Mac is required for TypeScript 7/5 compilation, Electron service and full regression execution. No third-party provider/network/user-data calls executed locally. Initial hypothesis that all 107 failures were one fixture issue was rejected: privacy/cancellation/response correctness failures need real tests, not fake success.

**Next:** Apply/check the verified ZIP patch on top of WORK-0066. Run focused source and runtime tests, three typechecks and both builds in order; if green rerun the broader suites with controlled concurrency and save the failure summary to a local log. Reconcile any remaining incidents with real engine request/provider capability stubs. CHG-20 remains unaccepted.

## ERR-073 — Canonical WTA elevated typed history to speech evidence (2026-11-15)

**Related:** TASK-0003 / CHG-20 / WORK-0069. **State: correction implemented in a prepared ZIP; macOS behavioral verification pending.**

**Evidence and risk:** The WORK-0067 `IntelligenceEngine.ts` canonical What-to-Answer request built its `source: 'live'` transcript from every non-assistant `contextItems` turn. SessionTracker also stores manual_chat, system_instruction and test-origin data, and the request forwarded all mixed history plus potentially mixed `preparedTranscript` for follow-ups. `CanonicalRuntime.ts` promotes a `source: 'live'` request's turns to `meeting_transcript` evidence. Three prior `CanonicalConversationActions.test.mjs` speech-only WTA tests reported private-decoy/citation failures. Independently inspected the production caller and typed provenance fields; this is a confirmed source-level boundary error, although a provider disclosure is not independently demonstrated.

**Correction:** Add pure `selectWtaSpeechTurns` with positive STT/test and legacy provider evidence and explicit negative precedence for manual/assistant/system origins. In the canonical WTA request use the selected turns for `transcript` and `history`; use a speech-only bounded follow-up snapshot rather than mixed history. Do not elevate typed turns or prior assistant output into meeting authority. Preserve the current manual WTA question, other canonical source gates, provider pinning and cancellation. Add two direct selector regressions and tighten the existing speech-only rendered-prompt assertion.

**Attempts/evidence:** Initial inline filtering matched the older predicate but could admit `origin: manual_chat` when an obsolete `sttProvider` field was present; replaced with an explicitly fail-closed selector before packaging. Local isolated Node tests pass 2/2; compiled Electron service tests, prompt/provider privacy, mode-specific WTA and macOS/Windows desktop verification pending. Any long-range lexical follow-up requiring older speech not in the selected bounded window needs separate behavioral review; do not reinstate mixed text as transcript evidence.

## ERR-074 — V3 explicit-entity context-debug record intermittently lacks conversation state (2026-11-15)

**Related:** TASK-0003 / CHG-20 / WORK-0069. **State: investigation open; one bounded robustness change prepared, Mac verification pending.**

**Reported evidence:** WORK-0067 `test:intelligence` owner run reported 3 failures/2,170 tests. Copilot's read-only follow-up identified `ContextDebugLogging2026_08_01.test.mjs` `explicit entity: referent NOT applied` as the third case, where `conversationState` was absent. The test requires `referentApplied: false` and reason `CURRENT_QUESTION_CONTAINS_EXPLICIT_ENTITY`; do not weaken it. The other two failures were stale source anchors.

**Investigation:** Orchestrator built `referentResolution` inside a broad `try` with a dynamic `require('../question/conversation-state-store')`; any module-resolution exception was silently swallowed, leaving no trace field. That is a credible but **not proven** source of the observed Mac failure. The current uploaded source run through an isolated TypeScript loader did NOT reproduce the defect: `orchestrate` and the full V3 `buildV3Prompt` debug writer both produced the expected explicit-entity reason and `referentApplied: false`. Do not represent this as a confirmed explanation of the Mac failure.

**Proposed robustness change:** Replace the dynamic store require with direct typed imports to avoid module-load errors being hidden by the best-effort resolver catch; leave the resolver's decision, privacy and debug contract unchanged. Local TypeScript transpilation and isolated V3 debug reproduction passed. Current Mac `ContextDebugLogging` and full intelligence suite remain required to establish whether the reported failure is fixed. If it persists, capture full test details in Downloads before another code edit.


## ERR-075 — Canonical project RAG can read unauthorized planned file IDs (2026-11-15)

**Related:** TASK-0003 / CHG-20 / WORK-0070. **State: source correction prepared and isolated adapter tests pass; Mac verification pending.**

**Evidence:** Owner's WORK-0069 read-only Copilot report identified that `CanonicalRagRetrievalAdapter` passed `input.contextPlan.sourceIds` directly to the RAG reader. Its result filter checked `scope.projectFileIds` only *after* retrieval. Independently confirmed the call and read in the uploaded WORK-0069 source. A planner-chosen project ID is not an authorization grant; a filtered result cannot undo an unauthorized storage read. The WORK-0069 behavioral fixture even expected the reader to receive the wider planned list, so that earlier test had the wrong privacy invariant.

**Fix:** Intersect planned IDs with the authorized scope at the **pre-read** boundary. For `project_knowledge` require an explicit nonempty project-file authorization and project-only scope; deny missing and empty intersections without calling `read`. Preserve the final evidence filter, canonical provenance and cancellation propagation. Change the behavioral expectation to the authorized list and add missing/empty/disjoint scope and in-flight cancellation regressions. Do not add a legacy provider or widen scope to satisfy old test mocks.

**Evidence:** Local disposable TS5.8 transpilation plus actual Node runtime of the canonical adapter test: 10/10 pass, including pre-read rejection and a late-resolution cancellation check. Mac Electron typecheck/build, full intelligence suite, 9k Electron suite, screenshot/privacy and live desktop tests pending. Owner's prior WORK-0069 typechecks/builds and intelligence 2164/2173 passed *before this patch*; they are not verification of WORK-0070.

## ERR-076 — WTA speech-only follow-up/context and source-scope gaps after WORK-0069 (2026-11-15)

**Related:** TASK-0003 / CHG-20 / WORK-0070. **State: investigated; NOT fixed in this bounded patch.**

**Evidence:** Copilot read-only review of the owner tree reports: mixed `preparedTranscript` can still influence an empty-context guard before speech filtering; genuine older speech recall may be dropped by the recent-only canonical snapshot; the resulting speech-only snapshot is classified as `mixed_session_history` with unrelated outbound scopes. These are credible source-level findings; this work did not independently reproduce a provider request. Do not restore unlabelled durable context or silently widen a cloud provider's scopes. Investigate source typing and recency/follow-up requirements as a distinct correction with prompt/provider-scope tests.

**Next:** After WORK-0070 read boundary is verified, trace the WTA empty-context guard, durable STT provenance, live snapshot lineage and outbound data scopes. Add negative typed-decoy and positive older STT follow-up fixtures before modifying the active route. Keep C20-AC1 open.


## ERR-077 — Canonical WTA lost legacy raw-output and manual error-render safeguards (2026-11-15)

**Related:** TASK-0003 / CHG-20 / WORK-0071. **State: source correction prepared; Mac runtime verification pending.**

**Confirmed source defect:** The active `IntelligenceEngine.runWhatShouldISay` passed raw leaked schema/tag artifacts, provider-transport error strings, false no-content claims, and candidate voice stock refusals toward validation/persistence rather than handling them as the historical WTA path did. Manual catch returned a non-null `buildGracefulRetry()` without its matching `suggested_answer` event, leaving the renderer's placeholder unresolved. The tiny steering-tail strip for small-talk remained historical-only. These are distinct from tests that injected through a retired provider seam.

**Correction:** Add `WtaRawOutputPolicy` to classify raw content before canonical repair/persistence; recover substantive JSON, preserve genuine technical JSON, refuse leaked artifacts, display but never persist provider errors, and show honest manual sentinels while discarding speculative ones. Reuse current candidate sanitizer and narrow small-talk steering strip; emit a matching generation-ID final on non-superseded manual exceptions and never emit speculative final. Existing `AnswerExecution` provider commitment and STOP remain untouched.

**Checks and limits:** Pure Node policy tests 5/5; standalone TS strict check; source syntax checks. Owner Mac compile/behavior tests, streaming row ordering, private-scope delivery and comprehensive regression pending. The old 98 failures are not declared resolved.

## ERR-078 — Legacy WTA tests still call retired whatToAnswerLLM instead of canonical provider contract (2026-11-15)

**Related:** TASK-0003 / CHG-20 / WORK-0071. **State: partial test fixture migration prepared; behavioral verification pending.**

**Evidence:** Owner's latest controlled `npm test` log: 9,095 total / 8,915 pass / 98 fail / 1 cancelled / 81 skipped. A group of 81 error entries throws `Active provider transport is not yet supported...` because the mocks supplied only `whatToAnswerLLM.generateStream`, which active code no longer calls, and no selected provider snapshot or final-prompt transport. Previous WORK-0067–0070 fixes did not reduce this group.

**Correction:** Use a shared test-only pinned `ollama` `getSneakPeekGenerationRouteOptions` + `streamFinalPrompt` fixture for legacy live-WTA behavioral tests. It is **not** a production fallback, does not override provider privacy, and must not be reused to fake scope-denial cases. Migrate test factories and move the background-verification source assertion to the active canonical same-provider `execution.repair(..., abortSignal)`. Preserve outcome, cancellation, history and UI assertions, adapting only tests that explicitly require a retired generator.

**Evidence/next:** Local fixture direct tests 2/2; WTA source assertions 30/30; JS syntax passed. The other eight `fitContextForCurrentModel` failures and action/vision/privacy cases remain open. Owner Mac focused suite is required to discover whether formerly blocked cases now expose true output behavioral regressions. Record each observed failure; no acceptance until green.

## ERR-079 — Remaining CHG-20 canonical WTA migration and action-fixture regressions (2026-11-15)

**Related:** TASK-0003 / CHG-20 / WORK-0072. **State: partial source/test correction prepared; Mac regression pending.**

**Owner evidence:** WORK-0071 applied with three Electron TS checks, frontend build and Electron build all passing. Its `npm test -- --test-concurrency=4` report: **9,097 total / 8,987 passed / 28 failed / 1 cancelled / 81 skipped**. Thus the previous 98 failures fell to 28, but CHG-20 cannot be accepted. The 28 include seven `ManualContextFallback` tests throwing `fitContextForCurrentModel is not a function`, three screen-context WTA tests using the removed `whatToAnswerLLM.generateStream` injection, and separate provider scope/vision, cancellation, action completion and relevance/response repair issues. The failure log and full original were uploaded; do not infer these distinct failures are all test-only problems.

**Corrections:** Update the seven action/manual-context tests to provide the production helper's `fitContextForCurrentModel` method and the canonical pinned test route, assert on the actual final provider prompt (including escaped, uncitable historical context), never through the retired action generator. Update three WTA screen-context tests to use `streamFinalPrompt`, checking real image options, screen text, caller instruction and no-screen omission. Preserve no-call tests for stale and synthetic history. No production fallback for null provider routes, denied privacy scopes or old generators.

**Unresolved:** The broad Electron suite has other active-path errors, including `CanonicalConversationActions`, screen-source classification, stale assist, worker/coding and detached relevance checks. These require their own source-grounded corrections. Do not claim the total failure count after this patch before owner verification.

## ERR-080 — Speculative WTA exceptions leak retry output; promoted screen coding re-enters spoken scaffold repair (2026-11-15)

**Related:** TASK-0003 / CHG-20 / WORK-0072. **State: source corrections prepared; Mac regression pending.**

**Evidence:** WORK-0071 Electron `IntelligenceEngineSentinel.test.mjs` expected null on empty speculative provider generation but received a visible retry string; the canonical `catch` returned retry unconditionally. `ScaffoldStreamHold2026_08_21.test.mjs` found that an on-screen `class Solution/def twoSum` turn triggered a second regeneration. The active WTA path keyed its coding stream gate only from `answerType`, whereas the archived pre-migration implementation also used shared `isPromotedScreenCodingTurn`. The canonical validator independently considered canonical coding headings to be contamination for non-coding routed types.

**Correction:** Explicitly suppress error fallback/terminal event for speculative requests. Reuse the shared screen-coding promotion predicate at the active WTA stream gate; the canonical validator must not interpret legitimate promoted coding headings as spoken contamination, but non-promoted noncoding scaffold remains rejected. Add a validator regression covering both cases. Do not disable ordinary coding validation, provenance, provider pinning, or STOP. Source/transpile checks only locally; Electron runtime outcome pending.

## ERR-081 — Canonical WTA output and relevance parity (2026-11-15)

WORK-0073 / TASK-0003. Reproduced on local main 5efac5d2 with the owner's working changes. The 90-test focused baseline yielded 72 pass, 17 fail and one cancellation across WTA and action/lifecycle groups. WTA deficiencies reproduced include discarded visible deadline output, technical JSON rejected on the second validation pass, missing scaffold extraction and relevance/repair behavior, and redundant regeneration of promoted screen coding. Speculative-empty behavior already passes this baseline. Logs: /tmp/sneak-work0073.pzgQMY/baseline-focused.log.

## ERR-082 — Canonical action error delivery, scope fixtures and cancellation (2026-11-15)

WORK-0073 / TASK-0003. Same baseline reproduces committed and denied actions losing their error event, stale assist not settling while its provider is parked, and Code Hint/brainstorm provider-scope and supersession fixtures failing. Investigate original ownership and final route checks separately from mocks using obsolete transport interfaces. No legacy dispatch is authorized.

## ERR-083 — Manual image policy missing from canonical desktop prompt (2026-11-15)

WORK-0073 / TASK-0003. First isolated desktop run reached real preload and selected vision transport after passing WTA, Code Hint and image analysis. The transport rejected the streaming manual image prompt because the typed screen attachment path no longer emitted the explicit image data boundary. No token or completion reached the renderer for this turn. Evidence: /tmp/sneak-work0073.pzgQMY/desktop-first.log and its linked initial.log. Restore the same image policy for authorized pixels on all canonical surfaces.

## ERR-084 — Broad suites revealed a speculative expectation and four stale test boundaries (2026-11-15)

WORK-0073 / TASK-0003. First broad Electron run passed 9,029 of 9,097 with one outdated speculative no-provider expectation and 67 skips. First intelligence run passed 2,168 of 2,181 with four failures and nine TODOs: two factory VM fixtures omitted the new current-scope-policy dependency, and two exact source assertions expected the previous route/prompt call shapes. Preserve provider routing, meeting scope and response assembly assertions while reconciling those test boundaries. Also reject incomplete speculative provider output even when it looks like a complete sentence.

## ERR-085 — Desktop manual generation could retain a stale pending/completed turn after STOP (2026-11-15)

WORK-0073 / TASK-0003. Source audit of the active streaming handler found that sender cancellation could leave the turn pending when ownership had already been removed, or mark it completed before a repair finished. A transport waiting on its next chunk could delay cancellation settlement. Move completion status after owned repair, close stale turns as cancelled, and race provider iteration against the original signal. Verify parked transport behavior without waiting for late output.

**WORK-0073 resolution evidence:** ERR-076 now preserves origin and STT provider attribution in durable context, excludes typed/system-instruction/assistant turns before WTA inference, and supplies bounded recalled speech through the typed transcript evidence route. A durable recall regression distinguishes old STT from typed and assistant decoys, and an action test verifies typed-only history cannot cause dispatch. Unattributed interviewer history can still inform question inference for legacy input, but does not become speech evidence.

ERR-081/082 passed the 95-case WTA/action rerun and final broad suites. ERR-083 passed actual streaming manual image IPC and standalone analysis, including the profile-path escape negative test. ERR-084 passed both final broad suites (Electron 9,031 pass, 67 skips and intelligence 2,173 pass, 9 TODO, with zero failures or cancellations in both). ERR-085 passed actual preload STOP with a parked provider and both model-commit recovery scenarios. Local evidence is in WORK-0073 and the surface map. Broader acceptance limitations remain recorded separately.


## ERR-086 — CHG-20 desktop acceptance depends on an unsaved temporary runner (2026-11-15)

WORK-0074 / TASK-0003. Verification-delivery defect, not a newly reproduced answer failure. WORK-0073 executed `/tmp/sneak-work0073.pzgQMY/desktop.mjs`; the repository runner `scripts/audit/run-chg19-desktop-acceptance.mjs` retains a CHG-19-only path allowlist. Current CHG-20 source paths necessarily violate that historical allowlist. The temporary runner also compared names/status/index without hashing unstaged tracked content. Current owner checkout has 81 staged paths and no unstaged/untracked paths; index must remain unchanged.

Prepare a separate CHG-20 runner in a downloadable patch, reusing the unchanged OS restrictions and genuine rendered harness. Record tracked diff and build hashes before/after, retain same-profile relaunch and event evidence, and report preexisting whitespace separately. Do not reinterpret unchanged checkout as proof that the entire staged migration has received independent review. No production defect or new completion claim is inferred.

**WORK-0074 result:** Separate runner implemented in the downloadable patch, syntax/apply/reverse/byte checks passed, and both actual desktop phases passed. Evidence copied to `/Users/abitesh/Downloads/Sneak-Peek-CHG20-WORK0074/evidence`. Repository installation pending; do not mark ERR-086 installed/resolved yet. Existing production behavior untouched; no new answer failure reproduced.


## ERR-087 — Speculative WTA error event escapes suppression (2026-11-15)
WORK-0075 / TASK-0003. Confirmed source: runWhatShouldISay catch emits the UI-wired error event before returning null for speculation. Prior tests checked final output but did not subscribe to error. Add event/history regression before fixing.

## ERR-088 — Promoted screen coding bypasses canonical structure/coverage checks (2026-11-15)
WORK-0075 / TASK-0003. Confirmed source: validateCanonicalAnswer returns null for every promoted screen-coding answer after evidence checks, even a prose-only or truncated code answer. Existing positive fixture reused conceptual semaphore scaffold with no code. Replace the positive fixture with genuine valid code, retain streaming/no-spurious-regeneration assertions, add negative missing/truncated-code and explicit-format tests. Do not treat screen promotion as authority to skip validation.


## ERR-089 — WORK-0075 partial-edit three-test regression (2026-11-15)

**Owner-reproduced:** The owner supplied two full terminal logs, not isolated excerpts. Full Electron `npm test`: 9,101 total / 9,031 pass / 3 fail / 67 skip / 0 cancelled. All-checks `&&` chain: five typechecks and renderer/Electron builds passed; `test:node-runner` failed 3 cases of 8,966 and stopped the remaining chain. The failing assertions were (a) speculative scaffold test used forbidden regeneration output `this should never be requested`, (b) non-code OCR with an image returned `Could you repeat that?` instead of the provider's screen-grounded explanation, and (c) throwing during `captureAnswerContext` propagated out of speculative WTA before its catch. Related to ERR-087/088 but distinct from source-only proof.

**Root causes in uploaded worktree:** (a) Codex changed the canonical finalize path from `!isSpeculative && !partial` to `!partial`; (b) the shared screen-promotion predicate treated every attached image as code even when readable OCR had no structural code; (c) provider route snapshot capture happened above the streaming `try`. The promoted validator additionally used the lightweight general-implementation shape, which cannot demand a complete six-section algorithm answer. This is not evidence that earlier commits were failing: these errors reproduce after the interrupted WORK-0075 edits.

**Repair in this ZIP, owner run pending:** Preserve speculative silent catch but guard pre-try route capture, reinstate no speculative repair, refine deictic image/OCR coding promotion while retaining uninspected image and explicit code intent, and validate real promoted code against the six-section DSA contract. Add positive/negative validator tests. Local isolated predicate and validator smoke checks pass; Electron/macOS and acceptance are not run inside the ZIP workspace. State: **Fix prepared, unverified on owner Mac**.


**WORK-0077 resolutions:** ERR-076 compiled typed speech, older recall and scope suites passed. ERR-087/088 speculation and promoted code cases passed. ERR-090 passed direct Node (12/12) and Electron compatibility checks, then full suites. ERR-086 runner is owner-staged and executed successfully. ERR-091/092 resolved for CHG-20 by the final two-launch harness run with delayed post-STOP transport and bounded paint. Evidence: `/Users/abitesh/Downloads/Sneak-Peek-WORK0077.YRLAFI/desktop-chg20/result.json`. The first strengthened run passed manual STOP but was terminated after it stopped progressing during meeting overlays. The exact renderer scheduling cause remains unconfirmed.


**WORK-0077 CHG-21 resolutions:** ERR-093 and ERR-095 reproduced against old compiled output and passed focused and broad checks after repair. ERR-094 canary quoted in 1 baseline case and 0 final cases with the same model and synthetic document. This verifies the tested example. ERR-096 was isolated to scenario matching and renderer event ordering in the acceptance fixture. Final two-launch run passed after current-question matching and explicit event waits. See `/Users/abitesh/Downloads/Sneak-Peek-WORK0077.YRLAFI/desktop-final/result.json`. Spanish FIFO factual error and local p95 miss remain open quality findings rather than failed automated suites.


**WORK-0078 outcomes:** ERR-097–100 pass focused regressions and final local suites. Screen-injection ERR-101 was corrected for the tested Spanish OCR prompt across final repeats. ERR-102 improves title attribution, with complete explicit plural and specific answers on the rendered matrix, but the ambiguous query still omits a second matching record. This remains open for answer completeness. The model also misdescribed FIFO and missed the first-useful and six-second targets in observed runs. Evidence: `/Users/abitesh/Downloads/Sneak-Peek-WORK0078.oKvPpI`.

## WORK-0079 — Current error dispositions (2026-11-17)

- **ERR-045 / ERR-105–106, verified scoped.** Rendered Linkship first turn, follow-up, sibling switch, cleared session and broad portfolio all passed. The scoped project call used exact IDs and excluded the prior project and the general-file canary. The original ERR-038 owner report remains open for exact request/source correlation.
- **ERR-102, verified scoped.** All three original ambiguous rendered trials and both control questions returned correctly attributed facts. The compiled duplicate-text regression preserves different meeting IDs and the original scores. The separate single-record model benchmark produced an unsupported clause about the decision's reason. Track this as a remaining factual-quality limitation under ERR-103.
- **ERR-103, measured scoped improvement.** Spanish and French definitions, the missing-referent check, and source-denial controls retained their assertions. The original French raw wording miss remains visible and passes factual review. The independent answer review found 25/26 correct per final run, including only the single-record wording defect above. Human or independent reviewer sign-off remains separate.
- **ERR-104, open.** Saved-meeting final paint met 6 s on all five trials. The cold-start benchmark and rendered first text still miss 2 s. The rejected compact and reordered evidence prototypes introduced an attribution omission. Physical STT-to-paint and applicable provider/platform verification remain open.
- **ERR-107–108, verified scoped.** The compiled tests and two-launch desktop restored authorized image continuity while keeping exact project snapshot exclusion. Generic interview advice now avoids stored-meeting retrieval and correctly describes the concept in final model runs. Explicit interviewer questions still plan meeting evidence.
- **ERR-049/054/056/057, local evidence refreshed.** Actual overlay Escape/X, completed and reset chat, exact named scope, résumé picker and portfolio passed. **ERR-061** has the committed `fileURLToPath` source correction at `96cfd2ca`, and the three files are in the green local intelligence suite. Windows execution remains distinct. Hosted Build Smoke and the account/native/package tasks retain their own acceptance requirements.

The full historical disposition and skip list are in the [WORK-0079 evaluation](../scripts/audit/chg21-quality-evaluation.md#work-0079--acceptance-evidence-2026-11-17). Reconciliation does not close a historical owner-reported or external symptom without its own evidence.

## WORK-0080 — Current error dispositions (2026-11-17)

- **ERR-103, verified scoped.** The reproduced reason being wrongly attributed to a speaker is gone across the unchanged frozen cases. Factual review improved from 25/26 to 26/26. The raw French wording miss remains documented and the main French answer is factually correct.
- **ERR-102, reopened for real-model completeness.** One rendered ambiguous result omitted the second matching meeting despite one authorized read supplying both IDs. 24/25 rendered search answers across the measured batches were correct. All five on the final build passed. Keep the miss and the narrower single-result control. Neither scope nor storage provenance was widened.
- **ERR-104, open.** Genuine unloaded global first text and final paint were 5898 and 7058 ms. Final prepared p95 was 2263 ms. The latest resident Listen renderer showed 4566 ms first text and 11010 ms final paint. The bounded selected-model preload reduces the load on the timed turn. The first unloaded load alone and the resident prefill/decoding costs establish separate bottlenecks. The physical STT transfer still needs measurement.
- **ERR-109, verified scoped harness correction.** Startup built-in mode sections were compiling through the shared notes fallback in the failed prepared run. The isolated content-free preload no longer changes that fallback's helper selection for the timing fixture. The repeat did not stall behind those fixture jobs. Production note-section scheduling and concurrent workload performance have their own remaining evidence.
- **ERR-110, partial.** The Auto-language defect was reproduced with three fixed seeds and corrected in two subsequent rendered English evaluations plus the latest rebuild. Precision and requested example quality still vary by sampled answer. The fixed-seed example-guidance prototype had two imprecise definitions and was not shipped. Keep the failed Listen output, the latest timeout-target misses and the supplemental multilingual results.
- **ERR-111, verified scoped ownership repair.** Copilot identified an old global request resetting its replacement in finally. The actual callback regression was red on WORK-0079 and green after the request owner and scoped completion were enforced. Final two-launch desktop passed the original repeated-Enter, Escape/X, late-output, separate-sender and relaunch checks. The earlier one-off renderer timeout remains a retained unsuccessful attempt. No causal equivalence between that timeout and the reproduced ownership defect was established.
- **Earlier issues.** The WORK-0079 issue-by-issue ledger still owns older scope and external dispositions. Final local suites and isolated macOS checks reaffirm the exercised project, document, session, meeting and stop paths, including the ERR-076 speech-source regressions. They do not resolve an unmatched owner report, credentialed provider or Hindsight operation, hosted Build Smoke, installed/packaged behavior, Windows GUI, phone hardware or actual STT.

See the [evaluation and scoped criteria](../scripts/audit/chg21-quality-evaluation.md#work-0080--meeting-attribution-model-residency-and-desktop-timing-2026-11-17) and `/Users/abitesh/Downloads/Sneak-Peek-WORK0080.C2uoKO`. C21-AC2 remains open.
