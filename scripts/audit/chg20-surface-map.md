# CHG-20 surface inventory


## WORK-0066 current-working-tree addendum (2026-11-14)

The table below records only reviewed source facts from the owner-supplied November 14 snapshot with WORK-0064 and WORK-0065 applied. The original 96cfd2c map further below is historical, **not** a current exhaustive bypass list. Git status reportedly contains 14 modified and four new canonical files before WORK-0064; owner has since staged and modified overlapping files. No Git metadata was included in the archive, so a later live Git audit is required.

| Boundary | Source reviewed | Verified / remaining status |
| --- | --- | --- |
| Phone Mirror user answer | `ipcHandlers.ts` `onPhoneCommand` → `buildPhoneMirrorCanonicalRequest` → `createPrimaryManualSneakPeekEngine` → `streamRagEngineAnswer` | Static active canonical dispatch observed. Source policy, full message/event parity, sender isolation and provider behavior need focused/desktop confirmation. |
| Mixed phone session history outbound policy | `PhoneMirrorRequest.ts` typed meeting validation; `ContextPlanner.ts` denied meeting policy; **`CanonicalRuntime.ts` generationPort** uses `conversationActionDataScopes` for unknown lineage and forwards computed `dataScopes` to both pinned and selected provider routes before `streamCanonicalProvider` | WORK-0066 updates stale test to check runtime ownership rather than removed IPC-side code. Owner Mac focused test rerun pending; retain source-family denial tests. |
| Deterministic preflight clarifications | Phone Mirror source-switch and WTA context-free responses produced before provider dispatch | Not by themselves second provider orchestrations. Require authorization, event, history and single-settlement tests; decide documented terminal-outcome ownership for AC1. |
| Other current live/assist/manual/vision paths | Current `AnswerRequest`, `AnswerExecution`, `CanonicalRuntime`, `SneakPeekIntelligenceEngine` and production callers | Some canonical adapters present. No new exhaustive active-caller proof or full desktop acceptance; do **not** call C20-AC1 PASS or delete legacy modules. |

**Next CHG-20 gate:** rerun current focused Electron tests after WORK-0066; check real provider policy denial for phone mixed history, selected model and repair pinning, STOP/supersession, one completion, and exact sender-scoped IPC events with disposable synthetic data. Then reconcile all active answer-producing branches to the current source, not historical inventory. Keep C20-AC1 FAIL and C20-AC2 PENDING until grounded acceptance exists.

Baseline 96cfd2c on macOS. WORK-0055 / TASK-0003. CHG-19 established the primary manual and meeting/global RAG seams. Targeted caller and import searches supplement the CHG-19 inventory. No graph connector was available.

| Entry | Baseline owner and contract | Migration boundary |
| --- | --- | --- |
| `streamGeminiChat` → gemini-chat-stream | Standard text: canonical planner, RAG adapters, final prompt and generation controller. Compatibility: IPC/V3 and LLMHelper. Sender tokens/done/error and Phone Mirror. | Preserve text and project provenance. Compatibility needs multimodal, caller-owned prompt, skill, identity and recovery parity. |
| Meeting/global overlays → rag:query-* | Canonical engine through RagIpcStream. Renderer ordinary-chat fallback on failed/unavailable RAG. Scoped chunk/error/complete. | Keep meeting identity and sender cancellation. Ordinary fallback needs explicit scoped behavior. |
| Live WTA and accepted auto-answer | IntelligenceManager → IntelligenceEngine → WTA snapshot, V3/legacy selection and WhatToAnswerLLM. Suggested answer token/final, session/usage and repair. | Move authoritative policy and evidence first. Preserve trigger/speculation, repair/commit, mode and privacy. |
| Assist / proactive | IntelligenceEngine → V3 transcript bridge or AssistLLM. assist update. | Preserve proactive/no-question behavior. |
| Refine / recap / follow-up questions | IntelligenceEngine → corresponding LLM wrapper → LLMHelper. Session transcript or prior answer, specialized prompt, token/final, usage. | Introduce bounded action contracts and use canonical planning/prompt/transport. Keep existing source-switch rule. |
| Clarify / brainstorm | IntelligenceEngine → optional transcript V3 / manual V3 → specialized wrapper and LLMHelper. Token/final/usage. | Preserve active V3 retrieval and mode policy before replacing those branches. |
| Manual action, code hint, screen/coding | IPC and IntelligenceEngine → V3/AnswerLLM/CodeHintLLM and direct LLMHelper generation. | Preserve image validation, local-only vision, coding gates and action events. |
| Phone Mirror | PhoneMirrorService → independent IPC callback with active mode/source policy and LLMHelper. Sender-scoped updates. | Needs canonical request adapter with identical phone and desktop mirroring. |
| Generated email and role insight | IPC → specialized generation service/LLMHelper, returned result rather than chat stream. | Audit document/structured output and keep source contracts. |
| Non-answer infrastructure | Transcript/STT/capture, trigger judge, storage/indexing, embeddings, post-meeting processing and provider probes. | Keep their separate responsibilities. |

