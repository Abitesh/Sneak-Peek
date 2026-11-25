import test from 'node:test';import assert from 'node:assert/strict';
import {accountChatModels,isInterviewChatModel,modelAccessDenied,favoriteModelChoices,catalogModelProvider} from '../../../dist-electron/electron/llm/modelSelectionCatalog.js';
import {isGroqModelId} from '../../../dist-electron/electron/llm/groqModels.js';
test('speech, image-generation, embedding and moderation catalogs never become chat choices',()=>{
 for(const id of ['gpt-4o-mini-transcribe','gpt-4o-audio-preview','gemini-3.5-transcribe','nomic-embed-text','text-embedding-3-small','whisper-large-v3','tts-1','imagen-3','rerank-v3','llama-guard'])assert.equal(isInterviewChatModel(id),false,id);
 for(const id of ['gpt-4o-mini','gemini-3.5-flash','qwen/qwen3.8-27b','allam-2-7b','llama3.2:3b'])assert.equal(isInterviewChatModel(id),true,id);
});
test('account catalog replaces speculative presets and explicit denied bindings are excluded',()=>{
 const catalog=[{id:'allowed',label:'Allowed'},{id:'denied',label:'Denied'}];
 assert.deepEqual(accountChatModels(catalog,[{id:'denied',label:'Denied',source:'preset',lastError:'Not available for this key/account'}]),[catalog[0]]);
 assert.deepEqual(accountChatModels([], [{id:'speculative',label:'Guess',source:'preset',capabilities:{chat:true}}]),[]);
 assert.equal(accountChatModels([],[{id:'verified',label:'Verified',source:'live-probe',capabilities:{chat:true}}]).length,1);
});
test('quota, rate limits and timeouts are not model entitlement failures',()=>{
 for(const error of ['HTTP 429: exhausted quota','HTTP 403: insufficient credits','HTTP 503: model unavailable','Rate limited','Request timed out','provider temporarily unavailable'])assert.equal(modelAccessDenied(error),false,error);
 for(const error of ['HTTP 403: Check model access','HTTP 404: model unavailable','Not available for this key/account'])assert.equal(modelAccessDenied(error),true,error);
});
test('favorite choices preserve provider and order without fallback to the whole catalog',()=>{
 const models=[{id:'one',provider:'gemini'},{id:'two',provider:'gemini'},{id:'one',provider:'groq'},{id:'unused',provider:'groq'}];
 assert.deepEqual(favoriteModelChoices(models,{gemini:['two','one'],groq:['missing','one']}),[models[1],models[0],models[2]]);
 assert.deepEqual(favoriteModelChoices(models,{}),[]);
});
test('new unambiguous Groq catalog ids retain their exact provider; collisions fail closed',()=>{
 const catalog={groq:[{id:'allam-2-7b'}],openai:[{id:'gpt-4o'}]};
 assert.equal(catalogModelProvider('allam-2-7b',catalog),'groq');assert.equal(isGroqModelId('allam-2-7b',catalog),true);
 assert.equal(isGroqModelId('allam-2-7b',{...catalog,custom:[{id:'allam-2-7b'}]}),false);
 assert.equal(isGroqModelId('openai/gpt-oss-120b'),true);
});
