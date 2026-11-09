// WORK-0030 / STAB-001 — optional BGE must never block a real chat request.
// Uses the compiled production helpers; no ONNX model, network or user files.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const load = async (rel) => import(pathToFileURL(path.join(root, 'dist-electron/electron/rag', rel)).href);
const { withOptionalRerankDeadline } = await load('OptionalRerankDeadline.js');
const { inspectRerankerAssets } = await load('RerankerAssetPreflight.js');

test('optional rerank returns its real result within deadline', async () => {
  const result = await withOptionalRerankDeadline(async () => ['authorized-hit'], { budgetMs: 80 });
  assert.deepEqual(result, { status: 'completed', value: ['authorized-hit'] });
});

test('hung cold ONNX/model load is bounded; late results are ignored', async () => {
  let finish;
  const operation = new Promise((resolve) => { finish = resolve; });
  const start = Date.now();
  const outcome = await withOptionalRerankDeadline(() => operation, { budgetMs: 25 });
  assert.equal(outcome.status, 'timeout');
  assert.ok(Date.now() - start < 1000, 'must not wait for the unresolved model load');
  finish(['late-cross-window-result']);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(outcome.status, 'timeout', 'late result must never change the result returned to the engine');
});

test('STOP cancels optional rerank immediately without requiring the worker to finish', async () => {
  const controller = new AbortController();
  const p = withOptionalRerankDeadline(() => new Promise(() => {}), {
    signal: controller.signal,
    budgetMs: 3000,
  });
  controller.abort();
  assert.deepEqual(await p, { status: 'cancelled' });
  let invoked = false;
  const before = await withOptionalRerankDeadline(async () => { invoked = true; return true; }, {
    signal: controller.signal,
  });
  assert.equal(before.status, 'cancelled');
  assert.equal(invoked, false);
});

test('worker error is propagated when it occurs before deadline', async () => {
  await assert.rejects(
    () => withOptionalRerankDeadline(async () => { throw new Error('local model init failure'); }, { budgetMs: 100 }),
    /local model init failure/,
  );
});

test('valid local model footprint is accepted without ever loading ONNX', (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reranker-preflight-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const dir = path.join(tmp, 'Xenova', 'bge-reranker-base');
  fs.mkdirSync(path.join(dir, 'onnx'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'tokenizer.json'), '{"model":"synthetic"}');
  fs.writeFileSync(path.join(dir, 'config.json'), '{"model_type":"synthetic"}');
  fs.writeFileSync(path.join(dir, 'onnx', 'model_quantized.onnx'), Buffer.alloc(2048, 0x08));
  assert.deepEqual(inspectRerankerAssets(tmp, 'Xenova/bge-reranker-base'), { ready: true });
});

test('Git LFS pointer masquerading as tokenizer/config/ONNX is NOT a usable reranker', (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reranker-lfs-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const dir = path.join(tmp, 'Xenova', 'bge-reranker-base');
  fs.mkdirSync(path.join(dir, 'onnx'), { recursive: true });
  const pointer = 'version https://git-lfs.github.com/spec/v1\noid sha256:deadbeef\nsize 12345\n';
  fs.writeFileSync(path.join(dir, 'tokenizer.json'), pointer);
  fs.writeFileSync(path.join(dir, 'config.json'), '{}');
  fs.writeFileSync(path.join(dir, 'onnx', 'model_quantized.onnx'), Buffer.alloc(2048, 0x08));
  assert.match(inspectRerankerAssets(tmp, 'Xenova/bge-reranker-base').reason, /tokenizer/);
  fs.writeFileSync(path.join(dir, 'tokenizer.json'), '{}');
  fs.writeFileSync(path.join(dir, 'config.json'), pointer);
  assert.match(inspectRerankerAssets(tmp, 'Xenova/bge-reranker-base').reason, /config/);
  fs.writeFileSync(path.join(dir, 'config.json'), '{}');
  fs.writeFileSync(path.join(dir, 'tokenizer_config.json'), pointer);
  assert.match(inspectRerankerAssets(tmp, 'Xenova/bge-reranker-base').reason, /tokenizer_config/);
  fs.writeFileSync(path.join(dir, 'tokenizer_config.json'), '{}');
  fs.writeFileSync(path.join(dir, 'onnx', 'model_quantized.onnx'), pointer);
  assert.match(inspectRerankerAssets(tmp, 'Xenova/bge-reranker-base').reason, /ONNX/);
});

test('both active retrieval layers bound optional BGE without bypassing evidence authority', () => {
  const manager = fs.readFileSync(path.join(root, 'electron/rag/RAGManager.ts'), 'utf8');
  const retriever = fs.readFileSync(path.join(root, 'electron/rag/RAGRetriever.ts'), 'utf8');
  const local = fs.readFileSync(path.join(root, 'electron/rag/LocalReranker.ts'), 'utf8');
  assert.match(manager, /withOptionalRerankDeadline\(async/);
  assert.match(retriever, /withOptionalRerankDeadline\(async/);
  assert.match(manager, /\{ signal \}/);
  assert.match(local, /inspectRerankerAssets/);
  assert.match(local, /this\.loadFailed = true/);
  assert.match(manager, /this\.gateCanonicalResults\(/, 'no rerank failure may bypass the canonical relevance gate');
  assert.doesNotMatch(manager, /if \(forceSingleResult\) throw error;/, 'optional reranker failures must not force a second legacy read');
});
