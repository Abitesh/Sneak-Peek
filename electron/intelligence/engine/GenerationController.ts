/**
 * Provider-agnostic generation lifecycle for Sneak-Peek Intelligence.
 *
 * The engine hands this layer one already-assembled final prompt.  This module
 * does not inspect the question, evidence, context plan, or prompt semantics.
 * ProviderRouter decides the ordered provider/model attempts; the injected
 * transport performs one provider generation; this controller owns streaming,
 * first-token timing, cancellation, commit, pre-commit fallback, and terminal
 * errors.
 */

import {
  routeGenerationProviders,
  type ProviderAttempt,
  type ProviderRouteOptions,
} from '../../llm/ProviderRouter';
import { classifyProviderError } from '../../llm/providerErrorClassifier';

export interface ProviderGenerationTransport {
  streamFinalPrompt(
    provider: ProviderAttempt['provider'],
    model: string | undefined,
    finalPrompt: string,
    options?: {
      abortSignal?: AbortSignal;
      thinkingBudget?: number;
      imagePaths?: readonly string[];
    },
  ): AsyncGenerator<string, void, unknown>;
}


export type GenerationLifecycleState =
  | 'IDLE'
  | 'PLANNING'
  | 'RETRIEVING'
  | 'GENERATING'
  | 'COMMITTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface GenerationLifecycleSnapshot {
  requestId: string;
  state: GenerationLifecycleState;
  changedAt: number;
  history: Array<{ state: GenerationLifecycleState; at: number; reason?: string }>;
}

const ALLOWED_LIFECYCLE_TRANSITIONS: Record<GenerationLifecycleState, readonly GenerationLifecycleState[]> = {
  IDLE: ['PLANNING', 'GENERATING', 'CANCELLED', 'FAILED'],
  PLANNING: ['RETRIEVING', 'GENERATING', 'CANCELLED', 'FAILED'],
  RETRIEVING: ['GENERATING', 'CANCELLED', 'FAILED'],
  GENERATING: ['COMMITTED', 'CANCELLED', 'FAILED'],
  COMMITTED: ['COMPLETED', 'CANCELLED', 'FAILED'],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
};

/**
 * Canonical lifecycle state machine shared by the new generation path and
 * legacy/manual streaming integration. It owns lifecycle state only; it does
 * not select context, providers, or answer content.
 */
export class GenerationLifecycle {
  committedProvider?: ProviderAttempt['provider'];
  committedModel?: string;
  private _state: GenerationLifecycleState = 'IDLE';
  private readonly _history: GenerationLifecycleSnapshot['history'];

  constructor(public readonly requestId: string) {
    this._history = [{ state: 'IDLE', at: Date.now() }];
  }

  get state(): GenerationLifecycleState {
    return this._state;
  }

  get snapshot(): GenerationLifecycleSnapshot {
    return {
      requestId: this.requestId,
      state: this._state,
      changedAt: this._history[this._history.length - 1]?.at ?? Date.now(),
      history: this._history.map((entry) => ({ ...entry })),
    };
  }

  transition(next: GenerationLifecycleState, reason?: string): GenerationLifecycleSnapshot {
    if (next === this._state) return this.snapshot;
    const allowed = ALLOWED_LIFECYCLE_TRANSITIONS[this._state];
    if (!allowed.includes(next)) {
      throw new Error(`Invalid generation lifecycle transition: ${this._state} -> ${next}`);
    }
    const at = Date.now();
    this._state = next;
    this._history.push({ state: next, at, ...(reason ? { reason } : {}) });
    return this.snapshot;
  }

  cancel(reason = 'cancelled'): GenerationLifecycleSnapshot {
    if (this._state === 'COMPLETED' || this._state === 'FAILED' || this._state === 'CANCELLED') return this.snapshot;
    return this.transition('CANCELLED', reason);
  }

  fail(reason = 'failed'): GenerationLifecycleSnapshot {
    if (this._state === 'COMPLETED' || this._state === 'FAILED' || this._state === 'CANCELLED') return this.snapshot;
    return this.transition('FAILED', reason);
  }
}

export type GenerationStatus =
  | 'not-started'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface GenerationAttemptRecord {
  provider: ProviderAttempt['provider'];
  model?: string;
  status: 'started' | 'committed' | 'succeeded' | 'failed' | 'cancelled';
  startedAt: number;
  firstTokenAt?: number;
  endedAt?: number;
  error?: string;
}

