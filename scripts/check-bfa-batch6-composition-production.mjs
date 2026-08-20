import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { publicArticlePurityFindings, approvalIsCurrent } from './lib/bilingual-final-approval/bfa-runtime-v1.mjs';
import { runBfaPublication } from './lib/bilingual-final-approval/bfa-publication-successor-v1.mjs';

const root=process.cwd();
const read=r=>JSON.parse(fs.readFileSync(path.join(root,r),'utf8'));
const exists=r=>fs.existsSync(path.join(root,r));
const P='content/production/bilingual-final-approval/progression-v2';
const batch='BATCH-006';

const plan=read(`content/production/article-simplification/batches/${batch}/batch-plan.v1.json`);
const orch=read(`content/production/article-simplification/batches/${batch}/candidate-orchestration.v1.json`);
const review=read(`content/production/bilingual-final-approval/${batch}/review-data.json`);
const prod=read(`${P}/auto-c2c3/production/${batch}-composition-production-v1.json`);
const c2=read(`${P}/auto-c2c3/c2/${batch}-automatic-c2-v2.json`);
const c3=read(`${P}/auto-c2c3/c3/${batch}-deterministic-c3-v2.json`);
const ex=read(`${P}/auto-c2c3/exceptions/${batch}-exception-registry-v1.json`);
const content=read(`${P}/composition-production/${batch}-article-composition-content-v1.json`);
const acceptance=read(`${P}/acceptance/${batch}-composition-production-acceptance-v1.json`);

assert.equal(plan.selection.selectedArticleUnitCount,11);
assert.equal(plan.selection.canonicalNodeCoverageCount,55);
assert.equal(c2.automaticFrozenCount,55);
assert.equal(c2.exceptionCount,0);
assert.equal(c3.summary.productionReadyCount,55);
assert.equal(c3.summary.blockedCount,0);
assert.equal(ex.recordCount,0);
assert.equal(orch.articleUnitCount,11);
assert.equal(orch.canonicalNodeCoverageCount,55);
assert.equal(orch.localeCandidateCount,22);
assert.equal(prod.articleUnitCount,11);
assert.equal(prod.canonicalNodeCoverageCount,55);
assert.equal(prod.localeCandidateCount,22);
assert.equal(prod.readyForFinalApprovalCount,11);
assert.equal(content.batchCode,batch);
assert.equal(Object.keys(content.content).length,11);
assert.equal(content.authorityBoundary.humanFinalApprovalCreated,false);
assert.equal(content.authorityBoundary.publicationCreated,false);
assert.equal(acceptance.status,'READY_FOR_BFA_FINAL_REVIEW');
assert.equal(acceptance.articleUnitCount,11);
assert.equal(acceptance.canonicalNodeCoverageCount,55);
assert.equal(acceptance.localeCandidateCount,22);
assert.equal(acceptance.readyForFinalApprovalCount,11);
assert.equal(acceptance.exceptionCount,0);
assert.equal(acceptance.authorityBoundary.bfaFinalApprovalCreated,false);
assert.equal(acceptance.authorityBoundary.publicationCreated,false);

