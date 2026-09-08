import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => fs.existsSync(p);

const BASE = 'db794e5a22d8d0ecc36ebaab6420b3bca804a7ce';
const PLAN_PATH = 'content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const MANIFEST_PATH = 'content/knowledge/production-planning/production/book3-b04/manifest-v1.json';
const REVIEW_PATH = 'content/knowledge/production-planning/review/book3-b04-zh-hans-editorial-review-v1.json';
const MACHINE_ACCEPTANCE_PATH = 'content/knowledge/production-planning/acceptance/book3-b04-machine-acceptance-v1.json';
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
const b04Plan = plan.articles.filter(x => x.batchCode === 'B3-B04');
const b04Batch = plan.batches.find(x => x.batchCode === 'B3-B04');

assert.equal(plan.status, 'FINAL_PRODUCTION_MAP_FROZEN_FOR_BATCH_EXECUTION');
assert.equal(b04Plan.length, 5);
assert.equal(b04Batch.articleCount, 5);
assert.equal(b04Batch.nodeCoverageCount, 10);
assert.equal(b04Batch.status, 'planned');
assert.deepEqual(b04Plan.map(x => x.articlePlanId), ['B3-ART-018','B3-ART-019','B3-ART-020','B3-ART-021','B3-ART-022']);

assert.equal(manifest.baselineCommit, BASE);
assert.equal(manifest.status, 'ZH_HANS_SOURCE_BOUND_EDITORIAL_CANDIDATES_READY_HUMAN_REVIEW_PENDING');
assert.deepEqual(manifest.counts, {articleCandidates:5,canonicalNodeCoverage:10,sourceSectionBindings:10,localesProduced:1,englishCandidates:0,humanAcceptedArticles:0,publishedArticles:0});
assert.equal(review.status, 'PENDING_HUMAN_EDITORIAL_REVIEW');
assert.equal(review.candidateCount, 5);
assert.equal(review.requiredAcceptCount, 5);
assert.ok(review.records.every(x => x.decision === 'PENDING'));
assert.equal(machineAcceptance.baselineCommit, BASE);
assert.equal(machineAcceptance.status, 'MACHINE_ACCEPTED_ZH_HANS_EDITORIAL_CANDIDATES_HUMAN_PENDING');
assert.deepEqual(machineAcceptance.counts, {articleCandidates:5,finalCanonicalNodes:10,sourceSections:10,humanAcceptedArticles:0});
assert.equal(machineAcceptance.humanGate.status, 'PENDING_0_OF_5');

const planById = new Map(b04Plan.map(x => [x.articlePlanId, x]));
const reviewById = new Map(review.records.map(x => [x.articlePlanId, x]));
const coveredNodes = new Set(); const coveredSections = new Set();
const anchors = new Map([
  ['B3-ART-018', ['接口占用','接口饱和','待命','关闭']],
  ['B3-ART-019', ['成本转移','责任负荷','权限','退出']],
  ['B3-ART-020', ['载体限制','软性中断','峰值','专业']],
  ['B3-ART-021', ['慢性运行状态','接口架构','认知','源头']],
  ['B3-ART-022', ['跨尺度','医疗','专业','不能替代']]
]);

