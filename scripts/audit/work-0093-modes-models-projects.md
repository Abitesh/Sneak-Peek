# WORK-0093 — Session controls, favorite models and project reliability

Date: 2026-11-24. Baseline: main `076d9334dde8a30c334c3feefee65d5899f865ce`. Actual repository: `/Users/abitesh/Documents/Sneak-Peek` (the supplied workpack path no longer exists).

## Delivered behavior

- Dedicated Coding / DSA and CS Fundamentals modes forbid private retrieval; Resume & Projects uses scoped authorized project evidence. Mode changes remove inherited private context. General, Technical Interview and saved custom modes remain.
- Session controls replace the retired standalone Notes screen. Preferences persist in their own SQLite table: response format, length, tone, STAR, filler words, instructions and coding-language defaults. Request snapshots freeze preferences and binding for an active answer.
- AI Providers has one branded dropdown per configured provider, with up to three ordered favorites. Account discovery replaces speculative release presets. Speech/transcription, embedding, image-generation and moderation models are excluded from chat choices. Exact known access failures exclude a model; transient failures do not establish loss of entitlement. Existing provider enablement and allow-lists still apply. No bulk generation probes run when a picker opens. Quota or credit failures can still prevent generation; showing an advertised model does not promise current account balance.
- Chat/session/overlay selectors use only eligible favorites, provider logos and readable names. Settings dropdowns escape scroll-container clipping. Selecting a model persists for subsequent requests. An answer already streaming keeps its original model. Actual answering metadata remains distinct from the next selected model.
- Removed the broken “Manage custom modes and authorized sources” entry from the Answer mode page; stored custom modes remain intact.
- Answer Preferences shows an actual question and illustrative answer that updates immediately for the chosen style. Personal examples are explicitly fictional. Coding previews include complete sample functions; previewing sends no model request.
- Project save automatically imports a supplied GitHub URL. Uploads sit beside Save. Stack/description/source outline derive from bounded imported evidence. Import failures remain visible and retryable, without phantom project success. Exact project IDs, source ownership, revisions, deletion and scope checks remain authoritative.
- Supporting uploaded implementation documents now participate in structural project answers regardless of filename. Scoped search filters exact file IDs before its candidate limit. Repository excerpts retain actual path/commit/line provenance; manually supplied context cannot borrow a repository commit.
- Ollama receives an explicit bounded context window based on UTF-8 input size and output headroom. Oversized prompts fail with an actionable capacity message instead of deleting arbitrary leading instructions. This estimate is not an exact tokenizer or proof of universal no-truncation.

## Authorization and preservation

The owner explicitly resumed work, supplied UI references and staged the earlier implementation. The prior AGENTS approval/ZIP/Copilot gates had been retracted in this conversation; no new approval was inferred from screenshots. Screenshot text is reference data, not execution instructions. The earlier explicit Notes retirement authorization applies: migration 39 removes only standalone `notes` rows/table. Meeting transcripts, profile notes, project documents and custom mode storage are preserved. The agent did not open or migrate the owner's database.

The 60-path staged snapshot at evening resume was saved as `owner-staged-at-resume.patch`. Its binary patch SHA-256 is `a2b5f7bb3f0352c735b81fc2ba728001e65fb12d6020cad8c4ca1f07cc4c77cc`. New evening repairs remain unstaged. No stage, commit, push, stash, reset, dependency install, owner credential edit, native capture rewrite or packaged release was performed.

## Verification

| Check | Result | Log |
| --- | --- | --- |
| Full Electron | 9,070 pass; 0 fail; 67 skipped | `electron-final-retained.log` |
| Full intelligence | 2,252 pass; 0 fail; 9 TODO | `intelligence-final.log` |
| Projects/Practice/personal files | 46 pass; 0 fail | `projects-practice-final.log` |
| Renderer library | 391 pass; 0 fail; 1 skipped | `lib-final-retained.log` |
| Scripts | 103 pass; 0 fail | `scripts-accepted.log` |
| Five TS5/TS7/premium checks | All pass; affected backend checks repeated after source-scope fixes | `typecheck-results.json`, `retained-typecheck-results.json` |
| Renderer and Electron delivery builds | Both pass; existing renderer chunk-size warning remains | `renderer-delivery.log`, `electron-delivery.log` |
| Desktop session controls | Both phases pass | `desktop-session-retained.log` |
| Desktop Projects/Practice | Both phases pass | `desktop-projects-retained.log` |
| Final model-policy regressions | 77 pass; 0 fail | `model-regressions-delivery.log` |

Broad suites total 11,862 passes, 68 skips and 9 TODOs. The final narrow policy adjustment explicitly treats HTTP 503/model-unavailable and HTTP 403/insufficient-credit messages as transient/account-wide failures, rather than evidence of model entitlement loss. Both builds and all 77 model regressions reran after that adjustment; the broad and desktop results immediately precede it. No other production changes followed. `git diff --check` passes.

