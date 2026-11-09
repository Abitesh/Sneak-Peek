import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProjectFileScope, resolveProjectFileScopeForTurn } from '../../../../dist-electron/electron/intelligence/engine/ProjectFileScope.js';

const files = [
  { id: 'linkship', fileName: 'Linkship.md', fileType: 'project' },
  { id: 'legacy', fileName: 'Linkship Legacy.md', fileType: 'project' },
  { id: 'profile', fileName: 'Linkship Resume.pdf', fileType: 'resume' },
];

for (const question of [
  'Tell me about Linkship.',
  'Tell me about Linkship, please.',
  'Tell me about the project Linkship.',
  'Tell me about my project Linkship.',
  'Tell me about Linkship in detail.',
  'Please describe Linkship briefly.',
  'Why did you use Redis in Linkship?',
]) {
  test(`named overview keeps exact Linkship scope: ${question}`, () => {
    const scope = resolveProjectFileScope(question, files);
    assert.equal(scope.namedProject, 'linkship');
    assert.deepEqual(scope.selectedFileIds, ['linkship']);
    assert.equal(scope.missingNamedProject, false);
  });
}

for (const question of [
  'Tell me about Linkship Legacy.',
  'Tell me about Linkship Legacy in detail.',
  'Tell me about the project Linkship Legacy, please.',
  'Why does Linkship Legacy use Redis?',
  'Why does Linkship Legacy use Redis for caching?',
]) {
  test(`sibling overview keeps exact Legacy scope: ${question}`, () => {
    const scope = resolveProjectFileScope(question, files);
    assert.equal(scope.namedProject, 'linkship legacy');
    assert.deepEqual(scope.selectedFileIds, ['legacy']);
  });
}

test('unknown named overview is an explicit zero-ID scope, not a broad search', () => {
  const result = resolveProjectFileScope('Tell me about Missing Project.', files);
  assert.equal(result.missingNamedProject, true);
  assert.deepEqual(result.selectedFileIds, []);
});

test('unknown named project overview with trailing details also fails closed', () => {
  const result = resolveProjectFileScope('Tell me about GhostProject in detail.', files);
  assert.equal(result.missingNamedProject, true);
  assert.deepEqual(result.selectedFileIds, []);
});

test('general technical question never selects a project or profile file', () => {
  const result = resolveProjectFileScope('What is DBMS?', files);
  assert.equal(result.namedProject, undefined);
  assert.equal(result.selectedFileIds, undefined);
});

test('unresolved generic project follow-up fails closed without a completed prior exchange', () => {
  const result = resolveProjectFileScopeForTurn('Why is Redis used in your project?', files, [
    { id: 'current', role: 'user', text: 'Why is Redis used in your project?' },
  ], 'current');
  assert.equal(result.unresolvedReference, true);
  assert.deepEqual(result.selectedFileIds, []);
});


test('uploaded Linkship _Intermediate_Interview.pdf resolves to exact project without matching sibling or generic interview PDF', () => {
  const uploads = [
    { id: 'current-project', fileName: 'Linkship _Intermediate_Interview.pdf', fileType: 'project' },
    { id: 'sibling-project', fileName: 'Linkship Legacy _Intermediate_Interview.pdf', fileType: 'project' },
    { id: 'unrelated-interview', fileName: 'Basic Interview Answer.pdf', fileType: 'project' },
    { id: 'cv', fileName: 'Linkship_Resume.pdf', fileType: 'resume' },
  ];
  const single = resolveProjectFileScope('Why did you use Redis in Linkship?', uploads);
  assert.deepEqual(single.selectedFileIds, ['current-project']);
  const sibling = resolveProjectFileScope('Tell me about Linkship Legacy.', uploads);
  assert.deepEqual(sibling.selectedFileIds, ['sibling-project']);
});
