import { createHash } from 'crypto';
import { buildActiveProfileContext } from '../../llm/ActiveProfileContext';
import { planAnswer } from '../../llm/AnswerPlanner';
import { resolveProjectFileScopeForTurn } from './ProjectFileScope';
import type { CanonicalAnswerContext, SneakPeekIntelligenceRequest } from './types';

/** Capture main-process configuration before the first asynchronous operation. No file contents are read. */
export function captureAnswerContext(helper: any, mode: any, question: string, images = false, dataScopes: import('../../llm/ProviderRouter').ProviderDataScope[] = []): CanonicalAnswerContext {
  const plan = planAnswer({ question, source: 'manual_input', speakerPerspective: 'user', activeMode: mode });
  let referenceSourceIds: string[] = [];
  let personalSourceIds: string[] = [];
  let modeInstructions = '';
  const sourceVersions: Record<string, string> = {};
  try {
    const mm = require('../../services/ModesManager').ModesManager.getInstance();
    if (mode?.id) {
      referenceSourceIds = mm.getReferenceFiles(mode.id).map((file: { id: string; content: string }) => {
        sourceVersions[String(file.id)] = createHash('sha256').update(file.content).digest('hex');
        return String(file.id);
      });
      modeInstructions = mm.getActiveModePinnedInstructions(plan.answerType, mode.id);
    }
  } catch { /* unavailable source inventories grant no IDs */ }
  try {
    personalSourceIds = require('../../personalKnowledge').getPersonalKnowledgeManager().listFiles()
      .map((file: { id: string; updatedAt: string }) => { sourceVersions[String(file.id)] = file.updatedAt; return String(file.id); });
  } catch { /* unavailable */ }
  const profile = buildActiveProfileContext(helper.getKnowledgeOrchestrator?.());
  const profileDocuments: NonNullable<CanonicalAnswerContext['profileDocuments']>[number][] = [];
  for (const [sourceType, doc] of [['RESUME', profile.activeResume], ['JOB_DESCRIPTION', profile.activeJD]] as const) {
    if (doc) profileDocuments.push({ sourceId: String(doc.sourceId), revisionId: doc.documentHash,
      sourceType, content: JSON.stringify(doc.structured) });
  }
  return {
    modeInstructions, mode: mode ? { templateType: mode.templateType } : null, sourceVersions,
    promptTier: helper.getPromptTier?.() ?? 'full',
    languageInstruction: helper.buildLanguageInstructionSuffix?.(),
    answerPlan: plan,
    referenceSourceIds,
    personalSourceIds,
    profileDocuments,
    providerRoute: helper.getSneakPeekGenerationRouteOptions?.(dataScopes, images, { verifiedFallbacks: true }) ?? null,
  };
}

/** Inventory does not select evidence. The canonical planner resolves the source contract. */
export function buildAnswerRequest(input: {
  id: string; sessionId: string; question: string; mode: any;
  snapshot: CanonicalAnswerContext; signal: AbortSignal;
  surface: SneakPeekIntelligenceRequest['surface'];
  transcript?: SneakPeekIntelligenceRequest['transcriptContext'];
  history?: SneakPeekIntelligenceRequest['recentConversation'];
  sessionSnapshot?: string; imagePaths?: readonly string[]; screenText?: string;
  action?: SneakPeekIntelligenceRequest['action'];
}): SneakPeekIntelligenceRequest {
  const { id, question, mode, snapshot } = input;
  let files: any[] = [];
  try { files = require('../../personalKnowledge').getPersonalKnowledgeManager().listFiles()
    .filter((file: any) => snapshot.personalSourceIds.includes(String(file.id))); } catch { /* fail closed */ }
  const project = resolveProjectFileScopeForTurn(question, files, (input.history ?? []).map(turn => ({
    id: turn.id, text: turn.content, role: turn.role, speaker: turn.role,
    timestamp: turn.createdAt ?? 0, source: 'manual' as const, finalized: true, generationStatus: 'completed' as const,
  })), id);
  const hasResume = snapshot.profileDocuments?.some(doc => doc.sourceType === 'RESUME') === true;
  const hasJobDescription = snapshot.profileDocuments?.some(doc => doc.sourceType === 'JOB_DESCRIPTION') === true;
  return {
    requestId: id, sessionId: input.sessionId, surface: input.surface,
    answerContext: { ...snapshot, screenText: input.screenText }, action: input.action,
    userMessage: question, manualQuestion: question,
    currentTurn: { id, role: 'user', content: question, createdAt: Date.now() },
    recentConversation: input.history ?? [], transcriptContext: input.transcript,
    sessionSnapshot: input.sessionSnapshot,
    screenContext: input.imagePaths?.length || input.screenText ? { imagePaths: input.imagePaths, text: input.screenText } : undefined,
    activeContext: {
      modeId: mode?.id, modeName: mode?.name, modeTemplateType: mode?.templateType,
      modeSourceContract: mode?.sourceContract,
      hasReferenceFiles: snapshot.referenceSourceIds.length > 0, hasResume, hasJobDescription,
      profileId: hasResume || hasJobDescription ? 'local-profile' : undefined,
      meetingId: input.transcript ? input.sessionId : undefined,
      projectSourceIds: project.selectedFileIds ?? files.filter(file => file.fileType === 'project').map(file => String(file.id)), projectName: project.namedProject,
    },
    contextPermissions: {
      conversation: Boolean(input.history?.length || input.sessionSnapshot || input.action?.previousAnswer),
      transcript: Boolean(input.transcript?.text.trim()),
      screen: Boolean(input.imagePaths?.length || input.screenText),
      mode: Boolean(mode?.id), project: project.projectAvailable,
      profile: (hasResume || hasJobDescription) && !project.unresolvedReference,
      files: snapshot.personalSourceIds.length > 0,
      memory: !project.missingNamedProject && !project.unresolvedReference && snapshot.personalSourceIds.length > 0,
      generalKnowledge: true,
    },
    providerPreferences: { allowFallback: true, maxAttempts: 3 },
    cancellationSignal: input.signal,
  };
}

/** Clone only request-owned data. AbortSignal retains its live cancellation identity. */
export function freezeAnswerRequest(request: SneakPeekIntelligenceRequest): SneakPeekIntelligenceRequest {
  const { cancellationSignal, ...data } = request;
  const copy = JSON.parse(JSON.stringify(data)) as SneakPeekIntelligenceRequest;
  const freeze = (value: any): void => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  };
  freeze(copy);
  return Object.freeze({ ...copy, cancellationSignal });
}
