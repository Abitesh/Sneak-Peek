/**
 * CompanyResearchEngine - Premium Implementation
 * 
 * Performs company research using search providers to gather intelligence
 * about companies mentioned in job descriptions or interviews.
 */

export interface CompanyResearch {
  companyName: string;
  description?: string;
  industry?: string;
  size?: string;
  founded?: number;
  website?: string;
  culture?: string[];
  technologies?: string[];
  locations?: string[];
  recentNews?: string[];
  glassdoorRating?: number;
  linkedinFollowers?: number;
}

export interface ResearchResult {
  company: string;
  research: CompanyResearch;
  sources?: string[];
  timestamp?: string;
  confidence?: number;
}

/**
 * Search for company information using provided search provider
 */
/**
 * A search provider is optional and untrusted: cap foreground latency even if
 * its network operation never completes. AbortSignal is passed to providers
 * that support cancellation; late results are ignored and never cached.
 */
export interface CompanyResearchOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DEFAULT_COMPANY_RESEARCH_TIMEOUT_MS = 2500;

export async function searchCompanyInfo(
  companyName: string,
  searchProvider: any,
  options: CompanyResearchOptions = {},
): Promise<ResearchResult | null> {
  if (!companyName || !searchProvider || typeof searchProvider.search !== 'function') {
    return null;
  }

  if (options.signal?.aborted) return null;
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(1, Math.min(15000, Math.floor(options.timeoutMs!)))
    : DEFAULT_COMPANY_RESEARCH_TIMEOUT_MS;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let onParentAbort: (() => void) | undefined;

  try {
    const query = `${companyName} company culture technology stack`;
    const abortPromise = new Promise<null>((resolve) => {
      if (options.signal) {
        onParentAbort = () => { controller.abort(); resolve(null); };
        options.signal.addEventListener('abort', onParentAbort, { once: true });
        if (options.signal.aborted) onParentAbort();
      }
    });
    const deadline = new Promise<null>((resolve) => {
      timeout = setTimeout(() => { controller.abort(); resolve(null); }, timeoutMs);
    });
    const search = Promise.resolve().then(() => {
      if (controller.signal.aborted) return null;
      return searchProvider.search(query, { signal: controller.signal });
    });
    const results = await Promise.race([search, deadline, abortPromise]);
    if (controller.signal.aborted || !Array.isArray(results)) return null;

    // Only cited search hits may ground company claims. A provider returning
    // an unsourced snippet, malformed row or local/file URL is not evidence.
    const cited = results.filter((row: any) =>
      typeof row?.text === 'string' && row.text.trim().length > 0
      && typeof row?.url === 'string' && /^https?:\/\//i.test(row.url));
    if (cited.length === 0) return null;

    const research: CompanyResearch = {
      companyName,
      description: cited[0].text.slice(0, 500),
      industry: extractIndustry(cited),
      technologies: extractTechnologies(cited),
      locations: extractLocations(cited),
    };

    return {
      company: companyName,
      research,
      sources: [...new Set(cited.map((row: any) => row.url))],
      timestamp: new Date().toISOString(),
      confidence: 0.7,
    };
  } catch (error: any) {
    if (!controller.signal.aborted) {
      console.error('[CompanyResearchEngine] Research failed:', error?.message ?? 'unknown');
    }
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
    if (onParentAbort) options.signal?.removeEventListener('abort', onParentAbort);
  }
}

/**
 * Extract industry from search results
 */
function extractIndustry(results: any[]): string | undefined {
  if (!results || results.length === 0) return undefined;

  const text = (results[0]?.text || '').toLowerCase();

  const industries = [
    'technology', 'fintech', 'healthcare', 'retail', 'manufacturing',
    'education', 'consulting', 'media', 'energy', 'telecommunications'
  ];

  for (const industry of industries) {
    if (text.includes(industry)) {
      return industry;
    }
  }

  return undefined;
}

/**
 * Extract technologies from search results
 */
function extractTechnologies(results: any[]): string[] {
  const tech: Set<string> = new Set();

  const techKeywords = [
    'python', 'javascript', 'java', 'go', 'rust', 'c++',
    'react', 'angular', 'vue', 'node.js', 'django', 'flask',
    'kubernetes', 'docker', 'aws', 'gcp', 'azure',
    'postgresql', 'mongodb', 'redis', 'elasticsearch',
    'machine learning', 'ai', 'nlp', 'cv', 'tensorflow', 'pytorch'
  ];

  for (const result of results || []) {
    const text = (result.text || '').toLowerCase();
    for (const keyword of techKeywords) {
      if (text.includes(keyword)) {
        tech.add(keyword);
      }
    }
  }

  return Array.from(tech);
}

/**
 * Extract locations from search results
 */
function extractLocations(results: any[]): string[] {
  const locations: Set<string> = new Set();
  const geoPattern = /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,?\s(?:[A-Z]{2}|[A-Z][a-z]{1,})\b)/g;

  for (const result of results || []) {
    // Search-provider rows are untrusted; a concrete string gives match()
    // a typed RegExpMatchArray and avoids accidental non-text values.
    const text: string = typeof result?.text === 'string' ? result.text : '';
    const matches = text.match(geoPattern);
    if (matches) {
      matches.forEach(m => locations.add(m.trim()));
    }
  }

  return Array.from(locations).slice(0, 5);  // Limit to 5 locations
}

export class CompanyResearchEngine {
  private cache: Map<string, ResearchResult> = new Map();

  /**
   * Research a company with caching
   */
  async research(
    companyName: string,
    searchProvider: any,
    useCache: boolean = true,
    options: CompanyResearchOptions = {},
  ): Promise<ResearchResult | null> {
    if (options.signal?.aborted) return null;
    if (useCache && this.cache.has(companyName)) {
      return this.cache.get(companyName) || null;
    }

    const result = await searchCompanyInfo(companyName, searchProvider, options);

    if (result && useCache && !options.signal?.aborted) {
      this.cache.set(companyName, result);
    }

    return result;
  }

  /**
   * Clear research cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached research result
   */
  getCached(companyName: string): ResearchResult | undefined {
    return this.cache.get(companyName);
  }
}

export default CompanyResearchEngine;
