import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => fs.existsSync(p);

const BASE = '45a3e8497196c18b4c43fc04c3137cc8fce867d6';
const PLAN_PATH = 'content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const MANIFEST_PATH = 'content/knowledge/production-planning/production/book3-b02/manifest-v1.json';
const REVIEW_PATH = 'content/knowledge/production-planning/review/book3-b02-zh-hans-editorial-review-v1.json';
const MACHINE_ACCEPTANCE_PATH = 'content/knowledge/production-planning/acceptance/book3-b02-machine-acceptance-v1.json';
const REG_PATH = 'content/knowledge/registry/successors/kau-r6e-book3-final/canonical-nodes-v1.json';
const INV_PATH = 'content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json';

const plan = read(PLAN_PATH);
const manifest = read(MANIFEST_PATH);
const review = read(REVIEW_PATH);
const machineAcceptance = read(MACHINE_ACCEPTANCE_PATH);
const registry = read(REG_PATH);
const inventory = read(INV_PATH);
const sections = new Map(inventory.sections.filter(x => x.segmentType === 'SECTION').map(x => [x.sectionCode, x]));
const nodes = new Map(registry.nodes.map(x => [x.nodeCode, x]));
const b02Plan = plan.articles.filter(x => x.batchCode === 'B3-B02');
const b02Batch = plan.batches.find(x => x.batchCode === 'B3-B02');

assert.equal(manifest.baselineCommit, BASE);
assert.equal(review.baselineCommit, BASE);
assert.equal(plan.status, 'FINAL_PRODUCTION_MAP_FROZEN_FOR_BATCH_EXECUTION');
assert.equal(b02Plan.length, 5);
assert.equal(b02Batch.articleCount, 5);
assert.equal(b02Batch.nodeCoverageCount, 10);
assert.equal(b02Batch.status, 'planned', 'Frozen W5 plan must not be mutated by B02 execution');
assert.deepEqual(b02Plan.map(x => x.articlePlanId), ['B3-ART-009','B3-ART-010','B3-ART-011','B3-ART-012','B3-ART-013']);

assert.equal(manifest.status, 'ZH_HANS_SOURCE_BOUND_EDITORIAL_CANDIDATES_READY_HUMAN_REVIEW_PENDING');
assert.equal(manifest.batchCode, 'B3-B02');
assert.deepEqual(manifest.counts, {
  articleCandidates: 5,
  canonicalNodeCoverage: 10,
  sourceSectionBindings: 10,
  localesProduced: 1,
  englishCandidates: 0,
  humanAcceptedArticles: 0,
  publishedArticles: 0
});
assert.equal(manifest.records.length, 5);
assert.equal(review.status, 'PENDING_HUMAN_EDITORIAL_REVIEW');
assert.equal(review.candidateCount, 5);
assert.equal(review.requiredAcceptCount, 5);
assert.equal(review.records.length, 5);
assert.ok(review.records.every(x => x.decision === 'PENDING'));
assert.equal(review.authorityBoundary.machineValidationCannotSelfAcceptHumanGate, true);

const planById = new Map(b02Plan.map(x => [x.articlePlanId, x]));
const reviewById = new Map(review.records.map(x => [x.articlePlanId, x]));
const coveredNodes = new Set();
const coveredSections = new Set();
const anchors = new Map([
  ['B3-ART-009', ['载体', '承载', '迁移']],
  ['B3-ART-010', ['残余', '累积', '退出']],
  ['B3-ART-011', ['持续', '漂移', '方向']],
  ['B3-ART-012', ['扭曲', '慢性', '退出']],
  ['B3-ART-013', ['碎裂', '饱和', '余量']]
]);

