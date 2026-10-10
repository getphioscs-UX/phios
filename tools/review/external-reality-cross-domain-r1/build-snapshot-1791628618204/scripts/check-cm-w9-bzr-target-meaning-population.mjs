import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
const R="content/professional/canonical-meaning-runtime/";
const read=async p=>JSON.parse(await fs.readFile(p,"utf8"));
const sha=async p=>crypto.createHash("sha256").update(await fs.readFile(p)).digest("hex");

const [
  familyV1,codesV1,idV1,knowV1,bzrV1,
  families,codes,ids,know,bzr,contract,acceptance,freeze,nodesDoc
]=await Promise.all([
  read(R+"registries/canonical-meaning-family-registry-v1.json"),
  read(R+"registries/canonical-meaning-code-registry-v1.json"),
  read(R+"identity/meaning-identity-registry-v1.json"),
  read(R+"registries/canonical-meaning-knowledge-map-v1.json"),
  read(R+"registries/bzr-meaning-mapping-registry-v1.json"),
  read(R+"registries/canonical-meaning-family-registry-v1.1.json"),
  read(R+"registries/canonical-meaning-code-registry-v1.2.json"),
  read(R+"identity/meaning-identity-registry-v1.2.json"),
  read(R+"registries/canonical-meaning-knowledge-map-v1.2.json"),
  read(R+"registries/bzr-meaning-mapping-registry-v1.1.json"),
  read(R+"contracts/bzr-target-meaning-population-contract-v1.json"),
  read(R+"acceptance/cmr-w9a-w9d-bzr-meaning-population-acceptance-v1.json"),
  read(R+"freeze/cmr-w9-corrected-meaning-population-freeze-v1.json"),
  read("content/knowledge/registry/nodes.json")
]);

const nodes=Array.isArray(nodesDoc)?nodesDoc:nodesDoc.nodes;
const nodeSet=new Set(nodes.map(x=>x.nodeCode));
const famSet=new Set(families.families.map(x=>x.familyCode));
for(const x of ["ACTIVATION_QUALITY","CARRIER_CONTEXT","TEMPORAL_STRUCTURAL_POSITION","RUNTIME_PHASE_CONTEXT"])
  assert.equal(famSet.has(x),true);

assert.equal(families.registryVersion,"1.1.0");
assert.equal(codes.registryVersion,"1.2.0");
assert.equal(bzr.mappingCount,29);
assert.deepEqual(bzr.coverage.STEM,{expected:10,mapped:10});
assert.deepEqual(bzr.coverage.BRANCH,{expected:12,mapped:12});
assert.deepEqual(bzr.coverage.PILLAR,{expected:4,mapped:4});
assert.equal(bzr.coverage.LUCK_CYCLE.mapped,3);

const newCodes=codes.meaningCodes.filter(x =>
  /CM-(ACTIVATION-QUALITY-AQ|CARRIER-CONTEXT-CC|TEMPORAL-POSITION-TP|RUNTIME-PHASE-RP)/.test(x.meaningCode)
);
assert.equal(newCodes.length,29);
for(const m of newCodes){
  assert.ok(m.definition.includes("PHI OS"));
  assert.ok(m.dimensions && typeof m.dimensions==="object");
  assert.ok(Array.isArray(m.boundaries) && m.boundaries.length>=7);
  assert.equal(/expansive|radiant|receptive|ten gods|useful god|wood element|fire element|earth element|metal element|water element/i.test(m.definition),false,
    `Interpretive wording leaked into ${m.meaningCode}`);
  for(const n of [...m.knowledgeAuthority.primaryNodeCodes,...m.knowledgeAuthority.supportingNodeCodes])
    assert.equal(nodeSet.has(n),true,`Missing knowledge node ${n}`);
}
const idRecords=ids.records??[];
for(const m of newCodes)
  assert.equal(idRecords.some(x=>x.meaningCode===m.meaningCode),true);
for(const m of newCodes)
  assert.equal(know.mappings.some(x=>x.meaningCode===m.meaningCode),true);

for(const m of bzr.mappings){
  assert.equal(m.sourceMethod,"BAZI");
  assert.ok(["STEM","BRANCH","PILLAR","LUCK_CYCLE"].includes(m.sourceProjectionType));
  assert.equal(m.sourceProjectionLineage.required,true);
  assert.equal(m.sourceProjectionLineage.sourceMayBeMerged,false);
  assert.equal(m.mappingAuthority,"PHIOS");
  assert.equal(m.mappingConfidence,"structural_correspondence");
  assert.equal(m.boundary,"validation_only");
  assert.equal(m.createsInterpretation,false);
  assert.equal(m.createsKnowledge,false);
}

assert.equal(contract.meaningModel,"neutral_phi_os_semantic_slots");
assert.equal(acceptance.results.traditionalInterpretationStored,false);
assert.equal(freeze.invariants.v1AuthoritiesModified,false);
for(const p of freeze.outputs) assert.equal(await sha(p),freeze.digests[p]);

// Frozen v1 object counts are still the original state.
assert.equal(familyV1.registryVersion,"1.0.0");
assert.equal(codesV1.meaningCodes.length,100);
assert.equal(bzrV1.mappingCount,0);
assert.equal((idV1.records??idV1.identities??[]).length,100);
assert.equal(knowV1.mappings.length,100);

console.log("✓ CM-W9 corrected BZR Target Meaning Population passed.");
console.log("  4 PHI OS families + 29 neutral semantic slots + identity/knowledge authority + 29 BZR mappings.");
console.log("  No traditional BaZi interpretation, personality, fortune or professional conclusion is stored in Meaning.");
