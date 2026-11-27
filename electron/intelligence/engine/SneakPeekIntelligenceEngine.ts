import { deterministicChatResponse } from './DeterministicChatResponse';
import { freezeAnswerRequest } from './AnswerRequest';
import type {
  IntelligenceIntent,
  IntelligenceResponseType,
  SneakPeekIntelligenceRequest,
  SneakPeekIntelligenceResult,
  SneakPeekSelectedContext,
  SneakPeekRetrievalPlan,
} from './types';
import { getRecentConversationContext, isUsableConversationTurn } from './TranscriptContext';
import type { ConversationTurn } from '../../context-intelligence/question/conversation-state';
import { getConversationState } from '../../context-intelligence/question/conversation-state-store';
import { understandTurn } from '../../context-intelligence/question/question-resolver';
import { planContext } from './ContextPlanner';
import type { ContextSource } from './ContextTypes';
import { RetrievalCoordinator } from './RetrievalCoordinator';
import { buildEvidencePackFromSneakPeekEvidence } from '../context-os/evidencePack';
import { assembleSneakPeekPrompt } from './PromptAssembler';
import { planResponse } from './ResponsePlanner';
import { GenerationLifecycle, type GenerationLifecycleSnapshot } from './GenerationController';
import { projectRetrievalQuery } from './ProjectFileScope';

/**
 * Central entry boundary for Sneak-Peek Intelligence.
 *
 * Change 2 deliberately stops at the contract/decision boundary.  It does not
 * call a provider or RAG implementation yet.  Later changes can replace the
 * small decision methods with the real understand → plan → retrieve → prompt
 * → generate pipeline without changing the request/result contract.
 */
export interface SneakPeekGenerationPort {
  stream(input: {
    request: SneakPeekIntelligenceRequest;
    prompt: SneakPeekIntelligenceResult['prompt'];
    contextPlan: SneakPeekIntelligenceResult['contextPlan'];
    responsePlan?: SneakPeekIntelligenceResult['responsePlan'];
    lifecycle: GenerationLifecycle;
  }): AsyncGenerator<string, void, unknown>;
}

// Presentation-only wrappers must not become required lexical evidence terms.
function meetingRetrievalQuery(question: string): string {
  const cleaned = question
    .replace(/^according to (?:the|these|my) meetings?,\s*/i, '')
    .replace(/([?!.])\s*(?:answer|reply|respond) in (?:one|two|three|[123]) (?:sentences?|bullets?)[.!]?\s*$/i, '$1')
    .trim();
  return cleaned || question;
}

export class SneakPeekIntelligenceEngine {
  private readonly retrievalCoordinator: RetrievalCoordinator;
  private readonly preferences?: () => import('../../session/SessionPreferences').SessionPreferences;
  private readonly generationPort?: SneakPeekGenerationPort;

  constructor(options?: {
    retrievalCoordinator?: RetrievalCoordinator;
    preferences?: () => import('../../session/SessionPreferences').SessionPreferences;
    generationPort?: SneakPeekGenerationPort;
  } | RetrievalCoordinator) {
    // Each Electron entry is bundled separately; a coordinator supplied by
    // another entry can have a different class identity. Honor the port shape.
    if (options && typeof (options as RetrievalCoordinator).retrieve === 'function') {
      this.retrievalCoordinator = options as RetrievalCoordinator;
      this.generationPort = undefined;
      return;
    }
    const config = options as { retrievalCoordinator?: RetrievalCoordinator; generationPort?: SneakPeekGenerationPort; preferences?: () => import('../../session/SessionPreferences').SessionPreferences } | undefined;
    this.retrievalCoordinator = config?.retrievalCoordinator ?? new RetrievalCoordinator();
    this.generationPort = config?.generationPort;
    this.preferences = config?.preferences;
  }

