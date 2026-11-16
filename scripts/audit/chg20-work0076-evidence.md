# WORK-0076 — CHG-20 single-failure regression and acceptance evidence (2026-11-16)

## Baseline and ownership

Owner Mac: `main` HEAD `c7d1f790dbddb4c6f937c3c8c45f219149de94c1`, with WORK-0075 applied to its existing staged/unstaged source and the previously untracked (now staged by owner) desktop runner. The supplied post-WORK-0075 Mac outputs are the factual basis. New patch is strictly **incremental over WORK-0075**, reconstructed in a disposable workspace from `Sneak-Peek-CHG20-Continuation-20261115-221136.zip` plus the verified WORK-0075 patch. The two previously unchanged legacy file bytes were checked against the earlier owner source archive and committed GitHub HEAD. No Mac index mutation, stage, commit, push, reset, stash or cleaning was performed.

## Exact failing case / ERR-090

- Owner `npm run test:node-runner -- --test-concurrency=4`: 8,966 total / 8,898 pass / 1 fail / 0 cancelled / 67 skip.
- `electron/llm/__tests__/suggestionPromptAssembly.test.mjs`, “WhatToAnswerLLM assembles runtime intent, prior responses, and screen context as user content.”
- The model-facing **user** message contained `<previous_responses><entry ...>Prior &lt;answer&gt; &amp; phrase</entry></previous_responses>` and omitted `<repeat_press_directive>`, even though the screenshot was a repeat press without a resolved question. It *did not* inject private prior content into the system prompt. Source isolation of history is still desirable for this questionless visual turn.
- WORK-0075 narrowed coding promotion for non-code OCR (correct). Retained historical WhatToAnswerLLM accidentally used that *coding* predicate as the history-suppression predicate for all blind screens (incorrect). No evidence this path is an active second answer pipeline; Copilot's independent source review found it unreachable from production callers.

## Repair boundaries

- Leave coding-promotion, selected provider/model, credential access, authorized retrieval, privacy permission, streaming/cancellation/STOP, canonical runtime, IPC and native modules unchanged.
- Distinguish fresh visual/repeat request **without** `answerPlan.question` from coding promotion. Maintain coding-specific full-solution instruction for promoted coding requests, and a neutral fresh-screen directive for non-coding OCR/DOM/screenshots. Only omit earlier assistant responses when blind screen or promoted coding; preserve questioned non-coding history. Apply this consistently in base prompt assembly, optional V2 fusion/envelope and `profile_history` provider data-scope calculation.
- Extend the original negative regression to require neutral repeat-press directive and no false coding-problem directive, keeping escaped-prior exclusion, system-prompt separation and original vision/transcript assertions.

## Evidence / acceptance truth boundary

- Prior owner 36/36 focused WORK-0075 tests and five TS checks/builds passed. No claim the new patched source ran on Mac yet.
- Earlier independent Copilot review: **C20-AC1 PASS (source-level)**. Current tree's source-level provider map remains unchanged by this fix.
- **C20-AC2 PENDING** until new focused and broad Mac tests, same-profile two-launch desktop test, manual STOP event contract and full changed-diff review pass. Owner must review 67 Electron skips, nine baseline intelligence TODOs and library skip for CHG-20 applicability, and explicitly classify synthetic versus live-provider/physical Phone Mirror/Windows UI coverage. Passing Windows Build Smoke on previous c7d1f790 does not validate this new worktree.
- The product goal's comparative 6-second answer benchmark is a CHG-21 quality measurement in `ROADMAP.md`, not silently inserted as a CHG-20 closing gate.

## Recorded paths

`electron/llm/WhatToAnswerLLM.ts`, `electron/llm/__tests__/suggestionPromptAssembly.test.mjs`, `chatgpt-work/ERROR_LOG.md`, `TASK_TRACKER.md`, `CHANGE_LOG.md`, `HANDOFF.md`, and this audit report.

## Local checks

(Tool outcomes and exact patch digest are added in the verified delivery README; source/JS syntax and TypeScript isolated transpilation are not claims of a complete macOS test.)
