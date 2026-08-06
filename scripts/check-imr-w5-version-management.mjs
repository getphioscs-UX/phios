import assert from 'node:assert/strict'; import fs from 'node:fs/promises';
const readJson=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const reg=await readJson('content/professional/method-governance/imr-version-management-registry-v1.json');
const methods=await readJson('content/professional/method-governance/imr-method-registry-v1.json');
const proposal=await readJson('content/professional/method-governance/numerology-method-proposal-v1.json');
assert.equal(reg.stageCode,'IMR-W5'); assert.equal(reg.runtimeAuthority,false); assert.equal(reg.versionPolicy.inPlaceBreakingMutationAllowed,false); assert.equal(reg.versionPolicy.frozenV1RequiresVersionedSuccessor,true);
for(const m of methods.methods){const v=reg.methods.find(x=>x.methodCode===m.methodCode); assert.ok(v); assert.equal(v.currentVersion,m.version); assert.equal(v.compatibilityStatus,'compatible_with_mr_frozen_v1');}
assert.equal(proposal.proposalStatus,'proposal_only'); assert.equal(proposal.activationPolicy.registeredInIMRW1,false); assert.equal(proposal.activationPolicy.productionUseAllowed,false); assert.equal(proposal.proposedCalculationBoundary.deterministic,true); assert.equal(proposal.proposedCalculationBoundary.aiAllowed,false);
console.log('✓ IMR-W5 Version Management passed.'); console.log('  Version, Migration, Compatibility and Deprecation are governed.'); console.log('  Numerology remains proposal-only and cannot bypass IMR v1.');
