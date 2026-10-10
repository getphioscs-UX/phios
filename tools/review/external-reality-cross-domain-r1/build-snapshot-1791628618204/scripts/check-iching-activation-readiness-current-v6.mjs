import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const blobSha=p=>{const b=fs.readFileSync(p);return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');};

const prev=j('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v5.json');
const cur=j('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v6.json');
const w33=j('content/production/symbolic-method/acceptance/iching-final-limited-production-acceptance-v1.json');

assert.equal(cur.successorOf,'content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v5.json');
assert.equal(cur.historicalPredecessorMutated,false);
assert.equal(blobSha(cur.historicalPredecessorWitness.path),cur.historicalPredecessorWitness.gitBlobSha1);
assert.equal(prev.currentAuthority.state,'LIMITED_PRODUCTION');
assert.equal(prev.fullProductionGates.w32R1SuccessorObservationAccepted,false);
assert.equal(prev.fullProductionGates.w33FinalProductionAcceptance,false);

assert.equal(cur.evidenceCommit,'9bfca2bb8c94072feb0a280d0a4d3cb06c6ec2a9');
assert.equal(cur.contentReadiness.baseHumanAcceptance,'24/24');
assert.equal(cur.contentReadiness.humanApprovedDepthCoverage,'448/448');
assert.equal(cur.contentReadiness.humanApprovedDepthHexagramCoverage,'64/64');
assert.equal(cur.contentReadiness.humanApprovedDepthLineCoverage,'384/384');
assert.equal(cur.contentReadiness.bilingualDepthRuntimeCases,'896/896');
assert.equal(cur.contentReadiness.humanReviewReopened,false);
assert.equal(cur.contentReadiness.depthAdmissionReopened,false);

assert.equal(cur.currentAuthority.state,'LIMITED_PRODUCTION');
assert.equal(cur.currentAuthority.limitedProductionAllowed,true);
assert.equal(cur.currentAuthority.governedBetaRunAllowed,true);
assert.equal(cur.currentAuthority.finalLimitedProductionAcceptance,true);
assert.equal(cur.currentAuthority.globalPublicRunAllowed,false);
assert.equal(cur.currentAuthority.fullProductionAllowed,false);
assert.equal(cur.currentAuthority.productionCapabilityPromoted,false);
assert.equal(cur.currentAuthority.clientMayGrantAuthority,false);
assert.equal(cur.currentAuthority.staticRegistryMayGrantAuthority,false);

assert.equal(cur.acceptedObservationAuthority.historicalFirstLiveAdmissionSha,'025588253432e411b130a61bf4b38fe540cfcf54');
assert.equal(cur.acceptedObservationAuthority.observedSuccessorDeploymentSha,'ceb57c34f01d99ae971d8d32f1595ee728a64add');
assert.equal(cur.acceptedObservationAuthority.evidenceCommit,cur.evidenceCommit);
assert.equal(cur.acceptedObservationAuthority.historicalAdmissionIsAncestor,true);
assert.equal(cur.acceptedObservationAuthority.exactRuntimeFingerprintVerified,true);
assert.equal(cur.acceptedObservationAuthority.freshLiveLimitedProductionSessionPassed,true);
assert.equal(cur.acceptedObservationAuthority.w32R1ObservationAccepted,true);

assert.equal(cur.fullProductionGates.w32R1SuccessorObservationAccepted,true);
assert.equal(cur.fullProductionGates.w33FinalProductionAcceptance,true);
assert.equal(cur.fullProductionGates.globalPublicExecutionApproved,false);
assert.equal(cur.fullProductionGates.fullProductionFreezeCreated,false);
assert.equal(w33.finalDecision.finalLimitedProductionAcceptance,true);
assert.equal(w33.finalDecision.fullProductionGranted,false);

console.log('✓ ICH-PROD-W33 activation readiness v6 passed: W32R1 + W33 are accepted while FULL_PRODUCTION and global public execution remain closed for a separate promotion successor.');
