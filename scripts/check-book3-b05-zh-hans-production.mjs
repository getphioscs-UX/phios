import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')); const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); const exists=p=>fs.existsSync(p);
const BASE='d49dd16b38d7f858c9bad861b788919d0dec4c33';
const PLAN='content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const MAN='content/knowledge/production-planning/production/book3-b05/manifest-v1.json';
const REV='content/knowledge/production-planning/review/book3-b05-zh-hans-editorial-review-v1.json';
const MACH='content/knowledge/production-planning/acceptance/book3-b05-machine-acceptance-v1.json';
const REG='content/knowledge/registry/successors/kau-r6e-book3-final/canonical-nodes-v1.json';
const INV='content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json';
const plan=read(PLAN), manifest=read(MAN), review=read(REV), machine=read(MACH), registry=read(REG), inventory=read(INV);
const sections=new Map(inventory.sections.filter(x=>x.segmentType==='SECTION').map(x=>[x.sectionCode,x])); const nodes=new Map(registry.nodes.map(x=>[x.nodeCode,x]));
const bp=plan.articles.filter(x=>x.batchCode==='B3-B05'), batch=plan.batches.find(x=>x.batchCode==='B3-B05');
assert.equal(plan.status,'FINAL_PRODUCTION_MAP_FROZEN_FOR_BATCH_EXECUTION'); assert.equal(bp.length,4); assert.equal(batch.articleCount,4); assert.equal(batch.nodeCoverageCount,8); assert.equal(batch.status,'planned'); assert.deepEqual(bp.map(x=>x.articlePlanId),['B3-ART-023','B3-ART-024','B3-ART-025','B3-ART-026']);
assert.equal(manifest.baselineCommit,BASE); assert.equal(manifest.status,'ZH_HANS_SOURCE_BOUND_EDITORIAL_CANDIDATES_READY_HUMAN_REVIEW_PENDING'); assert.deepEqual(manifest.counts,{articleCandidates:4,canonicalNodeCoverage:8,sourceSectionBindings:8,localesProduced:1,englishCandidates:0,humanAcceptedArticles:0,publishedArticles:0});
assert.equal(review.status,'PENDING_HUMAN_EDITORIAL_REVIEW'); assert.equal(review.requiredAcceptCount,4); assert.ok(review.records.every(x=>x.decision==='PENDING')); assert.equal(machine.status,'MACHINE_ACCEPTED_ZH_HANS_EDITORIAL_CANDIDATES_HUMAN_PENDING'); assert.equal(machine.humanGate.status,'PENDING_0_OF_4');
const planBy=new Map(bp.map(x=>[x.articlePlanId,x])), revBy=new Map(review.records.map(x=>[x.articlePlanId,x])); const coveredN=new Set(),coveredS=new Set();
const anchors=new Map([['B3-ART-023',['安全检测','恢复许可','边界','承接']],['B3-ART-024',['恢复阻抗','恢复窗口','熟悉','余量']],['B3-ART-025',['负荷释放','重新整合','责任','历史']],['B3-ART-026',['重新进入','运行监测','余量','趋势']]]);
for(const r of manifest.records){const p=planBy.get(r.articlePlanId); assert.ok(p); assert.ok(exists(r.path)); assert.equal(r.sha256,sha(r.path)); const a=read(r.path); assert.equal(a.stage,'BOOK3-B05-ZH-HANS-PRODUCTION'); assert.equal(a.locale,'zh-Hans'); assert.equal(a.article.title,p.workingTitleZhHans); assert.deepEqual(a.blocks.map(x=>x.type),['summary','paragraph','paragraph','paragraph','paragraph','paragraph','paragraph','paragraph','key_judgment','reality_question']); const t=a.blocks.map(x=>x.text||'').join('\n'); assert.ok(t.length>=950); for(const k of anchors.get(p.articlePlanId)) assert.ok(t.includes(k),`${p.articlePlanId} missing ${k}`); assert.ok(!/诊断为|确诊|治疗建议|医学结论/.test(t)); assert.ok(/专业|医疗|心理健康/.test(t)); assert.deepEqual(a.sourceBindings.map(x=>x.sourceSectionCode),p.sourceSectionCodes); assert.deepEqual(a.canonicalNodeBinding.nodeCodes,p.nodeCodes); assert.equal(a.canonicalNodeBinding.mutationPerformed,false);
for(let i=0;i<p.nodeCodes.length;i++){const n=nodes.get(p.nodeCodes[i]),s=sections.get(p.sourceSectionCodes[i]),b=a.sourceBindings[i]; assert.ok(n&&s); assert.ok(!coveredN.has(p.nodeCodes[i])&&!coveredS.has(p.sourceSectionCodes[i])); coveredN.add(p.nodeCodes[i]); coveredS.add(p.sourceSectionCodes[i]); assert.equal(n.canonicalSourceBinding.sectionCode,p.sourceSectionCodes[i]); assert.equal(b.sourceTextSha256,s.textSha256); assert.deepEqual(b.sourcePages,[s.startPage,s.endPage]);}
assert.equal(a.review.humanEditorialApproved,false); assert.equal(a.review.customerPublishable,false); assert.equal(revBy.get(p.articlePlanId).decision,'PENDING');}
assert.equal(coveredN.size,8); assert.equal(coveredS.size,8); const enDir='content/knowledge/production-planning/production/book3-b05/candidates/en'; assert.ok(!exists(enDir)||fs.readdirSync(enDir).filter(x=>x.endsWith('.json')).length===0); assert.equal(manifest.gates.zhHansHumanEditorial,'PENDING'); assert.equal(manifest.gates.publication,'CLOSED'); assert.equal(manifest.gates.customerProjection,'CLOSED');
console.log('✓ BOOK-3 B05 zh-Hans production passed: 4/4 Articles cover exactly 8/8 frozen W5 Final Canonical Nodes P8-133..140.');
console.log('✓ B05 manuscript section digests/pages, grouped-node bindings, professional boundary and article-depth gates passed.');
console.log('✓ B05 human editorial remains 0/4 pending; English, publication and customer projection remain fail-closed.');
