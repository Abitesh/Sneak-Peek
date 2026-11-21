import type { SneakPeekIntelligenceRequest } from './types';

/** Narrow conversational courtesy fast path. No facts, source reads or model substitution. */
export function deterministicChatResponse(request: SneakPeekIntelligenceRequest): string | undefined {
  if (request.surface !== 'manual-chat' || request.action || request.liveAnswer || request.documentDraft
    || request.retrievalScope || request.imageAnalysis || request.screenContext || request.repair) return undefined;
  const question = String(request.manualQuestion ?? request.userMessage).trim();
  if (!/^(?:hi|hello|hey|good morning|good afternoon|good evening)[!.\s]*$/i.test(question)) return undefined;
  // A pinned non-English language preference must still go through the ordinary
  // language-aware planner. This path must not override it with English text.
  const language = request.answerContext?.languageInstruction?.trim();
  const pinned = language?.match(/You MUST write every single word of your response in ([^.\n]+)\./i)?.[1];
  if (pinned ? pinned !== 'English' : language && !/Answer in the language of the current question/i.test(language)) return undefined;
  if (request.answerContext?.callerInstruction || request.answerContext?.skill) return undefined;
  return /interview/i.test(String(request.answerContext?.mode?.templateType ?? ''))
    ? 'Hello! It’s nice to meet you. Thank you for taking the time to speak with me.'
    : 'Hi! How can I help?';
}
