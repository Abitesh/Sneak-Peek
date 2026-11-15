/**
 * CHG-20 / WORK-0071: pre-validation boundary for provider text on What-to-Answer.
 *
 * This decision occurs BEFORE canonical answer repair, streaming finalization and
 * session persistence. It carries forward the old WTA's fail-closed artifact,
 * provider-error and manual-versus-speculative sentinel rules without enabling
 * any historical provider generator.
 */
import {
  extractAnswerFromJsonEnvelope,
  isLeakedInternalTagBlock,
  isLeakedJsonEnvelope,
  isLeakedSchemaStub,
  isProviderTransportError,
} from '../../llm/answerPolish';

export type WtaRawOutputDecision =
  | { kind: 'answer'; text: string; recoveredJson: boolean }
  | { kind: 'provider-error'; text: string }
  | { kind: 'invalid-artifact'; text: string }
  | { kind: 'nonanswer'; text: string };

const MISSING_CONTEXT = "I don't have enough from the conversation to answer that specific point yet.";
const INVALID_ARTIFACT = "The model produced an invalid answer artifact, so I won't guess from your profile. Please try again.";
const INVALID_MEETING = "I don't have enough context from the conversation to answer that yet.";

export function decideWtaRawOutput(input: {
  text: string;
  answerType: string;
  coding: boolean;
  hasExtractedQuestion: boolean;
  isFalseNoContentClaim: (text: string) => boolean;
  isNonAnswerSentinel: (text: string) => boolean;
}): WtaRawOutputDecision {
  let text = input.text;
  const recovered = extractAnswerFromJsonEnvelope(text);
  if (recovered) text = recovered;
  const technicalJson = input.coding || [
    'technical_concept_answer', 'system_design_answer', 'debugging_question_answer',
  ].includes(input.answerType);

  if (isLeakedSchemaStub(text) || (!technicalJson && isLeakedJsonEnvelope(text)) || isLeakedInternalTagBlock(text)) {
    return { kind: 'invalid-artifact', text: ['general_meeting_answer', 'lecture_answer'].includes(input.answerType)
      ? INVALID_MEETING : INVALID_ARTIFACT };
  }
  // A transport error is useful feedback, not an answer. Never persist it.
  if (isProviderTransportError(text)) return { kind: 'provider-error', text };
  if (input.isNonAnswerSentinel(text) ||
      (input.hasExtractedQuestion && input.isFalseNoContentClaim(text))) {
    return { kind: 'nonanswer', text: MISSING_CONTEXT };
  }
  return { kind: 'answer', text, recoveredJson: Boolean(recovered) };
}
