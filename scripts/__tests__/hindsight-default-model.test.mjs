import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve(process.cwd(), 'scripts/hindsight-dev-server.py');
const serverSource = fs.readFileSync(serverPath, 'utf8');
const startPath = path.resolve(process.cwd(), 'scripts/hindsight-start.sh');
const startSource = fs.readFileSync(startPath, 'utf8');

test('hindsight direct fallback defaults to the current Gemini Flash-Lite model', () => {
  assert.match(serverSource, /gemini-3\.1-flash-lite/,
    'The direct non-router fallback should not use the retired Gemini 2.5 baseline.');
});

test('router config activates Hindsight litellmrouter provider and default logical model', () => {
  assert.match(startSource, /export HINDSIGHT_API_LLM_PROVIDER=litellmrouter/,
    'Building a router config must also select Hindsight\'s litellmrouter provider.');
  assert.match(startSource, /export HINDSIGHT_API_LLM_MODEL=default/,
    'Hindsight routes completions through logical model_name default.');
  assert.match(serverSource, /HINDSIGHT_API_LLM_PROVIDER/,
    'The embedded server must honor Hindsight\'s canonical provider env variable.');
  assert.match(serverSource, /HINDSIGHT_API_LLM_MODEL/,
    'The embedded server must honor Hindsight\'s canonical model env variable.');
});

test('router mode can start without a single global scalar provider key', () => {
  assert.match(serverSource, /if not API_KEY and not ROUTER_CONFIG:/,
    'A Router config can carry provider-specific credentials even when no one global API key is selected.');
  assert.match(serverSource, /SERVER_API_KEY = API_KEY or "router-managed"/,
    'The generic constructor key should use a non-secret sentinel only in router-managed mode.');
});