for (const record of manifest.records) {
  const p = planById.get(record.articlePlanId);
  assert.ok(p, `unexpected Article plan ${record.articlePlanId}`);
  assert.ok(exists(record.path), record.path);
  assert.equal(record.sha256, sha(record.path), `candidate digest drift ${record.candidateId}`);
  const a = read(record.path);
  assert.equal(a.stage, 'BOOK3-B02-ZH-HANS-PRODUCTION');
  assert.equal(a.batchCode, 'B3-B02');
  assert.equal(a.articlePlanId, p.articlePlanId);
  assert.equal(a.candidateId, record.candidateId);
  assert.match(a.candidateId, /^B3-B02-A(09|10|11|12|13)$/);
  assert.equal(a.locale, 'zh-Hans');
  assert.equal(a.status, 'SOURCE_BOUND_EDITORIAL_CANDIDATE_FINAL_CANONICAL_RECONCILED');
  assert.equal(a.productionRole, 'ARTICLE');
  assert.equal(a.dispatchTarget, 'PJA');
  assert.equal(a.publicationBookCode, 'BOOK-3');
  assert.equal(a.article.title, p.workingTitleZhHans, `W5 title drift ${p.articlePlanId}`);
  assert.ok(a.article.summary.length >= 35 && a.article.summary.length <= 140);
  assert.equal(a.blocks[0].type, 'summary');
  assert.equal(a.blocks[0].text, a.article.summary);
  assert.equal(a.blocks.filter(x => x.type === 'paragraph').length, 7);
  assert.equal(a.blocks.filter(x => x.type === 'key_judgment').length, 1);
  assert.equal(a.blocks.filter(x => x.type === 'reality_question').length, 1);
  assert.ok(a.blocks.every(x => ['summary','paragraph','key_judgment','reality_question'].includes(x.type)));
  const articleText = a.blocks.map(x => x.text || '').join('\n');
  for (const token of anchors.get(p.articlePlanId)) assert.ok(articleText.includes(token), `${p.articlePlanId} missing source-mechanism anchor ${token}`);
  assert.ok(!/诊断为|确诊|治疗建议|医学结论/.test(articleText), `${p.articlePlanId} must not create medical authority`);

  assert.equal(a.sourceAuthority.sourceSha256, inventory.sourceSha256);
  assert.equal(a.sourceAuthority.corpusSha256, inventory.corpusSha256);
  assert.equal(a.sourceAuthority.finalCanonicalRegistryPath, REG_PATH);
  assert.equal(a.sourceAuthority.frozenArticleProductionMapPath, PLAN_PATH);
  assert.equal(a.sourceBindings.length, 2);
  assert.deepEqual(a.sourceBindings.map(x => x.sourceSectionCode), p.sourceSectionCodes);
  assert.deepEqual(a.canonicalNodeBinding.nodeCodes, p.nodeCodes);
  assert.equal(a.canonicalNodeBinding.primaryNodeCode, p.primaryNodeCode);
  assert.equal(a.canonicalNodeBinding.nodeCode, null);
  assert.equal(a.canonicalNodeBinding.crossNodeAssemblyAllowed, true);
  assert.equal(a.canonicalNodeBinding.mutationPerformed, false);

  for (let i = 0; i < p.nodeCodes.length; i++) {
    const code = p.nodeCodes[i];
    const sectionCode = p.sourceSectionCodes[i];
    assert.ok(!coveredNodes.has(code), `duplicate B02 node coverage ${code}`);
    assert.ok(!coveredSections.has(sectionCode), `duplicate B02 section coverage ${sectionCode}`);
    coveredNodes.add(code); coveredSections.add(sectionCode);
    const n = nodes.get(code); const s = sections.get(sectionCode); const b = a.sourceBindings[i];
    assert.ok(n, code); assert.ok(s, sectionCode);
    assert.equal(n.canonicalSourceBinding.sectionCode, sectionCode);
    assert.equal(b.sourceTextSha256, s.textSha256);
    assert.deepEqual(b.sourcePages, [s.startPage, s.endPage]);
    assert.equal(b.sourceHeading, s.heading);
    assert.equal(b.partCode, 'P8');
  }

  assert.equal(a.review.humanEditorialApproved, false);
  assert.equal(a.review.humanReviewStatus, 'PENDING_HUMAN_EDITORIAL_REVIEW');
  assert.equal(a.review.humanReviewPackagePath, REVIEW_PATH);
  assert.equal(a.review.customerPublishable, false);
  assert.equal(a.review.publicationStatus, 'not_published');
  assert.equal(a.review.semanticParityStatus, 'NOT_APPLICABLE_CANONICAL_LOCALE');
  assert.equal(a.authorityBoundary.mayCreateBookClaimBeyondSource, false);
  assert.equal(a.authorityBoundary.mayCreateCanonicalNode, false);
  assert.equal(a.authorityBoundary.mayMutateCanonicalRegistry, false);
  assert.equal(a.authorityBoundary.mayMarkPublished, false);
  assert.equal(a.authorityBoundary.mayTriggerEnglishProductionBeforeZhAcceptance, false);

  const rr = reviewById.get(p.articlePlanId);
  assert.ok(rr, `review record missing ${p.articlePlanId}`);
  assert.equal(rr.candidateId, a.candidateId);
  assert.equal(rr.candidatePath, record.path);
  assert.equal(rr.candidateSha256, record.sha256);
  assert.deepEqual(rr.sourceSectionCodes, p.sourceSectionCodes);
  assert.deepEqual(rr.canonicalNodeCodes, p.nodeCodes);
}