  /**
   * Primary manual-chat execution boundary. Planning/retrieval/prompt assembly
   * are completed by this engine before the injected generation port is allowed
   * to start. The engine never knows which provider implements the port.
   */
  prepareAndStream(request: SneakPeekIntelligenceRequest): {
    stream: AsyncGenerator<string, void, unknown>;
    result: Promise<SneakPeekIntelligenceResult>;
    lifecycle: GenerationLifecycle;
  } {
    request = this.pinRequest(request);
    if (!this.generationPort) throw new Error('SneakPeekIntelligenceEngine generation port is not configured.');
    const lifecycle = new GenerationLifecycle(request.requestId);
    lifecycle.transition('PLANNING', 'manual chat request accepted by Sneak-Peek Intelligence Engine');
    let resolveResult!: (value: SneakPeekIntelligenceResult) => void;
    let rejectResult!: (reason?: unknown) => void;
    let resultSettled = false;
    let preparedResult: SneakPeekIntelligenceResult | null = null;
    const resultPromise = new Promise<SneakPeekIntelligenceResult>((resolve, reject) => {
      resolveResult = (value) => {
        if (resultSettled) return;
        resultSettled = true;
        resolve(value);
      };
      rejectResult = (reason) => {
        if (resultSettled) return;
        resultSettled = true;
        reject(reason);
      };
    });

    const stream = (async function* (engine: SneakPeekIntelligenceEngine) {
      let text = '';

      const buildCancelledResult = (
        base: SneakPeekIntelligenceResult,
        reason: string,
      ): SneakPeekIntelligenceResult => {
        lifecycle.cancel(reason);
        return {
          ...base,
          providerAttempt: { status: 'cancelled' },
          streamLifecycle: {
            status: 'cancelled',
            startedAt: base.streamLifecycle.startedAt,
            firstTokenAt: base.streamLifecycle.firstTokenAt,
            endedAt: Date.now(),
            tokenCount: text.length,
          },
          diagnostics: {
            ...base.diagnostics,
            stages: [...base.diagnostics.stages, 'cancelled'],
            pipelineStages: [...base.diagnostics.pipelineStages, 'GenerationController'],
            warnings: [...base.diagnostics.warnings, `Generation cancelled: ${reason}`],
          },
          finalAnswer: null,
        };
      };

      try {
        const result = await engine.handle(request, lifecycle);
        preparedResult = result;
        if (request.cancellationSignal?.aborted) {
          resolveResult(buildCancelledResult(result, 'cancelled before provider generation'));
          return;
        }

        const directResponse = result.evidence.items.length === 0 ? deterministicChatResponse(request) : undefined;
        const providerStream = directResponse === undefined
          ? engine.generationPort!.stream({ request, prompt: result.prompt, contextPlan: result.contextPlan, responsePlan: result.responsePlan, lifecycle })
          : (async function* () {
            lifecycle.transition('GENERATING', 'deterministic courtesy response; no provider call');
            lifecycle.transition('COMMITTED', 'deterministic visible answer accepted');
            yield directResponse;
            if (!request.cancellationSignal?.aborted) lifecycle.transition('COMPLETED', 'courtesy response completed');
          })();
        for await (const chunk of providerStream) {
          if (request.cancellationSignal?.aborted) break;
          text += chunk;
          yield chunk;
        }
        if (request.cancellationSignal?.aborted) {
          resolveResult(buildCancelledResult(result, 'cancelled during provider stream'));
          return;
        }

        const completed = lifecycle.state === 'COMPLETED';
        const lifecycleHistory: GenerationLifecycleSnapshot['history'] = lifecycle.snapshot.history;
        // GenerationController can fail without throwing (e.g. every cloud
        // provider is excluded by a data-scope policy). Preserve its terminal
        // reason so callers do not replace a real denial with a generic error.
        const failureReason = lifecycle.state === 'FAILED'
          ? lifecycleHistory.find((entry) => entry.state === 'FAILED')?.reason
          : undefined;
        const finalResult: SneakPeekIntelligenceResult = {
          ...result,
          providerAttempt: {
            provider: lifecycle.committedProvider,
            model: lifecycle.committedModel,
            status: lifecycle.state === 'CANCELLED' ? 'cancelled' : completed ? 'succeeded' : lifecycle.state === 'FAILED' ? 'failed' : 'started',
            ...(failureReason ? { error: failureReason } : {}),
          },
          streamLifecycle: {
            status: lifecycle.state === 'CANCELLED' ? 'cancelled' : completed ? 'completed' : lifecycle.state === 'FAILED' ? 'failed' : 'streaming',
            startedAt: lifecycleHistory.find((h) => h.state === 'GENERATING')?.at,
            firstTokenAt: lifecycleHistory.find((h) => h.state === 'COMMITTED')?.at,
            endedAt: lifecycleHistory.find((h) => h.state === 'COMPLETED' || h.state === 'CANCELLED' || h.state === 'FAILED')?.at,
            tokenCount: text.length,
          },
          diagnostics: {
            ...result.diagnostics,
            stages: [...result.diagnostics.stages, 'provider-router', 'generation-controller'],
            pipelineStages: [...result.diagnostics.pipelineStages, 'ProviderRouter', 'GenerationController'],
          },
          finalAnswer: text ? { text, completed } : null,
        };
        resolveResult(finalResult);
      } catch (error) {
        if (request.cancellationSignal?.aborted) {
          const base = preparedResult ?? engine.cancelledResult(request, `${request.sessionId}:${request.requestId}`, ['cancelled']);
          resolveResult(buildCancelledResult(base, 'cancelled during generation'));
          return;
        }
        if (lifecycle.state !== 'FAILED' && lifecycle.state !== 'CANCELLED') lifecycle.fail(error instanceof Error ? error.message : String(error));
        rejectResult(error);
        throw error;
      } finally {
        // Async-generator consumers can close this stream before the provider
        // iterator reaches its normal terminal path (for example when manual
        // chat is superseded immediately after a visible chunk). The caller
        // still awaits `result`, so cancellation must settle it here rather
        // than relying on another provider chunk to observe the abort signal.
        if (request.cancellationSignal?.aborted && !resultSettled) {
          const base = preparedResult ?? engine.cancelledResult(request, `${request.sessionId}:${request.requestId}`, ['cancelled']);
          resolveResult(buildCancelledResult(base, 'consumer closed an aborted generation'));
        }
      }
    })(this);

    return { stream, result: resultPromise, lifecycle };
  }

