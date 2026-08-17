import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const AUTO_ROOT='content/production/bilingual-final-approval/progression-v2/auto-c2c3';
export const AUTO_C2_CONTRACT=`${AUTO_ROOT}/contracts/automatic-c2-contract-v2.json`;
export const AUTO_C3_CONTRACT=`${AUTO_ROOT}/contracts/deterministic-c3-readiness-contract-v2.json`;
export const AUTO_EXCEPTION_CONTRACT=`${AUTO_ROOT}/contracts/exception-escalation-contract-v1.json`;
export const AUTO_HISTORICAL_CONTRACT=`${AUTO_ROOT}/contracts/historical-compatibility-contract-v1.json`;
const PLAN='content/production/bilingual-final-approval/progression-v2/plans/complete-batch-plan-v2.json';
const ORDER='content/production/bilingual-final-approval/progression-v2/registries/canonical-publication-order-v1.json';
const NODES='content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json';
const BINDINGS='content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json';
const INVENTORIES={
 'BOOK-1':'content/knowledge/manuscripts/extraction/book-1-full-section-inventory-v1.json',
 'BOOK-2':'content/knowledge/manuscripts/extraction/book-2-full-section-inventory-v1.json'
};
const BOOK2_COVERAGE='content/knowledge/reconciliation/kau-r4/book-2-canonical-coverage-v1.json';
const BOOK2_HUMAN_RESOLUTION='content/knowledge/reconciliation/kau-r4/kau-r4-human-resolution-v1.json';
const KSAR='content/knowledge/review/ksar-human-pdf-extract-review-resolution-v1.json';
const REPAIRS='content/knowledge/review/ksar-r4-repair-final-verification-v1.json';
const REVIEWED_CORPUS='content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json';
const abs=(root,rel)=>path.join(root,rel);
const exists=(root,rel)=>fs.existsSync(abs(root,rel));
const read=(root,rel)=>JSON.parse(fs.readFileSync(abs(root,rel),'utf8'));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
export const stableJson=v=>`${JSON.stringify(stable(v),null,2)}\n`;
export const digest=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stableJson(v)).digest('hex');
const write=(root,rel,v)=>{const p=abs(root,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,stableJson(v));};
const batchNumber=b=>Number(String(b).replace(/^BATCH-/,''));
export const isAutomaticC2C3Batch=batchCode=>batchNumber(batchCode)>=4;
export const autoC2Path=batchCode=>`${AUTO_ROOT}/c2/${batchCode}-automatic-c2-v2.json`;
export const autoC3Path=batchCode=>`${AUTO_ROOT}/c3/${batchCode}-deterministic-c3-v2.json`;
export const autoExceptionPath=batchCode=>`${AUTO_ROOT}/exceptions/${batchCode}-exception-registry-v1.json`;

