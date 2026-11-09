import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPath = path.resolve(__dirname, '../../main.ts');
const mainSource = readFileSync(mainPath, 'utf8');

function wireConnectedStatus(stt, sendSttStatus) {
  const sttProvider = 'natively-pro';
  const speaker = 'interviewer';
  let consecutiveErrors = 0;
  let lastState = 'awaiting-audio';

  stt.on('error', (err) => {
    consecutiveErrors++;
    lastState = 'reconnecting';
    sendSttStatus({
      state: 'reconnecting',
      provider: sttProvider,
      error: err.message,
      channel: speaker,
      reconnectAttempts: consecutiveErrors,
    });
  });

  stt.on('connected', () => {
    consecutiveErrors = 0;
    if (lastState !== 'connected') {
      lastState = 'awaiting-audio';
      sendSttStatus({
        state: 'awaiting-audio',
        provider: sttProvider,
        channel: speaker,
      });
    }
  });

  stt.on('transcript', (segment) => {
    if (segment.isFinal) {
      consecutiveErrors = 0;
      if (lastState !== 'connected') {
        lastState = 'connected';
        sendSttStatus({
          state: 'connected',
          provider: sttProvider,
          channel: speaker,
        });
      }
    }
  });
}

function extractBraceBody(source, openBrace) {
  let depth = 1;
  for (let i = openBrace + 1; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(openBrace + 1, i);
  }
  return null;
}

test('production SneakPeekProSTT wiring maps handshake connected to awaiting-audio', () => {
  // Locate the provider-specific branch independent of indentation, and
  // assert on the connected callback itself, not a later 'connected' status
  // legitimately emitted only after a final transcript.
  const branch = /if\s*\(\s*stt\s+instanceof\s+SneakPeekProSTT\s*\)\s*\{/.exec(mainSource);
  assert.ok(branch, 'could not locate SneakPeekProSTT-specific wiring block in main.ts');
  const sneakPeekBlock = extractBraceBody(mainSource, branch.index + branch[0].length - 1);
  assert.ok(sneakPeekBlock, 'SneakPeekProSTT branch must have a complete body');
  const connected = /stt\.on\(\s*['"]connected['"]\s*,\s*\(\s*\)\s*=>\s*\{/.exec(sneakPeekBlock);
  assert.ok(connected, 'SneakPeekProSTT connected handler must exist');
  const connectedBody = extractBraceBody(sneakPeekBlock, connected.index + connected[0].length - 1);
  assert.ok(connectedBody, 'SneakPeekProSTT connected handler must have a complete body');
  assert.ok(/stt\.on\(\s*['"]connected['"]/.test(sneakPeekBlock), 'BUG: main.ts must listen for SneakPeekProSTT connected events.');
  assert.ok(/_consecutiveErrors\s*=\s*0/.test(connectedBody), 'BUG: connected handshake must reset consecutive STT errors.');
  assert.ok(/_lastState\s*=\s*['"]awaiting-audio['"]/.test(connectedBody), 'BUG: connected handshake must enter awaiting-audio, not connected.');
  assert.ok(/state\s*:\s*['"]awaiting-audio['"]/.test(connectedBody), 'BUG: connected handshake must broadcast awaiting-audio.');
  assert.ok(!/state\s*:\s*['"]connected['"]/.test(connectedBody), 'BUG: handshake connected must not broadcast verified connected status.');
});

test('SneakPeekProSTT connected event clears reconnecting status back to awaiting audio without waiting for a final transcript', () => {
  const stt = new EventEmitter();
  const statuses = [];
  wireConnectedStatus(stt, (status) => statuses.push(status));

  stt.emit('error', new Error('WebSocket closed unexpectedly'));
  stt.emit('connected', { provider: 'natively-pro', channel: 'system' });

  assert.deepEqual(statuses.map((status) => status.state), ['reconnecting', 'awaiting-audio']);
  assert.equal(statuses.at(-1)?.reconnectAttempts, undefined);
});

test('SneakPeekProSTT connected event resets consecutive errors for later failures', () => {
  const stt = new EventEmitter();
  const statuses = [];
  wireConnectedStatus(stt, (status) => statuses.push(status));

  stt.emit('error', new Error('first outage'));
  stt.emit('connected', { provider: 'natively-pro', channel: 'system' });
  stt.emit('error', new Error('second outage'));

  assert.deepEqual(statuses.map((status) => status.state), ['reconnecting', 'awaiting-audio', 'reconnecting']);
  assert.equal(statuses.at(-1)?.reconnectAttempts, 1);
});

test('final transcript still marks connected when no handshake event was observed', () => {
  const stt = new EventEmitter();
  const statuses = [];
  wireConnectedStatus(stt, (status) => statuses.push(status));

  stt.emit('error', new Error('first outage'));
  stt.emit('transcript', { text: 'hello', isFinal: true, confidence: 1 });

  assert.deepEqual(statuses.map((status) => status.state), ['reconnecting', 'connected']);
});