  async handle(request: SneakPeekIntelligenceRequest, lifecycle?: GenerationLifecycle): Promise<SneakPeekIntelligenceResult> {
    request = this.withPreferences(request);
    const traceId = `${request.sessionId}:${request.requestId}`;
    const stages: string[] = [];
    const pipelineStages: string[] = [];

    if (request.cancellationSignal?.aborted) {
      stages.push('cancelled');
      return this.cancelledResult(request, traceId, stages);
    }

    stages.push('understand');
    pipelineStages.push('TurnUnderstanding');
    const resolvedQuestion = this.resolveQuestion(request);
    const storedConversation = request.contextPermissions.conversation ? getConversationState(request.sessionId) : undefined;
    const turnUnderstanding = understandTurn({
      manualQuestion: request.manualQuestion ?? request.userMessage,
      selectedText: request.manualQuestion,
      sessionId: request.sessionId,
      conversationState: storedConversation ? { ...storedConversation, turns: storedConversation.turns.filter((turn) => turn.id === request.currentTurn.id || isUsableConversationTurn(turn) && (!['coding-dsa','cs-fundamentals'].includes(request.activeContext?.modeTemplateType??'') || turn.metadata?.modeTemplateType===request.activeContext?.modeTemplateType)) } : undefined,
      hasScreenContext: Boolean(request.screenContext),
      transcript: request.transcriptContext?.turns?.map((turn) => ({
        role: turn.role === 'assistant' ? 'assistant' : 'interviewer',
        text: turn.content,
        timestamp: turn.createdAt ?? Date.now(),
      })),
    });

    stages.push('plan-context');
    pipelineStages.push('ContextPlan');
    let conversationContext = getRecentConversationContext({
      sessionId: request.sessionId,
      currentTurn: this.toConversationTurn(request.currentTurn),
      currentQuestion: request.userMessage,
      includePreviousTurns: request.contextPermissions.conversation,
    });
    if ((request.answerContext || ['coding-dsa','cs-fundamentals'].includes(request.activeContext?.modeTemplateType??'')) && request.contextPermissions.conversation) {
      const turns = request.recentConversation.slice(-12).map(turn => this.toConversationTurn(turn));
      const currentTurn = this.toConversationTurn(request.currentTurn);
      conversationContext = { currentTurn, immediatePreviousTurns: turns.filter(turn => turn.id !== currentTurn.id).slice(-2).reverse(),
        recentTranscriptWindow: [...turns.filter(turn => turn.id !== currentTurn.id), currentTurn].slice(-12),
        olderConversationTurnsAvailable: Math.max(0, request.recentConversation.length - 12),
        currentTurnIncluded: true, longTermKnowledgeIncluded: false };
    }
    const contextPlan = planContext({
      request,
      understanding: turnUnderstanding,
      availability: {
        recentConversation: request.action
          ? Boolean(request.action.sessionSnapshot?.trim() || request.action.previousAnswer?.trim())
          : conversationContext.immediatePreviousTurns.length > 0 || Boolean(conversationContext.currentTurnIncluded),
        longerConversation: Boolean(conversationContext.olderConversationTurnsAvailable),
        meetingTranscript: request.transcriptContext?.source === 'meeting' || request.transcriptContext?.source === 'live',
        screen: Boolean(request.screenContext),
        // Permissions at this boundary are derived from the real source
        // inventories by IPC, not guessed as 'unavailable' by the planner.
        personalKnowledge: request.contextPermissions.memory,
        myFiles: request.contextPermissions.files,
        profile: request.contextPermissions.profile,
        structuredKnowledge: request.contextPermissions.memory,
        projectKnowledge: request.contextPermissions.project,
        modeDocuments: request.contextPermissions.mode && Boolean(request.activeContext?.modeId),
      },
    });
    const selectedContext = this.projectSelectedContext(request, contextPlan);

    stages.push('plan-retrieval');
    pipelineStages.push('RetrievalCoordinator');
    const retrievalQuery = contextPlan.requiredSources.includes('project_knowledge')
      ? projectRetrievalQuery(turnUnderstanding.question || resolvedQuestion, request.activeContext?.projectName, request.activeContext?.projectSourceIds)
      : request.retrievalScope
        ? meetingRetrievalQuery(turnUnderstanding.question || resolvedQuestion)
        : turnUnderstanding.question || resolvedQuestion;
    const retrievalPlan = this.planRetrieval(retrievalQuery, contextPlan);

    if (lifecycle?.state === 'PLANNING') lifecycle.transition('RETRIEVING', 'context plan created; retrieval started');
    stages.push('retrieve');
    const retrievalResult = await this.retrievalCoordinator.retrieve(
      contextPlan,
      request,
      retrievalQuery,
    );

    stages.push('build-evidence');
    pipelineStages.push('EvidencePack');
    const evidencePack = buildEvidencePackFromSneakPeekEvidence({
      turnId: request.currentTurn.id || request.requestId,
      query: turnUnderstanding.question || resolvedQuestion,
      contextPlan,
      evidence: retrievalResult.evidence,
    });
    const responsePlan = request.repair?.responsePlan ?? planResponse({
      question: turnUnderstanding.question || resolvedQuestion,
      turnUnderstanding,
      action: request.action,
      documentDraft: request.documentDraft,
      liveAnswer: request.liveAnswer,
      answerContext: request.answerContext,
    });
    const preferences=request.activeContext?.sessionPreferences;
    if(preferences&&!request.repair&&!request.documentDraft){
      const explicitDetail=/\b(?:in detail|detailed|briefly|brief|concise|short|one sentence|two sentences|elaborate)\b/i.test(turnUnderstanding.question);
      if(!explicitDetail && responsePlan.requestedDurationSeconds === undefined && preferences.length !== 'medium'){responsePlan.detailLevel=preferences.length==='short'?'concise':preferences.length==='long'?'detailed':'normal';
        responsePlan.maxSentences=responsePlan.kind==='coding'?undefined:preferences.length==='short'?4:preferences.length==='long'?14:8;
        responsePlan.maxTokens=responsePlan.kind==='coding'?1800:preferences.length==='short'?350:preferences.length==='long'?1100:650;}
      if(responsePlan.kind!=='coding')responsePlan.format=preferences.format==='bullets'?'bullets':preferences.format==='script-bullets'?'structured':'prose';
    }
    const intent = this.mapIntent(turnUnderstanding.intent);
    const responseType = responsePlan.kind === 'coding' ? 'coding-answer' : this.resolveResponseType(request, intent);

    stages.push('assemble-prompt');
    pipelineStages.push('PromptAssembler');
    const assembledPrompt = assembleSneakPeekPrompt({
      request,
      question: turnUnderstanding.question || resolvedQuestion,
      contextPlan,
      conversationContext,
      evidencePack,
      responsePlan,
      screenContext: request.screenContext?.text,
      languageInstruction: request.action?.languageInstruction ?? request.liveAnswer?.languageInstruction,
    });

    return {
      requestId: request.requestId,
      resolvedQuestion: turnUnderstanding.question || resolvedQuestion,
      turnUnderstanding,
      responsePlan,
      intent,
      responseType,
      selectedContext,
      contextPlan,
      conversationContext,
      retrievalPlan,
      evidence: retrievalResult.evidence,
      evidencePack,
      prompt: assembledPrompt,
      providerAttempt: { status: 'not-started' },
      streamLifecycle: { status: 'not-started' },
      diagnostics: {
        traceId,
        stages,
        pipelineStages,
        warnings: [
          ...(retrievalResult.trace.sourceOutcomes.some((outcome) => outcome.status === 'unavailable')
            ? ['A required retrieval capability was unavailable'] : []),
          ...(retrievalResult.trace.sourceOutcomes.some((outcome) => outcome.status === 'denied')
            ? ['A planned retrieval source was denied by request permissions'] : []),
          ...(retrievalResult.trace.callCount === 0 && contextPlan.retrievalRequired
            && retrievalResult.trace.sourceOutcomes.length === 0
            ? ['Retrieval was planned but no matching retrieval capability was registered'] : []),
        ],
        retrieval: retrievalResult.trace.sourceOutcomes.map((outcome) => ({
          ...outcome,
          includedCount: evidencePack.items.filter((item) =>
            item.canonicalSource === outcome.source
            && assembledPrompt.includedEvidenceIds.includes(item.evidenceId)
          ).length,
        })),
      },
      finalAnswer: null,
    };
  }

