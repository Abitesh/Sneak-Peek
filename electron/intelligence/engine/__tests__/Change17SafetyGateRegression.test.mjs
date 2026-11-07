import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectFileScope } from '../../../../dist-electron/electron/intelligence/engine/ProjectFileScope.js';

const root = process.cwd();
const ipc = () => fs.readFileSync(path.join(root, 'electron/ipcHandlers.ts'), 'utf8');
const personal = () => fs.readFileSync(path.join(root, 'electron/personalKnowledge/PersonalKnowledgeManager.ts'), 'utf8');
const files = [
  { id: 'linkship', fileName: 'Linkship Architecture.pdf', fileType: 'project' },
  { id: 'linkship-test', fileName: 'Linkship design.md', fileType: 'project' },
  { id: 'linkship-legacy', fileName: 'Linkship Legacy Notes.pdf', fileType: 'project' },
  { id: 'other', fileName: 'Other Project Architecture.pdf', fileType: 'project' },
  { id: 'resume', fileName: 'resume.pdf', fileType: 'resume' },
];

test('CHG-17 gate: exact project identity accepts multiple files for same project only', () => {
  const scope = resolveProjectFileScope('Why did you use Redis in Linkship?', files);
  assert.deepEqual(scope.selectedFileIds, ['linkship', 'linkship-test']);
  assert.equal(scope.namedProject, 'linkship');
  assert.equal(scope.missingNamedProject, false);
});

test('CHG-17 gate: overlapping sibling project is a different identity', () => {
  const scope = resolveProjectFileScope('Explain Linkship Legacy architecture', files);
  assert.deepEqual(scope.selectedFileIds, ['linkship-legacy']);
  assert.equal(scope.projectAvailable, true);
});

test('CHG-17 gate: lowercase and subject-before-verb project references stay scoped', () => {
  for (const q of ['Why did you use Redis in linkship?', 'How did linkship use Redis?', 'Was Redis used in linkship?']) {
    const scope = resolveProjectFileScope(q, files);
    assert.deepEqual(scope.selectedFileIds, ['linkship', 'linkship-test'], q);
  }
});

test('CHG-17 gate: unknown named project fails closed, general questions remain unscoped', () => {
  const missing = resolveProjectFileScope('Why did you use Redis in GhostProject?', files);
  assert.equal(missing.projectAvailable, false);
  assert.equal(missing.missingNamedProject, true);
  assert.deepEqual(missing.selectedFileIds, []);
  const general = resolveProjectFileScope('What is DBMS?', files);
  assert.equal(general.namedProject, undefined);
  assert.equal(general.selectedFileIds, undefined);
});

test('CHG-17 gate: production project IDs reach the scoped adapter with cancellation', () => {
  const source = ipc();
  assert.match(source, /source:\s*['"]project_knowledge['"][\s\S]*?projectFileIds:\s*request\.activeContext\?\.projectSourceIds/);
  const canonicalAdapter = fs.readFileSync(path.join(root, 'electron/intelligence/engine/CanonicalRagRetrievalAdapter.ts'), 'utf8');
  assert.match(canonicalAdapter, /projectFileIds:\s*scope\.projectFileIds/);
  const rag = fs.readFileSync(path.join(root, 'electron/rag/RAGManager.ts'), 'utf8');
  const adapter = fs.readFileSync(path.join(root, 'electron/rag/adapters/PersonalRagAdapter.ts'), 'utf8');
  assert.match(rag, /signal:\s*options\.signal/);
  assert.match(rag, /if \(options\.failOnSourceError\) throw error;/);
  assert.match(adapter, /signal\?\.aborted/);
  assert.match(adapter, /projectFileIds\.has\(String\(item\.fileId/);
});

test('CHG-17 gate: question retrieval never repairs user chunks and returns lexical fallback on timeout', () => {
  const source = personal();
  const start = source.indexOf('async searchRelevantAsync(');
  const end = source.indexOf('async repairIndexesInBackground(', start);
  assert.ok(start >= 0 && end > start);
  const method = source.slice(start, end);
  assert.doesNotMatch(method, /await this\.repairLegacyChunking\(\)/);
  assert.doesNotMatch(method, /await this\.repairUnreadableIndexes\(\)/);
  assert.match(method, /this\.searchRelevant\(query/);
  assert.match(method, /signal\?\.aborted/);
  assert.match(source, /withinQueryEmbeddingBudget/);
  const main = fs.readFileSync(path.join(root, 'electron/main.ts'), 'utf8');
  assert.match(main, /repairIndexesInBackground\(\)/);
});

test('CHG-17 gate: clear-chat and manual state share sender key even during meeting', () => {
  const source = ipc();
  assert.match(source, /const sessionId = String\(senderId\);/);
  assert.match(source, /const nativeSessionId = sessionId;/);
  assert.match(source, /clearConversationState\(String\(senderId\)\)/);
  assert.match(source, /stream\.controller\.abort\(\)/);
});

test('CHG-17 gate: production observer and prompt outcomes never print private evidence IDs', () => {
  const source = ipc();
  assert.match(source, /onDecision: \(trace\) => \{/);
  assert.match(source, /trace\.sourceOutcomes\.map/);
  assert.match(source, /includedEvidenceCount/);
  assert.match(source, /retrieval: sneakPeekResult\.diagnostics\.retrieval/);
  assert.match(source, /profile retrieval capability failed'\);\s*throw error;/);
  const primary = source.slice(source.indexOf("console.log('[Sneak-Peek Intelligence] manual-chat PRIMARY trace'"), source.indexOf("console.log('[Sneak-Peek Intelligence] manual-chat PRIMARY trace'") + 700);
  assert.doesNotMatch(primary, /includedEvidenceIds:/);
});

test('CHG-17 gate: embedding timeout returns before a hanging provider, without using late output', async () => {
  const { withinQueryEmbeddingBudget } = await import('../../../../dist-electron/electron/rag/QueryEmbeddingBudget.js');
  let release;
  const unresolved = new Promise((resolve) => { release = resolve; });
  const started = Date.now();
  const result = await withinQueryEmbeddingBudget(() => unresolved, undefined, 15);
  assert.equal(result, null);
  assert.ok(Date.now() - started < 200, 'query must return without waiting for provider');
  release({ embeddings: [[1, 2, 3]], space: 'unused' });
  await Promise.resolve();
  assert.equal(result, null, 'late provider result must not alter an already-resolved query');
});

test('CHG-17 gate: abort wins immediately over a pending embedding', async () => {
  const { withinQueryEmbeddingBudget } = await import('../../../../dist-electron/electron/rag/QueryEmbeddingBudget.js');
  const controller = new AbortController();
  const never = new Promise(() => {});
  const pending = withinQueryEmbeddingBudget(() => never, controller.signal, 30_000);
  controller.abort();
  assert.equal(await pending, null);
  assert.equal(await withinQueryEmbeddingBudget(() => never, controller.signal, 30_000), null);
});
