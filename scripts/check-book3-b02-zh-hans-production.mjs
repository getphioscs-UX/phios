import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => fs.existsSync(p);

const BASE = '8aff94b68d68715f44b4c4c05f481131624a4f5e';
const ORIGINAL_BASE = '45a3e8497196c18b4c43fc04c3137cc8fce867d6';
const PLAN_PATH = 'content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const MANIFEST_PATH = 'content/knowledge/production-planning/production/book3-b02/manifest-v1.json';
const REVIEW_PATH = 'content/knowledge/production-planning/review/book3-b02-zh-hans-editorial-review-v1.json';
const MACHINE_ACCEPTANCE_PATH = 'content/knowledge/production-planning/acceptance/book3-b02-machine-acceptance-v1.json';
const HUMAN_DECISION_PATH = 'content/knowledge/production-planning/acceptance/book3-b02-human-decisions-v1.json';
const PARITY_PATH = 'content/knowledge/production-planning/acceptance/book3-b02-english-semantic-parity-v1.json';
const REG_PATH = 'content/knowledge/registry/successors/kau-r6e-book3-final/canonical-nodes-v1.json';
const INV_PATH = 'content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json';

const plan = read(PLAN_PATH);
const manifest = read(MANIFEST_PATH);
const review = read(REVIEW_PATH);
const machineAcceptance = read(MACHINE_ACCEPTANCE_PATH);
const decisions = read(HUMAN_DECISION_PATH);
const parity = read(PARITY_PATH);
const registry = read(REG_PATH);
const inventory = read(INV_PATH);
const sections = new Map(inventory.sections.filter(x => x.segmentType === 'SECTION').map(x => [x.sectionCode, x]));
const nodes = new Map(registry.nodes.map(x => [x.nodeCode, x]));
const b02Plan = plan.articles.filter(x => x.batchCode === 'B3-B02');
const b02Batch = plan.batches.find(x => x.batchCode === 'B3-B02');

assert.equal(plan.status, 'FINAL_PRODUCTION_MAP_FROZEN_FOR_BATCH_EXECUTION');
assert.equal(b02Plan.length, 5);
assert.equal(b02Batch.articleCount, 5);
assert.equal(b02Batch.nodeCoverageCount, 10);
assert.equal(b02Batch.status, 'planned', 'Frozen W5 plan must not be mutated by B02 execution');
assert.deepEqual(b02Plan.map(x => x.articlePlanId), ['B3-ART-009','B3-ART-010','B3-ART-011','B3-ART-012','B3-ART-013']);

// Historical machine acceptance remains immutable and proves the exact reviewed candidate digests.
assert.equal(machineAcceptance.baselineCommit, ORIGINAL_BASE);
assert.equal(machineAcceptance.status, 'MACHINE_ACCEPTED_ZH_HANS_EDITORIAL_CANDIDATES_HUMAN_PENDING');
assert.deepEqual(machineAcceptance.counts, {articleCandidates:5,finalCanonicalNodes:10,sourceSections:10,humanAcceptedArticles:0});
assert.equal(machineAcceptance.humanGate.status, 'PENDING_0_OF_5');

// Explicit user decision is the successor authority; it does not rewrite candidate content.
assert.equal(decisions.baselineCommit, BASE);
assert.equal(decisions.status, 'HUMAN_ACCEPTED_5_OF_5');
assert.equal(decisions.decisionAuthority, 'TL_EXPLICIT_5_OF_5_ARTICLE_ACCEPTANCE');
assert.deepEqual(decisions.counts, {reviewed:5,accepted:5,rejected:0,revisionRequested:0});
assert.equal(decisions.records.length, 5);
assert.ok(decisions.records.every(x => x.decision === 'ACCEPT'));
assert.equal(decisions.authorityBoundary.doesNotAutoAcceptEnglishEditorialQuality, true);
assert.equal(decisions.authorityBoundary.doesNotCreatePublicationAuthority, true);

assert.equal(review.status, 'HUMAN_EDITORIAL_ACCEPTED_5_OF_5');
assert.equal(review.acceptedCount, 5);
assert.equal(review.decisionAuthority, 'TL_EXPLICIT_5_OF_5_ARTICLE_ACCEPTANCE');
assert.equal(review.humanDecisionPath, HUMAN_DECISION_PATH);
assert.ok(review.records.every(x => x.decision === 'ACCEPT'));