  pinRequest(request:SneakPeekIntelligenceRequest):SneakPeekIntelligenceRequest {return freezeAnswerRequest(this.withPreferences(request));}

  private withPreferences(request:SneakPeekIntelligenceRequest):SneakPeekIntelligenceRequest {
    const mode=request.activeContext?.modeTemplateType;
    const p=request.activeContext?.sessionPreferences??this.preferences?.();
    if(['coding-dsa','cs-fundamentals'].includes(mode??'')){
      const history=request.recentConversation.filter(turn=>turn.metadata?.modeTemplateType===mode);
      return {...request,recentConversation:history,sessionSnapshot:undefined,imageConversationSnapshot:undefined,
        action:request.action?{...request.action,sessionSnapshot:undefined,previousAnswer:history.some(t=>t.role==='assistant'&&t.content===request.action?.previousAnswer)?request.action.previousAnswer:undefined}:undefined,
        activeContext:{...request.activeContext,sessionPreferences:p,projectName:undefined,projectSourceIds:undefined,resumeSourceIds:undefined,profileProjectName:undefined}};
    }
    if(!p)return request;
    return {...request,activeContext:{...request.activeContext,sessionPreferences:p}};
  }

  private cancelledResult(
    request: SneakPeekIntelligenceRequest,
    traceId: string,
    stages: string[],
  ): SneakPeekIntelligenceResult {
    const cancelledUnderstanding = understandTurn({
      manualQuestion: request.manualQuestion ?? request.userMessage,
      sessionId: request.sessionId,
      conversationState: request.contextPermissions.conversation ? getConversationState(request.sessionId) : undefined,
      hasScreenContext: Boolean(request.screenContext),
    });
    // Follow-up resolution may use stored conversation state. The cancelled
    // result and its response plan must expose the same canonical question.
    const resolvedQuestion = cancelledUnderstanding.question || this.resolveQuestion(request);
    const cancelledResponsePlan = planResponse({
      question: resolvedQuestion,
      turnUnderstanding: cancelledUnderstanding,
    });
    // Cancellation still returns the public diagnostic contract, but it must
    // describe one decision snapshot. Reuse the canonical owners instead of
    // independently re-running understanding/planning for each output field.
    const contextPlan = planContext({ request, understanding: cancelledUnderstanding });
    const conversationContext = getRecentConversationContext({
      sessionId: request.sessionId,
      currentTurn: this.toConversationTurn(request.currentTurn),
      currentQuestion: request.userMessage,
      includePreviousTurns: request.contextPermissions.conversation,
    });
    const evidence = { items: [], sufficient: false };
    const evidencePack = buildEvidencePackFromSneakPeekEvidence({
      turnId: request.currentTurn.id || request.requestId,
      query: request.userMessage,
      contextPlan,
      evidence,
      answerPolicy: 'ask_clarification',
    });
    return {
      requestId: request.requestId,
      resolvedQuestion,
      turnUnderstanding: cancelledUnderstanding,
      responsePlan: cancelledResponsePlan,
      intent: 'ambiguous',
      responseType: request.responseShape?.type ?? 'answer',
      selectedContext: { items: [] },
      contextPlan,
      conversationContext,
      retrievalPlan: {
        shouldRetrieve: false,
        mode: 'none',
        query: '',
        sources: [],
        maximumResults: 0,
      },
      evidence,
      evidencePack,
      prompt: assembleSneakPeekPrompt({
        request,
        question: '',
        contextPlan,
        conversationContext,
        responsePlan: cancelledResponsePlan,
        evidencePack,
      }),
      providerAttempt: { status: 'cancelled' },
      streamLifecycle: { status: 'cancelled' },
      diagnostics: { traceId, stages, pipelineStages: ['TurnUnderstanding', 'ContextPlan', 'RetrievalCoordinator', 'EvidencePack', 'PromptAssembler'], warnings: ['Request was cancelled before intelligence processing began'] },
      finalAnswer: null,
    };
  }


