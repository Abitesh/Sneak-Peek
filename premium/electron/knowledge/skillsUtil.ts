/**
 * Deterministic, source-only categorization for structured resume skills.
 * This module does not infer that a candidate has a skill: it only groups
 * skills explicitly extracted from their document.
 */
export const SKILL_CATEGORIES = ['languages', 'frameworks', 'cloud', 'databases', 'ml', 'devops', 'tools'] as const;
export type SkillCategory = typeof SKILL_CATEGORIES[number];
export type CategorizedSkills = Record<SkillCategory, string[]>;

const DICTIONARY: Record<Exclude<SkillCategory, 'tools'>, string[]> = {
  languages: ['python', 'typescript', 'javascript', 'java', 'go', 'golang', 'rust', 'sql', 'r', 'c', 'c++', 'c#', 'kotlin', 'swift', 'ruby', 'php', 'scala'],
  frameworks: ['react', 'angular', 'vue', 'next.js', 'nextjs', 'node.js', 'nodejs', 'express', 'fastapi', 'django', 'flask', 'spring boot', 'spring', 'rails', 'svelte'],
  cloud: ['aws', 'gcp', 'azure', 'vercel', 'firebase', 'cloudflare', 'heroku', 'digitalocean'],
  databases: ['postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'dynamodb', 'pgvector', 'elasticsearch', 'snowflake'],
  ml: ['pytorch', 'tensorflow', 'langchain', 'hugging face', 'huggingface', 'pandas', 'numpy', 'scikit-learn', 'rag', 'llm', 'machine learning'],
  devops: ['docker', 'kubernetes', 'terraform', 'kafka', 'datadog', 'jenkins', 'prometheus', 'grafana', 'ci/cd', 'github actions'],
};

const empty = (): CategorizedSkills => ({ languages: [], frameworks: [], cloud: [], databases: [], ml: [], devops: [], tools: [] });
const clean = (s: unknown): string => typeof s === 'string' ? s.trim() : '';
const uniquePush = (a: string[], v: string): void => { if (v && !a.some(x => x.toLowerCase() === v.toLowerCase())) a.push(v); };

export function classifySkill(skill: string): SkillCategory {
  const value = clean(skill).toLowerCase();
  for (const key of SKILL_CATEGORIES) {
    if (key !== 'tools' && DICTIONARY[key].includes(value)) return key;
  }
  return 'tools';
}

export function categorizeFlatSkills(skills: unknown): CategorizedSkills {
  const result = empty();
  if (!Array.isArray(skills)) return result;
  for (const skill of skills) {
    const value = clean(skill);
    if (value) uniquePush(result[classifySkill(value)], value);
  }
  return result;
}

export function coerceSkills(skills: unknown): CategorizedSkills {
  if (Array.isArray(skills)) return categorizeFlatSkills(skills);
  const result = empty();
  if (!skills || typeof skills !== 'object') return result;
  // Older extractors wrap flat arrays in { all: [...] }. That wrapper carries
  // no category information, so classify each observed skill rather than
  // putting every value into the tools bucket.
  if (Object.keys(skills).length === 1 && Array.isArray((skills as any).all)) {
    return categorizeFlatSkills((skills as any).all);
  }
  for (const [bucket, value] of Object.entries(skills)) {
    if (!Array.isArray(value)) continue;
    const target: SkillCategory = SKILL_CATEGORIES.includes(bucket as SkillCategory) ? bucket as SkillCategory : 'tools';
    for (const raw of value) uniquePush(result[target], clean(raw));
  }
  return result;
}

export function flattenSkills(skills: unknown): string[] {
  const grouped = coerceSkills(skills);
  const result: string[] = [];
  for (const bucket of SKILL_CATEGORIES) for (const v of grouped[bucket]) uniquePush(result, v);
  return result;
}

export function isLegacyFlatSkills(skills: unknown): boolean { return Array.isArray(skills); }

/** Restrict a skill answer to buckets the user actually asked for. */
export function detectSkillCategories(question: string): SkillCategory[] {
  const q = clean(question).toLowerCase();
  const found = new Set<SkillCategory>();
  if (/\b(programming languages?|languages?|code|coding)\b/.test(q)) found.add('languages');
  if (/\b(frameworks?|libraries|frontend|backend|web frameworks?)\b/.test(q)) found.add('frameworks');
  if (/\b(cloud|aws|gcp|azure)\b/.test(q)) found.add('cloud');
  if (/\b(databases?|sql|no-?sql|storage)\b/.test(q)) found.add('databases');
  if (/\b(ai|ml|machine learning|deep learning|data science)\b/.test(q)) found.add('ml');
  if (/\b(devops|infrastructure|ci\/cd|containers?|deployment)\b/.test(q)) found.add('devops');
  // "tools" on its own is broad; for "cloud or DevOps tools" it is not a request
  // to also include unrelated generic tools.
  if (found.size === 0 && /\b(tools?|software)\b/.test(q)) found.add('tools');
  return [...found];
}
