# WORK-0096 — Interview answer quality and verification

2026-11-28 · TASK-0018 / ERR-157–158 · Baseline `53c23e0b` (WORK-0095). Roadmap 6.8 and A1/V2-05 remain **In progress**.

## Implementation

- Use the pinned interview mode to select candidate voice. Keep ordinary chat in assistant voice and carry the existing language, format, tone, duration and coding policies. Give short guidance for the requested audience, examples, compound questions and evidence-bound project explanations.
- Treat a narrowly parsed historical technology choice as a fit-and-alternatives question when the approved excerpts establish usage without establishing motive. Preserve the original request for planning and validation. Hold choice and quantified project drafts for targeted checks before releasing text. Report unsupported drafts using fixed error copy. A named project with zero authorized sources and a stated percentage gets an evidence-gap answer without inference or a provider call.
- Use only the approved evidence rendered into the prompt for claim checks. Detect selected first-person claims, unsupported percentages and choice, simple opposite predicates, unrecognized quoted source titles, candidate identity drift, repetition and likely missing examples or approaches. Possible contradictions and structural findings are advisory. For ordinary streams, late findings can prevent persistence of flagged unsupported claims, including in the existing repair path. No new model call, universal verifier or verified badge. Checks cannot establish entailment, arbitrary citations, technical definitions or paraphrased contradictions. Existing code-verification configuration and selected model are unchanged.
- Resolve explicit abbreviated names only when current authorized files identify a unique project and the current résumé has no competing identity. Scope search to the existing exact ID intersection. Recognize brief portfolio overviews and implementation-flow searches and distinguish a hyphenated cache policy from a request for code. Named-project topic switches and ungrounded technical questions retain their existing permission boundaries.

## Actual desktop runs

The opt-in `scripts/audit/run-real-world-v205.mjs --quality` entered questions in the production Electron overlay with actual IPC and renderer paints. It used a disposable profile, synthetic uploaded source notes, one installed `llama3.2:3b` Q4_K_M on Apple M4, Ollama 0.33, and empty 4K model prewarming on an isolated localhost daemon. The runs used lexical fallback for documents because embedding downloads were disabled. No paid API, model download, owner credentials, capture, or default-app database. `npm start` built Vite, renderer and Electron and launched the same disposable desktop harness through an external startup adapter for the intermediate repair. The matched baseline and refined runs and the five-turn `--quality-routing` repeat used the desktop harness directly with built renderer assets. The last adjustments affected only advisory and repair-finalization checks. They passed focused regression and build checks after the desktop runs.

| Measure | Matched baseline | Matched repair | Five-turn routing repeat |
|---|---:|---:|---:|
| Strict review, including factual claims, requested parts, mode and audience | 1/18 | 5/18 | 2/5 |
| Matched final renderer output | 16/18 | 17/18 | 5/5 |
| Median visible completion, matched finals only | 9.68 s | 10.79 s | 4.58 s |
| Maximum visible completion, matched finals only | 16.58 s | 41.71 s | 7.42 s |
| P95 first useful frame, qualifying frames only | 11.16 s (11 turns) | 41.71 s (14 turns) | 3.94 s (5 turns) |
| Provider prompt tokens | 20,786 | 19,995 | 3,794 |
| Provider output tokens | 4,411 | 2,994 | 501 |
| Median answer words | 178.5 | 114 | 99 |
| Median provider prefill and decode | 2.05 s / 6.34 s | 3.64 s / 7.95 s | 1.79 s / 4.31 s |

This is a manual per-turn review. A missing final match counts as a miss even when IPC delivered raw text. A first useful frame contains a correct, relevant statement belonging to the current answer and can precede a later flaw. Never treat a first token, opening filler or another card as a useful answer. The five-turn repeat started with fresh history and ran separately. It cannot be spliced into the matched run for an overall pass rate. Timing includes ordinary runtime variance, longer contexts for some requests and the deliberate wait before displaying a sensitive draft. More expensive prefill and decode were measured on the matched repair despite lower aggregate tokens. The experiment did not control other activity on the Mac well enough to assign every delay to a specific cause. The WORK-0095 median of 4.15 s and quality of 9/11 came from a different question set and mode. They remain historical evidence.

### Five original cases

| Case | Baseline → matched repair | Words | Prompt tokens | First useful (s) | Final visible (s) |
|---|---|---:|---:|---:|---:|
| System design and capability | Assistant-style guidance → candidate definition and approach, still long | 162 → 133 | 666 → 712 | 2.46 → 2.95 | 7.59 → 7.38 |
| Plain-language portfolio | Emergency-services analogy and stack jargon → more relevant ride-hailing analogy, still too technical | 223 → 154 | 1,094 → 1,136 | 4.67 → 5.23 | 10.47 → 9.26 |
| Expand Geospatial | Repeated stack and inferred motive → starts with dispatch purpose, speculative motive and scaling persist | 170 → 166 | 943 → 990 | 1.86 → 3.13 | 7.21 → 10.63 |
| Spring Boot alternatives | Invented past motives → described the framework's role, suitability and alternatives | 79 → 60 | 1,017 → 1,071 | — → 6.12 | 4.03 → 6.12 |
| Bounded queue example | Wrong table/capacity analogy → concrete reject example, still states rejection as universal earlier | 192 → 175 | 688 → 697 | 2.14 → 1.78 | 8.40 → 12.49 |

