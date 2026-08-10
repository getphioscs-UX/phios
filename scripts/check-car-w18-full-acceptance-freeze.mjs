import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const acceptance=await read('content/professional/canonical-asset-runtime/contracts/car-full-acceptance-v1.json'); const freeze=await read('content/professional/canonical-asset-runtime/freeze/car-w18-freeze-v1.json');
assert.equal(acceptance.work,'CAR-W18'); assert.equal(acceptance.productionStatus,'validation_only'); for(const x of ['providerDisabledByDefault','noPaidFallback','noNewCanonicalMeaning','noKnowledgeSourceDuplication']) assert.ok(acceptance.requirements.includes(x)); assert.equal(acceptance.invariants.carIsKnowledgeAuthority,false); assert.equal(acceptance.invariants.carIsMeaningAuthority,false); assert.equal(acceptance.invariants.providersEnabled,false); assert.equal(freeze.work,'CAR-W18');
console.log('✓ CAR-W18 Full Acceptance Freeze checker passed.');
