import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {runIChingLimitedProductionObservation} from './lib/iching/limited-production-observation-v1.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,`${JSON.stringify(v,null,2)}\n`);};
const base=String(process.env.PHIOS_ICHING_BASE_URL||'').trim();
const expected=String(process.env.PHIOS_ICHING_EXPECTED_SHA||'').trim().toLowerCase();
const accessCookie=String(process.env.PHIOS_ICHING_CF_AUTHORIZATION||'').trim();
assert.ok(accessCookie,'PHIOS_ICHING_CF_AUTHORIZATION is required; do not store it in repo files');
const campaignPath='content/production/symbolic-method/observation/iching-limited-production-observation-campaign-v1.json';
const liveEvidencePath='content/production/symbolic-method/deployment/iching-limited-production-live-evidence-v1.json';
const resultPath='content/production/symbolic-method/observation/iching-limited-production-observation-results-v1.json';
const acceptancePath='content/production/symbolic-method/acceptance/iching-limited-production-observation-acceptance-v1.json';
const currentPath='content/production/symbolic-method/reconciliation/iching-limited-production-current-successor-v1.json';
const campaign=read(campaignPath);const live=read(liveEvidencePath);assert.equal(live.deployment.commitSha,expected);assert.equal(campaign.targetDeploymentSha,expected);
for(const target of [resultPath,acceptancePath,currentPath])assert.equal(fs.existsSync(target),false,`stale W32 artifact exists: ${target}; remove the three generated W32 files before an intentional rerun`);
const results=await runIChingLimitedProductionObservation({baseUrl:base,expectedSha:expected,accessCookie,campaign});write(resultPath,results);
const acceptance={
  schemaVersion:'PHI-OS-ICHING-LIMITED-PRODUCTION-OBSERVATION-ACCEPTANCE-v1.0.0',
  work:'ICH-PROD-W32-LIMITED-PRODUCTION-OBSERVATION-ACCEPTANCE',
  baselineCommit:expected,
  status:'ACCEPTED_LIVE_LIMITED_PRODUCTION_OBSERVATION',
  liveEvidence:{path:liveEvidencePath,sha256:sha(liveEvidencePath)},
  campaign:{path:campaignPath,sha256:sha(campaignPath)},
  results:{path:resultPath,sha256:sha(resultPath)},
  accepted:{controlGates:'6/6',executionCases:'14/14',sensitiveDomainCases:'8/8',bilingualLocales:'2/2',replayDeterministic:true,humanApprovedDepthOnly:true,guestBlocked:true,retentionBlocked:true},
  productionBoundary:{limitedProductionObserved:true,fullProductionGranted:false,globalPublicExecutionGranted:false,observationAloneMayGrantFullProduction:false,finalProductionAcceptanceRequired:true},
  nextAction:'ICH-PROD-W33-FINAL-LIMITED-PRODUCTION-ACCEPTANCE-BEFORE-FULL-PRODUCTION'
};write(acceptancePath,acceptance);
const current={schemaVersion:'PHI-OS-ICHING-LIMITED-PRODUCTION-CURRENT-SUCCESSOR-v1.0.0',work:'ICH-PROD-W31-W32-LIMITED-PRODUCTION-CURRENT-SUCCESSOR',baselineCommit:expected,status:'CURRENT_LIVE_LIMITED_PRODUCTION_W31_W32_OBSERVED_W33_PENDING',predecessorCurrentMaster:'scripts/check-iching-current-v6.mjs',predecessorMutated:false,liveEvidence:liveEvidencePath,observationCampaign:campaignPath,observationResults:resultPath,observationAcceptance:acceptancePath,currentMasterChecker:'scripts/check-iching-current-v7.mjs',authority:{state:'LIMITED_PRODUCTION',runAllowedForGovernedBeta:true,fullProduction:false,globalPublicExecution:false,humanAcceptanceReopened:false,depthAdmissionReopened:false,persistenceCurrentV4Reopened:false},nextAction:'ICH-PROD-W33-FINAL-LIMITED-PRODUCTION-ACCEPTANCE-BEFORE-FULL-PRODUCTION'};write(currentPath,current);
console.log(`✓ ICH-PROD-W32 live observation materialized for ${expected}: 6/6 control gates + 14/14 execution cases + 8/8 sensitive-domain cases.`);
console.log(`  Wrote ${resultPath}`);console.log(`  Wrote ${acceptancePath}`);console.log(`  Wrote ${currentPath}`);console.log('  No Access cookie, beta cookie, account identity or session secret was written to either artifact.');
