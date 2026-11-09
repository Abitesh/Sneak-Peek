// Current standalone Company Research contract. Premium hosted search is
// disabled by policy; the IPC may still supply a compatible search provider.
// Never turn "no provider" into an invented company dossier.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const compiled = (f) => pathToFileURL(path.join(root,'dist-electron',f)).href;
const { searchCompanyInfo, CompanyResearchEngine } = await import(compiled('premium/electron/knowledge/CompanyResearchEngine.js'));
const { resolveCompanySearchProvider } = await import(compiled('electron/services/resolveCompanySearchProvider.js'));

test('standalone policy has no implicit premium or hosted search provider', () => {
  assert.equal(resolveCompanySearchProvider(), null);
});

test('missing provider and blank company fail closed: no fabricated dossier', async () => {
  assert.equal(await searchCompanyInfo('Acme', null), null);
  assert.equal(await searchCompanyInfo('', {search:async()=>[{text:'fake'}]}), null);
});

test('provider failure or empty search does not yield speculative claims', async () => {
  assert.equal(await searchCompanyInfo('Acme',{search:async()=>[]}), null);
  assert.equal(await searchCompanyInfo('Acme',{search:async()=>{throw Error('unavailable')}}), null);
});

test('successful research includes only search-grounded details and source URLs', async () => {
  const res=await searchCompanyInfo('Acme',{search:async q=>{
    assert.match(q,/Acme company culture technology stack/);
    return [{text:'Acme is a technology company using Python, PostgreSQL, Redis, and AWS in Seattle, Washington.',url:'https://example.test/article'}];
  }});
  assert.equal(res?.company,'Acme');
  assert.ok(res.sources.includes('https://example.test/article'));
  assert.ok(res.research.technologies.includes('python'));
  assert.ok(res.research.technologies.includes('redis'));
  assert.equal(typeof res.research.hiring_strategy,'undefined', 'research must not invent unavailable company strategy');
});

test('existing CompanyResearchEngine caches only sourced results and clears them',async()=>{
  const engine=new CompanyResearchEngine();let calls=0;
  const provider={search:async()=>{calls++;return [{text:'Technology employer using Python',url:'https://example.test'}]}};
  assert.equal(await engine.research('Acme',null),null);
  assert.ok(await engine.research('Acme',provider));
  assert.ok(await engine.research('Acme',provider));
  assert.equal(calls,1);
  engine.clearCache();
  assert.ok(await engine.research('Acme',provider));
  assert.equal(calls,2);
});

test('premium profile facade honors IPC provider setter without fabricating fallback data',()=>{
  const src=read('premium/electron/knowledge/KnowledgeOrchestrator.ts');
  assert.match(src,/getCompanyResearchEngine\(\)/);
  assert.match(src,/setSearchProvider\(provider:/);
  assert.match(src,/if \(!api\.searchProvider\) return null;/);
  assert.match(src,/await searchCompanyInfo\(company, api\.searchProvider\)/);
  assert.doesNotMatch(src,/hiring_strategy:\s*['"]Placeholder research data/);
});

test('main process installs one company-search resolver',()=>{
  const src=read('electron/main.ts');
  assert.match(src,/setSearchProviderResolver\(resolveCompanySearchProvider\)/);
});

test('manual research-company IPC uses same resolver and no inline hosted provider',()=>{
  const src=read('electron/ipcHandlers.ts');
  const start=src.indexOf("safeHandle('profile:research-company'");
  assert.ok(start>=0);
  const next=src.indexOf('safeHandle(',start+1);
  const body=src.slice(start,next);
  assert.match(body,/engine\.setSearchProvider\(resolveCompanySearchProvider\(\)\)/);
  assert.doesNotMatch(body,/new TavilySearchProvider/);
});

test('automatic JD ingestion does not silently start retired premium AOT remote search',()=>{
  const src=read('premium/electron/knowledge/KnowledgeOrchestrator.ts');
  assert.doesNotMatch(src,/this\.aotPipeline\.runForJD\(/);
  assert.match(src,/case DocType\.JD:/);
});
