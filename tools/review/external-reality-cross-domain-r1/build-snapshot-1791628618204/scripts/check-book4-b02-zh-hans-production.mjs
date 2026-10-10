import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const a3=read('content/knowledge/production-planning/plans/book4-a3-final-article-map-v1.json');
const inv=read('content/knowledge/manuscripts/extraction/book-4-final-section-inventory-v1.json');
const canon=read('content/knowledge/registry/successors/book4-a1-final/canonical-nodes-v1.json');
const a6=read('content/knowledge/contracts/book-4-production-admission-authority-v1.json');
const manifest=read('content/knowledge/production-planning/production/book4-b02/manifest-v1.json');
const review=read('content/knowledge/production-planning/review/book4-b02-zh-hans-editorial-review-v1.json');
const bindings=read('content/knowledge/knowledge-intelligence-r2/registries/kir-r2-published-article-binding-registry-v2.json');
assert.equal(a6.status,'PRODUCTION_ADMITTED');const batch=a3.batches.find(x=>x.batchCode==='B4-B02');assert.ok(batch);assert.equal(batch.articleCount,4);assert.equal(batch.nodeCoverageCount,8);
const plans=a3.articles.filter(x=>x.batchCode==='B4-B02');assert.equal(plans.length,4);const byPlan=new Map(plans.map(x=>[x.articlePlanId,x]));const bySec=new Map(inv.sections.map(x=>[x.sectionCode,x]));const byNode=new Map(canon.nodes.map(x=>[x.nodeCode,x]));
assert.equal(manifest.status,'ZH_HANS_4_ARTICLES_GENERATED_HUMAN_EDITORIAL_PENDING');assert.equal(manifest.records.length,4);assert.equal(manifest.counts.articleCandidates,4);assert.equal(manifest.counts.canonicalNodeCoverage,8);assert.equal(manifest.counts.sourceSectionBindings,8);
const seenNodes=[];const seenSecs=[];
for(const r of manifest.records){const plan=byPlan.get(r.articlePlanId);assert.ok(plan,`missing plan ${r.articlePlanId}`);assert.ok(fs.existsSync(r.path));assert.equal(sha(r.path),r.sha256);const c=read(r.path);assert.equal(c.locale,'zh-Hans');assert.equal(c.articlePlanId,plan.articlePlanId);assert.equal(c.article.title,plan.workingTitleZhHans);assert.equal(c.canonicalNodeBinding.primaryNodeCode,plan.primaryNodeCode);assert.deepEqual(c.canonicalNodeBinding.nodeCodes,plan.nodeCodes);assert.deepEqual(c.sourceBindings.map(x=>x.sourceSectionCode),plan.sourceSectionCodes);assert.deepEqual(c.semanticProfileBinding.sourceA2ProfileIds,plan.semanticProfileIds);assert.equal(c.review.humanEditorialApproved,false);assert.equal(c.review.publicationStatus,'not_published');assert.equal(c.review.englishProductionStatus,'BLOCKED_UNTIL_ZH_HANS_ACCEPTED');
 const types=c.blocks.map(x=>x.type);assert.equal(types.filter(x=>x==='summary').length,1);assert.equal(types.filter(x=>x==='paragraph').length,7);assert.equal(types.filter(x=>x==='key_judgment').length,1);assert.equal(types.filter(x=>x==='reality_question').length,1);assert.ok(c.blocks.every(x=>typeof x.text==='string'&&x.text.trim().length>20));
 for(let i=0;i<plan.sourceBindings.length;i++){const pb=plan.sourceBindings[i],cb=c.sourceBindings[i],s=bySec.get(pb.sectionCode),n=byNode.get(pb.nodeCode);assert.ok(s);assert.ok(n);assert.equal(cb.sourceTextSha256,pb.textSha256);assert.deepEqual(cb.sourcePages,pb.pages);assert.equal(cb.sourceTextSha256,s.textSha256);assert.equal(n.canonicalSourceBinding.sectionCode,pb.sectionCode);seenNodes.push(pb.nodeCode);seenSecs.push(pb.sectionCode);}
}
assert.deepEqual([...seenNodes].sort(),[...batch.nodeCodes].sort());assert.equal(new Set(seenNodes).size,8);assert.equal(new Set(seenSecs).size,8);
assert.equal(review.status,'HUMAN_EDITORIAL_PENDING_0_OF_4');assert.equal(review.candidateCount,4);assert.equal(review.requiredAcceptCount,4);assert.ok(review.records.every(x=>x.decision==='PENDING'));
assert.equal(fs.existsSync('content/knowledge/production-planning/production/book4-b02/candidates/en'),false,'English B02 must not exist before zh-Hans acceptance');assert.equal(bindings.records.some(x=>x.bookCode==='BOOK-4'),false);
console.log('✓ BOOK-IV B02 zh-Hans production passed: 4 source-bound articles cover exactly 8 A3 nodes / 8 final manuscript sections.');
console.log('✓ Every article contains visible review prose (summary + 7 paragraphs + key judgment + Reality Question) with exact source SHA/page binding.');
console.log('✓ Human editorial state remains 0/4 pending; English production and publication remain blocked until explicit 4/4 acceptance.');
