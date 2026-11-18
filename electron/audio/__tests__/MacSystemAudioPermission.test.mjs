import assert from 'node:assert/strict';
import { test } from 'node:test';
import { needsScreenRecordingForSystemAudio, shouldAvoidScreenKitForSystemAudio } from '../macSystemAudioPermission.mjs';

test('on modern macOS, screen denial cannot block an eligible Core Audio system tap', () => {
  assert.equal(needsScreenRecordingForSystemAudio('25.4.0', 'BlackHole'), false);
  assert.equal(needsScreenRecordingForSystemAudio('23.4.0'), false);
});

test('explicit ScreenCaptureKit and pre-14.4 Macs still require screen access', () => {
  assert.equal(needsScreenRecordingForSystemAudio('25.4.0', 'sck'), true);
  assert.equal(needsScreenRecordingForSystemAudio('23.3.0'), true);
  assert.equal(needsScreenRecordingForSystemAudio('22.6.0'), true);
});

test('modern automatic mode avoids ScreenCaptureKit prompts when its grant is unavailable', () => {
  assert.equal(shouldAvoidScreenKitForSystemAudio('25.4.0', 'BlackHole16ch_UID', 'denied'), true);
  assert.equal(shouldAvoidScreenKitForSystemAudio('25.4.0', 'default', 'not-determined'), true);
  assert.equal(shouldAvoidScreenKitForSystemAudio('25.4.0', 'default', 'granted'), false);
  assert.equal(shouldAvoidScreenKitForSystemAudio('25.4.0', 'sck', 'denied'), false);
  assert.equal(shouldAvoidScreenKitForSystemAudio('23.3.0', 'default', 'denied'), false);
});
