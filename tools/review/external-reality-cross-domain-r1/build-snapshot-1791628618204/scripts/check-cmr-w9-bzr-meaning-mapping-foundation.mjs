import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";

const readJson = async p => JSON.parse(await fs.readFile(p,"utf8"));
const sha = async p => crypto.createHash("sha256").update(await fs.readFile(p)).digest("hex");
const r = "content/professional/canonical-meaning-runtime/";

const paths = {
  contract: r+"contracts/bzr-meaning-mapping-contract-v1.json",
  registry: r+"registries/bzr-meaning-mapping-registry-v1.json",
  readiness: r+"readiness/bzr-meaning-mapping-readiness-v1.json",
  acceptance: r+"acceptance/cmr-w9-bzr-mapping-acceptance-v1.json",
  freeze: r+"freeze/cmr-w9-bzr-meaning-mapping-freeze-v1.json",
  codes: r+"registries/canonical-meaning-code-registry-v1.json",
  identities: r+"identity/meaning-identity-registry-v1.json",
  knowledgeMap: r+"registries/canonical-meaning-knowledge-map-v1.json",
  globalMappings: r+"registries/versioned-method-meaning-mapping-registry-v1.json",
  bzrProjection: "content/professional/core-method-runtime/bzr-projection-runtime-v1.json",
  cmW6D: r+"freeze/cmr-w6d-mapping-foundation-freeze-v1.json"
};

const [c,g,q,a,f,codes,identities,knowledgeMap,globalMappings,p,w6d] =
  await Promise.all(Object.values(paths).map(readJson));

assert.equal(c.work,"CM-W9");
assert.equal(c.productionStatus,"validation_only");
assert.equal(c.soleInputAuthority.methodCode,"BAZI");
assert.equal(c.soleInputAuthority.pluginCode,"BZR");
assert.deepEqual(c.mappingScopes.map(x=>x.projectionType),
  ["STEM","BRANCH","PILLAR","LUCK_CYCLE"]);
assert.deepEqual(c.mappingScopes.map(x=>x.targetSemanticDomain),[
  "ACTIVATION_QUALITY",
  "CARRIER_CONTEXT",
  "TEMPORAL_STRUCTURAL_POSITION",
  "RUNTIME_PHASE_CONTEXT"
]);

for(const x of [
  "TEN_GODS_INTERPRETATION",
  "USEFUL_GOD_INTERPRETATION",
  "FORTUNE_PREDICTION",
  "IDENTITY_FACT",
  "ORIGINAL_BAZI_INTERPRETATION_TEXT",
  "RAW_METHOD_OBJECT"
]) assert.equal(c.forbiddenContent.includes(x),true);

assert.equal(g.mappingCount,0);
assert.deepEqual(g.mappings,[]);
for(const type of ["STEM","BRANCH","PILLAR","LUCK_CYCLE"])
  assert.equal(g.sourceProjectionSurface[type].status,"available");

assert.equal(q.status,"blocked");
assert.equal(q.readyForMappingPopulation,false);
assert.equal(q.actualMappingsCreated,false);
assert.equal(a.results.actualMappings,0);
assert.equal(a.results.rawBaZiRead,false);
assert.equal(a.results.traditionalInterpretationStored,false);

assert.deepEqual(p.projectionTypes,["STEM","BRANCH","PILLAR","LUCK_CYCLE"]);
assert.equal(p.projectionAuthority.runtimeCode,"SHARED_PROJECTION_RUNTIME");
assert.equal(p.boundaries.createsInterpretation,false);
assert.equal(p.boundaries.createsKnowledge,false);

const meaningCodes = codes.meaningCodes ?? [];
for (const ns of [
  "CM-ACTIVATION-QUALITY",
  "CM-CARRIER-CONTEXT",
  "CM-TEMPORAL-POSITION",
  "CM-RUNTIME-PHASE"
]) {
  assert.equal(meaningCodes.some(x => x.meaningCode?.startsWith(ns)), false);
}

assert.ok(Array.isArray(identities.records));
assert.ok(Array.isArray(knowledgeMap.mappings));
assert.ok(Array.isArray(globalMappings.mappings));
assert.equal(w6d.status,"frozen");

assert.equal(f.status,"frozen");
assert.equal(f.invariants.actualMappingsCreated,false);
assert.equal(f.invariants.existingMeaningRegistryModified,false);
assert.equal(f.invariants.existingKnowledgeMapModified,false);
assert.equal(f.invariants.existingVersionedMappingRegistryModified,false);
assert.equal(f.invariants.bzrProjectionRuntimeModified,false);
for(const output of f.outputs)
  assert.equal(await sha(output), f.digests[output]);

console.log("✓ CM-W9 BZR Meaning Mapping Foundation passed.");
console.log("✓ STEM → Activation Quality; BRANCH → Carrier Context; PILLAR → Temporal Structural Position; LUCK_CYCLE → Runtime Phase Context.");
console.log("✓ All four BZR Canonical Projection surfaces are available.");
console.log("✓ Actual mapping population remains fail-closed until PHI OS target Meaning Codes and Knowledge Authority are registered.");
