// Core Audio process taps arrived in macOS 14.4 (Darwin 23.4). They
// request their own System Audio Recording grant from the operating system.
export function needsScreenRecordingForSystemAudio(darwinRelease, outputDeviceId) {
  if (outputDeviceId === 'sck') return true;
  const [major, minor] = darwinRelease.split('.').map(Number);
  return !(major > 23 || (major === 23 && minor >= 4));
}

// On a modern Mac the automatic route can go directly to a process tap
// when ScreenCaptureKit would prompt. Explicit SCK still uses its own grant.
export function shouldAvoidScreenKitForSystemAudio(darwinRelease, outputDeviceId, screenStatus) {
  return screenStatus !== 'granted' && !needsScreenRecordingForSystemAudio(darwinRelease, outputDeviceId);
}