## WORK-0055 ownership after the patch

The new production path is `IntelligenceEngine.run{FollowUp,Recap,FollowUpQuestions,Clarify,Brainstorm}` → `ConversationAction` → `SneakPeekIntelligenceEngine` → turn understanding → `ContextPlanner` → `RetrievalCoordinator` (explicit session snapshot) → `EvidencePack` → `ResponsePlanner` → `PromptAssembler` → `ProviderRouter` / `GenerationController` → `LLMHelper.streamFinalPrompt` → existing events and usage/history. The action adapter reuses `streamRagEngineAnswer` to settle one stream and reject stale output. It does not run a legacy generator behind the canonical engine. The built-in prompt rules, selected model and language preference still apply.

| Surface | Owner after WORK-0055 | Still required for C20-AC1 |
| --- | --- | --- |
| Standard manual text, explanations and coding | `gemini-chat-stream` → primary canonical engine → shared `streamCanonicalProvider` | Confirm runtime parity across general/coding, empty context, multi-turn and private-source cases at final integration. |
| Manual compatibility and standalone manual action | IPC V3 / LLMHelper and `runManualAnswer` → V3 / AnswerLLM | Carry image, caller-owned prompt, skill, custom mode, identity and recovery contracts through canonical policy. |
| Meeting chat | `rag:query-meeting` → scoped canonical RAG → shared provider dispatcher | Renderer fallback can still compose a separate prompt when the meeting ID or scoped backend is missing. Preserve scope and ordinary fallback behavior with an explicit canonical contract. |
| Global meeting chat | `rag:query-global` → meeting-only canonical RAG | ERR-065 removes unscoped fallback. The isolated renderer checks confirm the unavailable path, cancellation and sender scope. |
| Personal/profile/projects/My Files | Canonical context and RAG capabilities for standard manual text. Active V3 policy contributes profile authority, and compatibility surfaces retain their own routing. | Move the authorized source policy without weakening identity, file/revision provenance, score or deletion behavior. |
| Refinement, recap, follow-up questions | Eligible text actions use the canonical chain above. Specialized LLM wrappers remain for provider/mode compatibility. | Migrate the compatibility branches and compare all refinement intents and active mode contracts, including project follow-ups. |
| Clarification, brainstorming | Eligible text actions use the canonical chain. V3 transcript, restricted/custom mode and screenshot/explicit-problem branches retain specialized LLMs. | Move evidence authorization and screen context with their source lineage. |
| Live WTA | `IntelligenceManager` → `runWhatShouldISay` → V3/WTA snapshot and `WhatToAnswerLLM`, plus LLMHelper repair and regeneration | Extract evidence/source ownership, mode/style, trigger eligibility, precommit recovery, postprocessing, cancellation and session events before switching the production branch. |
| Accepted auto-answer, speculation, assist | Trigger/judge → `runAutoAnswer` / speculative entry → WTA. Assist → `runAssistMode` / V3 / AssistLLM. | Keep trigger, cooldown, deduplication and no-answer decisions, then converge generation. |
| Specialized coding and vision | `runCodeHint` → CodeHintLLM. IPC/screen workflows still use legacy image generation and local-only vision policy. | Canonical typed multimodal transport with existing validation, OCR, local vision, provider capability and formatting gates. |
| Phone Mirror | Independent phone IPC callback → mode/source policy and LLMHelper | Preserve both phone and desktop sender/result semantics through one canonical answer. |
| Generated follow-up email and role-insight responses | Existing IPC and specialized services | Trace their authorized documents, structured results and generated text before deciding each canonical boundary. |
| Non-answer infrastructure | Existing capture/STT, trigger judge, storage/indexing, session compaction, post-call processing, and provider probes | Keep independent infrastructure responsibilities. |

