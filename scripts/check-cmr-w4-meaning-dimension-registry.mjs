import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
const readJson=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const sha=async p=>crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex');
const root='content/professional/canonical-meaning-runtime/';
const paths={schema:root+'schemas/canonical-meaning-dimension-registry-v1.schema.json',contract:root+'contracts/canonical-meaning-dimension-contract-v1.json',registry:root+'registries/canonical-meaning-dimension-registry-v1.json',freeze:root+'freeze/cmr-w4-freeze-v1.json',family:root+'registries/canonical-meaning-family-registry-v1.json',code:root+'registries/canonical-meaning-code-registry-v1.json',semantic:'content/knowledge/semantic/semantic-runtime-freeze.json'};
const [schema,contract,registry,freeze,family,code]=await Promise.all([paths.schema,paths.contract,paths.registry,paths.freeze,paths.family,paths.code].map(readJson));
assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');
assert.equal(contract.work,'CM-W4'); assert.equal(contract.productionStatus,'validation_only');
assert.equal(contract.rules.meaningMustNotBeSingleLabel,true); assert.equal(contract.rules.familySpecificDimensionSetsRequired,true); assert.equal(contract.rules.methodProjectionMayNotDefineDimensionSemantics,true);
assert.equal(registry.registryCode,'PHI-OS-CANONICAL-MEANING-DIMENSION-REGISTRY'); assert.equal(registry.productionStatus,'validation_only');
const familyCodes=new Set(family.families.map(x=>x.familyCode));
assert.equal(registry.familyDimensionSets.length,familyCodes.size);
const ids=registry.dimensions.map(x=>x.dimensionId), codes=registry.dimensions.map(x=>x.dimensionCode);
assert.equal(new Set(ids).size,ids.length); assert.equal(new Set(codes).size,codes.length);
for(const d of registry.dimensions){assert.match(d.dimensionId,/^CMD-[A-Z0-9-]+$/);assert.match(d.dimensionVersion,/^\d+\.\d+\.\d+$/);assert.ok(d.definition.length>=20);assert.equal(d.status,'registered');}
for(const set of registry.familyDimensionSets){assert.equal(familyCodes.has(set.familyCode),true);assert.ok(set.requiredDimensionCodes.length>0);assert.ok(set.allowedDimensionCodes.length>=set.requiredDimensionCodes.length);for(const c of set.requiredDimensionCodes)assert.equal(set.allowedDimensionCodes.includes(c),true);for(const c of set.allowedDimensionCodes)assert.equal(codes.includes(c),true);assert.equal(set.methodMappingAllowed,false);}
assert.deepEqual(code.meaningCodes,[]);
assert.equal(freeze.status,'frozen');assert.equal(freeze.work,'CM-W4');for(const o of freeze.outputs)assert.equal(await sha(o),freeze.digests[o],`${o} changed after CM-W4 freeze`);
assert.equal(await sha(paths.semantic),freeze.protectedDigests.khW4G6SemanticRuntimeFreeze);
assert.equal(freeze.invariants.methodMappingCreated,false);assert.equal(freeze.invariants.meaningCodePopulationCreated,false);assert.equal(freeze.invariants.productionAuthorityCreated,false);
console.log('✓ CM-W4 Meaning Dimension Registry passed.');
console.log(`✓ ${registry.dimensions.length} controlled dimensions and ${registry.familyDimensionSets.length} family-specific dimension sets registered.`);
console.log('✓ No Meaning Code population, Method Mapping or Production authority was created.');
console.log('✓ KH-W4G.6 Semantic Runtime Freeze remains unchanged.');
