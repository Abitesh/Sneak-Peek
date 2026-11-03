import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const credentials = fs.readFileSync(path.resolve(here, '../CredentialsManager.ts'), 'utf8');
const ipc = fs.readFileSync(path.resolve(here, '../../ipcHandlers.ts'), 'utf8');
const settings = fs.readFileSync(path.resolve(here, '../../../src/components/settings/AIProvidersSettings.tsx'), 'utf8');

const providerSetters = [
  'setGeminiApiKey', 'setGroqApiKey', 'setOpenaiApiKey',
  'setClaudeApiKey', 'setDeepseekApiKey', 'setNvidiaNimApiKey',
];

test('cloud provider key setters return boolean persistence acknowledgements', () => {
  for (const setter of providerSetters) {
    const start = credentials.indexOf(`public ${setter}(`);
    assert.ok(start >= 0, `${setter} exists`);
    const end = credentials.indexOf('\n    public ', start + 1);
    const body = credentials.slice(start, end > start ? end : start + 800);
    assert.match(body, /:\s*boolean\s*\{/,
      `${setter} must return whether durable credential storage succeeded`);
    assert.match(body, /return this\.setCloudApiKey\(/,
      `${setter} must use the rollback-capable persistence helper`);
  }
  assert.match(credentials, /if \(!persisted\) this\.credentials\[field\] = previous;/,
    'failed disk writes must roll the in-memory cloud key back');
});

test('Settings IPC does not report success before credential persistence succeeds', () => {
  for (const label of ['Gemini', 'Groq', 'OpenAI', 'Claude', 'DeepSeek', 'NVIDIA NIM']) {
    assert.match(ipc, new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} API key could not be saved to credential storage`));
  }
  assert.match(ipc, /const persisted = cm\.setLitellmConfig\(/);
  assert.match(ipc, /LiteLLM configuration could not be saved to credential storage/);
});

test('provider settings surfaces a failed save instead of showing Saved', () => {
  assert.match(settings, /result\?\.error \|\| t\('The API key could not be saved/);
  assert.match(settings, /setSavedStatus\(prev => \(\{ \.\.\.prev, \[provider\]: false \}\)\)/);
});