The selected custom/Curl/NIM/LiteLLM transports can return no canonical route. Existing provider selection and working compatibility calls are retained. For an action snapshot that may contain prior output with unknown lineage, authorization conservatively includes transcript, profile/history, reference-file and screenshot scopes where applicable. A provider denied a required scope cannot receive that snapshot. This can make an action unavailable under a restricted provider policy. Distinct session provenance and typed provider/multimodal transport are prerequisites for safely removing those guards or compatibility routes.

## Reproduction

Build with `npm run build` and then `npm run build:electron`. From the repository root, use the existing installed dependencies and a disposable test profile:

```bash
export NATIVELY_TEST_USERDATA="$(mktemp -d /tmp/chg20-unit-profile.XXXXXX)"
node scripts/run-with-env.mjs --set ELECTRON_RUN_AS_NODE=1 -- electron --test \
  electron/services/__tests__/CanonicalConversationActions.test.mjs \
  electron/services/__tests__/AmbientChatNullContextEvents.test.mjs \
  electron/services/__tests__/ManualContextFallback2026_06_16.test.mjs \
  electron/intelligence/engine/__tests__/Change18RagIpcIntegration.test.mjs \
  electron/rag/__tests__/LocalPrivateRagMode.test.mjs
```

Use a physical dependency copy and verified local assets when running desktop verification in an isolated worktree. The original CHG-19 runner's file allowlist is scoped to CHG-19. For this execution a temporary copy outside the worktree used the same Seatbelt policy and compared the pre-run and post-run Git status, paths, HEAD and index. No network, real profile, live provider, microphone or capture input was used. Evidence is stored outside the patch.

## WORK-0056 production wiring and remaining acceptance

| Surface and caller | Current owner and evidence | Remaining work |
| --- | --- | --- |
| `generate-what-to-say` / `runAutoAnswer` / speculation → `runWhatShouldISay` | Eligible general concept/definition turns use `LiveAnswer` → `SneakPeekIntelligenceEngine`. The planner limits retrieval to a bounded, request-owned speech window. The coordinator and EvidencePack render speech without a stored-meeting citation. ResponsePlanner reuses the established presentation contract. ProviderRouter and GenerationController dispatch one stream to the existing WTA delivery loop. Focused manual/auto/speculation and STOP tests and real renderer-to-IPC manual WTA passed. | V3 and WhatToAnswerLLM still serve mode-specific, grounded, follow-up, coding, image, DOM, skill, identity and fast-mode paths. WTA regenerations still have direct calls. Move authorized mode/file/profile sourcing, continuity, repair prompts and quality behavior before retiring those calls. |
| `generate-assist` → `runAssistMode` | Passive observations use the canonical action prompt and mixed-session snapshot, with completion-only renderer delivery. Tests cover completion and replacement cancellation. | V3 transcript-question and mode compatibility still use AssistLLM. Verify representative desktop assist. |
| `generate-code-hint` → `runCodeHint` | Existing IPC validates and optimizes images. Supported selected vision models receive typed attachments through ContextPlanner, the action adapter and GenerationController. Existing Code Hint token/final events and usage remain the consumers. Fake-provider tests cover image forwarding and denied screenshot scope. Real renderer-to-IPC offline test sent one synthetic image. | Legacy vision selection, unsupported models, text-only or mode-specific variants still use CodeHintLLM. Preserve capability, OCR and privacy behavior across all paths. |
| Standard manual chat and ordinary coding | Existing primary engine and canonical RAG adapters. Provider route supports selected text NIM, LiteLLM, custom and cURL endpoints, plus previously supported providers. Routing tests cover model binding, scope and empty allowlists. | Standalone manual actions and legacy manual identity, screen, skill, caller prompt, V3 and recovery routes still have separate generation. Custom multimodal, vision fallback and provider-template parity need dedicated checks. |
| Meeting and global overlays | `rag:query-meeting` / `rag:query-global` → canonical scoped evidence and cancellation. Same-profile desktop acceptance passed. ERR-065 keeps unavailable global queries inside the global overlay. | Meeting renderer fallback still builds an ordinary-chat prompt. Migrate with a scoped backend capability and sender identity preserved. |
| Profile, resume, named project and My Files | Standard manual chat uses its existing canonical RAG and source scopes. | Reconcile V3 policy ownership and compatible entrypoints, with exact source-authority and continuity tests. |
| Refinements, recap, follow-up questions, clarification and brainstorming | Existing WORK-0055/R2 canonical actions and restricted compatibility. | Move remaining V3 transcript, custom/strict mode and visual branches. |
| Phone Mirror, generated email and role insight | Existing phone IPC and specialized services still own generation. | Reuse canonical policy, preserving sender delivery, source authority and structured output. |

