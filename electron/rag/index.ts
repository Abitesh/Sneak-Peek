// electron/rag/index.ts
// Barrel export for RAG modules

export { preprocessTranscript, estimateTokens } from './TranscriptPreprocessor';
export type { RawSegment, CleanedSegment } from './TranscriptPreprocessor';

export { chunkTranscript, formatChunkForContext } from './SemanticChunker';
export type { Chunk } from './SemanticChunker';

export { VectorStore } from './VectorStore';
export type { StoredChunk, ScoredChunk } from './VectorStore';

export { EmbeddingPipeline } from './EmbeddingPipeline';
export type { AppAPIConfig } from './EmbeddingProviderResolver';

export { RAGRetriever } from './RAGRetriever';
export type { RetrievalOptions, RetrievedContext, QueryIntent } from './RAGRetriever';


export { RAGManager } from './RAGManager';
export type { RAGManagerConfig } from './RAGManager';
