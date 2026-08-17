import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const PROG_ROOT='content/production/bilingual-final-approval/progression-v2';
export const CORPUS=`${PROG_ROOT}/registries/canonical-production-corpus-v2.json`;
export const ORDER=`${PROG_ROOT}/registries/canonical-publication-order-v1.json`;
export const CURSORS=`${PROG_ROOT}/registries/per-book-publication-cursors-v1.json`;
export const BATCH_PLAN=`${PROG_ROOT}/plans/complete-batch-plan-v2.json`;
export const BATCH3_REVIEW=`${PROG_ROOT}/review/BATCH-003-c2-review-v1.json`;
export const BATCH3_READINESS=`${PROG_ROOT}/readiness/BATCH-003-c3-readiness-v1.json`;
export const BATCH3_DECISIONS=`${PROG_ROOT}/human-decisions/BATCH-003-c2-human-decisions-v1.json`;
export const BATCH3_C2_SUCCESSOR_DIR='content/knowledge/editorial/c2/successors/bfa-prog-v2';
export const BATCH3_MAPPING_APPROVAL=`${PROG_ROOT}/bindings/BATCH-003-successor-mapping-approval-v1.json`;
const abs=(root,rel)=>path.join(root,rel);
const exists=(root,rel)=>fs.existsSync(abs(root,rel));
const read=(root,rel)=>JSON.parse(fs.readFileSync(abs(root,rel),'utf8'));
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
export const stableJson=v=>`${JSON.stringify(stable(v),null,2)}\n`;

