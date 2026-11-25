import { repositoryCategory, type RepositoryCategory } from './RepositoryEvidence';
const MAX_RESPONSE_BYTES = 2_000_000;
const MAX_FILES = 40;
const MAX_TEXT = 160_000;
const cooldowns = new Map<string, number>();
export function parseGitHubRepository(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password || url.search || url.hash) throw new Error('Enter an HTTPS github.com repository URL.');
  const match = url.pathname.match(/^\/([a-z\d_.-]+)\/([a-z\d_.-]+?)(?:\.git)?\/?$/i);
  if (!match || match[1] === '.' || match[2] === '..') throw new Error('Enter a repository, not a profile or file URL.');
  return {owner: match[1], repo: match[2], url: `https://github.com/${match[1]}/${match[2]}`};
}
export function safeRepositoryPath(path: string) {
  return !/(?:^|\/)(?:\.env[^/]*|\.git|node_modules|vendor|dist|build|target|coverage|credentials?|secrets?|\.ssh|\.aws)(?:\/|$)/i.test(path)
    && !/\.(?:pem|key|p12|pfx|crt|lock|svg|png|jpg|zip|bin|exe|dmg)$/i.test(path)
    && !path.includes('..') && !path.startsWith('/');
}
export function redactRepositorySecrets(text: string) {
  return text.replace(/\b([a-z][\w+.-]*:\/\/)[^@\s/]+@/gi, '$1[credential removed]@').replace(/-----BEGIN [^-]*(?:PRIVATE KEY)[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, '[private key removed]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b/g, '[credential removed]')
    .replace(/((?:api[_-]?key|access[_-]?token|password|secret|authorization)["']?\s*[=:]\s*)[^\n,;]+/gi, '$1[credential removed]');
}
interface TreeFile {path: string; sha: string; type: string; mode: string; size: number}
function eligible(file: TreeFile) {
  return typeof file.path === 'string' && file.type === 'blob' && file.mode === '100644' && Number.isFinite(file.size)
    && file.size > 0 && file.size <= 120_000 && safeRepositoryPath(file.path)
    && /(?:\.(?:md|markdown|txt|ts|tsx|js|jsx|py|java|rs|go|sql|vue|svelte|html|pug|ejs|json|xml|prisma|toml|gradle)|go\.mod)$/i.test(file.path)
    && (!/\.json$/i.test(file.path)||/(?:^|\/)package\.json$|openapi|swagger/i.test(file.path))
    && !/(?:^|\/)(?:\.?eslint|jest|tsconfig)[^/]*[.]/i.test(file.path)
    && !/(?:^|\/)(?:test|tests|__tests__|e2e|fixtures|mocks|\.github)(?:\/|$)|\.min\.js$/i.test(file.path);
}
/** Coverage-balanced selection: documentation cannot consume every code slot. */
export function selectRepositoryFiles(tree: readonly TreeFile[]): TreeFile[] {
  const candidates = tree.filter(eligible).sort((a, b) => {
    const entry = (p: string) => /(?:^|\/)(?:app|server|main|index)\.(?:ts|js|py|java|go)$/.test(p) ? 0 : 1;
    return entry(a.path) - entry(b.path) || a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path);
  });
  const groups: RepositoryCategory[] = ['overview', 'dependencies', 'backend', 'frontend', 'api', 'database', 'architecture', 'implementation'];
  const selected: TreeFile[] = [];
  for (let round = 0; selected.length < MAX_FILES; round++) {
    let added = false;
    for (const category of groups) {
      const file = candidates.filter(f => repositoryCategory(f.path) === category)[round];
      if (file) {selected.push(file); added = true;}
      if (selected.length === MAX_FILES) break;
    }
    if (!added) break;
  }
  return selected;
}
class ImportFailure extends Error {
  constructor(message: string, readonly status?: number) {super(message);}
}
/** Commit-pinned, bounded reads only. No clone, process, code execution or LLM calls. */
export async function importPublicGitHubProject(value: string, options: {fetch?: typeof fetch; signal?: AbortSignal} = {}) {
  const repository = parseGitHubRepository(value), request = options.fetch ?? fetch;
  const cooldownKey = 'api.github.com';
  // Injected transports own their own account/rate-limit domain in tests.
  if (!options.fetch && (cooldowns.get(cooldownKey) ?? 0) > Date.now()) throw new Error(`GitHub is rate limited. Retry after ${new Date(cooldowns.get(cooldownKey)!).toISOString()}. No request was sent.`);
  const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(45_000)]) : AbortSignal.timeout(45_000);
  const api = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`;
  async function get(path: string) {
    const response = await request(api + path, {headers: {Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10'}, redirect: 'error', signal});
    if (!response.ok) {
      const retry = Number(response.headers.get('retry-after'));
      const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
      const limited = response.status === 429 || response.status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || retry > 0);
      const until = limited ? (retry > 0 ? Date.now() + retry * 1000 : reset > Date.now() ? reset : Date.now() + 60_000) : undefined;
      if (until && !options.fetch) cooldowns.set(cooldownKey, until);
      throw new ImportFailure(limited ? `GitHub rate limit reached. Retry after ${new Date(until!).toISOString()}; no automatic retry was sent.`
        : response.status === 404 ? 'Repository or source unavailable/private. Public import uses no credentials; upload authorized private documentation instead.'
        : response.status === 403 ? 'GitHub access restriction. Check repository access; no automatic retry was sent.' : `GitHub import failed (${response.status}).`, response.status);
    }
    if (Number(response.headers.get('content-length')) > MAX_RESPONSE_BYTES) throw new Error('Repository response exceeds the import limit.');
    const reader = response.body?.getReader(); if (!reader) throw new Error('GitHub returned an empty response.');
    const buffers: Uint8Array[] = []; let bytes = 0;
    try {while (true) {const next = await reader.read(); if (next.done) break; bytes += next.value.length; if (bytes > MAX_RESPONSE_BYTES) throw new Error('Repository response exceeds the import limit.'); buffers.push(next.value);}}
    finally {await reader.cancel().catch(() => {});}
    return JSON.parse(Buffer.concat(buffers).toString('utf8'));
  }
  const metadata = await get('');
  const branch = await get('/commits/' + encodeURIComponent(metadata.default_branch));
  if (!/^[a-f0-9]{40}$/i.test(branch.sha)) throw new Error('Repository revision is unavailable.');
  const tree = await get('/git/trees/' + branch.sha + '?recursive=1');
  const candidates: TreeFile[] = Array.isArray(tree.tree) ? tree.tree : [];
  const chosen = selectRepositoryFiles(candidates);
  const sources: Array<{path: string; sha: string; text: string; category: RepositoryCategory; truncated: boolean}> = [];
  const warnings: string[] = []; let total = 0;
  for (const file of chosen) {
    options.signal?.throwIfAborted();
    try {
      signal.throwIfAborted();
      const blob = await get('/git/blobs/' + encodeURIComponent(file.sha));
      if (blob.encoding !== 'base64' || typeof blob.content !== 'string') {warnings.push(`${file.path}: unsupported encoding`); continue;}
      const decoded = Buffer.from(blob.content, 'base64').toString('utf8');
      if (decoded.includes('\0')) {warnings.push(`${file.path}: binary source omitted`); continue;}
      const clean = redactRepositorySecrets(decoded).replace(/^## Source:/gm, '## Quoted Source:');
      const limit = Math.min(16_000, MAX_TEXT - total);
      if (limit < 500) {warnings.push('Total text budget reached.'); break;}
      const clipped = clean.length > limit;
      // End at a complete line where possible; the full SHA remains attached.
      const cut = clipped ? clean.lastIndexOf('\n', limit) : clean.length;
      const text = clean.slice(0, clipped && cut > limit / 2 ? cut : limit) + (clipped ? '\n[Import truncated: remaining lines were not analyzed.]' : '');
      sources.push({path: file.path, sha: file.sha, text, category: repositoryCategory(file.path), truncated: clipped}); total += text.length;
      if (clipped) warnings.push(`${file.path}: text truncated`);
    } catch (error) {
      options.signal?.throwIfAborted();
      if (!sources.length) throw error;
      warnings.push(`${file.path}: ${error instanceof Error ? error.message : 'read failed'}`);
      if (signal.aborted || error instanceof ImportFailure && [403, 429].includes(error.status ?? 0)) break;
    }
  }
  if (!sources.length) throw new Error('No supported readable project sources were found. Upload documentation instead.');
  if (tree.truncated) warnings.push('GitHub returned a truncated source tree.');
  const omitted = candidates.filter(eligible).length - sources.length;
  if (omitted > 0) warnings.push(`${omitted} eligible files were outside this bounded import or could not be read.`);
  const categories = [...new Set(sources.map(s => s.category))];
  return {name: String(metadata.name ?? repository.repo), repositoryUrl: repository.url, commit: branch.sha,
    description: redactRepositorySecrets(String(metadata.description ?? '')),
    readme: `Repository: ${repository.url}\nCommit: ${branch.sha}\nImport scope: ${sources.length} selected files. Coverage: ${categories.join(', ')}. Unread files and undocumented rationales remain unknown. Repository ownership is not proof of personal authorship.\n${warnings.map(w => 'Import warning: ' + w).join('\n')}\n\nDirectory inventory (paths only, not proof their contents were read):\n${candidates.filter(eligible).map(f=>f.path).slice(0,100).join('\n').slice(0,3000)}\n\n` +
      sources.map(s => `## Source: ${s.path}\nRevision: ${s.sha}\nCategory: ${s.category}\n${s.text}`).join('\n\n'),
    sources: sources.map(({text, ...s}) => s), categories, warnings, partial: warnings.length > 0};
}
