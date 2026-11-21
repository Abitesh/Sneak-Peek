import type { SneakPeekEvidenceItem } from './types';

interface SavedMeeting {
  id: string;
  title: string;
  transcript?: Array<{ speaker: string; text: string; timestamp: number; id?: string }>;
}

const SEARCH_STOP_WORDS = new Set(['what', 'which', 'where', 'when', 'were', 'was', 'did', 'the', 'this', 'that', 'meeting', 'meetings', 'about', 'tell', 'said', 'say', 'asked', 'some', 'questions', 'question', 'does', 'from', 'have', 'with', 'and', 'for', 'are']);

export function meetingSearchTerms(query: string): string[] {
  return (query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter(word => word.length > 2 && !SEARCH_STOP_WORDS.has(word)).slice(0, 12);
}

/** Local lexical fallback, scoped by the caller to authorized saved meetings. */
export function savedTranscriptEvidence(meetings: SavedMeeting[], query: string, global: boolean): SneakPeekEvidenceItem[] {
  const userQuestions = /\bquestions?\b.*\b(?:me|myself|i|user)\b/i.test(query);
  const terms = meetingSearchTerms(query);
  const rows = meetings.flatMap(meeting => (meeting.transcript ?? []).flatMap((turn, index) => {
    if (!['user', 'interviewer'].includes(turn.speaker) || !turn.text.trim()) return [];
    if (userQuestions && (turn.speaker !== 'user' || !/[?]|\b(?:what|why|how|can you|explain|describe|please elaborate)\b/i.test(turn.text))) return [];
    const text = turn.text.toLowerCase();
    const score = terms.filter(term => text.includes(term)).length;
    if (global && !userQuestions && (terms.length === 0 || score === 0)) return [];
    return [{ score, item: {
      id: `${meeting.id}:transcript:${turn.id ?? `${turn.timestamp}:${index}`}`,
      source: 'meeting_transcript' as const,
      content: turn.text,
      metadata: { sourceId: meeting.id, documentName: meeting.title, speaker: turn.speaker,
        timestampStart: turn.timestamp, retrievalSource: 'saved-transcript-lexical-fallback' },
    } }];
  }));
  if (!userQuestions) rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, 40).map(row => row.item);
}
