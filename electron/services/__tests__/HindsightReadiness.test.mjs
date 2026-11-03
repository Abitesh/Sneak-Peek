import test from 'node:test';
import assert from 'node:assert/strict';
import { HindsightManager } from '../../../dist-electron/electron/services/HindsightManager.js';
import { probeHindsightMemory } from '../../../dist-electron/electron/intelligence/memory/HindsightMemoryProbe.js';

test('HTTP 200 alone does not establish database or memory readiness', async () => {
  const before = globalThis.fetch;
  const previousUrl = process.env.HINDSIGHT_BASE_URL;
  process.env.HINDSIGHT_BASE_URL = 'http://127.0.0.1:18888';
  const manager = HindsightManager.getInstance();
  try {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ status: 'healthy' }) });
    assert.equal(await manager.healthCheck(), false);
    assert.equal(manager.getReadiness().httpHealthy, true);
    assert.equal(manager.getReadiness().databaseReady, false);
    assert.equal(manager.getReadiness().memoryReady, false);
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ status: 'healthy', database: 'connected' }) });
    assert.equal(await manager.healthCheck(), true);
    assert.equal(manager.getReadiness().state, 'DATABASE_READY');
    assert.equal(manager.getReadiness().llmReady, null);
    assert.equal(manager.getReadiness().memoryReady, false);
  } finally {
    globalThis.fetch = before;
    if (previousUrl === undefined) delete process.env.HINDSIGHT_BASE_URL; else process.env.HINDSIGHT_BASE_URL = previousUrl;
  }
});

test('explicit retain/recall probe uses and cleans only a unique diagnostic bank', async () => {
  let stored;
  let bank;
  let deleted;
  const result = await probeHindsightMemory({
    async retain(id, text) { bank = id; stored = text; },
    async recall(id) { assert.equal(id, bank); return { results: [{ text: stored }] }; },
    async deleteBank(id) { deleted = id; },
  });
  assert.match(bank, /^sneak-peek-diagnostic-[a-f0-9-]+$/);
  assert.equal(deleted, bank);
  assert.deepEqual(result, { retained: true, recalled: true, cleanedUp: true, memoryReady: true });
});
test('provider or database failure leaves memory degraded', async () => {
  const result = await probeHindsightMemory({ async retain() { throw new Error('unavailable'); }, async recall() { throw new Error('must not run'); } });
  assert.equal(result.retained, false);
  assert.equal(result.memoryReady, false);
});
