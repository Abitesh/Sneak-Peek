import test from 'node:test';
import assert from 'node:assert/strict';
import { selectWtaSpeechTurns } from '../../../../dist-electron/electron/intelligence/engine/WtaSpeechProvenance.js';

const turn = (role, text, origin, sttProvider) => ({
  role, text, timestamp: 1720000000000, ...(origin === undefined ? {} : { origin }),
  ...(sttProvider === undefined ? {} : { sttProvider }),
});

test('canonical WTA authorizes only explicitly spoken turns, never typed or assistant history', () => {
  const speech = turn('interviewer', 'Explain a mutex.', 'stt', 'deepgram');
  const testSpeech = turn('interviewer', 'Explain a semaphore.', 'test');
  const legacySpeech = turn('user', 'What is locking?', undefined, 'legacy-stt');
  const mixed = [
    turn('assistant', 'Private previous answer.', 'assistant'),
    turn('user', 'Private typed decoy.', 'manual_chat'),
    turn('user', 'Private typed with stale STT field.', 'manual_chat', 'deepgram'),
    turn('user', 'Private system instruction.', 'system_instruction', 'deepgram'),
    turn('interviewer', ' ', 'stt'),
    speech, testSpeech, legacySpeech,
  ];
  assert.deepEqual(selectWtaSpeechTurns(mixed), [speech, testSpeech, legacySpeech]);
  assert.equal(mixed.length, 8, 'the selector must not modify session history');
});

test('canonical WTA fails closed when no speech-provenance exists', () => {
  assert.deepEqual(selectWtaSpeechTurns([
    turn('user', 'private manual question', 'manual_chat'),
    turn('assistant', 'private prior assistant', 'assistant'),
    turn('interviewer', 'unattributed transcript', undefined),
  ]), []);
});

test('durable follow-up selects an older spoken turn and rejects typed and assistant decoys', async () => {
  const { SessionTracker } = await import('../../../../dist-electron/electron/SessionTracker.js');
  const { recallLongRangeContext } = await import('../../../../dist-electron/electron/llm/longRangeTranscriptRecall.js');
  const session = new SessionTracker();
  const now = Date.now();
  const entries = [
    { speaker: 'interviewer', text: 'The consumer memory leak came from retained timers.', origin: 'stt' },
    { speaker: 'user', text: 'The consumer memory leak was in TYPED_PRIVATE_DECOY.', origin: 'manual_chat' },
    { speaker: 'assistant', text: 'The consumer memory leak was in ASSISTANT_PRIVATE_DECOY.', origin: 'assistant' },
  ];
  entries.forEach((entry, i) => session.addTranscript({ ...entry, timestamp: now - 240_000 + i, final: true }));
  const turns = selectWtaSpeechTurns(session.getDurableContext());
  const recalled = recallLongRangeContext('What caused the consumer memory leak?', turns, now - 180_000, now);
  assert.deepEqual(recalled.turns?.map(turn => turn.text), [entries[0].text]);
  assert.doesNotMatch(recalled.block, /PRIVATE_DECOY/);
});
