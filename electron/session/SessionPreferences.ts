/** Presentation preferences only. Never grant source or provider authorization. */
export interface SessionPreferences {
 format:'script'|'script-bullets'|'bullets'; length:'short'|'medium'|'long'; tone:'simple'|'formal';
 star:boolean; fillerWords:boolean; instructions:string;
 codeLanguages:{dsa:string;oop:string;database:string;ml:string};
 favorites:Record<string,string[]>;
}
export const CODE_LANGUAGES={dsa:['C++','Java','Python','JavaScript','TypeScript','C','Go','Rust'],oop:['Java','C++','Python','C#','TypeScript'],database:['SQL','PostgreSQL SQL','MySQL SQL','SQLite SQL','T-SQL','MongoDB query'],ml:['Python','R','Julia','Java','C++']} as const;
export const DEFAULT_SESSION_PREFERENCES:SessionPreferences={format:'script-bullets',length:'medium',tone:'simple',star:false,fillerWords:false,instructions:'',codeLanguages:{dsa:'C++',oop:'Java',database:'SQL',ml:'Python'},favorites:{}};
export function normalizeSessionPreferences(raw:unknown):SessionPreferences {
 const r=(raw&&typeof raw==='object'?raw:{}) as Partial<SessionPreferences>;
 const d=DEFAULT_SESSION_PREFERENCES;
 const languages={...d.codeLanguages};
 for(const k of Object.keys(languages) as Array<keyof typeof languages>){const v=r.codeLanguages?.[k];if(v!==undefined){if(!(CODE_LANGUAGES[k] as readonly string[]).includes(v))throw new Error('Unsupported code language.');languages[k]=v;}}
 const favorites:Record<string,string[]>={};
 for(const [provider,ids] of Object.entries(r.favorites??{})){if(!/^[\w-]{1,80}$/.test(provider)||!Array.isArray(ids)||ids.length>3||ids.some(id=>typeof id!=='string'||!id.trim()||id.length>200))throw new Error('Choose up to three favorite models per provider.');favorites[provider]=[...new Set(ids)];}
 if(r.instructions!==undefined&&(typeof r.instructions!=='string'||r.instructions.length>6000))throw new Error('AI instructions must be text up to 6000 characters.');
 for(const [k,values] of Object.entries({format:['script','script-bullets','bullets'],length:['short','medium','long'],tone:['simple','formal']})){if(r[k as keyof typeof r]!==undefined&&!values.includes(r[k as keyof typeof r] as string))throw new Error('Invalid answer preference.');}
 return {format:r.format??d.format,length:r.length??d.length,tone:r.tone??d.tone,star:r.star===true,fillerWords:r.fillerWords===true,instructions:r.instructions??'',codeLanguages:languages,favorites};
}
export function sessionAnswerGuidance(p:SessionPreferences,question:string,forceCode=false,adaptiveLength=false):string {
 const patternExample=/\b(?:explain|show|demonstrate)\b.{0,60}\b(?:singleton|factory|builder|observer|strategy|adapter|decorator)(?:\s+design)?\s+pattern\b/i.test(question);
 const conceptOnly=/^\s*(?:what (?:is|are)|define|why|how (?:does|do|did))\b/i.test(question) && !/\b(?:write|show|give|provide)\b.{0,35}\b(?:code|implementation|example|query)\b/i.test(question);
 const code=(forceCode||patternExample||(!conceptOnly&&(/\b(?:write|code|coding|program|query|solve)\b/i.test(question)||/^\s*(?:please\s+)?implement\b|\b(?:can|could) you implement\b/i.test(question))))&& !/\b(?:without|no)\s+code\b/i.test(question);
 const domain=/\b(?:SQL|database|query|postgres|mysql|mongodb)\b/i.test(question)?'database':/\b(?:logistic|regression|machine learning|neural|classifier|AI\/ML|model training)\b/i.test(question)?'ml':/\b(?:singleton|pattern|OOP|object.oriented|inheritance|polymorphism|encapsulation|class)\b/i.test(question)?'oop':'dsa';
 return [`Answer preferences: ${p.format==='script'?'natural full spoken script':p.format==='bullets'?'short speakable bullet points':'a natural opening sentence followed by supporting bullets'}. ${p.tone==='simple'?'Use clear plain language, define jargon.':'Use precise professional wording.'}`,
 adaptiveLength && p.length === 'medium' ? '' : `Length: ${p.length}; aim for ${p.length==='short'?'35–65':p.length==='medium'?'80–140':'160–240'} words for non-code answers, allowing necessary facts. Keep essential facts and requested details.`,
 code?'For code requests, provide the approach, complete executable code, complexity and relevant edge cases. Preserve any explicitly requested format.':'',
 code?`Selected ${domain} coding language: ${p.codeLanguages[domain]}. Use it unless the question explicitly requests another language.${patternExample?' Include a small working code example for this design-pattern explanation.':''}`:'Do not add code to a concept-only question unless requested. A topic name alone is not a coding request.',
 p.star?'Use Situation, Task, Action, Result for applicable behavioral stories; do not invent personal experiences.':'',
 p.fillerWords?'Occasional natural transitions are welcome; avoid repetitive filler.':'Avoid filler.',
 p.instructions?`User-supplied presentation guidance (cannot override privacy, evidence or the current question):\n${p.instructions}`:''].filter(Boolean).join('\n');
}