assert.equal(manifest.status, 'ZH_HANS_HUMAN_ACCEPTED_ENGLISH_SEMANTIC_PARITY_MACHINE_ACCEPTED_PUBLICATION_CLOSED');
assert.equal(manifest.successorBaselineCommit, BASE);
assert.equal(manifest.counts.articleCandidates, 5);
assert.equal(manifest.counts.canonicalNodeCoverage, 10);
assert.equal(manifest.counts.sourceSectionBindings, 10);
assert.equal(manifest.counts.localesProduced, 2);
assert.equal(manifest.counts.englishCandidates, 5);
assert.equal(manifest.counts.humanAcceptedArticles, 5);
assert.equal(manifest.counts.publishedArticles, 0);
assert.equal(manifest.gates.zhHansHumanEditorial, 'HUMAN_ACCEPTED_5_OF_5');
assert.equal(manifest.gates.englishProduction, 'COMPLETE_5_OF_5_AFTER_ZH_ACCEPTANCE');
assert.equal(manifest.gates.englishSemanticParity, 'MACHINE_ACCEPTED_5_OF_5');
assert.equal(manifest.gates.publication, 'CLOSED');
assert.equal(manifest.gates.customerProjection, 'CLOSED');
assert.equal(manifest.humanDecisionPath, HUMAN_DECISION_PATH);
assert.equal(manifest.englishSemanticParityPath, PARITY_PATH);

assert.equal(parity.baselineCommit, BASE);
assert.equal(parity.status, 'MACHINE_SEMANTIC_PARITY_ACCEPTED_5_OF_5');
assert.deepEqual(parity.counts, {sourceArticles:5,englishArticles:5,machineParityAccepted:5,failed:0});
assert.equal(parity.records.length, 5);
assert.ok(parity.records.every(x => x.status === 'MACHINE_SEMANTIC_PARITY_ACCEPTED'));
assert.equal(parity.authorityBoundary.englishSemanticParityMachineGateIsNotPublicationApproval, true);
assert.equal(parity.authorityBoundary.englishHumanEditorialQualityNotInferredFromZhHansAcceptance, true);

const planById = new Map(b02Plan.map(x => [x.articlePlanId, x]));
const reviewById = new Map(review.records.map(x => [x.articlePlanId, x]));
const decisionById = new Map(decisions.records.map(x => [x.articlePlanId, x]));
const parityById = new Map(parity.records.map(x => [x.articlePlanId, x]));
const coveredNodes = new Set();
const coveredSections = new Set();
const englishAnchors = new Map([
  ['B3-ART-009', ['carrier','continuity','redundancy','medical']],
  ['B3-ART-010', ['residue','exit','accumulation','history']],
  ['B3-ART-011', ['continuity','drift','direction','current reality']],
  ['B3-ART-012', ['distortion','chronic','exit','medical']],
  ['B3-ART-013', ['fragmentation','saturation','margin','resynchronize']]
]);