function describeProviderFailure(error: unknown): { detail: string; status?: number } {
  const response = error as {
    status?: unknown; statusCode?: unknown; response?: { status?: unknown };
    cause?: unknown; name?: unknown; message?: unknown; code?: unknown;
  } | null;
  const rawStatus = response?.status ?? response?.statusCode ?? response?.response?.status;
  const status = typeof rawStatus === 'string' && /^\d{3}$/.test(rawStatus) ? Number(rawStatus) : rawStatus;
  const http = typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599 ? status : undefined;

  // The vendor body and error chain may contain credentials, provider URLs or
  // prompt contents. Only fixed descriptions and an HTTP status leave here.
  const vendorMessage = typeof response?.message === 'string' ? response.message : '';
  const dailyQuota = /insufficient_quota|perday|per day|daily.{0,30}(?:limit|quota)|monthly.{0,30}(?:limit|quota)|\b(?:TPD|RPD)\b|(?:billing|credits?).{0,30}(?:limit|exhaust)/i;
  let detail: string;
  if (response?.name === 'ProviderScopeError' || response?.name === 'VisionPolicyError') {
    detail = 'The provider is blocked by the current data scope or screenshot privacy settings.';
  } else if (response?.name === 'ProviderDisabledError') {
    detail = 'This provider is disabled in AI Providers.';
  } else if (http === 400) {
    const unsupported = /not supported|unsupported|unknown parameter|unrecognized/i.test(vendorMessage);
    detail = unsupported ? 'The selected model does not support a request parameter.' : 'The provider rejected the request parameters.';
  } else if (http === 401 || http === 403) detail = 'Check the provider credential and its model access.';
  else if (http === 429) {
    detail = response?.code === 'insufficient_quota' || dailyQuota.test(vendorMessage)
      ? 'The provider reports exhausted quota. Check usage and quota reset.'
      : 'The provider rate-limited the request. Wait before retrying and check usage limits.';
  } else if (http === 503) detail = 'The provider is temporarily unavailable or overloaded.';
  else if (http === 404) detail = 'The selected model or provider endpoint is unavailable.';
  else if (http === 402) detail = 'The provider account requires billing or credits.';
  else {
    const { kind } = classifyProviderError(error);
    const causes = kind === 'server_error' && response?.cause ? classifyProviderError(response.cause).kind : kind;
    switch (causes) {
      case 'auth': detail = 'Check the provider credential and its model access.'; break;
      case 'rate_limit': detail = 'The provider reported a rate limit or exhausted quota.'; break;
      case 'overloaded': detail = 'The provider is temporarily overloaded.'; break;
      case 'timeout': detail = 'The provider request timed out.'; break;
      case 'network': detail = 'The provider could not be reached. Check the connection.'; break;
      default: detail = 'The provider request failed.'; break;
    }
  }
  return { detail, status: http };
}

const CLOUD_TEXT_PROVIDERS = new Set<ProviderAttempt['provider']>([
  'gemini_flash', 'gemini_pro', 'groq', 'openai', 'claude', 'deepseek',
]);

export interface GenerationRequest {
  requestId: string;
  finalPrompt: string;
  route: ProviderRouteOptions;
  cloudFirstTokenTimeoutMs?: number;
  abortSignal?: AbortSignal;
  thinkingBudget?: number;
  imagePaths?: readonly string[];
  lifecycle?: GenerationLifecycle;
}

export interface GenerationOutcome {
  requestId: string;
  status: GenerationStatus;
  startedAt?: number;
  firstTokenAt?: number;
  endedAt?: number;
  firstTokenLatencyMs?: number;
  committedProvider?: ProviderAttempt['provider'];
  committedModel?: string;
  fallbackUsed: boolean;
  attempts: GenerationAttemptRecord[];
  error?: string;
  lifecycle: GenerationLifecycleSnapshot;
}

