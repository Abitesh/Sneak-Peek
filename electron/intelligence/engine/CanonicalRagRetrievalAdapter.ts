/**
 * Change 17 — explicit adapter from canonical RAG reads to Natively evidence.
 *
 * The ContextPlanner / RetrievalCoordinator owns source selection. This
 * adapter accepts an already-selected source and never calls RagQueryPlanner,
 * RAGManager.search(), a provider, or a prompt builder.
 *
 * The caller must provide a source-scoped read function. That keeps database
 * ownership and source-specific fallback policy with RAGManager, where those
 * dependencies currently live, without making the Intelligence Engine depend
 * on Electron or the concrete RAGManager implementation.
 */
import type { ContextSource } from './ContextTypes';
import type { NativelyEvidenceItem } from './types';
import type { RagSearchResult } from '../../rag/storage/RagStorageTypes';

export type CanonicalRagSource = 'meeting' | 'mode' | 'personal';

export interface CanonicalRagReadInput {
  query: string;
  sourceType: CanonicalRagSource;
  sourceId?: string;
  scopeId?: string;
  limit: number;
  signal?: AbortSignal;
}

export interface CanonicalRagReadOutput {
  results: RagSearchResult[];
  usedCanonical: boolean;
  fallbackReason?: 'disabled' | 'empty' | 'error' | null;
}

export interface CanonicalRagRetrievalAdapterOptions {
  /** Must perform a source-scoped canonical read; it must not re-plan sources. */
  read: (input: CanonicalRagReadInput) => Promise<CanonicalRagReadOutput>;
  /** ContextSource chosen by ContextPlanner/RetrievalCoordinator. */
  source: Extract<ContextSource, 'meeting_transcript' | 'mode_documents' | 'personal_knowledge'>;
  sourceType: CanonicalRagSource;
  limit?: number;
  resolveScope?: (input: { request: unknown; contextPlan: unknown }) => {
    sourceId?: string;
    scopeId?: string;
  };
}

export interface CanonicalRagCapabilityInput {
  query: string;
  signal?: AbortSignal;
  request: unknown;
  contextPlan: unknown;
}

function toEvidenceItem(result: RagSearchResult, source: ContextSource, index: number): NativelyEvidenceItem | null {
  const content = String(result.chunk?.text ?? '').trim();
  if (!content) return null;

  return {
    id: String(result.chunk?.id ?? result.source?.id ?? `${source}-${index}`),
    source,
    content,
    score: Number(result.rerankScore ?? result.rrfScore ?? result.semanticScore ?? result.score ?? 0),
    metadata: {
      sourceId: String(result.source?.id ?? result.chunk?.documentId ?? ''),
      sourceType: result.source?.sourceType,
      documentId: String(result.chunk?.documentId ?? ''),
      documentName: String(result.source?.name ?? ''),
      page: result.chunk?.pageStart,
      pageEnd: result.chunk?.pageEnd,
      section: result.chunk?.section ?? result.chunk?.heading,
      speaker: result.chunk?.speaker,
      timestampStart: result.chunk?.timestampStart,
      timestampEnd: result.chunk?.timestampEnd,
      chunkIndex: result.chunk?.chunkIndex,
      canonicalChunkId: result.chunk?.id,
      canonicalRevisionId: result.chunk?.metadata?.revisionId,
      contentHash: result.chunk?.metadata?.contentHash,
      retrievalSource: 'canonical-rag-adapter',
    },
  };
}

/** Build a RetrievalCoordinator-compatible capability without granting it source-selection authority. */
export function createCanonicalRagRetrievalCapability(options: CanonicalRagRetrievalAdapterOptions) {
  return {
    source: options.source,
    async retrieve(input: CanonicalRagCapabilityInput) {
      if (input.signal?.aborted) return { items: [], metadata: { cancelled: true } };

      const scope = options.resolveScope?.({ request: input.request, contextPlan: input.contextPlan }) ?? {};
      const result = await options.read({
        query: input.query,
        sourceType: options.sourceType,
        sourceId: scope.sourceId,
        scopeId: scope.scopeId,
        limit: Math.max(1, Math.min(50, Math.floor(options.limit ?? 8))),
        signal: input.signal,
      });

      if (input.signal?.aborted) return { items: [], metadata: { cancelled: true } };
      const items = result.results
        .map((item, index) => toEvidenceItem(item, options.source, index))
        .filter((item): item is NativelyEvidenceItem => item !== null);

      return {
        items,
        metadata: {
          retrievalBackend: result.usedCanonical ? 'canonical' : 'source-fallback',
          fallbackReason: result.fallbackReason ?? null,
          sourceType: options.sourceType,
          resultCount: items.length,
        },
      };
    },
  };
}
