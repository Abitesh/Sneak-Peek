/**
 * Classifies only broad candidate portfolio summaries. This is a retrieval
 * hint, never a source authorization: the engine and IPC still require the
 * current project-tagged files and an exact resume-source allowlist.
 */
export function isBroadCandidateProjectsQuestion(question: string): boolean {
  // Conversational interview prompts often begin with "Then", "So", or "Now".
  // Normalizing that discourse must not turn a *named* project question into
  // a broad search, so the grammatical subject is still checked below.
  const normalized = String(question ?? '').trim().replace(/\s+/g, ' ')
    .replace(/^(?:(?:then|and|so|also|now|okay|ok)\s*,?\s*){1,3}/i, '')
    .replace(/^(?:(?:can|could|would)\s+you\s+|please\s+)/i, '')
    .trim();

  const overviewVerb = /^(?:tell\s+(?:me|us)\s+about|explain(?:\s+(?:me|us|to\s+me|to\s+us))?|describe|summari[sz]e|discuss|walk\s+(?:me|us)\s+through|give\s+(?:me|us)\s+(?:an?\s+)?overview\s+of|list)\s+(.+)$/i;
  const requestedSubject = normalized.match(overviewVerb)?.[1]?.trim() ?? '';
  // Only "projects" (plural) qualifies here. Named/singular project
  // architecture and implementation questions retain exact project scoping.
  if (/^(?:(?:the|my|your|our|these|those)\s+)?projects\b/i.test(requestedSubject)) return true;

  return /^(?:what|which)\s+projects\s+(?:(?:have|did)\s+(?:i|you|we)|(?:i|you|we)\s+(?:have|did))\b/i.test(normalized);
}