Canonical integration uses generated test data and fake providers. The desktop harness verifies real Electron preload and IPC execution for WTA and code hints, and actual overlay interactions for meeting/global. Auto-answer, speculative WTA and assist were exercised in engine fixtures. Live provider quality, full desktop parity and Windows execution remain open. See WORK-0056 for verification paths.

## WORK-0057 continuation

Text-only `runCodeHint` now enters the existing canonical action when mode/provider eligibility permits. Image-bearing hints retain their capability checks. Focused behavior tests prove dispatch and STOP with no late completion/history. Remaining compatibility categories above stay open. Source review also identifies registered `gemini-chat` and `analyze-image-file`, plus profile cover-letter/negotiation generation via the premium KnowledgeOrchestrator and `generateContentStructured`, for migration. Role Insight currently returns an `analyzeRole` placeholder rather than an implemented `analyse` service; do not count it as a working alternate generator. No production caller of ProcessingHelper.processScreenshots was found; current screenshot shortcuts dispatch handleWhatToSay. These are source observations, not desktop acceptance.

## WORK-0061 — Current production ownership (2026-11-14)

| Surface | Current dispatch and remaining work |
| --- | --- |
| Manual text, named-project and common coding questions | Primary engine uses planner-selected canonical storage adapters. Profile read authorization now selects permitted role types inside ContextPlanner before hydration, intersects the pinned source contract and retains revision metadata. Separate manual compatibility, standalone AnswerLLM, V3, skills, identity probes, caller-owned prompt and recovery still exist. |
| Manual streaming image chat | Default General or no-mode with a supported selected model uses canonical image generation. The existing renderer's mixed history, if supplied, is bounded and scoped as referent-only. Personalized modes and unsupported selected routes still use compatibility. |
| WTA and auto/speculation | Existing speech-only branch now includes eligible built-in Technical Interview concept/definition turns with a pinned mode. Grounded profile/JD/project/reference, custom mode, coding, skill, identity, fast-route, visual and continuity branches still use V3/WhatToAnswerLLM. Active WTA repair streams remain in IntelligenceEngine. |
| Assist | Existing eligible passive canonical branch remains. V3 transcript-question and custom/mode AssistLLM still dispatch independently. |
| Conversation actions | Existing canonical text actions and selected OCR/image brainstorming now use ConversationAction. Custom/strict and V3-context branches remain, including the legacy vision route when selected capabilities cannot handle an image. |
| Code Hint and callable image-file analysis | Existing WORK-0060 Code Hint delivery ownership retained. Supported callers can use canonical custom/cURL vision for one image. The registered analyze-image-file IPC now validates app-owned real paths and generates canonically. Legacy CodeHintLLM and WTA screenshot/mode paths remain. |
| Saved-meeting and global overlays | Meeting uses scoped canonical retrieval with a fallback to that saved meeting's bounded transcript and summary. No ordinary-chat fallback remains on either overlay. Global unavailable behavior and sender isolation pass desktop verification. Retained live RAG compatibility is separate. |
| Phone Mirror | Active onPhoneCommand chat callback still calls independent LLMHelper.streamChat. Mode and sender ownership are not migrated. |
| Document output | Follow-up email, profile cover letter and profile negotiation drafts enter canonical IPC generation. Role Insight was confirmed to be a placeholder. Meeting Notes regeneration remains separate post-call infrastructure. |
| Provider configuration | Existing selected text providers remain. Canonical custom/cURL supports one image when the selected template can carry it. It rejects image loss and multiple images, preserves selected ID, and retains private_vision and outbound-scope restrictions. Additional structured/template and mode/provider compatibility remains open. |

