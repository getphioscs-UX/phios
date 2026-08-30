import assert from 'node:assert/strict';
import fs from 'node:fs';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const schema=read(`${ROOT}/claims/hd-pro-r3-semantic-claim-ir-v1.schema.json`);
const contract=read(`${ROOT}/claims/HD-PRO-R3-W3-claim-ir-contract-v1.json`);
const registry=read(`${ROOT}/claims/hd-pro-r3-semantic-claim-candidates-v1.json`);
const units=read(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);

assert.equal(schema.$id,'PHI-OS-HD-PRO-R3-SEMANTIC-CLAIM-IR-v1.schema.json');
assert(schema.required.includes('sourceRefs'));
assert(schema.required.includes('semanticAdmissionStatus'));
assert(schema.required.includes('customerPublishable'));
assert(schema.properties.claimType.enum.includes('DECISION'));
assert(schema.properties.claimType.enum.includes('ADVANCED'));

assert.equal(contract.schemaVersion,'PHI-OS-HD-PRO-R3-W3-CLAIM-IR-CONTRACT-v1.0.0');
assert.equal(contract.status,'ACTIVE_R3_SHADOW');
assert.deepEqual(contract.claimLifecycle,['SOURCE_PENDING','SOURCE_ADMITTED','SEMANTIC_ADMITTED','COMPOSITION_SUPPORTED','MACHINE_VERIFIED','HUMAN_ACCEPTED','CUSTOMER_PUBLISHED']);
assert(contract.rules.some(x=>x.includes('Atomic source text is not customer interpretation')));
assert(contract.rules.some(x=>x.includes('R2 24/24 human acceptance does not admit any R3 claim')));

assert.equal(registry.schemaVersion,'PHI-OS-HD-PRO-R3-W3-CANONICAL-SEMANTIC-CLAIM-IR-v1.0.0');
assert.equal(registry.baselineCommit,'791e1a130750affa13831f248e89a8b921e54743');
assert.equal(registry.status,'CLAIM_IR_ESTABLISHED_SOURCE_CANDIDATES_ONLY');
assert.equal(registry.counts.sourceCandidateClaims,222);
assert.equal(registry.counts.sourceAdmitted,222);
assert.equal(registry.counts.semanticAdmitted,0);
assert.equal(registry.counts.compositionSupported,0);
assert.equal(registry.counts.machineVerified,0);
assert.equal(registry.counts.humanAccepted,0);
assert.equal(registry.counts.customerPublishable,0);
assert.equal(new Set(registry.claims.map(x=>x.claimId)).size,222);

const sourceIds=new Set(units.sourceUnits.map(x=>x.sourceUnitId));
const validClaimTypes=new Set(schema.properties.claimType.enum);
for(const claim of registry.claims){
  assert.equal(claim.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert(validClaimTypes.has(claim.claimType),`${claim.claimId} invalid claim type`);
  assert.equal(claim.scope,'VALUE_SPECIFIC_SOURCE_CANDIDATE');
  assert(claim.sourceRefs.length>=1,`${claim.claimId} lacks source`);
  for(const ref of claim.sourceRefs) assert(sourceIds.has(ref),`${claim.claimId} references unknown source unit ${ref}`);
  assert.equal(claim.admissionStatus,'SOURCE_ADMITTED');
  assert.equal(claim.semanticAdmissionStatus,'SEMANTIC_REVIEW_PENDING');
  assert.equal(claim.customerMeaning,null);
  assert.equal(claim.compositionRuleId,null);
  assert.equal(claim.compositionSupported,false);
  assert.equal(claim.machineVerified,false);
  assert.equal(claim.humanAccepted,false);
  assert.equal(claim.customerPublishable,false);
}

console.log('✓ HD-PRO-R3-W3 Canonical Semantic Claim IR passed.');
console.log('  222 source-anchored claim candidates exist, but zero are falsely marked SEMANTIC_ADMITTED or customer-publishable.');