/** Settle cancellation even if the selected transport is currently parked in next(). */
async function* consumeUntilAborted(
  stream: AsyncGenerator<string, void, unknown>,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  if (!signal) {
    yield* stream;
    return;
  }
  const stopped = Symbol('provider cancelled');
  let onAbort!: () => void;
  const abort = new Promise<typeof stopped>(resolve => { onAbort = () => resolve(stopped); });
  signal.addEventListener('abort', onAbort, { once: true });
  let done = false;
  try {
    while (!signal.aborted) {
      const next = await Promise.race([stream.next(), abort]);
      if (next === stopped || signal.aborted) return;
      if (next.done) { done = true; return; }
      yield next.value;
    }
  } finally {
    signal.removeEventListener('abort', onAbort);
    if (!done) void stream.return(undefined).catch(() => undefined);
  }
}

/**
 * The controller is intentionally reusable. It does not own provider clients;
 * those are supplied through ProviderGenerationTransport.
 */
export class GenerationController {
  constructor(private readonly transport: ProviderGenerationTransport) {}

  stream(request: GenerationRequest): {
    stream: AsyncGenerator<string, void, unknown>;
    outcome: GenerationOutcome;
  } {
    const lifecycle = request.lifecycle ?? new GenerationLifecycle(request.requestId);
    const outcome: GenerationOutcome = {
      requestId: request.requestId,
      status: 'not-started',
      fallbackUsed: false,
      attempts: [],
      lifecycle: lifecycle.snapshot,
    };

    const stream = this.run(request, outcome, lifecycle);
    return { stream, outcome };
  }

