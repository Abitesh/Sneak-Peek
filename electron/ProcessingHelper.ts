// ProcessingHelper.ts

import { AppState } from "./main"
import { LLMHelper } from "./LLMHelper"
import { CredentialsManager } from "./services/CredentialsManager"
import { resolveDefaultOllamaUrl } from "./services/OllamaManager"
import { app } from "electron"
// import dotenv from "dotenv" // Removed static import

if (!app.isPackaged) {
  require("dotenv").config()
}

export class ProcessingHelper {
  private appState: AppState
  private llmHelper: LLMHelper

  constructor(appState: AppState) {
    this.appState = appState

    // Check if user wants to use Ollama
    const useOllama = process.env.USE_OLLAMA === "true"
    const ollamaModel = process.env.OLLAMA_MODEL // Don't set default here, let LLMHelper auto-detect
    // OLLAMA_HOST (Ollama's own env var, macOS + Windows) takes precedence over
    // this app's legacy OLLAMA_URL — see resolveDefaultOllamaUrl().
    const ollamaUrl = resolveDefaultOllamaUrl()

    if (useOllama) {
      // console.log("[ProcessingHelper] Initializing with Ollama")
      this.llmHelper = new LLMHelper(undefined, true, ollamaModel, ollamaUrl)
    } else {
      // Try environment first (for development)
      let apiKey = process.env.GEMINI_API_KEY
      let groqApiKey = process.env.GROQ_API_KEY
      let openaiApiKey = process.env.OPENAI_API_KEY
      let claudeApiKey = process.env.CLAUDE_API_KEY
      let deepseekApiKey = process.env.DEEPSEEK_API_KEY
      let nvidiaNimApiKey = process.env.NVIDIA_NIM_API_KEY

      // Allow initializing without key (will be loaded in loadStoredCredentials or via Settings)
      if (!apiKey) {
        console.warn("[ProcessingHelper] GEMINI_API_KEY not found in env. Will try CredentialsManager after ready.")
      }

      this.llmHelper = new LLMHelper(apiKey, false, undefined, undefined, groqApiKey, openaiApiKey, claudeApiKey, deepseekApiKey, nvidiaNimApiKey)
    }
  }

  /**
   * Load stored credentials from CredentialsManager
   * Should be called after app.whenReady() when CredentialsManager is initialized
   */
  public loadStoredCredentials(): void {
    const credManager = CredentialsManager.getInstance();

    const geminiKey = credManager.getGeminiApiKey();
    const groqKey = credManager.getGroqApiKey();
    const openaiKey = credManager.getOpenaiApiKey();
    const claudeKey = credManager.getClaudeApiKey();
    const deepseekKey = credManager.getDeepseekApiKey();
    const nvidiaNimKey = credManager.getNvidiaNimApiKey();

    if (geminiKey) {
      console.log("[ProcessingHelper] Loading stored Gemini API Key from CredentialsManager");
      this.llmHelper.setApiKey(geminiKey);
    }

    if (groqKey) {
      console.log("[ProcessingHelper] Loading stored Groq API Key from CredentialsManager");
      this.llmHelper.setGroqApiKey(groqKey);
    }

    if (openaiKey) {
      console.log("[ProcessingHelper] Loading stored OpenAI API Key from CredentialsManager");
      this.llmHelper.setOpenaiApiKey(openaiKey);
    }

    if (claudeKey) {
      console.log("[ProcessingHelper] Loading stored Claude API Key from CredentialsManager");
      this.llmHelper.setClaudeApiKey(claudeKey);
    }

    if (deepseekKey) {
      console.log("[ProcessingHelper] Loading stored DeepSeek API Key from CredentialsManager");
      this.llmHelper.setDeepseekApiKey(deepseekKey);
    }
    if (nvidiaNimKey) this.llmHelper.setNvidiaNimApiKey(nvidiaNimKey);

    const litellmBaseURL = credManager.getLitellmBaseURL();
    if (litellmBaseURL) {
      console.log("[ProcessingHelper] Loading stored LiteLLM config from CredentialsManager");
      this.llmHelper.setLitellmConfig(credManager.getLitellmApiKey() || '', litellmBaseURL, credManager.getLitellmMaxTokens());
    }

    // Sneak-Peek API is intentionally disabled in this build. The app now uses a
    // single authoritative Gemini key and the provider list does not include the
    // hosted backend at all.

    // CRITICAL: Re-initialize IntelligenceManager now that keys are loaded
    // This fixes the issue where buttons don't work in production because of late key loading
    this.appState.getIntelligenceManager().initializeLLMs();

    // CRITICAL: Initialize RAGManager (Embeddings) with loaded keys
    // This fixes "RAG unavailable" in production where process.env is empty
    const ragManager = this.appState.getRAGManager();
    if (ragManager) {
      console.log("[ProcessingHelper] Initializing RAGManager embeddings with available keys");
      ragManager.initializeEmbeddings({
          openaiKey: openaiKey || undefined,
          geminiKey: geminiKey || undefined,
          ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
          // ollamaUrl is not fetched in CredentialsManager yet by default, but we pass these keys
          providerDataScopes: (() => { try { const { SettingsManager } = require('./services/SettingsManager'); return SettingsManager.getInstance().get('providerDataScopes'); } catch { return undefined; } })()
      });

      // CRITICAL: Retry pending embeddings now that we have a key
      // This ensures any meetings that failed or were queued during startup get processed
      console.log("[ProcessingHelper] Retrying pending embeddings...");
      ragManager.retryPendingEmbeddings().catch(console.error);

      // CRITICAL: Ensure demo meeting has chunks
      ragManager.ensureDemoMeetingProcessed().catch(console.error);

      // CRITICAL: Cleanup stale queue items to prevent "Chunk not found" errors
      ragManager.cleanupStaleQueueItems();
    }

    // Initialize self-improving model version manager (background, non-blocking)
    this.llmHelper.initModelVersionManager().catch(err => {
      console.warn('[ProcessingHelper] ModelVersionManager initialization failed (non-critical):', err.message);
    });

    // NEW: Load Default Model Config
    const defaultModel = credManager.getDefaultModel();
    if (defaultModel) {
      console.log(`[ProcessingHelper] Loading stored Default Model: ${defaultModel}`);
      const customProviders = credManager.getCustomProviders();
      const curlProviders = credManager.getCurlProviders();
      const allProviders = [...(customProviders || []), ...(curlProviders || [])];
      this.llmHelper.setModel(defaultModel, allProviders);
    }

    // Load Languages
    const sttLanguage = credManager.getSttLanguage();
    const aiResponseLanguage = credManager.getAiResponseLanguage();

    if (sttLanguage) {
      this.llmHelper.setSttLanguage(sttLanguage);
    }

    if (aiResponseLanguage) {
      this.llmHelper.setAiResponseLanguage(aiResponseLanguage);
    }
  }

  public getLLMHelper() {
    return this.llmHelper;
  }
}
