// WORK-0038 — profile facts are injected only from AnswerPlanner-authorized
// sources; this is a source boundary test, not an expectation of free RAG data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const compiled = (f) => pathToFileURL(path.join(root, 'dist-electron', f)).href;
const { KnowledgeOrchestrator } = await import(compiled('premium/electron/knowledge/KnowledgeOrchestrator.js'));
const { planAnswer } = await import(compiled('electron/llm/AnswerPlanner.js'));
const { isProfileGroundingV2Enabled } = await import(compiled('electron/llm/profileGroundingV2.js'));
const enabled = isProfileGroundingV2Enabled();
const resume = {
  structured_data: { identity: { name: 'Synthetic Candidate' },
    skills: { languages: ['Python', 'TypeScript'], databases: ['PostgreSQL'] },
    experience: [], projects: [{ name: 'SyntheticProject', description: 'Mock source fact' },
      { name: 'SiblingProject', description: 'Unrelated sibling fact' }],
    education: [], achievements: [], certifications: [], leadership: [] },
};
const jd = {
  structured_data: { title: 'Data Analyst', company: 'Synthetic Employer',
    requirements: ['SQL'], technologies: ['Python'] },
};
function make(resumeDoc = resume, jdDoc = jd) {
  const db = {
    getDocumentByType(type) { return type === 'resume' ? resumeDoc : type === 'jd' ? jdDoc : null; },
  };
  const orchestrator = new KnowledgeOrchestrator(db);
  orchestrator.setKnowledgeMode(true);
  return orchestrator;
}
const hasResume = (r) => /<candidate_profile>\n/.test(r?.contextBlock || '');
const hasJD = (r) => /<target_job>\n/.test(r?.contextBlock || '');

test('V2: skill and experience questions include the authorized resume, not JD', { skip: !enabled }, async () => {
  const o = make();
  for (const q of ['what are my main programming languages?', 'have you used Python?']) {
    const result = await o.processQuestion(q);
    assert.ok(hasResume(result), `${q}: resume missing`);
    assert.equal(hasJD(result), false, `${q}: unrelated JD leaked`);
    assert.match(result.contextBlock, /Synthetic Candidate/);
  }
});

test('V2: job-role lookup works with only an authorized JD', { skip: !enabled }, async () => {
  const q = 'what role am I applying for?';
  const plan = planAnswer({question:q,source:'manual_input',speakerPerspective:'user'});
  assert.ok(plan.requiredContextLayers.includes('jd'));
  assert.ok(!plan.requiredContextLayers.includes('resume'));
  const result = await make(null, jd).processQuestion(q);
  assert.ok(hasJD(result));
  assert.equal(hasResume(result), false);
  assert.match(result.contextBlock, /Data Analyst/);
});

test('V2: JD-fit includes exactly resume plus JD when both exist', { skip: !enabled }, async () => {
  const result = await make().processQuestion('how do I fit this data analyst role?');
  assert.ok(hasResume(result));
  assert.ok(hasJD(result));
});

test('V2: named project summary excludes its sibling', { skip: !enabled }, async () => {
  const result = await make().processQuestion('Tell me about my project SyntheticProject');
  assert.match(result?.contextBlock || '', /SyntheticProject/);
  assert.doesNotMatch(result?.contextBlock || '', /SiblingProject/);
  const unknown = await make().processQuestion('Tell me about my project MissingProject');
  assert.doesNotMatch(unknown?.contextBlock || '', /SyntheticProject|SiblingProject/);
});

test('V2: generic technical and ambiguous project asks never auto-open private files', async () => {
  const o = make();
  for (const q of ['what is a hashmap?', 'tell me about my UnknownTechnology']) {
    const p = planAnswer({question:q,source:'manual_input',speakerPerspective:'user'});
    if (p.profileContextPolicy !== 'required') {
      const r = await o.processQuestion(q);
      assert.equal(hasResume(r), false, q);
      assert.equal(hasJD(r), false, q);
    }
  }
});
