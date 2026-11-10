# CHG-19 responsibility and call inventory — WORK-0041 / TASK-0002

Date: 2026-11-09 (Asia/Kolkata). Inspected baseline: main/9e19e964, clean index and tree. Owner explicitly authorizes CHG-19 now, superseding the earlier instruction not to start it. WORK-0032–0040 and 8,991 passes are owner-reported; repository records end at WORK-0028. Reserve those owner-reported IDs; do not fabricate their history. New execution uses WORK-0041. No code-review-graph tool is configured; searches, TypeScript syntax inspection and direct source/caller inspection used.

## Before-edit inventory

| Candidate / responsibility | Actual production edges | Disposition / reason |
| --- | --- | --- |
| `electron/IntelligenceEngine.ts` live answer strategy, trigger ownership, generation guards | `IntelligenceManager` constructs it; runWhatShouldISay, runAssistMode, recap/clarify/follow-up/code/brainstorm methods remain exposed; IPC/manager and automatic triggers dispatch here | Retain. Unique active live/screen/skill behavior; not fully transferred. CHG-20 must prove cancellation, skill, screen and live parity before removal. |
| `intelligence/ContextRouter.ts` shadow routing and backward-looking query predicate | `ipcHandlers` calls routeContext behind contextRouterV2 in compatibility handler; imports isBackwardLookingQuery for memory policy; AnswerContract type consumed by PromptAssemblerV2 | Retain. Diagnostics and memory predicate remain active. Shadow is not a second provider but still has an observable consumer. |
| `intelligence/ContextFusionEngine.ts` ordering, deduplication, trust budgeting | WhatToAnswerLLM calls fuseContext → toPromptContextContract behind promptAssemblerV2; types consumed by PromptAssemblerV2 | Retain. Shadow inclusion-report semantics have no demonstrated canonical replacement. |
| `intelligence/PromptAssemblerV2.ts` shadow context XML and inclusion report | WhatToAnswerLLM calls assemblePromptV2 and records inclusionReport via IntelligenceTrace | Retain. Flag-on diagnostics still observable; do not delete flags/tests to hide dependency. |
| `llm/WhatToAnswerLLM.ts` legacy prompt/strategy, streamed answer | IntelligenceEngine constructs it; generateStream consumes frozen WTA snapshot; V3 prompt overrides dispatched user/system content; active skills are merged and cancellation/output guards remain | Retain compatibility. V1 packet still used when V3 is absent, plus trace/shadow consumers even when V3 is present. No equivalent new-engine surface migration established. |
| `context-intelligence/orchestration/orchestrator.ts` decide/orchestrate | engine-bridge.buildV3Prompt calls orchestrate; primary IPC profile retrieval capability calls decide to adapt to claim/source policies; RAGManager imports RetrievalPort type | Retain. Canonical profile capability still relies on its source authority; cannot remove as merely legacy. |
| `context-intelligence/generation/prompt-composer.ts` and context-packer.ts | engine-bridge calls composePrompt; composer calls packContext; bridge called by IPC compatibility and IntelligenceEngine WTA/proactive/manual paths | Retain active V3 compatibility. New prompt builder has a different evidence/claim contract; byte or behavioral equivalence not established. |
| `context-intelligence/question/*` resolution, classification, conversation state | SneakPeekIntelligenceEngine calls understandTurn, conversation-state-store and TranscriptContext; ContextPlanner/ResponsePlanner use types; resolver calls classifyTurn/resolveReference; bridge/orchestrator also reuse store | Retain shared canonical infrastructure. These are new-engine dependencies, not duplicate files. |
| `rag/prompts.ts` / direct RAG answer generation | File absent; RAGManager has no queryMeeting/queryGlobal/streamRagAnswer/smartQuery entry | Already removed before this task. No deletion credit. RAG storage/indexing/search/locators remain untouched. |
| `SneakPeekIntelligenceEngine.cancelledResult` repeated planning and assembly inputs | handle() early-abort branch; prepareAndStream ultimately delegates to handle | Safe consolidation proposed below. Pure duplicated calls already use canonical owners. No active provider or retrieval dispatch to remove. |

## Primary and compatibility call graphs

Primary text: SneakPeekInterface → preload.streamGeminiChat → gemini-chat-stream → createPrimaryManualSneakPeekEngine → SneakPeekIntelligenceEngine → understandTurn → ContextPlanner → RetrievalCoordinator → EvidencePack → ResponsePlanner/PromptAssembler → GenerationController/ProviderRouter → LLMHelper.streamFinalPrompt → sender-scoped token/done.

