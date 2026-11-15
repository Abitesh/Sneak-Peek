/**
 * WORK-0071: test-only provider fixture for the active CHG-20 WTA path.
 * The former whatToAnswerLLM.generateStream seam is not called by production.
 * This supplies a pinned local provider route and the REAL streamFinalPrompt
 * transport boundary without replacing planner, retrieval, privacy or lifecycle.
 * No test code may use this helper to bypass a source-scope denial.
 */
export function installCanonicalWtaTestTransport(helper, chunks, options = {}) {
  const state = { calls: [], chunks, repairChunks: options.repairChunks ?? [], hasRepairSequence: options.repairChunks !== undefined };
  helper.getSneakPeekGenerationRouteOptions = (dataScopes = [], multimodal = false) => ({
    capability: multimodal ? 'vision' : 'stream_chat',
    multimodal,
    availability: { hasOllama: true },
    models: { ollama: 'canonical-test-only' },
    preferredProvider: 'ollama',
    allowedProviders: ['ollama'],
    maxAttempts: 1,
    dataScopes: [...dataScopes],
  });
  helper.streamFinalPrompt = async function* (provider, model, prompt, transportOptions = {}) {
    if (provider !== 'ollama' || model !== 'canonical-test-only') {
      throw new Error(`Unexpected WTA test provider/model ${provider}/${model}`);
    }
    const call = { provider, model, prompt, options: transportOptions };
    state.calls.push(call);
    // A second independent request must not be mistaken for a repair. Only
    // fixtures that explicitly opt into a repair sequence reuse that slot.
    const output = state.hasRepairSequence && state.calls.length > 1 ? state.repairChunks : state.chunks;
    const generator = typeof output === 'function' ? output(call, state) : output;
    for await (const chunk of generator) {
      if (transportOptions.abortSignal?.aborted) return;
      yield String(chunk);
    }
  };
  helper.isUsingOllama ??= () => false; // fast test deadlines, not a transport override
  helper.__canonicalWtaTestState = state;
  return state;
}
