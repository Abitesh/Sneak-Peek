/**
 * Normalized Provider Error Contract
 * 
 * Standardizes error responses from provider APIs to enable
 * consistent error handling, user messaging, and retry logic
 * across all 6 providers (Gemini, OpenAI, Claude, DeepSeek, Groq, NVIDIA NIM).
 */

export type ErrorCategory =
  | 'AUTHENTICATION_ERROR'
  | 'INVALID_API_KEY'
  | 'NO_CREDITS'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface NormalizedProviderError {
  /** Provider identifier: gemini, openai, claude, deepseek, groq, nvidia_nim */
  provider: 'gemini' | 'openai' | 'claude' | 'deepseek' | 'groq' | 'nvidia_nim';
  
  /** Model ID that was being accessed (if applicable) */
  model?: string;
  
  /** Standardized error category for consistent handling */
  category: ErrorCategory;
  
  /** Human-readable error message */
  message: string;
  
  /** Whether this error is retryable (rate limits, timeouts, network) */
  retryable: boolean;
  
  /** HTTP status code if applicable */
  statusCode?: number;
  
  /** Raw error message from the provider (for debugging) */
  rawMessage?: string;
  
  /** Suggested retry delay in milliseconds (for rate limits) */
  retryAfterMs?: number;
}

/**
 * Categorize and normalize provider errors
 * 
 * Takes raw error responses from provider APIs and converts them
 * to a standard contract for consistent handling across the app.
 */
export function normalizeProviderError(
  provider: 'gemini' | 'openai' | 'claude' | 'deepseek' | 'groq' | 'nvidia_nim',
  error: any,
  model?: string
): NormalizedProviderError {
  const message = error?.message || String(error) || 'Unknown error';
  const statusCode = error?.status || error?.statusCode || error?.response?.status;
  const rawMessage = error?.response?.data?.error?.message || error?.response?.data?.message || message;
  // Axios' top-level message is often only "Request failed with status code
  // 400". Provider-specific details live in response.data.error.message, so
  // classification must consider both while still returning controlled text.
  const classificationMessage = `${message} ${rawMessage}`;

  // Authenticate error patterns
  if (
    statusCode === 401 ||
    /unauthorized|unauthenticated|invalid.*key|invalid.*credential|authentication.*failed/i.test(classificationMessage) ||
    /invalid.*api.*key|api.*key.*invalid|api.*key.*missing|api.*key.*not.*found/i.test(classificationMessage)
  ) {
    return {
      provider,
      model,
      category: 'INVALID_API_KEY',
      message: 'Invalid API key. Please check your credentials and try again.',
      rawMessage,
      statusCode,
      retryable: false,
    };
  }

  // A valid-looking key can still be forbidden by account/workspace policy.
  // Keep this distinct from INVALID_API_KEY so the UI does not tell the user
  // to re-enter a credential when the provider is actually denying access.
  if (statusCode === 403 || /permission[_ ]?denied|forbidden|not authorized/i.test(classificationMessage)) {
    return {
      provider,
      model,
      category: 'AUTHENTICATION_ERROR',
      message: "Provider access was forbidden. Check this API key's permissions and account access.",
      rawMessage,
      statusCode,
      retryable: false,
    };
  }

  // No credits / insufficient quota
  if (
    statusCode === 429 && provider === 'gemini' ||
    /insufficient|quota|credit|account.*limit|plan.*limit|exceeds|limit.*reached/i.test(classificationMessage) ||
    /rate.*limit.*exceeded|exceeded.*limit|too.*many.*request/i.test(classificationMessage)
  ) {
    if (/credit|insufficient.*quota|account.*limit|plan.*limit/i.test(classificationMessage)) {
      return {
        provider,
        model,
        category: 'NO_CREDITS',
        message: 'Insufficient credits or quota. Upgrade your account or wait for reset.',
        rawMessage,
        statusCode,
        retryable: false,
      };
    }
    // Rate limit
    const retryAfter = error?.response?.headers?.['retry-after'];
    const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    return {
      provider,
      model,
      category: 'RATE_LIMITED',
      message: 'Rate limited. Please wait before retrying.',
      rawMessage,
      statusCode,
      retryable: true,
      retryAfterMs,
    };
  }

  // Model not found
  if (
    statusCode === 404 ||
    /model.*not.*found|model.*not.*exist|unknown.*model|model.*unavailable/i.test(classificationMessage) ||
    /does.*not.*exist|not.*found|404/i.test(classificationMessage)
  ) {
    return {
      provider,
      model,
      category: 'MODEL_NOT_FOUND',
      message: `Model "${model || 'unknown'}" not found or unavailable for this API key.`,
      rawMessage,
      statusCode,
      retryable: false,
    };
  }

  // Timeout / Network
  if (
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ENOTFOUND' ||
    /timeout|timed out|time out|connect.*error|network.*error|econnrefused/i.test(classificationMessage)
  ) {
    return {
      provider,
      model,
      category: 'TIMEOUT',
      message: 'Request timed out. Please check your connection and try again.',
      rawMessage,
      retryable: true,
      retryAfterMs: 5000,
    };
  }

  // Server errors (5xx)
  if (statusCode && statusCode >= 500) {
    return {
      provider,
      model,
      category: 'SERVER_ERROR',
      message: 'Provider server error. The service may be temporarily unavailable.',
      rawMessage,
      statusCode,
      retryable: true,
      retryAfterMs: 10000,
    };
  }

  // Provider validation errors are commonly HTTP 400 with the useful reason
  // only in response.data.error.message (not error.message). Surface that
  // controlled provider text instead of the unhelpful Axios status sentence.
  if (statusCode && statusCode >= 400 && statusCode < 500 && rawMessage && rawMessage !== message) {
    return {
      provider,
      model,
      category: 'UNKNOWN_ERROR',
      message: `Provider rejected the request: ${rawMessage}`,
      rawMessage,
      statusCode,
      retryable: false,
    };
  }

  // Default to unknown
  return {
    provider,
    model,
    category: 'UNKNOWN_ERROR',
    message: `An error occurred: ${message}`,
    rawMessage,
    statusCode,
    retryable: false,
  };
}

/**
 * Human-friendly error message for UI display
 */
export function getErrorDisplayMessage(error: NormalizedProviderError): string {
  switch (error.category) {
    case 'INVALID_API_KEY':
      return `Invalid API key for ${error.provider}. Please check your credentials.`;
    case 'NO_CREDITS':
      return `Insufficient credits. Upgrade your ${error.provider} account.`;
    case 'QUOTA_EXCEEDED':
      return `Monthly quota exceeded. Reset next month or upgrade.`;
    case 'MODEL_NOT_FOUND':
      return `Model "${error.model}" not available with your API key.`;
    case 'RATE_LIMITED':
      return `Rate limited. Please wait before retrying.`;
    case 'TIMEOUT':
      return `Request timed out. Check your connection.`;
    case 'SERVER_ERROR':
      return `${error.provider} service temporarily unavailable.`;
    case 'NETWORK_ERROR':
      return `Network error. Check your connection.`;
    case 'AUTHENTICATION_ERROR':
      return `Authentication failed. Re-enter your API key.`;
    default:
      return error.message;
  }
}
