import type { CanonicalRagChunk, CanonicalRagDocument } from './CanonicalRagTypes';

export interface CanonicalRagSourceFilter {
  sourceType: string;
  sourceId?: string;
  /** Allowlist of original source IDs; an empty list authorizes no rows. */
  sourceIds?: readonly string[];
  /** Legacy personal-file category, such as project. */
  fileType?: string;
  /** Optional owner isolation when an authorized owner identity is available. */
  ownerId?: string;
  scopeId?: string;
}

export interface CanonicalRagLexicalSearchOptions extends CanonicalRagSourceFilter {
  limit?: number;
}

export interface CanonicalRagLexicalSearchResult {
  chunk: CanonicalRagChunk;
  document: CanonicalRagDocument;
  score: number;
}

export interface CanonicalRagVectorSearchOptions extends CanonicalRagSourceFilter {
  embeddingSpaceId: string;
  limit?: number;
}

export interface CanonicalRagVectorSearchResult {
  chunk: CanonicalRagChunk;
  document: CanonicalRagDocument;
  embeddingSpaceId: string;
  physicalRowKey: number;
  distance: number;
}