Short and detailed system design covered both parts with 70 and 118 words at 8.85 and 13.82 s. The final routing repeat returned both authorized files for the brief portfolio, although the answer still used technical names (99 words, 7.42 s). It recovered the short Geospatial overview (50 words, 4.27 s) and retrieved the correct source for the detailed implementation variant (126 words, 6.43 s, still an unsupported throughput claim and incomplete flow). The brief queue variant still claimed eviction by default. The detailed queue variant treated blocking as universal before qualifying it. The short Spring Boot variant avoided a historical motive. The detailed variant still made a speculative performance comparison.

### Unseen questions

- Write-through cache miss. The matched runs misrouted the example to code and did not match a final renderer answer. Final routing produced a 116-word prose answer with 725 prompt tokens, first useful text at 1.66 s and matched completion at 4.58 s. It still confused read and write-miss behavior and overclaimed what the cache holds.
- Missing Nimbus Ledger achievement. The baseline invented work. The matched repair still entertained the premise as a hypothetical. The final repeat displayed the evidence gap in 26 words, first useful at 0.31 s and completed at 0.47 s, with no provider or project read.
- Ordinary-chat transaction versus lock. The matched repair stayed in ordinary assistant voice (106 words, 2,460 prompt tokens, 18.09 s first useful and 22.85 s complete). The answer still misstated shared lock behavior. Baseline also overstated locking guarantees (187 words, 16.58 s).

Verbatim output, per-turn review, timings, prompt tokens and raw logs are under `/Users/abitesh/Downloads/sneak-peek-work-0096`: `answers.md`, `graded-metrics.json`, `before.json`, `first-repair.json`, `refined.json`, `routing.json`, matching `*-app.log` files and `after-npm-start.log`. The intermediate live app run withheld several choice drafts and is preserved as a failed candidate. The baseline had two renderer mismatches (turns 15 and 16), refined one (turn 16), and routing none. They were counted without substituting provider completion for visible output.

## Checks and open acceptance

- `npm run test:intelligence` on the routed checkpoint: 2,276 pass, 0 fail, 0 skipped, 9 TODO. Covers canonical ownership/supersession, source authorization and privacy regression fixtures, along with conversation and memory.
- Final Electron focused tests for answer quality, portfolio retrieval, canonical retrieval and GenerationController: 49 pass, 0 fail, 0 skipped. STOP during a held draft was exercised with a controlled provider. Existing pure-core, orchestration and spec-strip code-verification fixtures: 58 pass. No model-generated program was executed.
- `npm start` renderer build and desktop harness passed. Final `npm run build:electron`, `npm run typecheck:ts5:electron` and `git diff --check` passed. An initial optional-field typecheck failure was fixed. A direct Node regression attempt hit the SQLite ABI mismatch and was replaced by the Electron test runtime.
- At least 90% strict quality, useful renderer p95 ≤2 s, ≤3 s for short answers and ≤6 s for longer answers did not pass. The 4.15 s historical median was not reproduced. No new independent grader, physical microphone or Auto Answer run, live STOP/supersession repeat, hosted CI, full Electron matrix or Windows run. Keep acceptance open. Next work is a controlled replay that holds runner context size and load fixed, with a stricter general technical example contract and an independent per-answer review. Track visible stream completion separately from factual acceptance.

## Changed files

- `electron/intelligence/engine/AnswerQuality.ts`, `AnswerExecution.ts`, `CanonicalRagRetrievalAdapter.ts`, `ContextPlanner.ts`, `ProjectFileScope.ts`, `PromptAssembler.ts`, `ResponsePlanner.ts`, `SneakPeekIntelligenceEngine.ts`, `types.ts`
- `electron/intelligence/engine/__tests__/AnswerQuality.test.mjs`, `DedicatedSessionModes.test.mjs`, `StabilizationPortfolioRetrieval.test.mjs`
- `electron/context-intelligence/question/ProjectOverviewIntent.ts`, `electron/ipcHandlers.ts`, `electron/llm/AnswerPlanner.ts`, `electron/llm/promptSystemV2.ts`
- `scripts/audit/real-world-v205.cjs`, `scripts/audit/run-real-world-v205.mjs`, `scripts/audit/work-0096-answer-verification.md`
- `ROADMAP.md`, `chatgpt-work/CHANGE_LOG.md`, `ERROR_LOG.md`, `TASK_TRACKER.md`, `HANDOFF.md`, `PROJECT_OVERVIEW.md`, `PROJECT_TREE.txt`
