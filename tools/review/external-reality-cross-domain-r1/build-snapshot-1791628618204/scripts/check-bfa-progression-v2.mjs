import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildProgressionReadiness, currentProgressionBatch, publishedNodeSet } from './lib/bilingual-final-approval/bfa-progression-v2.mjs';
const root=process.cwd(),read=r=>JSON.parse(fs.readFileSync(path.join(root,r),'utf8'));
const P='content/production/bilingual-final-approval/progression-v2';
const corpus=read(`${P}/registries/canonical-production-corpus-v2.json`),order=read(`${P}/registries/canonical-publication-order-v1.json`),plan=read(`${P}/plans/complete-batch-plan-v2.json`),units=read(`${P}/composition/article-composition-unit-registry-v1.json`),compositionPlan=read(`${P}/composition/complete-article-composition-batch-plan-v1.json`),decisions=read(`${P}/human-decisions/BATCH-003-c2-human-decisions-v1.json`);
assert.equal(corpus.recordCount,913);assert.equal(corpus.excludedCompatibilityRecords.length,18);assert.equal(order.recordCount,913);assert.equal(new Set(order.records.map(x=>x.nodeCode)).size,913);
assert.equal(units.counts.productionActiveCanonicalNodes,913);assert.equal(units.counts.legacyPublishedSingleNodeArticles,13);assert.equal(units.counts.unpublishedCanonicalNodes,900);assert.equal(units.counts.explicitDeferredCanonicalNodes,1);assert.equal(units.counts.schedulableCanonicalNodes,899);assert.equal(units.counts.newArticleCompositionUnits,181);assert.equal(units.counts.totalPublicArticlesAfterCurrentPlan,194);
assert.equal(units.articleUnits.length,181);assert.ok(units.articleUnits.every(x=>[4,5].includes(x.memberNodeCount)));const covered=units.articleUnits.flatMap(x=>x.memberNodeCodes);assert.equal(covered.length,899);assert.equal(new Set(covered).size,899);assert.equal(covered.includes('KN-PREFACE-003'),false);
assert.equal(plan.futurePlannedNodeCount,899);assert.equal(plan.futureArticleUnitCount,181);assert.equal(plan.futureBatchCount,11);assert.equal(plan.batches[0].batchCode,'BATCH-003');assert.equal(plan.batches.at(-1).batchCode,'BATCH-013');assert.ok(plan.batches.every(b=>b.articleUnitCount>0&&b.articleUnitCount<=24&&b.singleBook===true));
assert.equal(compositionPlan.summary.articleUnitCount,181);assert.equal(compositionPlan.summary.canonicalNodeCoverageCount,899);assert.equal(compositionPlan.summary.futureBatchCount,11);
const b3=plan.batches.find(x=>x.batchCode==='BATCH-003');assert.equal(b3.articleUnitCount,5);assert.equal(b3.canonicalNodeCoverageCount,23);assert.deepEqual(b3.articleUnitCodes,['ACU-B1-001','ACU-B1-002','ACU-B1-003','ACU-B1-004','ACU-B1-005']);
const b4=plan.batches.find(x=>x.batchCode==='BATCH-004');assert.equal(b4.articleUnitCount,6);assert.equal(b4.canonicalNodeCoverageCount,28);assert.deepEqual(b4.articleUnitCodes,['ACU-B1-006','ACU-B1-007','ACU-B1-008','ACU-B1-009','ACU-B1-010','ACU-B1-011']);
const pubs=publishedNodeSet(root),active=new Set(order.records.map(x=>x.nodeCode));
assert.equal(decisions.decisions.filter(x=>x.decision==='freeze_approved').length,23);assert.deepEqual(decisions.decisions.filter(x=>x.decision==='defer').map(x=>x.nodeCode),['KN-PREFACE-003']);
const coverage=read('content/knowledge/public/article-composition-coverage-registry-v1.json');
const publishedCoverage=(batchCode,expectedUnits,expectedNodes)=>{const rows=(coverage.records??[]).filter(x=>x.batchCode===batchCode&&x.publicationState==='PUBLISHED');assert.ok([0,expectedUnits].includes(rows.length),`${batchCode} composition publication must be all-or-none under the normal batch flow`);const nodes=new Set(rows.flatMap(x=>x.memberNodeCodes));if(rows.length===expectedUnits)assert.equal(nodes.size,expectedNodes);return {rows,nodes};};
const cov3=publishedCoverage('BATCH-003',5,23);assert.equal(cov3.rows.length,5,'BATCH-003 remains historical published composition authority');
const cov4=publishedCoverage('BATCH-004',6,28);
const cov5=publishedCoverage('BATCH-005',24,120);
const cov6=publishedCoverage('BATCH-006',11,55);
const expectedActivePublished=13+cov3.nodes.size+cov4.nodes.size+cov5.nodes.size+cov6.nodes.size;assert.equal([...pubs].filter(x=>active.has(x)).length,expectedActivePublished);assert.equal(covered.filter(x=>pubs.has(x)).length,cov3.nodes.size+cov4.nodes.size+cov5.nodes.size+cov6.nodes.size);
const currentBook1=currentProgressionBatch(root,{bookCode:'BOOK-1'}),currentBook2=currentProgressionBatch(root,{bookCode:'BOOK-2'}),currentGlobal=currentProgressionBatch(root);
if(cov4.rows.length===6)assert.equal(currentBook1,null,'BOOK-1 should be complete after BATCH-004 publication');else assert.equal(currentBook1?.batchCode,'BATCH-004');
if(cov5.rows.length===24&&cov6.rows.length===0){assert.equal(currentBook2?.batchCode,'BATCH-006','BOOK-2 cursor should advance to BATCH-006 after complete BATCH-005 publication');assert.equal(currentGlobal?.batchCode,'BATCH-006');}
if(cov6.rows.length===11){assert.equal(currentBook2,null,'BOOK-2 should be complete after BATCH-006 publication');assert.equal(currentGlobal?.batchCode,'BATCH-007');}
const current=currentGlobal;const r4=buildProgressionReadiness(root,'BATCH-004');assert.equal(r4.status,'PRODUCTION_READY');assert.equal(r4.summary.nodeCount,28);assert.equal(r4.summary.productionReadyCount,28);assert.equal(r4.summary.blockedCount,0);assert.equal(r4.summary.exceptionCount,0);assert.ok(r4.entries.every(x=>x.humanC3DecisionRequired===false));
if(cov5.rows.length===24){const r6=buildProgressionReadiness(root,'BATCH-006');assert.equal(r6.status,'PRODUCTION_READY');assert.equal(r6.summary.nodeCount,55);assert.equal(r6.summary.productionReadyCount,55);assert.equal(r6.summary.blockedCount,0);assert.equal(r6.summary.exceptionCount,0);assert.ok(r6.entries.every(x=>x.humanC3DecisionRequired===false));}
console.log('✓ BFA Article Composition corpus: 913 active Canonical Nodes remain knowledge/retrieval/rule units; 13 historical single-node articles are preserved and 899 schedulable nodes map to 181 new Article Composition Units.');
console.log(`✓ Published composition coverage: BATCH-003 ${cov3.rows.length}/5, BATCH-004 ${cov4.rows.length}/6, BATCH-005 ${cov5.rows.length}/24, BATCH-006 ${cov6.rows.length}/11; KN-PREFACE-003 DEFER remains historical Human evidence.`);
console.log(`✓ Canonical cursor is ${current?.batchCode??'COMPLETE'}; when BATCH-005 is published, BATCH-006 readiness is verified at 55/55 deterministic C3 with zero exception escalation.`);
console.log('✓ Future production remains 11 single-book composition batches, BATCH-003 through BATCH-013, maximum 24 public Article Composition Units per batch.');
