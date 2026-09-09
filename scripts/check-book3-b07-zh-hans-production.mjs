import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const contentSha = a => crypto.createHash('sha256').update(JSON.stringify({ article: a.article, blocks: a.blocks })).digest('hex');

const ORIGINAL = '80bae71675ef8b196cd10402ea0ccbf9b833ee57';
const BASE = 'f8f32b49b3b9f2ef721dcbd34a4a4316b110117b';
const PLAN = 'content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const MAN = 'content/knowledge/production-planning/production/book3-b07/manifest-v1.json';
const REV = 'content/knowledge/production-planning/review/book3-b07-zh-hans-editorial-review-v1.json';
const MACH = 'content/knowledge/production-planning/acceptance/book3-b07-machine-acceptance-v1.json';
const HUMAN = 'content/knowledge/production-planning/acceptance/book3-b07-human-decisions-v1.json';
const PAR = 'content/knowledge/production-planning/acceptance/book3-b07-english-semantic-parity-v1.json';

const plan = read(PLAN), m = read(MAN), review = read(REV), machine = read(MACH), human = read(HUMAN), parity = read(PAR);
const bp = plan.articles.filter(x => x.batchCode === 'B3-B07');

assert.equal(bp.length, 6);
assert.equal(machine.baselineCommit, ORIGINAL);
assert.equal(machine.status, 'MACHINE_ACCEPTED_ZH_HANS_EDITORIAL_CANDIDATES_HUMAN_PENDING');
assert.equal(human.baselineCommit, BASE);
assert.equal(human.status, 'HUMAN_ACCEPTED_6_OF_6');
assert.equal(human.decisionAuthority, 'TL_EXPLICIT_6_OF_6_ARTICLE_ACCEPTANCE');
assert.ok(human.records.every(x => x.decision === 'ACCEPT'));
assert.equal(review.status, 'HUMAN_EDITORIAL_ACCEPTED_6_OF_6');
assert.equal(review.acceptedCount, 6);
assert.equal(m.baselineCommit, ORIGINAL);
assert.equal(m.successorBaselineCommit, BASE);
assert.equal(m.status, 'ZH_HANS_HUMAN_ACCEPTED_ENGLISH_SEMANTIC_PARITY_MACHINE_ACCEPTED_PUBLICATION_CLOSED');
assert.equal(parity.status, 'MACHINE_SEMANTIC_PARITY_ACCEPTED_6_OF_6');
assert.equal(parity.records.length, 6);

const planBy = new Map(bp.map(x => [x.articlePlanId, x]));
const hBy = new Map(human.records.map(x => [x.articlePlanId, x]));
const pBy = new Map(parity.records.map(x => [x.articlePlanId, x]));
const anchors = new Map([
  ['B3-ART-030', ['neural recovery', 'endocrine recovery', 'alertness', 'rhythm']],
  ['B3-ART-031', ['immune recovery', 'metabolic recovery', 'repair', 'rhythm']],
  ['B3-ART-032', ['psychological recovery', 'meaning', 'attention', 'experience']],
  ['B3-ART-033', ['relationships', 'organizations', 'shared operation', 'trust']],
  ['B3-ART-034', ['ai', 'recovery', 'artificial runtimes', 'governance']],
  ['B3-ART-035', ['sustainable continuity', 'change', 'margin', 'memory']]
]);

for (const r of m.records) {
  const p = planBy.get(r.articlePlanId);
  assert.ok(p);
  assert.equal(r.sha256, sha(r.path));
  const zh = read(r.path), hh = hBy.get(r.articlePlanId), pp = pBy.get(r.articlePlanId);
  assert.equal(hh.reviewedCandidateSha256, r.sha256);
  assert.equal(hh.reviewedArticleContentSha256, contentSha(zh));
  assert.equal(hh.decision, 'ACCEPT');
  assert.equal(r.humanEditorialDecision, 'ACCEPT');
  assert.equal(r.humanDecisionPath, HUMAN);
  assert.equal(r.englishCandidateSha256, sha(r.englishCandidatePath));
  assert.equal(r.englishCandidateSha256, pp.enSha256);
  assert.equal(pp.zhHansSha256, r.sha256);
  const en = read(r.englishCandidatePath);
  assert.equal(en.locale, 'en');
  assert.equal(en.stage, 'BOOK3-B07-ENGLISH-SEMANTIC-PARITY');
  assert.deepEqual(en.sourceBindings, zh.sourceBindings);
  assert.deepEqual(en.canonicalNodeBinding, zh.canonicalNodeBinding);
  assert.deepEqual(en.blocks.map(x => x.type), zh.blocks.map(x => x.type));
  const t = en.blocks.map(x => x.text || '').join('\n').toLowerCase();
  for (const k of anchors.get(p.articlePlanId)) assert.ok(t.includes(k), `${p.articlePlanId} missing ${k}`);
  assert.ok(t.split(/\s+/).length >= 500, `${p.articlePlanId} English article unexpectedly thin`);
  assert.ok(!/diagnosed as/.test(t));
  assert.equal(en.review.semanticParityStatus, 'MACHINE_SEMANTIC_PARITY_ACCEPTED');
  assert.equal(en.review.customerPublishable, false);
  assert.equal(en.authorityBoundary.zhHansAcceptanceDoesNotAutoAcceptEnglishEditorialQuality, true);
}

assert.equal(m.gates.zhHansHumanEditorial, 'HUMAN_ACCEPTED_6_OF_6');
assert.equal(m.gates.englishProduction, 'COMPLETE_6_OF_6_AFTER_ZH_ACCEPTANCE');
assert.equal(m.gates.englishSemanticParity, 'MACHINE_ACCEPTED_6_OF_6');
assert.equal(m.gates.publication, 'CLOSED');
assert.equal(m.gates.customerProjection, 'CLOSED');

console.log('✓ BOOK-3 B07 human editorial successor passed: explicit TL decision records 6/6 accepted without mutating reviewed zh-Hans candidate bytes.');
console.log('✓ BOOK-3 B07 English semantic parity passed: 6/6 English candidates preserve source sections, 10/10 Final Canonical Nodes, block functions and professional boundaries.');
console.log('✓ B07 publication/customer projection remain closed; English editorial quality is not auto-inferred.');
await import('./check-book3-b08-zh-hans-production.mjs');