for (const record of manifest.records) {
  const p = planById.get(record.articlePlanId); assert.ok(p, record.articlePlanId);
  assert.ok(exists(record.path), record.path); assert.equal(record.sha256, sha(record.path));
  const a = read(record.path);
  assert.equal(a.stage, 'BOOK3-B04-ZH-HANS-PRODUCTION');
  assert.equal(a.batchCode, 'B3-B04');
  assert.equal(a.articlePlanId, p.articlePlanId);
  assert.match(a.candidateId, /^B3-B04-A(18|19|20|21|22)$/);
  assert.equal(a.locale, 'zh-Hans');
  assert.equal(a.status, 'SOURCE_BOUND_EDITORIAL_CANDIDATE_FINAL_CANONICAL_RECONCILED');
  assert.equal(a.article.title, p.workingTitleZhHans);
  assert.ok(a.article.summary.length >= 35 && a.article.summary.length <= 160);
  assert.deepEqual(a.blocks.map(x => x.type), ['summary','paragraph','paragraph','paragraph','paragraph','paragraph','paragraph','paragraph','key_judgment','reality_question']);
  const articleText = a.blocks.map(x => x.text || '').join('\n');
  assert.ok(articleText.length >= 900, `${p.articlePlanId} article unexpectedly thin`);
  for (const token of anchors.get(p.articlePlanId)) assert.ok(articleText.includes(token), `${p.articlePlanId} missing source mechanism anchor ${token}`);
  assert.ok(!/诊断为|确诊|治疗建议|医学结论/.test(articleText), `${p.articlePlanId} must not create medical authority`);
  if (['B3-ART-020','B3-ART-021','B3-ART-022'].includes(p.articlePlanId)) {
    assert.ok(/专业|医疗|心理健康/.test(articleText), `${p.articlePlanId} medical boundary missing`);
    assert.ok(/不能|不可|无法/.test(articleText), `${p.articlePlanId} boundary language missing`);
  }
  assert.equal(a.sourceAuthority.sourceSha256, inventory.sourceSha256);
  assert.equal(a.sourceAuthority.corpusSha256, inventory.corpusSha256);
  assert.deepEqual(a.sourceBindings.map(x => x.sourceSectionCode), p.sourceSectionCodes);
  assert.deepEqual(a.canonicalNodeBinding.nodeCodes, p.nodeCodes);
  assert.equal(a.canonicalNodeBinding.primaryNodeCode, p.primaryNodeCode);
  assert.equal(a.canonicalNodeBinding.mutationPerformed, false);
  for (let i=0;i<p.nodeCodes.length;i++) {
    const code=p.nodeCodes[i], sc=p.sourceSectionCodes[i], s=sections.get(sc), n=nodes.get(code), b=a.sourceBindings[i];
    assert.ok(n && s); assert.ok(!coveredNodes.has(code)); assert.ok(!coveredSections.has(sc)); coveredNodes.add(code); coveredSections.add(sc);
    assert.equal(n.canonicalSourceBinding.sectionCode, sc);
    assert.equal(b.sourceTextSha256, s.textSha256); assert.deepEqual(b.sourcePages,[s.startPage,s.endPage]); assert.equal(b.sourceHeading,s.heading);
  }
  assert.equal(a.review.humanEditorialApproved, false);
  assert.equal(a.review.humanReviewStatus, 'PENDING_HUMAN_EDITORIAL_REVIEW');
  assert.equal(a.review.customerPublishable, false);
  assert.equal(a.authorityBoundary.mayCreateCanonicalNode, false); assert.equal(a.authorityBoundary.mayMarkPublished, false);
  const rr=reviewById.get(p.articlePlanId); assert.ok(rr); assert.equal(rr.candidateSha256,record.sha256); assert.equal(rr.decision,'PENDING');
}

assert.equal(coveredNodes.size,10); assert.equal(coveredSections.size,10);
const englishDir='content/knowledge/production-planning/production/book3-b04/candidates/en';
assert.ok(!exists(englishDir) || fs.readdirSync(englishDir).filter(x=>x.endsWith('.json')).length===0,'B04 English production must remain closed before human acceptance');
assert.equal(manifest.gates.zhHansHumanEditorial,'PENDING'); assert.equal(manifest.gates.englishProduction,'CLOSED_UNTIL_EACH_ZH_HANS_ARTICLE_ACCEPTED');
assert.equal(manifest.gates.publication,'CLOSED'); assert.equal(manifest.gates.customerProjection,'CLOSED');
assert.equal(manifest.invariants.frozenW5GroupingPreserved,true); assert.equal(manifest.invariants.noCanonicalMutation,true); assert.equal(manifest.invariants.noPublicationAuthorityCreated,true);

console.log('✓ BOOK-3 B04 zh-Hans production passed: 5/5 Articles cover exactly 10/10 frozen W5 Final Canonical Nodes P8-123..132.');
console.log('✓ B04 manuscript section digests/pages, grouped-node bindings, medical boundary and article-depth gates passed.');
console.log('✓ B04 human editorial remains 0/5 pending; English, publication and customer projection remain fail-closed.');
