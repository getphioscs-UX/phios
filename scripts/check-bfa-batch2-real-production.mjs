import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBfaArticleActivationReadiness} from './lib/bilingual-final-approval/bfa-article-activation-v1.mjs';
import {approvalIsCurrent} from './lib/bilingual-final-approval/bfa-runtime-v1.mjs';
import {validateZhHansCandidate} from './lib/knowledge-production/zh-hans-candidate-v1.mjs';
import {validateEnglishCandidate,registryRecord as buildEnglishRegistryRecord} from './lib/knowledge-production/english-candidate-v1.mjs';
import {validateZhHansProductionPrompt} from './lib/knowledge-production/production-prompt-v1.mjs';
import {validateEnglishPrompt} from './lib/knowledge-production/english-prompt-v1.mjs';
import {buildCandidateRegistryRecord} from './lib/knowledge-production/candidate-builder-v1.mjs';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const expected=['KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004'];
const readiness=buildBfaArticleActivationReadiness(root,{bookCode:'BOOK-1',locale:'zh-Hans'});
assert.deepEqual(readiness.entries.filter(x=>x.state==='ARTICLE_READY').map(x=>x.nodeCode),expected);
const preface=readiness.entries.find(x=>x.nodeCode==='KN-PREFACE-004');assert(preface.blockers.includes('EXISTING_PUBLICATION_RECONCILIATION_FORBIDS_NEW_PUBLICATION'));
const plan=read('content/production/article-simplification/batches/BATCH-002/batch-plan.v1.json');assert.equal(plan.batchCode,'BATCH-002');assert.equal(plan.selection.selectedCount,3);assert.deepEqual(plan.entries.map(x=>x.nodeCode),expected);assert.equal(plan.governance.historicalProductionRoleRewritten,false);assert.equal(plan.governance.createsHumanDecisionAuthority,false);
const review=read('content/production/bilingual-final-approval/BATCH-002/review-data.json');assert.equal(review.summary.nodes,3);assert.equal(review.summary.localeCandidates,6);assert.equal(review.summary.articleReady,3);assert.equal(review.summary.blocked,0);assert.equal(review.summary.warnings,0);assert.equal(review.summary.pending,3);assert.equal(review.summary.finalApproved,0);assert.equal(review.summary.published,0);
for(const entry of review.entries){assert(entry.package);assert.equal(entry.package.automaticEvidence.status,'PASS');assert.equal(entry.package.publicationReadiness.state,'READY_FOR_FINAL_APPROVAL');assert.equal(entry.decisionState,'PENDING');assert.equal(entry.package.figure.state,'FIGURE_NOT_REQUIRED');assert(entry.package.figure.reason);assert.equal(entry.package.localeIdentity.identities.en.sourceAuthority,'BFA_PACKAGE_SCOPED_EN_IDENTITY_CANDIDATE_PENDING_TL_FINAL_APPROVAL');assert.equal(entry.package.localeIdentity.globalLocaleRegistryMutation,false);assert.equal(entry.package.automaticEvidence.authority.humanAcceptance,false);assert.equal(entry.package.pjaBrief.localeProjections.en.locale,'en');for(const locale of ['zh-Hans','en'])assert.equal(entry.package.automaticEvidence.byLocale[locale].status,'PASS');}
const candidateRegistry=read('content/knowledge/production/registry/candidate-registry.json');
for(const n of expected){
 const zBrief=read(`content/knowledge/production/briefs/zh-Hans/${n}-production-brief.v2.json`),eBrief=read(`content/knowledge/production/briefs/en/${n}-production-brief.en.v1.json`);
 const zPrompt=read(`content/knowledge/production/prompts/zh-Hans/${n}-production-prompt.v1.json`),ePrompt=read(`content/knowledge/production/prompts/en/${n}-production-prompt.en.v1.json`);
 const zc=read(`content/knowledge/production/candidates/zh-Hans/${n}/candidate.v1.json`),ec=read(`content/knowledge/production/candidates/en/${n}/candidate.v1.json`);
 const zpv=validateZhHansProductionPrompt(zPrompt,zBrief),epv=validateEnglishPrompt(ePrompt,eBrief);assert.equal(zpv.valid,true,JSON.stringify(zpv.errors));assert.equal(epv.valid,true,JSON.stringify(epv.errors));
 const zv=await validateZhHansCandidate(root,zc,{briefPath:`content/knowledge/production/briefs/zh-Hans/${n}-production-brief.v2.json`});const ev=await validateEnglishCandidate(root,ec,{briefPath:`content/knowledge/production/briefs/en/${n}-production-brief.en.v1.json`});assert.equal(zv.valid,true,JSON.stringify(zv.errors));assert.equal(ev.valid,true,JSON.stringify(ev.errors));
 const zRecord=candidateRegistry.records.find(x=>x.candidateCode===zc.candidateCode),eRecord=candidateRegistry.records.find(x=>x.candidateCode===ec.candidateCode);assert(zRecord,`${n}:ZH_CANDIDATE_REGISTRY_REQUIRED`);assert(eRecord,`${n}:EN_CANDIDATE_REGISTRY_REQUIRED`);assert.deepEqual(zRecord,buildCandidateRegistryRecord(zc,zPrompt));assert.deepEqual(eRecord,buildEnglishRegistryRecord(ec,ePrompt));
 assert.equal(zc.authority.humanReview,'not_reviewed');assert.equal(ec.authority.humanReview,'not_reviewed');assert.equal(zc.authority.publication,'not_published');assert.equal(ec.authority.publication,'not_published');
}
const roles={
 'KN-B1-P1-003':'FRAGMENT','KN-B1-P4-003':'FIGURE','KN-B1-P4-004':'MULTI_ASSET'
};
for(const [n,role] of Object.entries(roles)){const d=read(`content/knowledge/production-planning/production/wave1/decisions/${n.toLowerCase()}-production-decision-v1.json`);assert.equal(d.productionRole,role);}
const approvalRoot='content/production/bilingual-final-approval/BATCH-002/approvals';
const approvalFiles=fs.existsSync(approvalRoot)?fs.readdirSync(approvalRoot).filter(x=>x.endsWith('.json')).sort():[];
assert.ok(approvalFiles.length<=expected.length,'BATCH_002_APPROVAL_COUNT_OUT_OF_RANGE');
let approvedForPublication=0;
for(const file of approvalFiles){
  const approval=read(`${approvalRoot}/${file}`);
  assert.ok(expected.includes(approval.nodeCode),`${file}:UNEXPECTED_NODE_APPROVAL`);
  const pkg=read(`content/production/bilingual-final-approval/BATCH-002/packages/${approval.nodeCode}.v1.json`);
  assert.equal(approval.authorityType,'BILINGUAL_FINAL_PUBLICATION_APPROVAL',`${approval.nodeCode}:AUTHORITY_TYPE`);
  assert.equal(approval.reviewerCode,'TL',`${approval.nodeCode}:REVIEWER`);
  assert.equal(approvalIsCurrent(approval,pkg),true,`${approval.nodeCode}:STALE_FINAL_APPROVAL`);
  if(approval.decision==='approve_for_publication')approvedForPublication++;
}
const phase=approvalFiles.length===0?'READY_FOR_FINAL_APPROVAL':approvalFiles.length<expected.length?'FINAL_REVIEW_IN_PROGRESS':approvedForPublication===expected.length?'READY_FOR_PUBLICATION':'FINAL_REVIEW_DECIDED_NOT_ALL_APPROVED';
console.log('✓ Real BFA BATCH-002 production integrity passed: 3 nodes / 6 independent locale Candidates / 3 Complete Publication Packages.');
console.log('✓ All six Candidates have valid standard PJA prompts and exact Candidate Registry lineage; no orphan Candidate remains.');
console.log(`✓ BATCH-002 lifecycle: ${phase}; current package-scoped TL decisions ${approvalFiles.length}/3; approve_for_publication ${approvedForPublication}/3.`);
console.log('✓ Every existing TL Final Approval is exact-current-finalPackageDigest bound; no approval is stale or synthetic.');
console.log('✓ Historical FRAGMENT / FIGURE / MULTI_ASSET roles remain unchanged; successor ARTICLE projection is additive only.');
console.log('✓ KN-PREFACE-004 remains excluded because existing Published Article reconciliation explicitly forbids new publication.');
