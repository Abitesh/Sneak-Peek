import { buildDocumentChunks, type DocumentMapChunk } from '../services/modes/DocumentMap';

export type RepositoryCategory = 'overview' | 'dependencies' | 'backend' | 'frontend' | 'api' | 'database' | 'architecture' | 'implementation';
export interface RepositorySource {
  path: string; sha: string; commit: string; text: string; category: RepositoryCategory;
  truncated?: boolean;
}

export function repositoryCategory(file: string): RepositoryCategory {
  if (/(?:^|\/)readme(?:\.|$)/i.test(file)) return 'overview';
  if (/(?:package\.json|pom\.xml|pyproject\.toml|requirements[^/]*\.txt|Cargo\.toml|go\.mod|build\.gradle)$/i.test(file)) return 'dependencies';
  if (/schema|migration|(?:^|\/)(?:entities|prisma|database|db)(?:\/|\.)|\.sql$/i.test(file)) return 'database';
  if (/\.(?:tsx|jsx|vue|svelte|html|pug|ejs)$/i.test(file)) return 'frontend';
  if (/\.service\.[jt]s$|(?:^|\/)middleware\//i.test(file)) return 'backend';
  if (/openapi|swagger|(?:^|\/)(?:api|routes?|controllers?)(?:\/|\.)/i.test(file)) return 'api';
  if (/architecture|(?:^|\/)docs\//i.test(file)) return 'architecture';
  if (/\.(?:tsx|jsx|vue|svelte|html|pug|ejs)$|(?:^|\/)(?:client|frontend|components?|pages?|views?)(?:\/|\.)/i.test(file)) return 'frontend';
  if (/(?:^|\/)(?:server|backend|services?|middleware|auth)(?:\/|\.)|(?:app|server|index|main)\.(?:ts|js|py|java|go)$/i.test(file)) return 'backend';
  return 'implementation';
}

/** Read our bounded import envelope, not commands embedded in its contents. */
export function parseRepositorySources(text: string): RepositorySource[] {
  const commit = text.match(/^Commit: ([a-f0-9]{40})\s*$/mi)?.[1] ?? '';
  return [...text.matchAll(/^## Source: ([^\n]+)\nRevision: ([^\n]+)\n([\s\S]*?)(?=^## Source: |^## Additional user-provided notes|$(?![\s\S]))/gm)].map(match => {
    const body = match[3].replace(/^Category: [^\n]+\n/, '');
    return { path: match[1].trim(), sha: match[2].trim(), commit, text: body.replace(/\n\[Import truncated:[^\n]*\]/g,'').trimEnd(),
      category: repositoryCategory(match[1]), truncated: body.includes('[Import truncated:') };
  }).slice(0, 48);
}

export interface ImplementationSignal {
  kind: 'route' | 'request' | 'import' | 'schema' | 'symbol';
  text: string;
  source: { path: string; commit: string; blobSha: string; line: number };
}

/** Syntax observations only: these are not runtime guarantees or authorship. */
export function implementationSignals(sources: readonly RepositorySource[]): ImplementationSignal[] {
  const signals: ImplementationSignal[] = [];
  for (const source of sources) {
    if (/\.(?:md|markdown|txt)$/i.test(source.path)) continue;
    for (const [index, line] of source.text.split('\n').entries()) {
      const add = (kind: ImplementationSignal['kind'], text: string) => {
        if (signals.length < 180) signals.push({kind, text: text.slice(0, 240),
          source: {path: source.path, commit: source.commit, blobSha: source.sha, line: index + 1}});
      };
      const route = line.match(/\b(?:router|app|route)\.(get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)['"`]/i)
        ?? line.match(/@(Get|Post|Put|Patch|Delete)Mapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
      if (route) add('route', `${route[1].toUpperCase()} ${route[2]}`);
      const request = line.match(/\b(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (request) add('request', request[1]);
      for (const match of line.matchAll(/(?:from\s*['"]|require\s*\(\s*['"])(\.[^'"]+)['"]/g)) add('import', match[1]);
      if (/\b(?:CREATE\s+TABLE|new\s+(?:mongoose\.)?Schema|@Entity|model\s+\w+\s*\{)/i.test(line)) add('schema', line.trim());
      const symbol = line.match(/\b(?:class|function|interface|def)\s+(\w+)|\b(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
      if (symbol) add('symbol', symbol[1] ?? symbol[2]);
    }
  }
  return signals;
}

/** Never cross a repository file boundary. Chunk metadata keeps exact locations. */
export function buildProjectSourceChunks(text: string): DocumentMapChunk[] {
  const sources = parseRepositorySources(text);
  if (!sources.length) return buildDocumentChunks(text, {chunkWords: 140, chunkOverlap: 30});
  const project = text.match(/^# ([^\n]+)/m)?.[1] ?? 'Imported project';
  const repository = [...text.matchAll(/^Repository: (https:\/\/github\.com\/[^\s]+)/gm)].at(-1)?.[1];
  const firstSource = text.indexOf('\n## Source: ');
  const preamble = firstSource >= 0 ? text.slice(0, firstSource) : '';
  const chunks = buildDocumentChunks(preamble, {chunkWords: 140, chunkOverlap: 30});
  for (const source of sources) {
    const lines = source.text.split('\n');
    const envelopeStart=text.indexOf(`## Source: ${source.path}\n`);
    const bodyOffset=text.indexOf(source.text,Math.max(0,envelopeStart));
    const offsets=[0];for(const line of lines)offsets.push(offsets.at(-1)!+line.length+1);
    let start = 0;
    while (start < lines.length) {
      let end = start, chars = 0;
      while (end < lines.length && (chars < 1500 || end === start)) {
        // Prefer the next function/module/Markdown section as a clean boundary.
        if (end > start + 5 && chars > 500 && /^(?:#{1,4}\s|export |(?:async )?function |class |def |@(?:Get|Post|Entity))/.test(lines[end])) break;
        chars += lines[end].length + 1; end++;
      }
      const body = lines.slice(start, end).join('\n');
      if (body.trim()) {
        const declaration=lines.slice(0,start+1).reverse().find(line=>/\b(?:class|function|interface|def)\s+\w+|(?:const|let)\s+\w+\s*=/.test(line));
        const symbol=declaration?.match(/(?:class|function|interface|def)\s+(\w+)|(?:const|let)\s+(\w+)\s*=/)?.slice(1).find(Boolean);
        const heading = `${source.category} / ${source.path}${symbol?' / '+symbol:''}`;
        chunks.push({chunkIndex: chunks.length, text: `Project: ${project}\n${heading}\nCommit: ${source.commit || 'not supplied'}; blob: ${source.sha}; lines ${start + 1}–${end}\n${body}`,
          section: source.category, heading, contentType: 'text',
          ...(bodyOffset>=0?{startOffset:bodyOffset+offsets[start],endOffset:bodyOffset+Math.min(source.text.length,offsets[end])}:{}),
          metadata: {repositoryPath: source.path, repositoryCommit: source.commit, repositoryBlob: source.sha,
            sourceCategory: source.category, symbol, sourceLocator: repository && source.commit ? `${repository}/blob/${source.commit}/${source.path.split('/').map(encodeURIComponent).join('/')}#L${start + 1}-L${end}` : `${source.path}:${start + 1}-${end}`, lineStart: start + 1, lineEnd: end, truncated: Boolean(source.truncated)}});
      }
      start = end;
    }
  }
  return chunks.map((chunk, chunkIndex) => ({...chunk, chunkIndex}));
}

export function repositoryEvidenceMap(text: string): string {
  const sources = parseRepositorySources(text);
  if (!sources.length) return '';
  const signals = implementationSignals(sources);
  return ['## Source-derived implementation map (not proof of personal contribution)',
    ...sources.map(source => `- ${source.category}: ${source.path} @ ${source.sha}`),
    ...signals.filter(s => s.kind !== 'symbol').slice(0, 45).map(s => `- ${s.kind}: ${s.text} [${s.source.path}:${s.source.line} @ ${s.source.blobSha}]`),
    'Imports show declared module relationships. Routes show declarations, not proof of deployed behavior. README claims and code observations may conflict. Undocumented technology-choice rationales are unknown.'].join('\n');
}
