import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => fs.existsSync(p);
const articleContentSha = article => crypto.createHash('sha256').update(JSON.stringify({ article: article.article, blocks: article.blocks })).digest('hex');

const BASE = 'db794e5a22d8d0ecc36ebaab6420b3bca804a7ce';
const ORIGINAL_BASE = '8aff94b68d68715f44b4c4c05f481131624a4f5e';
const PLAN_PATH = 'content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const MANIFEST_PATH = 'content/knowledge/production-planning/production/book3-b03/manifest-v1.json';
const REVIEW_PATH = 'content/knowledge/production-planning/review/book3-b03-zh-hans-editorial-review-v1.json';
const MACHINE_ACCEPTANCE_PATH = 'content/knowledge/production-planning/acceptance/book3-b03-machine-acceptance-v1.json';
const HUMAN_DECISION_PATH = 'content/knowledge/production-planning/acceptance/book3-b03-human-decisions-v1.json';
const PARITY_PATH = 'content/knowledge/production-planning/acceptance/book3-b03-english-semantic-parity-v1.json';
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
const b03Plan = plan.articles.filter(x => x.batchCode === 'B3-B03');
const b03Batch = plan.batches.find(x => x.batchCode === 'B3-B03');

assert.equal(plan.status, 'FINAL_PRODUCTION_MAP_FROZEN_FOR_BATCH_EXECUTION');
assert.equal(b03Plan.length, 4);
assert.equal(b03Batch.articleCount, 4);
assert.equal(b03Batch.nodeCoverageCount, 7);
assert.equal(b03Batch.status, 'planned', 'Frozen W5 plan must not be mutated by B03 execution');
assert.deepEqual(b03Plan.map(x => x.articlePlanId), ['B3-ART-014','B3-ART-015','B3-ART-016','B3-ART-017']);

// Historical B03 machine gate remains immutable; explicit 4/4 user acceptance is a successor.
assert.equal(machineAcceptance.baselineCommit, ORIGINAL_BASE);
assert.equal(machineAcceptance.status, 'MACHINE_ACCEPTED_ZH_HANS_EDITORIAL_CANDIDATES_HUMAN_PENDING');
assert.deepEqual(machineAcceptance.counts, {articleCandidates:4,finalCanonicalNodes:7,sourceSections:7,humanAcceptedArticles:0});
assert.equal(machineAcceptance.humanGate.status, 'PENDING_0_OF_4');

assert.equal(decisions.baselineCommit, BASE);
assert.equal(decisions.status, 'HUMAN_ACCEPTED_4_OF_4');
assert.equal(decisions.decisionAuthority, 'TL_EXPLICIT_4_OF_4_ARTICLE_ACCEPTANCE');
assert.deepEqual(decisions.counts, {reviewed:4,accepted:4,rejected:0,revisionRequested:0});
assert.equal(decisions.records.length, 4);
assert.ok(decisions.records.every(x => x.decision === 'ACCEPT'));
assert.equal(decisions.authorityBoundary.doesNotAutoAcceptEnglishEditorialQuality, true);
assert.equal(decisions.authorityBoundary.doesNotCreatePublicationAuthority, true);

assert.equal(review.status, 'HUMAN_EDITORIAL_ACCEPTED_4_OF_4');
assert.equal(review.acceptedCount, 4);
assert.equal(review.decisionAuthority, 'TL_EXPLICIT_4_OF_4_ARTICLE_ACCEPTANCE');
assert.equal(review.humanDecisionPath, HUMAN_DECISION_PATH);
assert.ok(review.records.every(x => x.decision === 'ACCEPT'));

