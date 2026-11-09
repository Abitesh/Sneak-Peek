// WORK-0038: the foreground company-search boundary must not hang or cache late data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const { searchCompanyInfo, CompanyResearchEngine } = await import(pathToFileURL(path.join(root,
  'dist-electron/premium/electron/knowledge/CompanyResearchEngine.js')).href);

test('hung provider has a hard deadline, receives cancellation, and returns no dossier', async () => {
  let providerSignal;
  const provider = { search: (_q, opts) => {
    providerSignal = opts.signal;
    return new Promise(() => {});
  }};
  const before = Date.now();
  assert.equal(await searchCompanyInfo('Acme', provider, { timeoutMs: 25 }), null);
  assert.ok(Date.now() - before < 1500, 'the foreground caller must not hang');
  assert.equal(providerSignal?.aborted, true, 'provider must receive an aborted signal');
});

test('caller STOP prevents provider work and late results are ignored', async () => {
  const controller = new AbortController();
  let resolveSearch;
  const provider = { search: () => new Promise(resolve => { resolveSearch = resolve; }) };
  const engine = new CompanyResearchEngine();
  const pending = engine.research('Acme', provider, true, { signal: controller.signal, timeoutMs: 1000 });
  await new Promise(resolve => setImmediate(resolve));
  controller.abort();
  assert.equal(await pending, null);
  resolveSearch([{ text: 'Do not cache a canceled result', url: 'https://example.test' }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(engine.getCached('Acme'), undefined);
  const alreadyStopped = new AbortController();
  alreadyStopped.abort();
  assert.equal(await searchCompanyInfo('Acme', { search: () => { throw Error('should not execute'); } },
    { signal: alreadyStopped.signal }), null);
});

test('provider results completed before deadline keep concrete source provenance', async () => {
  const value = await searchCompanyInfo('Acme', { search: async () => [
    { text: 'Acme builds technology with Redis', url: 'https://example.test/acme' },
  ]}, { timeoutMs: 200 });
  assert.equal(value?.research.technologies?.includes('redis'), true);
  assert.deepEqual(value?.sources, ['https://example.test/acme']);
  assert.equal(await searchCompanyInfo('Acme', { search: async () => [{ text: 'unsourced claim' }] }), null);
});
