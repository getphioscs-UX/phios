import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const j=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const b='content/professional/canonical-asset-runtime/';
const [c,fschema,dschema,f,d,bad,r,freeze,types,pds]=await Promise.all([
 j(b+'contracts/car-figure-diagram-contract-v1.json'),j(b+'schemas/figure-specification-v1.schema.json'),j(b+'schemas/diagram-specification-v1.schema.json'),j(b+'fixtures/figure-specification.valid.json'),j(b+'fixtures/diagram-specification.valid.json'),j(b+'fixtures/figure-diagram-specification.invalid.json'),j(b+'registries/visual-specification-type-registry-v1.json'),j(b+'freeze/car-w4-freeze-v1.json'),j(b+'registries/canonical-asset-type-registry-v1.json'),j('content/registry/pds-w2-design-token-contract.json')]);
assert.deepEqual(c.assetTypes,['FIGURE','DIAGRAM']); assert.equal(c.invariants.specificationIsFinalMedia,false); assert.equal(c.invariants.candidateRegistryCreated,false);
for(const x of [f,d]){assert.equal(x.status,'validation_only');assert.ok(x.meaningReferences.length&&x.knowledgeReferences.length&&x.sourceFragmentDigests.length);assert.equal(x.factualBoundary.publishedOnly,true);}
assert.equal(f.assetType,'FIGURE'); assert.equal(f.factualBoundary.newClaimsAllowed,false); assert.deepEqual(fschema.properties.assetType,{const:'FIGURE'});
assert.equal(d.assetType,'DIAGRAM'); assert.equal(d.factualBoundary.newMechanismsAllowed,false); assert.deepEqual(dschema.properties.assetType,{const:'DIAGRAM'});
assert.equal(bad.factualBoundary.publishedOnly,false); assert.deepEqual(r.types.map(x=>x.assetType),['FIGURE','DIAGRAM']);
for(const t of r.types) assert.ok(types.assetTypes.some(x=>x.assetType===t.assetType&&x.authorityMode==='car_native'));
assert.equal(pds.source.canonicalFile,'assets/css/tokens.css'); assert.equal(freeze.baselineCommit,'9132b4eebc382efe5801d1054ca4d8a647b37b10');
console.log('✓ CAR-W4 Figure and Diagram passed.'); console.log('✓ Figure/Diagram specifications require governed visual structure, published sources and accessibility descriptions.'); console.log('✓ Specifications are not final media and CAR-W10 candidate authority was not created early.');