C20-AC1 FAIL and C20-AC2 PENDING. Focused macOS tests 136/0/0/0, both builds, three typechecks and sandboxed desktop scenarios passed. See WORK-0061 for logs, initial ERR-068 failures, and remaining acceptance limits.


## WORK-0062 — Phone Mirror canonical generation proposal (awaiting macOS validation)

`PhoneMirrorService.onPhoneCommand(chat)` retains incoming message sanitization, pinned mode and explicit source-switch clarification, but the actual answer now enters `buildPhoneMirrorCanonicalRequest → createPrimaryManualSneakPeekEngine → ContextPlanner → RetrievalCoordinator → EvidencePack → PromptAssembler → ProviderRouter/GenerationController`, with `streamRagEngineAnswer` mapping token/completion/error back to existing phone and desktop events. A separate `phone-mirror:active` conversation-state session prevents desktop request supersession from invalidating phone history. The t0 mode snapshot and exact file IDs are passed to the engine; mixed SessionTracker history is explicitly uncitable and subject to conservative outbound data-scope policy. The phone-generated result is persisted only after canonical completion.

Tests and source checks in WORK-0062 are not full macOS verification. Remaining active bypasses elsewhere in the WORK-0061 table keep C20-AC1 FAIL and C20-AC2 PENDING.


## WORK-0064 — November 14 current-archive correction (prepared only)

The owner-supplied archive contains the four new canonical modules `AnswerRequest`, `AnswerExecution`, `AnswerValidation`, and `CanonicalRuntime`, together with modified `IntelligenceEngine`, planner, retrieval, prompt, IPC and provider code. A read-only Copilot source audit of the owner's checkout reported HEAD `5efac5d` and 14 modified / 4 untracked paths. The archive has no Git history; its working-source identity needs owner confirmation before patch application. This newer source is materially different from the WORK-0062 owner milestone, so older route rows above are historical.

**Observed code boundaries, not yet desktop-verified:** `AnswerRequest` captures mode/provider/source inventory and `AnswerExecution` uses `SneakPeekIntelligenceEngine` for primary generation plus a pinned, single-provider canonical repair. `PhoneMirrorRequest` and `ipcHandlers` connect Phone Mirror to canonical generation. `ContextPlanner` owns required/forbidden evidence categories; its existing Phone Mirror branch lacked explicit meeting-source denial, covered by proposed ERR-069 fix. The prompt assembler now receives a dedicated no-meeting-evidence policy for denied phone meeting questions. Phone explicit source-switch clarification and WTA context-free clarification are deterministic preflight results, not independent final prompt/provider orchestration; do not conflate them with a second LLM answer generator. Their event/usage consistency still needs route-level tests.

**Acceptance remaining:** Verify actual production callers and any active independent compatibility generation; reconcile adapter-precomputed project/source facts with planner-owned authorization; test selected-provider and repair identity, source provenance, screen/vision permissions, STOP/supersession, renderer/phone delivery and cross-surface behavior. The proposed patch's isolated checks do not satisfy macOS Electron/desktop or Windows/live-provider acceptance. C20-AC1 FAIL/not fully established; C20-AC2 PENDING; do not begin CHG-21.

## WORK-0065 — canonical manual branch compile boundary (2026-11-14)

The latest source uses `createAnswerExecution` inside the primary `gemini-chat-stream` handler and returns from every canonical completion/error branch. The historical manual generator after that block is retained for CHG-22, but is unreachable during runtime. When the primary block was a bare `{...}` scope, TypeScript analyzed subsequent legacy code as following unconditional returns and produced 137 cascading flow/narrowing diagnostics. WORK-0065 expresses the same runtime-unconditional execution as `if (true as boolean) {...}`: TypeScript can type-check the legacy text as a possible branch, while emitted JavaScript still uses a literal `true`. This is **not** a compatibility fallback switch or authorization to execute the legacy generator. New regression tests assert the canonical-only boundary. The additional bad validator import in `AnswerValidation.ts` prevented `build:electron`; see ERR-070. All owner macOS and full-surface CHG-20 acceptance remain pending.

