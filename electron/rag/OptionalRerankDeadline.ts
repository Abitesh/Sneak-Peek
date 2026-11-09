/**
 * A single bounded, cancellation-aware budget for OPTIONAL local BGE reranking.
 * If the worker is downloading/loading/blocked on ONNX, retrieval can continue
 * with its already scoped and ranked candidates. The work started by `run`
 * can finish in the background; late results are ignored and never mutate the
 * evidence returned by this wrapper. The underlying reranker is responsible
 * for its own worker lifecycle and model-load latch.
 */
export type OptionalRerankResult<T> =
  | { status: 'completed'; value: T }
  | { status: 'timeout' | 'cancelled' };

export interface OptionalRerankBudgetOptions {
  signal?: AbortSignal;
  budgetMs?: number;
}

export const DEFAULT_OPTIONAL_RERANK_BUDGET_MS = 1_500;

export function withOptionalRerankDeadline<T>(
  run: () => Promise<T>,
  options: OptionalRerankBudgetOptions = {},
): Promise<OptionalRerankResult<T>> {
  const { signal } = options;
  if (signal?.aborted) return Promise.resolve({ status: 'cancelled' });
  const requested = options.budgetMs ?? DEFAULT_OPTIONAL_RERANK_BUDGET_MS;
  const budgetMs = Number.isFinite(requested) ? Math.max(1, Math.min(5_000, requested)) : DEFAULT_OPTIONAL_RERANK_BUDGET_MS;

  return new Promise<OptionalRerankResult<T>>((resolve, reject) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (timeout !== undefined) clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    };
    const finish = (result: OptionalRerankResult<T>) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const onAbort = () => finish({ status: 'cancelled' });
    signal?.addEventListener('abort', onAbort, { once: true });
    timeout = setTimeout(() => finish({ status: 'timeout' }), budgetMs);
    if (signal?.aborted) {
      onAbort();
      return;
    }
    // The paired rejection handler ensures late failures can never become
    // unhandled rejections after cancellation or timeout.
    Promise.resolve().then(run).then(
      (value) => finish({ status: 'completed', value }),
      (error) => fail(error),
    );
  });
}
