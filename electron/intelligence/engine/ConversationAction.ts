import { SneakPeekIntelligenceEngine } from './SneakPeekIntelligenceEngine';
import { RetrievalCoordinator } from './RetrievalCoordinator';
import { streamCanonicalProvider, type ProviderGenerationTransport } from './GenerationController';
import { streamRagEngineAnswer } from './RagIpcStream';
import type { ProviderDataScope, ProviderRouteOptions } from '../../llm/ProviderRouter';
import type { SneakPeekConversationAction, SneakPeekIntelligenceRequest } from './types';

const RESPONSE_TYPES = {
  refine: 'answer',
  brainstorm: 'spoken-answer',
  observe: 'recap',
  'code-hint': 'answer',
  recap: 'recap',
  clarify: 'clarification',
  'follow-up-questions': 'follow-up-questions',
} as const;

const SURFACES = {
  refine: 'follow-up',
  brainstorm: 'assist',
  observe: 'assist',
  'code-hint': 'screenshot',
  recap: 'recap',
  clarify: 'clarify',
  'follow-up-questions': 'follow-up',
} as const;

/**
 * A session snapshot can contain transcript, manual turns and assistant output
 * whose original private-source lineage is not known. Treat every potentially
 * represented scope as sensitive until typed per-turn provenance is available.
 */
export function conversationActionDataScopes(input: {
  context?: string;
  previousAnswer?: string;
  imagePaths?: readonly string[];
  unknownLineage?: boolean;
}): ProviderDataScope[] {
  const scopes = new Set<ProviderDataScope>();
  if (input.context?.trim()) scopes.add('transcript');
  if (input.context?.trim() || input.previousAnswer?.trim() || input.unknownLineage) {
    scopes.add('profile_history');
    scopes.add('reference_files');
    scopes.add('screenshots');
  }
  if (input.imagePaths?.length) scopes.add('screenshots');
  return [...scopes];
}

/** Adapt the action's session snapshot and stream events to the canonical engine. */
export async function streamConversationAction(input: {
  id: string;
  action: SneakPeekConversationAction;
  question: string;
  context: string;
  controller: AbortController;
  imagePaths?: readonly string[];
  screenText?: string;
  route: ProviderRouteOptions;
  transport: ProviderGenerationTransport;
  isCurrent: () => boolean;
  onToken: (token: string) => void;
}): Promise<string | null> {
  const { id, action, question, context, controller } = input;
  const hasScreen = Boolean(input.imagePaths?.length || input.screenText?.trim());
  const request: SneakPeekIntelligenceRequest = {
    requestId: id,
    // Each action explicitly owns its snapshot, with no implicit history lookup.
    sessionId: id,
    surface: SURFACES[action.kind],
    action: { ...action, sessionSnapshot: context.trim() || undefined },
    currentTurn: { id, role: 'user', content: question },
    userMessage: question,
    manualQuestion: question,
    recentConversation: [],
    screenContext: hasScreen ? { imagePaths: input.imagePaths, text: input.screenText } : undefined,
    // A formatted session snapshot is NOT a meeting transcript.
    // Retain it as bounded conversation context, not citation-bearing evidence.
    contextPermissions: {
      conversation: Boolean(context.trim() || action.previousAnswer?.trim()),
      transcript: false,
      generalKnowledge: action.kind === 'clarify' && !context,
      screen: hasScreen, mode: false, project: false, profile: false, files: false, memory: false,
    },
    responseShape: { type: RESPONSE_TYPES[action.kind] },
    cancellationSignal: controller.signal,
  };

  const engine = new SneakPeekIntelligenceEngine({
    // No external retrieval is authorized for a mixed session snapshot.
    // The selected conversation context is rendered by PromptAssembler.
    retrievalCoordinator: new RetrievalCoordinator(),
    generationPort: {
      stream: ({ request, prompt, contextPlan, lifecycle }) => streamCanonicalProvider(input.transport, {
        requestId: request.requestId,
        finalPrompt: prompt.finalPrompt,
        route: input.route,
        abortSignal: request.cancellationSignal,
        imagePaths: contextPlan.requiredSources.includes('screen') ? request.screenContext?.imagePaths : undefined,
        lifecycle,
      }),
    },
  });

  let answer: string | null = null;
  const result = await streamRagEngineAnswer({
    engine,
    request,
    meta: {},
    isCurrent: input.isCurrent,
    abort: () => controller.abort(),
    send: (channel, payload) => {
      if (channel === 'rag:stream-chunk' && payload.chunk) input.onToken(payload.chunk);
    },
    settle: (status, text) => {
      if (status === 'completed') answer = text ?? null;
    },
  });
  if (!result.success && input.isCurrent()) throw new Error(result.error ?? 'Conversation action failed.');
  return input.isCurrent() && !controller.signal.aborted ? answer : null;
}
