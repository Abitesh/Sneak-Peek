import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { KnowledgeOrchestrator } from '../../../../dist-electron/premium/electron/knowledge/KnowledgeOrchestrator.js';
import { collectV3ProfileSources } from '../../../../dist-electron/electron/services/knowledge/v3ProfileSources.js';
import { createProfileRetrievalPort } from '../../../../dist-electron/electron/context-intelligence/retrieval/profile-retrieval-port.js';
import { MODE_POLICIES } from '../../../../dist-electron/electron/context-intelligence/policies/mode-policy-registry.js';
import { decide } from '../../../../dist-electron/electron/context-intelligence/orchestration/orchestrator.js';
import { SneakPeekIntelligenceEngine } from '../../../../dist-electron/electron/intelligence/engine/SneakPeekIntelligenceEngine.js';
import { RetrievalCoordinator, createRetrievalCapability } from '../../../../dist-electron/electron/intelligence/engine/RetrievalCoordinator.js';

test('active profile ingestion survives reload and reaches engine evidence without Hindsight', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sneak-peek-profile-fixture-'));
  const db = new Database(':memory:');
  try {
    db.exec('CREATE TABLE profile_documents (id TEXT PRIMARY KEY, doc_type TEXT, raw_text TEXT, structured_data TEXT, extraction_mode TEXT, created_at TEXT, updated_at TEXT)');
    const source = path.join(temp, 'resume.md');
    fs.writeFileSync(source, 'Candidate worked at Acme Robotics from 2023 to 2025. Primary language: Rust.');
    const owner = { getDb: () => db };
    const ingest = new KnowledgeOrchestrator(owner);
    ingest.setGenerateContentFn(async () => JSON.stringify({ identity: { name: 'Fixture Candidate' }, experience: [{ company: 'Acme Robotics', role: 'Engineer', start_date: '2023', end_date: '2025', bullets: ['Used Rust'] }], skills: { Languages: ['Rust'] }, skills_flat: ['Rust'] }));
    assert.equal((await ingest.ingestDocument(source, 'resume')).success, true);
    const reloaded = new KnowledgeOrchestrator(owner);
    const { docs } = collectV3ProfileSources(reloaded);
    assert.ok(docs.length > 0, 'persisted current profile must be collected after reload');
    const policy = MODE_POLICIES.general;
    const port = createProfileRetrievalPort({ docs, allowedSourceTypes: policy.allowedSourceTypes, profileSources: policy.profileSources, userId: 'fixture' });
    assert.ok(port);
    const engine = new SneakPeekIntelligenceEngine({ retrievalCoordinator: new RetrievalCoordinator({ capabilities: [createRetrievalCapability('profile', async ({ query }) => {
      const decision = decide({ requestId: 'fixture', requestSequence: 1, surface: 'manual-chat', modeId: 'general', scope: { userId: 'fixture' }, sessionId: 'profile-fixture', manualQuestion: query });
      const result = await port.retrieve({ decision });
      return { items: result.evidence.map((item) => ({ id: item.evidenceId, source: 'profile', content: item.content, score: item.finalScore, metadata: { sourceId: item.sourceId, versionId: item.versionId, authority: 'evidence' } })) };
    })] }) });
    const message = 'Where did I work according to my resume?';
    const result = await engine.handle({ requestId: 'profile-fixture', sessionId: 'profile-fixture', surface: 'manual-chat', userMessage: message, currentTurn: { id: 'current', role: 'user', content: message }, recentConversation: [], activeContext: { profileId: 'fixture' }, contextPermissions: { conversation: true, transcript: false, screen: false, mode: false, project: false, profile: true, files: false, memory: false, generalKnowledge: true } });
    assert.ok(result.evidence.items.length > 0);
    assert.match(result.prompt.finalPrompt, /Acme Robotics/);
    assert.ok(result.evidence.items.every((item) => item.metadata?.versionId));
  } finally { db.close(); fs.rmSync(temp, { recursive: true, force: true }); }
});