assert.equal(coveredNodes.size, 10);
assert.equal(coveredSections.size, 10);
assert.deepEqual([...coveredNodes].sort(), b02Plan.flatMap(x => x.nodeCodes).sort());
assert.deepEqual([...coveredSections].sort(), b02Plan.flatMap(x => x.sourceSectionCodes).sort());

const englishDir = 'content/knowledge/production-planning/production/book3-b02/candidates/en';
assert.ok(!exists(englishDir) || fs.readdirSync(englishDir).filter(x => x.endsWith('.json')).length === 0, 'B02 English production must remain closed before zh-Hans human acceptance');
assert.equal(manifest.gates.sourceBinding, 'MACHINE_ACCEPTED');
assert.equal(manifest.machineAcceptancePath, MACHINE_ACCEPTANCE_PATH);
assert.equal(machineAcceptance.status, 'MACHINE_ACCEPTED_ZH_HANS_EDITORIAL_CANDIDATES_HUMAN_PENDING');
assert.equal(machineAcceptance.baselineCommit, BASE);
assert.deepEqual(machineAcceptance.counts, {articleCandidates:5,finalCanonicalNodes:10,sourceSections:10,humanAcceptedArticles:0});
assert.equal(machineAcceptance.candidateDigests.length, 5);
for (const d of machineAcceptance.candidateDigests) { const r=manifest.records.find(x=>x.candidateId===d.candidateId); assert.ok(r,d.candidateId); assert.equal(d.path,r.path); assert.equal(d.sha256,r.sha256); }
assert.equal(machineAcceptance.humanGate.status, 'PENDING_0_OF_5');
assert.equal(machineAcceptance.humanGate.machineAcceptanceCannotSelfAcceptHumanGate, true);
assert.equal(manifest.gates.zhHansHumanEditorial, 'PENDING');
assert.equal(manifest.gates.englishProduction, 'CLOSED_UNTIL_EACH_ZH_HANS_ARTICLE_ACCEPTED');
assert.equal(manifest.gates.publication, 'CLOSED');
assert.equal(manifest.gates.customerProjection, 'CLOSED');
assert.equal(manifest.invariants.frozenW5GroupingPreserved, true);
assert.equal(manifest.invariants.noCanonicalMutation, true);
assert.equal(manifest.invariants.noEnglishAutoProduction, true);
assert.equal(manifest.invariants.noPublicationAuthorityCreated, true);

console.log('✓ BOOK-3 B02 zh-Hans production passed: 5/5 source-bound Article candidates cover exactly 10/10 frozen W5 Final Canonical Nodes.');
console.log('✓ All B02 source section digests/pages and Final Canonical bindings are exact; W5 grouping is unchanged.');
console.log('✓ Human editorial acceptance remains 0/5 pending; English production, publication and customer projection remain fail-closed.');
