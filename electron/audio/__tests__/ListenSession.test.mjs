import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ListenSession, RecentListenTranscript } = require('../../../dist-electron/electron/audio/ListenSession.js');
const rate = 16_000;
const pcm = (count, value) => {
  const buffer = Buffer.alloc(count * 2);
  for (let i = 0; i < count; i++) buffer.writeInt16LE(value, i * 2);
  return buffer;
};
const recognizer = () => ({
  writes: [], started: 0, cancelled: 0, finalized: 0, rates: [],
  start() { this.started++; },
  cancel() { this.cancelled++; },
  stop() { throw new Error('Cancel must discard, not flush'); },
  setSampleRate(hz) { this.rates.push(hz); },
  write(buffer) { this.writes.push(buffer); },
  finalize() { this.finalized++; },
});

test('Listen takes a bounded, recent two-speaker window, with latest partials and no repeated handoff', async () => {
  const recent = new RecentListenTranscript();
  recent.add({ speaker: 'user', text: 'too old', final: true }, 1000);
  recent.add({ speaker: 'interviewer', text: 'How does this', final: false }, 9000);
  recent.add({ speaker: 'interviewer', text: 'How does this queue work?', final: true }, 9600);
  recent.add({ speaker: 'user', text: 'One example', final: false }, 10_000);
  const seed = recent.take(10_200);
  assert.deepEqual(seed, { user: 'One example', interviewer: 'How does this queue work?' });
  assert.deepEqual(recent.take(10_200), { user: '', interviewer: '' });
  const session = new ListenSession('new', 5, () => {}, seed);
  session.add('user', recognizer(), rate);
  session.accept({ speaker: 'user', text: 'One example please', final: true });
  assert.deepEqual(await session.finish(), { user: 'One example please', interviewer: 'How does this queue work?' });
});

test('clearing on Stop or meeting reset drops all captions from the next turn', () => {
  const recent = new RecentListenTranscript();
  recent.add({ speaker: 'interviewer', text: 'previous turn', final: true }, 1000);
  recent.clear();
  recent.add({ speaker: 'interviewer', text: 'new question', final: true }, 1005);
  assert.deepEqual(recent.take(1010), { user: '', interviewer: 'new question' });
});

test('direct Listen only writes its own live PCM and silence does not fabricate text', async () => {
  const results = [];
  const session = new ListenSession('listen-no-pre', 5, e => results.push(e));
  const mic = recognizer();
  session.add('user', mic, rate);
  const zeros = pcm(320, 0);
  session.write('user', zeros, rate);
  assert.deepEqual(mic.writes, [zeros]);
  assert.deepEqual(await session.finish(2), { user: '', interviewer: '' });
  assert.deepEqual(results, []);
  assert.equal(mic.finalized, 1);
  assert.equal(mic.cancelled, 1);
});

test('STOP cancels a pending Analyze and excludes old callbacks during the next Listen', async () => {
  const seen = [];
  const old = new ListenSession('old', 5, e => seen.push(e.text));
  const mic = recognizer();
  old.add('user', mic, rate);
  old.write('user', pcm(40, 3), rate);
  const drain = old.finish();
  old.cancel();
  const next = new ListenSession('next', 5, e => seen.push(e.text));
  next.add('user', recognizer(), rate);
  old.accept({ speaker: 'user', text: 'obsolete partial', final: false });
  old.accept({ speaker: 'user', text: 'obsolete final', final: true });
  next.accept({ speaker: 'user', text: 'fresh words', final: true });
  assert.equal(await drain, null);
  assert.deepEqual(await next.finish(), { user: 'fresh words', interviewer: '' });
  assert.deepEqual(seen, ['fresh words']);
  assert.equal(mic.cancelled, 1);
  assert.equal(mic.finalized, 1);
});

test('rapid cycles cancel without finalizing and accept only live partial/final audio for each speaker', async () => {
  let deliveries = 0;
  for (let i = 0; i < 30; i++) {
    const session = new ListenSession(String(i), 5, () => deliveries++);
    const mic = recognizer();
    session.add('user', mic, rate);
    session.write('user', pcm(320, 15), rate);
    session.cancel();
    session.cancel();
    session.accept({ speaker: 'user', text: 'late', final: true });
    assert.equal(mic.finalized, 0);
    assert.equal(mic.cancelled, 1);
    assert.equal(await session.finish(), null);
  }
  assert.equal(deliveries, 0);
});

test('Analyze accepts final events after capture stops, including mic and interviewer and a rate change', async () => {
  const session = new ListenSession('final', 5, () => {});
  const mic = recognizer(), system = recognizer();
  session.add('user', mic, rate);
  session.add('interviewer', system, rate);
  session.write('user', pcm(320, 22), 48_000);
  session.write('interviewer', pcm(320, 31), rate);
  session.accept({ speaker: 'user', text: 'current partial', final: false });
  const done = session.finish();
  session.write('user', pcm(320, 19), rate);
  session.accept({ speaker: 'user', text: 'current partial, finalized', final: true });
  session.accept({ speaker: 'interviewer', text: 'system final', final: true });
  assert.deepEqual(await done, { user: 'current partial, finalized', interviewer: 'system final' });
  assert.deepEqual(mic.rates, [rate, 48_000]);
  assert.equal(mic.writes.length, 1);
  assert.equal(system.finalized, 1);
});

test('transcription deadline returns only partial text owned by that turn', async () => {
  const session = new ListenSession('deadline', 5, () => {});
  const mic = recognizer();
  session.add('user', mic, rate);
  session.write('user', pcm(320, 15), rate);
  session.accept({ speaker: 'user', text: 'this turn only', final: false });
  assert.deepEqual(await session.finish(2), { user: 'this turn only', interviewer: '' });
  assert.equal(mic.cancelled, 1);
});
