import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  createQuestionDemandSignal,
  aggregateQuestionDemandCluster,
  buildKppDemandInput,
  evaluatePcaArticleCandidate,
  buildPjaDemandBriefCandidate,
  evaluateCarVisualCandidate,
  buildPcaProductionFeedbackRecord
} from '../functions/_lib/knowledge-demand-feedback.js';

const mode = process.argv[2] || 'ALL';
const ROOT = 'content/knowledge/client-demand-feedback';
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const assertEvidence = item => {
  assert.ok(fs.existsSync(item.path), `MISSING_EVIDENCE:${item.path}`);
  assert.equal(sha256(item.path), item.sha256, `EVIDENCE_DRIFT:${item.path}`);
};
const run = (step, fn) => {
  if (mode === 'ALL' || mode === step) fn();
};

run('PCA-W0', () => {
  const a = readJson(`${ROOT}/audits/pca-w0-pja-boundary-v1.json`);
  assert.equal(a.status, 'PRESERVED_PJA_PUBLICATION_AUTHORITY');
  assert.equal(a.boundary.PJA, 'PUBLICATION_PRODUCTION_RUNTIME');
  assert.equal(a.boundary.PJA_isClientAnswerGenerator, false);
  assert.equal(a.boundary.PCA_mayPublishArticle, false);
  Object.values(a.preservedEvidence).forEach(assertEvidence);
  console.log('✓ PCA-W0 PJA Boundary passed; PJA remains Publication Production Runtime, not Client Answer Generator.');
});

run('PCA-W1', () => {
  const a = readJson(`${ROOT}/audits/pca-w1-car-boundary-v1.json`);
  assert.equal(a.status, 'PRESERVED_CAR_ASSET_PRODUCTION_AUTHORITY');
  assert.equal(a.boundary.CAR, 'REUSABLE_KNOWLEDGE_ASSET_PRODUCTION');
  assert.equal(a.boundary.CAR_isDynamicClientMethodRenderer, false);
  assert.equal(a.boundary.PCA_mayPublishAsset, false);
  Object.values(a.preservedEvidence).forEach(assertEvidence);
  console.log('✓ PCA-W1 CAR Boundary passed; CAR remains reusable Knowledge Asset Production, not a dynamic client Method renderer.');
});

let s1, s2, cluster, kpp, article, brief, visual;
function buildFixturePipeline() {
  if (s1) return;
  s1 = createQuestionDemandSignal({
    questionClusterCode: 'QCL-RUNTIME-FATIGUE',
    window: { start: '2026-08-01T00:00:00Z', end: '2026-08-07T23:59:59Z' },
    matchedNodes: ['KN-B3-P8-001', 'KN-B3-P8-002'],
    frequency: 14, coverageGap: 'PARTIAL', followUpRate: 0.32, answerDifficulty: 'MEDIUM', journeyEscalationRate: 0.18
  });
  s2 = createQuestionDemandSignal({
    questionClusterCode: 'QCL-RUNTIME-FATIGUE',
    window: { start: '2026-08-08T00:00:00Z', end: '2026-08-14T23:59:59Z' },
    matchedNodes: ['KN-B3-P8-001', 'KN-B3-P8-003'],
    frequency: 12, coverageGap: 'PARTIAL', followUpRate: 0.28, answerDifficulty: 'HIGH', journeyEscalationRate: 0.22
  });
  cluster = aggregateQuestionDemandCluster([s1, s2]);
  kpp = buildKppDemandInput({ cluster, canonicalMaturity: 'MATURE', knowledgeGap: 'PARTIAL', surfaceNeed: 'ARTICLE', academyNeed: 'NONE', readingNeed: 'SUPPORTING' });
  article = evaluatePcaArticleCandidate({ kppDemandInput: kpp, reusable: true, personalSpecificity: false, knowledgeSupport: { status: 'STRONG', canonicalNodeCount: 3, governedSourceRefCount: 4 } });
  brief = buildPjaDemandBriefCandidate({
    articleCandidate: article,
    kppDecision: { productionRole: 'ARTICLE', humanProductionDecision: 'APPROVED', frozenPlanRef: 'KPP-PLAN-FROZEN-TEST', frozenWaveRef: 'KPP-WAVE-FROZEN-TEST' },
    scope: 'Explain reusable runtime fatigue mechanisms without converting client demand into canonical truth.',
    canonicalNodes: ['KN-B3-P8-001', 'KN-B3-P8-002', 'KN-B3-P8-003'],
    thesis: { source: 'CANONICAL_THESIS', text: 'Long-running systems can accumulate load and require governed recovery pathways.' },
    boundaries: ['No personal diagnosis', 'No client-demand-derived canonical mutation'],
    sourceRefs: ['KSAR:KN-B3-P8-001', 'KSAR:KN-B3-P8-002'],
    localeRequirements: ['zh-Hans', 'en']
  });
  visual = evaluateCarVisualCandidate({
    visualNeed: { type: 'FLOW', clusterId: cluster.clusterId, purpose: 'Show load → degradation → recovery sequence', reusable: true },
    kppCarHandoff: { productionRole: 'DIAGRAM', handoffRef: 'KPP-CAR-HANDOFF-TEST', frozenPlanRef: 'KPP-PLAN-FROZEN-TEST', frozenWaveRef: 'KPP-WAVE-FROZEN-TEST' }
  });
}

