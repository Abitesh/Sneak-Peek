// Source-contract: Listen audio init must wait for deferred meeting capture,
// report startCaptureChannels success (not object presence), and flip
// _listenAudioActive so later resume/recovery/reconfigure actually start().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainSource = readFileSync(path.resolve(__dirname, '../../../electron/main.ts'), 'utf8');

function sliceUntilNextMethod(startMarker, nextMarker) {
  const start = mainSource.indexOf(startMarker);
  assert.ok(start >= 0, `could not locate ${startMarker}`);
  const end = mainSource.indexOf(nextMarker, start + startMarker.length);
  assert.ok(end >= 0, `could not locate ${nextMarker} after ${startMarker}`);
  return mainSource.slice(start, end);
}

function extractMethodBody(methodName) {
  const methodRe = new RegExp(
    `(?:public|private|protected)\\s+(?:async\\s+)?${methodName}\\s*\\([^)]*\\)\\s*(?::\\s*[^{;=]*(?:\\{[^{}]*\\}\\s*)?)?\\s*\\{`,
  );
  const match = methodRe.exec(mainSource);
  assert.ok(match, `could not locate ${methodName}`);
  let i = match.index + match[0].length;
  let depth = 1;
  const start = i;
  while (i < mainSource.length && depth > 0) {
    const ch = mainSource[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  assert.equal(depth, 0, `unbalanced braces while extracting ${methodName}`);
  return mainSource.slice(start, i - 1);
}

const listenBody = sliceUntilNextMethod('public async startListen(', 'public async analyzeListen(');
const startMeetingBody = extractMethodBody('startMeetingTransition');

test('ordinary Listen waits for in-flight setup and rechecks ownership before opening capture', () => {
  const wait = listenBody.indexOf('await this._audioInitPromise');
  const setup = listenBody.indexOf('await this.setupSystemAudioPipeline(true, isCurrent)');
  assert.ok(wait >= 0 && setup > wait);
  assert.match(listenBody.slice(wait, setup), /if \(!isCurrent\(\)\) return fail/);
  assert.match(listenBody.slice(setup), /if \(!isCurrent\(\)\) return fail/);
});

test('Listen reports success from channel starts and recognizer readiness', () => {
  assert.match(listenBody, /capture.start\(\)[\s\S]*session.add\(speaker, stt, rate\)/);
  assert.match(listenBody, /mic = captureChannel\('user', this.microphoneCapture\)/);
  assert.match(listenBody, /system = captureChannel\('interviewer', this.systemAudioCapture\)/);
  assert.match(listenBody, /if \(!mic && !system\) return fail/);
  assert.match(listenBody, /this._listenAudioActive = true;[\s\S]*return \{ ok: true, mic, system/);
});

test('startMeeting sets _listenAudioActive true after capture start, not on Ambient Chat skip', () => {
  const captureIdx = startMeetingBody.indexOf("startCaptureChannels('startMeeting', false)");
  assert.ok(captureIdx >= 0, 'sanity: startMeeting deferred init must call startCaptureChannels.');
  const after = startMeetingBody.slice(captureIdx);
  const flagIdx = after.search(/this\._listenAudioActive\s*=\s*true/);
  assert.ok(
    flagIdx >= 0,
    'BUG: after startMeeting startCaptureChannels, set _listenAudioActive = true (today the flag is only ever cleared).',
  );
  const ambientSkipIdx = after.indexOf('Ambient AI Chat enabled — skipping');
  assert.ok(
    ambientSkipIdx < 0 || flagIdx < ambientSkipIdx,
    'BUG: _listenAudioActive = true belongs in the capture-start branch, not after the Ambient AI Chat skip.',
  );
});
