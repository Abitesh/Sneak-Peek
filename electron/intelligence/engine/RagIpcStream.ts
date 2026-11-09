import type { SneakPeekIntelligenceEngine } from './SneakPeekIntelligenceEngine';
import type { SneakPeekIntelligenceRequest } from './types';

export interface RagStreamMeta { meetingId?: string; global?: boolean; live?: boolean }
export interface RagIpcResult { success: boolean; fallback?: boolean; error?: string }

export function ragQueryPrefix(senderId: number, meta: RagStreamMeta): string {
  return `${senderId}:${meta.global ? 'global' : meta.live ? 'live' : `meeting-${encodeURIComponent(meta.meetingId ?? '')}`}:`;
}

export function buildGlobalRagRequest(input: {
  requestId: string; sessionId: string; query: string; signal: AbortSignal;
  recentConversation: SneakPeekIntelligenceRequest['recentConversation'];
}): SneakPeekIntelligenceRequest {
  return {
    requestId: input.requestId, sessionId: input.sessionId, surface: 'global-rag',
    userMessage: input.query, manualQuestion: input.query,
    currentTurn: { id: input.requestId, role: 'user', content: input.query },
    recentConversation: input.recentConversation,
    retrievalScope: { kind: 'global-meetings' },
    cancellationSignal: input.signal,
    contextPermissions: { conversation: true, transcript: true, screen: false, mode: false, project: false, profile: false, files: false, memory: false, generalKnowledge: false },
    providerPreferences: { allowFallback: true, maxAttempts: 3 },
  };
}

/** Transport only: the engine owns planning, evidence, prompting and generation. */
export async function streamRagEngineAnswer(input: {
  engine: Pick<SneakPeekIntelligenceEngine, 'prepareAndStream'>;
  request: SneakPeekIntelligenceRequest;
  meta: RagStreamMeta;
  isCurrent: () => boolean;
  send: (channel: string, payload: RagStreamMeta & { chunk?: string; error?: string }) => void;
  settle: (status: 'completed' | 'cancelled' | 'failed', answer?: string) => void;
  abort?: () => void;
  /** Preserve the former RAG stream stall bound; injectable for timeout tests. */
  stallTimeoutMs?: number;
}): Promise<RagIpcResult> {
  const { request } = input;
  const signal = request.cancellationSignal;
  const current = () => !signal?.aborted && input.isCurrent();
  const cancelled = Symbol('cancelled');
  let onAbort: (() => void) | undefined;
  const abort = new Promise<typeof cancelled>((resolve) => {
    onAbort = () => resolve(cancelled);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });
  });
  let run: ReturnType<SneakPeekIntelligenceEngine['prepareAndStream']> | undefined;
  let failed = false;
  const nextWithDeadline = async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([run!.stream.next(), abort, new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Answer stream stalled. Please try again.')), input.stallTimeoutMs ?? 15_000);
      })]);
    } finally { if (timer) clearTimeout(timer); }
  };
  try {
    if (!current()) { input.settle('cancelled'); return { success: true }; }
    run = input.engine.prepareAndStream(request);
    // A rejected stream and result describe the same failure. Observe both even
    // if cancellation returns the IPC response before the backend settles.
    void run.result.catch(() => {});
    while (current()) {
      const next = await nextWithDeadline();
      if (next === cancelled || !current()) break;
      if (next.done) {
        const result = await Promise.race([run.result, abort]);
        if (result === cancelled || !current()) break;
        if (run.lifecycle.state === 'COMPLETED') {
          const answer = result.finalAnswer?.text ?? '';
          if (!answer.trim()) throw new Error('The provider returned no answer. Please try again.');
          input.settle('completed', answer);
          input.send('rag:stream-complete', input.meta);
          return { success: true };
        }
        if (run.lifecycle.state === 'CANCELLED') break;
        throw new Error(result.providerAttempt.error || 'Answer generation ended without completion.');
      }
      if (next.value) input.send('rag:stream-chunk', { ...input.meta, chunk: next.value });
    }
    input.settle('cancelled');
    return { success: true };
  } catch (error) {
    if (!current()) { input.settle('cancelled'); return { success: true }; }
    input.settle('failed');
    failed = true;
    const message = error instanceof Error ? error.message : String(error);
    // The live RAG handler has a fallback to ordinary chat. Do not also send
    // a terminal error event: the renderer would tear down its streaming row
    // just before the fallback starts writing into it. Meeting/global RAG has
    // no such fallback and must retain its visible terminal error.
    if (!input.meta.live) input.send('rag:stream-error', { ...input.meta, error: message });
    input.abort?.();
    return input.meta.live
      ? { success: false, fallback: true, error: message }
      : { success: false, error: message };
  } finally {
    if (onAbort) signal?.removeEventListener('abort', onAbort);
    // Do not await return(): a provider ignoring abort may still have a pending
    // next(). Its late settlement is observed but cannot emit into a new turn.
    if (run && (failed || !current())) void run.stream.return(undefined).catch(() => {});
  }
}
