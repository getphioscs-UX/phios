import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const blobSha=p=>{const b=fs.readFileSync(p);return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');};

const prev=j('content/interpretation/iching/reconciliation/iching-depth-current-successor-v6.json');
const cur=j('content/interpretation/iching/reconciliation/iching-depth-current-successor-v7.json');
const w33=j('content/production/symbolic-method/acceptance/iching-final-limited-production-acceptance-v1.json');

assert.equal(cur.successorOf,'content/interpretation/iching/reconciliation/iching-depth-current-successor-v6.json');
assert.equal(cur.historicalPredecessorMutated,false);
assert.equal(blobSha(cur.historicalV6Witness.path),cur.historicalV6Witness.gitBlobSha1,'historical depth v6 byte drift');
assert.equal(prev.admittedCoverage.humanApproved,'448/448');
assert.equal(cur.admittedCoverage.humanApproved,'448/448');
assert.equal(cur.humanAcceptance.accepted,'448/448');
assert.equal(cur.runtimeAcceptance.bilingualProductCases,'896/896');
assert.equal(cur.reconciliationReason.humanReviewDriftObserved,false);
assert.equal(cur.reconciliationReason.admittedCorpusDriftObserved,false);
assert.equal(cur.reconciliationReason.depthRuntimeDriftObserved,false);
assert.equal(cur.reconciliationReason.persistenceSemanticDriftObserved,false);
assert.equal(cur.reconciliationReason.historicalW31LiveEvidenceRewritten,false);
assert.equal(cur.reconciliationReason.w32R1ObservationEvidenceRewritten,false);
assert.equal(cur.reconciliationReason.w33FinalLimitedProductionAccepted,true);

for(const item of cur.historicalPredecessorWitnesses) assert.equal(sha(item.path),item.sha256,`historical predecessor drift: ${item.path}`);
for(const item of cur.domainArtifacts) assert.equal(sha(item.path),item.sha256,`ICHI-DEPTH v7 preserved domain artifact drift: ${item.path}`);

const pkg=j('package.json');
for(const [k,v] of Object.entries(cur.orchestrationBindings.requiredScripts||{})) assert.equal(pkg.scripts[k],v,`package orchestration drift: ${k}`);

assert.equal(cur.singleAuthority.currentMasterChecker,'scripts/check-iching-current-v9.mjs');
assert.equal(cur.singleAuthority.depthCurrentChecker,'scripts/check-iching-depth-current-v7.mjs');
assert.equal(cur.productionBoundary.w32R1SuccessorObservationAccepted,true);
assert.equal(cur.productionBoundary.w33FinalLimitedProductionAccepted,true);
assert.equal(cur.productionBoundary.fullProductionAllowed,false);
assert.equal(cur.productionBoundary.globalPublicExecutionAllowed,false);
assert.equal(cur.productionBoundary.productionCapabilityPromoted,false);
assert.equal(cur.productionBoundary.fullProductionPromotionRequiresSeparateSuccessor,true);
assert.equal(w33.finalDecision.finalLimitedProductionAcceptance,true);
assert.equal(w33.finalDecision.fullProductionGranted,false);

console.log('✓ ICHI-DEPTH current v7 orchestration successor passed: 448/448 + 896/896 are byte-stable while W33 final LIMITED_PRODUCTION acceptance is external to the depth freeze.');
