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
    '## Code',
    '```python\ndef twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen: return [seen[target - n], i]\n        seen[n] = i\n```',
    '## Dry Run',
    'Process each value in order.',
    '## Complexity',
    'Time Complexity: O(n), Space Complexity: O(n).',
    '## Interviewer Follow-up Points',
    'Handle duplicate values and absent target pairs.',
  ].join('\n');
  const promoted = {
    ...request, surface: 'what-to-answer',
    liveAnswer: { plan: { answerType: 'technical_concept_answer', question: 'how do I solve this?' } },
    screenContext: { text: 'class Solution:\n    def twoSum(self, nums, target):\n        pass' },
  };
  assert.equal(validateCanonicalAnswer(promoted, { ...result, resolvedQuestion: 'how do I solve this?' }, answer), null);
  const notPromoted = { ...promoted, screenContext: undefined };
  const withoutScreen = validateCanonicalAnswer(notPromoted, result, answer);
  assert.equal(withoutScreen?.reason, 'spoken-format');
});

const screenRequest = {
  ...request, userMessage: 'how do I solve this?', surface: 'what-to-answer',
  liveAnswer: { plan: { answerType: 'technical_concept_answer', question: 'how do I solve this?' } },
  screenContext: { text: 'class Solution:\n    def twoSum(self, nums, target):\n        pass' },
};
for (const answer of ['Use a dictionary to find the answer.', '```python\ndef twoSum(nums, target):\n    return []']) {
  test(`promoted screen coding rejects incomplete implementation: ${answer.slice(0, 20)}`, () => {
    const issue = validateCanonicalAnswer(screenRequest, result, answer);
    assert.equal(issue?.reason, 'coding');
    assert.equal(issue?.unsafeToPersist, true);
  });
}
test('promoted screen coding honors explicit explanation without inventing required code', () => {
  assert.equal(validateCanonicalAnswer({ ...screenRequest, manualQuestion: 'Explain this without code' },
    { ...result, resolvedQuestion: 'how do I solve this?' },
    'Store earlier values in a dictionary and check each complement before inserting the next value.'), null);
});


test('an attached screenshot of a non-code error is not promoted to a coding contract', () => {
  const screenshot = { ...screenRequest,
    liveAnswer: { plan: { answerType: 'technical_concept_answer', question: 'What should we do here?' } },
    screenContext: { text: 'Visible prompt: explain the error on screen', imagePaths: ['/synthetic/screen.png'] },
  };
  const issue = validateCanonicalAnswer(screenshot,
    { ...result, resolvedQuestion: 'What should we do here?' },
    'Use the visible error message to explain the fix.');
  assert.equal(issue, null);
});

test('image-only deictic screen turn retains coding contract until evidence establishes otherwise', () => {
  const screenshot = { ...screenRequest,
    screenContext: { text: '', imagePaths: ['/synthetic/code.png'] },
  };
  const issue = validateCanonicalAnswer(screenshot, result, 'Use a dictionary to solve the problem.');
  assert.equal(issue?.reason, 'coding');
  assert.equal(issue?.unsafeToPersist, true);
});


test('an explicit screen-coding ask still requires code even if the image OCR is incomplete', () => {
  const screenshot = { ...screenRequest,
    screenContext: { text: 'Screenshot of an editor window', imagePaths: ['/synthetic/code.png'] },
  };
  const issue = validateCanonicalAnswer(screenshot, result, 'The algorithm is easy.');
  assert.equal(issue?.reason, 'coding');
});
