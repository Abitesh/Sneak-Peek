import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanonicalRagRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

test('project capability passes the coordinator-authorized file IDs to its planned reader', async () => {
  let captured;
  const capability = createCanonicalRagRetrievalCapability({
    source: 'project_knowledge',
    sourceType: 'personal',
    resolveScope: ({ request }) => ({
      projectFilesOnly: true,
      projectFileIds: request.activeContext.projectSourceIds,
    }),
    read: async (input) => {
      captured = input;
      return { results: [], usedCanonical: false, fallbackReason: 'empty' };
    },
  });

  await capability.retrieve({
    query: 'Why did Linkship select Redis?',
    source: 'project_knowledge',
    request: {
      sessionId: 'synthetic-session',
      activeContext: { projectSourceIds: ['linkship-file-1'] },
    },
    contextPlan: {},
  });

  assert.equal(captured.projectFilesOnly, true);
  assert.deepEqual(captured.projectFileIds, ['linkship-file-1']);
});

test('production project capability does not invoke a second global source planner', () => {
  const source = readFileSync(path.join(root, 'electron/ipcHandlers.ts'), 'utf8');
  const start = source.indexOf("source: 'project_knowledge',", source.indexOf('function createPrimaryManualSneakPeekEngine('));
  const end = source.indexOf("source: 'my_files',", start);
  assert.ok(start >= 0 && end > start);
  const project = source.slice(start, end);
  assert.match(project, /projectFilesOnly:\s*true/);
  assert.match(project, /projectFileIds:\s*request\.activeContext\?\.projectSourceIds/);
  assert.match(project, /ragManager\.readPlannedCanonicalSource\(input\)/);
  assert.doesNotMatch(project, /ragManager\.search\(|queryPlanner\.plan\(/);
});

test('structured knowledge reads only the engine-selected OKF source', () => {
  const source = readFileSync(path.join(root, 'electron/ipcHandlers.ts'), 'utf8');
  const engineStart = source.indexOf('function createPrimaryManualSneakPeekEngine(');
  const start = source.indexOf("createRetrievalCapability('structured_knowledge'", engineStart);
  const end = source.indexOf("createRetrievalCapability('profile'", start);
  assert.ok(start >= 0 && end > start);
  const branch = source.slice(start, end);
  assert.match(branch, /ragManager\.readPlannedKnowledgeSource\(/);
  assert.doesNotMatch(branch, /ragManager\.search\(|queryPlanner\.plan\(/);
  const manager = readFileSync(path.join(root, 'electron/rag/RAGManager.ts'), 'utf8');
  const methodStart = manager.indexOf('public async readPlannedKnowledgeSource(');
  const methodEnd = manager.indexOf('public async readPlannedCanonicalSource(', methodStart);
  assert.ok(methodStart >= 0 && methodEnd > methodStart);
  assert.match(manager.slice(methodStart, methodEnd), /this\.knowledgeAdapter\.retrieve\(/);
  assert.doesNotMatch(manager.slice(methodStart, methodEnd), /this\.search\(|this\.queryPlanner\.plan\(/);
});