  private async *run(
    request: GenerationRequest,
    outcome: GenerationOutcome,
    lifecycle: GenerationLifecycle,
  ): AsyncGenerator<string, void, unknown> {
    const startedAt = Date.now();
    outcome.startedAt = startedAt;

    if (request.abortSignal?.aborted) {
      lifecycle.cancel('aborted before generation');
      outcome.lifecycle = lifecycle.snapshot;
      outcome.status = 'cancelled';
      outcome.endedAt = Date.now();
      return;
    }

    if (lifecycle.state === 'IDLE') lifecycle.transition('GENERATING', 'generation started without planning/retrieval phase');
    else if (lifecycle.state === 'PLANNING') lifecycle.transition('RETRIEVING', 'generation started');
    if (lifecycle.state === 'RETRIEVING') lifecycle.transition('GENERATING', 'provider generation started');

    const attempts = routeGenerationProviders(request.route).filter(
      (attempt) => attempt.status === 'available',
    );

    if (attempts.length === 0) {
      lifecycle.fail('no available provider');
      outcome.lifecycle = lifecycle.snapshot;
      outcome.status = 'failed';
      outcome.error = 'No available provider can satisfy this generation request.';
      outcome.endedAt = Date.now();
      return;
    }

    let attemptedCount = 0;

    for (const attempt of attempts) {
      if (request.abortSignal?.aborted) {
        lifecycle.cancel('aborted before provider attempt');
        outcome.lifecycle = lifecycle.snapshot;
        outcome.status = 'cancelled';
        outcome.endedAt = Date.now();
        return;
      }

      attemptedCount += 1;
      if (attemptedCount > 1) outcome.fallbackUsed = true;

      const record: GenerationAttemptRecord = {
        provider: attempt.provider,
        model: attempt.model,
        status: 'started',
        startedAt: Date.now(),
      };
      outcome.attempts.push(record);
      outcome.status = 'streaming';

      let committed = false;
      let emitted = false;
      const firstTokenTimeoutMs = request.cloudFirstTokenTimeoutMs;
      const deadline = firstTokenTimeoutMs && CLOUD_TEXT_PROVIDERS.has(attempt.provider)
        ? new AbortController() : undefined;
      const timer = deadline ? setTimeout(() => {
        deadline.abort(new Error('Provider first-token deadline exceeded.'));
      }, firstTokenTimeoutMs) : undefined;
      const attemptSignal = deadline
        ? request.abortSignal ? AbortSignal.any([request.abortSignal, deadline.signal]) : deadline.signal
        : request.abortSignal;

      try {
        const providerStream = this.transport.streamFinalPrompt(
          attempt.provider,
          attempt.model,
          request.finalPrompt,
          {
            abortSignal: attemptSignal,
            thinkingBudget: request.thinkingBudget,
            imagePaths: request.imagePaths,
          },
        );

        for await (const chunk of consumeUntilAborted(providerStream, attemptSignal)) {
          if (request.abortSignal?.aborted) {
            lifecycle.cancel('aborted while consuming provider stream');
            outcome.lifecycle = lifecycle.snapshot;
            record.status = 'cancelled';
            record.endedAt = Date.now();
            outcome.status = 'cancelled';
            outcome.endedAt = Date.now();
            return;
          }

          if (!chunk) continue;

          if (!emitted) {
            clearTimeout(timer);
            emitted = true;
            const firstTokenAt = Date.now();
            record.firstTokenAt = firstTokenAt;
            outcome.firstTokenAt ??= firstTokenAt;
            outcome.firstTokenLatencyMs ??= firstTokenAt - startedAt;
          }

          // FIRST VISIBLE TOKEN = PROVIDER COMMIT POINT.
          // Once committed, this request must never switch providers and append
          // a second answer after a mid-stream provider failure.
          if (!committed) {
            committed = true;
            if (lifecycle.state === 'GENERATING') lifecycle.committedProvider = attempt.provider;
            lifecycle.committedModel = attempt.model;
            lifecycle.transition('COMMITTED', 'first visible token emitted');
            record.status = 'committed';
            outcome.committedProvider = attempt.provider;
            outcome.committedModel = attempt.model;
          }

          yield chunk;
        }

        if (request.abortSignal?.aborted) {
          lifecycle.cancel('aborted during provider stream');
          outcome.lifecycle = lifecycle.snapshot;
          record.status = 'cancelled';
          record.endedAt = Date.now();
          outcome.status = 'cancelled';
          outcome.endedAt = Date.now();
          return;
        }

        if (deadline?.signal.aborted) throw deadline.signal.reason;

        record.status = 'succeeded';
        record.endedAt = Date.now();
        if (lifecycle.state === 'COMMITTED') lifecycle.transition('COMPLETED', 'provider stream completed');
        else if (lifecycle.state === 'GENERATING') lifecycle.transition('COMPLETED', 'provider completed without visible output');
        outcome.lifecycle = lifecycle.snapshot;
        outcome.status = 'completed';
        outcome.endedAt = record.endedAt;
        return;
      } catch (error: unknown) {
        record.endedAt = Date.now();

        if (request.abortSignal?.aborted) {
          lifecycle.cancel('provider stream aborted');
          outcome.lifecycle = lifecycle.snapshot;
          record.status = 'cancelled';
          outcome.status = 'cancelled';
          outcome.endedAt = Date.now();
          return;
        }

        const { detail, status } = describeProviderFailure(deadline?.signal.aborted ? deadline.signal.reason : error);
        const providerLabel = attempt.provider === 'gemini_flash' || attempt.provider === 'gemini_pro'
          ? 'Gemini' : attempt.provider;
        const message = `${providerLabel}${status ? ` (HTTP ${status})` : ''}: ${detail}`;
        record.error = message;
        console.warn('[GenerationController] Provider attempt failed', {
          provider: attempt.provider, status, reason: detail, elapsedMs: record.endedAt - record.startedAt,
          phase: committed ? 'after-first-token' : 'before-first-token',
        });

        if (committed || emitted) {
          // A provider that has already emitted visible output is committed.
          // Do NOT append another provider's full answer after a post-commit
          // failure. The caller receives the partial stream as-is.
          record.status = 'failed';
          outcome.status = 'failed';
          outcome.error = `Provider failed after commit. ${message}`;
          lifecycle.fail(outcome.error);
          outcome.lifecycle = lifecycle.snapshot;
          outcome.endedAt = Date.now();
          return;
        }

        // Failure before first token: this provider never committed, so the
        // controller may safely try the next provider selected by the router.
        record.status = 'failed';
      } finally {
        clearTimeout(timer);
      }
    }

    outcome.error = outcome.attempts.map(attempt => attempt.error).filter(Boolean).join(' ')
      || 'All selected providers failed before first token.';
    lifecycle.fail(outcome.error);
    outcome.lifecycle = lifecycle.snapshot;
    outcome.status = 'failed';
    outcome.endedAt = Date.now();
  }
}


/** Bind the production transport to the shared controller without adding prompt logic. */
export function streamCanonicalProvider(
  transport: ProviderGenerationTransport,
  request: Parameters<GenerationController['stream']>[0],
): AsyncGenerator<string, void, unknown> {
  return new GenerationController(transport).stream(request).stream;
}
