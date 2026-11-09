// electron/llm/__tests__/PronounRegexShadowDivergence2026_07_26.test.mjs
//
// WORK-0033 follow-up to Phase 6 Slice 4 (2026-07-26):
// Historical context: the plan's pre-required test
// (PronounRegexKnowledgeForkClosedByIsLayerAllowed2026_07_25.test.mjs)
// already proved isLayerAllowed(plan, 'resume') resolves to a single,
// uniform false for the exact 6-question corpus that documents the
// pronoun-regex fork — but that test calls isLayerAllowed directly, not
// through KnowledgeOrchestrator.processQuestion() itself. This file closes
// that last gap: a real, additive SHADOW-ONLY observation wired into
// processQuestion(), behind a dev-only flag. After the canonical ContextPlanner
// cutover the legacy observer was retired; the flag must not change results
// or log personal decisions. Earlier diagnostics only mirrored
// exactly mirroring the CanonicalTurnV2 shadow-wiring pattern already
// established in ipcHandlers.ts for Slice 3 (resolveCanonicalTurn) and
// documented as this codebase's safe way to observe a replacement
// decision-maker before ever promoting it.
//
// This suite now protects canonical source authority and non-interference
// instead of requiring an obsolete side-channel trace. The flag name remains
// in the registry only for backward-compatible configuration; removal of that
// compatibility setting belongs to Change 19, not this LLM repair.
//
// Uses the same mock-KnowledgeDatabaseManager pattern already established
// in LeadershipGroundingFixBehavioral2026_07_25.test.mjs /
// InterviewerPerspectiveGrounding.test.mjs.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const require = createRequire(import.meta.url);
const { KnowledgeOrchestrator } = require(
  path.resolve(repoRoot, 'dist-electron/premium/electron/knowledge/KnowledgeOrchestrator.js'),
);
const { __resetIntelligenceFlagsCache } = require(
  path.resolve(repoRoot, 'dist-electron/electron/intelligence/intelligenceFlags.js'),
);

function makeResume() {
  return {
    id: 1,
    type: 'resume',
    structured_data: {
      identity: { name: 'Priya Nair', email: '', location: '', phone: '', links: [] },
      summary: '',
      skills: ['Python', 'Kubernetes'],
      experience: [
        { company: 'Acme Robotics', role: 'Software Engineer', start_date: '2022-01', end_date: null, bullets: ['Built a container orchestration pipeline on EKS.'] },
      ],
      projects: [],
      education: [],
      achievements: [],
      certifications: [],
      leadership: [],
    },
  };
}

function makeOrchestrator() {
  const db = {
    initializeSchema() {},
    getDocumentByType(t) { return t === 'resume' ? makeResume() : null; },
    getAllNodes() { return []; },
    getNodeCount() { return 0; },
    getIntro() { return null; },
    getGapAnalysis() { return null; },
    getNegotiationScript() { return null; },
    getMockQuestions() { return null; },
    getCultureMappings() { return null; },
  };
  const o = new KnowledgeOrchestrator(db);
  o.setKnowledgeMode(true);
  return o;
}

describe('pronounRegexShadowObservation flag registration', () => {
  test('resolves to false under this bare node:test harness (dev/test-only default)', () => {
    __resetIntelligenceFlagsCache();
    delete process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION;
    const { isIntelligenceFlagEnabled } = require(
      path.resolve(repoRoot, 'dist-electron/electron/intelligence/intelligenceFlags.js'),
    );
    assert.equal(isIntelligenceFlagEnabled('pronounRegexShadowObservation'), false);
  });

  test('NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION=1 env override enables it', () => {
    __resetIntelligenceFlagsCache();
    process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION = '1';
    try {
      const { isIntelligenceFlagEnabled } = require(
        path.resolve(repoRoot, 'dist-electron/electron/intelligence/intelligenceFlags.js'),
      );
      assert.equal(isIntelligenceFlagEnabled('pronounRegexShadowObservation'), true);
    } finally {
      delete process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION;
      __resetIntelligenceFlagsCache();
    }
  });
});

describe('legacy shadow flag cannot alter canonical processQuestion behavior', () => {
  test('flag OFF: no shadow log call, behavior identical to before this change', async () => {
    __resetIntelligenceFlagsCache();
    delete process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION;
    const o = makeOrchestrator();
    const logs = [];
    const origWarn = console.warn;
    console.warn = (...args) => logs.push(args);
    try {
      const result = await o.processQuestion('Have I demonstrated Kubernetes experience?');
      assert.ok(result !== undefined, 'processQuestion must still return its normal result');
      const shadowLogs = logs.filter((a) => String(a[0] || '').includes('[PronounRegexShadow]'));
      assert.equal(shadowLogs.length, 0, 'no shadow-divergence log when the flag is off');
    } finally {
      console.warn = origWarn;
    }
  });

  test('obsolete shadow flag cannot change canonical source authorization or reply', async () => {
    const question = 'Have I demonstrated Kubernetes experience?';
    __resetIntelligenceFlagsCache();
    delete process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION;
    const resultOff = await makeOrchestrator().processQuestion(question);
    process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION = '1';
    __resetIntelligenceFlagsCache();
    try {
      const resultOn = await makeOrchestrator().processQuestion(question);
      assert.deepEqual(resultOn, resultOff, 'legacy observation flag must never affect canonical answer/evidence decisions');
    } finally {
      delete process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION;
      __resetIntelligenceFlagsCache();
    }
  });

  test('legacy pronoun observer does not log personal content after canonical cutover', async () => {
    __resetIntelligenceFlagsCache();
    process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION = '1';
    const logged = [];
    const origLog = console.log;
    const origWarn = console.warn;
    console.log = (...args) => logged.push(args);
    console.warn = (...args) => logged.push(args);
    try {
      await makeOrchestrator().processQuestion('Have I demonstrated Kubernetes experience?');
    } finally {
      console.log = origLog;
      console.warn = origWarn;
      delete process.env.NATIVELY_PRONOUN_REGEX_SHADOW_OBSERVATION;
      __resetIntelligenceFlagsCache();
    }
    assert.equal(logged.filter(args => String(args[0] || '').includes('[PronounRegexShadow]')).length, 0,
      'retired pronoun shadow must not reintroduce legacy logging of profile decisions');
  });
});
