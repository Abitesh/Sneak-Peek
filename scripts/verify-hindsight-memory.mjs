// Explicit live diagnostic; invokes the configured provider and may incur charges.
import { HindsightClient } from '@vectorize-io/hindsight-client';
import { probeHindsightMemory } from '../dist-electron/electron/intelligence/memory/HindsightMemoryProbe.js';

if (process.env.HINDSIGHT_LIVE_TEST !== '1') {
  console.error('Not run: set HINDSIGHT_LIVE_TEST=1 to authorize an isolated retain/recall diagnostic.');
  process.exitCode = 2;
} else {
  const client = new HindsightClient({ baseUrl: process.env.HINDSIGHT_BASE_URL || 'http://127.0.0.1:8888', apiKey: process.env.HINDSIGHT_API_KEY });
  const result = await probeHindsightMemory(client);
  console.log(JSON.stringify(result));
  process.exitCode = result.memoryReady ? 0 : 1;
}
