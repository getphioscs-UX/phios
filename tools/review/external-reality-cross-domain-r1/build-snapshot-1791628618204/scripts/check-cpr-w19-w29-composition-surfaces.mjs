import assert from 'node:assert/strict'; import fs from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8')); const b='content/professional/canonical-presentation-runtime';
const composition=await readJson(`${b}/contracts/cpr-canonical-composition-runtime-v1.json`); assert.equal(composition.work,'CPR-W19'); assert.equal(composition.deterministic,true);
const surface=await readJson(`${b}/registries/cpr-surface-projection-registry-v1.json`); assert.deepEqual(surface.entries.map(x=>x.work),['CPR-W20','CPR-W21','CPR-W22','CPR-W23','CPR-W24','CPR-W25']); assert.equal(surface.entries.every(x=>x.publishedOnly),true);
const registry=await readJson(`${b}/registries/canonical-presentation-registry-v1.json`); assert.equal(registry.productionRecords.length,0); assert.equal(registry.productionRecordsMustRemainEmptyAtFreeze,true);
for (const f of ['cpr-presentation-drift-runtime-v1.json','cpr-presentation-acceptance-contract-v1.json','cpr-cross-surface-consistency-v1.json']) await readJson(`${b}/contracts/${f}`);
console.log('✓ CPR-W19-W29 composition, surfaces and governance passed.');
