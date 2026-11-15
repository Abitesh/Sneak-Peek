import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Compile before running: npm run build:electron
const { validateCanonicalAnswer } = await import(pathToFileURL(resolve(
  'dist-electron/electron/intelligence/engine/AnswerValidation.js',
)).href);

const request = { userMessage: 'Explain a mutex.' };
const result = {
  resolvedQuestion: 'Explain a mutex.',
  prompt: { includedEvidenceIds: [] },
  contextPlan: { requiredSources: [] },
  responsePlan: { detailLevel: 'concise' },
  evidencePack: { items: [] },
};

test('canonical answer validator accepts a valid general explanation without a special plan', () => {
  assert.equal(validateCanonicalAnswer(request, result, 'A mutex allows one thread at a time to enter a critical section.'), null);
});

test('canonical answer validator blocks an empty response from persistence', () => {
  const issue = validateCanonicalAnswer(request, result, '   ');
  assert.equal(issue?.reason, 'relevance');
  assert.equal(issue?.unsafeToPersist, true);
});


test('promoted screen coding does not regenerate legitimate coding headings as spoken pollution', () => {
  const answer = [
    '## Approach',
    'Use the supplied Solution class and solve the array problem.',
    '## Technique / Data Structure / Algorithm Used',
    'Use a dictionary for seen elements.',
    '## Dry Run',
    'Process each value in order.',
    '## Complexity',
    'Time O(n), Space O(n).',
  ].join('\n');
  const promoted = {
    ...request, surface: 'what-to-answer',
    liveAnswer: { plan: { answerType: 'technical_concept_answer', question: 'how do I solve this?' } },
    screenContext: { text: 'class Solution:\n    def twoSum(self, nums, target):\n        pass' },
  };
  assert.equal(validateCanonicalAnswer(promoted, result, answer), null);
  const notPromoted = { ...promoted, screenContext: undefined };
  const withoutScreen = validateCanonicalAnswer(notPromoted, result, answer);
  assert.equal(withoutScreen?.reason, 'spoken-format');
});
