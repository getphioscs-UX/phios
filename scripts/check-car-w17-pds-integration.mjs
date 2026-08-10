import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const contract=await read('content/professional/canonical-asset-runtime/contracts/car-presentation-pds-integration-v1.json'); const freeze=await read('content/professional/canonical-asset-runtime/freeze/car-w17-freeze-v1.json');
assert.equal(contract.work,'CAR-W17'); assert.equal(contract.productionStatus,'validation_only'); assert.equal(contract.rules.publishedAssetRequired,true); assert.equal(contract.rules.pdsMayChangeMeaning,false); assert.equal(contract.rules.pdsMayChangeKnowledge,false); assert.equal(contract.rules.presentationMayInferRuntimeState,false); assert.equal(freeze.work,'CAR-W17');
console.log('✓ CAR-W17 PDS Integration checker passed.');