Meeting/global/live RAG: MeetingChatOverlay / GlobalChatOverlay / live consumers → preload ragQueryMeeting/Global/Live → IPC streamSneakPeekMeetingAnswer → RagIpcStream → same engine. Meeting scope and global-meetings-only scope retained. Live RAG eligibility/transport contracts remain unchanged.

Compatibility: image-bearing, skill-prefixed, caller-owned-prompt, identity/evasion cases and eligible pre-commit failures can use the remainder of gemini-chat-stream. V3-enabled path → engine-bridge → orchestrate/composePrompt → LLMHelper transport. Legacy live manager → IntelligenceEngine → buildV3Prompt + WhatToAnswerLLM; flag-off/failed V3 uses legacy prompt contracts. No post-commit switch is added. LLMHelper and renderer entrypoints are unchanged.

Primary profile adapter still calls V3 decide inside its authorized retrieval capability; its claim-authority output cannot yet be replaced by ContextPlan alone. Removing it would be policy change, not safe dead-code removal. Canonical RAG remains the storage/index/retrieval owner; no schema/data/lifecycle changes.

## Mandatory evidence for the planned consolidation

1. **Old responsibility:** cancelledResult independently repeats understandTurn five times, planContext four times, conversation-context collection twice and empty evidence-pack construction twice, for one already-aborted request.
2. **New owner:** existing canonical understandTurn, planContext, getRecentConversationContext and buildEvidencePackFromSneakPeekEvidence; compute each once in cancelledResult and reuse. No new policy or orchestrator.
3. **Old callers:** handle's pre-cancelled branch; prepareAndStream invokes handle. No public cancelledResult API, IPC channel, database or renderer consumer directly calls it. Repository-wide search checks dynamic names too.
4. **New caller:** same handle → cancelledResult boundary, same result and prompt fields. Only duplicate internal expressions removed; no exported symbols/interfaces removed.
5. **Equivalence:** capture before/after serialized actual engine outputs under a fixed clock for synthetic general/personal/project/code/follow-up/screen/meeting/global cases, plus executed regression asserting no retrieval/provider calls and empty evidence. Run full intelligence and broader suite.
6. **Safety:** preserves function arguments/defaults, early cancellation, response metadata, prompt policy, no side effects/provider calls. Shared plans are read-only inputs to downstream builders; inspect consumers before accepting. No native/audio/settings/security/license changes.

## Remaining gates

CHG-19 cannot certify all legacy intelligence responsibilities transferred: active callers above contradict that claim. CHG-20 must explicitly validate/migrate image/skill/caller-owned prompt, live/WTA/proactive, compatibility V3 and profile claim-authority boundaries. No CHG-20 implementation is authorized by this task. Windows runtime and real-provider manual UX are not established by offline macOS tests. Final commands/results and decision will be appended after execution.

## WORK-0041 continuation — patch candidate and remaining active edges

The owner-supplied current-files ZIP already contains the pre-cancelled result consolidation and eight cancelled-surface regressions. This continuation does **not** reapply the original change. The proposed patch reuses `resolvedQuestion` once inside that cancellation snapshot and adds an executed-entry regression for `prepareAndStream`: no retrieval/provider activity, empty stream, settled cancelled result and cancelled lifecycle. The same patch replaces ERR-058's timing-only waits with bounded observation of the actual ordered retain queue in a test; no memory implementation is changed.

The proposed patch is built from owner-uploaded source, not applied to the owner's Mac checkout. All code and manual verification remain subject to local `git apply --check` and tests. No fully safe additional legacy deletion was established by the caller inventory. `ContextRouter`, `ContextFusionEngine`, `PromptAssemblerV2`, V3 composer/orchestrator, `WhatToAnswerLLM` and the live `IntelligenceEngine` still require CHG-20 migration/compatibility evidence before removal. Explicitly leave those files untouched.

Remaining verification: inspect the post-reveal full-app screenshot, rerun ERR-058 on an idle runner, run focused engine/queue tests, Electron/TypeScript/build checks, `npm test`, `test:intelligence`, check clean diff boundaries, then record manual/macOS/Windows acceptance results without claiming they happened here. No audio/STT/native/DB/policy/licensing mutation is proposed.