assert.equal(manifest.status, 'ZH_HANS_HUMAN_ACCEPTED_ENGLISH_SEMANTIC_PARITY_MACHINE_ACCEPTED_PUBLICATION_CLOSED');
assert.equal(manifest.baselineCommit, ORIGINAL_BASE);
assert.equal(manifest.successorBaselineCommit, BASE);
assert.deepEqual(manifest.counts, {articleCandidates:4,canonicalNodeCoverage:7,sourceSectionBindings:7,localesProduced:2,englishCandidates:4,humanAcceptedArticles:4,publishedArticles:0});
assert.equal(manifest.gates.zhHansHumanEditorial, 'HUMAN_ACCEPTED_4_OF_4');
assert.equal(manifest.gates.englishProduction, 'COMPLETE_4_OF_4_AFTER_ZH_ACCEPTANCE');
assert.equal(manifest.gates.englishSemanticParity, 'MACHINE_ACCEPTED_4_OF_4');
assert.equal(manifest.gates.publication, 'CLOSED');
assert.equal(manifest.gates.customerProjection, 'CLOSED');
assert.equal(manifest.humanDecisionPath, HUMAN_DECISION_PATH);
assert.equal(manifest.englishSemanticParityPath, PARITY_PATH);

assert.equal(parity.baselineCommit, BASE);
assert.equal(parity.status, 'MACHINE_SEMANTIC_PARITY_ACCEPTED_4_OF_4');
assert.deepEqual(parity.counts, {sourceArticles:4,englishArticles:4,machineParityAccepted:4,failed:0});
assert.equal(parity.records.length, 4);
assert.ok(parity.records.every(x => x.status === 'MACHINE_SEMANTIC_PARITY_ACCEPTED'));
assert.equal(parity.authorityBoundary.englishSemanticParityMachineGateIsNotPublicationApproval, true);
assert.equal(parity.authorityBoundary.englishHumanEditorialQualityNotInferredFromZhHansAcceptance, true);

const planById = new Map(b03Plan.map(x => [x.articlePlanId, x]));
const reviewById = new Map(review.records.map(x => [x.articlePlanId, x]));
const decisionById = new Map(decisions.records.map(x => [x.articlePlanId, x]));
const parityById = new Map(parity.records.map(x => [x.articlePlanId, x]));
const coveredNodes = new Set();
const coveredSections = new Set();
const englishAnchors = new Map([
  ['B3-ART-014', ['friction','repetition','compensation','structure']],
  ['B3-ART-015', ['chronic noise','signal','escalation','graded response']],
  ['B3-ART-016', ['threshold','buffer','level of intervention','stable range']],
  ['B3-ART-017', ['misreading','authority','pre-collapse window','reversibility']]
]);

