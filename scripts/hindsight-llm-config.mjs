// scripts/hindsight-llm-config.mjs
//
// Builds the litellm.Router config JSON that Hindsight consumes via
// HINDSIGHT_API_LLM_LITELLMROUTER_CONFIG. This is Sneak-Peek's LLM provider chain +
// automatic retry/fallback for Hindsight's memory operations (fact extraction on
// retain, synthesis on reflect) — so a memory op always gets an answer even when the
// primary model/provider fails.
//
// HOW IT WORKS (no Python/adapter code — pure config):
//   Hindsight parses this JSON and forwards it to litellm.Router(**config). Hindsight
//   calls logical model `default`; explicit fallback aliases preserve our provider order.
//   litellm reads
//   each provider's key from the standard env var (GEMINI_API_KEY, OPENAI_API_KEY, …),
//   so a model entry is only useful when its key is present — we gate inclusion on that.
//
// PRIORITY (Natively-API is intentionally DEFERRED — see docs/HINDSIGHT_LOCAL_SETUP.md):
//   Gemini → OpenAI → Claude → DeepSeek → Groq → Ollama
//   Within Gemini: 3.6-flash → 3.1-flash-lite → 3.1-pro-preview.
//
// Model names MIRROR electron/services/ModelVersionManager.ts:88-100 so Hindsight stays
// in lockstep with the app's chosen models. Each is env-overridable.
//
// Usage:
//   node scripts/hindsight-llm-config.mjs            # prints the router JSON for current env
//   import { buildHindsightRouterConfig } from './hindsight-llm-config.mjs'

const PRIMARY_MODEL_NAME = 'default'; // Hindsight always calls this logical deployment name.

/**
 * Ordered provider→model table. Each provider lists its models best-first (per-provider
 * fallback). `key` is the env var litellm needs for that provider; an entry is only
 * emitted when that key is present (or, for ollama, when explicitly enabled).
 * Model strings are env-overridable so a name correction needs no code change.
 */
function providerTable(env) {
  const ov = (name, dflt) => (env[name] && String(env[name]).trim()) || dflt;
  return [
    {
      provider: 'gemini', key: 'GEMINI_API_KEY',
      models: [
        ov('HINDSIGHT_LLM_GEMINI_PRIMARY', 'gemini/gemini-3.6-flash'),
        ov('HINDSIGHT_LLM_GEMINI_LITE', 'gemini/gemini-3.1-flash-lite'),
        ov('HINDSIGHT_LLM_GEMINI_PRO', 'gemini/gemini-3.1-pro-preview'),
      ],
    },
    {
      // OpenAI-compatible: real OpenAI OR a LiteLLM gateway (any base URL passed via
      // OPENAI_API_BASE / LITELLM_BASE_URL). The shell launcher forwards OPENAI_API_BASE
      // (and also LITELLM_BASE_URL as a fallback); litellm reads OPENAI_API_BASE and
      // routes calls to the gateway instead of api.openai.com. Without this entry the
      // LiteLLM gateway user gets retain/reflect calls silently routed to api.openai.com
      // — the most surprising failure mode for a user who set up a gateway to AVOID
      // talking to OpenAI.
      provider: 'openai', key: 'OPENAI_API_KEY',
      models: [ov('HINDSIGHT_LLM_OPENAI', 'openai/gpt-5.4')],
      // OPENAI_API_BASE is the litellm-canonical env var. LITELLM_BASE_URL is a
      // convenience alias some users set in their own shell — we honor it as a
      // fallback so the UI-documented `export LITELLM_BASE_URL=...` actually works.
      apiBase: ov('OPENAI_API_BASE', '') || ov('LITELLM_BASE_URL', '') || undefined,
    },
    {
      provider: 'anthropic', key: 'ANTHROPIC_API_KEY',
      models: [ov('HINDSIGHT_LLM_CLAUDE', 'anthropic/claude-sonnet-4-6')],
    },
    {
      provider: 'deepseek', key: 'DEEPSEEK_API_KEY',
      models: [ov('HINDSIGHT_LLM_DEEPSEEK', 'deepseek/deepseek-v4-flash')],
    },
    {
      provider: 'groq', key: 'GROQ_API_KEY',
      models: [ov('HINDSIGHT_LLM_GROQ', 'groq/qwen/qwen3.6-27b')],
    },
    {
      // Ollama needs no API key — include when explicitly enabled (local fallback of last resort).
      provider: 'ollama', key: null, enabledBy: 'HINDSIGHT_LLM_ENABLE_OLLAMA',
      models: [ov('HINDSIGHT_LLM_OLLAMA', 'ollama/gemma3:12b')],
      apiBase: ov('HINDSIGHT_LLM_OLLAMA_BASE', 'http://localhost:11434'),
    },
  ];
}

/**
 * Build the litellm.Router config from env. Returns null when NO provider is available
 * (caller should keep the single-model default). Pure — no IO.
 */
export function buildHindsightRouterConfig(env = process.env) {
  const deployments = [];
  for (const p of providerTable(env)) {
    const available = p.key ? Boolean(env[p.key] && String(env[p.key]).trim()) : Boolean(env[p.enabledBy]);
    if (!available) continue;
    for (const model of p.models) {
      if (!model) continue;
      const litellm_params = { model };
      if (p.apiBase) litellm_params.api_base = p.apiBase;
      deployments.push({ litellm_params });
    }
  }
  if (deployments.length === 0) return null;

  // Hindsight's litellmrouter provider always sends completions to model_name
  // "default". Give only the first deployment that name, then make every later
  // provider/model an explicit fallback alias. The previous config named every
  // deployment "hindsight-llm", so Hindsight never addressed the router's logical
  // model at all and continued verifying its direct Gemini baseline instead.
  const model_list = deployments.map((entry, index) => ({
    model_name: index === 0 ? PRIMARY_MODEL_NAME : `fallback-${index}`,
    litellm_params: entry.litellm_params,
  }));
  const fallbackNames = model_list.slice(1).map((entry) => entry.model_name);

  const parsedRetries = Number(env.HINDSIGHT_LLM_NUM_RETRIES);
  // Hindsight already performs operation-level retries. Router retries are off by
  // default to avoid multiplying retry delays before the explicit fallback chain.
  const numRetries = Number.isFinite(parsedRetries) && parsedRetries >= 0 ? parsedRetries : 0;
  const timeout = Number(env.HINDSIGHT_LLM_TIMEOUT) || 30;
  return {
    model_list,
    ...(fallbackNames.length ? { fallbacks: [{ [PRIMARY_MODEL_NAME]: fallbackNames }] } : {}),
    ...(fallbackNames.length ? { context_window_fallbacks: [{ [PRIMARY_MODEL_NAME]: fallbackNames }] } : {}),
    num_retries: numRetries,
    timeout,
  };
}

// CLI: print the JSON for the current environment (used by the dev-server launcher).
const isMain = (() => {
  try { return import.meta.url === `file://${process.argv[1]}`; } catch { return false; }
})();
if (isMain) {
  const cfg = buildHindsightRouterConfig(process.env);
  if (!cfg) {
    process.stderr.write('[hindsight-llm-config] no provider keys present — emitting empty (single-model default applies)\n');
    process.stdout.write('');
  } else {
    process.stdout.write(JSON.stringify(cfg));
  }
}
