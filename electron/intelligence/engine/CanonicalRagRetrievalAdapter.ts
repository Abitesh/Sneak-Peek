/**
 * Change 17 — explicit adapter from canonical RAG reads to Sneak-Peek evidence.
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
import type { SneakPeekEvidenceItem } from './types';
import type { RagSearchResult } from '../../rag/storage/RagStorageTypes';
import type { RetrievalCapability, RetrievalCapabilityRequest } from './RetrievalCoordinator';

export type CanonicalRagSource = 'meeting' | 'mode' | 'personal';

export interface CanonicalRagReadInput {
  query: string;
  sourceType: CanonicalRagSource;
  sourceId?: string;
  scopeId?: string;
  sessionId?: string;
  limit: number;
  tokenBudget?: number;
  projectFilesOnly?: boolean;
  projectFileIds?: readonly string[];
  ownerId?: string;
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
  source: Extract<ContextSource, 'meeting_transcript' | 'mode_documents' | 'personal_knowledge' | 'my_files' | 'project_knowledge'>;
  sourceType: CanonicalRagSource;
  limit?: number;
  tokenBudget?: number;
  resolveScope?: (input: Pick<RetrievalCapabilityRequest, 'request' | 'contextPlan'>) => {
    sourceId?: string;
    scopeId?: string;
    projectFilesOnly?: boolean;
    projectFileIds?: readonly string[];
    ownerId?: string;
  };
}

function toEvidenceItem(result: RagSearchResult, source: ContextSource, index: number, usedCanonical: boolean, fallbackReason?: CanonicalRagReadOutput['fallbackReason']): SneakPeekEvidenceItem | null {
  const content = String(result.chunk?.text ?? '').trim();
  if (!content) return null;
  const chunkMetadata = result.chunk?.metadata ?? {};
  const sourceDocumentId = String(result.chunk?.documentId ?? result.source?.id ?? '');
  const canonicalDocumentId = typeof chunkMetadata.canonicalDocumentId === 'string'
    ? chunkMetadata.canonicalDocumentId
    : undefined;
  const canonicalRevisionId = typeof chunkMetadata.canonicalRevisionId === 'string'
    ? chunkMetadata.canonicalRevisionId
    : undefined;
  const canonicalContentHash = typeof chunkMetadata.canonicalContentHash === 'string'
    ? chunkMetadata.canonicalContentHash
    : undefined;
  const sourceLocator = typeof chunkMetadata.sourceLocator === 'string'
    ? chunkMetadata.sourceLocator
    : undefined;

  return {
    id: String(result.chunk?.id ?? result.source?.id ?? `${source}-${index}`),
    source,
    content,
    score: Number(result.rerankScore ?? result.rrfScore ?? result.semanticScore ?? result.score ?? 0),
    metadata: {
      sourceId: String(result.source?.id ?? result.chunk?.documentId ?? ''),
      sourceDocumentId,
      sourceType: result.source?.sourceType,
      documentId: canonicalDocumentId ?? sourceDocumentId,
      canonicalDocumentId,
      canonicalRevisionId,
      canonicalChunkId: canonicalDocumentId ? result.chunk?.id : undefined,
      canonicalContentHash,
      contentHash: canonicalContentHash,
      sourceLocator,
      documentName: String(result.source?.name ?? ''),
      page: result.chunk?.pageStart,
      pageStart: result.chunk?.pageStart,
      pageEnd: result.chunk?.pageEnd,
      section: result.chunk?.section ?? result.chunk?.heading,
      heading: result.chunk?.heading,
      chunkId: result.chunk?.id,
      pointer: {
        chunkId: result.chunk?.id,
        ...(result.source?.sourceType === 'meeting' ? { meetingId: result.source.id } : { fileId: result.source?.id }),
        page: result.chunk?.pageStart,
        section: result.chunk?.section,
      },
      speaker: result.chunk?.speaker,
      timestampStart: result.chunk?.timestampStart,
      timestampEnd: result.chunk?.timestampEnd,
      chunkIndex: result.chunk?.chunkIndex,
      retrievalSource: usedCanonical ? 'canonical-rag-adapter' : 'source-fallback',
      ...(!usedCanonical ? { fallbackReason: fallbackReason ?? 'unknown' } : {}),
    },
  };
}

/** Build a RetrievalCoordinator-compatible capability without granting it source-selection authority. */
export function createCanonicalRagRetrievalCapability(options: CanonicalRagRetrievalAdapterOptions): RetrievalCapability {
  return {
    source: options.source,
    async retrieve(input: RetrievalCapabilityRequest) {
      if (input.signal?.aborted) return { items: [], metadata: { cancelled: true } };

      const scope = options.resolveScope?.({ request: input.request, contextPlan: input.contextPlan }) ?? {};
      const result = await options.read({
        query: input.query,
        sourceType: options.sourceType,
        sourceId: scope.sourceId,
        scopeId: scope.scopeId,
        sessionId: input.request.sessionId,
        limit: Math.max(1, Math.min(50, Math.floor(options.limit ?? 8))),
        tokenBudget: Math.max(1, Math.floor(options.tokenBudget ?? 1800)),
        projectFilesOnly: scope.projectFilesOnly,
        projectFileIds: scope.projectFileIds,
        ownerId: scope.ownerId,
        signal: input.signal,
      });

      if (input.signal?.aborted) return { items: [], metadata: { cancelled: true } };
      // Recheck the coordinator's project scope at the final evidence boundary.
      // An ID on its own does not authorize a personal/resume file as project
      // evidence, even if a buggy source reader returns it.
      const items = result.results
        .filter((item) => (options.sourceType !== 'meeting' || scope.sourceId === undefined
          || (item.source?.sourceType === 'meeting' && item.source?.id === scope.sourceId))
          && (scope.projectFileIds === undefined || scope.projectFileIds.includes(String(item.source?.id ?? '')))
          && (!scope.projectFilesOnly || (
            item.source?.sourceType === 'personal' && item.source?.metadata?.fileType === 'project'
          )))
        .map((item, index) => toEvidenceItem(item, options.source, index, result.usedCanonical, result.fallbackReason))
        .filter((item): item is SneakPeekEvidenceItem => item !== null);

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