  private toConversationTurn(turn: SneakPeekIntelligenceRequest['currentTurn']): ConversationTurn {
    return {
      id: turn.id,
      role: turn.role === 'assistant' ? 'assistant' : 'user',
      speaker: turn.role,
      text: turn.content,
      timestamp: turn.createdAt ?? Date.now(),
      finalized: true,
      source: 'manual-chat',
    };
  }

  private resolveQuestion(request: SneakPeekIntelligenceRequest): string {
    const candidates = [
      request.manualQuestion,
      request.userMessage,
      request.currentTurn.content,
    ];

    return candidates.find((value) => value?.trim())?.trim() ?? '';
  }

  private mapIntent(intent: import('../../context-intelligence/question/question-resolver').TurnIntent): IntelligenceIntent {
    switch (intent) {
      case 'coding-request': return 'coding-task';
      case 'project-question': return 'project-question';
      case 'personal-question': return 'personal-question';
      case 'document-question': return 'document-question';
      case 'meeting-question': return 'meeting-question';
      case 'screen-question': return 'screen-question';
      case 'follow-up': return 'follow-up';
      case 'system-design': return 'system-design';
      case 'clarification': return 'clarification';
      case 'ambiguous': return 'ambiguous';
      default: return 'general-question';
    }
  }

  private resolveResponseType(
    request: SneakPeekIntelligenceRequest,
    intent: IntelligenceIntent,
  ): IntelligenceResponseType {
    if (request.responseShape?.type) return request.responseShape.type;
    if (intent === 'coding-task') return 'coding-answer';
    if (intent === 'follow-up') return 'answer';
    if (intent === 'recap') return 'recap';
    if (intent === 'clarification') return 'clarification';
    if (request.responseShape?.spoken) return 'spoken-answer';
    return 'answer';
  }

