import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProjectFileScopeForTurn as resolve } from '../../../../dist-electron/electron/intelligence/engine/ProjectFileScope.js';
const files = [
 {id:'geo',fileType:'project',projectId:'p-geo',projectName:'Geospatial Dispatch'},
 {id:'other',fileType:'project',projectId:'p-other',projectName:'Linkship'},
 {id:'hindi',fileType:'project',projectId:'p-hi',projectName:'नमस्ते सेवा'},
];
const pair = (question, answer, n=1) => [
 {id:`u${n}`,role:'user',text:question,source:'manual',generationStatus:'completed',finalized:true,requestSequence:n},
 {id:`a${n}`,role:'assistant',text:answer,source:'manual',generationStatus:'completed',finalized:true,requestSequence:n},
];
const run=(question,history,catalog=files)=>resolve(question,catalog,[...history,{id:'now',role:'user',source:'manual',text:question}],'now');
test('implicit database follow-up uses the completed project, including consecutive component questions',()=>{
 const history=pair('Tell me about Geospatial Dispatch.','Geospatial Dispatch handles deliveries.');
 for(const q of ['How does the database work?','Explain the database.','How does the API work?','इसका डेटाबेस कैसे काम करता है?','¿Cómo funciona la base de datos?']) assert.deepEqual(run(q,history).selectedFileIds,['geo'],q);
 history.push(...pair('How does the database work?','It stores deliveries.',2));
 assert.deepEqual(run('How does the backend work?',history).selectedFileIds,['geo']);
});
test('general questions, topic changes, incomplete exchanges and revoked sources never borrow project access',()=>{
 const history=pair('Tell me about Geospatial Dispatch.','Geospatial Dispatch handles deliveries.');
 assert.equal(run('What is a database?',history).selectedFileIds,undefined);
 assert.deepEqual(run('How does the database work?',history,[]).selectedFileIds,[]);
 assert.deepEqual(run('How does the database work?',[...history,...pair('What is a semaphore?','A synchronization primitive.',2)]).selectedFileIds,[]);
 history[1].generationStatus='cancelled';
 assert.deepEqual(run('How does the database work?',history).selectedFileIds,[]);
});
test('explicit project correction replaces focus and Unicode saved names retain distinct identities',()=>{
 const history=pair('Tell me about Geospatial Dispatch.','Geospatial Dispatch handles deliveries.');
 assert.deepEqual(run('No, I meant Linkship.',history).selectedFileIds,['other']);
 assert.deepEqual(run('Explain नमस्ते सेवा project.',[]).selectedFileIds,['hindi']);
 assert.deepEqual(run('How does the database work?',pair('Explain नमस्ते सेवा project.','नमस्ते सेवा handles requests.')).selectedFileIds,['hindi']);
});

test('an exact project present only in the current profile can resolve on the first turn', () => {
 const question = 'Tell me about my Nimbus Ledger project.';
 const turns = [{ id: 'now', role: 'user', source: 'manual', text: question }];
 const found = resolve(question, files, turns, 'now', undefined, ['Nimbus Ledger']);
 assert.equal(found.profileProject, true);
 assert.equal(found.missingNamedProject, false);
 const missing = resolve(question, files, turns, 'now', undefined, ['Other Ledger']);
 assert.equal(missing.profileProject, undefined);
 assert.equal(missing.missingNamedProject, true);
});
