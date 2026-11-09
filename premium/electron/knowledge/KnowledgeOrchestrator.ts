/**
 * KnowledgeOrchestrator - Premium Implementation
 * 
 * Orchestrates Profile Intelligence features including:
 * - Resume/Job Description/Company data ingestion
 * - Profile grounding for LLM responses
 * - Company research and intelligence
 * - Cover letter and negotiation script generation
 * 
 * This is the application-owned, source-controlled implementation that replaces
 * the unavailable premium submodule.
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
import type { DatabaseManager } from '../../../electron/db/DatabaseManager';
import { extractSafeDocumentText } from '../../../electron/services/SafeDocumentTextExtractor';
import { isIntelligenceFlagEnabled } from '../../../electron/intelligence/intelligenceFlags';
import { planAnswer } from '../../../electron/llm/AnswerPlanner';
import { isLayerAllowed } from '../../../electron/llm/contextRoute';
import { DocType, DocumentIngestResult, ProfileStatus, ProfileData } from './types';
import { ContextAssembler, generateCandidateIntro } from './ContextAssembler';
import { buildGroundingBlock } from './ProfileContextBuilder';
import { isProfileGroundingV2Enabled } from '../../../electron/llm/profileGroundingV2';
import { classifyIntentWithContext, isGenericKnowledgeQuestion } from './IntentClassifier';
import { coerceSkills, flattenSkills, isLegacyFlatSkills } from './skillsUtil';
import { heuristicResumeExtract, heuristicJDExtract } from './HeuristicExtractor';
import { searchCompanyInfo } from './CompanyResearchEngine';

export class KnowledgeOrchestrator {
  private db: DatabaseManager;
  private knowledgeMode: boolean = false;
  public activeResume: any = null;
  public activeJD: any = null;
  public activeCompany: any = null;
  private negotiationScript: string | null = null;
  private coverLetter: string | null = null;
  private negotiationTracker: any = null;
  private companyDossier: Map<string, any> = new Map();
  private companyResearchApi: any = null;
  private generateContentFn: ((contents: any[]) => Promise<any>) | null = null;
  private liveCoachingContentFn: ((contents: any[]) => Promise<any>) | null = null;
  private searchProviderResolver: (() => any) | null = null;
  private embedFn: ((text: string) => Promise<number[] | null>) | null = null;
  private embedWithMetadataFn: ((text: string, metadata?: any) => Promise<{embedding: number[], metadata: any} | null>) | null = null;
  private activeSpaceFn: (() => any) | null = null;
  private embedQueryFn: ((text: string) => Promise<{embedding: number[], space: any} | null>) | null = null;
  private fastQueryEmbedFn: (() => any) | null = null;
  private conversationContextProvider: (() => any) | null = null;
  private depthScoringHistory: string[] = [];
  // Ingestion belongs to the main process, not the lifetime of a settings panel.
  // Queue only same-type writes so a slow resume parse cannot overwrite newer
  // resume state, while independent JD uploads can run concurrently.
  private ingestChains = new Map<DocType, Promise<void>>();
  private ingestPending = new Map<DocType, number>();

  constructor(db: DatabaseManager) {
    this.db = db;
    // The compatibility DatabaseManager supplies an idempotent profile schema
    // initializer. Never create the retired knowledge_nodes schema.
    if (typeof (db as any).initializeSchema === 'function' &&
        typeof (db as any).getDb === 'function' &&
        typeof (db as any).isAvailable !== 'function') {
      (db as any).initializeSchema();
    }
    this.loadProfileData();
  }

  /**
   * Set the LLM content generation function (general)
   */
  setGenerateContentFn(fn: (contents: any[]) => Promise<any>): void {
    this.generateContentFn = fn;
  }

  /**
   * Set the live coaching content generation function
   */
  setLiveCoachingContentFn(fn: (contents: any[]) => Promise<any>): void {
    this.liveCoachingContentFn = fn;
  }

  /**
   * Set the company search provider resolver
   */
  setSearchProviderResolver(fn: () => any): void {
    this.searchProviderResolver = fn;
  }

  /**
   * Set the text embedding function
   */
  setEmbedFn(fn: (text: string) => Promise<number[] | null>): void {
    this.embedFn = fn;
  }

  /**
   * Set the embedding function with metadata support
   */
  setEmbedWithMetadataFn(fn: (text: string, metadata?: any) => Promise<{embedding: number[], metadata: any} | null>): void {
    this.embedWithMetadataFn = fn;
  }

  /**
   * Set the active embedding space resolver
   */
  setActiveSpaceFn(fn: () => any): void {
    this.activeSpaceFn = fn;
  }

  /**
   * Set the query embedding function
   */
  setEmbedQueryFn(fn: (text: string) => Promise<{embedding: number[], space: any} | null>): void {
    this.embedQueryFn = fn;
  }

  /**
   * Set the fast query embedding function
   */
  setFastQueryEmbedFn(fn: () => any): void {
    this.fastQueryEmbedFn = fn;
  }

  /**
   * Set the conversation context provider
   */
  setConversationContextProvider(fn: () => any): void {
    this.conversationContextProvider = fn;
  }

  /**
   * Compatibility hook used by the live chat pipeline. It keeps receiving the
   * user's question so the depth scorer and any context provider can observe it
   * without requiring the full premium profile pipeline to be active.
   */
  feedForDepthScoring(message: string): void {
    if (!message || !message.trim()) return;
    this.depthScoringHistory.push(message.trim());
    if (this.depthScoringHistory.length > 50) {
      this.depthScoringHistory = this.depthScoringHistory.slice(-50);
    }
    try {
      this.conversationContextProvider?.();
    } catch {
      // Best-effort only; a context provider failure must never break the answer.
    }
  }

  feedInterviewerUtterance(message: string): void {
    this.feedForDepthScoring(message);
  }

  getNegotiationTracker(): any {
    if (!this.negotiationTracker) {
      this.negotiationTracker = {
        conversationHistory: [],
        salaryRange: { min: null, max: null },
        keyPoints: [],
        createdAt: new Date().toISOString(),
      };
    }
    return this.negotiationTracker;
  }

  resetNegotiationSession(): void {
    this.negotiationTracker = null;
    this.negotiationScript = null;
  }

  /**
   * Load profile data from storage on initialization
   */
  private loadProfileData(): void {
    try {
      const hasDb = typeof this.db === 'object' && this.db !== null;
      const isRealDbManager = hasDb && typeof (this.db as any).isAvailable === 'function';
      const isKnowledgeDbManager = hasDb && typeof (this.db as any).getDb === 'function';
      const hasDocumentLookup = hasDb && typeof (this.db as any).getDocumentByType === 'function';

      if (!isRealDbManager && !isKnowledgeDbManager && !hasDocumentLookup) {
        console.warn('[KnowledgeOrchestrator] Database manager type not recognized, skipping profile load');
        return;
      }

      let sqliteDb: any = null;

      if (isRealDbManager) {
        if (!(this.db as any).isAvailable()) {
          console.warn('[KnowledgeOrchestrator] Database not available, skipping profile load');
          return;
        }
        sqliteDb = (this.db as any).getDb();
      } else if (isKnowledgeDbManager) {
        sqliteDb = (this.db as any).getDb?.();
      }

      const resumeRow = sqliteDb?.prepare ? sqliteDb.prepare(
        'SELECT id, raw_text, structured_data, extraction_mode FROM profile_documents WHERE doc_type = ? ORDER BY updated_at DESC LIMIT 1'
      ).get(DocType.RESUME) : null;

      if (resumeRow) {
        let data = typeof resumeRow.structured_data === 'string' ? JSON.parse(resumeRow.structured_data) : resumeRow.structured_data;
        // Existing v1 rows used string[] skills. Upgrade their typed shape
        // once, in the active profile_documents table; never revive the
        // retired context_nodes/KnowledgeDatabaseManager storage layer.
        if (isLegacyFlatSkills(data?.skills)) {
          data = this.normalizedResume(data);
          try {
            sqliteDb.prepare('UPDATE profile_documents SET structured_data = ?, updated_at = ? WHERE id = ?')
              .run(JSON.stringify(data), new Date().toISOString(), resumeRow.id);
          } catch (error) {
            console.warn('[KnowledgeOrchestrator] Legacy skills migration remains in memory:', error);
          }
        }
        this.activeResume = { raw_text: resumeRow.raw_text, structured_data: data };
        console.log('[KnowledgeOrchestrator] Resume loaded from database');
      } else if (hasDocumentLookup) {
        const doc = (this.db as any).getDocumentByType?.(DocType.RESUME);
        if (doc?.structured_data || doc?.raw_text) {
          // Some compatibility stores still return v1 flat skills without a
          // backing profile_documents row. Normalize IN MEMORY, without mutating
          // the store's object or reviving the retired knowledge node tables.
          this.activeResume = isLegacyFlatSkills(doc.structured_data?.skills)
            ? { ...doc, structured_data: this.normalizedResume(doc.structured_data) }
            : doc;
          console.log('[KnowledgeOrchestrator] Resume loaded from document lookup');
        }
      }

      const jdRow = sqliteDb?.prepare ? sqliteDb.prepare(
        'SELECT raw_text, structured_data, extraction_mode FROM profile_documents WHERE doc_type = ? ORDER BY updated_at DESC LIMIT 1'
      ).get(DocType.JD) : null;

      if (jdRow) {
        this.activeJD = {
          raw_text: jdRow.raw_text,
          structured_data: typeof jdRow.structured_data === 'string' ? JSON.parse(jdRow.structured_data) : jdRow.structured_data,
        };
        console.log('[KnowledgeOrchestrator] JD loaded from database');
      } else if (hasDocumentLookup) {
        const doc = (this.db as any).getDocumentByType?.(DocType.JD);
        if (doc?.structured_data || doc?.raw_text) {
          this.activeJD = doc;
          console.log('[KnowledgeOrchestrator] JD loaded from document lookup');
        }
      }

      if (hasDocumentLookup && !this.activeResume && !this.activeJD) {
        const doc = (this.db as any).getDocumentByType?.(DocType.RESUME);
        if (doc && (doc.structured_data || doc.raw_text)) {
          this.activeResume = isLegacyFlatSkills(doc.structured_data?.skills)
            ? { ...doc, structured_data: this.normalizedResume(doc.structured_data) }
            : doc;
        }
      }

      console.log('[KnowledgeOrchestrator] Profile data loaded from storage');
    } catch (error) {
      console.error('[KnowledgeOrchestrator] Failed to load profile data:', error);
    }
  }

  /**
   * A failed external extractor must not make a correctly uploaded resume vanish.
   * Only document-derived facts are used in this degraded mode; provider errors
   * are never passed through into profile facts or user-visible context.
   */
  private heuristicExtractionEnabled(): boolean {
    return process.env.PI_HEURISTIC_EXTRACTION?.toLowerCase() !== 'off';
  }

  private normalizedResume(data: any): any {
    const parsed = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const skills = coerceSkills(parsed.skills ?? parsed.skillsFlat ?? parsed.skills_flat);
    const experience = Array.isArray(parsed.experience) ? parsed.experience.map((item: any) => ({
      ...item, bullets: Array.isArray(item?.bullets) ? item.bullets : [],
    })) : [];
    const projects = Array.isArray(parsed.projects) ? parsed.projects.map((item: any) => ({
      ...item, technologies: Array.isArray(item?.technologies) ? item.technologies : [],
    })) : [];
    const education = Array.isArray(parsed.education) ? parsed.education : [];
    return {
      ...parsed,
      skills, skillsFlat: flattenSkills(skills), skills_flat: flattenSkills(skills),
      experience, projects, education,
      experienceCount: experience.length, educationCount: education.length,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      leadership: Array.isArray(parsed.leadership) ? parsed.leadership : [],
      _schema_version: 2,
    };
  }

  private resumeNeedsRecovery(data: any, text: string): boolean {
    if (!data || typeof data !== 'object') return true;
    const name = String(data.identity?.name ?? '').trim();
    const hasBody = Boolean(
      flattenSkills(data.skills ?? data.skillsFlat).length
      || (Array.isArray(data.experience) && data.experience.length)
      || (Array.isArray(data.projects) && data.projects.length)
      || (Array.isArray(data.education) && data.education.length)
    );
    // Only replace a sparse parse when the source has concrete facts to rescue.
    if (hasBody) return false;
    const source = heuristicResumeExtract(text);
    return Boolean((/^(unknown|n\/?a|candidate)$/i.test(name) || !hasBody)
      && (source.experience.length || source.projects.length || source.skillsFlat.length || source.education.length));
  }

  private jdNeedsRecovery(data: any, text: string): boolean {
    if (!data || typeof data !== 'object') return true;
    const title = String(data.title ?? '').trim();
    if (!title || /^(unknown|n\/?a|unspecified)(?:\s+role)?$/i.test(title)) return true;
    return false;
  }

  /**
   * Ingest a document (resume, JD, or company data)
   */
  isIngesting(docType: DocType): boolean {
    return (this.ingestPending.get(docType) ?? 0) > 0;
  }

  async ingestDocument(filePath: string, docType: DocType): Promise<DocumentIngestResult> {
    this.ingestPending.set(docType, (this.ingestPending.get(docType) ?? 0) + 1);
    const preceding = this.ingestChains.get(docType) ?? Promise.resolve();
    const running = preceding.catch(() => {}).then(() => this.ingestDocumentCore(filePath, docType));
    // A rejected ingest must not poison the queue or leave the panel busy.
    const settled = running.then(() => {}, () => {});
    this.ingestChains.set(docType, settled);
    try {
      return await running;
    } finally {
      const remaining = (this.ingestPending.get(docType) ?? 1) - 1;
      if (remaining > 0) this.ingestPending.set(docType, remaining);
      else this.ingestPending.delete(docType);
      if (this.ingestChains.get(docType) === settled && remaining === 0) {
        this.ingestChains.delete(docType);
      }
    }
  }

  private async ingestDocumentCore(filePath: string, docType: DocType): Promise<DocumentIngestResult> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      // Extract text from document
      // extractSafeDocumentText returns { content, filePath, fileName, extension, ... }
      // or throws an error on failure
      let extraction: any;
      try {
        extraction = await extractSafeDocumentText(filePath);
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Failed to extract document text',
        };
      }

      const rawText = extraction.content || '';

      // Parse based on document type using LLM if available
      let parsedData: any = {};
      let usedLLM = false;
      let documentId = '';
      
      switch (docType) {
        case DocType.RESUME: {
          if (!this.generateContentFn) {
            return { success: false, error: 'LLM content generator is not configured. Please set generateContentFn before ingesting.' };
          }
          try {
            parsedData = await this.parseResumeWithLLM(rawText);
            if (this.heuristicExtractionEnabled() && this.resumeNeedsRecovery(parsedData, rawText)) {
              parsedData = heuristicResumeExtract(rawText);
            } else {
              usedLLM = true;
            }
          } catch (error) {
            if (!this.heuristicExtractionEnabled()) throw error;
            console.warn('[KnowledgeOrchestrator] Resume extractor unavailable; using document-only heuristic');
            parsedData = heuristicResumeExtract(rawText);
          }
          parsedData = this.normalizedResume(parsedData);
          parsedData._extraction_mode = usedLLM ? 'llm' : 'heuristic';
          this.activeResume = { raw_text: rawText, structured_data: parsedData };
          documentId = `resume-${randomUUID()}`;
          break;
        }
        case DocType.JD: {
          if (!this.generateContentFn) {
            return { success: false, error: 'LLM content generator is not configured. Please set generateContentFn before ingesting.' };
          }
          try {
            parsedData = await this.parseJDWithLLM(rawText);
            if (this.heuristicExtractionEnabled() && this.jdNeedsRecovery(parsedData, rawText)) {
              parsedData = heuristicJDExtract(rawText);
            } else {
              usedLLM = true;
            }
          } catch (error) {
            if (!this.heuristicExtractionEnabled()) throw error;
            console.warn('[KnowledgeOrchestrator] JD extractor unavailable; using document-only heuristic');
            parsedData = heuristicJDExtract(rawText);
          }
          parsedData._extraction_mode = usedLLM ? 'llm' : 'heuristic';
          this.activeJD = { raw_text: rawText, structured_data: parsedData };
          documentId = `jd-${randomUUID()}`;
          break;
        }
        case DocType.COMPANY:
          parsedData = { raw_text: rawText };
          this.activeCompany = { raw_text: rawText, structured_data: parsedData };
          documentId = `company-${randomUUID()}`;
          break;
        default:
          return { success: false, error: 'Unsupported document type' };
      }

      // Store in database
      try {
        const isRealDbManager = typeof (this.db as any).isAvailable === 'function';
        const isKnowledgeDbManager = typeof (this.db as any).getDb === 'function';
        
        let sqliteDb: any = null;
        
        if (isRealDbManager) {
          // This is a real DatabaseManager
          if (!(this.db as any).isAvailable()) {
            console.warn('[KnowledgeOrchestrator] Database not available for storage');
            return {
              success: true,
              documentId,
            };
          }
          sqliteDb = (this.db as any).getDb();
        } else if (isKnowledgeDbManager) {
          // This is a KnowledgeDatabaseManager (stub or test)
          sqliteDb = (this.db as any).getDb?.();
        }
        
        if (sqliteDb) {
          const now = new Date().toISOString();
          // Replacement is atomic. An insert failure must not leave an older
          // valid profile deleted, and per-type queuing prevents overtaking.
          const replaceProfile = sqliteDb.transaction(() => {
            sqliteDb.prepare('DELETE FROM profile_documents WHERE doc_type = ?').run(docType);
            sqliteDb.prepare(`
              INSERT INTO profile_documents (id, doc_type, raw_text, structured_data, extraction_mode, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(documentId, docType, rawText, JSON.stringify(parsedData),
              usedLLM ? 'llm' : 'heuristic', now, now);
          });
          replaceProfile();
          console.log(`[KnowledgeOrchestrator] Stored ${docType} document in database (${rawText.length} chars)`);
        } else {
          console.warn('[KnowledgeOrchestrator] Database not available for storage');
        }
      } catch (dbError) {
        console.error('[KnowledgeOrchestrator] Database storage failed:', dbError);
        // Don't fail the ingest on DB error — the in-memory object is still valid for this session
      }

      return {
        success: true,
        documentId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to ingest document',
      };
    }
  }

  /**
   * Parse resume using LLM
   */
  private async parseResumeWithLLM(text: string): Promise<any> {
    const prompt = `Extract structured resume data from the following resume text. Return JSON with fields: identity (name, email, phone, location, summary), skills (object with categories), experience (array with company, role, start_date, end_date, bullets), education (array), projects (array), achievements (array), certifications (array), leadership (array).

RESUME TEXT:
${text}

Return ONLY valid JSON, no markdown or extra text.`;

    const result = await this.generateContentFn!([{ text: prompt }]);
    try {
      const parsed = JSON.parse(result);
      
      // Ensure skills is an object with categories; if it's an array, convert to object
      if (Array.isArray(parsed.skills)) {
        const skillsFlat = parsed.skills;
        parsed.skills = { all: skillsFlat };
        parsed.skillsFlat = skillsFlat;
      } else if (typeof parsed.skills === 'object') {
        // Flatten the categorized skills object
        const skillsFlat = Object.values(parsed.skills).flat() as string[];
        parsed.skillsFlat = skillsFlat;
      } else {
        parsed.skills = {};
        parsed.skillsFlat = [];
      }
      
      // Ensure counts are set
      parsed.experienceCount = Array.isArray(parsed.experience) ? parsed.experience.length : 0;
      parsed.educationCount = Array.isArray(parsed.education) ? parsed.education.length : 0;
      
      // Ensure all expected fields exist
      parsed.projects = parsed.projects || [];
      parsed.achievements = parsed.achievements || [];
      parsed.certifications = parsed.certifications || [];
      parsed.leadership = parsed.leadership || [];
      
      return parsed;
    } catch {
      throw new Error('Resume extraction response was not valid JSON');
    }
  }

  /**
   * Parse JD using LLM
   */
  private async parseJDWithLLM(text: string): Promise<any> {
    const prompt = `Extract structured job description data from the following JD text. Return JSON with fields: title, company, location, description_summary, level, employment_type, min_years_experience, compensation_hint, requirements (array), nice_to_haves (array), responsibilities (array), technologies (array), keywords (array), qualifications (array).

JD TEXT:
${text}

Return ONLY valid JSON, no markdown or extra text.`;

    const result = await this.generateContentFn!([{ text: prompt }]);
    try {
      let parsed = JSON.parse(result);
      // Normalize array fields: if a field is supposed to be an array but came back as a string, split it
      const arrayFields = ['requirements', 'nice_to_haves', 'responsibilities', 'technologies', 'keywords', 'qualifications'];
      for (const field of arrayFields) {
        if (parsed[field] && typeof parsed[field] === 'string') {
          // Split by comma or semicolon
          parsed[field] = parsed[field].split(/[,;]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        }
        if (!Array.isArray(parsed[field])) {
          parsed[field] = [];
        }
      }
      return parsed;
    } catch {
      throw new Error('JD extraction response was not valid JSON');
    }
  }

  /**
   * Parse resume text into structured data using regex patterns and section detection
   */
  private parseResume(text: string): any {
    const identity = this.extractIdentity(text);
    const summary = this.extractSummary(text);
    const skills = this.extractSkillsStructured(text);
    const skillsFlat = Object.values(skills).flat() as string[];
    const experience = this.extractExperienceStructured(text);
    const education = this.extractEducationStructured(text);
    
    // Calculate total experience years from experience entries
    let totalExperienceYears = 0;
    experience.forEach((exp: any) => {
      if (exp.yearsOfExperience) {
        totalExperienceYears += exp.yearsOfExperience;
      }
    });

    return {
      identity,
      summary,
      skills,
      skillsFlat,
      experience,
      experienceCount: experience.length,
      education,
      educationCount: education.length,
      projects: [],
      achievements: [],
      certifications: [],
      leadership: [],
      // Add the totalExperienceYears for profile display
      totalExperienceYears: Math.round(totalExperienceYears * 10) / 10,
    };
  }

  /**
   * Extract identity information (name, email, phone, location)
   */
  private extractIdentity(text: string): any {
    const lines = text.split('\n');
    
    // Extract email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';
    
    // Extract phone
    const phoneMatch = text.match(/(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '';
    
    // Extract location (look for city, state/country patterns)
    let location = '';
    const locationMatch = text.match(/(?:Location|Located in|Based in|City):?\s*([^\n,]+(?:,\s*[A-Z]{2})?)/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
    }
    
    // Extract name - assume first line or line with only capitalized words
    let name = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 0 && trimmed.length < 100) {
        // Check if line looks like a name (mostly capitalized words, not a section header)
        if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed) && !trimmed.toLowerCase().match(/^(experience|education|skills|projects|certifications|summary|objective)/i)) {
          name = trimmed;
          break;
        }
      }
    }
    
    return {
      name,
      email,
      location,
      phone,
      links: this.extractLinks(text),
    };
  }

  /**
   * Extract links from text (LinkedIn, GitHub, portfolio)
   */
  private extractLinks(text: string): string[] {
    const links: string[] = [];
    const urlMatch = text.match(/https?:\/\/[^\s]+/g);
    if (urlMatch) {
      links.push(...urlMatch.slice(0, 5)); // Limit to 5 links
    }
    return links;
  }

  /**
   * Extract professional summary
   */
  private extractSummary(text: string): string {
    // Look for summary section
    const summaryMatch = text.match(/(?:Professional\s+)?Summary|Objective|About|Profile[\s\n]+([^\n]*(?:\n(?!(?:Experience|Education|Skills|Projects|Certifications))[^\n]*)*)/i);
    if (summaryMatch && summaryMatch[1]) {
      const summary = summaryMatch[1].trim().split('\n')[0];
      return summary.substring(0, 200); // Cap at 200 chars
    }
    return '';
  }

  /**
   * Extract skills organized by category
   */
  private extractSkillsStructured(text: string): Record<string, string[]> {
    const skills: Record<string, string[]> = {
      'Programming': [],
      'Frontend': [],
      'Backend': [],
      'Databases': [],
      'Cloud': [],
      'Tools': [],
      'Other': [],
    };

    // Define skill mappings by category
    const programmingLangs = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 'php', 'ruby', 'kotlin', 'swift'];
    const frontendFrameworks = ['react', 'vue', 'angular', 'svelte', 'nextjs', 'next.js', 'nuxt', 'ember'];
    const backendFrameworks = ['node', 'express', 'fastapi', 'django', 'flask', 'spring', 'rails', 'laravel'];
    const databases = ['sql', 'postgresql', 'mysql', 'mongodb', 'dynamodb', 'redis', 'cassandra', 'firebase'];
    const cloudServices = ['aws', 'gcp', 'azure', 'heroku', 'digitalocean', 'kubernetes', 'docker'];
    const tools = ['git', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'rest', 'graphql', 'grpc'];

    const lowerText = text.toLowerCase();

    // Extract programming languages
    programmingLangs.forEach(lang => {
      if (lowerText.includes(lang) && !skills['Programming'].includes(lang)) {
        skills['Programming'].push(lang);
      }
    });

    // Extract frontend frameworks
    frontendFrameworks.forEach(fw => {
      if (lowerText.includes(fw) && !skills['Frontend'].includes(fw)) {
        skills['Frontend'].push(fw);
      }
    });

    // Extract backend frameworks
    backendFrameworks.forEach(fw => {
      if (lowerText.includes(fw) && !skills['Backend'].includes(fw)) {
        skills['Backend'].push(fw);
      }
    });

    // Extract databases
    databases.forEach(db => {
      if (lowerText.includes(db) && !skills['Databases'].includes(db)) {
        skills['Databases'].push(db);
      }
    });

    // Extract cloud services
    cloudServices.forEach(cs => {
      if (lowerText.includes(cs) && !skills['Cloud'].includes(cs)) {
        skills['Cloud'].push(cs);
      }
    });

    // Extract tools
    tools.forEach(tool => {
      if (lowerText.includes(tool) && !skills['Tools'].includes(tool)) {
        skills['Tools'].push(tool);
      }
    });

    // Remove empty categories
    Object.keys(skills).forEach(cat => {
      if (skills[cat].length === 0) {
        delete skills[cat];
      }
    });

    return skills;
  }

  /**
   * Extract experience with structured data
   */
  private extractExperienceStructured(text: string): any[] {
    const experience: any[] = [];
    
    // Split text into potential experience entries using common delimiters
    // Look for patterns like "Title at Company" or "Title | Company"
    const expPattern = /(?:^|\n)([^•\-\n]*?(?:Engineer|Manager|Developer|Designer|Analyst|Specialist|Architect|Lead|Senior|Junior|Consultant|Director|VP|CTO|CEO|CFO|Product|Data|Sales|Marketing)[^•\-\n]*?)(?:\n|•|\-)([^\n]*?)(?=\n(?:[A-Z]|•|\-)|\n\n|$)/gmi;
    
    let match;
    while ((match = expPattern.exec(text)) !== null) {
      const title = match[1]?.trim() || '';
      const details = match[2]?.trim() || '';
      
      if (title.length > 0) {
        // Extract company from details or title
        let company = '';
        const companyMatch = details.match(/(?:at|with|@|for)\s+([^\n,]+)/i) || title.match(/at\s+([^\n,]+)/i);
        if (companyMatch) {
          company = companyMatch[1].trim();
        }
        
        // Estimate years of experience based on date patterns
        let yearsOfExperience = 0;
        const dateMatch = details.match(/(\d{1,2})?\s*(?:years?|yrs?)/i);
        if (dateMatch && dateMatch[1]) {
          yearsOfExperience = parseInt(dateMatch[1], 10);
        }
        
        experience.push({
          role: title.length > 50 ? title.substring(0, 50) : title,
          company: company.length > 50 ? company.substring(0, 50) : company,
          yearsOfExperience,
          description: details.length > 200 ? details.substring(0, 200) : details,
        });
      }
    }
    
    // If regex didn't find anything, try simpler bullet-point parsing
    if (experience.length === 0) {
      const bulletPoints = text.split(/\n/).filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'));
      bulletPoints.slice(0, 5).forEach(bullet => {
        const cleaned = bullet.replace(/^[•\-]\s*/, '').trim();
        if (cleaned.length > 0) {
          experience.push({
            role: cleaned.substring(0, 50),
            company: '',
            yearsOfExperience: 0,
            description: cleaned.substring(0, 100),
          });
        }
      });
    }
    
    return experience.slice(0, 10); // Return top 10 roles
  }

  /**
   * Extract education with structured data
   */
  private extractEducationStructured(text: string): any[] {
    const education: any[] = [];
    
    // Look for degree patterns like "Bachelor of Science in Computer Science" or "BS Computer Science"
    const degreePattern = /(?:^|\n)(?:Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|MBA|M\.?B\.?A\.?|B\.?Tech|M\.?Tech|Associate)[\s\.,]([^\n]+?)(?:\n|,|$)/gmi;
    
    let match;
    while ((match = degreePattern.exec(text)) !== null) {
      const degree = match[0].trim();
      const field = match[1]?.trim() || '';
      
      if (degree.length > 0) {
        education.push({
          degree,
          field: field.length > 100 ? field.substring(0, 100) : field,
          school: '', // Would need more sophisticated extraction
          graduationDate: '',
        });
      }
    }
    
    return education.slice(0, 5); // Return top 5 degrees
  }

  /**
   * Parse JD text into structured data
   */
  private parseJD(text: string): any {
    const title = this.extractJobTitle(text);
    const company = this.extractCompanyName(text);
    const location = this.extractJobLocation(text);
    const responsibilities = this.extractResponsibilities(text);
    const requirements = this.extractRequirements(text);
    const qualifications = this.extractQualifications(text);
    const compensation = this.extractCompensation(text);
    const benefits = this.extractBenefits(text);

    return {
      title,
      company,
      location,
      description: text,
      responsibilities,
      qualifications,
      requirements,
      compensation,
      benefits,
      min_years_experience: this.extractMinimumExperience(text),
    };
  }

  /**
   * Extract job title from JD
   */
  private extractJobTitle(text: string): string {
    // Try to find job title patterns
    const titlePatterns = [
      /(?:Job\s+Title|Title|Position):?\s*([^\n,]+)/i,
      /^([A-Z][a-z\s]+(?:Engineer|Manager|Developer|Designer|Analyst|Scientist|Architect|Lead|Senior|Junior|Consultant|Director|Manager|Officer|Specialist)\b[^\n,]*)/mi,
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length < 100 && !title.toLowerCase().includes('job description')) {
          return title;
        }
      }
    }

    return '';
  }

  /**
   * Extract company name from JD
   */
  private extractCompanyName(text: string): string {
    // Try to find company name patterns
    const companyPatterns = [
      /(?:Company|Employer|Organization):?\s*([^\n,]+)/i,
      /(?:About\s+)?(?:Company|We|Our company|We are)\s*([^\n.]+(?:Inc|Corp|LLC|Ltd|Co|Company|Group)?)/i,
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim().split('\n')[0];
        if (company.length < 100 && company.length > 2) {
          return company;
        }
      }
    }

    return '';
  }

  /**
   * Extract job location from JD
   */
  private extractJobLocation(text: string): string {
    // Try to find location patterns
    const locationPatterns = [
      /(?:Location|Where|Based|Office):?\s*([^\n,]+(?:,\s*[A-Z]{2})?)/i,
      /([A-Za-z]+(?:\s+[A-Za-z]+)*),?\s*(?:CA|NY|TX|FL|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MD|MO|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|UT|MS|NV|AR|KS|NM|NE|ID|HI|NH|ME|MT|RI|DE|SD|ND|AK|VT|WY|DC)\b/i,
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim().split('\n')[0];
        if (location.length < 100 && location.length > 2) {
          return location;
        }
      }
    }

    return '';
  }

  /**
   * Extract minimum years of experience required
   */
  private extractMinimumExperience(text: string): number {
    const experiencePatterns = [
      /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
      /experience:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    ];

    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    return 0;
  }

  /**
   * Extract responsibilities from JD
   */
  private extractResponsibilities(text: string): string[] {
    const lines = text.split('\n')
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
      .map(l => l.trim().replace(/^[-•]\s*/, ''));
    return lines.slice(0, 10); // Return first 10 bullet points
  }

  /**
   * Extract qualifications from JD
   */
  private extractQualifications(text: string): string[] {
    // Look for qualifications section
    const qualMatch = text.match(/(?:Required\s+)?Qualifications:?([\s\S]*?)(?=\n\n|Requirements:|Responsibilities:|Benefits:|$)/i);
    if (qualMatch && qualMatch[1]) {
      return this.extractBulletPoints(qualMatch[1]).slice(0, 10);
    }
    return [];
  }

  /**
   * Extract requirements from JD
   */
  private extractRequirements(text: string): string[] {
    // Look for requirements section
    const reqMatch = text.match(/(?:Required\s+)?Requirements:?([\s\S]*?)(?=\n\n|Qualifications:|Responsibilities:|Benefits:|$)/i);
    if (reqMatch && reqMatch[1]) {
      return this.extractBulletPoints(reqMatch[1]).slice(0, 10);
    }

    // If no explicit requirements section, extract key technical requirements
    const skills = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'react', 'vue', 'angular', 'node', 'sql', 'aws', 'gcp', 'docker', 'kubernetes'];
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    skills.forEach(skill => {
      if (lowerText.includes(skill) && !found.includes(skill)) {
        found.push(skill);
      }
    });

    return found;
  }

  /**
   * Extract benefits from JD
   */
  private extractBenefits(text: string): string[] {
    // Look for benefits section
    const benefitsMatch = text.match(/Benefits?:?([\s\S]*?)(?=\n\n|Requirements:|Qualifications:|Responsibilities:|$)/i);
    if (benefitsMatch && benefitsMatch[1]) {
      return this.extractBulletPoints(benefitsMatch[1]).slice(0, 10);
    }

    // Look for common benefits keywords
    const benefitKeywords = ['health', 'dental', 'vision', 'insurance', 'retirement', '401k', 'pto', 'vacation', 'remote', 'flexible'];
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    benefitKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        found.push(keyword);
      }
    });

    return found;
  }

  /**
   * Extract compensation from JD
   */
  private extractCompensation(text: string): any {
    // Look for salary/compensation patterns
    const salaryMatch = text.match(/\$[\d,]+(?:\s*-\s*\$?[\d,]+)?|\d+k\s*-\s*\d+k/i);
    const compensation: any = {};

    if (salaryMatch) {
      compensation.salary_range = salaryMatch[0];
    }

    // Look for equity
    const equityMatch = text.match(/equity|stock|options/i);
    if (equityMatch) {
      compensation.includes_equity = true;
    }

    // Look for bonus
    const bonusMatch = text.match(/bonus|incentive/i);
    if (bonusMatch) {
      compensation.includes_bonus = true;
    }

    return compensation;
  }

  /**
   * Helper method to extract bullet points from text
   */
  private extractBulletPoints(text: string): string[] {
    return text.split('\n')
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().startsWith('*'))
      .map(l => l.trim().replace(/^[-•*]\s*/, '').trim())
      .filter(l => l.length > 0);
  }

  /**
   * Get profile status
   */
  getStatus(): ProfileStatus {
    return {
      hasResume: this.activeResume !== null,
      hasJD: this.activeJD !== null,
      hasCompany: this.activeCompany !== null,
      lastResumeUpdate: this.activeResume ? new Date().toISOString() : undefined,
      lastJDUpdate: this.activeJD ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Get profile data
   * 
   * Returns flattened resume data directly to match the UI contract.
   * The UI expects fields like identity, skills, experience directly on the returned object.
   */
  getProfileData(): ProfileData {
    // If we have an active resume, return its structured_data (the parsed resume).
    // The structured_data contains the full set of fields: identity, skills, experience, etc.
    if (this.activeResume?.structured_data) {
      return {
        ...this.activeResume.structured_data,
        resume: this.activeResume,
        jd: this.activeJD?.structured_data,
        company: this.activeCompany,
        hasActiveJD: !!this.activeJD?.structured_data,
        activeJD: this.activeJD?.structured_data,
        nodeCount: 0,  // Placeholder: would be populated by embedding pipeline
        projectCount: Array.isArray(this.activeResume.structured_data.projects) ? this.activeResume.structured_data.projects.length : 0,
      };
    }

    // JD-only case: return the JD with contract fields so getProfileData() never returns null
    if (this.activeJD?.structured_data) {
      return {
        hasActiveJD: true,
        activeJD: this.activeJD.structured_data,
        resume: null,
        jd: this.activeJD.structured_data,
        company: this.activeCompany,
        nodeCount: 0,
        projectCount: 0,
      };
    }

    // Fallback: return the original wrapped structure (for backwards compatibility)
    return {
      resume: this.activeResume,
      jd: this.activeJD?.structured_data,
      company: this.activeCompany,
      hasActiveJD: false,
      activeJD: null,
      nodeCount: 0,
      projectCount: 0,
    };
  }

  /**
   * Get knowledge mode status
   */
  isKnowledgeMode(): boolean {
    return this.knowledgeMode;
  }

  /**
   * Set knowledge mode
   */
  setKnowledgeMode(enabled: boolean): void {
    this.knowledgeMode = enabled;
    console.log(`[KnowledgeOrchestrator] Knowledge mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Delete documents by type and reset knowledge mode if resume is deleted
   */
  deleteDocumentsByType(docType: DocType): void {
    switch (docType) {
      case DocType.RESUME:
        this.activeResume = null;
        // RC-8: disable knowledge mode if resume is deleted (JD alone can't run the mode)
        this.knowledgeMode = false;
        break;
      case DocType.JD:
        this.activeJD = null;
        break;
      case DocType.COMPANY:
        this.activeCompany = null;
        break;
    }

    // Delete from database
    try {
      const isRealDbManager = typeof (this.db as any).isAvailable === 'function';
      const isKnowledgeDbManager = typeof (this.db as any).getDb === 'function';
      
      let sqliteDb: any = null;
      
      if (isRealDbManager) {
        // This is a real DatabaseManager
        if (!(this.db as any).isAvailable()) {
          console.warn('[KnowledgeOrchestrator] Database not available for deletion');
          console.log(`[KnowledgeOrchestrator] Deleted ${docType} documents`);
          return;
        }
        sqliteDb = (this.db as any).getDb();
      } else if (isKnowledgeDbManager) {
        // This is a KnowledgeDatabaseManager (stub or test)
        sqliteDb = (this.db as any).getDb?.();
      }
      
      if (sqliteDb) {
        sqliteDb.prepare('DELETE FROM profile_documents WHERE doc_type = ?').run(docType);
        console.log(`[KnowledgeOrchestrator] Deleted ${docType} documents from database`);
      }
    } catch (dbError) {
      console.error('[KnowledgeOrchestrator] Failed to delete from database:', dbError);
    }

    console.log(`[KnowledgeOrchestrator] Deleted ${docType} documents`);
  }

  /**
   * The manual company-research IPC expects a stable provider-aware facade.
   * Never fabricate a dossier when no search provider is configured. The
   * standalone app currently disables network company search by policy.
   */
  getCompanyResearchEngine(): any {
    if (this.companyResearchApi) return this.companyResearchApi;
    const dossiers = this.companyDossier;
    const api = {
      searchProvider: null as any,
      quotaExhausted: false,
      setSearchProvider(provider: any): void {
        api.searchProvider = provider && typeof provider.search === 'function' ? provider : null;
      },
      getCachedDossier(name: string): any {
        const key = String(name || '').trim().toLowerCase();
        const cached = dossiers.get(key);
        if (!cached || Date.now() - cached.cachedAt > 24 * 60 * 60 * 1000) return null;
        return cached.dossier;
      },
      async researchCompany(name: string, _jobContext?: any, useCache = true): Promise<any> {
        const company = String(name || '').trim();
        if (!company) return null;
        if (useCache) {
          const cached = api.getCachedDossier(company);
          if (cached) return cached;
        }
        if (!api.searchProvider) return null;
        const result = await searchCompanyInfo(company, api.searchProvider);
        if (!result) return null;
        // Only fields that the actual search returned are populated. In
        // particular, do not invent a hiring strategy, values, or salary data.
        const dossier = {
          company_name: company,
          description: result.research.description ?? '',
          industry: result.research.industry ?? null,
          technologies: result.research.technologies ?? [],
          locations: result.research.locations ?? [],
          sources: result.sources ?? [],
          research_timestamp: result.timestamp,
          degraded: false,
        };
        if (useCache) dossiers.set(company.toLowerCase(), { dossier, cachedAt: Date.now() });
        return dossier;
      },
    };
    this.companyResearchApi = api;
    return api;
  }

  /**
   * Get role insight service
   */
  getRoleInsightService(): any {
    return {
      analyzeRole: async (jobDescription: string, resume: string): Promise<{
        insights: unknown[];
        gaps: unknown[];
      }> => {
        // Placeholder for role analysis
        return { insights: [], gaps: [] };
      },
    };
  }

  /**
   * Placeholder: Attach role insight (for SQLite table access)
   */
  attachRoleInsight?(sqliteDb: any): void {
    // Placeholder for role insight attachment
    console.log('[KnowledgeOrchestrator] Role insight attached');
  }

  /**
   * Placeholder: Ensure embedding space
   */
  async ensureEmbeddingSpace(): Promise<void> {
    // Placeholder for embedding space setup
    console.log('[KnowledgeOrchestrator] Embedding space ensured');
  }

  /**
   * Generate negotiation script on demand
   */
  async generateNegotiationScriptOnDemand(): Promise<string | null> {
    if (!this.generateContentFn) return null;
    
    try {
      const prompt = this.buildNegotiationScriptPrompt();
      return await this.generateContentFn([{ text: prompt }]);
    } catch (error) {
      console.error('[KnowledgeOrchestrator] Negotiation script generation failed:', error);
      return null;
    }
  }

  /**
   * Generate cover letter on demand
   */
  async generateCoverLetterOnDemand(): Promise<string | null> {
    if (!this.generateContentFn) return null;
    
    try {
      const prompt = this.buildCoverLetterPrompt();
      return await this.generateContentFn([{ text: prompt }]);
    } catch (error) {
      console.error('[KnowledgeOrchestrator] Cover letter generation failed:', error);
      return null;
    }
  }

  private cloudQueryEmbedder<T>(rawFn: (text: string) => Promise<T[]>): (text: string) => Promise<T[]> {
    return async (text: string) => {
      const QUERY_EMBED_BUDGET_MS = 300;
      try {
        return await Promise.race([
          rawFn(text),
          new Promise<T[]>((resolve) => {
            setTimeout(() => resolve([]), QUERY_EMBED_BUDGET_MS);
          }),
        ]);
      } catch {
        return [];
      }
    };
  }

  private resolveQueryEmbedder(): ((text: string) => Promise<any[]>) | null {
    const rawEmbedder = this.embedQueryFn ?? this.fastQueryEmbedFn ?? this.embedFn;
    if (!rawEmbedder) return null;
    if (typeof rawEmbedder === 'function') {
      return this.cloudQueryEmbedder((text: string) => rawEmbedder(text) as Promise<any[]>);
    }
    return null;
  }

  /**
   * Only an explicitly extracted, well-formed resume salary estimate may be
   * exposed as a derived PROFILE_FACT. Persisted structured_data is the single
   * source of truth and is loaded again on restart. Never invent numbers or
   * serve a stale estimate from a deleted/replaced resume.
   */
  getResumeSalaryEstimate(): Record<string, unknown> | null {
    const estimate = this.activeResume?.structured_data?.salary_estimate;
    if (!estimate || typeof estimate !== 'object' || Array.isArray(estimate)) return null;
    const min = Number(estimate.min);
    const max = Number(estimate.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return null;
    if (typeof estimate.min !== 'number' || typeof estimate.max !== 'number') return null;
    if (typeof estimate.currency !== 'string' || !/^[A-Z]{3}$/.test(estimate.currency)) return null;
    return { ...estimate, min, max };
  }

  /**
   * Process question with profile grounding
   */
  async processQuestion(question: string): Promise<any> {
    const normalized = typeof question === 'string' ? question.trim() : '';
    if (!normalized || !this.knowledgeMode) return null;

    // This compatibility surface is also called by older typed-chat clients.
    // Honor their explicit conversation hint for short compensation follow-ups,
    // but never use it to authorize resume/JD retrieval. Provider failure must
    // not crash factual question handling or expose any private documents.
    let conversationHint: { recentIntentWasNegotiation?: boolean; recentInterviewerComp?: boolean; negotiationActive?: boolean } = {};
    try { conversationHint = this.conversationContextProvider?.() ?? {}; } catch { /* optional hint unavailable */ }
    const classifiedIntent = classifyIntentWithContext(normalized, conversationHint);
    // Category-only diagnostic: never log query text, transcript or content.
    console.log('[KnowledgeOrchestrator] Intent classified:', classifiedIntent);
    if (classifiedIntent === 'negotiation') {
      return {
        question: normalized, answer: null, sources: [], answerType: 'negotiation',
        resumeAllowed: false, factualRecall: false, liveNegotiationResponse: null,
      };
    }

    const profile = this.activeResume?.structured_data ?? this.activeResume ?? null;
    const qLower = normalized.toLowerCase();
    const plan = planAnswer({ question: normalized, source: 'manual_input', speakerPerspective: 'user' });
    const canonicalResumeAllowed = Boolean(plan && plan.profileContextPolicy === 'required' && isLayerAllowed(plan, 'resume'));
    const jdAllowed = Boolean(plan?.requiredContextLayers.includes('jd') && isLayerAllowed(plan, 'jd'));
    if (!(canonicalResumeAllowed && profile) && !(jdAllowed && this.activeJD)) return null;

    const isIntroQuestion = (() => {
      const introPatterns = [
        'tell me about yourself', 'give me a quick introduction', 'brief introduction', 'self-introduction',
        'introducing yourself', 'brief intro', 'self intro', 'introduce yourself', 'describe yourself',
        'how would you describe yourself', 'summarize who you are', 'tell us a little about yourself',
        'give me your background', 'who are you as a candidate', 'walk me through your background',
        'what is my name', 'who am i', 'what is your name', 'what are my skills', 'what do i do',
      ];
      return introPatterns.some((pattern) => qLower.includes(pattern)) || /\b(i am|i'm|my name|who am i|what is my name|what's my name|what do i do|what have i built|what've i shipped)\b/.test(qLower);
    })();

    const isNegotiation = /\b(salary|compensation|equity|bonus|offer|package|counter|negotiat)\b/.test(qLower);
    if (isNegotiation) {
      return {
        answer: normalized ? `Profile-grounded answer for: ${normalized}` : null,
        question: normalized,
        sources: [],
        answerType: plan?.answerType ?? 'negotiation',
        resumeAllowed: false,
        factualRecall: false,
        liveNegotiationResponse: null,
      };
    }

    if (isGenericKnowledgeQuestion(normalized) && !canonicalResumeAllowed && !jdAllowed) {
      return null;
    }

    const answer = normalized ? `Profile-grounded answer for: ${normalized}` : null;

    const leadershipEntries = canonicalResumeAllowed && Array.isArray(profile?.leadership) ? profile.leadership : [];
    const leadershipMatches = leadershipEntries.filter((entry: any) => {
      const org = String(entry?.organization || entry?.company || '').toLowerCase();
      return org && (qLower.includes(org) || /\b(role at|for)\b/.test(qLower) || /\b(leadership|led|managed|head|president|coordinator|director)\b/.test(qLower));
    });

    // Profile V2 uses typed, deterministic evidence for explicitly authorized
    // profile answers, not RAG score thresholds or unscoped personal search.
    // A forbidden resume/JD layer is never passed to this builder. This path
    // does not run for generic technical/coding questions.
    // A named-project drill-in must not leak sibling project descriptions.
    // Canonical RAG remains the authority for project documents/IDs; this
    // compatibility formatter only narrows the structured résumé projection.
    let authorizedResume = canonicalResumeAllowed ? this.activeResume : null;
    if (authorizedResume && /^(?:project_answer|project_followup_answer)$/.test(plan.answerType)
        && /\b(?:my|your|the|a)\s+project\s+[\w]/i.test(normalized)) {
      const projects = Array.isArray(profile?.projects) ? profile.projects : [];
      const escapeName = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const selected = [...projects]
        .sort((a: any, b: any) => String(b?.name ?? b?.title ?? '').length - String(a?.name ?? a?.title ?? '').length)
        .find((project: any) => {
          const name = String(project?.name ?? project?.title ?? '').trim();
          return name.length > 0 && new RegExp(`\\b(?:my|your|the|a)\\s+project\\s+${escapeName(name)}(?=\\s|[?!.,]|$)`, 'i').test(normalized);
        });
      // An unknown named project supplies zero PROJECT evidence, never a
      // fallback to sibling project descriptions.
      authorizedResume = {
        ...authorizedResume,
        structured_data: { ...profile, projects: selected ? [selected] : [] },
      };
    }
    // A plain skills inventory must not send every previous employer and
    // project to the answer provider. Skill-experience probes keep experience
    // and projects because those are evidence for actual use of a technology.
    if (authorizedResume && plan.answerType === 'skills_answer') {
      authorizedResume = {
        ...authorizedResume,
        structured_data: {
          ...authorizedResume.structured_data,
          experience: [], projects: [], education: [], achievements: [],
          certifications: [], leadership: [],
        },
      };
    }
    // Even with V2 explicitly disabled, the legacy formatter must receive
    // only the same narrowed structured résumé projection.
    const contextAssembly = ContextAssembler.assembleContext(
      authorizedResume, jdAllowed ? this.activeJD : null, null, normalized,
    );
    const v2Block = isProfileGroundingV2Enabled()
      ? buildGroundingBlock(
          authorizedResume,
          jdAllowed ? this.activeJD : null,
        ).block
      : '';
    let contextBlock = v2Block || contextAssembly.contextBlock || '';
    if (!v2Block && leadershipMatches.length > 0 && !contextBlock.includes('<candidate_leadership>')) {
      contextBlock += `\n<candidate_leadership>\n${leadershipMatches.map((entry: any) => `${entry.role || 'Leadership'} at ${entry.organization || entry.company || 'Organization'}${entry.description ? ` — ${entry.description}` : ''}`).join('\n')}\n</candidate_leadership>`;
    }

    if (!contextBlock && canonicalResumeAllowed && profile?.identity?.name) {
      contextBlock = `<candidate_identity>\nName: ${profile.identity.name}\n</candidate_identity>`;
    }

    if (isIntroQuestion && canonicalResumeAllowed && profile) {
      const introResponse = generateCandidateIntro(profile, normalized);
      return {
        answer,
        question: normalized,
        sources: ['resume'],
        answerType: plan?.answerType ?? 'intro',
        resumeAllowed: canonicalResumeAllowed,
        factualRecall: true,
        isIntroQuestion: true,
        introResponse,
        contextBlock: contextBlock || `<candidate_identity>\nName: ${profile.identity?.name || profile.name}\n</candidate_identity>`,
      };
    }

    const containsProfileContent = /candidate_(identity|experience|projects|education|achievements|certifications|skills|leadership)/.test(contextBlock);
    return {
      answer,
      question: normalized,
      sources: contextAssembly.sources || ['resume'],
      answerType: plan?.answerType ?? 'profile_detail',
      resumeAllowed: canonicalResumeAllowed,
      factualRecall: containsProfileContent || Boolean(contextBlock),
      isIntroQuestion: false,
      contextBlock,
    };
  }

  /**
   * Build negotiation script prompt
   */
  private buildNegotiationScriptPrompt(): string {
    const resume = this.activeResume?.structured_data;
    const jd = this.activeJD?.structured_data;
    
    return `Generate a negotiation script based on:
Resume: ${JSON.stringify(resume)}
Job Description: ${JSON.stringify(jd)}`;
  }

  /**
   * Build cover letter prompt
   */
  private buildCoverLetterPrompt(): string {
    const resume = this.activeResume?.structured_data;
    const jd = this.activeJD?.structured_data;
    
    return `Generate a cover letter based on:
Resume: ${JSON.stringify(resume)}
Job Description: ${JSON.stringify(jd)}`;
  }
}

// Re-export types
export { DocType, DocumentIngestResult, ProfileStatus, ProfileData } from './types';
