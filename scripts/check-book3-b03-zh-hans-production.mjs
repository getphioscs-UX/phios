import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => fs.existsSync(p);

const BASE = '8aff94b68d68715f44b4c4c05f481131624a4f5e';
const PLAN_PATH = 'content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const MANIFEST_PATH = 'content/knowledge/production-planning/production/book3-b03/manifest-v1.json';
const REVIEW_PATH = 'content/knowledge/production-planning/review/book3-b03-zh-hans-editorial-review-v1.json';
const MACHINE_ACCEPTANCE_PATH = 'content/knowledge/production-planning/acceptance/book3-b03-machine-acceptance-v1.json';
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
const b03Plan = plan.articles.filter(x => x.batchCode === 'B3-B03');
const b03Batch = plan.batches.find(x => x.batchCode === 'B3-B03');

assert.equal(plan.status, 'FINAL_PRODUCTION_MAP_FROZEN_FOR_BATCH_EXECUTION');
assert.equal(b03Plan.length, 4);
assert.equal(b03Batch.articleCount, 4);
assert.equal(b03Batch.nodeCoverageCount, 7);
assert.equal(b03Batch.status, 'planned', 'Frozen W5 plan must not be mutated by B03 execution');
assert.deepEqual(b03Plan.map(x => x.articlePlanId), ['B3-ART-014','B3-ART-015','B3-ART-016','B3-ART-017']);

assert.equal(manifest.baselineCommit, BASE);
assert.equal(manifest.status, 'ZH_HANS_SOURCE_BOUND_EDITORIAL_CANDIDATES_READY_HUMAN_REVIEW_PENDING');
assert.equal(manifest.batchCode, 'B3-B03');
assert.deepEqual(manifest.counts, {
  articleCandidates: 4,
  canonicalNodeCoverage: 7,
  sourceSectionBindings: 7,
  localesProduced: 1,
  englishCandidates: 0,
  humanAcceptedArticles: 0,
  publishedArticles: 0
});
assert.equal(manifest.records.length, 4);
assert.equal(review.status, 'PENDING_HUMAN_EDITORIAL_REVIEW');
assert.equal(review.candidateCount, 4);
assert.equal(review.requiredAcceptCount, 4);
assert.ok(review.records.every(x => x.decision === 'PENDING'));
assert.equal(review.authorityBoundary.machineValidationCannotSelfAcceptHumanGate, true);

const planById = new Map(b03Plan.map(x => [x.articlePlanId, x]));
const reviewById = new Map(review.records.map(x => [x.articlePlanId, x]));
const coveredNodes = new Set();
const coveredSections = new Set();
const anchors = new Map([
  ['B3-ART-014', ['摩擦', '重复', '补偿', '结构']],
  ['B3-ART-015', ['慢性噪声', '讯号', '升级', '分级响应']],
  ['B3-ART-016', ['阈值', '缓冲', '处理层级', '新的稳定']],
  ['B3-ART-017', ['失读', '权限', '崩溃前窗口', '可逆性']]
]);

for (const record of manifest.records) {
  const p = planById.get(record.articlePlanId);
  assert.ok(p, `unexpected Article plan ${record.articlePlanId}`);
  assert.ok(exists(record.path), record.path);
  assert.equal(record.sha256, sha(record.path), `candidate digest drift ${record.candidateId}`);
  const a = read(record.path);
  assert.equal(a.stage, 'BOOK3-B03-ZH-HANS-PRODUCTION');
  assert.equal(a.batchCode, 'B3-B03');
  assert.equal(a.articlePlanId, p.articlePlanId);
  assert.equal(a.candidateId, record.candidateId);
  assert.match(a.candidateId, /^B3-B03-A(14|15|16|17)$/);
  assert.equal(a.locale, 'zh-Hans');
  assert.equal(a.status, 'SOURCE_BOUND_EDITORIAL_CANDIDATE_FINAL_CANONICAL_RECONCILED');
  assert.equal(a.productionRole, 'ARTICLE');
  assert.equal(a.dispatchTarget, 'PJA');
  assert.equal(a.publicationBookCode, 'BOOK-3');
  assert.equal(a.article.title, p.workingTitleZhHans, `W5 title drift ${p.articlePlanId}`);
  assert.ok(a.article.summary.length >= 35 && a.article.summary.length <= 150);
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
  assert.deepEqual(a.sourceBindings.map(x => x.sourceSectionCode), p.sourceSectionCodes);
  assert.deepEqual(a.canonicalNodeBinding.nodeCodes, p.nodeCodes);
  assert.equal(a.canonicalNodeBinding.primaryNodeCode, p.primaryNodeCode);
  assert.equal(a.canonicalNodeBinding.nodeCode, p.nodeCodes.length === 1 ? p.nodeCodes[0] : null);
  assert.equal(a.canonicalNodeBinding.crossNodeAssemblyAllowed, p.nodeCodes.length > 1);
  assert.equal(a.canonicalNodeBinding.mutationPerformed, false);

  for (let i = 0; i < p.nodeCodes.length; i++) {
    const code = p.nodeCodes[i];
    const sectionCode = p.sourceSectionCodes[i];
    assert.ok(!coveredNodes.has(code), `duplicate B03 node coverage ${code}`);
    assert.ok(!coveredSections.has(sectionCode), `duplicate B03 section coverage ${sectionCode}`);
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

assert.equal(coveredNodes.size, 7);
assert.equal(coveredSections.size, 7);
assert.deepEqual([...coveredNodes].sort(), b03Plan.flatMap(x => x.nodeCodes).sort());
assert.deepEqual([...coveredSections].sort(), b03Plan.flatMap(x => x.sourceSectionCodes).sort());
const englishDir = 'content/knowledge/production-planning/production/book3-b03/candidates/en';
assert.ok(!exists(englishDir) || fs.readdirSync(englishDir).filter(x => x.endsWith('.json')).length === 0, 'B03 English production must remain closed before zh-Hans human acceptance');
assert.equal(manifest.gates.sourceBinding, 'MACHINE_ACCEPTED');
assert.equal(machineAcceptance.status, 'MACHINE_ACCEPTED_ZH_HANS_EDITORIAL_CANDIDATES_HUMAN_PENDING');
assert.equal(machineAcceptance.baselineCommit, BASE);
assert.deepEqual(machineAcceptance.counts, {articleCandidates:4,finalCanonicalNodes:7,sourceSections:7,humanAcceptedArticles:0});
assert.equal(machineAcceptance.candidateDigests.length, 4);
for (const d of machineAcceptance.candidateDigests) { const r=manifest.records.find(x=>x.candidateId===d.candidateId); assert.ok(r,d.candidateId); assert.equal(d.path,r.path); assert.equal(d.sha256,r.sha256); }
assert.equal(machineAcceptance.humanGate.status, 'PENDING_0_OF_4');
assert.equal(manifest.gates.zhHansHumanEditorial, 'PENDING');
assert.equal(manifest.gates.publication, 'CLOSED');
assert.equal(manifest.gates.customerProjection, 'CLOSED');
assert.equal(manifest.invariants.frozenW5GroupingPreserved, true);
assert.equal(manifest.invariants.noCanonicalMutation, true);
assert.equal(manifest.invariants.noPublicationAuthorityCreated, true);

console.log('✓ BOOK-3 B03 zh-Hans production passed: 4/4 source-bound Article candidates cover exactly 7/7 frozen W5 Final Canonical Nodes.');
console.log('✓ All B03 source section digests/pages and Final Canonical bindings are exact; W5 grouping remains frozen.');
console.log('✓ B03 human editorial acceptance remains 0/4 pending; English production and publication remain fail-closed.');
