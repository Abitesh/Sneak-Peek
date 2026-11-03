# WORK-0011 — current failure and reachability audit

Baseline: local main `1c68d27a`, macOS, Electron ABI. Full `npm test` with HF offline settings: 8,910 tests, 8,589 pass, 225 fail, 15 cancelled, 81 skipped. The table counts failure-summary entries, including cancelled tests; it is not a sum of only failing leaf assertions. No Windows or CI execution.

Classification: A real production regression; B stale/historical; C harness/source-scan drift; D environment/native precondition; E migration test needing rewrite; F intentional current behavior; G unknown pending investigation. G is deliberately retained in the active suite.

## Per-file baseline classification

| File | Entries | Class | Evidence / disposition |
|---|---:|---|---|
| `electron/audio/__tests__/BluetoothHfpAvoidance.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/audio/__tests__/LlmStreamAbortController.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/audio/__tests__/LocalWhisperStuckWorker.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/audio/__tests__/ModelChangedTargeting.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/audio/__tests__/OverlayAuxVisibilityOrdering.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/audio/__tests__/RagQueryKeyIsolation.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/audio/__tests__/RagQuerySupersession2026_07_28.test.mjs` | 4 | G | Current cause not yet established; retained active. |
| `electron/audio/__tests__/RelayFallbackLadder.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/audio/__tests__/SneakPeekProSTTConnectedStatus.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/CustomModeSourceIsolation2026_07_06.test.mjs` | 3 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/GroqModelLadder2026_08_23.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/GroqReviewFixes2026_08_23.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/ManualChatOutlivesServerRotation2026_08_18.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/ManualRealSessionFixes2026_06_12.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/PronounRegexShadowDivergence2026_07_26.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/ResidualFixes2026_06_07.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/RoutingFallbackCascade2026_08_31.test.mjs` | 5 | C | Old singleton seed and/or unisolated local-runtime probe; focused repair passes in fresh full suite. |
| `electron/llm/__tests__/RoutingReleaseFixes2026_06_06.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/RunawayStreamOutputCap2026_08_12.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/SpaceAwareThresholds2026_08_13.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/llm/__tests__/TruncatedAnswerNotStored2026_08_12.test.mjs` | 5 | C | Stale source locators repaired; all 26 focused checks pass and fresh full suite lists no failure in this file. |
| `electron/llm/__tests__/WtaManualParity.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/rag/__tests__/CanonicalChatIntegration.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/rag/__tests__/CanonicalRagReadProduction.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/rag/__tests__/Change46FinalValidation.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/rag/__tests__/CrossFeatureReindexConcurrency.test.mjs` | 2 | B | Retired Knowledge node embedding API; preserved as .historical.mjs. See retirement proof below. |
| `electron/rag/__tests__/EmbeddingConfigStateAwareness.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/rag/__tests__/IngestConcurrencyStarLoss2026_08_02.test.mjs` | 2 | E | Mixed current feature and retired API assumptions; retained for migration, not retired wholesale. |
| `electron/rag/__tests__/IngestInFlightSurvivesPanelClose2026_08_02.test.mjs` | 3 | E | Mixed current feature and retired API assumptions; retained for migration, not retired wholesale. |
| `electron/rag/__tests__/KnowledgeDegradeToLocal.test.mjs` | 8 | B | Retired Knowledge node embedding API; preserved as .historical.mjs. See retirement proof below. |
| `electron/rag/__tests__/KnowledgeIngestSpaceMetadata.test.mjs` | 1 | B | Retired Knowledge node embedding API; preserved as .historical.mjs. See retirement proof below. |
| `electron/rag/__tests__/KnowledgeReembedIntegration.test.mjs` | 18 | E | Mixed current feature and retired API assumptions; retained for migration, not retired wholesale. |
| `electron/rag/__tests__/KnowledgeReembedLoopBound.test.mjs` | 13 | E | Mixed current feature and retired API assumptions; retained for migration, not retired wholesale. |
| `electron/rag/__tests__/KnowledgeSpaceReembed.test.mjs` | 7 | B | Retired Knowledge node embedding API; preserved as .historical.mjs. See retirement proof below. |
| `electron/rag/__tests__/LegacySqlSearchGuardCrossFeature.test.mjs` | 2 | E | Mixed current feature and retired API assumptions; retained for migration, not retired wholesale. |
| `electron/rag/__tests__/LocalRerankerPackagedBuildSimulation2026_07_25.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/rag/__tests__/SalaryEstimatePersistence2026_08_02.test.mjs` | 4 | E | Mixed current feature and retired API assumptions; retained for migration, not retired wholesale. |
| `electron/services/__tests__/CaptureChannelIsolation2026_08_14.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/CodexVisionPayload2026_08_05.test.mjs` | 10 | C | Old singleton seed and/or unisolated local-runtime probe; focused repair passes in fresh full suite. |
| `electron/services/__tests__/CompanySearchProviderWiring.test.mjs` | 7 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/CustomModes.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/DisabledProviderRouting2026_08_01.test.mjs` | 4 | C | Old singleton seed and/or unisolated local-runtime probe; focused repair passes in fresh full suite. |
| `electron/services/__tests__/HeuristicExtractor.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/IngestResilience.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/IntelligenceEngineAnswerRelevance.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/IntelligenceEngineScaffoldContaminationFallback.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/KnowledgeOrchestratorIngest.test.mjs` | 7 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/LLMHelperNegotiationCoachingGate.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/LicenseNativeModuleAbsent.test.mjs` | 20 | A | After native premise isolation, legacy-provider default and perpetual-file preservation regressions remained; scoped fail-closed repair. |
| `electron/services/__tests__/LiveRagSingleSignal2026_08_14.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/LocalWhisperStopFlush.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ManualScreenshotScreenContext2026_08_05.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ModeBleeding.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ModeHybridChunkCache.test.mjs` | 4 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ModePinnedResolution.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ModeReferenceFileIngestResultContent2026_07_26.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ModeSpeculativeRerank.test.mjs` | 3 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/MyFilesOutsideFallback2026_08_31.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/NegotiationStickinessAndCircuitBreaker.test.mjs` | 6 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/OllamaManagerGating2026_07_07.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/OutboundBoundaryUniversality2026_08_01.test.mjs` | 8 | C | Old singleton seed and/or unisolated local-runtime probe; focused repair passes in fresh full suite. |
| `electron/services/__tests__/PersonaFabricationFallbackProductionPath.test.mjs` | 3 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ProfileFactualRecallProductionPath.test.mjs` | 5 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ProfileGroundingV2.test.mjs` | 8 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ProfileIntelligenceE2E.test.mjs` | 5 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ProfileIntelligenceGate.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ProviderGatewayPolicy.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/RealPdfIngestion.test.mjs` | 2 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/RetentionAndHybridRag.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/RetrievalConsolidation2026_07_23.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/SafeDocumentTextExtractor.test.mjs` | 3 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/SafeDocumentTextExtractorPdfTimeout.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/ScreenPipeline2026_08_31.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/SensitiveLogRedaction.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/SettingsDegradedStoreMutators2026_08_22.test.mjs` | 3 | C | Old singleton seed and/or unisolated local-runtime probe; focused repair passes in fresh full suite. |
| `electron/services/__tests__/SingletonCrossBundleSweep2026_07_31.test.mjs` | 1 | C | Old singleton seed and/or unisolated local-runtime probe; focused repair passes in fresh full suite. |
| `electron/services/__tests__/SkillCategorization.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/SkillCategorizationIngest.test.mjs` | 3 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/SneakPeekAutoDefaultRevert2026_08_27.test.mjs` | 4 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/SprintAcceptanceWiring2026_08_31.test.mjs` | 1 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/TranscriptIntentRoutingIntegration.test.mjs` | 4 | G | Current cause not yet established; retained active. |
| `electron/services/__tests__/WhatToAnswerSnapshotWiring.test.mjs` | 1 | G | Current cause not yet established; retained active. |

## Retirement proof (four files only)

The four historical files exclusively construct retired Knowledge node storage/reembedding contracts (`saveNodes`, `getNodesNeedingReembed`, `updateNodeEmbedding`, `_runReembed`). Fresh production searches found no definitions or active callers for these APIs. `premium/electron/knowledge/KnowledgeDatabaseManager.ts` explicitly describes its compatibility stub; current `ensureEmbeddingSpace` does not implement the old node loop. Canonical storage/indexing/embedding services own document revision and embedding spaces. Current regression replacements: `CanonicalEmbeddingService.test.mjs`, `CanonicalPersonalRagService.test.mjs`, `CanonicalRagIndexer.test.mjs`, and canonical storage tests. Historical files retain their contents and are executable explicitly; no production files were deleted.

The earlier audit is not sufficient proof to retire all suggested files: `LegacySqlSearchGuardCrossFeature` contains active VectorStore/SQL guards, and the current premium KnowledgeOrchestrator still reads/writes `profile_documents`. Those files and salary/ingest behavior tests remain active pending migration. Missing an old method alone does not prove its user-facing behavior is obsolete.

## Current path reachability

| Path | Classification | Current evidence |
|---|---|---|
| Primary manual/meeting engine | LIVE | ipcHandlers creates `createPrimaryManualSneakPeekEngine`, hands requests to `prepareAndStream`. |
| RetrievalCoordinator | LIVE | engine.handle retrieves through injected capabilities. |
| CanonicalRagRetrievalAdapter factory | TEST ONLY | fresh symbol search finds definition and tests, no production caller; CHG-17 wiring is incomplete. Keep pending migration. |
| RAGManager.search | LIVE | current IPC capabilities and source ports call it with explicit selected/allowed source families. |
| RAGManager.queryGlobal/buildRAGPrompt | LIVE | rag:query-global IPC still calls queryGlobal. CHG-18 migration remains gated. |
| RAGManager.queryMeeting/query/queryLive | COMPATIBILITY | public methods call one another; keep until all callers and global migration are resolved. |
| WhatToAnswerLLM | LIVE | IntelligenceEngine constructs it for WTA/auto-answer; do not delete. |
| ModeHybridRetriever/ModeContextRetriever/ModeRagAdapter | LIVE | ModesManager retrieval/indexing, RAGManager adapters, EvidenceResolver. |
| LLMHelper hybrid source fallback | FALLBACK | resolveManualDocumentGroundedContextWithLegacyFallback and existing scoped compatibility routes. |
| KnowledgeOrchestrator (premium path) | LIVE | main loads source-controlled premium implementation; profile IPC consumes it. |
| electron/services/knowledge/KnowledgeOrchestrator | COMPATIBILITY | no direct production importer found in targeted search; further dynamic/storage proof required before deletion. |
| EvidenceResolver | LIVE | IPC, WTA and LLMHelper governed factual paths. |
| HindsightManager | LIVE | existing single-flight start guard/process ownership retained; optional long-term memory. |

## Verification limits

Nine intelligence TODOs are explicitly declared historical baseline placeholders in `electron/intelligence/__tests__/baseline/PendingSystemsBaseline.test.mjs`; their old NOT FOUND text is historical, not a current acceptance report. A skipped live Hindsight test is opt-in. Real retain/recall and Router fallback were not executed because this task explicitly forbids paid provider calls and credential access. The new diagnostic uses a unique UUID bank and deletes only that bank when supported.

## Fresh full-suite result after scoped repairs

2026-11-03, macOS, Electron ABI, `HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 npm test`: 8,892 tests; 8,639 pass, 172 fail, zero cancelled, 81 skipped. Baseline was 8,910 tests; 8,589 pass, 225 fail, 15 cancelled, 81 skipped. Four retired historical files account for 18 fewer tests. The 172 failures remain active and must not be interpreted as passing. The 71 files below are grouped by failed leaf assertions from the test report; suite-level summary lines may also appear. Full raw local log: `/tmp/sneak-peek-work0011-npm-test-final.log`.

| Current failing file | Failed assertions |
|---|---:|
| `electron/rag/__tests__/KnowledgeReembedIntegration.test.mjs` | 18 |
| `electron/rag/__tests__/KnowledgeReembedLoopBound.test.mjs` | 13 |
| `electron/services/__tests__/ProfileGroundingV2.test.mjs` | 8 |
| `electron/services/__tests__/CompanySearchProviderWiring.test.mjs` | 7 |
| `electron/services/__tests__/KnowledgeOrchestratorIngest.test.mjs` | 7 |
| `electron/services/__tests__/NegotiationStickinessAndCircuitBreaker.test.mjs` | 6 |
| `electron/services/__tests__/ProfileFactualRecallProductionPath.test.mjs` | 5 |
| `electron/services/__tests__/ProfileIntelligenceE2E.test.mjs` | 5 |
| `electron/audio/__tests__/RagQuerySupersession2026_07_28.test.mjs` | 4 |
| `electron/rag/__tests__/SalaryEstimatePersistence2026_08_02.test.mjs` | 4 |
| `electron/services/__tests__/ModeHybridChunkCache.test.mjs` | 4 |
| `electron/services/__tests__/SneakPeekAutoDefaultRevert2026_08_27.test.mjs` | 4 |
| `electron/services/__tests__/TranscriptIntentRoutingIntegration.test.mjs` | 4 |
| `electron/llm/__tests__/CustomModeSourceIsolation2026_07_06.test.mjs` | 3 |
| `electron/rag/__tests__/IngestInFlightSurvivesPanelClose2026_08_02.test.mjs` | 3 |
| `electron/services/__tests__/ModeSpeculativeRerank.test.mjs` | 3 |
| `electron/services/__tests__/PersonaFabricationFallbackProductionPath.test.mjs` | 3 |
| `electron/services/__tests__/SafeDocumentTextExtractor.test.mjs` | 3 |
| `electron/services/__tests__/SkillCategorizationIngest.test.mjs` | 3 |
| `electron/audio/__tests__/LocalWhisperStuckWorker.test.mjs` | 2 |
| `electron/llm/__tests__/ManualChatOutlivesServerRotation2026_08_18.test.mjs` | 2 |
| `electron/llm/__tests__/ManualRealSessionFixes2026_06_12.test.mjs` | 2 |
| `electron/llm/__tests__/PronounRegexShadowDivergence2026_07_26.test.mjs` | 2 |
| `electron/llm/__tests__/ResidualFixes2026_06_07.test.mjs` | 2 |
| `electron/llm/__tests__/RunawayStreamOutputCap2026_08_12.test.mjs` | 2 |
| `electron/llm/__tests__/WtaManualParity.test.mjs` | 2 |
| `electron/rag/__tests__/IngestConcurrencyStarLoss2026_08_02.test.mjs` | 2 |
| `electron/rag/__tests__/LegacySqlSearchGuardCrossFeature.test.mjs` | 2 |
| `electron/services/__tests__/LLMHelperNegotiationCoachingGate.test.mjs` | 2 |
| `electron/services/__tests__/LocalWhisperStopFlush.test.mjs` | 2 |
| `electron/services/__tests__/OllamaManagerGating2026_07_07.test.mjs` | 2 |
| `electron/services/__tests__/RealPdfIngestion.test.mjs` | 2 |
| `electron/audio/__tests__/BluetoothHfpAvoidance.test.mjs` | 1 |
| `electron/audio/__tests__/LlmStreamAbortController.test.mjs` | 1 |
| `electron/audio/__tests__/ModelChangedTargeting.test.mjs` | 1 |
| `electron/audio/__tests__/OverlayAuxVisibilityOrdering.test.mjs` | 1 |
| `electron/audio/__tests__/RagQueryKeyIsolation.test.mjs` | 1 |
| `electron/audio/__tests__/RelayFallbackLadder.test.mjs` | 1 |
| `electron/audio/__tests__/SneakPeekProSTTConnectedStatus.test.mjs` | 1 |
| `electron/llm/__tests__/GroqModelLadder2026_08_23.test.mjs` | 1 |
| `electron/llm/__tests__/GroqReviewFixes2026_08_23.test.mjs` | 1 |
| `electron/llm/__tests__/RoutingReleaseFixes2026_06_06.test.mjs` | 1 |
| `electron/llm/__tests__/SpaceAwareThresholds2026_08_13.test.mjs` | 1 |
| `electron/rag/__tests__/CanonicalChatIntegration.test.mjs` | 1 |
| `electron/rag/__tests__/CanonicalRagReadProduction.test.mjs` | 1 |
| `electron/rag/__tests__/Change46FinalValidation.test.mjs` | 1 |
| `electron/rag/__tests__/EmbeddingConfigStateAwareness.test.mjs` | 1 |
| `electron/rag/__tests__/LocalRerankerPackagedBuildSimulation2026_07_25.test.mjs` | 1 |
| `electron/services/__tests__/CaptureChannelIsolation2026_08_14.test.mjs` | 1 |
| `electron/services/__tests__/CustomModes.test.mjs` | 1 |
| `electron/services/__tests__/HeuristicExtractor.test.mjs` | 1 |
| `electron/services/__tests__/IngestResilience.test.mjs` | 1 |
| `electron/services/__tests__/IntelligenceEngineAnswerRelevance.test.mjs` | 1 |
| `electron/services/__tests__/IntelligenceEngineScaffoldContaminationFallback.test.mjs` | 1 |
| `electron/services/__tests__/LicenseNativeModulePresent.test.mjs` | 1 |
| `electron/services/__tests__/LiveRagSingleSignal2026_08_14.test.mjs` | 1 |
| `electron/services/__tests__/ManualScreenshotScreenContext2026_08_05.test.mjs` | 1 |
| `electron/services/__tests__/ModeBleeding.test.mjs` | 1 |
| `electron/services/__tests__/ModePinnedResolution.test.mjs` | 1 |
| `electron/services/__tests__/ModeReferenceFileIngestResultContent2026_07_26.test.mjs` | 1 |
| `electron/services/__tests__/MyFilesOutsideFallback2026_08_31.test.mjs` | 1 |
| `electron/services/__tests__/ProfileIntelligenceGate.test.mjs` | 1 |
| `electron/services/__tests__/ProviderGatewayPolicy.test.mjs` | 1 |
| `electron/services/__tests__/RetentionAndHybridRag.test.mjs` | 1 |
| `electron/services/__tests__/RetrievalConsolidation2026_07_23.test.mjs` | 1 |
| `electron/services/__tests__/SafeDocumentTextExtractorPdfTimeout.test.mjs` | 1 |
| `electron/services/__tests__/ScreenPipeline2026_08_31.test.mjs` | 1 |
| `electron/services/__tests__/SensitiveLogRedaction.test.mjs` | 1 |
| `electron/services/__tests__/SkillCategorization.test.mjs` | 1 |
| `electron/services/__tests__/SprintAcceptanceWiring2026_08_31.test.mjs` | 1 |
| `electron/services/__tests__/WhatToAnswerSnapshotWiring.test.mjs` | 1 |

`npm run test:intelligence`: 2,052 tests, 2,043 pass, zero fail, nine historical TODO. Engine tests are now in this command. Typechecks and Electron build pass. Live app, Windows, paid Router fallback, and real Hindsight retain/recall remain unverified.
