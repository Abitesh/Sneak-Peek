import test from 'node:test';
import assert from 'node:assert/strict';
import { isBroadCandidateProjectsQuestion } from '../../../../dist-electron/electron/context-intelligence/question/ProjectOverviewIntent.js';
import { understandTurn } from '../../../../dist-electron/electron/context-intelligence/question/question-resolver.js';
import { planContext } from '../../../../dist-electron/electron/intelligence/engine/ContextPlanner.js';
import { createCanonicalRagRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js';

const permissions = { conversation:true,transcript:false,screen:false,mode:false,project:true,profile:false,files:true,memory:true,generalKnowledge:true };
const request = (text, overrides={}) => ({
  requestId:'portfolio-req', sessionId:'portfolio-session',surface:'manual-chat',userMessage:text,
  currentTurn:{id:'portfolio-turn',role:'user',content:text}, recentConversation:[],
  contextPermissions:permissions,activeContext:{resumeSourceIds:['resume-1']},...overrides,
});
const plan = (text, overrides={}) => planContext({ request:request(text,overrides), understanding:understandTurn({manualQuestion:text}) });

for (const question of [
  'Can you explain your projects?', 'Could you describe my projects in detail?',
  'Tell me about my projects.', 'Explain the projects I worked on.',
  'What projects have I built?', 'Give me an overview of your projects.',
  'Then can you explain me Your projects you mentioned in the resume',
  'Tell me about the projects on my resume',
  'Explain your projects while you are at it',
  'What projects have I worked on?',
]) {
  test(`portfolio overview selects tagged project and resume evidence: ${question}`, () => {
    assert.equal(isBroadCandidateProjectsQuestion(question), true);
    const context=plan(question);
    assert.ok(context.requiredSources.includes('project_knowledge'), question);
    assert.ok(context.requiredSources.includes('my_files'), question);
    assert.ok(context.requiredSources.includes('rag'), question);
    assert.ok(!context.requiredSources.includes('personal_knowledge'), question);
  });
}

test('resume-only uploads remain a strictly scoped portfolio source', () => {
  const context=plan('Then can you explain me Your projects you mentioned in the resume', {
    contextPermissions:{...permissions,project:false},
    activeContext:{resumeSourceIds:['resume-1']},
  });
  assert.ok(context.requiredSources.includes('my_files'));
  assert.ok(context.requiredSources.includes('rag'));
  assert.ok(!context.requiredSources.includes('project_knowledge'));
  assert.ok(context.forbiddenSources.includes('profile'));
  assert.ok(context.forbiddenSources.includes('personal_knowledge'));
  assert.ok(context.forbiddenSources.includes('mode_documents'));
});

test('no project files preserves candidate profile/knowledge fallback', () => {
  const context=plan('Can you explain your projects?', {contextPermissions:{...permissions,project:false},activeContext:{resumeSourceIds:[]}});
  assert.ok(context.requiredSources.includes('personal_knowledge'));
  assert.ok(!context.requiredSources.includes('project_knowledge'));
});

test('named single-project and general questions must never fetch the resume scope', () => {
  for (const question of ['Why did you use Redis in Linkship?', 'Tell me about Linkship in detail.', 'What is DBMS?',
    'Explain your project architecture', 'Explain Linkship architecture']) {
    assert.equal(isBroadCandidateProjectsQuestion(question), false);
    assert.ok(!plan(question).requiredSources.includes('my_files'), question);
  }
  const general=plan('What is DBMS?');
  assert.ok(!general.requiredSources.includes('project_knowledge'));
});

test('resume evidence is filtered against exact main-process ID allowlist even if reader returns all files', async () => {
  const results=['resume-1','project-1','general-1','resume-2'].map(id=>({
    chunk:{id:`chunk-${id}`,documentId:id,text:`synthetic ${id}`,chunkIndex:0},
    source:{id,sourceType:'personal',name:id,metadata:{fileType:id.startsWith('resume')?'resume':'project'}}, score:0.8,
  }));
  const cap=createCanonicalRagRetrievalCapability({source:'my_files',sourceType:'personal',
    resolveScope:({request})=>({projectFileIds:request.activeContext.resumeSourceIds}),
    read:async()=>({usedCanonical:false,results}),
  });
  const r=await cap.retrieve({query:'Can you explain your projects?',source:'my_files',
    request:request('Can you explain your projects?'),contextPlan:plan('Can you explain your projects?')});
  assert.deepEqual(r.items.map(i=>i.metadata.sourceId), ['resume-1']);
});
