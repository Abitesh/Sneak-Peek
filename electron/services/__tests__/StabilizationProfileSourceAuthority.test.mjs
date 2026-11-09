import test from 'node:test';
import assert from 'node:assert/strict';
import { KnowledgeOrchestrator } from '../../../dist-electron/premium/electron/knowledge/KnowledgeOrchestrator.js';
function fixture(resume = true) {
  const o = Object.create(KnowledgeOrchestrator.prototype);
  o.knowledgeMode = true;
  o.activeResume = resume ? { structured_data: { identity: { name: 'Violet Example' }, skills: { languages: ['TypeScript'], databases: ['SQLite'] }, experience: [{ role: 'Intern', company: 'Violet Lab', bullets: ['Implemented orchid leases'] }], certifications: [{ name: 'Violet Database Certificate' }] } } : null;
  o.activeJD = { structured_data: { title: 'Amber Analyst', requirements: ['Amber analytics'] } };
  o.activeCompany = { name: 'Forbidden company canary' };
  return o;
}
for (const question of ['solve two sum', 'What is DBMS?', 'What is Redis?', 'Write binary search in Python.', 'why is your product expensive?']) {
  test(`private profile and JD excluded for ${question}`, async () => {
    assert.equal(await fixture().processQuestion(question), null);
  });
}
test('skills question returns structured skill categories without unrelated JD', async () => {
  const result = await fixture().processQuestion('What skills do I have?');
  assert.match(result.contextBlock, /TypeScript/); assert.match(result.contextBlock, /SQLite/);
  assert.doesNotMatch(result.contextBlock, /Amber Analyst|Forbidden company canary/);
});
test('internship question preserves actual experience bullets', async () => {
  const result = await fixture().processQuestion('Explain my internship.');
  assert.match(result.contextBlock, /orchid leases/); assert.doesNotMatch(result.contextBlock, /Amber Analyst/);
});
test('an authorized JD-only question remains answerable without a resume', async () => {
  const result = await fixture(false).processQuestion('What does the job description require?');
  assert.match(result.contextBlock, /Amber analytics/); assert.doesNotMatch(result.contextBlock, /Violet Example/);
});
