# CHG-20 regression inventory — WORK-0067

Source: owner-supplied `npm run test:intelligence` and `npm test -- --test-concurrency=4` console output from November 14, 2026. The list includes **failing child assertions plus aggregate failed suite headings** (22 and 118 lines for 19 and 107 actual failures), not fixes or proof of current reproduction. The owner interrupted the broad run after the reported summaries; Mac re-verification of this patched tree has not happened.

| Run | Owner-reported tests | Passed | Failed | Skipped/todo |
| --- | ---: | ---: | ---: | --- |
| `npm run test:intelligence` | 2,170 | 2,142 | 19 | 9 todo |
| `npm test -- --test-concurrency=4` | 9,096 | 8,919 | 107 | 67 skipped; 3 cancelled |

Root-cause categories observed in log/source: moved factory/source assertions; older WTA fakes without canonical `isUsingOllama` or provider route; image fixture paths that do not exist; and unverified live privacy, lifecycle, answer-quality and persistence behavior. **Do not use source-assertion updates as substitutes for behavioral acceptance.**

## Intelligence suite reported failures

- [ ] I-01 `manual chat sends the question to the engine that owns answer planning`
- [ ] I-02 `manual chat uses the current engine path`
- [ ] I-03 `cleanup runs OUTSIDE the answerDiversityGuard flag gate`
- [ ] I-04 `schema-stub guard runs unconditionally (before the flag gate too)`
- [ ] I-05 `WTA always-on minimal cleanup`
- [ ] I-06 `a repetition-check trace mark is emitted regardless of whether a repair fired (observability)`
- [ ] I-07 `IntelligenceEngine source wiring (static check — no engine instantiation needed)`
- [ ] I-08 `engine produces and returns the canonical ResponsePlan`
- [ ] I-09 `Single primary manual-chat path is wired through Sneak-Peek Intelligence`
- [ ] I-10 `Primary route has exactly one generation handoff and legacy is fallback-only`
- [ ] I-11 `Primary route does not let ordinary context or STOP fall through into a second generation`
- [ ] I-12 `Primary route keeps proven compatibility-only turns out of the migration`
- [ ] I-13 `primary manual conversation turns persist generation outcomes`
- [ ] I-14 `production engine uses canonical capability and planned-source reads only for the approved four sources`
- [ ] I-15 `production project capability does not invoke a second global source planner`
- [ ] I-16 `structured knowledge reads only the engine-selected OKF source`
- [ ] I-17 `CHG-17: both IPC routes consume current-session completed-turn scope and gate ambiguous profile fallback`
- [ ] I-18 `CHG-17 gate: production project IDs reach the scoped adapter with cancellation`
- [ ] I-19 `CHG-17 gate: production observer and prompt outcomes never print private evidence IDs`
- [ ] I-20 `meeting IPC engine uses only the saved meeting when its scoped index has no hits`
- [ ] I-21 `canonical profile drafts use only active revisioned profile sources and respect cloud scope denial`
- [ ] I-22 `explicit gateway preserves its model and forbids cross-provider fallbacks`

## Broader Electron suite reported failures