run('PCA-W2', () => {
  buildFixturePipeline();
  const c = readJson(`${ROOT}/contracts/pca-w2-question-demand-signal-contract-v1.json`);
  assert.equal(c.privacy.aggregationRequired, true);
  assert.equal(c.privacy.rawQuestionRetentionAllowed, false);
  assert.equal(s1.privacy.dataClass, 'ANONYMOUS_AGGREGATED');
  assert.equal(s1.privacy.rawQuestionStored, false);
  assert.deepEqual(s1, readJson(`${ROOT}/fixtures/question-demand-signal.valid.json`));
  assert.throws(() => createQuestionDemandSignal({ question: 'raw question', questionClusterCode: 'QCL-X00', window: { start: '2026-08-01T00:00:00Z', end: '2026-08-02T00:00:00Z' }, matchedNodes: [], frequency: 1, coverageGap: 'NONE', followUpRate: 0, answerDifficulty: 'LOW', journeyEscalationRate: 0 }), /PCA_PERSONAL_OR_RAW_FIELD_FORBIDDEN/);
  assert.throws(() => createQuestionDemandSignal({ userId: 'U1', questionClusterCode: 'QCL-X00', window: { start: '2026-08-01T00:00:00Z', end: '2026-08-02T00:00:00Z' }, matchedNodes: [], frequency: 1, coverageGap: 'NONE', followUpRate: 0, answerDifficulty: 'LOW', journeyEscalationRate: 0 }), /PCA_PERSONAL_OR_RAW_FIELD_FORBIDDEN/);
  console.log('✓ PCA-W2 QuestionDemandSignal passed; only anonymous aggregated demand metrics are retained.');
});

run('PCA-W3', () => {
  buildFixturePipeline();
  const c = readJson(`${ROOT}/contracts/pca-w3-demand-cluster-contract-v1.json`);
  assert.equal(c.authority.clusterIsCanonicalKnowledge, false);
  assert.equal(cluster.metrics.frequency, 26);
  assert.equal(cluster.metrics.answerDifficulty, 'HIGH');
  assert.deepEqual(cluster.matchedNodes, ['KN-B3-P8-001', 'KN-B3-P8-002', 'KN-B3-P8-003']);
  assert.deepEqual(cluster, readJson(`${ROOT}/fixtures/question-demand-cluster.valid.json`));
  const foreign = createQuestionDemandSignal({ questionClusterCode: 'QCL-OTHER', window: { start: '2026-08-01T00:00:00Z', end: '2026-08-02T00:00:00Z' }, matchedNodes: [], frequency: 1, coverageGap: 'NONE', followUpRate: 0, answerDifficulty: 'LOW', journeyEscalationRate: 0 });
  assert.throws(() => aggregateQuestionDemandCluster([s1, foreign]), /PCA_MIXED_CLUSTER_CODES_FORBIDDEN/);
  console.log('✓ PCA-W3 Demand Cluster passed; clusters aggregate demand without becoming Canonical Knowledge.');
});

