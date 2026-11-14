# CHG-20 surface inventory

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