- [ ] E-001 `the leaked block is NOT returned/emitted verbatim — a safe fallback is used instead`
- [ ] E-002 `the leaked block is NEVER persisted into session history verbatim`
- [ ] E-003 `the leaked block is NOT counted in fullUsage (mirrors the leaked-schema-stub precedent)`
- [ ] E-004 `a REAL answer that merely mentions a tag in prose is still persisted normally — no over-suppression`
- [ ] E-005 `coding-type question: a leaked tag block is still caught before repairCodingMarkdown can mutate it`
- [ ] E-006 `runWhatShouldISay: a leaked internal-tag-block answer is replaced, never shipped or persisted verbatim`
- [ ] E-007 `the error text is still returned/emitted to the user (ungated delivery)`
- [ ] E-008 `the error text is NEVER persisted into session history (the actual bug fix)`
- [ ] E-009 `the error text is NOT counted in fullUsage (mirrors the leaked-schema-stub / timeout precedent)`
- [ ] E-010 `a REAL answer (not the error text) is still persisted normally — no over-suppression`
- [ ] E-011 `coding-type question: transport error is still caught before repairCodingMarkdown can mutate it`
- [ ] E-012 `runWhatShouldISay: provider-transport-error is shown but never persisted`
- [ ] E-013 `canonical vision forwards the selected model, validated attachment and cancellation signal`
- [ ] E-014 `canonical custom and cURL vision dispatch forward one image without permitting silent image loss`
- [ ] E-015 `manual chat routes authorized planned sources through the Intelligence Engine`
- [ ] E-016 `Change 18 — meeting/global overlays use engine-owned planned retrieval`
- [ ] E-017 `RAG answers use provider-neutral dispatch, not a hard-wired Gemini stream`
- [ ] E-018 `committed action failure does not cascade, complete, or enter history`
- [ ] E-019 `provider scope denial occurs before session context can reach transport`
- [ ] E-020 `legacy custom-provider fallback refuses unlabeled private prior-answer data before generation`
- [ ] E-021 `explicit local-only Ollama compatibility remains usable without invoking canonical transport`
- [ ] E-022 `legacy custom mode refuses unknown-lineage scope even without a session snapshot`
- [ ] E-023 `manual WTA uses the canonical prompt and selected provider for a speech-only concept question`
- [ ] E-024 `automatic WTA uses the canonical prompt and selected provider for a speech-only concept question`
- [ ] E-025 `speculative WTA uses the canonical prompt and selected provider for a speech-only concept question`
- [ ] E-026 `stale assist cannot clear the replacement controller or deliver out of order`
- [ ] E-027 `STOP settles a canonical speculative WTA before a parked provider resumes`
- [ ] E-028 `code hint sends typed images to one selected vision model and keeps its output events`
- [ ] E-029 `screenshot-derived text Code Hint retains screenshot scope when no image is forwarded`
- [ ] E-030 `explicit screenshot text uses a scoped screen section for canonical brainstorm`
- [ ] E-031 `technical interview concept WTA uses its pinned mode without adding private sources`
- [ ] E-032 `electron/services/__tests__/CanonicalConversationActions.test.mjs`
- [ ] E-033 `the text the user already saw survives into the committed answer`
- [ ] E-034 `no fabricated code block is invented for a truncated stream`
- [ ] E-035 `no fabricated complexity/dry-run sections are invented`
- [ ] E-036 `the answer does not balloon far beyond what the model actually produced`
- [ ] E-037 `a deadline-truncated coding answer is not replaced by a placeholder scaffold`
- [ ] E-038 `a free-form no-content hallucination is NOT regenerated when the flag is off (default production behavior)`
- [ ] E-039 `a real, substantive, on-topic answer is never touched (flag off)`
- [ ] E-040 `answer-relevance guard — flag OFF (default): observe-only, never mutates`
- [ ] E-041 `a free-form no-content hallucination with no shared vocabulary is regenerated into a real answer`
- [ ] E-042 `a real, substantive, on-topic answer is NEVER touched by the relevance guard (critical false-positive check)`
- [ ] E-043 `a short but real, on-topic answer is never touched`
- [ ] E-044 `regeneration failure (repair also irrelevant) falls through with the ORIGINAL answer unchanged, not a worse guess`
- [ ] E-045 `a regeneration that itself leaks an internal tag block is REJECTED even though it scores relevant (the fix for a real gap found in review)`
- [ ] E-046 `a mandatory ethical_usage_answer safety decline is NEVER regenerated (guard exclusion)`
- [ ] E-047 `a stale repair from a superseded generation never overwrites fullAnswer or reaches session history`
- [ ] E-048 `speculative-path hallucinations are never regenerated or surfaced (auto-trigger prefetch must stay silent)`
- [ ] E-049 `answer-relevance guard — flag ON (opt-in): full regeneration behavior`
- [ ] E-050 `a bare stock refusal on a candidate-voice answer gets a deterministic fallback, not shipped raw (A9 repro)`
- [ ] E-051 `a candidate-voice answer with real content plus an assistant-meta tail is still just stripped, not fully replaced`
- [ ] E-052 `a real, substantive candidate-voice answer is never touched by the fallback branch`
- [ ] E-053 `a short but genuinely correct candidate-voice answer survives intact (no markers were ever stripped)`
- [ ] E-054 `another short genuine answer ("5 years.") is not replaced by the deterministic fallback`
- [ ] E-055 `runCodeHint returns stream on supersession and does not emit stale final result`
- [ ] E-056 `a false "no question captured" claim is caught when a real question was extracted`
- [ ] E-057 `the "nothing captured to summarize yet" false-claim variant is also caught (A3/A7 repro)`
- [ ] E-058 `the "don't have a specific question" false-claim variant is also caught (A12 repro)`
- [ ] E-059 `a real, substantive answer is never touched by the false-claim guard`
- [ ] E-060 `speculative false-claim answers are still silently discarded, not surfaced`
- [ ] E-061 `a real "questions for us" answer that opens with "I don't have a specific question right now" survives intact`
- [ ] E-062 `a real answer that opens with "no question has been asked yet, but..." survives intact`
- [ ] E-063 `a real answer at the 220-char length-guard boundary is never touched`
- [ ] E-064 `extraction confidence just under the 0.6 gate does not suppress a true "nothing captured" claim`
- [ ] E-065 `a JSON-wrapped real answer ({"answer": "..."}) is recovered, not shipped raw or blanked (C2/A18 repro)`
- [ ] E-066 `a genuinely empty JSON envelope ({"key_facts": []}) is blanked with an honest fallback, not shipped raw`
- [ ] E-067 `a real, unstructured answer is never touched by either guard`
- [ ] E-068 `a real, terse JSON-shaped answer to a system-design question is NEVER blanked (call-site exclusion)`
- [ ] E-069 `no LLM configured: manual WTA EMITS the config message (never a silent non-null return)`
- [ ] E-070 `no LLM configured + speculative: does NOT emit (no placeholder exists for speculation)`
- [ ] E-071 `legacy answerLLM returns empty: manual WTA returns null (renderer shows null-feedback, no silent dots)`
- [ ] E-072 `legacy answerLLM returns a real answer: emits it and returns it`
- [ ] E-073 `runWhatShouldISay resolves while the detached classifier check is still pending`
- [ ] E-074 `observe-only relevance check must not block the answer pipeline`
- [ ] E-075 `handleSuggestionTrigger routes answerable questions to what-to-say executor`
- [ ] E-076 `handleSuggestionTrigger still answers complete technical restatements`
- [ ] E-077 `a scaffold-contaminated answer detectAndExtractScaffoldMisfire cannot recover is regenerated into a clean answer`
- [ ] E-078 `a real, unscaffolded answer is never touched by the contamination guard (critical false-positive check)`
- [ ] E-079 `a real answer legitimately discussing complexity (single O(1) mention, below the 2-heading threshold) is never touched`
- [ ] E-080 `regeneration failure (repair also contaminated) falls through with the ORIGINAL answer unchanged, not a worse guess`
- [ ] E-081 `a regeneration that leaks an internal tag block is REJECTED even if it would otherwise pass the contamination check`
- [ ] E-082 `a case detectAndExtractScaffoldMisfire successfully extracts is not re-processed by this fallback (extraction wins, no second LLM call)`
- [ ] E-083 `speculative-path contaminated answers are never regenerated or surfaced (auto-trigger prefetch must stay silent)`
- [ ] E-084 `a scaffold-misfire extraction whose recovered tail is ITSELF still contaminated is caught and regenerated by this guard`
- [ ] E-085 `a stale repair from a superseded generation never overwrites fullAnswer or reaches session history`
- [ ] E-086 `unrecovered scaffold contamination fallback — bounded regeneration`
- [ ] E-087 `a scaffold-misfired negotiation answer ships the extracted real answer, not the raw scaffold`
- [ ] E-088 `a real, unscaffolded answer is never touched by the extraction guard`
- [ ] E-089 `a real technical_concept_answer discussing genuine Big-O content is NEVER touched, even with scaffold-shaped headings`
- [ ] E-090 `runWhatShouldISay passes screenContext and preserves imagePaths`
- [ ] E-091 `runWhatShouldISay forwards dynamic action promptInstruction to WhatToAnswerLLM`
- [ ] E-092 `runWhatShouldISay works without screenContext`
- [ ] E-093 `runWhatShouldISay gives an honest fallback for a manual nothing-actionable sentinel`
- [ ] E-094 `runWhatShouldISay gives an honest fallback for a manual nothing-to-capture sentinel`
- [ ] E-095 `runWhatShouldISay gives an honest fallback for normalized sentinel variants (manual press)`
- [ ] E-096 `runWhatShouldISay does not suppress near-match real answers`
- [ ] E-097 `runWhatShouldISay suppresses speculative sentinel output`
- [ ] E-098 `runWhatShouldISay hides speculative real answers from renderer and history`
- [ ] E-099 `runWhatShouldISay hides speculative fallback answers from renderer and history`
- [ ] E-100 `runWhatShouldISay still emits and stores real answers`
- [ ] E-101 `a single WTA turn emits exactly one final with a positive generationId`
- [ ] E-102 `two sequential WTA turns emit final answers with DISTINCT, monotonically increasing generationIds`
- [ ] E-103 `a newer WTA request aborts the prior provider signal and suppresses its final result`
- [ ] E-104 `reset aborts an in-flight WTA request without delivering a final answer`
- [ ] E-105 `runClarify falls back to the recent manual question and answer when transcript is empty`
- [ ] E-106 `runFollowUpQuestions falls back to the recent manual question and answer when transcript is empty`
- [ ] E-107 `recent manual fallback strips fake context headers and escapes prompt-like content`
- [ ] E-108 `recent manual fallback preserves punctuation and strips broader role headers`
- [ ] E-109 `recent manual fallback caps long previous answers`
- [ ] E-110 `thin transcript is supplemental when recent manual fallback exists`
- [ ] E-111 `substantial transcript context wins over recent manual fallback`
- [ ] E-112 `RC-4: a scaffold-opening stream paints NOTHING until the provider stream is done`
- [ ] E-113 `review 2026-08-22: a PROMOTED screen-coding turn streams via the coding gate and is never regenerated`
- [ ] E-114 `RC-4: a clean prose stream still paints live (no lost streaming)`
- [ ] E-115 `the live D press-1 host closer is stripped by the real engine`
- [ ] E-116 `a substantive turn with a trailing question is untouched (gate holds)`
- [ ] E-117 `background coding correction inherits its child cancellation signal`
- [ ] E-118 `WTA repairs inherit the owning request cancellation`

## WORK-0067 disposition

- Source-location tests: revised only where code moved to an existing active owner; targeted source-only tests can run in this isolated environment. Actual compiled integration tests remain Mac-pending.
- WTA always-on cleanup/schema guard/diversity trace: deterministic code restored to active canonical path; owner must test streamed and final visible output, cancellation and history behavior.
- Vision fixtures: real disposable 1×1 synthetic images substituted for nonexistent paths in one provider transport test; no privacy check bypassed.
- Other runtime failures remain **OPEN**. In particular, do not weaken provider-scope, local-only, STOP, supersession, no-history-on-error, screenshot-OCR and one-completion assertions to obtain a green count.
- These individual names are a replay inventory, not 126 unrelated diagnosed code defects. Tests with the same mock/dispatch root cause should be repaired together, then rechecked in full.
