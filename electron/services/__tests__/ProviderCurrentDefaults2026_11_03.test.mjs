// Guard current operational provider defaults against reintroducing retired model ids.
// Source-level by design: it runs even in a source-only handoff without node_modules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const liveDefaultFiles = [
  'electron/LLMHelper.ts',
  'electron/llm/ProviderRouter.ts',
  'electron/services/ModelVersionManager.ts',
  'electron/services/screen/VisionProviderRegistry.ts',
];

test('live Claude fallbacks use Sonnet 4.6 and not the retired Sonnet 4.0 id', () => {
  for (const file of liveDefaultFiles) {
    const source = read(file);
    assert.doesNotMatch(source, /claude-sonnet-4-20250514/, `${file} must not use retired Sonnet 4.0 as an operational fallback`);
  }
  assert.match(read('electron/LLMHelper.ts'), /const CLAUDE_MODEL = "claude-sonnet-4-6"/);
  assert.match(read('electron/llm/ProviderRouter.ts'), /'claude': 'claude-sonnet-4-6'/);
});

test('persisted old Claude default/preference is compatibility-mapped at read time', () => {
  const source = read('electron/services/CredentialsManager.ts');
  assert.match(source, /defaultModel === 'claude-sonnet-4-20250514'[\s\S]{0,200}return 'claude-sonnet-4-6'/);
  assert.match(source, /provider === 'claude' && stored === 'claude-sonnet-4-20250514'[\s\S]{0,200}return 'claude-sonnet-4-6'/);
});

test('connection probe preference and runtime fallback use Sonnet 4.6', () => {
  const source = read('electron/ipcHandlers.ts');
  assert.match(source, /claude: \['claude-sonnet-4-6'\]/);
  assert.match(source, /modelAvailable\('claude-sonnet-4-6'\) \? 'claude-sonnet-4-6'/);
});
