/**
 * Premium Knowledge Types
 * Core types and enums for Profile Intelligence features
 */

export enum DocType {
  RESUME = 'resume',
  JD = 'jd',
  COMPANY = 'company',
}

export interface DocumentIngestResult {
  success: boolean;
  error?: string;
  documentId?: string;
}

export interface ProfileStatus {
  hasResume: boolean;
  hasJD: boolean;
  hasCompany: boolean;
  lastResumeUpdate?: string;
  lastJDUpdate?: string;
}

export interface ProfileData {
  resume?: any;
  jd?: any;
  company?: any;
  // Returned by KnowledgeOrchestrator.getProfileData(), including JD-only
  // sessions. Keep optional for callers handling older stored profiles.
  hasActiveJD?: boolean;
  activeJD?: any | null;
  nodeCount?: number;
  projectCount?: number;
}

export interface DocumentMetadata {
  type: DocType;
  uploadedAt: string;
  fileName: string;
}
