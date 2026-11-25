import { validateCanonicalAnswer, type AnswerValidationIssue } from './AnswerValidation';
import { raceStreamWithDeadline, LIVE_LOCAL_FIRST_USEFUL_TIMEOUT_MS, LIVE_INTER_TOKEN_STALL_MS } from '../../llm/liveDeadlines';
import { acceptRepairedAnswer } from '../../llm';
import { createPrimaryManualSneakPeekEngine } from './CanonicalRuntime';
import { freezeAnswerRequest } from './AnswerRequest';
import type { SneakPeekIntelligenceRequest, SneakPeekIntelligenceResult } from './types';

/** One request-owned engine and immutable inputs, also used for bounded repairs. */
export function createAnswerExecution(helper: any, appState: any, input: SneakPeekIntelligenceRequest) {
  const engine = createPrimaryManualSneakPeekEngine(helper, appState, input.requestId);
  const request = engine.pinRequest(input);
  let completed: SneakPeekIntelligenceResult | undefined;
  let repairSequence = 0;
  const run = engine.prepareAndStream(request);
  // Observe the separate result promise immediately even if the stream throws.
  const result = run.result.then(value => { completed = value; return value; });
  void result.catch(() => undefined);
  return {
    request, stream: run.stream, result, lifecycle: run.lifecycle,
    async finalize(text: string, isCurrent: () => boolean,
      additionalIssue?: (answer: string) => Promise<AnswerValidationIssue | null>): Promise<string | null> {
      if (!isCurrent() || request.cancellationSignal?.aborted) return null;
      const original = completed ?? await result;
      if (!original.finalAnswer?.completed) throw new Error(original.providerAttempt.error ?? 'Answer generation interrupted.');
      const issue = validateCanonicalAnswer(request, original, text) ?? await additionalIssue?.(text);
      if (!isCurrent() || request.cancellationSignal?.aborted) return null;
      if (!issue) return text;
      let replacement = '';
      const repairController = new AbortController();
      const abort = () => repairController.abort(request.cancellationSignal?.reason);
      request.cancellationSignal?.addEventListener('abort', abort, { once: true });
      try {
        if (request.cancellationSignal?.aborted) abort();
        const status = await raceStreamWithDeadline({
          stream: this.repair(issue.reason, text, issue.diagnostic, repairController.signal),
          signal: repairController.signal,
          firstUsefulDeadlineMs: helper.isUsingOllama?.() ? LIVE_LOCAL_FIRST_USEFUL_TIMEOUT_MS : 7000,
          interTokenStallMs: LIVE_INTER_TOKEN_STALL_MS,
          isUsefulYet: () => replacement.length >= 5,
          shouldAbort: () => !isCurrent(),
          onCleanup: reason => { if (reason !== 'done') repairController.abort(reason); },
          onToken: token => { replacement += token; },
        });
        if (!isCurrent() || request.cancellationSignal?.aborted) return null;
        if (status === 'done' && replacement.trim()) {
          const stillInvalid = Boolean(validateCanonicalAnswer(request, original, replacement) ?? await additionalIssue?.(replacement));
          const verdict = acceptRepairedAnswer({ original: text, repaired: replacement, stillInvalid });
          if (!isCurrent() || request.cancellationSignal?.aborted) return null;
          if (verdict.accepted) return verdict.text;
        }
      } catch { /* a failed repair must never replace an answer with partial output */ }
      finally { repairController.abort('settled'); request.cancellationSignal?.removeEventListener('abort', abort); }
      if (!isCurrent() || request.cancellationSignal?.aborted) return null;
      if (issue.unsafeToPersist) throw new Error('The answer could not be validated against its authorized sources. Please try again.');
      return text;
    },
    async *repair(reason: NonNullable<SneakPeekIntelligenceRequest['repair']>['reason'], previousAnswer: string,
      diagnostic?: string, signal: AbortSignal | undefined = request.cancellationSignal): AsyncGenerator<string, void, unknown> {
      const original = completed ?? await result;
      if (signal?.aborted || !original.finalAnswer?.completed || !original.providerAttempt.provider) return;
      const repairRequest: SneakPeekIntelligenceRequest = {
        ...request, requestId: `${request.requestId}:repair:${++repairSequence}`, cancellationSignal: signal,
        providerPreferences: { preferredProvider: original.providerAttempt.provider,
          preferredModel: original.providerAttempt.model, allowedProviders: [original.providerAttempt.provider],
          allowFallback: false, maxAttempts: 1 },
        repair: { reason, previousAnswer, diagnostic, originalRequestId: request.requestId,
          evidence: original.evidence, contextPlan: original.contextPlan, responsePlan: original.responsePlan },
      };
      const repaired = engine.prepareAndStream(repairRequest);
      const settled = repaired.result.then(value => value);
      void settled.catch(() => undefined);
      yield* repaired.stream;
      const value = await settled;
      if (!signal?.aborted && !value.finalAnswer?.completed) throw new Error('Canonical answer repair did not complete.');
    },
  };
}
export type CanonicalAnswerExecution = ReturnType<typeof createAnswerExecution>;
