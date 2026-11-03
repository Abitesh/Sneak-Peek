import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const script = path.resolve('scripts/hindsight-dev-server.py');
function config(extra = {}) {
  const code = `import sys,types,runpy,json
class Server:
 def __init__(self, **kwargs):
  print('CONFIG:'+json.dumps({k:v for k,v in kwargs.items() if k!='llm_api_key'}))
 def start(self, **kwargs): raise SystemExit(0)
module=types.ModuleType('hindsight'); module.HindsightServer=Server; sys.modules['hindsight']=module
runpy.run_path(sys.argv[1],run_name='__main__')`;
  const result = spawnSync('python3', ['-c', code, script], {
    env: { PATH: process.env.PATH, GEMINI_API_KEY: 'test-only', ...extra }, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.split('\n').find((line) => line.startsWith('CONFIG:')).slice(7));
}
test('router configuration overrides stale direct provider/model settings', () => {
  const result = config({ HINDSIGHT_API_LLM_LITELLMROUTER_CONFIG: '{}', HINDSIGHT_API_LLM_PROVIDER: 'gemini', HINDSIGHT_API_LLM_MODEL: 'gemini-2.5-flash' });
  assert.equal(result.llm_provider, 'litellmrouter');
  assert.equal(result.llm_model, 'default');
});
test('unrelated generic database URL cannot redirect embedded Hindsight', () => {
  assert.equal(config({ DATABASE_URL: 'postgresql://localhost:5433/unrelated' }).db_url, 'pg0');
});
test('explicit Hindsight database configuration is preserved', () => {
  assert.equal(config({ HINDSIGHT_API_DATABASE_URL: 'postgresql://localhost:6543/explicit' }).db_url, 'postgresql://localhost:6543/explicit');
});
test('retired persisted direct model is mapped without writing settings', () => {
  assert.equal(config({ HINDSIGHT_LLM_MODEL: 'gemini-2.5-flash' }).llm_model, 'gemini-3.1-flash-lite');
});
test('launcher prefers current checkout venv and contains no old absolute project path', () => {
  const source = fs.readFileSync('scripts/hindsight-start.sh', 'utf8');
  assert.ok(source.indexOf('"$PWD/.venv/bin/python"') < source.indexOf('"${HINDSIGHT_PYTHON:-}"'));
  assert.doesNotMatch(source, /\/Users\/[^\n]+Natively[^\n]*\.venv/i);
});
