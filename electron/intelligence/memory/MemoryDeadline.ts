/** Optional memory work must never keep an answer waiting indefinitely. */
export function memoryTimeout(value: number | undefined, fallback = 800): number {
  return Number.isFinite(value) ? Math.min(5000, Math.max(0, Math.floor(value!))) : fallback;
}
export function memoryResultLimit(value: number | undefined): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.floor(value!))) : 8;
}
export async function withMemoryDeadline<T>(
  timeoutMs: number,
  signal: AbortSignal | undefined,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T | undefined> {
  if (timeoutMs <= 0 || signal?.aborted) return undefined;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: () => void = () => {};
  try {
    const stopped = new Promise<undefined>(resolve => {
      onAbort = () => { controller.abort(); resolve(undefined); };
      signal?.addEventListener('abort', onAbort, { once: true });
      timer = setTimeout(onAbort, timeoutMs);
    });
    return await Promise.race([Promise.resolve().then(() => {
      if (controller.signal.aborted) return undefined;
      return operation(controller.signal);
    }), stopped]);
  } catch { return undefined; }
  finally {
    if (timer !== undefined) clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    controller.abort();
  }
}
