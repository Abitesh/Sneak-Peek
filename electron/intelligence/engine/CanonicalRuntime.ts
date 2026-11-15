import { readProviderScopePolicy } from '../../context-intelligence/policies/provider-scope-policy';
import { createHash } from 'crypto';
import { DatabaseManager } from '../../db/DatabaseManager';
import { SneakPeekIntelligenceEngine } from './SneakPeekIntelligenceEngine';
import { RetrievalCoordinator, createRetrievalCapability } from './RetrievalCoordinator';
import { createCanonicalRagRetrievalCapability } from './CanonicalRagRetrievalAdapter';
import { streamCanonicalProvider } from './GenerationController';
import { conversationActionDataScopes } from './ConversationAction';
import type { ContextSource } from './ContextTypes';
import type { ProviderDataScope, ProviderRouteOptions } from '../../llm/ProviderRouter';

export function createPrimaryManualSneakPeekEngine(llmHelper: any, appState: any, requestId: string) {
  const ragManager = appState.getRAGManager?.();
  const capabilities = ragManager ? [
    // The engine selected project_knowledge; constrain this read to those
    // authorized project files instead of asking the global planner again.
    createCanonicalRagRetrievalCapability({
      source: 'project_knowledge',
      sourceType: 'personal',
      limit: 8,
      tokenBudget: 1800,
      resolveScope: ({ request }) => ({
        projectFilesOnly: true,
        projectFileIds: request.activeContext?.projectSourceIds,
      }),
      read: (input) => ragManager.readPlannedCanonicalSource(input),
    }),
    createCanonicalRagRetrievalCapability({
      source: 'my_files',
      sourceType: 'personal',
      limit: 8,
      tokenBudget: 1800,
      resolveScope: ({ request }) => ({ projectFileIds: request.activeContext?.resumeSourceIds }),
      read: (input) => ragManager.readPlannedCanonicalSource(input),
    }),
    createCanonicalRagRetrievalCapability({
      source: 'mode_documents',
      sourceType: 'mode',
      limit: 8,
      tokenBudget: 1800,
      resolveScope: ({ request }) => ({ scopeId: request.activeContext?.modeId }),
      read: (input) => ragManager.readPlannedCanonicalSource(input),
    }),
    createCanonicalRagRetrievalCapability({
      source: 'personal_knowledge',
      sourceType: 'personal',
      limit: 8,
      tokenBudget: 1800,
      read: (input) => ragManager.readPlannedCanonicalSource(input),
    }),
    // OKF cards are a specialized index; the engine already selected the source.
    createRetrievalCapability('structured_knowledge', async ({ query, request, signal }) => {
      if (signal?.aborted) return { items: [] };
      const results = await ragManager.readPlannedKnowledgeSource({
        query,
        modeId: request.activeContext?.modeId,
        limit: 8,
        tokenBudget: 1800,
        signal,
      });
      if (signal?.aborted) return { items: [] };
      return {
        items: results.map((r: any, index: number) => ({
          id: String(r.chunk?.id ?? r.source?.id ?? `knowledge-${index}`),
          source: 'structured_knowledge' as ContextSource,
          content: String(r.chunk?.text ?? ''),
          score: Number(r.rerankScore ?? r.score ?? 0),
          metadata: { sourceId: String(r.source?.id ?? r.chunk?.documentId ?? ''), retrievalSource: 'knowledge' },
        })).filter((item: any) => item.content.trim()),
      };
    }),
  ] : [];

  capabilities.push(createRetrievalCapability('profile', async ({ request, contextPlan, signal }) => {
    const decision = contextPlan.profileRead;
    if (signal?.aborted) return { items: [] };
    if (request.documentDraft && request.documentDraft.kind !== 'follow-up-email') {
      const { buildActiveProfileContext } = require('../../llm/ActiveProfileContext') as typeof import('../../llm/ActiveProfileContext');
      const profile = buildActiveProfileContext(appState.getKnowledgeOrchestrator?.());
      if (!profile.activeResume) throw new Error('No active resume is available for this draft.');
      return {
        items: [
          { document: profile.activeResume, sourceType: 'RESUME', title: 'Active resume' },
          { document: profile.activeJD, sourceType: 'JOB_DESCRIPTION', title: 'Active job description' },
        ].flatMap(({ document, sourceType, title }) => document ? [{
          id: `${sourceType}:${document.sourceId}`,
          source: 'profile' as const,
          content: JSON.stringify(document.structured),
          metadata: {
            documentName: title,
            documentId: String(document.sourceId),
            sourceId: String(document.sourceId),
            sourceType,
            revisionId: document.documentHash,
          },
        }] : []),
      };
    }
    if (!decision?.retrievalPlan.shouldRetrieve) return { items: [] };
    if (request.answerContext?.profileDocuments) {
      const types = decision.retrievalPlan.sourceTypes;
      const allowed = contextPlan.sourceDecision?.allowedEvidenceKinds;
      return { items: request.answerContext.profileDocuments
        .filter(doc => types.includes(doc.sourceType) && (!allowed || allowed.includes(doc.sourceType === 'JOB_DESCRIPTION' ? 'profile_jd' : 'profile_resume')))
        .map(doc => ({ id: `${doc.sourceId}:${doc.revisionId ?? 'unknown'}`, source: 'profile' as const,
          content: doc.content, metadata: { sourceId: doc.sourceId, revisionId: doc.revisionId,
            sourceType: doc.sourceType, authority: 'evidence', retrievalSource: 'frozen-profile' } })) };
    }

    try {
      const { collectV3ProfileSources } = require('../../services/knowledge/v3ProfileSources') as typeof import('../../services/knowledge/v3ProfileSources');
      const { createProfileRetrievalPort } = require('../../context-intelligence/retrieval/profile-retrieval-port') as typeof import('../../context-intelligence/retrieval/profile-retrieval-port');
      const sourceTypes = decision.retrievalPlan.sourceTypes;
      const permittedKinds = [
        ...(sourceTypes.includes('RESUME') ? ['resume' as const] : []),
        ...(sourceTypes.includes('JOB_DESCRIPTION') ? ['jd' as const] : []),
        ...(sourceTypes.includes('PROFILE_FACT') ? ['fact' as const] : []),
      ];
      const collected = collectV3ProfileSources(llmHelper.getKnowledgeOrchestrator?.() ?? null, permittedKinds);
      const profilePort = createProfileRetrievalPort({
        docs: collected.docs,
        allowedSourceTypes: sourceTypes,
        profileSources: sourceTypes,
        userId: 'local',
      });
      if (!profilePort || signal?.aborted) return { items: [] };
      const result = await profilePort.retrieve({ decision });
      if (signal?.aborted) return { items: [] };
      return {
        items: result.evidence.map((item) => ({
          id: item.evidenceId,
          source: 'profile' as ContextSource,
          content: item.content,
          score: item.finalScore,
          metadata: {
            sourceId: item.sourceId,
            sourceType: item.sourceType,
            documentName: item.documentTitle,
            pageStart: item.page,
            section: item.section,
            chunkId: item.chunkIndex !== undefined ? `${item.sourceId}:${item.chunkIndex}` : undefined,
            provenance: item.provenance,
            revisionId: item.versionId,
            relevance: item.finalScore,
            confidence: item.finalScore,
            trustLevel: item.trustLevel,
            authority: 'evidence',
          },
        })),
        metadata: { source: 'profile', attempts: result.attempts.length },
      };
    } catch (error) {
      // Preserve the error for RetrievalCoordinator's `failed` outcome.
      // Never log provider error text here: it may contain private profile data.
      console.warn('[Sneak-Peek Change 13] profile retrieval capability failed');
      throw error;
    }
  }));

  const persistedMeeting = ragManager ? createCanonicalRagRetrievalCapability({
    source: 'meeting_transcript',
    sourceType: 'meeting',
    limit: 8,
    tokenBudget: 1800,
    resolveScope: ({ request }) => ({
      sourceId: request.retrievalScope?.kind === 'meeting'
        ? request.retrievalScope.meetingId : request.activeContext?.meetingId,
    }),
    read: (input) => ragManager.readPlannedCanonicalSource(input),
  }) : undefined;

  capabilities.push(createRetrievalCapability('meeting_transcript', async (input) => {
    if (input.signal?.aborted) return { items: [] };
    if (input.request.transcriptContext?.source === 'live') {
      return { items: (input.request.transcriptContext.turns ?? []).filter(turn => turn.role !== 'assistant')
        .map(turn => ({ id: turn.id, source: 'meeting_transcript' as const, content: turn.content,
          metadata: { sourceId: input.request.activeContext?.meetingId ?? input.request.sessionId,
            timestampStart: turn.createdAt, retrievalSource: 'live-transcript' } })) };
    }
    try {
      const persisted = await persistedMeeting?.retrieve(input);
      if (input.signal?.aborted) return { items: [] };
      if (persisted?.items.length) return persisted;
    } catch {
      console.warn('[Sneak-Peek Intelligence] indexed meeting evidence unavailable');
    }
    if (input.signal?.aborted) return { items: [] };
    const scope = input.request.retrievalScope;
    if (scope?.kind === 'global-meetings') return { items: [] };
    if (scope?.kind === 'meeting') {
      // Read the selected record from the local store. The renderer cannot
      // supply replacement evidence and another meeting is never consulted.
      const meeting = DatabaseManager.getInstance().getMeetingDetails(scope.meetingId);
      if (!meeting || meeting.id !== scope.meetingId) return { items: [] };

      const summary = meeting.detailedSummary;
      const overview = summary?.overview || meeting.summary;
      const notes = [
        overview,
        summary?.keyPoints?.join('\n'),
        summary?.actionItems?.join('\n'),
      ].filter(Boolean).join('\n').slice(0, 4000);
      const items: import('../../intelligence/engine/types').SneakPeekEvidenceItem[] =
        (meeting.transcript ?? [])
          .filter(turn => turn.speaker === 'user' || turn.speaker === 'interviewer')
          .slice(-20)
          .filter(turn => turn.text.trim())
          .map((turn, index) => ({
            id: `${meeting.id}:transcript:${turn.timestamp}:${index}`,
            source: 'meeting_transcript',
            content: turn.text.slice(0, 400),
            metadata: {
              sourceId: meeting.id,
              documentName: meeting.title,
              speaker: turn.speaker,
              timestampStart: turn.timestamp,
              retrievalSource: 'saved-meeting-transcript',
            },
          }));

      if (notes) items.unshift({
        id: `${meeting.id}:saved-summary`,
        source: 'meeting_transcript',
        content: notes,
        metadata: {
          sourceId: meeting.id,
          documentName: meeting.title,
          section: 'Saved meeting summary',
          retrievalSource: 'saved-meeting-summary',
        },
      });
      return { items };
    }
    return {
      items: (input.request.transcriptContext?.turns ?? [])
        .filter(turn => turn.role !== 'assistant' && turn.content.trim())
        .map((turn, index) => ({
          id: turn.id || `meeting-live-${index}`,
          source: 'meeting_transcript',
          content: turn.content,
          metadata: {
            sourceId: input.request.activeContext?.meetingId ?? 'live-transcript',
            timestampStart: turn.createdAt,
            timestampEnd: turn.createdAt,
            retrievalSource: 'live-transcript-window',
          },
        })),
    };
  }));

  const scopedCapabilities = capabilities.map(capability => ({
    source: capability.source,
    async retrieve(input: import('./RetrievalCoordinator').RetrievalCapabilityRequest) {
      const versions = input.request.answerContext?.sourceVersions;
      const verifySnapshot = () => {
        if (!versions) return;
        const ids = input.contextPlan.sourceIds?.[capability.source];
        if (!ids?.length) return;
        if (capability.source === 'mode_documents') {
          const files = require('../../services/ModesManager').ModesManager.getInstance().getReferenceFiles(input.request.activeContext?.modeId);
          for (const id of ids) {
            const file = files.find((file: { id: string }) => String(file.id) === id);
            if (!file || createHash('sha256').update(file.content).digest('hex') !== versions[id]) throw new Error('Reference source changed during this request. Ask again.');
          }
        } else if (['my_files', 'personal_knowledge', 'project_knowledge'].includes(capability.source)) {
          const files = require('../../personalKnowledge').getPersonalKnowledgeManager().listFiles();
          for (const id of ids) {
            const file = files.find((file: { id: string }) => String(file.id) === id);
            if (!file || file.updatedAt !== versions[id]) throw new Error('Personal source changed during this request. Ask again.');
          }
        }
      };
      verifySnapshot();
      const result = await capability.retrieve(input);
      verifySnapshot();
      return result;
    },
  }));

  const engine = new SneakPeekIntelligenceEngine({
    retrievalCoordinator: new RetrievalCoordinator({
      capabilities: scopedCapabilities,
      onDecision: (trace) => {
        // Do not log trace.query, document IDs, profile text, or error strings.
        // The prompt-inclusion counts are emitted separately at completion.
        console.log('[CHG-17] retrieval source outcomes', {
          sources: trace.sourceOutcomes.map(({ source, status, itemCount, retrievalBackend, fallbackReason }) => ({
            source, status, itemCount, retrievalBackend, fallbackReason,
          })),
          callCount: trace.callCount,
        });
      },
    }),
    generationPort: {
      stream: ({ request, prompt, contextPlan, lifecycle }) => {
        const required = new Set(contextPlan.requiredSources);
        const scopes = new Set<ProviderDataScope>();
        if ((request.imageConversationSnapshot || request.sessionSnapshot || request.action?.sessionSnapshot || request.action?.previousAnswer || request.recentConversation.some(turn => turn.role === 'assistant')) && required.has('recent_conversation')) {
          // Mixed session history can contain prior private-derived answers.
          // Never send it through a provider with denied source scopes.
          for (const scope of conversationActionDataScopes({ context: request.sessionSnapshot ?? request.imageConversationSnapshot ?? request.action?.sessionSnapshot, previousAnswer: request.action?.previousAnswer, unknownLineage: request.recentConversation.some(turn => turn.role === 'assistant') })) scopes.add(scope);
        }
        if (required.has('recent_conversation') || required.has('longer_conversation') || required.has('meeting_transcript')) scopes.add('transcript');
        if (required.has('screen')) scopes.add('screenshots');
        if (required.has('personal_knowledge') || required.has('profile') || required.has('structured_knowledge')) scopes.add('profile_history');
        if (required.has('project_knowledge') || required.has('my_files') || required.has('mode_documents') || (required.has('rag') && !required.has('meeting_transcript'))) scopes.add('reference_files');
        const imagePaths = required.has('screen') ? request.screenContext?.imagePaths : undefined;
        if (request.imageAnalysis && !imagePaths?.length) {
          throw new Error('Selected model does not support the requested images.');
        }
        const pinned = request.answerContext?.providerRoute;
        const route: ProviderRouteOptions | null = request.answerContext
          ? (pinned ? { ...pinned, models: { ...pinned.models }, dataScopes: [...new Set([...scopes, ...(pinned.dataScopes ?? [])])] } : null)
          : llmHelper.getSneakPeekGenerationRouteOptions([...scopes], Boolean(imagePaths?.length));
        if (!route) throw new Error('Active provider transport is not yet supported by the Sneak-Peek generation contract.');
        if (request.providerPreferences?.preferredProvider) route.preferredProvider = request.providerPreferences.preferredProvider as ProviderRouteOptions['preferredProvider'];
        if (request.providerPreferences?.allowedProviders) {
          const allowed = request.providerPreferences.allowedProviders as NonNullable<ProviderRouteOptions['allowedProviders']>;
          route.allowedProviders = route.allowedProviders
            ? route.allowedProviders.filter(provider => allowed.includes(provider))
            : allowed;
        }
        if (request.providerPreferences?.preferredModel && route.preferredProvider) {
          const key = route.preferredProvider === 'gemini_flash' ? 'geminiFlash'
            : route.preferredProvider === 'gemini_pro' ? 'geminiPro' : route.preferredProvider;
          route.models = { ...route.models, [key]: request.providerPreferences.preferredModel };
        }
        if (request.answerContext?.modeInstructions || request.answerContext?.skill || request.answerContext?.callerInstruction) {
          // User-authored instruction text can include private facts.
          for (const scope of conversationActionDataScopes({ unknownLineage: true })) scopes.add(scope);
          route.dataScopes = [...new Set([...scopes, ...(route.dataScopes ?? [])])];
        }
        const currentPolicy = readProviderScopePolicy();
        route.scopePolicy = { ...route.scopePolicy, ...currentPolicy };
        for (const scope of route.dataScopes ?? []) {
          if (pinned?.scopePolicy?.[scope] === false) route.scopePolicy[scope] = false;
        }
        route.maxAttempts = request.providerPreferences?.maxAttempts ?? 3;
        if ((request.documentDraft || request.providerPreferences?.allowFallback === false) && route.preferredProvider) {
          route.allowedProviders = (route.allowedProviders ?? [route.preferredProvider])
            .filter(provider => provider === route.preferredProvider);
          route.maxAttempts = 1;
        }
        const stream = streamCanonicalProvider(llmHelper, {
          requestId: request.requestId,
          finalPrompt: prompt.finalPrompt,
          route,
          abortSignal: request.cancellationSignal,
          imagePaths,
          thinkingBudget: request.responseShape?.detailed ? 1024 : 0,
          lifecycle,
        });
        console.log('[Sneak-Peek Intelligence] ProviderRouter → GenerationController', {
          requestId,
          preferredProvider: route.preferredProvider,
          maxAttempts: route.maxAttempts,
        });
        return stream;
      },
    },
  });
  return engine;
}

