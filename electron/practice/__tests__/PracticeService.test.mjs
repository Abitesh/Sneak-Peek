import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import Database from 'better-sqlite3';
import {PracticeService,PRACTICE_BANK} from '../../../dist-electron/electron/practice/PracticeService.js';
test('offline practice persists drafts, includes every category and produces deterministic observations without generation',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sneak-practice-')),file=path.join(dir,'practice.db');let db=new Database(file);const projects={get:id=>id==='allowed'?{name:'Orchid',enabled:true}:undefined};
 try{let service=new PracticeService(db,projects);for(const category of Object.keys(PRACTICE_BANK))assert.ok(service.create(category).questions.length>=3);
 const session=service.create('projects',['allowed']);assert.ok(session.questions.every(q=>q.projectId==='allowed'));assert.throws(()=>service.create('projects',['revoked']));
 service.answer(session.id,session.questions[0].id,'I built the API.');const progress=service.review(session.id);assert.equal(progress.answered,1);assert.equal(progress.observations[0].wordCount,4);
 db.close();db=new Database(file);service=new PracticeService(db,projects);assert.equal(service.get(session.id).questions[0].answer,'I built the API.');
 assert.throws(()=>service.answer(session.id,'another-question','overwrite'));assert.equal(service.get(session.id).questions[0].answer,'I built the API.');
 projects.get=()=>undefined;assert.equal(service.review(session.id).observations[0].sourceAvailable,false);
 assert.equal(service.remove(session.id),true);assert.equal(service.get(session.id),undefined);
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('meeting review uses only its exact transcript and saved generation, retaining ambiguous and missing answers honestly',async()=>{
 const {reviewMeeting}=await import('../../../dist-electron/electron/practice/MeetingReview.js');
 const meeting={id:'one',title:'One',summary:'Saved overview',transcript:[{speaker:'user',text:'What is DBMS?',timestamp:1},{speaker:'interviewer',text:'Explain a cache.',timestamp:3}],usage:[{question:'What is DBMS?',answer:'Database management system.',timestamp:2}],detailedSummary:{topics:['Databases']}};
 const review=reviewMeeting(meeting);assert.equal(review.questions[0].recordedAnswer,'Database management system.');assert.equal(review.questions[1].recordedAnswer,undefined);assert.equal(review.recordedAnswerCount,1);assert.equal(review.summary,'Saved overview');assert.deepEqual(review.topics,['Databases']);assert.equal(review.suggestions.length,1);
 const repeated=reviewMeeting({...meeting,usage:[...meeting.usage,{question:'What is DBMS?',answer:'Another answer',timestamp:4}]});assert.equal(repeated.questions[0].recordedAnswer,undefined);
 const empty=reviewMeeting({id:'two',title:'Two',summary:'',transcript:[]});assert.deepEqual(empty.questions,[]);assert.equal(empty.summaryAvailable,false);
});