run('PCA-W4', () => {
  buildFixturePipeline();
  const c = readJson(`${ROOT}/contracts/pca-w4-kpp-demand-input-contract-v1.json`);
  Object.values(c.preservedEvidence).forEach(assertEvidence);
  assert.deepEqual(Object.keys(kpp.dimensions), ['canonicalMaturity', 'knowledgeGap', 'clientDemand', 'surfaceNeed', 'academyNeed', 'readingNeed']);
  assert.equal(kpp.authority.advisoryPlanningInputOnly, true);
  assert.equal(kpp.authority.automaticPlanMutation, false);
  assert.deepEqual(kpp, readJson(`${ROOT}/fixtures/kpp-demand-input.valid.json`));
  console.log('✓ PCA-W4 KPP Demand Input passed; Client Demand is advisory planning input and cannot silently mutate frozen KPP state.');
});

run('PCA-W5', () => {
  buildFixturePipeline();
  const c = readJson(`${ROOT}/contracts/pca-w5-article-candidate-contract-v1.json`);
  assert.equal(c.authority.pcaAssignsProductionRole, false);
  assert.equal(article.status, 'ELIGIBLE_FOR_KPP_ARTICLE_CONSIDERATION');
  assert.deepEqual(article.tests, { highDemand: true, reusable: true, strongKnowledgeSupport: true });
  assert.equal(article.authority.productionRoleAssigned, false);
  const weak = evaluatePcaArticleCandidate({ kppDemandInput: kpp, reusable: true, knowledgeSupport: { status: 'PARTIAL', canonicalNodeCount: 3, governedSourceRefCount: 4 } });
  assert.equal(weak.status, 'NOT_ELIGIBLE');
  assert.deepEqual(article, readJson(`${ROOT}/fixtures/article-candidate.valid.json`));
  console.log('✓ PCA-W5 Article Candidate passed; PCA proposes eligibility only and KPP retains ARTICLE production-role authority.');
});

run('PCA-W6', () => {
  buildFixturePipeline();
  const c = readJson(`${ROOT}/contracts/pca-w6-pja-brief-contract-v1.json`);
  Object.values(c.preservedEvidence).forEach(assertEvidence);
  assert.equal(brief.governance.humanReviewRequired, true);
  assert.equal(brief.governance.pjaApprovalGranted, false);
  assert.equal(brief.governance.publicationAllowed, false);
  assert.equal(brief.thesis.demandDerived, false);
  assert.throws(() => buildPjaDemandBriefCandidate({ articleCandidate: article, kppDecision: { productionRole: 'ARTICLE', humanProductionDecision: 'APPROVED', frozenPlanRef: 'P', frozenWaveRef: 'W' }, scope: 'x', canonicalNodes: ['KN-B3-P8-001'], thesis: { source: 'CLIENT_DEMAND', text: 'x' }, boundaries: ['x'], sourceRefs: ['x'], localeRequirements: ['en'] }), /PCA_PJA_THESIS_SOURCE_INVALID/);
  assert.throws(() => buildPjaDemandBriefCandidate({ articleCandidate: article, kppDecision: { productionRole: 'ARTICLE', humanProductionDecision: 'APPROVED' }, scope: 'x', canonicalNodes: ['KN-B3-P8-001'], thesis: { source: 'CANONICAL_THESIS', text: 'x' }, boundaries: ['x'], sourceRefs: ['x'], localeRequirements: ['en'] }), /PCA_KPP_FROZEN_PLAN_WAVE_REQUIRED/);
  assert.deepEqual(brief, readJson(`${ROOT}/fixtures/pja-demand-brief.valid.json`));
  console.log('✓ PCA-W6 PJA Brief passed; only KPP-authorized ARTICLE handoff can form a demand-originated brief and Human Review remains mandatory.');
});

