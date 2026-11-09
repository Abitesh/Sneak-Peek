import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { PersonalKnowledgeManager } from '../../../dist-electron/electron/personalKnowledge/PersonalKnowledgeManager.js';
import { PersonalRagAdapter } from '../../../dist-electron/electron/rag/adapters/PersonalRagAdapter.js';
import { RAGManager } from '../../../dist-electron/electron/rag/RAGManager.js';
import { RAGRetriever } from '../../../dist-electron/electron/rag/RAGRetriever.js';
import { CanonicalRagStorage } from '../../../dist-electron/electron/rag/canonical/CanonicalRagStorage.js';
import { CanonicalRagReadService } from '../../../dist-electron/electron/rag/canonical/CanonicalRagReadService.js';
import { installCanonicalRagSchema } from '../../../dist-electron/electron/rag/canonical/CanonicalRagSchema.js';
import { CanonicalPersonalRagService } from '../../../dist-electron/electron/rag/canonical/CanonicalPersonalRagService.js';
import { CanonicalEmbeddingService } from '../../../dist-electron/electron/rag/canonical/CanonicalEmbeddingService.js';
import { PersonalStorageAdapter } from '../../../dist-electron/electron/rag/storage/PersonalStorageAdapter.js';
import { SneakPeekIntelligenceEngine } from '../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import { RetrievalCoordinator } from '../../../dist-electron/electron/intelligence/engine/RetrievalCoordinator.js';
import { createCanonicalRagRetrievalCapability } from '../../../dist-electron/electron/intelligence/engine/CanonicalRagRetrievalAdapter.js';
import { resolveProjectFileScopeForTurn } from '../../../dist-electron/electron/intelligence/engine/ProjectFileScope.js';
import { GenerationController } from '../../../dist-electron/electron/intelligence/engine/GenerationController.js';
import { appendConversationTurn, updateConversationTurn, clearConversationState, getRecentConversationTurns } from '../../../dist-electron/electron/context-intelligence/question/conversation-state-store.js';

// Exercise production-default source fallback; never initialize a model.
process.env.NATIVELY_CANONICAL_RAG_READ = 'off';
process.env.NATIVELY_RAG_LOCAL_RERANK = 'off';

