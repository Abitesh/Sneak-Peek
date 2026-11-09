// WORK-0038C: production-path source authorization and v1 profile compatibility.
// Run after npm run build:electron with Electron's --test runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { KnowledgeOrchestrator } = require('../../../dist-electron/premium/electron/knowledge/KnowledgeOrchestrator.js');
const { planAnswer } = require('../../../dist-electron/electron/llm/AnswerPlanner.js');

const RESUME = {
  structured_data: {
    identity: { name: 'Casey Example' },
    skills: ['WebRTC', 'PostgreSQL', 'Gainsight'],
    experience: [{ company: 'Sample Labs', role: 'Engineer', start_date: '2023', end_date: null, bullets: ['Built WebRTC media pipeline'] }],
    projects: [{ name: 'Project One', description: 'Built a WebRTC service', technologies: ['WebRTC'] }],
    certifications: [{ name: 'CKA', issuer: 'CNCF' }],
    achievements: [], education: [], leadership: [],
  },
};
const JD = { structured_data: { title: 'Analyst', requirements: ['SQL'] } };
function makeOrchestrator() {
  const store = {
    getDocumentByType(t) { return t === 'resume' ? JSON.parse(JSON.stringify(RESUME)) : t === 'jd' ? JD : null; },
    updateDocumentStructuredData() {},
  };
  const orchestrator = new KnowledgeOrchestrator(store);
  orchestrator.setKnowledgeMode(true);
  return orchestrator;
}

test('manual first-person skill experience is required resume evidence, not a generic concept', async () => {
  const query = 'Have I used WebRTC?';
  const plan = planAnswer({ question: query, source: 'manual_input', speakerPerspective: 'user' });
  assert.equal(plan.answerType, 'skill_experience_answer');
  assert.equal(plan.profileContextPolicy, 'required');
  const context = (await makeOrchestrator().processQuestion(query))?.contextBlock || '';
  assert.match(context, /WebRTC/);
  assert.match(context, /Sample Labs/);
  assert.doesNotMatch(context, /<target_job>/);
});

test('v1 document lookup normalizes flat skills without mutating the source object', async () => {
  const orig = JSON.stringify(RESUME);
  const context = (await makeOrchestrator().processQuestion('What skills do I have?'))?.contextBlock || '';
  assert.match(context, /Gainsight/);
  assert.match(context, /PostgreSQL/);
  assert.doesNotMatch(context, /<experience>/, 'plain skills query should not dump employment history');
  assert.doesNotMatch(context, /<projects>/, 'plain skills query should not dump project descriptions');
  assert.equal(JSON.stringify(RESUME), orig);
});

test('certifications are rendered from evidence, while technical concept prompts stay ungrounded', async () => {
  const o = makeOrchestrator();
  const cert = await o.processQuestion('What certifications do I have?');
  assert.match(cert?.contextBlock || '', /CKA/);
  assert.match(cert?.contextBlock || '', /<certifications>/);
  const concept = await o.processQuestion('Explain WebRTC protocols');
  assert.doesNotMatch(concept?.contextBlock || '', /Casey Example|Sample Labs|Gainsight/);
});