run('PCA-W7', () => {
  buildFixturePipeline();
  const c = readJson(`${ROOT}/contracts/pca-w7-car-visual-candidate-contract-v1.json`);
  Object.values(c.preservedEvidence).forEach(assertEvidence);
  assert.equal(visual.visualNeed.type, 'FLOW');
  assert.equal(visual.visualNeed.mappedProductionRole, 'DIAGRAM');
  assert.equal(visual.authority.createsFinalAsset, false);
  assert.throws(() => evaluateCarVisualCandidate({ visualNeed: { type: 'FLOW', reusable: true }, kppCarHandoff: { productionRole: 'ARTICLE', handoffRef: 'X', frozenPlanRef: 'P', frozenWaveRef: 'W' } }), /PCA_GOVERNED_KPP_CAR_HANDOFF_REQUIRED/);
  assert.deepEqual(visual, readJson(`${ROOT}/fixtures/car-visual-candidate.valid.json`));
  console.log('✓ PCA-W7 CAR Visual Candidate passed; reusable visual demand enters CAR only through governed KPP asset-need handoff.');
});

run('PCA-W8', () => {
  buildFixturePipeline();
  const c = readJson(`${ROOT}/contracts/pca-w8-production-feedback-loop-contract-v1.json`);
  assert.equal(c.hardBoundary, 'DEMAND_CANNOT_REWRITE_CANONICAL_TRUTH');
  const feedback = buildPcaProductionFeedbackRecord({ cluster, articleCandidate: article, pjaBrief: brief, carVisualCandidate: visual, publishedKnowledgeRefs: [] });
  assert.equal(feedback.authority.demandCanRewriteCanonicalTruth, false);
  assert.equal(feedback.authority.automaticCanonicalNodeCreation, false);
  assert.equal(feedback.authority.automaticPublication, false);
  assert.deepEqual(feedback, readJson(`${ROOT}/fixtures/production-feedback-record.valid.json`));
  console.log('✓ PCA-W8 Production Feedback Loop passed; demand may inform planning but cannot mutate Canonical Truth or auto-publish.');
});

if (mode === 'ALL') {
  const a = readJson(`${ROOT}/acceptance/pca-w0-w8-client-demand-loop-acceptance-v1.json`);
  const f = readJson(`${ROOT}/freeze/pca-w0-w8-client-demand-loop-freeze-v1.json`);
  assert.equal(a.status, 'ACCEPTED_NON_MUTATING_CLIENT_DEMAND_LOOP');
  assert.equal(a.acceptedFacts.demandCanRewriteCanonicalTruth, false);
  assert.equal(a.acceptedFacts.productionRegistriesInitiallyEmpty, true);
  assert.equal(f.status, 'FROZEN_PCA_W0_W8_NON_AUTHORITATIVE_DEMAND_FEEDBACK');
  for (const item of f.frozenOutputs) assertEvidence(item);
  for (const item of f.predecessorEvidence) assertEvidence(item);
  const signalRegistry = readJson(`${ROOT}/registries/question-demand-signal-registry-v1.json`);
  const clusterRegistry = readJson(`${ROOT}/registries/question-demand-cluster-registry-v1.json`);
  assert.deepEqual(signalRegistry.entries, []);
  assert.deepEqual(clusterRegistry.entries, []);
  assert.equal(signalRegistry.privacy.rawQuestionStorage, false);
  const pkg = readJson('package.json');
  for (let i = 0; i <= 8; i += 1) assert.equal(pkg.scripts[`check:pca-w${i}`], `node scripts/check-pca-w0-w8-client-demand-loop.mjs PCA-W${i}`);
  assert.equal(pkg.scripts['check:pca'], 'node scripts/check-pca-w0-w8-client-demand-loop.mjs ALL');
  assert.ok(String(pkg.scripts.check).includes('npm run check:kap && npm run check:pca && npm run check:mcd'));
  console.log('✓ PCA-W0–W8 acceptance + freeze passed; production demand registries remain empty and PHASE 17 client-surface wiring remains separate.');
}
