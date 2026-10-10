import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
const R="content/professional/canonical-meaning-runtime/";
const read=async p=>JSON.parse(await fs.readFile(p,"utf8"));
const sha=async p=>crypto.createHash("sha256").update(await fs.readFile(p)).digest("hex");

const [families,codes,ids,know,num,cross,hdrRuntime,ast,bzr,contract,ready,acceptance,freeze]=
await Promise.all([
  read(R+"registries/canonical-meaning-family-registry-v1.1.json"),
  read(R+"registries/canonical-meaning-code-registry-v1.2.json"),
  read(R+"identity/meaning-identity-registry-v1.2.json"),
  read(R+"registries/canonical-meaning-knowledge-map-v1.2.json"),
  read(R+"registries/num-meaning-mapping-registry-v1.json"),
  read(R+"registries/cross-method-number-meaning-mapping-registry-v1.json"),
  read(R+"registries/hdr-runtime-mapping-registry-v1.json"),
  read(R+"registries/ast-meaning-mapping-registry-v1.json"),
  read(R+"registries/bzr-meaning-mapping-registry-v1.1.json"),
  read(R+"contracts/numerology-meaning-mapping-foundation-v1.json"),
  read(R+"readiness/cmr-w10d-cross-method-mapping-readiness-v1.json"),
  read(R+"acceptance/cmr-w10-number-meaning-acceptance-v1.json"),
  read(R+"freeze/cmr-w10-corrected-number-meaning-freeze-v1.json")
]);

assert.equal(families.families.some(x=>x.familyCode==="NUMBER_ORIENTATION"),true);
const noCodes=codes.meaningCodes.filter(x=>x.meaningCode.startsWith("CM-NUMBER-ORIENTATION-NO"));
assert.equal(noCodes.length,12);
for(const m of noCodes){
  assert.equal(m.meaningFamily,"NUMBER_ORIENTATION");
  assert.equal(m.dimensions.roleScoped,true);
  assert.equal(m.dimensions.crossMethodTruthClaim,false);
  assert.equal(/foundation orientation|problem resolution orientation|experimental orientation|relational orientation|structural orientation/i.test(m.definition),false);
}

assert.equal(num.mappingCount,12);
assert.deepEqual(num.mappingContext.populatedRoles,["LIFE_PATH"]);
assert.equal(num.mappingContext.sameNumberAcrossRolesAutoEquivalent,false);
for(const m of num.mappings){
  assert.equal(m.sourceMethod,"NUMEROLOGY");
  assert.equal(m.sourceProjectionType,"NUMBER");
  assert.equal(m.sourceProjectionValue.projectionRole,"LIFE_PATH");
  assert.equal(m.sourceProjectionLineage.required,true);
}

assert.equal(cross.hdrMappingCount,12);
assert.equal(cross.numSharedMeaningMappingCount,6);
assert.equal(cross.rules.sameMeaningDoesNotMergeSource,true);
assert.equal(cross.rules.sourceMergedValueAllowed,false);
assert.equal(cross.rules.crossMethodAgreementIsNotTruth,true);
const sources=new Set(cross.mappings.map(x=>x.sourceMethod));
assert.deepEqual([...sources].sort(),["HUMAN_DESIGN","NUMEROLOGY"]);
for(const code of ["CM-NUMBER-ORIENTATION-NO01","CM-NUMBER-ORIENTATION-NO02","CM-NUMBER-ORIENTATION-NO03",
                   "CM-NUMBER-ORIENTATION-NO04","CM-NUMBER-ORIENTATION-NO05","CM-NUMBER-ORIENTATION-NO06"]){
  const rows=cross.mappings.filter(x=>x.meaningCode===code);
  assert.ok(rows.some(x=>x.sourceMethod==="HUMAN_DESIGN"));
  assert.ok(rows.some(x=>x.sourceMethod==="NUMEROLOGY"));
}

assert.equal(hdrRuntime.runtimeScopes.some(x=>x.scopeCode==="PROFILE_NUMBER_STRUCTURE"),true);
assert.equal(ast.mappingCount,0);
assert.equal(bzr.mappingCount,29);
assert.equal(contract.rules.numberValueAloneInsufficient,true);
assert.equal(contract.rules.sourceMergingForbidden,true);

assert.equal(ready.status,"ready_for_canonical_meaning_runtime");
assert.equal(ready.ready_for_canonical_meaning_runtime,true);
assert.equal(ready.checks.hdrProfileSharedMeaningMappingAvailable,true);
assert.equal(ready.checks.astMappingFoundationAvailable,true);
assert.equal(ready.checks.astActualMappingPopulationAvailable,false);
assert.equal(ready.checks.bzrMappingAvailable,true);
assert.equal(ready.checks.numMappingAvailable,true);
assert.equal(ready.runtimeRequirement.astMustNotBeFabricated,true);
assert.equal(ready.nextStage,"CM-W11");

const idRows=ids.records??[];
for(const m of noCodes){
  assert.equal(idRows.some(x=>x.meaningCode===m.meaningCode),true);
  assert.equal(know.mappings.some(x=>x.meaningCode===m.meaningCode),true);
}
assert.equal(acceptance.results.sourceMergedMappings,0);
assert.equal(freeze.invariants.sourceMethodsMerged,false);
assert.equal(freeze.invariants.numberValueAloneCreatesMeaning,false);
assert.equal(freeze.invariants.readyForCMW11,true);
for(const p of freeze.outputs) assert.equal(await sha(p),freeze.digests[p]);

console.log("✓ CM-W10 corrected Cross-Method Number Meaning Foundation passed.");
console.log("  NUM LIFE_PATH 1–9/11/22/33 and HDR Profile Lines 1–6 use neutral NUMBER_ORIENTATION slots.");
console.log("  HUMAN_DESIGN and NUMEROLOGY lineage remain independent; shared Meaning is not a truth claim.");
console.log("✓ ready_for_canonical_meaning_runtime = true; AST actual mapping remains explicitly unresolved.");
