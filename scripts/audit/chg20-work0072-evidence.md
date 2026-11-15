# WORK-0072 — CHG-20 remaining WTA/action suite evidence (2026-11-15)

## Owner-reported evidence

WORK-0071 successfully applied. Three Electron TypeScript checks, renderer build, Electron build all pass on owner Mac. `npm test -- --test-concurrency=4`: 9,097 tests, 8,987 pass, 28 fail, one cancelled, 81 skipped. Earlier count was 98 failures. Focused macro changes are not grounds to claim full acceptance.

## Directly observed failure groups

- 7 `ManualContextFallback2026_06_16.test.mjs` failures: fake helper lacks `fitContextForCurrentModel`, so canonical action never reaches provider. Before migration these injected through retired `clarifyLLM` or `followUpQuestionsLLM` generators. Keep all data-only, escaped snapshot and transcript-precedence checks.
- 3 `IntelligenceEngineScreenContext.test.mjs` failures: fake `whatToAnswerLLM` cannot supply answers to active `streamFinalPrompt` generation. Preserve checked image paths, OCR, dynamic caller instruction and no-screen behavior.
- `IntelligenceEngineSentinel.test.mjs` speculative provider-empty returned a manual retry; active catch had no speculative suppression.
- `ScaffoldStreamHold2026_08_21.test.mjs` promoted screen-code answer triggered unnecessary canonical repair. The active stream gate did not reuse the original shared promotion predicate; canonical validation still classified eligible coding headings as spoken contamination.
- Other separate failures: `CanonicalConversationActions` lifecycle/provider scope/vision; `IntelligenceEngineCodeHint` fake context; deadline-truncated visible output; answer relevance, JSON, scaffold; detached classifier, legacy action provider modes. **Unresolved**—do not suppress tests or reintroduce legacy generation.

## Patch scope and safety

`IntelligenceEngine.ts`, `AnswerValidation.ts`; `AnswerValidation.test.mjs`, `ManualContextFallback2026_06_16.test.mjs`, `IntelligenceEngineScreenContext.test.mjs`; WORK-0072 and ERR-079/080 records. No provider routing change, RAG retrieval/storage or native/audio changes. No Git stage/reset/stash. Two changes restore existing production semantics. Stale mocks now use the current provider boundary and still assert private-data escaping, screen options, no-source and session isolation.

## Verification boundaries

Local: altered JS syntax, TypeScript transpilation, pure source assertions, patch forward/reverse/exact content and ZIP integrity only. **Mac typechecks, focused Electron, full intelligence/Electron/lib/scripts still pending**. Test expectations are preserved where supported; any new failure is a signal for another source correction, not a reason to downgrade assertions.

C20-AC1 FAIL/unproven. C20-AC2 pending. CHG-21 blocked.