export function loadProgressionPlan(root){return read(root,BATCH_PLAN);}
export function scheduledBatch(root,batchCode){return loadProgressionPlan(root).batches.find(x=>x.batchCode===batchCode)??null;}
export function publishedNodeSet(root){
 const set=new Set();
 for(const rel of ['content/knowledge/production/registry/publication-registry.json','content/knowledge/public/visual-article-release.json','content/knowledge/public/published-articles.json']){
  if(!exists(root,rel))continue; for(const r of read(root,rel).records??[])if(r?.nodeCode)set.add(r.nodeCode);
 }
 return set;
}
export function currentProgressionBatch(root,{bookCode=null}={}){
 const published=publishedNodeSet(root); const plan=loadProgressionPlan(root);
 for(const b of plan.batches){
  if(bookCode&&b.bookCode!==bookCode)continue;
  const dmap=decisionMap(root,b.batchCode);
  // An explicit TL defer resolves the node for the current publication cursor
  // without creating C2/Candidate/publication authority. The deferred node is
  // preserved for a later governed backlog/re-entry decision.
  if((b.nodeCodes??[]).some(n=>!published.has(n)&&dmap.get(n)?.decision!=='defer'))return b;
 }
 return null;
}
export function decisionMap(root,batchCode='BATCH-003'){
 const rel=batchCode==='BATCH-003'?BATCH3_DECISIONS:`${PROG_ROOT}/human-decisions/${batchCode}-c2-human-decisions-v1.json`;
 if(!exists(root,rel))return new Map();
 const j=read(root,rel); return new Map((j.decisions??[]).map(x=>[x.nodeCode,x]));
}
export function buildProgressionReadiness(root,batchCode='BATCH-003'){
 const batch=scheduledBatch(root,batchCode); if(!batch)throw new Error(`Unknown progression batch ${batchCode}`);
 const planReview=batchCode==='BATCH-003'?read(root,BATCH3_REVIEW):null;
 if(!planReview)throw new Error(`${batchCode} review package is not materialized yet`);
 const dmap=decisionMap(root,batchCode); const published=publishedNodeSet(root);
 const entries=planReview.entries.map(e=>{
  const d=dmap.get(e.nodeCode)??null;
  if(d?.decision==='defer') return {nodeCode:e.nodeCode,state:'DEFERRED',blockers:[],mappingReady:false,c2Frozen:false,publicationReady:false,progressionResolved:true,humanDecision:'defer'};
  const mappingReady=e.mapping.mappingDecisionRequired?d?.mappingDecision==='approve':e.mapping.state==='KAU_R3_HUMAN_APPROVED';
  const c2Frozen=d?.decision==='freeze_approved';
  const blockers=[];
  if(published.has(e.nodeCode))blockers.push('ARTICLE_ALREADY_PUBLISHED');
  if(!mappingReady)blockers.push('MAPPING_AUTHORITY_NOT_READY');
  if(!c2Frozen)blockers.push(d?.decision==='revise'?'TL_C2_REVISION_REQUIRED':'TL_C2_FREEZE_REQUIRED');
  const productionReady=blockers.length===0;
  return {nodeCode:e.nodeCode,state:productionReady?'PRODUCTION_READY':'BLOCKED',blockers,mappingReady,c2Frozen,publicationReady:productionReady,progressionResolved:productionReady,humanDecision:d?.decision??null};
 });
 const ready=entries.filter(x=>x.state==='PRODUCTION_READY').length;
 const deferred=entries.filter(x=>x.state==='DEFERRED').length;
 const unresolved=entries.length-ready-deferred;
 return {schemaVersion:'PHI-OS-BFA-PROG-BATCH-C3-READINESS-v1.1.0',work:'BFA-PROG-6',batchCode,status:unresolved===0?(deferred?'PRODUCTION_READY_WITH_EXPLICIT_DEFER':'PRODUCTION_READY'):'BLOCKED_AWAITING_TL_C2_REVIEW',summary:{nodeCount:entries.length,productionReadyCount:ready,deferredCount:deferred,unresolvedCount:unresolved,blockedCount:unresolved},entries,authorityBoundary:{c3IsDerivedReadinessOnly:true,c3DoesNotCreateHumanDecision:true,explicitHumanDeferMayResolveCursorWithoutCreatingCandidateAuthority:true,deferDoesNotEqualApproval:true,oldWave1PlanWaveChoreographyRequired:false,bfaFinalApprovalCreated:false}};
}
export function writeProgressionReadiness(root,batchCode='BATCH-003'){
 const out=buildProgressionReadiness(root,batchCode); const rel=batchCode==='BATCH-003'?BATCH3_READINESS:`${PROG_ROOT}/readiness/${batchCode}-c3-readiness-v1.json`;
 fs.mkdirSync(path.dirname(abs(root,rel)),{recursive:true}); fs.writeFileSync(abs(root,rel),stableJson(out)); return {out,rel};
}
export function buildCompatibleBatchPlan(root,batchCode='BATCH-003'){
 const scheduled=scheduledBatch(root,batchCode); if(!scheduled)throw new Error(`Unknown batch ${batchCode}`);
 const readiness=buildProgressionReadiness(root,batchCode);
 if(readiness.summary.unresolvedCount!==0)return {plan:null,readiness};
 const readySet=new Set(readiness.entries.filter(x=>x.state==='PRODUCTION_READY').map(x=>x.nodeCode));
 const deferredNodeCodes=readiness.entries.filter(x=>x.state==='DEFERRED').map(x=>x.nodeCode);
 const selectedNodeCodes=scheduled.nodeCodes.filter(n=>readySet.has(n));
 const order=read(root,ORDER); const map=new Map(order.records.map(x=>[x.nodeCode,x]));
 const entries=selectedNodeCodes.map((n,i)=>{const o=map.get(n);return {batchIndex:i+1,nodeCode:n,bookCode:o.bookCode,partCode:o.partCode,locale:'zh-Hans',title:o.titleZhHans,readinessState:'ARTICLE_READY',readinessBlockers:[],readinessAuthorityEvidence:{progressionVersion:'BFA_PROG_V2_1_DEFER_AWARE',c2HumanDecision:BATCH3_DECISIONS,mappingAuthority:evidenceForMapping(root,n)}}});
 const existingPlanRel=`content/production/article-simplification/batches/${batchCode}/batch-plan.v1.json`; const existingCreatedAt=exists(root,existingPlanRel)?read(root,existingPlanRel).createdAt:null;
 const base={schemaVersion:'PHI-OS-APS-3-BFA-PROGRESSION-v2.1.0',work:'APS-3',status:'READY_FOR_APS_4_CANDIDATE_ORCHESTRATION',implementationBaselineCommit:'4ca882d95f27b262bc21693a65eeff436a408905',contractReference:`${PROG_ROOT}/contracts/bfa-prog-0-corpus-reconciliation-v1.json`,batchCode,createdAt:existingCreatedAt??new Date().toISOString(),request:{bookCode:scheduled.bookCode,locale:'zh-Hans',requestedCount:scheduled.maximumNewArticles,requestedCountMeaning:'fixed_progression_window_maximum_with_explicit_human_defer_shortfall'},sourceReadiness:{work:'BFA-PROG-6',readyCount:readiness.summary.productionReadyCount,deferredCount:readiness.summary.deferredCount},selection:{availableReadyCount:selectedNodeCodes.length,selectedCount:selectedNodeCodes.length,shortfallCount:deferredNodeCodes.length,explicitDeferredCount:deferredNodeCodes.length,deferredNodeCodes,unselectedReadyCount:0,downstreamPjaWaveMaximum:24,chunks:[{chunkCode:'CHUNK-001',maximum:24,nodeCodes:selectedNodeCodes}]},entries,governance:{nonAuthoritativeOrchestrationPlan:true,canonicalOrderLocked:true,readyNodeLeapfrogForbidden:true,explicitHumanDeferResolvesCurrentCursor:true,deferCreatesCandidateAuthority:false,deferCreatesPublicationAuthority:false,humanDecisionAuthorityCreated:false,candidateCreated:false,publicationCreated:false},nextWork:'APS-4_CANDIDATE_ORCHESTRATION'};
 return {plan:{...base,batchDigest:`sha256:${sha(stable(base))}`},readiness};
}
function evidenceForMapping(root,nodeCode){
 const review=read(root,BATCH3_REVIEW); const e=review.entries.find(x=>x.nodeCode===nodeCode); if(!e)return null;
 return e.mapping.mappingDecisionRequired?BATCH3_MAPPING_APPROVAL:'content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json';
}
