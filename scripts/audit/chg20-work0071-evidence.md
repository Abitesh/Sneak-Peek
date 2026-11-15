# WORK-0071 — CHG-20 WTA canonical output parity and test seam evidence (2026-11-15)

## Source of truth / baseline

Reconstructed owner WORK-0070 working source from the November 14 ZIP plus WORK-0064/65/66/67/69/70 patches. This is a disposable snapshot, not the owner's `.git` tree. All staged/unstaged/untracked owner changes must remain untouched when applying the patch. AGENTS.md and the required project records were read. The owner reported WORK-0070 applied successfully, three TypeScript checks and `build:electron` passed, focused canonical RAG/IPC tests **48/48**, intelligence tests **2166/2175 passed, zero failures, nine TODO**. The latest separate npm test attachment reports **9095 total, 8915 pass, 98 fail, one cancelled, 81 skipped**. This broad run is not accepted and is NOT a verification of WORK-0071.

## Distinct failure families / mistakes

- **81 failing entries** throw `Active provider transport is not yet supported by the Sneak-Peek generation contract`. Legacy tests stub `whatToAnswerLLM.generateStream` (retired by CHG-20) and provide no `getSneakPeekGenerationRouteOptions`/`streamFinalPrompt`. Production correctly fails closed when no route exists. Adding a legacy fallback or allowing null routes to proceed would break provider pinning/privacy. Previous patches failed to tackle this large fixture problem, leaving the broad count at 98. Do not repeat that mistake.
- **Eight failures** use incomplete action fakes missing `fitContextForCurrentModel`. These require dedicated actor/IPC source verification; not altered by WORK-0071.
- **Nine action/integration entries** include provider denial, image/OCR scope, stale assist and local-only semantics. They are NOT automatically fixture errors; not altered by WORK-0071.
- **One stale static assertion** expects `this.llmHelper.streamChat(... abortSignal)` in the background verifier even though active WTA uses `execution.repair('code-verification',...,abortSignal)`. Its test now checks that real canonical call and retains the supersession guard.
- The old WTA raw output safety, provider error handling, candidate sanitizer, narrow steering-tail guard, sentinel fallback and manual error emit were partially missing in the active canonical WTA branch. This is a genuine implementation parity gap, separate from test-fixture drift. Restore deterministic guards without reviving the historical generator.

## Changed scope

- Production: new pure `WtaRawOutputPolicy.ts`; `IntelligenceEngine.ts` raw pre-validation decision, manual/synthetic fallback delivery, candidate sanitizer, and narrow small-talk steering tail.
- Tests: 10 legacy single-answer fixture factories and five further fixtures migrated to test-only canonical `streamFinalPrompt` + pinned Ollama test route; the old assertions remain for behavior, session persistence, abort and streaming. One empty-provider test changes from obsolete legacy generator expectations to current canonical no-silent-output semantics. New pure WTA policy and transport fixture tests. Scope-checking tests and `CanonicalConversationActions` are intentionally NOT converted to a permissive fake.
- Tracked records: ERROR_LOG ERR-077/078, CHANGE_LOG WORK-0071, TASK_TRACKER and HANDOFF, surface map. AGENTS.md already contains ZIP-only and review rules; no duplication.

## Local checks vs pending

- Local isolated TypeScript 5.8/JS transpilation of WTA policy and output owner passed syntax check; strict TypeScript standalone check for the pure policy passed.
- Local actual Node tests: `WtaRawOutputPolicy.test.mjs` **5/5** after compiling its two pure TS modules into disposable dist; `CanonicalWtaTestTransport.test.mjs` **2/2**; `WhatToAnswerSnapshotWiring.test.mjs` **30/30**. Modified .mjs files passed `node --check`.
- No dependencies or native Electron runtime are present in the disposable ZIP copy. **NOT verified:** actual macOS full build/typechecks, migrated 70+ WTA cases, complete `npm test`, live provider privacy/vision, STOP, long-session, packaged desktop and Windows. Many migrated tests may expose additional real missing canonical-output parity after they can finally reach generation; do not equate "mock error removed" to "test passed".
- Owner must use the ZIP README's self-contained `~/Downloads/Sneak-Peek-WORK0071-logs` commands to run in order: typechecks/build, focused tests, controlled `npm test`; preserve all owner Git changes and report full raw test log and extracted failure details.

**Acceptance:** C20-AC1 FAIL/unproven; C20-AC2 PENDING; CHG-21 BLOCKED. No commit, stage, push, reset, stash or clean.