## WORK-0067 — Failed-suite evidence and ownership audit (2026-11-14)

- Current owner Mac verified 25/25 focused tests, builds and typechecks, but full intelligence 19 failed and Electron 107 failed (with interrupted/cancelled tests). See `chg20-regression-inventory-work0067.md`; this map is not production acceptance.
- Canonical manual chat: `ipcHandlers.ts` creates `AnswerExecution` and `CanonicalRuntime.ts` owns `createPrimaryManualSneakPeekEngine`, planned retrieval and provider transport. Pre-WORK-0067 tests that searched for this factory inside IPC were stale. The retained compatibility code is below a runtime-unconditional canonical return, and should not become an alternate generator to fix tests.
- Canonical WTA: `IntelligenceEngine.ts` owns the active `createAnswerExecution` flow and output terminality. WORK-0067 restores deterministic spoken cleanup/schema-stub/difference tracing; exact delivery, stop, fallback and mock-provider behavior await Electron verification.
- Provider image transport: `LLMHelper.streamFinalPrompt` now requires actual existing image paths (provider privacy still enforced). Use synthetic disposable PNG test fixtures, not missing hardcoded paths.
- No claim that old WTA fake providers, custom/local-only compatibility, source privacy, OBS actions, and renderer/phone integrations pass. Remaining bypasses and boundary failures keep C20-AC1 FAIL / C20-AC2 PENDING.

## WORK-0069 — Live WTA provenance boundary (2026-11-15)

The canonical WTA `buildAnswerRequest` in `IntelligenceEngine.runWhatShouldISay` previously converted every non-assistant SessionTracker turn (including manual chat) into `source: 'live'` transcript evidence and supplied all mixed turns in recent conversation, plus a possibly mixed follow-up `sessionSnapshot`. This contradicted the documented speech-only eligibility gate and failed private-decoy integration checks. The prepared WORK-0069 patch uses `selectWtaSpeechTurns` (explicit STT/test origin or absent origin with provider attribution, no typed/system/assistant override) as the **only** transcript/history/follow-up-snapshot input for that WTA request. Current manual question is kept separately. Unlabelled legacy entries are denied rather than presumed speech. Other independent action inputs and typed Phone Mirror evidence remain governed by their existing contracts.

Verification still required: real Electron `CanonicalConversationActions` all three manual/automatic/speculative speech fixtures, selected provider data scopes and full prompt, STOP and post-commit failure, V3 debug explicit-entity case, full intelligence and controlled Electron suites, desktop WTA/Phone Mirror and Windows. A conservative recent-speech-only snapshot may exclude legitimate older STT recall; verify later as a separate source-authorized feature rather than restoring a mixed private transcript. C20-AC1 FAIL and C20-AC2 PENDING; CHG-21 remains blocked.


## WORK-0070 — canonical RAG read authorization gate (2026-11-15)

The canonical project source runs `CanonicalRuntime.ts` → `createCanonicalRagRetrievalCapability` → `RAGManager.readPlannedCanonicalSource` → personal-file adapter. WORK-0069's planner ID list was passed directly to the read even when not authorized by the request's resolved `projectSourceIds`; result filtering happened afterward. WORK-0070 computes a pre-read intersection, denies a missing/empty project authorization and disjoint planned scope before any storage access, and keeps the final evidence filter and cancellation signal. The new adapter regression verifies the reader sees only the intersection, plus no-read and delayed-cancellation cases.

Owner WORK-0069 intelligence suite: 2,164 pass, zero fail, nine TODO. Controlled Electron: 8,929 pass, 98 fail, one cancelled, 67 skipped. These results predate WORK-0070 and do not establish C20-AC1 or C20-AC2. Remaining WTA speech-only lineage and follow-up context are recorded in ERR-076. Existing source/route map and CHG-20 migration status remain open.


### WORK-0071 — active WTA output and provider-test seam (2026-11-15)