// Minimal valid two-page PDF with real objects, streams and byte offsets. No
// PDF generator dependency or network fixture is needed; production parses it.
function syntheticPdf(pages) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const kids = [];
  for (const text of pages) {
    const pageId = objects.length + 1, contentId = pageId + 1;
    kids.push(`${pageId} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    const stream = `BT /F1 12 Tf 50 720 Td (${text.replace(/[\\()]/g, '\\$&')}) Tj ET`;
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(' ')}] >>`;
  let pdf = '%PDF-1.4\n', offsets = [0];
  objects.forEach((obj, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

test('CHG-17 real personal ingestion/listing/retrieval and engine generation preserve project identity and PDF provenance', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chg1718-personal-'));
  const db = new Database(path.join(dir, 'synthetic.sqlite'));
  db.loadExtension(sqliteVec.getLoadablePath().replace('app.asar', 'app.asar.unpacked').replace(/\.(dylib|so|dll)$/, ''));
  db.exec(`CREATE TABLE rag_index_status (source_type TEXT NOT NULL, document_id TEXT NOT NULL, status TEXT NOT NULL, chunk_count INTEGER NOT NULL DEFAULT 0, embedded_chunk_count INTEGER NOT NULL DEFAULT 0, extracted_page_count INTEGER, total_page_count INTEGER, error_code TEXT, error_message TEXT, updated_at INTEGER NOT NULL, PRIMARY KEY (source_type, document_id))`);
  const session = `synthetic-${path.basename(dir)}`;
  try {
    const personal = new PersonalKnowledgeManager(db);
    const records = [];
    for (const [name, type, content] of [
      ['Linkship.md', 'project', 'Linkship uses Redis for violet job leases so crashed workers recover safely.'],
      ['Linkship Legacy.md', 'project', 'Linkship Legacy uses Redis for amber rate counters.'],
      ['Resume.md', 'resume', 'The synthetic candidate uses Redis for unrelated resume decoy facts.'],
    ]) {
      const file = path.join(dir, name); fs.writeFileSync(file, content);
      records.push(await personal.ingestFile(file, type));
    }
    const pdfPath = path.join(dir, 'Synthetic resume.pdf');
    fs.writeFileSync(pdfPath, syntheticPdf(['Synthetic candidate: Jamie Example.', 'Jamie holds the unique Zeta certification.']));
    const pdf = await personal.ingestFile(pdfPath, 'resume');
    assert.equal(pdf.pageCount, 2); assert.equal(pdf.extractedPageCount, 2);
    assert.equal(pdf.indexStatus, 'done');
    const adapter = new PersonalRagAdapter(db);
    adapter.getPersonalKnowledge = () => personal;
    const manager = Object.create(RAGManager.prototype);
    manager.db = db; manager.personalAdapter = adapter;
    manager.retriever = { detectIntent: RAGRetriever.prototype.detectIntent };
    const probe = await adapter.retrieve({ query: 'Why did you use Redis in Linkship?', options: { projectFilesOnly: true, projectFileIds: [records[0].id] }, candidatePoolSize: 8, tokenBudget: 1800 });
    assert.ok(probe.length, 'actual personal adapter must return the indexed project');
    assert.ok(manager.gateCanonicalResults(probe, 'Why did you use Redis in Linkship?', null).length, `actual relevance gate rejected lexical scores ${probe.map(i => i.score)}`);
    let reads = 0;
    const prompts = [];
    const engine = new SneakPeekIntelligenceEngine({
      retrievalCoordinator: new RetrievalCoordinator({ capabilities: [createCanonicalRagRetrievalCapability({
        source: 'project_knowledge', sourceType: 'personal',
        resolveScope: ({ request }) => ({ projectFilesOnly: true, projectFileIds: request.activeContext.projectSourceIds }),
        read: input => { reads++; return manager.readPlannedCanonicalSource(input); },
      })] }),
      generationPort: { stream: ({ request, prompt, lifecycle }) => new GenerationController({
        streamFinalPrompt: async function* () {
          prompts.push(prompt.finalPrompt);
          yield prompt.finalPrompt.includes('violet job leases') ? 'Redis supports violet job leases.' : prompt.finalPrompt.includes('amber rate counters') ? 'Redis supports amber rate counters.' : 'No supporting project evidence.';
        },
      }).stream({ requestId: request.requestId, finalPrompt: prompt.finalPrompt, route: { capability: 'stream_chat', availability: { hasGroq: true }, models: { groq: 'synthetic-offline' }, allowedProviders: ['groq'], maxAttempts: 1 }, abortSignal: request.cancellationSignal, lifecycle }).stream },
    });
    let seq = 0;
    async function ask(question, status = 'completed') {
      const id = `question-${++seq}`;
      appendConversationTurn({ sessionId: session, turnId: id, role: 'user', speaker: 'user', source: 'manual', text: question, finalized: true, generationStatus: 'pending', requestSequence: seq });
      const turns = getRecentConversationTurns(session, 12);
      const scope = resolveProjectFileScopeForTurn(question, personal.listFiles(), turns, id);
      const before = reads;
      const run = engine.prepareAndStream({ requestId: id, sessionId: session, surface: 'manual-chat', userMessage: question, manualQuestion: question, currentTurn: { id, role: 'user', content: question },
        recentConversation: turns.map(t => ({ id: t.id, role: t.role === 'assistant' ? 'assistant' : 'user', content: t.text })),
        activeContext: { projectSourceIds: scope.selectedFileIds, projectName: scope.namedProject },
        contextPermissions: { conversation: true, transcript: false, screen: false, mode: false, project: scope.projectAvailable, profile: false, files: true, memory: false, generalKnowledge: true },
      });
      for await (const _ of run.stream) {}
      const result = await run.result;
      updateConversationTurn({ sessionId: session, turnId: id, generationStatus: status });
      if (status === 'completed') appendConversationTurn({ sessionId: session, role: 'assistant', speaker: 'assistant', source: 'manual', text: result.finalAnswer?.text ?? '', finalized: true, generationStatus: status, requestSequence: seq });
      return { result, calls: reads - before, prompt: prompts.at(-1) };
    }
    const first = await ask('Why did you use Redis in Linkship?');
    assert.equal(first.calls, 1);
    assert.deepEqual(first.result.evidencePack.items.map(i => i.sourceId), [records[0].id]);
    assert.match(first.result.finalAnswer.text, /violet job leases/);
    assert.doesNotMatch(first.prompt, /amber rate counters|resume decoy/);
    const overview = await ask('Tell me about Linkship.');
    assert.deepEqual(overview.result.evidencePack.items.map(i => i.sourceId), [records[0].id]);
    assert.doesNotMatch(overview.prompt, /amber rate counters|resume decoy/);
    const followup = await ask('Why is Redis used in your project?');
    assert.deepEqual(followup.result.evidencePack.items.map(i => i.sourceId), [records[0].id]);
    const sibling = await ask('Why did Linkship Legacy use Redis?');
    assert.deepEqual(sibling.result.evidencePack.items.map(i => i.sourceId), [records[1].id]);
    assert.match(sibling.result.finalAnswer.text, /amber rate counters/);
    assert.doesNotMatch(sibling.prompt, /violet job leases|resume decoy/);
    assert.doesNotMatch(sibling.result.evidence.items.map(i => i.content).join(' '), /violet job leases/);
    const general = await ask('What is DBMS?');
    assert.equal(general.calls, 0); assert.equal(general.result.evidence.items.length, 0);
    for (const status of ['cancelled', 'failed']) {
      clearConversationState(session);
      await ask('Why did you use Redis in Linkship?', status);
      assert.equal((await ask('Why is Redis used in your project?')).result.evidence.items.length, 0);
    }
    clearConversationState(session);
    assert.equal((await ask('Why is Redis used in your project?')).result.evidence.items.length, 0);
    clearConversationState(session);
    await ask('Why did you use Redis in Linkship?');
    assert.equal(personal.deleteFile(records[0].id), true);
    assert.equal((await ask('Why is Redis used in your project?')).result.evidence.items.length, 0);

    // Compare the actual personal adapter against the canonical projection of
    // the same parsed PDF. Deterministic vectors are test data, not ANN/model evidence.
    installCanonicalRagSchema(db);
    const storage = new CanonicalRagStorage(db);
    const embedding = new CanonicalEmbeddingService(storage, { provider: 'fixture', model: 'fixture', dimensions: 2, version: '1', embedBatch: async texts => texts.map(() => [1, 0]) });
    const projection = await new CanonicalPersonalRagService(storage, new PersonalStorageAdapter(db), embedding).projectPersonalFile(pdf.id);
    assert.equal(projection.complete, true);
    assert.equal(projection.activated, true);
    assert.equal(storage.getStatus(projection.documentId, projection.revisionId).status, 'READY');
    assert.ok(storage.searchVector([1, 0], { sourceType: 'personal', sourceId: pdf.id, embeddingSpaceId: projection.embeddingSpaceId, limit: 8 }).length > 0);
    const lexical = await adapter.retrieve({ query: 'unique Zeta certification', options: {}, candidatePoolSize: 8, tokenBudget: 2000 });
    const canonical = await new CanonicalRagReadService(storage).readSource({ query: 'unique Zeta certification', sourceType: 'personal', sourceId: pdf.id, limit: 8, fallback: async () => { throw new Error('READY canonical PDF must not fall back'); } });
    assert.equal(canonical.usedCanonical, true);
    const legacyFact = lexical.find(i => i.source.id === pdf.id && i.chunk.text.includes('Zeta'));
    const canonicalFact = canonical.results.find(i => i.source.id === pdf.id && i.chunk.text.includes('Zeta'));
    assert.ok(legacyFact); assert.ok(canonicalFact);
    assert.equal(legacyFact.chunk.pageStart, 2); assert.equal(canonicalFact.chunk.pageStart, 2);
    assert.ok(canonicalFact.chunk.metadata.canonicalRevisionId);
    const pdfEngine = new SneakPeekIntelligenceEngine(new RetrievalCoordinator({ capabilities: [createCanonicalRagRetrievalCapability({
      source: 'my_files', sourceType: 'personal', resolveScope: () => ({ sourceId: pdf.id }),
      read: input => new CanonicalRagReadService(storage).readSource({ ...input, fallback: async () => [] }),
    })] }));
    const question = 'According to the uploaded PDF, what is the unique Zeta certification?';
    const pdfAnswer = await pdfEngine.handle({ requestId: 'pdf-question', sessionId: 'synthetic-pdf', surface: 'manual-chat', userMessage: question, manualQuestion: question,
      currentTurn: { id: 'pdf-question', role: 'user', content: question }, recentConversation: [],
      contextPermissions: { conversation: true, transcript: false, screen: false, mode: false, project: false, profile: false, files: true, memory: false, generalKnowledge: true },
    });
    const fact = pdfAnswer.evidencePack.items.find(i => i.text.includes('Zeta'));
    assert.ok(fact);
    assert.equal(fact.pageStart, 2);
    assert.ok(fact.chunkId);
    assert.ok(fact.provenance.canonicalRevisionId);
    assert.match(pdfAnswer.prompt.finalPrompt, /Zeta/);
    assert.equal(personal.deleteFile(pdf.id), true);
    const deleted = await new CanonicalRagReadService(storage).readSource({ query: 'unique Zeta certification', sourceType: 'personal', sourceId: pdf.id, limit: 8, fallback: async () => [] });
    assert.deepEqual(deleted.results, [], 'deleted personal files must not remain canonical evidence');
    assert.deepEqual(storage.searchVector([1, 0], { sourceType: 'personal', sourceId: pdf.id, embeddingSpaceId: projection.embeddingSpaceId, limit: 8 }), []);
  } finally {
    clearConversationState(session); db.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
});
