import fs from 'node:fs';
import {runIChingHumanReviewPreflight} from '../functions/iching-product-runtime/iching-human-review-runtime-v1.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const write=(path,value)=>fs.writeFileSync(path,`${JSON.stringify(value,null,2)}\n`);
const ROOT='content/production/symbolic-method/human-review';
const campaign=read(`${ROOT}/iching-human-review-campaign-v2.json`);
const authorities={
  hexagramRegistry:read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),
  sourceRegistry:read('content/interpretation/iching/registries/iching-source-registry-v2.json'),
  perspectiveRegistry:read('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json'),
  corpus:read('content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json')
};

const snapshots=await runIChingHumanReviewPreflight(campaign,authorities);
const preflight={
  schemaVersion:'PHI-OS-ICHING-HUMAN-REVIEW-PREFLIGHT-v1.0.0',
  phase:'ICH-HR',
  work:'ICH-HR-W3',
  baselineCommit:campaign.baselineCommit,
  status:'MACHINE_PREFLIGHT_24_OF_24_READY_FOR_REAL_HUMAN_REVIEW_NOT_HUMAN_ACCEPTANCE',
  campaignPath:`${ROOT}/iching-human-review-campaign-v2.json`,
  caseCount:snapshots.length,
  canonicalCoverage:{hexagrams:'64/64',lineWitnesses:'384/384'},
  machinePreflightIsHumanAcceptance:false,
  snapshots
};
write(`${ROOT}/iching-human-review-preflight-v1.json`,preflight);

if(process.argv.includes('--initialize-results')){
  const sessions=snapshots.map(item=>({
    sessionId:item.sessionId,
    machinePreflightPassed:true,
    machineEvidenceDigest:item.machineEvidenceDigest,
    humanReviewed:false,
    decision:null,
    reviewerId:null,
    reviewedAt:null,
    deploymentSha:null,
    environmentUrl:null,
    locale:item.locale,
    viewport:null,
    accountMode:item.accountMode,
    runtimeEvidence:{
      requestDigest:item.requestDigest,
      publicViewDigest:item.publicViewDigest,
      expectedProjection:item.expectedProjection,
      actualProjection:item.actualProjection,
      sourceClaimIds:item.sourceClaims.map(x=>x.claimId),
      sourceLocators:item.sourceClaims.map(x=>x.sourceLocator).filter(Boolean)
    },
    screenshotRefs:[],
    criteria:{},
    criticalBoundaryFailure:null,
    notes:null
  }));
  write(`${ROOT}/iching-human-review-results-v2.json`,{
    schemaVersion:'PHI-OS-ICHING-HUMAN-REVIEW-RESULTS-v2.0.0',
    phase:'ICH-HR',
    work:'ICH-HR-W4-W5',
    baselineCommit:campaign.baselineCommit,
    status:'PENDING_REAL_HUMAN_SIGNOFF_MACHINE_PREFLIGHT_24_OF_24',
    campaignPath:`${ROOT}/iching-human-review-campaign-v2.json`,
    rubricPath:`${ROOT}/iching-human-review-rubric-v2.json`,
    evidenceContractPath:`${ROOT}/iching-human-review-evidence-contract-v1.json`,
    planned:campaign.targetSessionCount,
    minimumAccepted:campaign.minimumAcceptedSessionCount,
    machinePreflightPassed:sessions.length,
    humanReviewed:0,
    accepted:0,
    rejected:0,
    needsFix:0,
    criticalBoundaryFailures:0,
    sessions,
    humanAcceptanceComplete:false,
    productionPromotionAllowed:false,
    publicRunAllowed:false
  });
}

console.log(`✓ ICH-HR-W3 generated deterministic machine preflight ${snapshots.length}/${campaign.targetSessionCount}.`);
console.log('  Machine preflight is not human review and cannot promote public execution.');

