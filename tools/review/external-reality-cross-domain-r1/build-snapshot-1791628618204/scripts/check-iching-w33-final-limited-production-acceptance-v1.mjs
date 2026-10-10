import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const blobSha=p=>{const b=fs.readFileSync(p);return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');};
const git=(args)=>{const r=spawnSync('git',args,{cwd:process.cwd(),encoding:'utf8'});assert.equal(r.status,0,`git ${args.join(' ')} failed\n${r.stderr||r.stdout}`);return String(r.stdout||'').trim();};

const resultsPath='content/production/symbolic-method/observation/iching-limited-production-observation-results-v2.json';
const observationAcceptancePath='content/production/symbolic-method/acceptance/iching-limited-production-observation-acceptance-v2.json';
const observedCurrentPath='content/production/symbolic-method/reconciliation/iching-limited-production-current-successor-v2.json';
const w33Path='content/production/symbolic-method/acceptance/iching-final-limited-production-acceptance-v1.json';

for(const p of [resultsPath,observationAcceptancePath,observedCurrentPath,w33Path]) assert.ok(fs.existsSync(p),`W33 required artifact missing: ${p}`);

const results=j(resultsPath),obs=j(observationAcceptancePath),prevCurrent=j(observedCurrentPath),w33=j(w33Path);
assert.equal(w33.schemaVersion,'PHI-OS-ICHING-FINAL-LIMITED-PRODUCTION-ACCEPTANCE-v1.0.0');
assert.equal(w33.status,'FINAL_LIMITED_PRODUCTION_ACCEPTED_FULL_PRODUCTION_PROMOTION_PENDING');
assert.equal(w33.evidenceCommit,'9bfca2bb8c94072feb0a280d0a4d3cb06c6ec2a9');
assert.equal(w33.historicalFirstLiveAdmissionSha,'025588253432e411b130a61bf4b38fe540cfcf54');
assert.equal(w33.observedSuccessorDeploymentSha,'ceb57c34f01d99ae971d8d32f1595ee728a64add');

git(['cat-file','-e',`${w33.evidenceCommit}^{commit}`]);
git(['merge-base','--is-ancestor',w33.evidenceCommit,'HEAD']);

assert.equal(results.status,'LIVE_OBSERVATION_ACCEPTED');
assert.equal(results.deploymentSha,w33.observedSuccessorDeploymentSha);
assert.equal(results.summary.controlGatesPassed,6);
assert.equal(results.summary.executionCasesPassed,14);
assert.equal(results.summary.sensitiveDomainCasesPassed,8);
assert.equal(results.summary.replayDeterministic,true);
assert.deepEqual(new Set(results.summary.bilingualLocales),new Set(['en','zh-Hans']));
assert.equal(results.summary.humanApprovedDepthCoverage,'448/448');
assert.equal(results.boundaries.authorityState,'LIMITED_PRODUCTION');
assert.equal(results.boundaries.fullProduction,false);
assert.equal(results.boundaries.globalPublicExecutionClaimed,false);
assert.equal(results.boundaries.guestRunAllowed,false);
assert.equal(results.boundaries.userDecisionAuthorityPreserved,true);
for(const value of Object.values(results.privacy)) assert.equal(value,false);

assert.equal(obs.status,'ACCEPTED_LIVE_LIMITED_PRODUCTION_SUCCESSOR_SHA_OBSERVATION');
assert.equal(obs.observedSuccessorDeploymentSha,w33.observedSuccessorDeploymentSha);
assert.equal(obs.historicalFirstLiveAdmissionSha,w33.historicalFirstLiveAdmissionSha);
assert.equal(obs.accepted.controlGates,'6/6');
assert.equal(obs.accepted.executionCases,'14/14');
assert.equal(obs.accepted.sensitiveDomainCases,'8/8');
assert.equal(obs.accepted.bilingualLocales,'2/2');
assert.equal(obs.accepted.replayDeterministic,true);
assert.equal(obs.productionBoundary.limitedProductionObserved,true);
assert.equal(obs.productionBoundary.fullProductionGranted,false);
assert.equal(obs.productionBoundary.globalPublicExecutionGranted,false);
assert.equal(obs.productionBoundary.finalProductionAcceptanceRequired,true);

assert.equal(sha256(w33.sourceEvidence.historicalLiveEvidence.path),w33.sourceEvidence.historicalLiveEvidence.sha256);
assert.equal(sha256(w33.sourceEvidence.observationCampaign.path),w33.sourceEvidence.observationCampaign.sha256);
assert.equal(sha256(w33.sourceEvidence.runtimeFingerprint.path),w33.sourceEvidence.runtimeFingerprint.sha256);
assert.equal(sha256(w33.sourceEvidence.observationResults.path),w33.sourceEvidence.observationResults.sha256);
assert.equal(obs.results.sha256,w33.sourceEvidence.observationResults.sha256);

for(const item of w33.historicalByteWitnesses) assert.equal(blobSha(item.path),item.gitBlobSha1,`W33 historical byte drift: ${item.path}`);

assert.equal(prevCurrent.status,'CURRENT_LIVE_LIMITED_PRODUCTION_SUCCESSOR_SHA_OBSERVED_W33_PENDING');
assert.equal(prevCurrent.observedSuccessorDeploymentSha,w33.observedSuccessorDeploymentSha);
assert.equal(prevCurrent.authority.state,'LIMITED_PRODUCTION');
assert.equal(prevCurrent.authority.fullProduction,false);
assert.equal(prevCurrent.authority.globalPublicExecution,false);

assert.equal(w33.accepted.w31HistoricalFirstLiveAdmissionPreserved,true);
assert.equal(w33.accepted.w32R1SuccessorObservationAccepted,true);
assert.equal(w33.accepted.controlGates,'6/6');
assert.equal(w33.accepted.executionCases,'14/14');
assert.equal(w33.accepted.sensitiveDomainCases,'8/8');
assert.equal(w33.accepted.humanApprovedDepthCoverage,'448/448');
assert.equal(w33.accepted.bilingualDepthRuntimeCases,'896/896');
assert.equal(w33.accepted.guestExecutionBlocked,true);
assert.equal(w33.accepted.retentionWithoutConsentBlocked,true);
assert.equal(w33.accepted.userDecisionAuthorityPreserved,true);
assert.equal(w33.accepted.privacySafeEvidence,true);

assert.equal(w33.finalDecision.state,'LIMITED_PRODUCTION');
assert.equal(w33.finalDecision.finalLimitedProductionAcceptance,true);
assert.equal(w33.finalDecision.governedBetaRunAllowed,true);
assert.equal(w33.finalDecision.fullProductionGranted,false);
assert.equal(w33.finalDecision.globalPublicExecutionGranted,false);
assert.equal(w33.finalDecision.productionCapabilityPromoted,false);
assert.equal(w33.finalDecision.fullProductionPromotionRequiresSeparateSuccessor,true);
for(const key of ['humanAcceptanceReopened','depthAdmissionReopened','persistenceReopened','historicalFirstLiveEvidenceRewritten','w32R1ObservationEvidenceRewritten','runtimeFingerprintRewritten','secretsOrRawIdentityMaterialized','observationCommitMayBeReboundToFutureSha']) assert.equal(w33.governanceFreeze[key],false);

console.log('✓ ICH-PROD-W33 Final Limited Production Acceptance passed: W31 + W32R1 evidence is admitted and frozen without reopening 24/24, 448/448, 896/896 or persistence.');
console.log('  Governed beta remains LIMITED_PRODUCTION; FULL_PRODUCTION, global public execution and production capability promotion remain false and require a separate successor.');
