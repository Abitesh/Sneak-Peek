import type { ContextItem } from '../../SessionTracker';

/**
 * Select speech-authoritative context for canonical What-to-Answer.
 * SessionTracker also includes typed chat and assistant replies, which are
 * conversational history, not evidence of what was said in a meeting.
 * An explicit non-speech origin always beats a stale STT provider field.
 */
export function selectWtaSpeechTurns(turns: readonly ContextItem[]): ContextItem[] {
  return turns.filter(turn => turn.role !== 'assistant'
    && Boolean(turn.text?.trim())
    && (turn.origin === 'stt' || turn.origin === 'test'
      || (turn.origin === undefined && Boolean(turn.sttProvider))));
}