`IntelligenceEngine.runWhatShouldISay` remains the production entrypoint; `captureAnswerContext` snapshots the provider route, `createAnswerExecution`/`CanonicalRuntime` assemble and authorize, and `GenerationController` invokes `llmHelper.streamFinalPrompt`. The retired `whatToAnswerLLM.generateStream` is not a fallback and must not be reactivated. WORK-0071 restores pre-validation raw-output/sentinel, candidate-voice, steering-tail and no-silent-final behavior in the active method. The old `whatToAnswerLLM` unit fixtures are being converted to test-only canonical streams, not production compatibility. Owner full Electron test still fails; source route and transport behavior remain under verification.

## WORK-0073 — Production dispatch and macOS evidence (2026-11-15)

The current working tree starts from main `5efac5d2` plus the owner's existing index and edits. The following callers share `SneakPeekIntelligenceEngine → ContextPlanner → RetrievalCoordinator → EvidencePack → ResponsePlanner → PromptAssembler → ProviderRouter → GenerationController → streamFinalPrompt`. The owner at each ingress keeps its existing sender/events and history contract.

| Surface | Active ingress and generation owner | Evidence |
| --- | --- | --- |
| Desktop manual text, images, mode instructions, caller prompts and skills | `preload.ts` → `gemini-chat-stream` / `gemini-chat` → `AnswerExecution` with the selected route and source snapshot | Real Electron preload and image stream; synthetic selected-model failure, authorized pre-commit fallback, post-commit failure, and STOP before parked transport release. |
| Standalone manual and compatibility suggestion | `submit-manual-question` → `runManualAnswer` → `AnswerExecution`; `generate-suggestion` → `buildAnswerRequest` / `collectCanonicalIpcAnswer` | Compiled manual/action checks and source review. No renderer caller for the old suggestion API was found; its registered entry still uses the canonical engine. |
| Live WTA, automatic, speculative and recovery | `generate-what-to-say` / accepted automatic trigger → `runWhatShouldISay` → `AnswerExecution`; repairs replay the original source/format/provenance and committed model | Renderer-to-preload WTA plus focused promotion, partial stream, JSON, deadline, relevance, stale repair and speculative cases. |
| Project, My Files, profile and mode references | `ContextPlanner` authorizes scopes; `CanonicalRuntime` invokes planned adapters; `CanonicalRagRetrievalAdapter` enforces pre-read project ID intersection | Compiled focused tests and intelligence suite cover authorized IDs, fallback, revision evidence, and denial. |
| Saved meeting, global and live RAG | `rag:query-meeting/global/live` → `streamSneakPeekMeetingAnswer` / `RagIpcStream` → shared runtime | Rendered meeting and global overlays, explicit and cross-sender cancellation, saved fallback, global failure isolation, repeated submission, IPC supersession, and same-profile relaunch. The registered live compatibility flag may decline to own a question; no active renderer invocation found. |
| Phone Mirror | Registered `onPhoneCommand` chat → `buildPhoneMirrorCanonicalRequest` → `RagIpcStream` and shared runtime; phone session/id separate from desktop | Source and compiled adapter/planner tests cover source policy, exact project IDs and uncitable mixed history. Handset delivery remains unexercised. |
| Assist, refine, recap, clarify, follow-up questions and brainstorm | IPC → `IntelligenceEngine` → `ConversationAction` → shared runtime. Passive assist keeps completion-only delivery | Compiled actions, selected local/cloud scope checks, parked assist replacement and late-token STOP. |
| Code Hint and screen answers | Validated attachments and OCR/DOM → `runCodeHint` / WTA → shared runtime. `analyze-image-file` → `collectCanonicalIpcAnswer` | Actual preload/IPC dispatch to deterministic vision transport, image-policy/continuity and path escape checks, compiled image/OCR denial and request-ID coverage. |
| Document drafts | `generate-followup-email` and profile cover-letter/negotiation IPCs → `generateDocumentDraft` → shared runtime | Actual email preload call and compiled active profile revision/cloud denial. |

Intentional separate responsibilities: STT/capture, image extraction/classification before a WTA answer, post-call notes/summary drafts, mode configuration generation, profile ingestion and index jobs, provider health checks, and dev benchmarks. Their calls produce metadata, structured records, or transport diagnostics under their own existing contracts. Diagram reconstruction and source-selection clarifications are deterministic. Role Insight's current user-facing generator is a placeholder. The original WTA method, V3 transcript final-prompt bridge, old suggestion helper, and historical manual block remain for CHG-22 review. Targeted caller and registration searches found no active link from the mapped answer entries to those final generators.

