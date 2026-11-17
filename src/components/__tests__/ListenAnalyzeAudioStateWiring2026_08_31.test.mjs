// Sprint S8 (Problems 15-17, 41-44, 47-48): Listen/Analyze + audio states +
// non-blocking UI. Source-inspection tests — verifies the wiring described in
// the plan without needing a full Electron/React render harness (the rest of
// this file's neighbors follow the same pattern, e.g.
// SneakPeekInterfaceStreamingMathWiring2026_08_07.test.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sneakPeekInterfaceSource = fs.readFileSync(path.resolve(here, '../SneakPeekInterface.tsx'), 'utf8');
const topControlBarSource = fs.readFileSync(path.resolve(here, '../TopControlBar.tsx'), 'utf8');

const mainSource = fs.readFileSync(path.resolve(here, '../../../electron/main.ts'), 'utf8');
const ipcSource = fs.readFileSync(path.resolve(here, '../../../electron/ipcHandlers.ts'), 'utf8');

test('Listen expands the overlay and starts both audio channels under one request id', () => {
  assert.match(sneakPeekInterfaceSource, /activeListenIdRef.current = id;[\s\S]*clearListenTranscript\(\);[\s\S]*setIsExpanded\(true\);[\s\S]*getMeetingActive\(\)[\s\S]*startListen\(id,/);
  assert.match(mainSource, /captureChannel\('user', this.microphoneCapture\)/);
  assert.match(mainSource, /captureChannel\('interviewer', this.systemAudioCapture\)/);
});

test('Analyze only uses the current turn result and excludes rolling context', () => {
  assert.doesNotMatch(sneakPeekInterfaceSource, /getListenWindowTranscript|listenStartedAtRef/);
  assert.match(sneakPeekInterfaceSource, /onListenTranscript[\s\S]*if \(transcript.id !== activeListenIdRef.current\) return/);
  assert.match(sneakPeekInterfaceSource, /const transcript = await window.electronAPI.analyzeListen\(id\);[\s\S]*if \(activeListenIdRef.current !== id\) return;/);
  assert.match(sneakPeekInterfaceSource, /Interviewer: \$\{transcript.interviewer\}/);
  assert.match(sneakPeekInterfaceSource, /\{ skipRollingContext: true \}/);
  assert.match(ipcSource, /if \(options\?\.skipRollingContext\) return undefined/);
  assert.match(ipcSource, /if \(!context && !options\?\.skipRollingContext\)/);
});

test('TopControlBar exposes separate Listen and Analyze actions; Answer stays handleWhatToSay', () => {
  assert.match(
    topControlBarSource,
    /onListen:\s*\(\)\s*=>\s*void;[\s\S]*?onAnalyze:\s*\(\)\s*=>\s*void;/,
    'BUG: TopControlBar must declare distinct onListen and onAnalyze props.',
  );
  assert.match(sneakPeekInterfaceSource, /onListen=\{\(\) => handleStartListening\(\)\}/);
  assert.match(sneakPeekInterfaceSource, /onAnalyze=\{\(\) => void handleAnalyzeNow\(\)\}/);
  assert.match(sneakPeekInterfaceSource, /onAnswer=\{\(\) => void handleWhatToSay\(\)\}/);
});

test('Stop cancels its Listen turn and Analyze finalizes its own recognizers', () => {
  assert.match(sneakPeekInterfaceSource, /const handleStopListening[\s\S]*activeListenIdRef.current = null;[\s\S]*stopListen\(id\)/);
  assert.match(sneakPeekInterfaceSource, /const handleAnalyzeNow[\s\S]*setIsManualRecording\(false\);[\s\S]*analyzeListen\(id\)/);
  assert.match(mainSource, /public async analyzeListen[\s\S]*session.owner !== owner \|\| session.id !== id[\s\S]*await session.finish\(\)/);
});

test('the legacy combined toggle (hotkey / phone-bridge / quick-action chip) still dispatches to Listen/Analyze', () => {
  assert.match(
    sneakPeekInterfaceSource,
    /const handleAnswerNow = async \(\) => \{\s*if \(isManualRecording\) \{\s*await handleAnalyzeNow\(\);\s*\} else \{\s*handleStartListening\(\);\s*\}\s*\};/,
  );
});

test('a visible Listen->Analyze audio state machine exists with the four in-session states', () => {
  for (const state of ['listening', 'speaking', 'transcribing', 'processing']) {
    assert.match(
      sneakPeekInterfaceSource,
      new RegExp(`setAudioSessionState\\([^;]*['"\`]${state}['"\`]`),
      `BUG: missing a transition into audio state "${state}".`,
    );
  }
});

test('the live transcript / audio-state indicator renders independently of showAnswerPanel', () => {
  const indicatorIdx = sneakPeekInterfaceSource.indexOf("audioSessionState !== 'idle' && (");
  const panelIdx = sneakPeekInterfaceSource.indexOf('{showAnswerPanel && (');
  assert.ok(indicatorIdx > -1, 'BUG: expected an audioSessionState-gated indicator block.');
  assert.ok(panelIdx > -1, 'BUG: expected the showAnswerPanel-gated chat history block.');
  assert.ok(
    indicatorIdx < panelIdx,
    'BUG: the live-transcript/audio-state indicator must be a sibling rendered BEFORE (i.e. outside) the showAnswerPanel gate, not nested inside it — otherwise it disappears whenever showAnswerPanel is momentarily false during the Listen->Analyze handoff.',
  );
});

test('TopControlBar is a collapsible, non-blocking overlay (Problem 48)', () => {
  assert.match(topControlBarSource, /collapsedKey = 'natively_top_control_bar_collapsed'/);
  assert.match(topControlBarSource, /const \[collapsed, setCollapsed\] = useState/);
  assert.match(topControlBarSource, /toggleCollapsed/);
});

function extractBraceBody(source, marker) {
  const idx = source.indexOf(marker);
  assert.ok(idx >= 0, `could not locate ${marker}`);
  let i = idx + marker.length;
  let depth = 1;
  const start = i;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  assert.equal(depth, 0, `unbalanced braces after ${marker}`);
  return source.slice(start, i - 1);
}

const handleStartListeningBody = extractBraceBody(
  sneakPeekInterfaceSource,
  'const handleStartListening = () => {',
);
const onSessionResetBody = extractBraceBody(
  sneakPeekInterfaceSource,
  'onSessionReset(() => {',
);

test('Listen preserves arming across the session-reset Listen itself caused', () => {
  assert.match(
    sneakPeekInterfaceSource,
    /preserveListenOnResetRef\s*=\s*useRef\(/,
    'BUG: a one-shot preserveListenOnResetRef must exist so Listen-triggered startMeeting does not disarm the You-channel gate.',
  );
  assert.match(
    handleStartListeningBody,
    /if\s*\(\s*!active\s*\)\s*\{[\s\S]*preserveListenOnResetRef\.current\s*=\s*true[\s\S]*startMeeting\(/,
    'BUG: before startMeeting() from Listen, set preserveListenOnResetRef so the coming session-reset does not clear isRecordingRef.',
  );
  assert.match(
    onSessionResetBody,
    /resetChatState\(\)/,
    'BUG: onSessionReset must still run resetChatState() (messages + width collapse stay required).',
  );
  assert.match(
    onSessionResetBody,
    /preserveListenOnResetRef/,
    'BUG: onSessionReset must consume preserveListenOnResetRef.',
  );
  assert.match(
    onSessionResetBody,
    /isRecordingRef\.current\s*=\s*false/,
    'BUG: launcher startMeeting / endMeeting must still clear isRecordingRef when preserve is unset.',
  );
  assert.match(
    onSessionResetBody,
    /setIsManualRecording\(\s*false\s*\)/,
    'BUG: launcher startMeeting / endMeeting must still clear isManualRecording when preserve is unset.',
  );
  assert.doesNotMatch(
    onSessionResetBody,
    /resetChatState\(\);\s*isRecordingRef\.current\s*=\s*false/,
    'BUG: isRecordingRef must not be cleared unconditionally after resetChatState — Listen-triggered session-reset has to keep the push-to-talk gate armed.',
  );
});

test('Listen starts without artificial delay and reports real start failures', () => {
  assert.doesNotMatch(handleStartListeningBody, /setTimeout\([^,]+,\s*400\s*\)/);
  assert.match(handleStartListeningBody, /if \(status.message[\s\S]*setListenStatus\(status.message\)/);
  assert.match(handleStartListeningBody, /if \(!status.ok\) handleStopListening\(\)/);
  assert.match(handleStartListeningBody, /catch \{[\s\S]*preserveListenOnResetRef.current = false;[\s\S]*handleStopListening\(\)/);
});
