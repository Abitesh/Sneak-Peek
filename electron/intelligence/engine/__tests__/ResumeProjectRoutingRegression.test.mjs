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
    activeContext: { profileId: 'local-profile' },
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

test('broad interview request for candidate projects uses profile/personal evidence', () => {
  const { understanding, contextPlan } = plan('Explain your projects while you are at it');

  assert.equal(understanding.intent, 'personal-question');
  assert.ok(contextPlan.requiredSources.includes('personal_knowledge'));
  assert.ok(contextPlan.requiredSources.includes('profile'));
  assert.ok(contextPlan.forbiddenSources.includes('project_knowledge'));
});

test('resume-explicit project listing remains profile-owned even when project files exist', () => {
  const { understanding, contextPlan } = plan('Tell me about the projects on my resume');

  assert.equal(understanding.intent, 'personal-question');
  assert.ok(contextPlan.requiredSources.includes('personal_knowledge'));
  assert.ok(contextPlan.requiredSources.includes('profile'));
  assert.ok(contextPlan.forbiddenSources.includes('project_knowledge'));
});

test('generic project-history wording is profile recall rather than project-file proof', () => {
  const { understanding, contextPlan } = plan('What projects have I worked on?');

  assert.equal(understanding.intent, 'personal-question');
  assert.ok(contextPlan.requiredSources.includes('profile'));
  assert.ok(contextPlan.requiredSources.includes('personal_knowledge'));
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