for (const record of manifest.records) {
  const p = planById.get(record.articlePlanId);
  assert.ok(p, `unexpected Article plan ${record.articlePlanId}`);
  assert.ok(exists(record.path), record.path);
  // The reviewed zh-Hans candidate is intentionally immutable: digest must equal the original review/machine digest.
  assert.equal(record.sha256, sha(record.path), `reviewed zh candidate digest drift ${record.candidateId}`);
  const zh = read(record.path);
  assert.equal(zh.status, 'SOURCE_BOUND_EDITORIAL_CANDIDATE_FINAL_CANONICAL_RECONCILED');
  assert.equal(zh.locale, 'zh-Hans');
  assert.equal(zh.article.title, p.workingTitleZhHans);
  assert.deepEqual(zh.sourceBindings.map(x => x.sourceSectionCode), p.sourceSectionCodes);
  assert.deepEqual(zh.canonicalNodeBinding.nodeCodes, p.nodeCodes);

  const rr = reviewById.get(p.articlePlanId);
  const dd = decisionById.get(p.articlePlanId);
  const pr = parityById.get(p.articlePlanId);
  assert.ok(rr && dd && pr, `B02 successor authority missing ${p.articlePlanId}`);
  assert.equal(rr.candidateSha256, record.sha256);
  assert.equal(dd.reviewedCandidateSha256, record.sha256);
  assert.equal(dd.decision, 'ACCEPT');
  assert.equal(record.humanEditorialDecision, 'ACCEPT');
  assert.equal(record.humanDecisionPath, HUMAN_DECISION_PATH);

  assert.ok(exists(record.englishCandidatePath), record.englishCandidatePath);
  assert.equal(record.englishCandidateSha256, sha(record.englishCandidatePath));
  assert.equal(record.englishCandidateSha256, pr.enSha256);
  assert.equal(pr.zhHansSha256, record.sha256);
  const en = read(record.englishCandidatePath);
  assert.equal(en.locale, 'en');
  assert.equal(en.stage, 'BOOK3-B02-ENGLISH-SEMANTIC-PARITY');
  assert.equal(en.status, 'ENGLISH_SEMANTIC_PARITY_MACHINE_ACCEPTED_FINAL_CANONICAL_RECONCILED');
  assert.deepEqual(en.sourceBindings, zh.sourceBindings, `${p.articlePlanId} English source binding drift`);
  assert.deepEqual(en.canonicalNodeBinding, zh.canonicalNodeBinding, `${p.articlePlanId} English canonical binding drift`);
  assert.deepEqual(en.blocks.map(x => x.type), zh.blocks.map(x => x.type), `${p.articlePlanId} block-function parity drift`);
  assert.equal(en.blocks.filter(x => x.type === 'paragraph').length, 7);
  assert.equal(en.blocks.filter(x => x.type === 'key_judgment').length, 1);
  assert.equal(en.blocks.filter(x => x.type === 'reality_question').length, 1);
  const enText = en.blocks.map(x => x.text || '').join('\n').toLowerCase();
  for (const token of englishAnchors.get(p.articlePlanId)) assert.ok(enText.includes(token), `${p.articlePlanId} English parity anchor missing ${token}`);
  assert.ok(!/diagnosed as|medical diagnosis|treatment recommendation|clinical conclusion/.test(enText), `${p.articlePlanId} English must not create medical authority`);
  assert.equal(en.review.semanticParityStatus, 'MACHINE_SEMANTIC_PARITY_ACCEPTED');
  assert.equal(en.review.customerPublishable, false);
  assert.equal(en.review.publicationStatus, 'not_published');
  assert.equal(en.authorityBoundary.zhHansAcceptanceDoesNotAutoAcceptEnglishEditorialQuality, true);
  assert.equal(en.authorityBoundary.semanticParityDoesNotCreatePublicationAuthority, true);

  for (let i = 0; i < p.nodeCodes.length; i++) {
    const code = p.nodeCodes[i]; const sectionCode = p.sourceSectionCodes[i];
    assert.ok(!coveredNodes.has(code), `duplicate B02 node coverage ${code}`);
    assert.ok(!coveredSections.has(sectionCode), `duplicate B02 section coverage ${sectionCode}`);
    coveredNodes.add(code); coveredSections.add(sectionCode);
    const n = nodes.get(code); const s = sections.get(sectionCode); const b = zh.sourceBindings[i];
    assert.ok(n, code); assert.ok(s, sectionCode);
    assert.equal(n.canonicalSourceBinding.sectionCode, sectionCode);
    assert.equal(b.sourceTextSha256, s.textSha256);
    assert.deepEqual(b.sourcePages, [s.startPage, s.endPage]);
  }
}

assert.equal(coveredNodes.size, 10);
assert.equal(coveredSections.size, 10);
assert.equal(manifest.invariants.frozenW5GroupingPreserved, true);
assert.equal(manifest.invariants.noCanonicalMutation, true);
assert.equal(manifest.invariants.englishProductionTriggeredOnlyAfterHumanAcceptance, true);
assert.equal(manifest.invariants.englishSemanticParityDoesNotCreatePublicationAuthority, true);
assert.equal(manifest.invariants.noPublicationAuthorityCreated, true);

console.log('✓ BOOK-3 B02 human editorial successor passed: explicit TL decision records 5/5 accepted without mutating the reviewed zh-Hans candidate text.');
console.log('✓ BOOK-3 B02 English semantic parity passed: 5/5 English candidates preserve source sections, Final Canonical Nodes, block functions and authority boundaries.');
console.log('✓ B02 publication and customer projection remain closed; English editorial quality is not auto-inferred from zh-Hans acceptance.');

// Existing package alias check:book3-b02 covers B02 media disposition plus the parallel B03/B04 successor lines.
await import('./check-book3-b02-w10-figure-media-requirement.mjs');
await import('./check-book3-b03-zh-hans-production.mjs');
