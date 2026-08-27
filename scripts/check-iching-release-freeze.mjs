import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const path='content/production/symbolic-method/releases/iching/ICHING-1.0.0.json';
const release=JSON.parse(fs.readFileSync(path,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(release.schemaVersion,'PHI-OS-ICHING-RELEASE-MANIFEST-v1.0.0');
assert.equal(release.releaseId,'ICHING-1.0.0');assert.equal(release.methodCode,'I_CHING');
assert.equal(release.status,'SOURCE_FROZEN_FULL_PRODUCTION_PROMOTABLE');
assert.equal(release.acceptedEvidence.depthHumanAcceptance,'448/448');assert.equal(release.acceptedEvidence.bilingualRuntimeCases,'896/896');
assert.equal(release.acceptedEvidence.w33FinalLimitedProductionAccepted,true);
assert.equal(release.productionContract.targetState,'FULL_PRODUCTION');assert.equal(release.productionContract.globalPublicExecution,true);assert.equal(release.productionContract.guestPersistenceAllowed,true);assert.equal(release.productionContract.guestPersistenceRequiresExplicitConsent,true);assert.equal(release.productionContract.automaticPersistence,false);
assert.equal(release.authorityModel.singleCurrentChecker,'scripts/check-iching-release-current.mjs');assert.equal(release.authorityModel.futureDeploymentDoesNotCreateNewCurrentVersion,true);
for(const item of release.artifacts){assert.ok(fs.existsSync(item.path),`release artifact missing: ${item.path}`);assert.equal(sha(item.path),item.sha256,`ICHING-1.0.0 artifact drift: ${item.path}`);}
console.log(`✓ ${release.releaseId} immutable source release freeze passed across ${release.artifacts.length} artifacts.`);
console.log('  One unversioned current authority pointer governs the release; deployment promotions no longer create current-vN successors.');
