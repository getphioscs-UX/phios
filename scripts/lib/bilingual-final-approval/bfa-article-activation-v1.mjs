import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const BFA_ARTICLE_ACTIVATION_CONTRACT='content/production/bilingual-final-approval/contracts/bfa-article-readiness-successor-v1.json';
const read=(root,rel)=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const exists=(root,rel)=>fs.existsSync(path.join(root,rel));
const digest=v=>`sha256:${crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex')}`;
const fileDigest=(root,rel)=>digest(fs.readFileSync(path.join(root,rel),'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'));
const c2Path=n=>`content/knowledge/editorial/c2/frozen/${n.toLowerCase()}.json`;
const c3Path=n=>`content/knowledge/editorial/c3/assessments/${n.toLowerCase()}-production-readiness.json`;
const readinessPath=n=>`content/knowledge/editorial/readiness/${n.toLowerCase()}-production-readiness.json`;

function publishedSet(root){
 const files=['content/knowledge/production/registry/publication-registry.json','content/knowledge/public/visual-article-release.json'];
 const set=new Set();
 for(const rel of files){if(!exists(root,rel))continue;const j=read(root,rel);for(const r of [...(j.records??[]),...(j.publications??[])]){if(r?.nodeCode&&(r?.status==='published'||r?.published===true||r?.decision==='publish'))set.add(`${r.nodeCode}:${r.locale??'zh-Hans'}`)}}
 return set;
}
function partFor(blueprint,nodeCode){return blueprint.parts.find(p=>(p.nodes??[]).includes(nodeCode))??null;}
export function buildBfaArticleActivationReadiness(root,{bookCode='BOOK-1',locale='zh-Hans'}={}){
 const nodes=read(root,'content/knowledge/registry/nodes.json').nodes??[];
 const localized=read(root,'content/knowledge/registry/localized-content.json').localizedContent??[];
 const blueprint=read(root,'content/knowledge/blueprints/book-1-knowledge-blueprint.json');
 const review=read(root,'content/knowledge/production-planning/review/wave1-c2-human-editorial-freeze-resolution-v1.json');
 const reviewMap=new Map((review.entries??[]).map(x=>[x.nodeCode,x]));
 const published=publishedSet(root); const entries=[];
 for(const node of nodes){
   const part=partFor(blueprint,node.nodeCode); if(!part||blueprint.bookCode!==bookCode)continue;
   const loc=localized.find(x=>x.nodeCode===node.nodeCode)?.locales?.[locale]??null;
   const c2rel=c2Path(node.nodeCode),c3rel=c3Path(node.nodeCode); const human=reviewMap.get(node.nodeCode)??null;
   const blockers=[];
   if(node.primaryAssetType!=='article')blockers.push('PRIMARY_ASSET_TYPE_NOT_ARTICLE');
   if(!c2rel||!exists(root,c2rel))blockers.push('C2_FROZEN_RECORD_MISSING');
   const c2=exists(root,c2rel)?read(root,c2rel):null;
   if(c2&&(c2.status!=='frozen'||c2.thesisState!=='frozen'||c2.boundaryState!=='frozen'||c2.humanFreezeState!=='approved'))blockers.push('C2_HUMAN_FREEZE_NOT_READY');
   if(!human||human.approvalState!=='human_approved')blockers.push('C2_HUMAN_EDITORIAL_APPROVAL_MISSING');
   if(human?.manuscriptMappingReview?.humanVerified!==true)blockers.push('MANUSCRIPT_MAPPING_HUMAN_VERIFICATION_REQUIRED');
   if(!exists(root,c3rel))blockers.push('C3_ASSESSMENT_MISSING');
   const c3=exists(root,c3rel)?read(root,c3rel):null;
   if(c3&&(c3.status!=='production_ready'||c3.productionReady!==true||c3.blocking?.length))blockers.push('C3_PRODUCTION_NOT_READY');
   if(c3?.authority?.existingPublicationReconciliation && c3.authority.existingPublicationReconciliation!=='NO_EXISTING_PUBLICATION')blockers.push('EXISTING_PUBLICATION_RECONCILIATION_FORBIDS_NEW_PUBLICATION');
   if(!loc?.slug||!loc?.displayQuestion)blockers.push('ZH_HANS_LOCALE_NOT_READY');
   if(published.has(`${node.nodeCode}:zh-Hans`)||published.has(`${node.nodeCode}:en`))blockers.push('ARTICLE_ALREADY_PUBLISHED_FOR_LOCALE');
   const eligible=blockers.length===0;
   entries.push({nodeCode:node.nodeCode,bookCode,partCode:part.partCode,locale,title:blueprint.nodes.find(x=>x.nodeCode===node.nodeCode)?.titleZhHans??loc?.displayTitle??loc?.displayQuestion??node.nodeCode,state:eligible?'ARTICLE_READY':'BLOCKED',blockers,authorityEvidence:{canonicalNode:'content/knowledge/registry/nodes.json',c2FrozenRecord:exists(root,c2rel)?c2rel:null,c2Digest:exists(root,c2rel)?fileDigest(root,c2rel):null,c3Assessment:exists(root,c3rel)?c3rel:null,c3Digest:exists(root,c3rel)?fileDigest(root,c3rel):null,humanEditorialResolution:human?'content/knowledge/production-planning/review/wave1-c2-human-editorial-freeze-resolution-v1.json':null,manuscriptMappingHumanVerified:human?.manuscriptMappingReview?.humanVerified===true,localeRegistry:'content/knowledge/registry/localized-content.json',successorContract:BFA_ARTICLE_ACTIVATION_CONTRACT,historicalProductionRolePreserved:true,successorArticleProjection:'ADDITIVE_OPERATOR_REQUEST'}});
 }
 const ready=entries.filter(x=>x.state==='ARTICLE_READY');
 const base={schemaVersion:'PHI-OS-BFA-ARTICLE-ACTIVATION-READINESS-v1.0.0',work:'BFA-BATCH2-ARTICLE-READINESS-ACTIVATION',bookCode,locale,entries,summary:{total:entries.length,readyCount:ready.length,blockedCount:entries.length-ready.length},governance:{canonicalAuthorityCreated:false,c2OrC3Mutated:false,historicalProductionRoleRewritten:false,humanPublicationApprovalCreated:false}};
 return {...base,readinessDigest:digest(base)};
}
export function buildSuccessorBatchPlan(root,{bookCode='BOOK-1',locale='zh-Hans',count=30,batchCode='BATCH-002',createdAt=null}={}){
 const readiness=buildBfaArticleActivationReadiness(root,{bookCode,locale}); const available=readiness.entries.filter(x=>x.state==='ARTICLE_READY'); const selected=available.slice(0,count);
 const entries=selected.map((e,i)=>({batchIndex:i+1,nodeCode:e.nodeCode,bookCode:e.bookCode,partCode:e.partCode,locale:e.locale,title:e.title,readinessState:e.state,readinessBlockers:[],readinessAuthorityEvidence:e.authorityEvidence}));
 const base={schemaVersion:'PHI-OS-APS-3-BFA-SUCCESSOR-ARTICLE-BATCH-PLAN-v1.0.0',work:'APS-3',status:entries.length?'READY_FOR_APS_4_CANDIDATE_ORCHESTRATION':'NO_ARTICLE_READY_NODES',implementationBaselineCommit:'3b5ff152d1cdfe479ed4daf7c772e3faa926dc17',contractReference:BFA_ARTICLE_ACTIVATION_CONTRACT,batchCode,createdAt:createdAt??new Date().toISOString(),request:{bookCode,locale,requestedCount:count,requestedCountMeaning:'maximum_not_quota'},sourceReadiness:{work:readiness.work,schemaVersion:readiness.schemaVersion,readinessDigest:readiness.readinessDigest,readyStateConsumed:'ARTICLE_READY',readyCount:readiness.summary.readyCount},selection:{availableReadyCount:available.length,selectedCount:entries.length,shortfallCount:Math.max(0,count-entries.length),unselectedReadyCount:Math.max(0,available.length-entries.length),downstreamPjaWaveMaximum:24,chunks:entries.length?[{chunkCode:'CHUNK-001',maximum:24,nodeCodes:entries.map(x=>x.nodeCode)}]:[]},entries,governance:{nonAuthoritativeOrchestrationPlan:true,consumesHumanGovernedC2C3AndMappingOnly:true,historicalProductionRoleRewritten:false,createsCanonicalKnowledgeAuthority:false,createsHumanDecisionAuthority:false,createsCandidate:false,invokesProvider:false,createsPublication:false,countIsMaximumNotQuota:true},nextWork:'APS-4_CANDIDATE_ORCHESTRATION'};
 return {...base,batchDigest:digest(base)};
}
export function readinessFilePath(nodeCode){return readinessPath(nodeCode);}
