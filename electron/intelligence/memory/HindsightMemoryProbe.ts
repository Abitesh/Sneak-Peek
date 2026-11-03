import { randomUUID } from 'crypto';

export interface MemoryProbeClient {
  retain(bank: string, content: string, options: Record<string, unknown>): Promise<unknown>;
  recall(bank: string, query: string, options: Record<string, unknown>): Promise<{ results?: Array<{ text?: string }> }>;
  deleteBank?(bank: string, options?: Record<string, unknown>): Promise<unknown>;
}

/** Explicit diagnostic only: invokes the configured LLM. Never run on app startup. */
export async function probeHindsightMemory(client: MemoryProbeClient, timeoutMs = 30_000) {
  const bank = `sneak-peek-diagnostic-${randomUUID()}`;
  const marker = `diagnostic-${randomUUID()}`;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let retained = false;
  let recalled = false;
  let cleanedUp = false;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('Memory diagnostic timed out')); }, timeoutMs);
  });
  try {
    await Promise.race([client.retain(bank, `The diagnostic access phrase is ${marker}.`, { async: false, signal: controller.signal }), deadline]);
    retained = true;
    for (let attempt = 0; attempt < 5 && !recalled; attempt++) {
      const response = await Promise.race([client.recall(bank, 'What is the diagnostic access phrase?', { maxTokens: 512, signal: controller.signal }), deadline]);
      recalled = Boolean(response.results?.some((item) => item.text?.includes(marker)));
      if (!recalled) await Promise.race([new Promise((resolve) => setTimeout(resolve, 250)), deadline]);
    }
  } catch {
    // Return operation states, never credential-bearing provider error bodies.
  } finally {
    if (timer) clearTimeout(timer);
    if (client.deleteBank) {
      const cleanup = new AbortController();
      let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
      const cleanupDeadline = new Promise<never>((_, reject) => { cleanupTimer = setTimeout(() => { cleanup.abort(); reject(new Error('Cleanup timed out')); }, 2000); });
      try { await Promise.race([client.deleteBank(bank, { signal: cleanup.signal }), cleanupDeadline]); cleanedUp = true; } catch { /* only this fresh diagnostic bank */ }
      finally { clearTimeout(cleanupTimer); }
    }
  }
  return { retained, recalled, cleanedUp, memoryReady: retained && recalled };
}
