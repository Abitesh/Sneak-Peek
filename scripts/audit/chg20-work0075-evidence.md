# WORK-0075 — interrupted CHG-20 acceptance repair / evidence (2026-11-15)

## Truth boundary

Owner's snapshot is `main` at `c7d1f790dbddb4c6f937c3c8c45f219149de94c1`, with six owner-worktree edits and an already-untracked desktop runner. This patch is **incremental to that exact uploaded snapshot**, not to GitHub HEAD or a clean prior commit. The ZIP does not include a new runner and must not be re-applied after successful installation. Nothing was written to the owner's Mac checkout by this preparation.

## Owner log outcomes

- `npm test`: 9,101 total, 9,031 pass, 3 fail, 0 cancelled, 67 skipped.
- `npm run typecheck:electron`, `typecheck:premium`, `typecheck:ts5:electron`, `typecheck:ts5`, `typecheck:ts7`, `build`, `build:electron`: pass in owner's long `&&` chain before its failure.
- `npm run test:node-runner -- --test-concurrency=4`: 8,966 total, 8,896 pass, 3 fail, 0 cancelled, 67 skipped. Later commands in this `&&` chain never ran; do not treat them as passed.
- Failing names: `speculative-path contaminated answers are never regenerated or surfaced`, `runWhatShouldISay passes screenContext and preserves imagePaths`, `speculative setup failure emits no user-facing error or answer`.

## Cause and scope

1. `IntelligenceEngine.ts`: sanitizer/finalization switched from `!isSpeculative && !partial` to `!partial`, prompting a provider repair for silent speculation. Pre-stream `captureAnswerContext` could throw outside the main catch. Silent event suppression in the main catch is retained.
2. `codingPromptSignals.ts`: `hasImages` promoted any deictic question even where available OCR was non-code. Central predicate now requires structural code text, or an image with no useful OCR, or an explicit coding/solution ask over an image.
3. `AnswerValidation.ts`: screen-promoted deictic code must receive the actual six-section DSA check, not the light generic code-fence-only implementation check. Explicit `explain without code` remains authoritative and only the original user's question can specify that override.

## Executed in disposable Linux working copy

- Edited TypeScript 5.8 transpile PASS (syntax only); edited MJS `node --check` PASS.
- Isolated runtime bridge using real `codingPromptSignals.isPromotedScreenCodingTurn` PASS 5/5 and real `AnswerValidator.validateAnswerStructure` via canonical validator PASS 6/6. Unrelated credential, coverage, retrieval and Electron dependencies were stubbed. This is NOT the Mac project's `npm test` / full TS7 typecheck.
- Git apply `--check`, exact forward/reverse byte identity and ZIP CRC PASS (details verified during packaging).

## C20 acceptance

C20-AC1 source-level PASS per owner-supplied independent Copilot response and production call map, not independently re-run here. C20-AC2 **PENDING**, CHG-21 blocked. The reported prior same-profile desktop acceptance PASS belongs to the old checkout before this incremental repair. User's new post-patch focused/full suites and fresh desktop result are necessary before accepting the change. Inspect skips/TODO relevance, classify live-provider/physical-phone/Windows UI according to roadmap, and record exact acceptance decisions; do not silently convert pending to PASS.
