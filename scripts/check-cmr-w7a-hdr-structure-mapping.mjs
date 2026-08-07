import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
const J=async p=>JSON.parse(await fs.readFile(p,"utf8"));
const S=async p=>crypto.createHash("sha256").update(await fs.readFile(p)).digest("hex");
const r="content/professional/canonical-meaning-runtime/";
const P={reg:r+"registries/hdr-structure-mapping-registry-v1.json",codes:r+"registries/canonical-meaning-code-registry-v1.json",knowledge:r+"registries/canonical-meaning-knowledge-map-v1.json",accept:r+"acceptance/cmr-w7-hdr-mapping-acceptance-v1.json",legacy:r+"freeze/cmr-w7a-hdr-structure-mapping-freeze-v1.json",successor:r+"freeze/cmr-w7a-populated-state-freeze-v1.1.json",w6d:r+"freeze/cmr-w6d-mapping-foundation-freeze-v1.json"};
const [g,c,k,a,l,f,w]=await Promise.all(Object.values(P).map(J));
assert.equal(g.registryVersion,"1.1.0"); assert.equal(g.mappingCount,100); assert.equal(g.mappings.length,100);
assert.equal(g.coverage.sduMapped,64); assert.equal(g.coverage.scuMapped,36); assert.equal(g.coverage.resourceCenterMapped,0); assert.equal(g.coverage.processingNetworkMapped,0);
assert.equal(c.meaningCodes.length,100); assert.equal(k.mappings.length,100);
const codeSet=new Set(c.meaningCodes.map(x=>x.meaningCode)); const mapCodeSet=new Set();
for(const m of g.mappings){ assert.equal(m.sourceMethodCode,"HUMAN_DESIGN"); assert.equal(["GATE","CHANNEL"].includes(m.projectionType),true); assert.equal(m.boundary,"validation_only"); assert.equal(m.mappingAuthority,"PHIOS"); assert.match(m.mappingDigest,/^[a-f0-9]{64}$/); assert.equal(m.targetMeaningCodes.every(x=>codeSet.has(x)),true); assert.equal(mapCodeSet.has(m.mappingCode),false); mapCodeSet.add(m.mappingCode); }
assert.equal(a.results.productionAuthorityCreated,false); assert.equal(a.results.professionalConclusionCreated,false); assert.equal(a.results.journeyActivated,false);
assert.equal(w.status,"frozen"); assert.equal(l.invariants.actualMappingsCreated,false); // historical v1 readiness freeze remains immutable
assert.equal(f.successorVersion,"1.1.0"); assert.equal(f.populationState.mappingCount,100); assert.equal(f.invariants.legacyReadinessFreezeMutated,false);
for(const [p,h] of Object.entries(f.digests)){ assert.equal(await S(p),h); }
console.log("✓ CM-W7A v1.1 populated-state checker passed.");
console.log("✓ 64 SDU + 36 SCU mappings resolve only to registered PHI OS Meaning Codes with Knowledge Authority.");
console.log("✓ Historical CM-W7A v1.0 readiness freeze remains immutable; Resource Center and Processing Network stay fail-closed.");