for (const record of manifest.records) {
  const p = planById.get(record.articlePlanId);
  assert.ok(p, `unexpected Article plan ${record.articlePlanId}`);
  assert.ok(exists(record.path), record.path);
  assert.equal(record.sha256, sha(record.path), `reviewed zh candidate digest drift ${record.candidateId}`);
  const zh = read(record.path);
  assert.equal(zh.stage, 'BOOK3-B03-ZH-HANS-PRODUCTION');
  assert.equal(zh.locale, 'zh-Hans');
  assert.equal(zh.status, 'SOURCE_BOUND_EDITORIAL_CANDIDATE_FINAL_CANONICAL_RECONCILED');
  assert.equal(zh.article.title, p.workingTitleZhHans);
  assert.deepEqual(zh.sourceBindings.map(x => x.sourceSectionCode), p.sourceSectionCodes);
  assert.deepEqual(zh.canonicalNodeBinding.nodeCodes, p.nodeCodes);

  const rr = reviewById.get(p.articlePlanId);
  const dd = decisionById.get(p.articlePlanId);
  const pr = parityById.get(p.articlePlanId);
  assert.ok(rr && dd && pr, `B03 successor authority missing ${p.articlePlanId}`);
  assert.equal(rr.candidateSha256, record.sha256);
  assert.equal(dd.reviewedCandidateSha256, record.sha256);
  assert.equal(dd.reviewedArticleContentSha256, articleContentSha(zh));
  assert.equal(dd.decision, 'ACCEPT');
  assert.equal(record.humanEditorialDecision, 'ACCEPT');
  assert.equal(record.humanDecisionPath, HUMAN_DECISION_PATH);

  assert.ok(exists(record.englishCandidatePath), record.englishCandidatePath);
  assert.equal(record.englishCandidateSha256, sha(record.englishCandidatePath));
  assert.equal(record.englishCandidateSha256, pr.enSha256);
  assert.equal(pr.zhHansSha256, record.sha256);
  const en = read(record.englishCandidatePath);
  assert.equal(en.locale, 'en');
  assert.equal(en.stage, 'BOOK3-B03-ENGLISH-SEMANTIC-PARITY');
  assert.equal(en.status, 'ENGLISH_SEMANTIC_PARITY_MACHINE_ACCEPTED_FINAL_CANONICAL_RECONCILED');
  assert.deepEqual(en.sourceBindings, zh.sourceBindings, `${p.articlePlanId} English source binding drift`);
  assert.deepEqual(en.canonicalNodeBinding, zh.canonicalNodeBinding, `${p.articlePlanId} English canonical binding drift`);
  assert.deepEqual(en.blocks.map(x => x.type), zh.blocks.map(x => x.type), `${p.articlePlanId} block-function parity drift`);
  assert.equal(en.blocks.filter(x => x.type === 'paragraph').length, 7);
  const enText = en.blocks.map(x => x.text || '').join('\n').toLowerCase();
  for (const token of englishAnchors.get(p.articlePlanId)) assert.ok(enText.includes(token), `${p.articlePlanId} English parity anchor missing ${token}`);
  assert.ok(enText.split(/\s+/).length >= 450, `${p.articlePlanId} English article unexpectedly thin`);
  assert.ok(!/diagnosed as|medical diagnosis|treatment recommendation|clinical conclusion/.test(enText), `${p.articlePlanId} English must not create medical authority`);
  assert.equal(en.review.semanticParityStatus, 'MACHINE_SEMANTIC_PARITY_ACCEPTED');
  assert.equal(en.review.customerPublishable, false);
  assert.equal(en.authorityBoundary.zhHansAcceptanceDoesNotAutoAcceptEnglishEditorialQuality, true);
  assert.equal(en.authorityBoundary.semanticParityDoesNotCreatePublicationAuthority, true);

  for (let i = 0; i < p.nodeCodes.length; i++) {
    const code = p.nodeCodes[i]; const sectionCode = p.sourceSectionCodes[i];
    assert.ok(!coveredNodes.has(code), `duplicate B03 node coverage ${code}`);
    assert.ok(!coveredSections.has(sectionCode), `duplicate B03 section coverage ${sectionCode}`);
    coveredNodes.add(code); coveredSections.add(sectionCode);
    const n = nodes.get(code); const s = sections.get(sectionCode); const b = zh.sourceBindings[i];
    assert.ok(n, code); assert.ok(s, sectionCode);
    assert.equal(n.canonicalSourceBinding.sectionCode, sectionCode);
    assert.equal(b.sourceTextSha256, s.textSha256);
    assert.deepEqual(b.sourcePages, [s.startPage, s.endPage]);
  }
}

assert.equal(coveredNodes.size, 7);
assert.equal(coveredSections.size, 7);
assert.equal(manifest.invariants.frozenW5GroupingPreserved, true);
assert.equal(manifest.invariants.noCanonicalMutation, true);
assert.equal(manifest.invariants.englishProductionTriggeredOnlyAfterHumanAcceptance, true);
assert.equal(manifest.invariants.englishSemanticParityDoesNotCreatePublicationAuthority, true);
assert.equal(manifest.invariants.noPublicationAuthorityCreated, true);

console.log('✓ BOOK-3 B03 human editorial successor passed: explicit TL decision records 4/4 accepted without mutating reviewed zh-Hans candidate bytes.');
console.log('✓ BOOK-3 B03 English semantic parity passed: 4/4 English candidates preserve source sections, 7/7 Final Canonical Nodes, block functions and authority boundaries.');
console.log('✓ B03 publication/customer projection remain closed; English editorial quality is not auto-inferred.');

await import('./check-book3-b04-zh-hans-production.mjs');
