import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const policy=await read('content/professional/canonical-asset-runtime/policies/car-quality-drift-policy-v1.json'); const freeze=await read('content/professional/canonical-asset-runtime/freeze/car-w16-freeze-v1.json');
assert.equal(policy.work,'CAR-W16'); assert.equal(policy.productionStatus,'validation_only'); for(const x of ['meaningDrift','knowledgeDrift','unsupportedClaim','crossAssetContamination']) assert.ok(policy.failClosedOn.includes(x)); assert.equal(policy.invariants.qualityEvaluationMayRepairContent,false); assert.equal(freeze.work,'CAR-W16');
console.log('✓ CAR-W16 Quality Drift checker passed.');
