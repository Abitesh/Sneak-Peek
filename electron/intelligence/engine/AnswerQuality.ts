/** Narrow English-language checks. A clean result is not proof of factual accuracy. */
export const asksForExample = (question: string): boolean =>
  /\b(?:with|give|include|show|provide|using)\s+(?:(?:me|an?|one|some|another|small|simple|brief|concrete|tiny|worked)\s+){0,5}examples?\b/i.test(question);

export const asksForDefinitionAndApproach = (question: string): boolean =>
  /\b(?:what (?:is|are)|define|explain)\b[^?!.]{0,100}(?:[?]\s*(?:can|could)|\band how\b)/i.test(question);

export const asksForPlainLanguage = (question: string): boolean =>
  /\b(?:plain (?:language|english)|non[- ]technical|layperson|layman|no (?:coding|technical|programming) (?:knowledge|experience|background)|without (?:a |any )?(?:coding|technical|programming) (?:knowledge|experience|background))\b/i.test(question);

export const asksForDecision = (question: string): boolean =>
  /\bwhy\b[^?.!]{0,120}\b(?:use|used|choose|chose|pick|picked|select|selected|go with|went with)\b|\b(?:alternatives?\b[^?.!]{0,45}\bconsider|consider(?:ed)?\b[^?.!]{0,45}\balternatives?)\b/i.test(question);

const pastDecision = /\b(?:(?:i|we|the team|the developers?)\s+(?:chose|picked|selected|used|went with|opted for)\b[^.!?\n]{0,100}\b(?:because|due to|in order to)|(?:was|were)\s+(?:chosen|selected|picked|preferred|used)\b[^.!?\n]{0,80}\b(?:because|due to|in order to))/i;
const normalized = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, ' ').trim();
export const percentageClaims = (text: string) => [...text.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:%|percent\b)/gi)].map(match => Number(match[1]));

