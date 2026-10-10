import fs from 'node:fs';
import path from 'node:path';
import {buildSourceManifest as buildV1,fileSha256,fileCanonicalTextSha256,normalizeCloudflareDeployments,selectProductionDeployment,isFullGitSha,isSuccessfulStage,stable,sha256Bytes,canonicalText,sha256CanonicalText,readJson,writeJson} from './production-sha-alignment-v1.mjs';
export {fileSha256,fileCanonicalTextSha256,normalizeCloudflareDeployments,selectProductionDeployment,isFullGitSha,isSuccessfulStage,stable,sha256Bytes,canonicalText,sha256CanonicalText,readJson,writeJson};
export const CONTRACT_V3_PATH='content/production/symbolic-method/contracts/tarot-production-sha-alignment-contract-v3.json';
export const MANIFEST_V3_PATH='content/production/symbolic-method/deployment/tarot-production-runtime-source-manifest-v3.json';
export const LIVE_EVIDENCE_V3_PATH='.runtime-evidence/tarot-production-sha-alignment-v3.json';
export const PHASE_K_FREEZE_PATH='content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json';
export const HUMAN_FREEZE_PATH='content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json';
export function buildSourceManifestV3(root,baselineCommit){
  const remoteAssets=[
    ['canonicalTarotHtml','perspectives/tarot/index.html','/perspectives/tarot/'],
    ['canonicalTarotClient','assets/customer-ui/js/surfaces/tarot.js','/assets/customer-ui/js/surfaces/tarot.js'],
    ['publicCss','assets/css/symbolic-perspective.css','/assets/css/symbolic-perspective.css']
  ].map(([id,sourcePath,publicPath])=>({id,sourcePath,publicPath,canonicalTextSha256:fileCanonicalTextSha256(root,sourcePath)}));
  const governed=[
    'functions/api/symbolic-method-context.js',
    'functions/api/symbolic-method-execute.js',
    'functions/api/tarot-production-status.js',
    'functions/tarot-product-runtime/tarot-production-authority-v2.js',
    'functions/tarot-product-runtime/tarot-product-runtime-v1.js',
    'content/interpretation/tarot/freeze/tarot-product-interpretation-freeze-v1.json',
    'content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json',
    'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',
    'content/governance/production-capability-matrix/registries/production-capability-registry-v7.json',
    'content/web-production/px2/successors/public-method-catalog-v4.json'
  ].map(sourcePath=>({sourcePath,sha256:fileSha256(root,sourcePath)}));
  return {schemaVersion:'PHI-OS-TAROT-PRODUCTION-RUNTIME-SOURCE-MANIFEST-v3.0.0',phase:'TPA-L/TPA-M',work:'L-V3-MR-CANONICAL-TAROT-ROUTE-RELEASE-CANDIDATE',baselineCommit,status:'FROZEN_PHASE_MR_CANONICAL_TAROT_RUNTIME_SOURCE',predecessor:'content/production/symbolic-method/deployment/tarot-production-runtime-source-manifest-v2.json',predecessorMutated:false,normalization:'UTF8_BOM_REMOVED_CRLF_AND_CR_NORMALIZED_TO_LF_FOR_REMOTE_TEXT_COMPARISON',remoteAssets,governedSource:governed,productionBoundary:{manifestIsDeploymentAuthority:false,manifestMayGrantRunAllowed:false,liveEvidenceIsOperationalNotCommitted:true}};
}
