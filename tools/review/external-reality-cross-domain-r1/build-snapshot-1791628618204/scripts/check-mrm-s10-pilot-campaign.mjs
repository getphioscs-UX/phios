import assert from 'node:assert/strict';
import {readJson,sha256,validatePilotCase} from './lib/runtime-maturity/pilot-campaign-lib.mjs';
const campaign=readJson('content/runtime-maturity/pilot/campaign/pilot-evidence-campaign-contract-v1.json');
const admission=readJson('content/runtime-maturity/pilot/campaign/pilot-case-admission-contract-v1.json');
const stage=readJson('content/runtime-maturity/pilot/campaign/pilot-stage-requirement-registry-v1.json');
const candidates=readJson('content/runtime-maturity/pilot/campaign/first-batch-pilot-candidate-registry-v1.json');
const registry=readJson('content/runtime-maturity/pilot/pilot-case-registry-v2.json');
const evidence=readJson('content/runtime-maturity/pilot/evidence/pilot-evidence-registry-v1.json');
const privacy=readJson('content/runtime-maturity/pilot/campaign/pilot-private-evidence-boundary-v1.json');
const baseMatrix=readJson('content/runtime-maturity/matrices/master-evidence-maturity-matrix-v1.5.json');
assert.equal(campaign.status,'ACTIVE_REAL_CASE_ONLY');
assert.equal(campaign.rules.fixtureCannotBePilot,true); assert.equal(campaign.rules.publicRepositoryRawCustomerPayloadForbidden,true);
assert.equal(candidates.candidateCount,3); assert.deepEqual(candidates.candidates.map(x=>x.product).sort(),['DAR','FINANCIAL','RRP']);
for(const c of candidates.candidates){ assert.equal(c.status,'AWAITING_REAL_CASE'); assert.ok(c.blockers.length>0); assert.ok(c.requiredStageEvidence.length>0); }
assert.equal(registry.supersedes.sha256,sha256(registry.supersedes.path));
assert.equal(registry.cases.length,0); assert.equal(registry.counts.qualifyingPilotCases,0); assert.equal(evidence.evidence.length,0);
assert.equal(privacy.privateStorageRequiredForRawEvidence,true); assert.equal(privacy.publicUrlForbiddenForPrivateEvidence,true); assert.equal(privacy.researchReuseImplied,false);
for(const file of ['synthetic-fixture.invalid.json','missing-consent.invalid.json','raw-pii.invalid.json']){
  const probe=readJson(`tests/fixtures/mrm-pilot-campaign/${file}`); const result=validatePilotCase(probe,{candidateRegistry:candidates,stageRegistry:stage,admissionContract:admission,baseMatrix}); assert.equal(result.qualifying,false,`${file} must be rejected`);
}
console.log('✓ MRM-S10 real-case Pilot Campaign admission layer passed.');
console.log('  DAR / RRP / Financial first-batch reservations exist, but 0 synthetic fixture is admitted and 0 real Pilot case is falsely claimed.');
