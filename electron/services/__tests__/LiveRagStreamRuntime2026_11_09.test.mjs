// Live-RAG errors must not produce both a terminal renderer event and a chat fallback.
// Exercise the actual transport function, not only its source text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { streamRagEngineAnswer } = await import(pathToFileURL(path.join(root,
  'dist-electron/electron/intelligence/engine/RagIpcStream.js')).href);

function failingEngine() {
  return {
    prepareAndStream() {
      return {
        lifecycle: { state: 'FAILED' },
        stream: (async function* () { throw new Error('offline_provider'); })(),
        result: Promise.resolve({ providerAttempt: { error: 'offline_provider' } }),
      };
    },
  };
}

function request() {
  return { cancellationSignal: new AbortController().signal };
}

for (const [surface, meta, expected] of [
  ['live', { live: true }, false],
  ['meeting', { meetingId: 'meeting-test' }, true],
  ['global', { global: true }, true],
]) {
  test(`${surface} failed RAG stream ${expected ? 'sends terminal error' : 'returns fallback without terminal event'}`, async () => {
    const sent = [];
    const settled = [];
    const result = await streamRagEngineAnswer({
      engine: failingEngine(), request: request(), meta,
      isCurrent: () => true,
      send: (channel, payload) => sent.push({ channel, payload }),
      settle: (...args) => settled.push(args),
      stallTimeoutMs: 100,
    });
    assert.equal(result.success, false);
    assert.equal(result.fallback === true, !expected);
    assert.equal(sent.filter(x => x.channel === 'rag:stream-error').length, expected ? 1 : 0);
    assert.deepEqual(settled.map(x => x[0]), ['failed']);
  });
}
