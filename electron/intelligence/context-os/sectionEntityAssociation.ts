/** A subsection may inherit a subject only from its own document heading path. */
export function associateSectionEntity(input: {
  targetEntities: readonly string[];
  documentText: string;
  candidateText: string;
  distinctiveTerms: readonly string[];
  provesProperty: boolean;
  hasConflicts: boolean;
}): string | undefined {
  const entities = [...new Set(input.targetEntities.map((v) => v.trim()).filter(Boolean))];
  if (entities.length !== 1 || input.hasConflicts || !input.provesProperty) return undefined;
  const normalize = (v: string) => v.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const body = input.candidateText.replace(/^\s*\[[^\]\n]+\]\s*/, '');
  const normalizedBody = normalize(body);
  if (!normalizedBody) return undefined;
  const targetWords = normalize(entities[0]).split(/\s+/);
  if (targetWords.length > 1) {
    const prefix = targetWords.slice(0, -1).join(' ');
    const family = new RegExp(`(?:^| )${prefix} ([\\p{L}\\p{N}]+)`, 'gu');
    if ([...normalizedBody.matchAll(family)].some((match) => match[1] !== targetWords[targetWords.length - 1])) return undefined;
  }
  const words = new Set(normalizedBody.split(/\s+/));
  const terms = [...new Set(input.distinctiveTerms.map(normalize).filter(Boolean))];
  if (!terms.length || terms.filter((v) => words.has(v)).length * 2 <= terms.length) return undefined;
  // A topical paragraph alone cannot establish a value-bearing association.
  if (!/\d|\[[^\]]+\]|["“][^"”]+["”]|\b[A-Z][\w+-]*(?:\s+[A-Z][\w+-]*)+/u.test(body)) return undefined;

  const headings: Array<{ depth: number; text: string }> = [];
  const matches: string[][] = [];
  let section: string[] = [];
  let path: string[] = [];
  const flush = () => {
    if (normalize(section.join('\n')).includes(normalizedBody)) matches.push([...path]);
    section = [];
  };
  for (const line of input.documentText.split(/\r?\n/)) {
    const markdown = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    const numbered = line.match(/^\s*(\d+(?:\.\d+)*)[.)]?\s+([A-Z].*)$/);
    if (markdown || numbered) {
      flush();
      const depth = markdown ? markdown[1].length : numbered![1].split('.').length;
      const text = markdown ? markdown[2] : numbered![2];
      while (headings.length && headings[headings.length - 1].depth >= depth) headings.pop();
      headings.push({ depth, text });
      path = headings.map((h) => h.text);
    } else section.push(line);
  }
  flush();
  // Ambiguous repeated rows in different sections must not acquire a subject.
  if (matches.length !== 1) return undefined;
  const target = normalize(entities[0]);
  const entityHeading = matches[0].findIndex((heading) => normalize(heading) === target);
  if (entityHeading < 0) return undefined;
  // A nested subject such as an accessory or another robot breaks inheritance.
  // Only property-bearing or specification headings may refine this subject.
  const descendants = matches[0].slice(entityHeading + 1);
  if (descendants.some((heading) => {
    const tokens = normalize(heading).split(/\s+/);
    return !tokens.some((token) => terms.includes(token) || /^(?:specifications?|properties|parameters|details)$/.test(token));
  })) return undefined;
  return entities[0];
}
