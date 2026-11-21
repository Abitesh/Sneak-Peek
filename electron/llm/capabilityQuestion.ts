/** Normalize capability probes for intent classification only; original questions remain intact. */
export function intentTextWithoutCapabilityProbe(text: string): string {
  return text.replace(/\b(?:can|could)\s+you\s+solve\s+(?:any|a|all)\s+(?:system[ -]design|coding|programming)\s+problems?(?:\s+(?:(?:that\s+)?i\s+(?:give|send)\s+you))?/gi,
    'help with technical questions');
}