Local result JSON and screenshots: `/var/folders/ps/v67bmvpx4zv06tvclcd18rw40000gn/T/sneak-chg19-desktop-1GAQ2z/result.json` with 17 screenshots in its directory. Manual lifecycle observed selected model → permitted fallback with one token and one done before commitment, selected model alone with one token and one error after commitment, and STOP with one token and zero terminal answers before provider release. The Electron app ran with a disposable profile, synthetic content and deterministic network-free transports. C20-AC1 is supported by the local call map and regression evidence, with independent review open. C20-AC2 remains open pending independent review and any required live-provider/handset, latency and Windows acceptance. CHG-21 stays gated.


## WORK-0077 — Final CHG-20 acceptance (2026-11-16)

**C20-AC1 PASS.** WORK-0076 records the owner's independent Copilot source-review PASS. Rechecked the current diff and ingress/call searches against the production surface map above. Manual variants and registered suggestion, WTA and Code Hint, all scoped RAG IPC routes, Phone Mirror, assist/actions, personal/project/mode files, follow-ups and document drafts retain the canonical runtime. Dormant historical WTA/suggestion/manual compatibility, deterministic clarifications and separate non-answer duties remain as documented. The WORK-0076 legacy screenshot fix affects its retained testable helper, not active provider routing.

**C20-AC2 PASS.** macOS 26.4.1 arm64, Node 22.18.0, main c7d1f790 with WORK-0075/0076 owner changes. Five TS checks and renderer/Electron builds passed. Focused 93/93 including ERR-076 typed speech/recall, selected scopes, Phone Mirror adapter, WTA speculation/coding and ERR-090. Electron 9,034 passed/67 skipped. Intelligence 2,179 passed/9 TODO (engine glob included). Lib 382 passed/1 skipped. Scripts 99 passed. Additional saved meeting-note scope checks 93 passed. All zero failures/cancellations. Source-mode packaged asset integrity passed.

`node scripts/audit/run-chg20-desktop-acceptance.mjs` passed initial and same-profile relaunch (14 + 1 scenarios). In manual IPC through real renderer preload: STOP settled on stream 4 before release, its transport attempted a late chunk, and the only post-release deliveries belonged to recovery stream 5 (one token, one done). No fallback after commitment. Rendered meeting/global overlays also passed close, sender isolation, supersession, repeated Enter, saved source restrictions and relaunch. The earlier enhanced run stalled after manual STOP had passed and was terminated. The final harness bounded launcher paint waiting and disabled background throttling in its disposable launcher. Evidence: `/Users/abitesh/Downloads/Sneak-Peek-WORK0077.YRLAFI/desktop-chg20/result.json` plus captured screenshots and Downloads suite logs.

**Skip reconciliation:** Electron 67 skips include replaced OCR APIs, Windows/Go/Java specifics, generated-mode and unavailable benchmark/API fixtures, and gated external-provider/backend integration. The authoritative screen and source restrictions, WTA code/style, and fallback paths ran in focused suites and the desktop harness. Intelligence 9 TODOs are expanded product/system baselines (memory, search, lecture, diagram, fusion and cross-user memory), outside this migration gate. One lib skip is the absent upstream API review ledger. No baseline skip was promoted to a pass. Windows desktop, real cloud-provider credentials, physical handset/audio and real-world completion latency were not exercised. C20 covers architecture and scoped macOS verification. Phone-specific source authority was tested at the compiled request/runtime boundary. Release and wider quality checks are tracked separately.


## WORK-0078 — CHG-21 boundary check

The canonical ingress/provider ownership above remains current for the changed paths. Denied stored history is excluded before understanding and prompt construction. The active meeting/global engine normalizes only lookup terms and keeps internal typed provenance. Unified source read, provider/model commitment and stream settlement remain in their existing owners. The [rendered CHG-21 matrices](chg21-quality-evaluation.md#work-0078--repeated-local-model-and-rendered-acceptance-2026-11-17) cover production local transport after scoped retrieval alongside the deterministic cancellation, fallback and same-profile tests. No legacy removal was attempted before CHG-21 acceptance.
