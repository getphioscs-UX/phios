import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CONTRACT_PATH='content/production/symbolic-method/contracts/tarot-production-sha-alignment-contract-v1.json';
export const MANIFEST_PATH='content/production/symbolic-method/deployment/tarot-production-runtime-source-manifest-v1.json';
export const EVIDENCE_PATH='content/production/symbolic-method/deployment/tarot-production-sha-alignment-evidence-v1.json';
export const ACCEPTANCE_PATH='content/production/symbolic-method/acceptance/tarot-production-sha-alignment-acceptance-v1.json';
export const FREEZE_PATH='content/production/symbolic-method/freeze/tarot-production-sha-alignment-freeze-v1.json';
export const SUCCESSOR_PATH='content/production/symbolic-method/reconciliation/tarot-production-sha-current-successor-v1.json';
export const CURRENT_CHECKER_SUCCESSOR_PATH='content/production/symbolic-method/reconciliation/tarot-current-checker-successor-v2.json';

export const stable=value=>JSON.stringify(sortDeep(value),null,2)+'\n';
export const sha256Bytes=value=>crypto.createHash('sha256').update(value).digest('hex');
export const canonicalText=value=>String(value).replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
export const sha256CanonicalText=value=>sha256Bytes(Buffer.from(canonicalText(value),'utf8'));
export const fileSha256=(root,relative)=>sha256Bytes(fs.readFileSync(path.join(root,relative)));
export const fileCanonicalTextSha256=(root,relative)=>sha256CanonicalText(fs.readFileSync(path.join(root,relative),'utf8'));
export const readJson=(root,relative)=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
export const writeJson=(root,relative,value)=>{const target=path.join(root,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,stable(value),'utf8');};

