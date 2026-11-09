import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const engineBase = path.resolve(process.cwd(), 'dist-electron/electron/intelligence/engine');
const { planContext } = await import(pathToFileURL(path.join(engineBase, 'ContextPlanner.js')).href);
const { understandTurn } = await import(
  pathToFileURL(path.join(process.cwd(), 'dist-electron/electron/context-intelligence/question/question-resolver.js')).href,
);

const allPermissions = {
  conversation: true,
  transcript: false,
  screen: false,
  mode: false,
  project: true,
  profile: true,
  files: true,
  memory: true,
  generalKnowledge: true,
};

function request(message, permissions = allPermissions) {
  return {
    requestId: 'resume-project-routing',
    sessionId: 'resume-project-session',
    surface: 'manual-chat',
    userMessage: message,
    currentTurn: { id: 'turn-1', role: 'user', content: message },
    recentConversation: [],
    activeContext: { profileId: 'local-profile', resumeSourceIds: ['resume-allowed'] },
    contextPermissions: { ...permissions },
  };
}

function plan(message, permissions = allPermissions) {
  const req = request(message, permissions);
  const understanding = understandTurn({
    manualQuestion: message,
    sessionId: req.sessionId,
  });
  return { understanding, contextPlan: planContext({ request: req, understanding }) };
}

// These tests previously pinned the legacy profile-only policy. Portfolio
// questions now use project-tagged PDFs plus an explicit authorized resume ID;
// keep the negative named-project and general-CS controls below unchanged.
for (const phrase of [
  'Explain your projects while you are at it',
  'Tell me about the projects on my resume',
  'What projects have I worked on?',
  'Then can you explain me Your projects you mentioned in the resume',
]) {
  test(`portfolio retrieval selects project-tagged evidence with explicit resume IDs: ${phrase}`, () => {
    const { contextPlan } = plan(phrase);
    assert.ok(contextPlan.requiredSources.includes('project_knowledge'), phrase);
    assert.ok(contextPlan.requiredSources.includes('my_files'), phrase);
    assert.ok(contextPlan.requiredSources.includes('rag'), phrase);
    assert.ok(contextPlan.forbiddenSources.includes('profile'), 'project evidence must outrank generic profile facts');
    assert.ok(contextPlan.forbiddenSources.includes('mode_documents'), phrase);
  });
}

test('resume-only portfolio uses the exact authorized résumé source, not all project files', () => {
  const permissions = { ...allPermissions, project: false };
  const { contextPlan } = plan('Then explain your projects on my resume', permissions);
  assert.ok(contextPlan.requiredSources.includes('my_files'));
  assert.ok(contextPlan.requiredSources.includes('rag'));
  assert.ok(!contextPlan.requiredSources.includes('project_knowledge'));
  assert.ok(contextPlan.forbiddenSources.includes('profile'));
  assert.ok(contextPlan.forbiddenSources.includes('personal_knowledge'));
  assert.ok(contextPlan.forbiddenSources.includes('mode_documents'));
});

test('named implementation question keeps project-file authority when available', () => {
  const { understanding, contextPlan } = plan('Why did you use Redis in Linkship?');

  assert.equal(understanding.intent, 'project-question');
  assert.ok(contextPlan.requiredSources.includes('project_knowledge'));
  assert.ok(contextPlan.requiredSources.includes('rag'));
  assert.ok(contextPlan.forbiddenSources.includes('profile'));
  assert.ok(contextPlan.forbiddenSources.includes('personal_knowledge'));
});

test('named project question falls back to profile when no project file exists', () => {
  const permissions = { ...allPermissions, project: false };
  const { understanding, contextPlan } = plan('Why did you use Redis in Linkship?', permissions);

  assert.equal(understanding.intent, 'project-question');
  assert.ok(contextPlan.requiredSources.includes('profile'));
  assert.ok(contextPlan.requiredSources.includes('personal_knowledge'));
  assert.ok(contextPlan.forbiddenSources.includes('project_knowledge'));
  assert.ok(!contextPlan.requiredSources.includes('rag'));
});

test('implementation-detail wording is not accidentally downgraded to broad profile recall', () => {
  const { understanding, contextPlan } = plan('Explain your project architecture');

  assert.equal(understanding.intent, 'project-question');
  assert.ok(contextPlan.requiredSources.includes('project_knowledge'));
  assert.ok(contextPlan.forbiddenSources.includes('profile'));
});

test('general CS question still opens no private source', () => {
  const { contextPlan } = plan('What is DBMS?');

  assert.deepEqual(contextPlan.requiredSources, []);
  assert.ok(contextPlan.forbiddenSources.includes('project_knowledge'));
  assert.ok(contextPlan.forbiddenSources.includes('profile'));
  assert.ok(contextPlan.forbiddenSources.includes('personal_knowledge'));
});

test('meeting/interview request permissions reflect actual profile and project-file availability', () => {
  const ipc = fs.readFileSync(path.resolve(process.cwd(), 'electron/ipcHandlers.ts'), 'utf8');
  const start = ipc.indexOf('function buildSneakPeekMeetingRequest(');
  const end = ipc.indexOf('async function streamSneakPeekMeetingAnswer(', start);
  assert.ok(start >= 0 && end > start, 'meeting request builder must exist');
  const block = ipc.slice(start, end);

  assert.match(block, /project:\s*projectFilesAvailable/);
  assert.match(block, /profile:\s*profileAvailable/);
  assert.match(block, /files:\s*personalFilesAvailable/);
  assert.match(block, /memory:\s*projectScope\.missingNamedProject\s*\?\s*false\s*:\s*\(personalFilesAvailable\s*\|\|\s*profileAvailable\)/);
  assert.match(block, /projectSourceIds:\s*projectScope\.selectedFileIds/, 'named project scope must be forwarded');
  assert.doesNotMatch(block, /project:\s*true/);
});
