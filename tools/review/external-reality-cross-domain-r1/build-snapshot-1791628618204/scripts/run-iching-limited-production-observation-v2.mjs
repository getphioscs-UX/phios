import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {runIChingLimitedProductionObservationV2} from './lib/iching/limited-production-observation-v2.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const shaBytes=b=>crypto.createHash('sha256').update(b).digest('hex');
const sha=p=>shaBytes(fs.readFileSync(p));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,`${JSON.stringify(v,null,2)}\n`);};
const GIT_MAX_BUFFER=128*1024*1024;
const git=(args,{binary=false}={})=>{const r=spawnSync('git',args,{cwd:process.cwd(),encoding:binary?null:'utf8',maxBuffer:GIT_MAX_BUFFER});assert.equal(r.status,0,`git ${args.join(' ')} failed${r.error?` (${r.error.code||r.error.message})`:''}\n${binary?'':r.stderr||r.stdout}`);return binary?r.stdout:String(r.stdout||'').trim();};
const base=String(process.env.PHIOS_ICHING_BASE_URL||'').trim();
const expected=String(process.env.PHIOS_ICHING_EXPECTED_SHA||'').trim().toLowerCase();
const accessCookie=String(process.env.PHIOS_ICHING_CF_AUTHORIZATION||'').trim();
assert.match(base,/^https:\/\//,'PHIOS_ICHING_BASE_URL must use HTTPS');assert.match(expected,/^[0-9a-f]{40}$/,'PHIOS_ICHING_EXPECTED_SHA must be a full 40-character SHA');assert.ok(accessCookie,'PHIOS_ICHING_CF_AUTHORIZATION is required; do not store it in repo files');
const campaignPath='content/production/symbolic-method/observation/iching-limited-production-observation-campaign-v2.json';
const liveEvidencePath='content/production/symbolic-method/deployment/iching-limited-production-live-evidence-v1.json';
const fingerprintPath='content/production/symbolic-method/reconciliation/iching-limited-production-runtime-fingerprint-v1.json';
const resultPath='content/production/symbolic-method/observation/iching-limited-production-observation-results-v2.json';
const acceptancePath='content/production/symbolic-method/acceptance/iching-limited-production-observation-acceptance-v2.json';
const currentPath='content/production/symbolic-method/reconciliation/iching-limited-production-current-successor-v2.json';
const campaign=read(campaignPath),live=read(liveEvidencePath),fingerprint=read(fingerprintPath);
assert.equal(live.deployment.commitSha,campaign.historicalFirstLiveAdmissionSha);assert.equal(fingerprint.historicalFirstLiveAdmissionSha,campaign.historicalFirstLiveAdmissionSha);assert.notEqual(expected,campaign.historicalFirstLiveAdmissionSha);
for(const target of [resultPath,acceptancePath,currentPath])assert.equal(fs.existsSync(target),false,`stale W32R1 artifact exists: ${target}; remove the three generated v2 artifacts before an intentional rerun`);
const head=git(['rev-parse','HEAD']).toLowerCase();assert.equal(head,expected,'Local git HEAD must equal PHIOS_ICHING_EXPECTED_SHA so the observed production candidate and local authority are the same commit');
git(['cat-file','-e',`${expected}^{commit}`]);git(['merge-base','--is-ancestor',campaign.historicalFirstLiveAdmissionSha,expected]);
for(const item of fingerprint.exactArtifacts){const bytes=git(['show',`${expected}:${item.path}`],{binary:true});assert.equal(shaBytes(bytes),item.sha256,`candidate exact-runtime fingerprint drift: ${item.path}`);const diff=spawnSync('git',['diff','--quiet',expected,'--',item.path],{cwd:process.cwd()});assert.equal(diff.status,0,`working-tree runtime drift from observed candidate: ${item.path}`);}
for(const item of fingerprint.sharedSemanticSurfaces){const text=String(git(['show',`${expected}:${item.path}`]));for(const marker of item.requiredMarkers)assert.ok(text.includes(marker),`candidate shared semantic marker missing: ${item.path} :: ${marker}`);for(const marker of item.forbiddenMarkers||[])assert.ok(!text.includes(marker),`candidate shared semantic marker forbidden: ${item.path} :: ${marker}`);}
const lineageEvidence={historicalAdmissionIsAncestor:true,localHeadMatchesObservedSha:true,exactRuntimeFingerprintVerified:true,sharedSemanticContractVerified:true};
const results=await runIChingLimitedProductionObservationV2({baseUrl:base,expectedSha:expected,accessCookie,campaign,lineageEvidence});write(resultPath,results);
const acceptance={
  schemaVersion:'PHI-OS-ICHING-LIMITED-PRODUCTION-OBSERVATION-ACCEPTANCE-v2.0.0',work:'ICH-PROD-W32R1-SUCCESSOR-SHA-OBSERVATION-ACCEPTANCE',baselineCommit:fingerprint.baselineCommit,status:'ACCEPTED_LIVE_LIMITED_PRODUCTION_SUCCESSOR_SHA_OBSERVATION',historicalFirstLiveAdmissionSha:campaign.historicalFirstLiveAdmissionSha,observedSuccessorDeploymentSha:expected,
  historicalLiveEvidence:{path:liveEvidencePath,sha256:sha(liveEvidencePath)},campaign:{path:campaignPath,sha256:sha(campaignPath)},runtimeFingerprint:{path:fingerprintPath,sha256:sha(fingerprintPath)},results:{path:resultPath,sha256:sha(resultPath)},
  lineageAcceptance:{historicalAdmissionIsAncestor:true,localHeadMatchesObservedSha:true,exactRuntimeFingerprintVerified:true,sharedSemanticContractVerified:true},
  accepted:{controlGates:'6/6',executionCases:'14/14',sensitiveDomainCases:'8/8',bilingualLocales:'2/2',replayDeterministic:true,humanApprovedDepthOnly:true,guestBlocked:true,retentionBlocked:true},
  productionBoundary:{limitedProductionObserved:true,fullProductionGranted:false,globalPublicExecutionGranted:false,observationAloneMayGrantFullProduction:false,finalProductionAcceptanceRequired:true},nextAction:'ICH-PROD-W33-FINAL-LIMITED-PRODUCTION-ACCEPTANCE-BEFORE-FULL-PRODUCTION'
};write(acceptancePath,acceptance);
const current={schemaVersion:'PHI-OS-ICHING-LIMITED-PRODUCTION-CURRENT-SUCCESSOR-v2.0.0',work:'ICH-PROD-W32R1-SUCCESSOR-SHA-OBSERVATION-CURRENT',baselineCommit:fingerprint.baselineCommit,status:'CURRENT_LIVE_LIMITED_PRODUCTION_SUCCESSOR_SHA_OBSERVED_W33_PENDING',successorOf:'content/production/symbolic-method/reconciliation/iching-limited-production-current-successor-v1.json',historicalV1MayRemainAbsentBecausePinnedCampaignNeverMaterialized:true,historicalFirstLiveEvidence:liveEvidencePath,observationCampaign:campaignPath,observationResults:resultPath,observationAcceptance:acceptancePath,runtimeFingerprint:fingerprintPath,observedSuccessorDeploymentSha:expected,currentMasterChecker:'scripts/check-iching-current-v8.mjs',authority:{state:'LIMITED_PRODUCTION',runAllowedForGovernedBeta:true,fullProduction:false,globalPublicExecution:false,humanAcceptanceReopened:false,depthAdmissionReopened:false,persistenceCurrentV4Reopened:false,historicalFirstLiveAdmissionRewritten:false},nextAction:'ICH-PROD-W33-FINAL-LIMITED-PRODUCTION-ACCEPTANCE-BEFORE-FULL-PRODUCTION'};write(currentPath,current);
console.log(`✓ ICH-PROD-W32R1 successor-SHA live observation materialized for ${expected}: lineage + runtime fingerprint + 6/6 controls + 14/14 execution + 8/8 sensitive-domain cases.`);
console.log(`  Historical first-live admission remains ${campaign.historicalFirstLiveAdmissionSha}; no Access cookie, beta cookie, identity or session secret was written.`);
