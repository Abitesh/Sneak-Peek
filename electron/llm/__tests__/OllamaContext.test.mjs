import test from 'node:test';
import assert from 'node:assert/strict';
import { ollamaContextWindow } from '../../../dist-electron/electron/llm/ollamaContext.js';

test('canonical project prompt allocates beyond the server default without altering messages', () => {
 const messages=[{content:'POLICY: only authorized project evidence.'},{content:'QUESTION: Explain the project.\n'+ 'authorized evidence '.repeat(1400)}];
 const snapshot=JSON.stringify(messages);
 assert.ok(ollamaContextWindow('llama3.2:3b',messages)>=12288);
 assert.equal(JSON.stringify(messages),snapshot);
});
test('small prompts retain bounded 4096 allocation; output allowance is reserved',()=>{
 assert.equal(ollamaContextWindow('llama3.2:3b',[{content:'Hello'}]),4096);
 const text='x'.repeat(12000);
 assert.equal(ollamaContextWindow('llama3.2:3b',[{content:text}]),8192);
});
test('overflow rejects explicitly instead of deleting instructions, questions or source boundaries',()=>{
 assert.throws(()=>ollamaContextWindow('llama3:8b',[{content:'policy\n'+'x'.repeat(25000)}]),/cannot safely fit/);
 assert.throws(()=>ollamaContextWindow('llama3.2:3b',[{content:'x'.repeat(100000)}]),/cannot safely fit/);
});
test('UTF-8 source text receives byte-aware allocation',()=>{
 assert.equal(ollamaContextWindow('llama3.2:3b',[{content:'a'.repeat(2000)}]),4096);
 assert.ok(ollamaContextWindow('llama3.2:3b',[{content:'漢'.repeat(2000)}])>=12288);
 assert.throws(()=>ollamaContextWindow('llama3.2:3b',[{content:'漢'.repeat(6000)}]),/cannot safely fit/);
});