/** Return the technology only for a single, bounded historical question. */
export function decisionSubject(question: string): string | undefined {
  if (question.replace(/[?.!]\s*$/, '').includes('?') || /\b(?:and explain|and show|and (?:what|how|why)|then)\b/i.test(question)) return;
  return question.match(/\b(?:use|used|choose|chose|pick|picked|select|selected|go with|went with)\s+([\p{L}\p{N}+#.-]+(?:\s+[\p{L}\p{N}+#.-]+){0,3}?)(?=\s+(?:instead|over|rather|in|for)\b|[?.,!]|$)/iu)?.[1];
}

export function documentedChoice(question: string, excerpts: readonly string[]): boolean {
  // A capability list, negated sentence, or decision about another tool
  // cannot establish the historical premise of the question.
  const subject = decisionSubject(question);
  if (!subject) return false;
  const name = normalized(subject);
  return excerpts.some(excerpt => excerpt.split(/[.!?\n]+/).some(sentence => {
    if (!pastDecision.test(sentence) || /\b(?:not|never|could|might|may|hypothetical|example|possible)\b/i.test(sentence)) return false;
    const decision = normalized(sentence);
    return ['chose', 'picked', 'selected', 'used', 'went with', 'opted for'].some(verb =>
      decision.includes(` ${verb} ${name} because `) || decision.includes(` ${verb} ${name} due to `))
      || decision.startsWith(`${name} was chosen because `) || decision.startsWith(`${name} was selected because `);
  }));
}

export type QualityFinding = 'unsupported-decision' | 'unsupported-personal-claim' | 'unsupported-personal-metric' | 'candidate-self-identification'
  | 'example-not-detected' | 'approach-not-detected' | 'repeated-sentence' | 'source-title-not-in-evidence' | 'possible-evidence-contradiction';

/** Check exact, simple subject–predicate matches only. This does not infer
 * synonyms, resolve contradictions between sources, or establish downstream facts. */
function simpleClaims(text: string): Map<string, boolean> {
  const claims = new Map<string, boolean>();
  for (const sentence of text.split(/[.!?\n]+/)) {
    const match = normalized(sentence).match(/^((?:\p{L}[\p{L}\p{N}]* ){1,6}?)(does not )?(use|uses|support|supports|store|stores|include|includes) ((?:[\p{L}\p{N}]+ ){0,6}[\p{L}\p{N}]+)$/u);
    if (!match) continue;
    claims.set(`${match[1]}${match[3].replace(/s$/, '')} ${match[4]}`, Boolean(match[2]));
  }
  return claims;
}

export function inspectAnswerQuality(input: {
  question: string; answer: string; evidence: readonly string[]; sourceTitles?: readonly string[]; grounded: boolean; candidate: boolean;
}): QualityFinding[] {
  const { question, answer, evidence, grounded, candidate } = input;
  const findings: QualityFinding[] = [];
  if (grounded && asksForDecision(question) && !documentedChoice(question, evidence)
    && answer.split(/[.!?\n]+/).some(sentence => pastDecision.test(sentence)
      && !/\b(?:do not know|cannot confirm|not documented|not say|unknown whether)\b/i.test(sentence))) {
    findings.push('unsupported-decision');
  }
  if (grounded && !evidence.length && /\b(?:i|we)\s+(?:built|implemented|led|designed|deployed|reduced|chose|focused|achieved|created)\b/i.test(answer)) {
    findings.push('unsupported-personal-claim');
  }
  if (grounded) {
    const supportedNumbers = new Set(evidence.flatMap(percentageClaims));
    const personalClaims = answer.split(/(?<=[!?]|\.(?!\d))\s+|\n/).filter(sentence =>
      /\b(?:i|we|my|our|the project|the team)\b/i.test(sentence)
      && /\b(?:reduc(?:e|ed|tion)|improv(?:e|ed|ement)|increas(?:e|ed)|decreas(?:e|ed)|cut|achiev(?:e|ed)|sav(?:e|ed)|boost(?:ed)?)\b/i.test(sentence)
      && !/\b(?:could|might|would|example|hypothetical|target|unverified|cannot confirm|no evidence)\b/i.test(sentence));
    if (personalClaims.some(sentence => percentageClaims(sentence).some(number => !supportedNumbers.has(number)))) {
      findings.push('unsupported-personal-metric');
    }
  }
  if (grounded && evidence.length) {
    const assertions = simpleClaims(answer);
    if (evidence.some(excerpt => [...simpleClaims(excerpt)].some(([claim, negative]) =>
      assertions.has(claim) && assertions.get(claim) !== negative))) {
      findings.push('possible-evidence-contradiction');
    }
    const citedTitles = [...answer.matchAll(/\baccording to\s+["“]([^”"\n]+)["”]/gi)];
    const titles = new Set((input.sourceTitles ?? []).map(normalized));
    if (titles.size && citedTitles.some(match => !titles.has(normalized(match[1])))) {
      findings.push('source-title-not-in-evidence');
    }
  }
  if (candidate && /\b(?:as an? (?:ai|language model)|i(?: am|'m|’m) (?:an? (?:ai|large language model)|sneak-peek))\b/i.test(answer)) {
    findings.push('candidate-self-identification');
  }
  // This is advisory: examples sometimes have no lexical marker.
  if (asksForExample(question) && !/\b(?:example|instance|e\.g\.|suppose|imagine|consider|say we|let's say)\b|```|\d.+\d/s.test(answer)) {
    findings.push('example-not-detected');
  }
  if (asksForDefinitionAndApproach(question) && !/\b(?:i(?:'d|’d| would| can)|we(?:'d|’d| would| can)|approach|first[, ]|start by|begin by|steps?)\b/i.test(answer)) {
    findings.push('approach-not-detected');
  }
  const seen = new Set<string>();
  for (const sentence of answer.split(/(?<=[.!?])\s+/).map(normalized)) {
    if (sentence.length < 45) continue;
    if (seen.has(sentence)) { findings.push('repeated-sentence'); break; }
    seen.add(sentence);
  }
  return findings;
}

export function isBlockingQualityFinding(finding: QualityFinding): boolean {
  return finding === 'unsupported-decision' || finding === 'unsupported-personal-metric' || finding === 'unsupported-personal-claim';
}

/** User-facing denial contains only fixed application copy. */
export class UnsupportedAnswerClaimError extends Error {
  constructor() {
    super('The answer made a claim about your work that the selected sources could not support.');
    this.name = 'UnsupportedAnswerClaimError';
  }
}
