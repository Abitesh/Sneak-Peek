/**
 * Central, provider-independent contracts for the Sneak-Peek Intelligence Engine.
 *
 * This module intentionally contains data contracts only.  It does not import
 * RAG, Context OS, provider, renderer, or Electron implementation types.
 * Those systems can be adapted to these contracts in later changes without
 * making the engine boundary depend on any one implementation.
 */

import type { RecentConversationContext } from './TranscriptContext';
import type { TurnUnderstanding } from '../../context-intelligence/question/question-resolver';
import type { ContextPlan, ContextSource } from './ContextTypes';
import type { EvidencePack } from '../context-os/evidencePack';
import type { ResponsePlan } from './ResponsePlanner';

export type IntelligenceSurface =
  | 'manual-chat'
  | 'what-to-answer'
  | 'meeting-overlay'
  | 'follow-up'
  | 'recap'
  | 'clarify'
  | 'assist'
  | 'screenshot'
  | 'developer-test';

export type IntelligenceIntent =
  | 'general-question'
  | 'personal-question'
  | 'project-question'
  | 'document-question'
  | 'meeting-question'
  | 'screen-question'
  | 'coding-task'
  | 'system-design'
  | 'follow-up'
  | 'recap'
  | 'clarification'
  | 'ambiguous';

export type IntelligenceResponseType =
  | 'answer'
  | 'spoken-answer'
  | 'coding-answer'
  | 'follow-up-questions'
  | 'recap'
  | 'clarification'
  | 'silent';

export type IntelligenceContextKind =
  | 'conversation'
  | 'transcript'
  | 'manual-question'
  | 'screen'
  | 'mode'
  | 'project'
  | 'profile'
  | 'files'
  | 'memory';

export interface SneakPeekConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: number;
}

export interface SneakPeekTranscriptContext {
  text: string;
  turns?: SneakPeekConversationTurn[];
  startedAt?: number;
  endedAt?: number;
  source?: 'live' | 'meeting' | 'imported';
}

export interface SneakPeekScreenContext {
  text?: string;
  imageId?: string;
  capturedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface SneakPeekActiveContext {
  modeId?: string;
  modeName?: string;
  /** Active meeting identity, kept distinct from projectId for retrieval scope. */
  meetingId?: string;
  projectId?: string;
  projectName?: string;
  /** Authorized original file IDs for an explicitly named project. */
  projectSourceIds?: string[];
  profileId?: string;
  profileName?: string;
}

export interface SneakPeekResponseShapeRequest {
  type?: IntelligenceResponseType;
  maxTokens?: number;
  maxSentences?: number;
  durationSeconds?: number;
  spoken?: boolean;
  concise?: boolean;
  detailed?: boolean;
}

export interface SneakPeekProviderPreferences {
  preferredProvider?: string;
  preferredModel?: string;
  allowedProviders?: string[];
  allowFallback?: boolean;
  maxAttempts?: number;
}

export interface SneakPeekContextPermissions {
  conversation: boolean;
  transcript: boolean;
  screen: boolean;
  mode: boolean;
  project: boolean;
  profile: boolean;
  files: boolean;
  memory: boolean;
  generalKnowledge: boolean;
}

export interface SneakPeekIntelligenceRequest {
  requestId: string;
  sessionId: string;
  surface: IntelligenceSurface;
  userMessage: string;
  currentTurn: SneakPeekConversationTurn;
  recentConversation: SneakPeekConversationTurn[];
  transcriptContext?: SneakPeekTranscriptContext;
  manualQuestion?: string;
  screenContext?: SneakPeekScreenContext;
  activeContext?: SneakPeekActiveContext;
  cancellationSignal?: AbortSignal;
  responseShape?: SneakPeekResponseShapeRequest;
  providerPreferences?: SneakPeekProviderPreferences;
  contextPermissions: SneakPeekContextPermissions;
}

export interface SneakPeekSelectedContextItem {
  kind: IntelligenceContextKind;
  selected: boolean;
  reason: string;
  reference?: string;
}

export interface SneakPeekSelectedContext {
  items: SneakPeekSelectedContextItem[];
}

export type SneakPeekRetrievalMode = 'none' | 'keyword' | 'semantic' | 'hybrid';

export interface SneakPeekRetrievalPlan {
  shouldRetrieve: boolean;
  mode: SneakPeekRetrievalMode;
  query: string;
  sources: ContextSource[];
  maximumResults: number;
}

export interface SneakPeekEvidenceItem {
  id: string;
  source: ContextSource;
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface SneakPeekEvidence {
  items: SneakPeekEvidenceItem[];
  sufficient: boolean;
}

export interface SneakPeekPrompt {
  system?: string;
  user: string;
  context?: string;
  /** Exact provider-facing prompt produced by PromptAssembler. */
  finalPrompt: string;
  /** Evidence identities rendered into finalPrompt, in render order. */
  includedEvidenceIds?: string[];
  /** Prompt sections rendered into finalPrompt. */
  includedSections?: string[];
}

export type SneakPeekProviderAttemptStatus =
  | 'not-started'
  | 'started'
  | 'streaming'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface SneakPeekProviderAttempt {
  provider?: string;
  model?: string;
  status: SneakPeekProviderAttemptStatus;
  startedAt?: number;
  endedAt?: number;
  error?: string;
}

export type SneakPeekStreamLifecycleStatus =
  | 'not-started'
  | 'ready'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface SneakPeekStreamLifecycle {
  status: SneakPeekStreamLifecycleStatus;
  startedAt?: number;
  firstTokenAt?: number;
  endedAt?: number;
  tokenCount?: number;
}

export interface SneakPeekDiagnostics {
  traceId: string;
  stages: string[];
  /** Exact architecture stage names used by the manual-chat migration trace. */
  pipelineStages: string[];
  warnings: string[];
  /** Sanitized execution outcomes (no question, document text or source IDs). */
  retrieval?: import('./RetrievalCoordinator').RetrievalSourceOutcome[];
}

export interface SneakPeekFinalAnswer {
  text: string;
  completed: boolean;
}

export interface SneakPeekIntelligenceResult {
  requestId: string;
  resolvedQuestion: string;
  /** Canonical Change 5 understanding result used by downstream planning. */
  turnUnderstanding: TurnUnderstanding;
  /** Canonical answer-shape decision, separate from context selection. */
  responsePlan: ResponsePlan;
  intent: IntelligenceIntent;
  responseType: IntelligenceResponseType;
  selectedContext: SneakPeekSelectedContext;
  /** Canonical Change 6 decision: what context is actually necessary. */
  contextPlan: ContextPlan;
  /** Bounded recent conversation; retrieval and long-term memory are separate layers. */
  conversationContext: RecentConversationContext;
  retrievalPlan: SneakPeekRetrievalPlan;
  evidence: SneakPeekEvidence;
  /** Canonical Change 8 evidence boundary consumed by prompt assembly. */
  evidencePack: EvidencePack;
  prompt: SneakPeekPrompt;
  providerAttempt: SneakPeekProviderAttempt;
  streamLifecycle: SneakPeekStreamLifecycle;
  diagnostics: SneakPeekDiagnostics;
  finalAnswer: SneakPeekFinalAnswer | null;
}
