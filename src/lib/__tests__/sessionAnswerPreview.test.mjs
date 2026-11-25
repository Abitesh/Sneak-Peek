import test from 'node:test';import assert from 'node:assert/strict';
import {sessionAnswerPreview,PREVIEW_QUESTION_TYPES} from '../sessionAnswerPreview.ts';
const prefs={format:'script-bullets',length:'medium',tone:'simple',star:false,fillerWords:false,codeLanguages:{dsa:'C++',oop:'Java',database:'SQL',ml:'Python'}};
test('each question type has a concrete question and an actual illustrative answer',()=>{
 const questions=new Set();for(const type of PREVIEW_QUESTION_TYPES){const p=sessionAnswerPreview(type,prefs);questions.add(p.question);assert.ok(p.question.length>15);assert.ok(p.answer.length>80);assert.doesNotMatch(p.answer,/I.d explain the main point|I.d name the project/);}
 assert.equal(questions.size,PREVIEW_QUESTION_TYPES.length);
});
test('format, length, tone and STAR update the same question without model calls',()=>{
 const short=sessionAnswerPreview('Technical knowledge',{...prefs,length:'short'}),long=sessionAnswerPreview('Technical knowledge',{...prefs,length:'long'});
 assert.equal(short.question,long.question);assert.ok(long.answer.length>short.answer.length);
 assert.match(short.answer,/\n- /,'short script + bullets retains the selected format');
 assert.match(sessionAnswerPreview('How-do-you',{...prefs,tone:'formal'}).answer,/I would/);
 assert.match(sessionAnswerPreview('Behavioral',{...prefs,star:true}).answer,/Situation.*Task.*Action.*Result/s);
 assert.ok(sessionAnswerPreview('Behavioral',prefs).fictional);
 assert.match(sessionAnswerPreview('Technical knowledge',{...prefs,format:'bullets'}).answer,/^- /);
});
test('coding preview uses the selected language and preserves a complete function at short length',()=>{
 for(const language of ['C++','Java','Python','JavaScript','TypeScript','Go','Rust','C']){const p=sessionAnswerPreview('Coding (algorithm problems)',{...prefs,length:'short',codeLanguages:{...prefs.codeLanguages,dsa:language}});assert.equal(p.code.language,language);assert.ok(p.code.text.length>100);assert.match(p.code.text,/return|None/);}
 assert.equal(sessionAnswerPreview('Technical knowledge',prefs).code,undefined);
 assert.match(sessionAnswerPreview('Coding (algorithm problems)',{...prefs,codeLanguages:{...prefs.codeLanguages,dsa:'C'}}).answer,/pair.by.pair/);
});
