import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists=p=>fs.existsSync(p);
const BASE='ac9ee0b759d94a4dac22dfa42faa4edfa600bcb3';
const PLAN='content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const MAN='content/knowledge/production-planning/production/book3-b09/manifest-v1.json';
const REV='content/knowledge/production-planning/review/book3-b09-zh-hans-editorial-review-v1.json';
const MACH='content/knowledge/production-planning/acceptance/book3-b09-machine-acceptance-v1.json';
const REG='content/knowledge/registry/successors/kau-r6e-book3-final/canonical-nodes-v1.json';
const INV='content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json';
const plan=read(PLAN),m=read(MAN),review=read(REV),machine=read(MACH),registry=read(REG),inventory=read(INV);
const sections=new Map(inventory.sections.filter(x=>x.segmentType==='SECTION').map(x=>[x.sectionCode,x]));
const nodes=new Map(registry.nodes.map(x=>[x.nodeCode,x]));
const bp=plan.articles.filter(x=>x.batchCode==='B3-B09'),batch=plan.batches.find(x=>x.batchCode==='B3-B09');
assert.equal(bp.length,6); assert.equal(batch.articleCount,6); assert.equal(batch.nodeCoverageCount,15); assert.equal(batch.status,'planned'); assert.deepEqual(bp.map(x=>x.articlePlanId),['B3-ART-040','B3-ART-041','B3-ART-042','B3-ART-043','B3-ART-044','B3-ART-045']);
assert.equal(m.baselineCommit,BASE); assert.equal(m.status,'ZH_HANS_SOURCE_BOUND_EDITORIAL_CANDIDATES_READY_HUMAN_REVIEW_PENDING'); assert.deepEqual(m.counts,{articleCandidates:6,canonicalNodeCoverage:15,sourceSectionBindings:15,localesProduced:1,englishCandidates:0,humanAcceptedArticles:0,publishedArticles:0});
assert.equal(review.status,'PENDING_HUMAN_EDITORIAL_REVIEW'); assert.equal(review.requiredAcceptCount,6); assert.ok(review.records.every(x=>x.decision==='PENDING')); assert.equal(machine.status,'MACHINE_ACCEPTED_ZH_HANS_EDITORIAL_CANDIDATES_HUMAN_PENDING'); assert.equal(machine.humanGate.status,'PENDING_0_OF_6');
const planBy=new Map(bp.map(x=>[x.articlePlanId,x])),revBy=new Map(review.records.map(x=>[x.articlePlanId,x])); const coveredN=new Set(),coveredS=new Set();
const anchors=new Map([
 ['B3-ART-040',['资源协调','信息协调','意义协调']],['B3-ART-041',['注意','激励','权力']],['B3-ART-042',['风险协调','复杂度协调','不确定']],['B3-ART-043',['协调漂移','协调饱和','处理上限']],['B3-ART-044',['协调碎裂','合法性','俘获','协调崩塌']],['B3-ART-045',['没有人类','人工智能','治理','责任']]
]);
for(const r of m.records){
 const p=planBy.get(r.articlePlanId); assert.ok(p); assert.ok(exists(r.path)); assert.equal(r.sha256,sha(r.path)); const a=read(r.path); assert.equal(a.stage,'BOOK3-B09-ZH-HANS-PRODUCTION'); assert.equal(a.locale,'zh-Hans'); assert.equal(a.article.title,p.workingTitleZhHans); assert.deepEqual(a.blocks.map(x=>x.type),['summary','paragraph','paragraph','paragraph','paragraph','paragraph','paragraph','paragraph','key_judgment','reality_question']); const t=a.blocks.map(x=>x.text||'').join('\n'); assert.ok(t.length>=1250,`${p.articlePlanId} unexpectedly thin`); for(const k of anchors.get(p.articlePlanId)) assert.ok(t.includes(k),`${p.articlePlanId} missing ${k}`); assert.ok(!/某党|左派|右派|政治立场|应当支持|必须反对/.test(t),`${p.articlePlanId} must remain politically neutral`); assert.ok(!/人工智能可以取代人类责任|机器能够自行决定共同目标|机器可自动获得正当性/.test(t),`${p.articlePlanId} AI/governance boundary drift`);
 assert.deepEqual(a.sourceBindings.map(x=>x.sourceSectionCode),p.sourceSectionCodes); assert.deepEqual(a.canonicalNodeBinding.nodeCodes,p.nodeCodes); assert.equal(a.canonicalNodeBinding.mutationPerformed,false); assert.equal(a.canonicalNodeBinding.nodeCode,p.nodeCodes.length===1?p.nodeCodes[0]:null); assert.equal(a.canonicalNodeBinding.crossNodeAssemblyAllowed,p.nodeCodes.length>1);
 for(let i=0;i<p.nodeCodes.length;i++){const n=nodes.get(p.nodeCodes[i]),s=sections.get(p.sourceSectionCodes[i]),b=a.sourceBindings[i]; assert.ok(n&&s); assert.ok(!coveredN.has(p.nodeCodes[i])&&!coveredS.has(p.sourceSectionCodes[i])); coveredN.add(p.nodeCodes[i]); coveredS.add(p.sourceSectionCodes[i]); assert.equal(n.canonicalSourceBinding.sectionCode,p.sourceSectionCodes[i]); assert.equal(b.sourceTextSha256,s.textSha256); assert.deepEqual(b.sourcePages,[s.startPage,s.endPage]); assert.equal(b.sourceHeading,s.heading);}
 assert.equal(a.review.humanEditorialApproved,false); assert.equal(a.review.customerPublishable,false); assert.equal(revBy.get(p.articlePlanId).decision,'PENDING');
}
assert.equal(coveredN.size,15); assert.equal(coveredS.size,15); const enDir='content/knowledge/production-planning/production/book3-b09/candidates/en'; assert.ok(!exists(enDir)||fs.readdirSync(enDir).filter(x=>x.endsWith('.json')).length===0); assert.equal(m.gates.zhHansHumanEditorial,'PENDING'); assert.equal(m.gates.publication,'CLOSED'); assert.equal(m.gates.customerProjection,'CLOSED');
console.log('✓ BOOK-3 B09 zh-Hans production passed: 6/6 Articles cover exactly 15/15 frozen W5 Final Canonical Nodes P9-116..129 plus P9-135.');
console.log('✓ B09 source digests/pages, grouped/standalone bindings, neutral governance treatment and Human/AI responsibility boundaries passed.');
console.log('✓ B09 human editorial remains 0/6 pending; English, publication and customer projection remain fail-closed.');
