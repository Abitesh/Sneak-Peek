import { streamCanonicalProvider, type ProviderGenerationTransport } from './GenerationController';
import { createRetrievalCapability, RetrievalCoordinator } from './RetrievalCoordinator';
import { SneakPeekIntelligenceEngine } from './SneakPeekIntelligenceEngine';
import type { ProviderRouteOptions } from '../../llm/ProviderRouter';
import type { SneakPeekIntelligenceRequest } from './types';

export function streamLiveAnswer(input: {
  requestId: string;
  question: string;
  transcript: string;
  liveAnswer: NonNullable<SneakPeekIntelligenceRequest['liveAnswer']>;
  abortSignal: AbortSignal;
  route: ProviderRouteOptions;
  transport: ProviderGenerationTransport;
  truncation: { truncated: boolean };
}): AsyncGenerator<string, void, unknown> {
  const { requestId, question, transcript, liveAnswer, abortSignal } = input;
  const engine = new SneakPeekIntelligenceEngine({
    retrievalCoordinator: new RetrievalCoordinator({
      capabilities: [createRetrievalCapability('meeting_transcript', async ({ request }) => {
        const text = request.transcriptContext?.text;
        return { items: text ? [{ id: `${requestId}:speech`, source: 'meeting_transcript', content: text }] : [] };
      })],
    }),
    generationPort: {
      stream: ({ request, prompt, lifecycle }) => streamCanonicalProvider(input.transport, {
        requestId,
        finalPrompt: prompt.finalPrompt,
        route: input.route,
        abortSignal: request.cancellationSignal,
        thinkingBudget: 0,
        lifecycle,
      }),
    },
  });
  const run = engine.prepareAndStream({
    requestId,
    sessionId: requestId,
    surface: 'what-to-answer',
    liveAnswer,
    userMessage: question,
    currentTurn: { id: requestId, content: question, role: 'user' },
    recentConversation: [],
    transcriptContext: transcript ? { source: 'live', text: transcript } : undefined,
    cancellationSignal: abortSignal,
    responseShape: { type: 'spoken-answer' },
    contextPermissions: {
      conversation: false, transcript: Boolean(transcript), generalKnowledge: true,
      screen: false, mode: false, project: false, profile: false, files: false, memory: false,
    },
  });
  return consume();

  async function* consume(): AsyncGenerator<string, void, unknown> {
    // Observe rejections even when a deadline interrupts iteration.
    const result = run.result.then(value => value, () => null);
    yield* run.stream;
    const settled = await result;
    if (settled?.streamLifecycle.status === 'failed') input.truncation.truncated = true;
  }
}
