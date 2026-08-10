import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const contract=await read('content/professional/canonical-asset-runtime/contracts/car-surface-projection-runtime-v1.json'); const freeze=await read('content/professional/canonical-asset-runtime/freeze/car-w15-freeze-v1.json');
assert.equal(contract.work,'CAR-W15'); assert.equal(contract.productionStatus,'validation_only'); assert.equal(contract.rules.sourceMustAlreadyBePublishedForSameSurface,true); assert.equal(contract.rules.surfaceProjectionMayCreateKnowledge,false); assert.equal(contract.rules.surfaceProjectionMayCreateMeaning,false); assert.equal(freeze.work,'CAR-W15');
console.log('✓ CAR-W15 Surface Projection checker passed.');
