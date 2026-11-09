/**
 * Fast local-only asset preflight for the OPTIONAL BGE cross-encoder.
 * HuggingFace/Git-LFS pointers can exist on disk under valid filenames;
 * checking only existsSync made every live chat wait for a failing model load.
 * This never reads or changes user documents, downloads a model or modifies
 * the cache. It checks only a small header from each model asset.
 */
import fs from 'fs';
import path from 'path';

export interface RerankerAssetState {
  ready: boolean;
  reason?: string;
}

function isModelAsset(pathname: string, kind: 'json' | 'onnx'): boolean {
  let fd: number | undefined;
  try {
    const stat = fs.statSync(pathname);
    // A real quantized BGE model is hundreds of MB, not a 130-byte Git LFS
    // pointer. Do not require the exact model size or checksum here.
    if (!stat.isFile() || stat.size < (kind === 'onnx' ? 1024 : 2)) return false;
    fd = fs.openSync(pathname, 'r');
    const sample = Buffer.alloc(256);
    const n = fs.readSync(fd, sample, 0, sample.length, 0);
    const header = sample.subarray(0, n).toString('utf8').trimStart();
    if (header.startsWith('version https://git-lfs.github.com/spec/')) return false;
    if (kind === 'json' && !header.startsWith('{')) return false;
    return true;
  } catch {
    return false;
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch { /* no-op */ }
  }
}

export function inspectRerankerAssets(
  modelRoot: string,
  modelId: string,
  dtype: string = 'q8',
): RerankerAssetState {
  const modelDir = path.join(modelRoot, ...modelId.split('/'));
  if (!isModelAsset(path.join(modelDir, 'tokenizer.json'), 'json')) {
    return { ready: false, reason: 'missing/invalid tokenizer.json (possibly a Git LFS pointer)' };
  }
  if (!isModelAsset(path.join(modelDir, 'config.json'), 'json')) {
    return { ready: false, reason: 'missing/invalid config.json (possibly a Git LFS pointer)' };
  }
  // Some transformers.js layouts omit this optional file. If it exists,
  // never hand a Git-LFS placeholder to the tokenizer loader.
  const tokenizerConfig = path.join(modelDir, 'tokenizer_config.json');
  if (fs.existsSync(tokenizerConfig) && !isModelAsset(tokenizerConfig, 'json')) {
    return { ready: false, reason: 'invalid tokenizer_config.json (possibly a Git LFS pointer)' };
  }
  const onnxCandidates = dtype === 'q8'
    ? ['model_quantized.onnx', 'model.onnx']
    : ['model.onnx'];
  if (!onnxCandidates.some((file) => isModelAsset(path.join(modelDir, 'onnx', file), 'onnx'))) {
    return { ready: false, reason: 'missing/invalid ONNX model (possibly a Git LFS pointer)' };
  }
  return { ready: true };
}
