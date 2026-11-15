import test from 'node:test';
import assert from 'node:assert/strict';
import { decideWtaRawOutput } from '../../../../dist-electron/electron/intelligence/engine/WtaRawOutputPolicy.js';

const decide = (text, overrides = {}) => decideWtaRawOutput({
  text,
  answerType: 'jd_fit_answer',
  coding: false,
  hasExtractedQuestion: true,
  isNonAnswerSentinel: (value) => /^nothing (?:actionable|to capture) right now[.!?]*$/i.test(value.trim()),
  isFalseNoContentClaim: (value) => /^there'?s nothing captured to summarize yet\.?$/i.test(value.trim()),
  ...overrides,
});

test('raw provider error is never classified as persistable answer', () => {
  const text = "I couldn't reach the AI provider — this looks like an API key or rate-limit issue. Check your API keys / plan in Settings and try again.";
  assert.deepEqual(decide(text), { kind: 'provider-error', text });
});

test('an internal tag block fails closed before validation/repair', () => {
  const result = decide('<rewrite_instructions>Do not answer</rewrite_instructions>');
  assert.equal(result.kind, 'invalid-artifact');
  assert.doesNotMatch(result.text, /rewrite_instructions/);
});

test('manual sentinel and false no-content claim are not persisted as answers', () => {
  assert.equal(decide('Nothing actionable right now.').kind, 'nonanswer');
  assert.equal(decide("There's nothing captured to summarize yet.").kind, 'nonanswer');
  assert.equal(decide("There's nothing captured to summarize yet.", { hasExtractedQuestion: false }).kind, 'answer');
});

test('recover substantive JSON answer while respecting technical JSON', () => {
  const restored = decide('{"answer":"I built resilient streaming services that recover safely after failover.","note":"internal"}');
  assert.equal(restored.kind, 'answer');
  assert.equal(restored.recoveredJson, true);
  assert.equal(restored.text, 'I built resilient streaming services that recover safely after failover.');
  const json = '{"status":"ok","code":200}';
  assert.deepEqual(decide(json, { coding: true }), { kind: 'answer', text: json, recoveredJson: false });
});

test('real prose and near-match sentinels remain untouched', () => {
  const prose = 'Nothing actionable right now, but I can propose a safe migration plan.';
  assert.deepEqual(decide(prose), { kind: 'answer', text: prose, recoveredJson: false });
});