export function normalizeCloudflareDeployments(payload){
  const list=Array.isArray(payload)?payload:Array.isArray(payload?.result)?payload.result:Array.isArray(payload?.deployments)?payload.deployments:[];
  return list.map((raw,index)=>normalizeDeployment(raw,index)).filter(Boolean);
}
export function isFullGitSha(value){return /^[a-f0-9]{40}$/i.test(String(value??''));}
export function isSuccessfulStage(value){return ['success','successful','ready','active'].includes(String(value??'').toLowerCase());}
export function selectProductionDeployment(deployments,contract){
  const host=new URL(contract.cloudflare.productionUrl).host.toLowerCase();
  const candidates=deployments.filter(x=>!x.environment||x.environment===contract.cloudflare.environment).sort((a,b)=>Date.parse(b.createdOn||0)-Date.parse(a.createdOn||0));
  const alias=candidates.find(x=>x.aliasHosts.includes(host)&&isSuccessfulStage(x.stageStatus));
  if(alias)return {deployment:alias,selectionMode:'PRODUCTION_ALIAS_OWNER'};
  const successful=candidates.find(x=>isSuccessfulStage(x.stageStatus));
  return {deployment:successful??candidates[0]??null,selectionMode:successful?'NEWEST_SUCCESSFUL_PRODUCTION_DEPLOYMENT':candidates[0]?'NEWEST_PRODUCTION_DEPLOYMENT_NOT_SUCCESSFUL':'NONE'};
}
export function buildSourceManifest(root,baselineCommit){
  const remoteAssets=[
    ['publicHtml','readings/symbolic/index.html','/readings/symbolic/'],
    ['publicClient','assets/js/pages/symbolic-perspective.js','/assets/js/pages/symbolic-perspective.js'],
    ['publicCss','assets/css/symbolic-perspective.css','/assets/css/symbolic-perspective.css']
  ].map(([id,sourcePath,publicPath])=>({id,sourcePath,publicPath,canonicalTextSha256:fileCanonicalTextSha256(root,sourcePath)}));
  const governed=[
    'functions/api/symbolic-method-context.js',
    'functions/api/symbolic-method-execute.js',
    'functions/api/symbolic-method-execute-v2.js',
    'functions/tarot-product-runtime/tarot-execution-authority-v1.js',
    'content/interpretation/tarot/freeze/tarot-product-interpretation-freeze-v1.json',
    'content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json',
    'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json'
  ].map(sourcePath=>({sourcePath,sha256:fileSha256(root,sourcePath)}));
  return {schemaVersion:'PHI-OS-TAROT-PRODUCTION-RUNTIME-SOURCE-MANIFEST-v1.0.0',phase:'TPA-L',work:'L-W51-L-W56',baselineCommit,status:'FROZEN_RELEASE_CANDIDATE_RUNTIME_SOURCE',normalization:'UTF8_BOM_REMOVED_CRLF_AND_CR_NORMALIZED_TO_LF_FOR_REMOTE_TEXT_COMPARISON',remoteAssets,governedSource:governed,productionBoundary:{manifestIsDeploymentAuthority:false,manifestMayGrantRunAllowed:false}};
}
export function buildPendingArtifacts({baselineCommit,manifestSha256,phaseKFreezeSha256}){
  const evidence={schemaVersion:'PHI-OS-TAROT-PRODUCTION-SHA-ALIGNMENT-EVIDENCE-v1.0.0',phase:'TPA-L',work:'L-W51-L-W56',baselineCommit,status:'PENDING_LIVE_PRODUCTION_VERIFICATION',verifiedAt:null,repository:null,cloudflare:null,runtimeWitness:null,remoteAssets:null,checks:{exactProductionCommit:false,productionBranchMain:false,productionEnvironment:false,deploymentSuccessful:false,deploymentCommitClean:false,runtimeWitnessShaMatch:false,remoteRuntimeAssetsMatch:false,productionUrlReachable:false},alignment:{verified:false,deployedCommit:null,originMainCommit:null,exactCommitMatch:false},productionBoundary:{verifiedPersistenceProvider:false,productionCapabilityPromoted:false,publicRunAllowed:false}};
  const acceptance={schemaVersion:'PHI-OS-TAROT-PRODUCTION-SHA-ALIGNMENT-ACCEPTANCE-v1.0.0',phase:'TPA-L',work:'L-W56',baselineCommit,status:'PENDING_LIVE_PRODUCTION_SHA_ALIGNMENT',accepted:false,evidence:{path:EVIDENCE_PATH,verified:false},prerequisites:{phaseKLiveBrowserFreeze:{path:'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',sha256:phaseKFreezeSha256},sourceManifest:{path:MANIFEST_PATH,sha256:manifestSha256}},productionBoundary:{verifiedPersistenceProvider:false,productionCapabilityPromoted:false,publicRunAllowed:false,nextPhase:'PHASE_M_CAPABILITY_PROMOTION_AFTER_PERSISTENCE_AND_FINAL_AUTHORITY'}};
  const freeze={schemaVersion:'PHI-OS-TAROT-PRODUCTION-SHA-ALIGNMENT-FREEZE-v1.0.0',phase:'TPA-L',work:'L-W56',baselineCommit,status:'NOT_FROZEN_LIVE_ALIGNMENT_PENDING',alignmentVerified:false,artifacts:{sourceManifest:{path:MANIFEST_PATH,sha256:manifestSha256},phaseKFreeze:{path:'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',sha256:phaseKFreezeSha256}},productionBoundary:{verifiedPersistenceProvider:false,productionCapabilityPromoted:false,publicRunAllowed:false}};
  const successor={schemaVersion:'PHI-OS-TAROT-PRODUCTION-SHA-CURRENT-SUCCESSOR-v1.0.0',phase:'TPA-L',work:'L-W51-L-W56',baselineCommit,status:'CURRENT_PHASE_L_LIVE_PRODUCTION_SHA_VERIFICATION_PENDING',successorOf:{path:'content/production/symbolic-method/reconciliation/tarot-live-browser-current-successor-v1.json',preserved:true},current:{phaseKComplete:true,productionShaAlignment:false,deployedCommit:null,sourceManifest:{path:MANIFEST_PATH,sha256:manifestSha256}},productionBoundary:{verifiedPersistenceProvider:false,liveProductionShaAlignment:false,productionCapabilityPromoted:false,publicRunAllowed:false,clientMayGrantAuthority:false},nextAction:'RUN_VERIFY_TAROT_PRODUCTION_SHA_ALIGNMENT'};
  return {evidence,acceptance,freeze,successor};
}
export function buildVerifiedArtifacts({contract,manifest,evidence,phaseKFreezeSha256}){
  const evidenceSha256=sha256Bytes(Buffer.from(stable(evidence),'utf8'));
  const manifestSha256=sha256Bytes(Buffer.from(stable(manifest),'utf8'));
  const acceptance={schemaVersion:'PHI-OS-TAROT-PRODUCTION-SHA-ALIGNMENT-ACCEPTANCE-v1.0.0',phase:'TPA-L',work:'L-W56',baselineCommit:contract.baselineCommit,status:'ACCEPTED_EXACT_PRODUCTION_SHA_AND_RUNTIME_ASSET_ALIGNMENT',accepted:true,evidence:{path:EVIDENCE_PATH,sha256:evidenceSha256,verified:true,deployedCommit:evidence.alignment.deployedCommit},prerequisites:{phaseKLiveBrowserFreeze:{path:'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',sha256:phaseKFreezeSha256},sourceManifest:{path:MANIFEST_PATH,sha256:manifestSha256}},productionBoundary:{verifiedPersistenceProvider:false,productionCapabilityPromoted:false,publicRunAllowed:false,nextPhase:'PHASE_M_CAPABILITY_PROMOTION_AFTER_PERSISTENCE_AND_FINAL_AUTHORITY'}};
  const acceptanceSha256=sha256Bytes(Buffer.from(stable(acceptance),'utf8'));
  const freeze={schemaVersion:'PHI-OS-TAROT-PRODUCTION-SHA-ALIGNMENT-FREEZE-v1.0.0',phase:'TPA-L',work:'L-W56',baselineCommit:contract.baselineCommit,status:'FROZEN_EXACT_PRODUCTION_SHA_ALIGNMENT_VERIFIED',alignmentVerified:true,alignedProductionCommit:evidence.alignment.deployedCommit,artifacts:{sourceManifest:{path:MANIFEST_PATH,sha256:manifestSha256},phaseKFreeze:{path:'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',sha256:phaseKFreezeSha256},evidence:{path:EVIDENCE_PATH,sha256:evidenceSha256},acceptance:{path:ACCEPTANCE_PATH,sha256:acceptanceSha256}},productionBoundary:{verifiedPersistenceProvider:false,productionCapabilityPromoted:false,publicRunAllowed:false}};
  const freezeSha256=sha256Bytes(Buffer.from(stable(freeze),'utf8'));
  const successor={schemaVersion:'PHI-OS-TAROT-PRODUCTION-SHA-CURRENT-SUCCESSOR-v1.0.0',phase:'TPA-L',work:'L-W51-L-W56',baselineCommit:contract.baselineCommit,status:'CURRENT_PRODUCTION_SHA_ALIGNED_PERSISTENCE_AND_PROMOTION_PENDING',successorOf:{path:'content/production/symbolic-method/reconciliation/tarot-live-browser-current-successor-v1.json',preserved:true},current:{phaseKComplete:true,productionShaAlignment:true,deployedCommit:evidence.alignment.deployedCommit,verifiedAt:evidence.verifiedAt,sourceManifest:{path:MANIFEST_PATH,sha256:manifestSha256},acceptance:{path:ACCEPTANCE_PATH,sha256:acceptanceSha256},freeze:{path:FREEZE_PATH,sha256:freezeSha256}},productionBoundary:{verifiedPersistenceProvider:false,liveProductionShaAlignment:true,productionCapabilityPromoted:false,publicRunAllowed:false,clientMayGrantAuthority:false},nextAction:'PHASE_M_VERIFY_PERSISTENCE_AND_PROMOTE_CAPABILITY_WITH_FINAL_SERVER_AUTHORITY'};
  return {acceptance,freeze,successor};
}
function normalizeDeployment(raw,index){
  if(!raw||typeof raw!=='object')return null;
  const trigger=raw.deployment_trigger?.metadata??raw.deploymentTrigger?.metadata??{};
  const aliases=[...(Array.isArray(raw.aliases)?raw.aliases:[]),raw.url].filter(Boolean);
  const aliasHosts=aliases.map(value=>{try{return new URL(value).host.toLowerCase();}catch{return String(value).replace(/^https?:\/\//,'').replace(/\/$/,'').toLowerCase();}}).filter(Boolean);
  return {index,id:raw.id??null,shortId:raw.short_id??raw.shortId??null,projectName:raw.project_name??raw.projectName??null,environment:raw.environment??null,url:raw.url??null,aliases:Array.isArray(raw.aliases)?raw.aliases:[],aliasHosts,createdOn:raw.created_on??raw.createdOn??null,modifiedOn:raw.modified_on??raw.modifiedOn??null,stageName:raw.latest_stage?.name??raw.latestStage?.name??null,stageStatus:raw.latest_stage?.status??raw.latestStage?.status??null,triggerType:raw.deployment_trigger?.type??raw.deploymentTrigger?.type??null,branch:trigger.branch??raw.branch??null,commitHash:trigger.commit_hash??trigger.commitHash??raw.commit_hash??raw.commitHash??null,commitDirty:trigger.commit_dirty??trigger.commitDirty??raw.commit_dirty??raw.commitDirty??null};
}
function sortDeep(value){if(Array.isArray(value))return value.map(sortDeep);if(value&&typeof value==='object'){return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sortDeep(value[k])]));}return value;}
