/**
 * CHG-17 query-time budget. This bounds the user's wait, not the underlying
 * provider operation (the existing embedding provider API has no AbortSignal).
 * A timed-out/aborted embedding is ignored and must never supply late evidence.
 * The caller keeps its already-indexed lexical evidence as a fallback.
 */
export async function withinQueryEmbeddingBudget<T>(
  operation: () => Promise<T>,
  signal?: AbortSignal,
  timeoutMs = 2_000,
): Promise<T | null> {
  if (signal?.aborted) return null;
  return new Promise<T | null>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve(value);
    };
    const onAbort = () => finish(null);
    timer = setTimeout(() => finish(null), Math.max(1, timeoutMs));
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) { finish(null); return; }
    try {
      void operation().then((value) => finish(value), () => finish(null));
    } catch {
      finish(null);
    }
  });
}