  private projectSelectedContext(
    request: SneakPeekIntelligenceRequest,
    plan: import('./ContextTypes').ContextPlan,
  ): SneakPeekSelectedContext {
    const selected = new Set(plan.requiredSources);
    const optional = new Set(plan.optionalSources);
    const isSelected = (source: import('./ContextTypes').ContextSource) => selected.has(source) || optional.has(source);

    return {
      items: [
        { kind: 'conversation', selected: isSelected('recent_conversation') || isSelected('longer_conversation'), reason: plan.sources.find((s) => s.source === 'recent_conversation')?.reason ?? 'Not selected by context planner' },
        { kind: 'transcript', selected: isSelected('meeting_transcript'), reason: plan.sources.find((s) => s.source === 'meeting_transcript')?.reason ?? 'Not selected by context planner' },
        { kind: 'manual-question', selected: Boolean(request.manualQuestion), reason: request.manualQuestion ? 'Explicit manual question supplied' : 'No separate manual question supplied' },
        { kind: 'screen', selected: isSelected('screen'), reason: plan.sources.find((s) => s.source === 'screen')?.reason ?? 'Not selected by context planner' },
        { kind: 'mode', selected: isSelected('mode_documents'), reason: plan.sources.find((s) => s.source === 'mode_documents')?.reason ?? 'Not selected by context planner' },
        { kind: 'project', selected: isSelected('project_knowledge'), reason: plan.sources.find((s) => s.source === 'project_knowledge')?.reason ?? 'Not selected by context planner' },
        { kind: 'profile', selected: isSelected('profile'), reason: plan.sources.find((s) => s.source === 'profile')?.reason ?? 'Not selected by context planner' },
        { kind: 'files', selected: isSelected('my_files'), reason: plan.sources.find((s) => s.source === 'my_files')?.reason ?? 'Not selected by context planner' },
        { kind: 'memory', selected: isSelected('personal_knowledge') || isSelected('structured_knowledge'), reason: plan.sources.find((s) => s.source === 'personal_knowledge')?.reason ?? 'Not selected by context planner' },
      ],
    };
  }

  private planRetrieval(
    question: string,
    plan: import('./ContextTypes').ContextPlan,
  ): SneakPeekRetrievalPlan {
    const shouldRetrieve = plan.retrievalRequired;
    const sources: ContextSource[] = plan.requiredSources.filter(source => plan.retrievalSources.includes(source));

    return {
      shouldRetrieve,
      mode: shouldRetrieve ? 'hybrid' : 'none',
      query: shouldRetrieve ? question : '',
      sources,
      maximumResults: shouldRetrieve ? 8 : 0,
    };
  }
}