const publicMeta=/(Canonical Nodes?|Article Composition|索引节点|This article composes|depth through composition|one thin article per indexed node)/i;
const legacyBoilerplate=/(Volume II, \*Reality Runtime\*, moves from the formation of reality|Placed back into the larger runtime chain|These mechanisms are not five independent definitions|第二册《世界如何运行》开始把第一册建立的现实形成结构推进到持续运行层|把这一层放回整条运行链来看，重点在于它既承接前一状态|这些节点并不是五个并列的定义)/i;
const forbiddenGovernance=/(框架说明与外部事实必须分开|一般机制与个案判断必须分开|A general framework and external facts are different|General mechanism and case-specific judgment are different|(?:^|\n)#{1,6}\s*(?:知识边界|Knowledge Boundary))/im;

// KAU-R5 successor recognition is intentionally narrow: these two admitted nodes must
// preserve their frozen authority string while being backed by the accepted R4/R5 chain.
const kauAcceptance=read('content/knowledge/reconciliation/kau-r5/kau-r5-acceptance-v1.json');
const kauBindings=read('content/knowledge/reconciliation/kau-r5/book-2-new-node-approved-bindings-v1.json');
assert.equal(kauAcceptance.status,'ACCEPTED_CANONICAL_AUTHORITY_SUCCESSOR');
assert.equal(kauAcceptance.acceptance.r4HumanAcceptanceRecorded,true);
assert.equal(kauAcceptance.acceptance.newCanonicalNodesAdded,2);
assert.equal(kauBindings.status,'APPROVED');
assert.equal(kauBindings.recordCount,2);
for(const nodeCode of ['KN-B2-P7-058','KN-B2-P7-059']){
  const binding=kauBindings.records.find(x=>x.nodeCode===nodeCode);
  assert.ok(binding,`${nodeCode} KAU-R5 binding missing`);
  assert.equal(binding.status,'APPROVED');
  assert.equal(binding.authorityStatus,'APPROVED');
  assert.equal(binding.authority,'KAU-R5_NEW_CANONICAL_NODE_ADMISSION');
  const c2Entry=c2.entries.find(x=>x.nodeCode===nodeCode);
  assert.ok(c2Entry,`${nodeCode} AUTO-C2 entry missing`);
  assert.equal(c2Entry.state,'AUTO_C2_FROZEN');
  assert.equal(c2Entry.sourceBinding.mappingAuthority,'KAU-R5_NEW_CANONICAL_NODE_ADMISSION');
  assert.equal(c2Entry.sourceBinding.mappingCode,binding.mappingCode);
}

const preApprovalDir=`content/production/bilingual-final-approval/${batch}/approvals`;
const preApprovedUnits=new Set();
if(exists(preApprovalDir)){
  for(const f of fs.readdirSync(path.join(root,preApprovalDir)).filter(x=>x.endsWith('.json'))){
    const a=read(`${preApprovalDir}/${f}`);
    const pkgRel=`content/production/bilingual-final-approval/${batch}/packages/${a.nodeCode}.v1.json`;
    if(exists(pkgRel)){
      const pkg=read(pkgRel);
      if(a.decision==='approve_for_publication'&&approvalIsCurrent(a,pkg))preApprovedUnits.add(pkg.articleUnitCode);
    }
  }
}

const candidates=[];
let nodeCoverage=0;
for(const entry of orch.entries){
  assert.ok(entry.compositionUnit);
  assert.equal(entry.compositionUnit.memberNodeCount,5);
  nodeCoverage+=entry.compositionUnit.memberNodeCount;
  const blueprint=content.content[entry.articleUnitCode];
  assert.ok(blueprint,`${entry.articleUnitCode} blueprint missing`);
  for(const locale of ['zh-Hans','en']){
    const rel=entry.compositionUnit.candidatePaths[locale];
    assert.ok(exists(rel),rel);
    const c=read(rel);
    candidates.push(c);
    assert.equal(c.articleUnitCode,entry.articleUnitCode);
    assert.equal(c.compositionNodeCount,5);
    assert.equal(c.candidateState,'ready_for_human_review');
    assert.equal(c.authority.approval,'not_approved');
    assert.equal(c.authority.publication,'not_published');
    const publicText=`${c.article.title}\n${c.article.summary}\n${c.article.bodyMarkdown}`;
    assert.equal(publicArticlePurityFindings(publicText).length,0,`${c.articleUnitCode}/${locale} purity`);
    assert.equal(forbiddenGovernance.test(c.article.bodyMarkdown),false,`${c.articleUnitCode}/${locale} forbidden governance heading`);
    assert.equal(legacyBoilerplate.test(c.article.bodyMarkdown),false,`${c.articleUnitCode}/${locale} legacy boilerplate`);
    if(!preApprovedUnits.has(c.articleUnitCode))assert.equal(publicMeta.test(publicText),false,`${c.articleUnitCode}/${locale} public production metadata leakage`);
    if(locale==='zh-Hans'){
      assert.ok(c.article.bodyMarkdown.length>=2000,`${c.articleUnitCode} zh too short`);
    }else{
      assert.ok(c.article.bodyMarkdown.length>=6000,`${c.articleUnitCode} en too short`);
      assert.equal(/[\u3400-\u9fff]/u.test(publicText),false,`${c.articleUnitCode} English CJK leakage`);
    }
  }
}
assert.equal(nodeCoverage,55);
assert.equal(candidates.length,22);
assert.equal(new Set(candidates.map(x=>x.candidateCode)).size,22);
assert.equal(new Set(candidates.map(x=>x.articleUnitCode)).size,11);
for(const code of new Set(candidates.map(x=>x.articleUnitCode))){
  const z=candidates.find(x=>x.articleUnitCode===code&&x.locale==='zh-Hans');
  const e=candidates.find(x=>x.articleUnitCode===code&&x.locale==='en');
  assert.notEqual(z.candidateDigest,e.candidateDigest);
  assert.notEqual(z.article.bodyMarkdown,e.article.bodyMarkdown);
}

assert.equal(review.entries.length,11);
assert.equal(review.summary.nodes,11);
assert.equal(review.summary.localeCandidates,22);
assert.equal(review.summary.articleReady,11);
assert.equal(review.summary.warnings,0);
assert.equal(review.summary.blocked,0);
assert.ok(review.entries.every(x=>x.package?.publicationReadiness?.state==='READY_FOR_FINAL_APPROVAL'&&x.package?.automaticEvidence?.status==='PASS'&&x.package?.canonicalAuthority?.c2C3Model==='AUTOMATIC_C2_DETERMINISTIC_C3'));

const packageMap=new Map(review.entries.map(x=>[x.nodeCode,x.package]));
const approvalDir=`content/production/bilingual-final-approval/${batch}/approvals`;
const approvalFiles=exists(approvalDir)?fs.readdirSync(path.join(root,approvalDir)).filter(x=>x.endsWith('.json')):[];
const approvals=approvalFiles.map(f=>read(`${approvalDir}/${f}`));
assert.ok(approvals.every(a=>a.reviewerCode==='TL'&&a.decision==='approve_for_publication'&&packageMap.has(a.nodeCode)&&approvalIsCurrent(a,packageMap.get(a.nodeCode))));
const runRel=`content/production/bilingual-final-approval/${batch}/publication-run.v1.json`;
let lifecycle;
if(exists(runRel)){
  const run=read(runRel);
  assert.equal(approvals.length,11);
  assert.equal(run.status,'PUBLICATION_COMPLETED');
  assert.equal(run.packageCount,11);
  assert.equal(run.publicationCount,22);
  lifecycle='PUBLISHED';
}else if(approvals.length===11){
  const dry=await runBfaPublication(root,batch,{apply:false});
  assert.equal(dry.packageCount,11);
  assert.equal(dry.publicationCount,22);
  lifecycle='READY_FOR_PUBLICATION';
}else if(approvals.length>0){
  lifecycle='FINAL_REVIEW_IN_PROGRESS';
}else{
  let blocked=false;
  try{await runBfaPublication(root,batch,{apply:false});}catch(e){blocked=e?.code==='BFA_FINAL_APPROVAL_REQUIRED';}
  assert.equal(blocked,true);
  lifecycle='READY_FOR_FINAL_APPROVAL';
}

console.log('✓ BATCH-006 production passed: 55 governed BOOK-2/P7 nodes -> 11 Article Composition Units -> 22 independent locale Candidates.');
console.log('✓ AUTO-C2 55/55 and deterministic C3 55/55 passed with zero exceptions, including narrow KAU-R5 successor recognition for KN-B2-P7-058/059.');
console.log('✓ 11/11 Complete Publication Packages are Automatic PASS / READY_FOR_FINAL_APPROVAL; zh-Hans >=2000 and English >=6000 character floors passed.');
console.log(`✓ Public purity, English CJK leakage, legacy batch-005 boilerplate, 5-node composition coverage, and approval-aware lifecycle passed. BATCH-006 lifecycle: ${lifecycle}; current TL Final Approvals ${approvals.length}/11.`);
