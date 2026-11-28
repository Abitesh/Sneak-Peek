import assert from 'node:assert/strict';
import { test } from 'node:test';
import { documentedChoice, inspectAnswerQuality } from '../../../../dist-electron/electron/intelligence/engine/AnswerQuality.js';

const question = 'Why did you use SQLite instead of alternatives?';
const check = (answer, evidence = ['The application uses SQLite for offline storage.']) =>
  inspectAnswerQuality({ question, answer, evidence, grounded: true, candidate: true });

test('usage or an unrelated choice cannot authorize a retrospective reason', () => {
  assert.equal(documentedChoice(question, ['We chose Redis because it supports expiry. The application uses SQLite.']), false);
  assert.deepEqual(check('I used SQLite because it was cheaper.'), ['unsupported-decision']);
  assert.deepEqual(check('SQLite stores local data. It fits an offline design because it runs in the same process.'), []);
  assert.deepEqual(check('We chose SQLite because it runs offline.', ['We chose SQLite because it runs offline.']), []);
});

test('flags unsupported personal metrics without counting an illustrative metric as an achievement', () => {
  assert.deepEqual(check('I reduced latency by 40%.'), ['unsupported-personal-metric']);
  assert.deepEqual(check('For example, a 40% reduction could be a performance target.'), []);
});

test('checks explicit evidence polarity and quoted source titles without claiming verification', () => {
  const findings = inspectAnswerQuality({ question: 'What does the app store?', grounded: true, candidate: false,
    answer: 'The app stores raw audio. According to "Unrelated notes", it also stores settings.',
    evidence: ['The app does not store raw audio.'], sourceTitles: ['Storage policy'] });
  assert.deepEqual(findings, ['possible-evidence-contradiction', 'source-title-not-in-evidence']);
});

test('reports likely missing examples, candidate identity drift and repeated content as findings', () => {
  const answer = "I'm an AI assistant. A fixed capacity bounds the number of pending jobs. A fixed capacity bounds the number of pending jobs.";
  assert.deepEqual(inspectAnswerQuality({ question: 'Explain this with a tiny example.', answer, evidence: [],
    grounded: false, candidate: true }), ['candidate-self-identification', 'example-not-detected', 'repeated-sentence']);
});

test('flags a definition-only answer when the question also asks how to approach a problem', () => {
  const question = 'What is replication? Could you design a replicated service for me?';
  const base = { question, candidate: true, grounded: false, evidence: [] };
  assert.deepEqual(inspectAnswerQuality({ ...base, answer: 'Replication keeps copies of data on multiple systems.' }), ['approach-not-detected']);
  assert.deepEqual(inspectAnswerQuality({ ...base, answer: 'Replication keeps copies of data on multiple systems. I would start by clarifying recovery requirements.' }), []);
});

const { SneakPeekIntelligenceEngine } = await import('../../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js');
const { RetrievalCoordinator, createRetrievalCapability } = await import('../../../../dist-electron/electron/intelligence/engine/RetrievalCoordinator.js');
const { resolveProjectFileScopeForTurn } = await import('../../../../dist-electron/electron/intelligence/engine/ProjectFileScope.js');

test('explicit abbreviated project flow and why variants resolve an authorized file, including on the first turn', () => {
  const files = [{ id: 'one', fileType: 'project', fileName: 'Lantern Search Architecture.txt' }];
  for (const question of ['Briefly summarize the Lantern project.', 'Describe the implementation flow of the Lantern project in detail.',
    'Explain in detail why you used SQLite in your Lantern project.']) {
    const result = resolveProjectFileScopeForTurn(question, files, [], 'today');
    assert.deepEqual(result.selectedFileIds, ['one'], question);
  }
  const ambiguous = resolveProjectFileScopeForTurn('Describe the Lantern project.',
    [...files, { id: 'two', fileType: 'project', fileName: 'Lantern Metrics.txt' }], [], 'today');
  assert.deepEqual(ambiguous.selectedFileIds, []);
});

const projectQuestion = 'Why did you use SQLite instead of alternatives in your Lantern Search project?';
const groundedRequest = {
  requestId: 'review', sessionId: 'review', surface: 'manual-chat',
  userMessage: projectQuestion, manualQuestion: projectQuestion,
  currentTurn: { id: 'turn', role: 'user', content: projectQuestion },
  recentConversation: [], activeContext: { projectName: 'Lantern Search', projectSourceIds: ['one'] },
  contextPermissions: { project: true, generalKnowledge: true },
};
const engineWith = (produce) => new SneakPeekIntelligenceEngine({
  retrievalCoordinator: new RetrievalCoordinator({ capabilities: [
    createRetrievalCapability('project_knowledge', async () => ({
      items: [{ id: 'one', source: 'project_knowledge', content: 'Lantern Search uses SQLite to store local data.',
        metadata: { sourceId: 'one' } }],
    })),
  ] }),
  generationPort: { stream: async function* ({ lifecycle }) {
    lifecycle.transition('GENERATING'); lifecycle.transition('COMMITTED');
    yield* produce();
    lifecycle.transition('COMPLETED');
  } },
});
test('grounded decision review never streams the unsupported historical draft', async () => {
  const run = engineWith(async function* () { yield 'I chose SQLite '; yield 'because it was cheaper.'; }).prepareAndStream(groundedRequest);
  const resultCheck = assert.rejects(run.result, /selected sources could not support/);
  await assert.rejects(run.stream.next(), /selected sources could not support/);
  await resultCheck;
});
test('STOP discards a historical draft held for evidence review', async () => {
  const controller = new AbortController();
  let release, started;
  const gate = new Promise(resolve => { release = resolve; });
  const entered = new Promise(resolve => { started = resolve; });
  const run = engineWith(async function* () {
    yield 'I chose SQLite ';
    started();
    await gate;
    yield 'because it was cheaper.';
  }).prepareAndStream({ ...groundedRequest, cancellationSignal: controller.signal });
  const next = run.stream.next();
  await Promise.race([entered, next.then(() => { throw new Error('draft text escaped the gate'); })]);
  controller.abort();
  release();
  assert.equal((await next).done, true);
  assert.equal((await run.result).streamLifecycle.status, 'cancelled');
});

test('a named project with no authorized source cannot turn a metric premise into an achievement', async () => {
  const question = 'Explain how you reduced errors by 25% in your Aurora Index project.';
  const run = engineWith(async function* () { assert.fail('missing-project metric should not call generation'); }).prepareAndStream({
    ...groundedRequest, userMessage: question, manualQuestion: question,
    currentTurn: { ...groundedRequest.currentTurn, content: question },
    activeContext: { projectName: 'Aurora Index', projectSourceIds: [] },
  });
  const chunks = [];
  for await (const chunk of run.stream) chunks.push(chunk);
  assert.match(chunks.join(''), /authorized source.*stated result/);
  assert.equal((await run.result).streamLifecycle.status, 'completed');
});

const { planAnswer } = await import('../../../../dist-electron/electron/llm/AnswerPlanner.js');

test('a hyphenated cache write policy does not request code but an imperative still does', () => {
  assert.equal(planAnswer({ source: 'manual-chat', question: 'What happens on a miss in a write-back cache? Give a small example.' }).answerType,
    'technical_concept_answer');
  assert.equal(planAnswer({ source: 'manual-chat', question: 'Write a function that implements a write-back cache.' }).answerType,
    'coding_question_answer');
});