function ksarReviewMap(root){
 const j=read(root,KSAR); const rows=j.decisions??j.records??[]; return new Map(rows.map(x=>[x.sectionCode,x]));
}
function repairMap(root){
 const j=read(root,REPAIRS); const rows=j.records??j.verifications??j.entries??[]; return new Map(rows.map(x=>[x.sectionCode,x]));
}
function effectiveSourceReview(root,sectionCode,mappingSha){
 const direct=ksarReviewMap(root).get(sectionCode)??null;
 const repair=repairMap(root).get(sectionCode)??null;
 const directAccepted=['APPROVE_TEXT','APPROVE_WITH_FIGURE_EXCLUSION'].includes(direct?.decision);
 const repairAccepted=repair?.finalVerification==='ACCEPT_REPAIR';
 if(repairAccepted)return {ready:true,reviewMode:'ACCEPTED_REPAIR',decision:repair.repairDecision??direct?.decision??null,effectiveReviewedTextSha256:repair.reviewedTextSha256,sourceTextSha256:repair.sourceTextSha256??mappingSha,evidence:REPAIRS};
 if(directAccepted)return {ready:true,reviewMode:'DIRECT_HUMAN_APPROVAL',decision:direct.decision,effectiveReviewedTextSha256:direct.sourceDigest??mappingSha,sourceTextSha256:direct.sourceDigest??mappingSha,evidence:KSAR};
 return {ready:false,reviewMode:'NOT_ACCEPTED',decision:direct?.decision??null,effectiveReviewedTextSha256:null,sourceTextSha256:mappingSha,evidence:direct?KSAR:null};
}
function acceptedMappingAuthority(value){return /^KAU-R\d+_HUMAN_ACCEPTED_/.test(String(value??''));}
function compositeCoverageMap(root,bookCode){
 if(bookCode!=='BOOK-2'||!exists(root,BOOK2_COVERAGE)||!exists(root,BOOK2_HUMAN_RESOLUTION))return new Map();
 const coverage=read(root,BOOK2_COVERAGE);const resolution=read(root,BOOK2_HUMAN_RESOLUTION);
 const accepted=new Set((resolution.compositeSourceDecisions??[]).filter(x=>x.decision==='ACCEPT_COMPOSITE_SOURCE_COVERAGE').map(x=>x.nodeCode));
 return new Map((coverage.records??[]).filter(x=>x.coverageType==='COMPOSITE_SOURCE_COVERAGE'&&x.humanAcceptance==='ACCEPTED'&&accepted.has(x.nodeCode)).map(x=>[x.nodeCode,x]));
}
function authorityInputs(root,batchCode){
 const plan=read(root,PLAN); const batch=plan.batches.find(x=>x.batchCode===batchCode); if(!batch)throw new Error(`AUTO_C2C3_UNKNOWN_BATCH:${batchCode}`);
 const order=read(root,ORDER); const orderMap=new Map(order.records.map(x=>[x.nodeCode,x]));
 const nodes=read(root,NODES); const nodeMap=new Map(nodes.nodes.map(x=>[x.nodeCode,x]));
 const bindings=read(root,BINDINGS); const primaries=new Map();
 for(const b of bindings.records.filter(x=>x.mappingRole==='PRIMARY')){const a=primaries.get(b.nodeCode)??[];a.push(b);primaries.set(b.nodeCode,a);}
 const inventoryRel=INVENTORIES[batch.bookCode]??null; const inventory=inventoryRel&&exists(root,inventoryRel)?read(root,inventoryRel):null; const sectionMap=new Map((inventory?.sections??[]).map(x=>[x.sectionCode,x]));
 const corpus=read(root,REVIEWED_CORPUS); const corpusRecord=corpus.records.find(x=>x.bookCode===batch.bookCode&&x.locale==='zh-Hans')??null;
 const composites=compositeCoverageMap(root,batch.bookCode);
 return {batch,orderMap,nodeMap,primaries,sectionMap,corpusRecord,inventoryRel,composites};
}
function deriveEntry(root,batchCode,nodeCode,input){
 const {orderMap,nodeMap,primaries,sectionMap,corpusRecord,inventoryRel,composites}=input;
 const exceptions=[]; const o=orderMap.get(nodeCode); const n=nodeMap.get(nodeCode); const maps=primaries.get(nodeCode)??[]; const composite=composites.get(nodeCode)??null;
 if(!o)exceptions.push('CANONICAL_PUBLICATION_ORDER_MISSING');
 if(!n)exceptions.push('CANONICAL_NODE_MISSING');
 if(n&&['deprecated','superseded'].includes(String(n.registryStatus).toLowerCase()))exceptions.push('NODE_INACTIVE_OR_SUPERSEDED');
 if(!inventoryRel)exceptions.push('BOOK_MANUSCRIPT_INVENTORY_UNAVAILABLE');
 const acceptedMaps=maps.filter(m=>m.status==='APPROVED'&&m.authorityStatus==='APPROVED'&&acceptedMappingAuthority(m.authority));
 if(maps.length&&acceptedMaps.length!==maps.length)exceptions.push('MAPPING_NOT_HUMAN_ACCEPTED');
 if(maps.length===0&&!composite)exceptions.push('HUMAN_ACCEPTED_SOURCE_COVERAGE_MISSING');
 // Human-accepted KAU authorities are versioned by book/reconciliation wave.
 // A later KAU-R4 (or future KAU-Rn) Human Accepted authority is not weaker than
 // KAU-R3 merely because the stage number differs. Multiple accepted PRIMARY
 // EXPANDED_MATCH bindings and explicitly accepted COMPOSITE_SOURCE_COVERAGE
 // are already upstream Human mapping/coverage decisions, so AUTO-C2 composes
 // them without inventing a new Human C2 approval.
 const sourceBindings=acceptedMaps.map(m=>{const section=sectionMap.get(m.sectionCode);if(!section)exceptions.push('SOURCE_SECTION_INVENTORY_MISSING');const sourceReview=effectiveSourceReview(root,m.sectionCode,m.sectionTextSha256);if(!sourceReview?.ready)exceptions.push('SOURCE_SECTION_NOT_HUMAN_REVIEWED');return {mappingCode:m.mappingCode,sectionCode:m.sectionCode,mappingRole:m.mappingRole,reconciliationDecision:m.reconciliationDecision,mappingAuthority:m.authority,mappingAcceptedDate:m.acceptedDate,mappingSectionTextSha256:m.sectionTextSha256,sectionHeading:section?.heading??null,startPage:section?.startPage??null,endPage:section?.endPage??null,sourceReview};});
 if(composite){for(const [i,sectionCode] of (composite.supportingSectionCodes??[]).entries()){const section=sectionMap.get(sectionCode);if(!section)exceptions.push('SOURCE_SECTION_INVENTORY_MISSING');const sectionSha=section?.textSha256??null;const sourceReview=effectiveSourceReview(root,sectionCode,sectionSha);if(!sourceReview?.ready)exceptions.push('SOURCE_SECTION_NOT_HUMAN_REVIEWED');sourceBindings.push({mappingCode:`KAU-R4-COMPOSITE-${nodeCode}-${String(i+1).padStart(2,'0')}`,sectionCode,mappingRole:'SUPPORTING_COMPOSITE',reconciliationDecision:'ACCEPT_COMPOSITE_SOURCE_COVERAGE',mappingAuthority:'KAU-R4_HUMAN_ACCEPTED_COMPOSITE_SOURCE_COVERAGE',mappingAcceptedDate:'2026-08-13',mappingSectionTextSha256:sectionSha,sectionHeading:section?.heading??null,startPage:section?.startPage??null,endPage:section?.endPage??null,sourceReview});}}
 if(!corpusRecord||corpusRecord.humanReadabilityStatus!=='HUMAN_REVIEW_COMPLETE')exceptions.push('REVIEWED_MANUSCRIPT_CORPUS_NOT_READY');
 const sourceBinding=sourceBindings[0]??null;
 const canonical={nodeCode,titleZhHans:o?.titleZhHans??nodeCode,canonicalQuestionKey:o?.canonicalQuestionKey??n?.canonicalQuestionKey??null,nodeType:n?.nodeType??null,knowledgeLevel:n?.knowledgeLevel??null,bookCode:o?.bookCode??m?.bookCode??null,partCode:o?.partCode??m?.partCode??null};
 const boundary={mustEstablish:[canonical.titleZhHans],includedScope:[`围绕「${canonical.titleZhHans}」所指向的机制与其在相邻 Canonical Nodes 中的关系展开。`],excludedScope:['不把公共文章写成书稿章节复制品。','不从该节点直接生成个案诊断、专业判断或未经来源治理的外部事实。'],publicRequiredDistinctions:[],internalAuthoringConstraints:['Canonical Node remains the knowledge/retrieval/rule lineage unit; public Article may compose multiple adjacent nodes.','Specific external factual claims require governed source support when introduced.','Case-specific diagnosis and professional judgment are outside normal public Article authority.'],fixedGovernanceHeadingRequired:false};
 const derivationInput={batchCode,nodeCode,canonical,sourceBindings,reviewedCorpusCode:corpusRecord?.reviewedCorpusCode??null,reviewedRecordsSha256:corpusRecord?.reviewedRecordsSha256??null,derivationVersion:'BFA_AUTO_C2_V2'};
 const state=exceptions.length?'HUMAN_EXCEPTION_REQUIRED':'AUTO_C2_FROZEN';
 return {nodeCode,state,exceptions,canonicalProjection:canonical,sourceBinding,sourceBindings,sourceBindingCount:sourceBindings.length,boundary,derivation:{mode:'DETERMINISTIC_SOURCE_BOUNDARY_PROJECTION',version:'2.0.0',inputDigest:`sha256:${digest(derivationInput)}`,outputDigest:null}};
}
export function buildAutomaticC2(root,batchCode){
 if(!isAutomaticC2C3Batch(batchCode))throw new Error(`AUTO_C2C3_HISTORICAL_BATCH_FORBIDDEN:${batchCode}`);
 const input=authorityInputs(root,batchCode); const entries=input.batch.nodeCodes.map(n=>deriveEntry(root,batchCode,n,input));
 for(const e of entries){const c=structuredClone(e);c.derivation.outputDigest=null;e.derivation.outputDigest=`sha256:${digest(c)}`;}
 const exceptionCount=entries.filter(x=>x.state!=='AUTO_C2_FROZEN').length;
 const base={schemaVersion:'PHI-OS-BFA-AUTOMATIC-C2-v2.0.0',work:'BFA-AUTO-C2C3-1',batchCode,status:exceptionCount?'EXCEPTION_ESCALATION_REQUIRED':'AUTO_C2_COMPLETE',nodeCount:entries.length,automaticFrozenCount:entries.length-exceptionCount,exceptionCount,entries,authorityBoundary:{createsCanonicalMeaning:false,rewritesManuscriptAuthority:false,rewritesKauMappingAuthority:false,humanEditorialApprovalSynthesized:false,sourceDigestBound:true,sourceOrMappingChangeStalesProjection:true,bfaFinalApprovalCreated:false}};
 return {...base,c2Digest:`sha256:${digest(base)}`};
}
export function buildExceptionRegistry(root,batchCode,c2=null){
 c2=c2??buildAutomaticC2(root,batchCode); const records=c2.entries.filter(x=>x.exceptions.length).map(x=>({nodeCode:x.nodeCode,reasons:x.exceptions,state:'HUMAN_REVIEW_REQUIRED',humanAuthorityRequiredFor:['SOURCE_OR_MAPPING_EXCEPTION_RESOLUTION'],doesNotGrantC2:true,doesNotGrantC3:true,doesNotGrantPublication:true}));
 const base={schemaVersion:'PHI-OS-BFA-AUTO-C2C3-EXCEPTION-REGISTRY-v1.0.0',work:'BFA-AUTO-C2C3-3',batchCode,status:records.length?'HUMAN_EXCEPTION_REVIEW_REQUIRED':'NO_EXCEPTION',recordCount:records.length,records,governance:{normalPathHumanReviewRequired:false,exceptionOnlyHumanEscalation:true,bfaFinalPublicationReviewUnaffected:true}};
 return {...base,registryDigest:`sha256:${digest(base)}`};
}
export function buildDeterministicC3(root,batchCode,c2=null,exceptions=null){
 c2=c2??buildAutomaticC2(root,batchCode); exceptions=exceptions??buildExceptionRegistry(root,batchCode,c2); const plan=read(root,PLAN); const batch=plan.batches.find(x=>x.batchCode===batchCode); const unitPlan=new Map((batch.articleUnitCodes??[]).map(code=>[code,true]));
 const exceptionSet=new Set(exceptions.records.map(x=>x.nodeCode));
 const entries=c2.entries.map(e=>{const blockers=[];if(e.state!=='AUTO_C2_FROZEN')blockers.push('AUTO_C2_NOT_FROZEN');if(exceptionSet.has(e.nodeCode))blockers.push('EXCEPTION_ESCALATION_UNRESOLVED');const sourceReady=(e.sourceBindings??[]).length>0&&(e.sourceBindings??[]).every(x=>x.sourceReview?.ready);if(!sourceReady)blockers.push('SOURCE_NOT_READY');const ready=blockers.length===0;return {nodeCode:e.nodeCode,state:ready?'PRODUCTION_READY':'BLOCKED',blockers,mappingReady:(e.sourceBindings??[]).length>0,c2Ready:e.state==='AUTO_C2_FROZEN',sourceReady,sourceBindingCount:e.sourceBindingCount??(e.sourceBindings??[]).length,compositionPlanned:unitPlan.size>0,publicationReady:ready,humanC3DecisionRequired:false};});
 const ready=entries.filter(x=>x.state==='PRODUCTION_READY').length; const blocked=entries.length-ready;
 const base={schemaVersion:'PHI-OS-BFA-DETERMINISTIC-C3-v2.0.0',work:'BFA-AUTO-C2C3-2',batchCode,status:blocked?'BLOCKED_BY_EXCEPTION':'PRODUCTION_READY',summary:{nodeCount:entries.length,productionReadyCount:ready,blockedCount:blocked,exceptionCount:exceptions.recordCount},entries,authorityBoundary:{c3IsReadinessCalculationOnly:true,c3CreatesEditorialMeaning:false,c3HumanApprovalSynthesized:false,c3CannotConvertMissingAuthorityToReady:true,bfaFinalApprovalCreated:false}};
 return {...base,c3Digest:`sha256:${digest(base)}`};
}
export function buildAutoC2C3State(root,batchCode){
 const c2=buildAutomaticC2(root,batchCode); const exceptions=buildExceptionRegistry(root,batchCode,c2); const c3=buildDeterministicC3(root,batchCode,c2,exceptions); return {c2,exceptions,c3};
}
export function writeAutoC2C3State(root,batchCode){
 const state=buildAutoC2C3State(root,batchCode); write(root,autoC2Path(batchCode),state.c2); write(root,autoExceptionPath(batchCode),state.exceptions); write(root,autoC3Path(batchCode),state.c3); return state;
}
