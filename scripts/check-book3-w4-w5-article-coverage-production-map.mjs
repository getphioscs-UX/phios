import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const census=read('content/knowledge/production-planning/audits/book3-w4-103-node-article-coverage-census-v1.json');
const plan=read('content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json');
const registry=read('content/knowledge/registry/successors/kau-r6e-book3-final/canonical-nodes-v1.json');
const wave1=read('content/knowledge/production-planning/production/book3-wave1/manifest-v1.json');
const BASE='f15cb138685c91c90a66b516f812c10bdfb74999';
assert.equal(census.baselineCommit,BASE); assert.equal(plan.baselineCommit,BASE);
assert.equal(registry.nodes.length,103); assert.equal(census.records.length,103); assert.equal(plan.articles.length,48); assert.equal(plan.batches.length,10);
assert.deepEqual(census.counts,{canonicalNodes:103,P8Nodes:60,P9Nodes:43,plannedArticles:48,existingAcceptedArticles:8,newPlannedArticles:40,existingAcceptedNodeCoverage:17,newPlannedNodeCoverage:86,standaloneArticles:8,groupedArticles:40,primaryArticleNodes:48,groupedSupportingNodes:55,nodesWithoutArticleCoverage:0,visualBriefCandidates:13});
const registryByNode=new Map(registry.nodes.map(n=>[n.nodeCode,n]));
const coverageByNode=new Map(); const articleIds=new Set(); const batchCodes=new Set(plan.batches.map(b=>b.batchCode));
let mappedNodeCount=0, acceptedArticles=0, plannedArticles=0;
for(const article of plan.articles){
  assert(!articleIds.has(article.articlePlanId),article.articlePlanId); articleIds.add(article.articlePlanId);
  assert(batchCodes.has(article.batchCode),article.batchCode); assert(article.nodeCodes.length>=1); assert.equal(article.primaryNodeCode,article.nodeCodes[0]);
  assert.equal(article.articleShape,article.nodeCodes.length===1?'STANDALONE':'GROUPED'); assert.equal(article.publicationAuthority,'CLOSED');
  assert.equal(article.sourceSectionCodes.length,article.nodeCodes.length);
  for(let i=0;i<article.nodeCodes.length;i++){
    const code=article.nodeCodes[i]; const node=registryByNode.get(code); assert.ok(node,code); assert(!coverageByNode.has(code),`duplicate article coverage ${code}`);
    assert.equal(node.canonicalSourceBinding.sectionCode,article.sourceSectionCodes[i]); coverageByNode.set(code,article.articlePlanId); mappedNodeCount++;
  }
  if(article.existingCandidateId){
    acceptedArticles++; assert.match(article.existingCandidateId,/^B3-W1-A0[1-8]$/); assert.equal(article.productionStatus,'ZH_HANS_HUMAN_ACCEPTED_EN_PARITY_PENDING'); assert.equal(article.localeState['zh-Hans'],'HUMAN_ACCEPTED'); assert.equal(article.localeState.en,'HUMAN_SEMANTIC_PARITY_PENDING');
    const record=wave1.records.find(r=>r.candidateId===article.existingCandidateId&&r.locale==='zh-Hans'); assert.ok(record,article.existingCandidateId); assert.equal(record.status,'HUMAN_EDITORIAL_ACCEPTED_FINAL_CANONICAL_RECONCILED'); assert.deepEqual(record.canonicalNodeCodes,article.nodeCodes);
  } else {
    plannedArticles++; assert.equal(article.productionStatus,'PLANNED_NOT_YET_PRODUCED'); assert.equal(article.localeState['zh-Hans'],'PLANNED'); assert.equal(article.localeState.en,'PLANNED_AFTER_ZH_ACCEPTANCE');
  }
}
assert.equal(mappedNodeCount,103); assert.equal(coverageByNode.size,103); assert.equal(acceptedArticles,8); assert.equal(plannedArticles,40);
assert.deepEqual([...coverageByNode.keys()].sort(),[...registryByNode.keys()].sort());
const censusByNode=new Map(census.records.map(r=>[r.nodeCode,r])); assert.equal(censusByNode.size,103);
let primary=0,support=0,standalone=0,acceptedNodes=0;
for(const [code,articleId] of coverageByNode){
  const r=censusByNode.get(code); assert.ok(r,code); assert.equal(r.articlePlanId,articleId); const node=registryByNode.get(code); assert.equal(r.sourceSectionCode,node.canonicalSourceBinding.sectionCode); assert.deepEqual(r.sourcePages,node.canonicalSourceBinding.pages); assert.equal(r.sourceTextSha256,node.canonicalSourceBinding.textSha256); assert.equal(r.publicationState,'NOT_PUBLISHED');
  if(r.coverageDisposition.startsWith('ARTICLE_PRIMARY')) primary++; else {assert.equal(r.coverageDisposition,'ARTICLE_SUPPORTING_GROUPED');support++;}
  if(r.coverageDisposition==='ARTICLE_PRIMARY_STANDALONE') standalone++;
  if(r.zhHansCoverageState==='HUMAN_ACCEPTED') acceptedNodes++;
}
assert.equal(primary,48); assert.equal(support,55); assert.equal(standalone,8); assert.equal(acceptedNodes,17);
assert.equal(plan.productionModel.canonicalNodeCount,103); assert.equal(plan.productionModel.articleCount,48); assert.equal(plan.productionModel.batchCount,10); assert.equal(plan.productionModel.completedBatch,'B3-B01'); assert.equal(plan.productionModel.remainingProductionBatches.length,9);
assert.equal(plan.gates.publication,'CLOSED_UNTIL_ARTICLE_FINAL_ASSEMBLY_AND_PUBLICATION_AUTHORITY'); assert.equal(plan.gates.englishSemanticParity,'HUMAN_GATED'); assert.equal(plan.freezeInvariants.noPublicationAuthorityCreated,true);
const totals=plan.batches.reduce((a,b)=>({articles:a.articles+b.articleCount,nodes:a.nodes+b.nodeCoverageCount}),{articles:0,nodes:0}); assert.deepEqual(totals,{articles:48,nodes:103});
assert.equal(plan.batches[0].batchCode,'B3-B01'); assert.equal(plan.batches[0].articleCount,8); assert.equal(plan.batches[0].nodeCoverageCount,17); assert.equal(plan.batches[0].status,'existing_8_articles_human_accepted');
for(const b of plan.batches.slice(1)) assert.equal(b.status,'planned');
console.log('✓ BOOK-3 W4 Article Coverage Census passed: 103/103 final Canonical Nodes have exactly one public Article coverage owner.');
console.log('✓ BOOK-3 W5 Final Article Production Map passed: 48 Articles across 10 batches; B01 keeps 8 accepted Articles / 17 Nodes, B02–B10 plan 40 new Articles / 86 Nodes.');
console.log('✓ 8 standalone Articles + 40 grouped Articles avoid duplicate Article production while preserving all 103 Canonical Node identities.');
console.log('✓ English semantic parity, visuals and publication remain separately gated.');
