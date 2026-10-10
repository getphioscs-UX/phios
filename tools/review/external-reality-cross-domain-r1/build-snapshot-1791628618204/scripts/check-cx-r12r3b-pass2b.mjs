import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const BASE='content/customer-experience-rebuild';
const acceptance=read(`${BASE}/acceptance/cx-r12r3b-pass2b-human-acceptance-v1.json`);
const results=read(`${BASE}/review/cx-r12r3b-human-review-results-v1.json`);
const att=read(`${BASE}/review/cx-r12r3b-human-review-aggregate-attestation-v1.json`);
const admission=read(`${BASE}/admission/cx-r12r3b-human-reviewed-composition-admission-v1.json`);
const coverage=read(`${BASE}/registries/cx-r12r3b-meaning-source-coverage-v2.json`);
const composition=read(`${BASE}/registries/cx-r12r3b-composition-rule-registry-v2.json`);
const prod=read(`${BASE}/production/cx-r12r3b-production-gates-v2.json`);
const deploy=read(`${BASE}/production/cx-r12r3b-deployment-candidate-v1.json`);
const manifest=read(`${BASE}/review/materialized/v1/cx-r12r3b-human-review-materialization-manifest-v1.json`);
assert.equal(results.cases.length,96,'review result case count');
assert.equal(results.totals.dualAccepted,96);assert.equal(results.totals.pending,0);assert.equal(results.totals.criticalFailures,0);
assert.equal(att.accepted,true);assert.equal(att.attestation.dualAccepted,'96/96');
const byId=new Map(manifest.cases.map(x=>[x.caseId,x]));
const count={AST:0,NUM:0,BZR:0,ZWR:0};
for(const r of results.cases){
 const c=byId.get(r.caseId);assert(c,`unknown review case ${r.caseId}`);
 assert.equal(c.reviewEligible,true);assert.equal(c.candidateMaterialization.machinePreflightPassed,true);
 assert.equal(r.methodFidelityAccepted,true);assert.equal(r.customerClarityAccepted,true);
 assert.ok(r.reviewerRef);assert.ok(r.evidenceRef);assert.equal(r.evidenceRef,`${BASE}/review/cx-r12r3b-human-review-aggregate-attestation-v1.json`);
 assert.equal(r.projectionDigest,c.candidateMaterialization.projectionDigest);assert.equal(r.interpretationDigest,c.candidateMaterialization.interpretationDigest);
 assert(fs.existsSync(r.candidateSnapshotRef));assert(fs.existsSync(r.graphSnapshotRef));
 count[r.methodId]++;
}
assert.deepEqual(count,{AST:24,NUM:24,BZR:24,ZWR:24});
assert.equal(admission.acceptedCaseCount,96);assert.equal(admission.admissionBoundary.atomicMeaningAuthorityChanged,false);assert.equal(admission.admissionBoundary.admissionCreatesNewMeaning,false);
for(const row of coverage.coverageMatrix){assert.equal(row.humanReviewed,true);assert.equal(row.customerPublishable,true);assert.equal(row.humanReviewEvidenceRef,`${BASE}/review/cx-r12r3b-human-review-results-v1.json`)}
assert.equal(coverage.productionGate.currentCustomerPublishableCoverage,1);assert.deepEqual(coverage.productionGate.customerPublishableMethods,['AST','NUM','BZR','ZWR']);
assert.equal(composition.humanReviewed,true);assert.equal(composition.customerPublishable,true);
assert.equal(acceptance.claims.humanAccepted,true);assert.equal(acceptance.claims.liveBrowserAccepted,false);assert.equal(acceptance.claims.fullProduction,false);
assert.equal(prod.prerequisites.humanReview96DualAccepted,true);assert.equal(prod.prerequisites.customerPublishableCoverageComplete,true);assert.equal(prod.prerequisites.liveBrowserAccepted,false);
assert.equal(deploy.candidateCaptured,true);assert.equal(deploy.deploymentPerformedByThisArtifact,false);assert.equal(deploy.productionShaVerified,false);
console.log('✓ CX-R12R3B PASS2B human acceptance passed: 96/96 dual accepted, all four interpretation methods are customer-publishable at the interpretation layer.');
console.log('  Production remains fail-closed until post-human machine reacceptance, exact deployment, live browser and ordinary-reader evidence complete.');