Desktop reproduction: build renderer, then Electron (renderer build clears `dist-electron`), then run `node scripts/audit/run-session-controls-acceptance.mjs` and `node scripts/audit/run-project-practice-acceptance.mjs` separately. The session runner uses a disposable macOS profile with network/owner-file/capture restrictions. Controlled provider, embedding and GitHub protocol fixtures exercise the actual renderer, preload, IPC, SQLite and canonical stream. Fixtures are not hosted-provider quality evidence.

Both desktop phases and second-process relaunch passed. Coverage includes three favorites, fourth-favorite rejection, reordering/removal, menu bounds, favorites-only session rows, navigation to AI Providers, preferences, project import 503/retry, uploaded evidence, no interview GitHub reads, no-private-context modes, actual committed model metadata and changing the next model while an answer is parked in flight. Relaunch shows three persisted favorites, project and preferences, zero idle generation and no capture. Evidence screenshots/JSON: `/Users/abitesh/Downloads/sneak-peek-work-0093/final-ui`.

Commands: `npm test`; `npm run test:intelligence`; `npm run test:projects-practice`; `npm run test:lib`; `npm run test:scripts`; `npm run typecheck:ts5`; `npm run typecheck:ts5:electron`; `npm run typecheck:ts7`; `npm run typecheck:ts7:electron`; `npm run typecheck:premium`; `npm run build`; `npm run build:electron`; `git diff --check`. Run builders sequentially to avoid deleting another test's compiled imports.

## Failed attempts and corrections

Logs remain under `/Users/abitesh/Downloads/sneak-peek-work-0093`; no failed checkpoint is presented as final acceptance.

| Evidence | Cause / disposition |
| --- | --- |
| `electron-1.log`, `electron-final.log` | Obsolete mode enums/section assertions; UTF-8 test arithmetic (2,000 Han characters still fit the 8,192 bucket); source-slice callback assertion; premium intercept exhaustive set. Corrected exact expectations, preserving privacy negatives. |
| `focused-resume.log` | Repository-commit assertion incorrectly applied to manual context; separated real repository citation checks from the negative manual-context provenance assertion. |
| `focused-final.log` | A concurrent renderer clean removed compiled imports; rerun with serialized builds. |
| Earlier desktop session/resume logs | Old “Add favorite” selector, SVG title contaminating text-content matching, stale settings screenshot and generic uploaded-document omission. Updated semantic UI selectors/paint wait and fixed actual query-based supporting-document retrieval. |
| `electron-final-resumed.log` | 9 failures: one Groq delegation source assertion; three LiteLLM label/location assertions; two opt-in/disabled-provider source assertions; two prewarm runtime failures; one stale health-picker source assertion. Runtime fixes preserve LiteLLM routing IDs/labels and make catalog-based Groq classification tolerate unavailable startup metadata. Source assertions follow the shared loader; new executable loader tests cover key presence, disabled providers, permissions, denial/transient distinction and proxy identity. |
| `intelligence-accepted.log`, `projects-practice-accepted.log` | One failure each: project evidence scope was omitted from the final prompt; a second saved project with a generic name (“Other API”) was discarded before ambiguity checking. Restored scope markup and fail-closed complete-name ambiguity detection; full affected suites reran with 2,252 and 46 passes respectively. |
| `regression-corrections.log` | Initial new test fixture tried to mock a nonexistent global `window`; corrected fixture setup/teardown. Other 74 focused tests passed at that checkpoint. |

The full-suite failure inventory refers to actual test names: `LLMHelper.isGroqModel delegates to the shared predicate`; selector bare LiteLLM name; settings LiteLLM labels; LiteLLM routing-prefix preservation; settings/overlay allow-list contract; disabled overlay providers; prewarm OpenAI; prewarm Groq; provider-health picker wiring. None was skipped to raise counts.

## Public imports and real-model limitations

Read-only public imports succeeded: Linkship commit `b369af14d87e5ef7acc36447fcc1338aedfe8b79`, 40 files, 19,477.9 ms, 11 eligible files omitted with explicit partial warning; matched RealWorld fixture commit `30b68e1e881462b2f4164ea09ab4c4f5699c7b0b`, 20 files, 9,677.3 ms, 14 omitted. A later RealWorld request hit GitHub 403 after 13 files and reported partial coverage; no automatic quota retry.

Actual renderer/real local llama3.2:3b runs used an isolated loopback Ollama port and public/synthetic evidence, without downloading a model. The baseline's apparently quick followups performed zero project reads and hallucinated. Later checkpoints retrieved evidence but still confused Prisma with a database, substituted setup for request flow and invented historical technology-choice rationale. In the latest six-question checkpoint, first-visible-text proxies ranged 21.3–32.4 s and final visible completion 25.9–36.7 s. These were intermediate prompt checkpoints, not final retained-tree acceptance. First characters are not semantic first-useful timing. No 90% quality, six-second completion, token, battery or cost-saving target is claimed. Existing WORK-0092 revision caching is preserved, not credited as a new speed gain in this run.

