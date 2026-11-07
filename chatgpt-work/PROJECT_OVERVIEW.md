# Sneak-Peek — project overview and setup

Updated: 2026-11-01. This pack contains **eight files: seven Markdown files and one tree text file**. It is a documentation/bootstrap deliverable, not an application patch.

## Evidence boundary

- Owner: developing on macOS, VS Code/Copilot; wants to understand the project while improving it; reports roughly 80 commits and work in progress on Change 17.
- Source inspected: public repository [Abitesh/Sneak-Peek](https://github.com/Abitesh/Sneak-Peek), branch `main`, commit `6837a7a5d1eaa2531c878f05bb4f873c23af3859`. Latest inspected commit subject: `CHANGE 16: MIGRATE PROJECT / MY FILES / PERSONAL KNOWLEDGE INTO THE NEW CONTEXT MODEL`.
- Inspection date: 2026-11-01. This was a targeted static review of architecture, package scripts, selected answer/retrieval/model paths, guidance, license, workflow, and tests. It was NOT an exhaustive audit.
- Local owner branch, HEAD, uncommitted Change 17 code, macOS version, CPU architecture, installed dependencies, and credentials were unavailable. Reconcile before implementation.
- No application dependencies were installed; no build, app, model request, runtime test, packaged launch, or latency benchmark was executed for this pack.
- The four supplied screenshots show ChatGPT settings/Project Sources, not the Sneak-Peek application UI. Do not invent app-UI findings from them. Obtain current app screenshots for FEAT-009.
- User requirements and the supplied `Changes-roadmap.rtf` define desired behavior; they do not prove implementation or test success.

## What the application is

The inspected manifest identifies a desktop AI meeting-notes assistant, still internally named `natively`, version 2.8.7. The owner wants a reliable Sneak-Peek assistant with transcription, grounded personal/project answers, configurable models, and fast responses.

Observed stack: Electron 43.1.0, React 19, TypeScript, Vite, Tailwind, SQLite (`better-sqlite3`, `sqlite-vec`), document parsing, local inference/model assets, cloud provider SDKs, and native desktop/audio dependencies. Package engines require Node >=22.6.0. Versions and requirements must be rechecked on the actual branch.

The repository guidance requires macOS AND Windows impact analysis. Owner's macOS environment is the primary hands-on verification target; other platforms must not be falsely reported as tested.

## Architecture in plain language

- **Renderer/UI:** `src/main.tsx`, `src/App.tsx`, `src/components/`; displays listening, chat, model choices, documents, and answer streams.
- **Desktop/main process:** `electron/main.ts`; owns Electron/native lifecycle and desktop services.
- **Safe bridge:** `electron/preload.ts` exposes approved APIs; `electron/ipcHandlers.ts` receives renderer requests and wires services. Follow the existing IPC contract instead of allowing arbitrary renderer file/process access.
- **Intelligence engine:** `electron/intelligence/engine/`; contains request contracts, conversation windowing, context planning, retrieval coordination, response/prompt assembly, and generation lifecycle.
- **Conversation/routing:** `electron/context-intelligence/`; contains question resolution, turn classification, policies, retrieval ports, observability, and compatibility orchestration.
- **Evidence:** `electron/intelligence/context-os/`; retains source scope/provenance and helps render scoped evidence.
- **Retrieval:** `electron/rag/`, especially `electron/rag/canonical/`; owns persistent documents/revisions/chunks/embeddings/indexing/search. Canonical retrieval should serve the engine, not independently decide an answer.
- **Personal/mode knowledge:** `electron/personalKnowledge/`, `electron/services/ModesManager.ts`, and retrieval ports; supply authorized profile/project/document evidence.
- **Providers:** `electron/llm/ProviderRouter.ts`, `electron/LLMHelper.ts`, provider modules; perform generation and cancellation under the engine's plan.
- **Audio/STT:** `electron/audio/`, native modules, and existing capture lifecycle. Intelligence consumes transcript data. Capture internals are protected during the intelligence migration.
- **Build/release:** `scripts/`, package.json, Electron Builder config, native-module assets, and `.github/workflows/`; development success does not prove an installable artifact works.

Target request flow:

```text
UI / authorized transcript / optional screen context
  -> preload -> IPC
  -> intelligence engine
  -> structured conversation + turn understanding
  -> context plan + permissions
  -> retrieval coordinator -> canonical RAG / other required sources
  -> evidence pack with scope, revisions, provenance
  -> response plan -> one final prompt
  -> provider router + generation lifecycle
  -> one answer stream -> UI
```

This is the TARGET, not a claim that every current surface follows it.

## Snapshot source links

Use these immutable links to check the observations against the inspected snapshot, then compare with the current local implementation:

- [Engine implementation](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/electron/intelligence/engine/NativelyIntelligenceEngine.ts), [retrieval coordinator](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/electron/intelligence/engine/RetrievalCoordinator.ts).
- [IPC wiring and answer-surface handlers](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/electron/ipcHandlers.ts), [RAG manager](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/electron/rag/RAGManager.ts).
- [Model selector](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/src/components/ModelSelectorWindow.tsx), [AI provider settings](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/src/components/settings/AIProvidersSettings.tsx).
- [Build Smoke workflow](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/.github/workflows/build-smoke.yml), [existing repository instructions](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/CLAUDE.md).

These links are reference evidence, not a promise that the owner local branch matches that commit. No proprietary source text is reproduced in this workpack; architecture descriptions are original summaries.

## Specific static observations

| Observation at inspected snapshot | Consequence |
|---|---|
| `createPrimaryManualNativelyEngine` in IPC wires project/My Files retrieval capabilities through `ragManager.search`. | Change 17 must inspect/adapt existing wiring, not create a second storage/retrieval system. |
| Meeting/live RAG IPC handlers use the new engine, but `rag:query-global` still calls `ragManager.queryGlobal`. | Change 18 appears partially migrated; trace actual remaining callers instead of rewriting already migrated meeting paths. |
| RAGManager still contains `queryMeeting`, `queryGlobal`, `buildRAGPrompt`, and `streamRagAnswer`. | Their existence is cleanup evidence, NOT proof each function is still active. Prove usage and replacement before deletion. |
| `CanonicalRagReadAdapter` cautions against treating lexical scores as hybrid/rerank parity. | Preserve score semantics when changing adapters. |
| Model selector already has allow-list filtering and credential/model subscriptions. | “Only four models” needs end-to-end reproduction, not blind removal of filters. |
| AI provider settings already maintain fast-response state and credential-dependent eligibility. | Diagnose state persistence and effective request routing; do not add another disconnected toggle. |
| `build:electron` uses esbuild transpilation. | Run an actual typecheck separately. |
| `test:intelligence` names intelligence root tests and context-intelligence tests, not the engine test directory explicitly. | Run engine tests explicitly and verify aggregate discovery; do not label the suite complete from its name. |

## Workpack installation — merge, do not overwrite

Proposed installed layout:

```text
AGENTS.md
ROADMAP.md                         # existing repository file: merge carefully
chatgpt-work/
  PROJECT_OVERVIEW.md
  PROJECT_TREE.txt
  TASK_TRACKER.md
  CHANGE_LOG.md
  ERROR_LOG.md
  HANDOFF.md
```

1. Extract the download into a temporary folder OUTSIDE the live repository.
2. Open the actual existing repository in VS Code. Do not replace it with the inspected public clone or discard local changes.
3. Ask Copilot Agent to inspect existing guidance and worktree first, then propose a documentation-only merge. Existing root ROADMAP.md and CLAUDE.md require reconciliation. Preserve unrelated work and historical backlog; do not silently replace an existing file.
4. After approval, install/merge these eight files. Record the actual branch/commit/worktree state in the tracker and handoff. No app-source edits or dependency installs in this bootstrap task.
5. Verify instruction discovery in the selected VS Code agent harness. The official VS Code documentation supports root AGENTS.md for compatible Copilot/Codex harnesses; it also explains using References/Agent Customizations to verify discovery. Inline suggestions do not use these custom instructions in the same way. See [VS Code documentation](https://code.visualstudio.com/docs/agent-customization/custom-instructions).
6. Where the harness needs `.github/copilot-instructions.md`, use a small link to `../AGENTS.md` rather than a conflicting second rulebook; create this only if needed and approved. Attach AGENTS.md manually if discovery cannot be confirmed.
7. Keep these repository copies authoritative. ChatGPT uploads are snapshots; do not assume local-folder write access or automatic upload synchronization.

Suggested first prompt:

```text
Read the proposed AGENTS.md and chatgpt-work files, and inspect the current
repository guidance, branch, HEAD, and uncommitted edits.

First propose a documentation-only merge of this workpack. Preserve my
existing ROADMAP.md content as historical backlog where relevant; do not
replace or revert my current Change 17 or chat/RAG edits. Do not install
packages or modify app code. Identify instruction conflicts before editing.

After I approve installation, update the tracking files yourself and verify
the saved files. Then show a small Change 17 continuation plan based on the
actual current code. Do not assume Changes 1–16 are verified.
```

## Running and verifying — inspect before execution

The following scripts were read from [the inspected package.json](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/package.json). They were NOT run. Installation executes extensive native rebuild/model-download hooks; get authorization and inspect the current lockfile/scripts before `npm ci` or `npm install`.

| Command | Purpose and caution |
|---|---|
| `npm run app:dev` / `npm start` | Starts the desktop development flow; not proof packaging works. |
| `npm run typecheck:electron` | Electron typecheck; distinct from transpilation. |
| `npm run typecheck:ts5` | Existing alternate frontend TypeScript check. |
| `npm run build` | Frontend/type build; clears `dist` and `dist-electron`. |
| `npm run build:electron` | Electron transpilation, not a typecheck. |
| `node --test "electron/intelligence/engine/__tests__/*.test.mjs"` | Explicit engine tests, AFTER building Electron; confirm current runner compatibility. |
| `npm run test:intelligence` | Observed aggregate; verify actual discovery, especially engine tests. |
| `npm run test:llm` | LLM-related tests; inspect mocks/live flags first. |
| `npm run test:lib`, `npm run test:scripts` | Targeted shared-library/script suites. |
| `npm run test:e2e` | Playwright tests; inspect required setup first. |
| `npm run test:ci` | Broad regression flow; not a latency or packaged-runtime certificate. |
| `npm run verify:packaged-local-assets` | Existing local-assets verification script. Source mode and packaged checks are distinct. |
| `npm run app:build` | Native/model-aware packaging pipeline; separate approved packaging task. |

Typical scoped order, AFTER prerequisites/authorization: typechecks → frontend build if needed → Electron build → focused engine/retrieval/provider tests → relevant runtime smoke test. If a later command clears output, rebuild it before dependent tests. Do not bypass failed tests by deleting them.

The observed `postinstall` runs patch-package, sharp rebuild, native Electron rebuild, model downloads, sqlite-vec/canvas preparation, plist patching, and architecture verification. Native compatibility depends on CPU architecture, Node/Electron ABI, local assets, and packaged paths; no single failure cause is established here.

## CI evidence, not a root-cause diagnosis

The latest retrieved Build Smoke run at this inspection was [40354373940](https://github.com/Abitesh/Sneak-Peek/actions/runs/40354373940) for the inspected commit. The API reported macOS and Windows entry-smoke jobs failed at `Verify packaged local fallback assets (source mode)` and `Run intelligence unit tests`; the weekly API smoke job succeeded. Job annotations also included a missing private-premium token/submodule warning. These facts do NOT establish that the warning caused those failed steps. Full failing output is still needed.

Track this as ERR-003/ERR-004 and a separate packaging/CI workstream, not an excuse to alter signing or native modules during Change 17. Recheck current runs before claiming the issue persists.

## Licensing and rebranding

The inspected [LICENSE](https://github.com/Abitesh/Sneak-Peek/blob/6837a7a5d1eaa2531c878f05bb4f873c23af3859/LICENSE) identifies a source-available personal-use license, not an open-source license, and imposes attribution/notice and rebranding conditions. The owner's contribution history does not by itself establish ownership of upstream rights. Preserve legal notices and licensing mechanisms. Treat the requested complete removal of Natively as permission-dependent FEAT-010, not a search-and-replace instruction. This is a project risk flag, not legal advice.

## Tree regeneration and privacy

PROJECT_TREE.txt is an observed, sanitized navigation snapshot, not the owner's live tree. Its generated sections describe the inspected public commit; the proposed workpack layout is separately labeled. Regenerate on the actual branch after installation and structural changes.

Use Git's tracked and non-ignored untracked path inventory, never file contents. Exclude `.git`, node_modules, generated outputs, caches, personal-files, user-data folders, private logs, credentials, `.env` files, model binaries, and local recordings. Collapse test directories if needed; state exclusions/depth and preserve metadata. Do not install a tree dependency merely for this.

Safe command to obtain candidate paths from the repository root:

```bash
git ls-files -co --exclude-standard -z
```

The output is only an input: sanitize/filter it before writing the tree. Do not expose private filenames or recursively walk ignored personal directories. Record branch, commit, whether dirty, generation time, and filters without asserting that the snapshot is current after code changes.

## Open decisions

- Current local branch/commit and actual Change 17 diff.
- Exact macOS version/CPU, enabled provider/model IDs, sanitized failure messages.
- Complete answer vs first useful token: the owner requested completion within six seconds. Retain that requirement; confirm output length and realistic benchmark conditions.
- One-second audio wording: default proposal is NO pre-roll/no old audio and no artificial one-second delay; optional <=1-second pre-roll requires explicit confirmation.
- Final product spelling/logo and legal permission for rebranding.
- App screenshots and supported PDF characteristics, including scanned documents/OCR expectations.
- Whether live assistance is permitted in each intended use. Use recordings/transcripts with consent; this plan is for authorized assistance, practice, and permitted interview workflows, not bypassing assessment rules.

## Local worktree update — 2026-11-04 (WORK-0020)

The preceding architecture review is a historical public-snapshot record and is not overwritten here. Current local application evidence is from branch `main` at `d53f1ac11f32769a35d3305a963915b1659fc0fd`, with pre-existing staged work preserved.

- Planned project knowledge now carries the engine-selected original file IDs and project-only scope into canonical lexical/vector retrieval; the compatibility fallback is constrained by the same scope. The structured-knowledge IPC path uses a planned-source read rather than starting the global planner again.
- Canonical reads remain disabled by default. `RAGManager` still retains legacy `queryMeeting`, `queryGlobal`, and `buildRAGPrompt`; a `rag:query-global` IPC caller remains active and is deferred to CHG-18. Do not remove these paths based solely on their age.
- WORK-0020 added type-filtered/source-ID-filtered canonical retrieval coverage and project capability tests. The one actual production legacy comparison in the current evidence is a synthetic meeting lexical comparison; it does not establish mode/personal, semantic/vector, or reranker parity.
- WORK-0020 typechecks, isolated Electron build, six-file focused Electron-ABI suite (70/70), and `test:intelligence` (2,076/0/9 TODO) passed. The full suite has 170 failures; identity comparison finds no new failing identity. Meeting/live RAG IPC source-regex failures assert an obsolete direct-handler shape; synthetic personal/profile grounding failures remain behavior failures with unresolved cause. Invalid/missing PDF fixtures do not establish parser behavior. See [TASK_TRACKER.md](./TASK_TRACKER.md), [CHANGE_LOG.md](./CHANGE_LOG.md), and [ERROR_LOG.md](./ERROR_LOG.md).
- Owner Mac desktop acceptance, actual mode/personal parity, valid synthetic résumé/PDF behavior, Windows checks, and end-to-end six-second completion latency remain unverified; CHG-18 is not yet safe to start. `PROJECT_TREE.txt` was not regenerated because it contains pre-existing staged owner changes.
