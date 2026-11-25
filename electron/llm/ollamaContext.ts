import { getModelCapabilities } from './modelCapabilities';

/** Explicit bounded allocation. The server default can discard the question
 * at the beginning of a canonical prompt. Never repair overflow by deleting
 * arbitrary lines, which can remove policy or source boundaries.
 * This is a conservative estimate, not a model-specific tokenizer.
 */
export function ollamaContextWindow(model: string, messages: ReadonlyArray<{content:string}>): number {
  const caps = getModelCapabilities(model, true);
  const ceiling = Math.min(caps.maxContextTokens, caps.tier === 'local-small' ? 16_384 : 32_768);
  const input = messages.reduce((sum, message) => {
    const ascii=message.content.replace(/[^\x00-\x7f]/g,'').length;
    // Do not apply English chars/token assumptions to multilingual text.
    const nonAsciiBytes=Buffer.byteLength(message.content,'utf8')-ascii;
    return sum+Math.ceil(ascii/3)+nonAsciiBytes+32;
  }, 0);
  const needed = input + 2048;
  if (needed > ceiling) {
    const error=new Error('The selected local model cannot safely fit this context. Use fewer sources or explicitly select a model with a larger context window.');
    error.name='LocalContextCapacityError';throw error;
  }
  return Math.min(ceiling, Math.max(4096, Math.ceil(needed / 4096) * 4096));
}
