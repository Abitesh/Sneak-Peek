/**
 * Phone Mirror request adapter. It captures permissions at command entry,
 * leaving evidence selection, retrieval and final prompting to the engine.
 * The formatted SessionTracker snapshot is an untrusted conversation snapshot,
 * not a meeting transcript and not citation-bearing evidence.
 */
import type { SneakPeekActiveContext, SneakPeekIntelligenceRequest } from './types';

export interface PhoneMirrorRequestInput {
  requestId: string;
  sessionId: string;
  question: string;
  signal: AbortSignal;
  recentConversation: SneakPeekIntelligenceRequest['recentConversation'];
  sessionSnapshot?: string;
  activeContext: SneakPeekActiveContext;
  actualMeetingTranscript?: SneakPeekIntelligenceRequest['transcriptContext'];
  available: {
    profile: boolean;
    personalFiles: boolean;
    projectFiles: boolean;
    unresolvedProject: boolean;
    missingNamedProject: boolean;
  };
}

export function buildPhoneMirrorCanonicalRequest(input: PhoneMirrorRequestInput): SneakPeekIntelligenceRequest {
  const { requestId, question, sessionId, activeContext, available } = input;
  // A mixed phone/chat history (or an imported/live transcript) is not a
  // meeting source. Only an independently supplied, populated meeting record
  // may grant the phone surface transcript permissions.
  const transcript = input.actualMeetingTranscript;
  const authorizedMeeting = transcript?.source === 'meeting'
    && Boolean(transcript.text?.trim())
    && Boolean(transcript.turns?.some(turn => turn.content?.trim()))
    ? transcript : undefined;
  return {
    requestId,
    sessionId,
    surface: 'phone-mirror',
    userMessage: question,
    manualQuestion: question,
    currentTurn: { id: requestId, role: 'user', content: question, createdAt: Date.now() },
    recentConversation: input.recentConversation,
    sessionSnapshot: input.sessionSnapshot?.trim() || undefined,
    transcriptContext: authorizedMeeting,
    activeContext,
    cancellationSignal: input.signal,
    providerPreferences: { allowFallback: true, maxAttempts: 3 },
    contextPermissions: {
      conversation: Boolean(input.sessionSnapshot?.trim() || input.recentConversation.length),
      transcript: Boolean(authorizedMeeting),
      screen: false,
      mode: Boolean(activeContext.modeId),
      project: available.projectFiles,
      profile: available.profile && !available.unresolvedProject,
      files: available.personalFiles,
      memory: !available.missingNamedProject && (available.personalFiles || available.profile),
      generalKnowledge: true,
    },
  };
}