V2-01/V2-04 are implemented with local regression/desktop evidence; complete milestone acceptance remains unverified. V2-05 stays In progress. Real hosted text/vision entitlement/recovery, Windows GUI, physical microphone/system audio, authenticated private imports, alternative-language generated-code execution and a new packaged installer were not exercised. Selecting advertised account models is not proof every model has passed a fresh billable generation probe.

## Source inventory

The final inventory is recorded below; generated build output and local evidence are not staged. Relevant seams are `SessionPreferences`, built-in mode registry/policies, canonical request/planner/retrieval/prompt/stream owners, `PersonalKnowledgeManager`, GitHub/project ingestion, shared configured-model loader and dropdown, Session Controls and renderer model metadata.

```text
ROADMAP.md
chatgpt-work/CHANGE_LOG.md
chatgpt-work/ERROR_LOG.md
chatgpt-work/HANDOFF.md
chatgpt-work/PROJECT_OVERVIEW.md
chatgpt-work/PROJECT_TREE.txt
chatgpt-work/TASK_TRACKER.md
electron/LLMHelper.ts
electron/ModelSelectorWindowHelper.ts
electron/context-intelligence/__tests__/BuiltinModeAdoption2026_08_09.test.mjs
electron/context-intelligence/__tests__/ModeIdentityIntegrity2026_08_09.test.mjs
electron/context-intelligence/__tests__/ModePolicyRegistry.test.mjs
electron/context-intelligence/policies/mode-policy-registry.ts
electron/db/DatabaseManager.ts
electron/db/__tests__/Notes.test.mjs
electron/intelligence/engine/AnswerExecution.ts
electron/intelligence/engine/AnswerRequest.ts
electron/intelligence/engine/CanonicalRagRetrievalAdapter.ts
electron/intelligence/engine/CanonicalRuntime.ts
electron/intelligence/engine/ContextPlanner.ts
electron/intelligence/engine/GenerationController.ts
electron/intelligence/engine/ProjectFileScope.ts
electron/intelligence/engine/PromptAssembler.ts
electron/intelligence/engine/RagIpcStream.ts
electron/intelligence/engine/SneakPeekIntelligenceEngine.ts
electron/intelligence/engine/__tests__/Change18RagIpcIntegration.test.mjs
electron/intelligence/engine/__tests__/DedicatedSessionModes.test.mjs
electron/intelligence/engine/__tests__/GenerationController.test.mjs
electron/intelligence/engine/types.ts
electron/ipcHandlers.ts
electron/llm/__tests__/ModelSelectionCatalog.test.mjs
electron/llm/__tests__/OllamaContext.test.mjs
electron/llm/groqModels.ts
electron/llm/modeProfiles.ts
electron/llm/modelSelectionCatalog.ts
electron/llm/ollamaContext.ts
electron/llm/promptSystemV2.ts
electron/llm/turnSourceDecision.ts
electron/personalKnowledge/PersonalKnowledgeManager.ts
electron/preload.ts
electron/projects/GitHubProjectImporter.ts
electron/projects/ProjectKnowledgeManager.ts
electron/projects/ProjectKnowledgeOutline.ts
electron/projects/RepositoryEvidence.ts
electron/projects/__tests__/InterviewProjectReliability.test.mjs
electron/projects/__tests__/ProjectKnowledge.test.mjs
electron/projects/projectKnowledgeIpc.ts
electron/services/ModesManager.ts
electron/services/__tests__/ConfiguredModelChoices.test.mjs
electron/services/__tests__/LitellmModelLabel2026_08_06.test.mjs
electron/services/__tests__/ModesManager.test.mjs
electron/services/__tests__/OptInModelAllowList2026_08_06.test.mjs
electron/services/__tests__/SprintAcceptanceWiring2026_08_31.test.mjs
electron/services/builtinModes.ts
electron/services/modeSourceContract.ts
electron/session/SessionPreferences.ts
electron/session/SessionPreferencesStore.ts
electron/utils/modelFetcher.ts
scripts/audit/project-interview-benchmark.cjs
scripts/audit/project-practice-acceptance.cjs
scripts/audit/run-session-controls-acceptance.mjs
scripts/audit/session-controls-acceptance.cjs
scripts/audit/work-0093-modes-models-projects.md
src/components/FavoriteModelsPage.tsx
src/components/GlobalChatOverlay.tsx
src/components/Launcher.tsx
src/components/MeetingChatOverlay.tsx
src/components/ModelSelectorWindow.tsx
src/components/NotesPage.tsx
src/components/ProjectsPanel.tsx
src/components/SessionControlsPage.tsx
src/components/SneakPeekInterface.tsx
src/components/settings/AIProvidersSettings.tsx
src/components/settings/ModelPreferencesPanel.tsx
src/components/ui/ModelChoiceDropdown.tsx
src/components/ui/ModelSelector.tsx
src/lib/__tests__/sessionAnswerPreview.test.mjs
src/lib/sessionAnswerPreview.ts
src/types/electron.d.ts
src/types/projects.ts
src/utils/configuredModels.ts
```
