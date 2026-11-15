import { isCodingAnswerType } from '../../llm/AnswerPlanner';
import { isPromotedScreenCodingTurn } from '../../llm/codingPromptSignals';
import { validateAnswerStructure } from '../../llm/AnswerValidator';
import { validateDocumentGroundedAnswer } from '../../llm/documentGroundedPrompt';
import { validateProfileEvidence } from '../../llm/profileEvidenceValidator';
import { assessAnswerCoverage, shouldAttemptClauseRepair } from '../../llm/answerCoverage';
import { isScaffoldRegenerationEligible, hasUnrecoveredScaffoldContamination, isLeakedAnswerArtifact, isProviderTransportError } from '../../llm';
import type { SneakPeekIntelligenceRequest, SneakPeekIntelligenceResult } from './types';

export interface AnswerValidationIssue {
  reason: NonNullable<SneakPeekIntelligenceRequest['repair']>['reason'];
  diagnostic: string;
  unsafeToPersist?: boolean;
}

/** Deterministic validators consume precisely the evidence rendered for this turn. */
export function validateCanonicalAnswer(request: SneakPeekIntelligenceRequest, result: SneakPeekIntelligenceResult,
  answer: string): AnswerValidationIssue | null {
  const plan = request.liveAnswer?.plan ?? request.answerContext?.answerPlan;
  const coding = Boolean(plan && isCodingAnswerType(plan.answerType));
  const promotedScreenCoding = request.surface === 'what-to-answer' && Boolean(plan && isPromotedScreenCodingTurn({
    // An inferred screen ask stays on this path even if the coarse planner also labels it coding.
    alreadyCoding: false, question: plan.question,
    hasImages: Boolean(request.screenContext?.imagePaths?.length), screenText: request.screenContext?.text,
  }));
  const technicalJson = coding || promotedScreenCoding || ['technical_concept_answer', 'system_design_answer',
    'debugging_question_answer'].includes(plan?.answerType ?? '');
  if (!answer.trim() || isLeakedAnswerArtifact(answer, { allowJsonEnvelope: technicalJson }) || isProviderTransportError(answer)) {
    return { reason: 'relevance', diagnostic: 'Empty answer, internal artifact or provider error.', unsafeToPersist: true };
  }
  if (!plan || request.action) return null;
  const included = new Set(result.prompt.includedEvidenceIds ?? []);
  const evidence = result.evidencePack.items.filter(item => included.has(item.evidenceId)).map(item => item.text).join('\n\n');
  if (result.contextPlan.requiredSources.includes('mode_documents')) {
    const checked = validateDocumentGroundedAnswer({ question: result.resolvedQuestion, answer,
      retrievedBlock: evidence, answerType: plan.answerType });
    if (!checked.ok) return { reason: 'document-grounding', diagnostic: [checked.reason, ...checked.missing].join('; '), unsafeToPersist: true };
  }
  if (plan.profileContextPolicy !== 'forbidden' && result.contextPlan.requiredSources.includes('profile')) {
    const checked = validateProfileEvidence({ answer, plan, evidence, profileAvailable: Boolean(evidence),
      candidateDirected: plan.voicePerspective === 'first_person_candidate' });
    const errors = checked.violations.filter(item => item.severity === 'error');
    if (errors.length) return { reason: 'document-grounding', diagnostic: errors.map(item => item.code).join('; '), unsafeToPersist: true };
  }
  if (promotedScreenCoding) return null;
  const structure = validateAnswerStructure(plan.answerType, answer);
  if (!structure.ok) return { reason: isCodingAnswerType(plan.answerType) ? 'coding' : 'spoken-format',
    diagnostic: structure.missingSections.join(', ') };
  if (!isCodingAnswerType(plan.answerType) && !promotedScreenCoding
      && (isScaffoldRegenerationEligible(plan.answerType, answer)
        || (request.liveAnswer && hasUnrecoveredScaffoldContamination(plan.answerType, answer)))) {
    return { reason: 'spoken-format', diagnostic: 'Remove unrelated coding scaffold from the spoken answer.' };
  }
  if (technicalJson && /^\s*[\[{]/.test(answer)) return null;
  const coverage = assessAnswerCoverage(result.resolvedQuestion, answer);
  if (shouldAttemptClauseRepair(coverage)) return { reason: 'relevance', diagnostic: `Missing question clauses: ${coverage.missing.join('; ')}` };
  if (request.liveAnswer && !isCodingAnswerType(plan.answerType)
    && result.responsePlan.detailLevel === 'concise' && answer.split(/\s+/).length > 140) {
    return { reason: 'concise', diagnostic: 'Respect the original concise spoken response plan without removing supported facts.' };
  }
  return null;
}
