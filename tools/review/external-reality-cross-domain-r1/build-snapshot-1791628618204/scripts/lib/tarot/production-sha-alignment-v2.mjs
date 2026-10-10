import fs from 'node:fs';
import path from 'node:path';
import {buildSourceManifest as buildV1,fileSha256,fileCanonicalTextSha256,normalizeCloudflareDeployments,selectProductionDeployment,isFullGitSha,isSuccessfulStage,stable,sha256Bytes,canonicalText,sha256CanonicalText,readJson,writeJson} from './production-sha-alignment-v1.mjs';
export {fileSha256,fileCanonicalTextSha256,normalizeCloudflareDeployments,selectProductionDeployment,isFullGitSha,isSuccessfulStage,stable,sha256Bytes,canonicalText,sha256CanonicalText,readJson,writeJson};
export const CONTRACT_V2_PATH='content/production/symbolic-method/contracts/tarot-production-sha-alignment-contract-v2.json';
export const MANIFEST_V2_PATH='content/production/symbolic-method/deployment/tarot-production-runtime-source-manifest-v2.json';
export const LIVE_EVIDENCE_V2_PATH='.runtime-evidence/tarot-production-sha-alignment-v2.json';
export const PHASE_K_FREEZE_PATH='content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json';
export const HUMAN_FREEZE_PATH='content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json';
export function buildSourceManifestV2(root,baselineCommit){
  const remoteAssets=[
    ['publicHtml','readings/symbolic/index.html','/readings/symbolic/'],
    ['publicClient','assets/js/pages/symbolic-perspective.js','/assets/js/pages/symbolic-perspective.js'],
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
    'content/web-production/px2/successors/public-method-catalog-v3.json'
  ].map(sourcePath=>({sourcePath,sha256:fileSha256(root,sourcePath)}));
  return {schemaVersion:'PHI-OS-TAROT-PRODUCTION-RUNTIME-SOURCE-MANIFEST-v2.0.0',phase:'TPA-L/TPA-M',work:'L-V2-RELEASE-CANDIDATE_AFTER_PHASE_M_SOURCE',baselineCommit,status:'FROZEN_PHASE_M_RELEASE_CANDIDATE_RUNTIME_SOURCE',predecessor:'content/production/symbolic-method/deployment/tarot-production-runtime-source-manifest-v1.json',predecessorMutated:false,normalization:'UTF8_BOM_REMOVED_CRLF_AND_CR_NORMALIZED_TO_LF_FOR_REMOTE_TEXT_COMPARISON',remoteAssets,governedSource:governed,productionBoundary:{manifestIsDeploymentAuthority:false,manifestMayGrantRunAllowed:false,liveEvidenceIsOperationalNotCommitted:true}};
}
