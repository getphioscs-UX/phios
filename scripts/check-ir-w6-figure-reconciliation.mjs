import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const mfig=read('content/professional/method-runtime/canonical-mfig-authority-registry-v1.json');
const byId=new Map(mfig.entries.map(e=>[e.mfigId,e]));
const ir=read('content/interpretation/figure/figure-interpretation-authority-registry-v1.json');
assert.equal(ir.entries.length,50);
assert.equal(ir.rules.irMayRedefineMfigIdentity,false);
for (const x of ir.entries) {
  const e=byId.get(x.mfigId); assert.ok(e,`missing MFIG ${x.mfigId}`);
  assert.equal(x.canonicalTitleSnapshot,e.canonicalTitle);
  assert.equal(x.canonicalVersionSnapshot,e.canonicalVersion);
  assert.equal(x.identityAuthorityMode,'MFIG_BOUND_SNAPSHOT_ONLY');
  assert.equal(x.interpretationUsability,'IDENTITY_BOUND_NO_DERIVATION_AUTHORITY_UNTIL_MIR-5');
  for (const k of ['supportedClaims','unsupportedClaims','operators','derivationEdges','knowledgeRefs','evidenceRefs']) assert.ok(Array.isArray(x[k]));
}
const versions=read('content/interpretation/figure/figure-version-reconciliation-v1.json');
assert.equal(versions.entries.length,50);
for (const x of versions.entries) if (x.versionState==='UNRESOLVED') { assert.equal(x.authoritativeDerivationEligible,false); assert.equal(x.canonicalInterpretationRuleEligible,false); assert.equal(x.productionInterpretationEligible,false); }
assert.equal(versions.adjacentFigureAuthority.mfigDoesNotReplaceBookFigureRegistry,true);
const graph=read('content/interpretation/figure/figure-dependency-graph-v1.json');
const types=new Set(['DIRECT','CONDITIONAL','CONTEXTUAL','ILLUSTRATIVE','NO_DERIVATION']);
assert.equal(graph.invariants.dependencyIsCausality,false); assert.equal(graph.invariants.sequenceIsCausality,false);
for (const e of graph.edges) { assert.ok(byId.has(e.from)&&byId.has(e.to)); assert.ok(types.has(e.dependencyType)); assert.equal(e.causalClaim,false); assert.equal(e.authorityTransfer,false); }
const cls=read('content/interpretation/figure/cross-figure-derivation-classification-v1.json');
assert.deepEqual(new Set(cls.classifications.map(x=>x.type)),types);
const car=read('content/professional/canonical-asset-runtime/registries/mfig-car-binding-registry-v1.json');
assert.equal(car.bindings.length,50); assert.equal(car.rules.carMayRedefineMfigIdentity,false); assert.equal(car.rules.mfigIdentityCreatesPublishedAsset,false);
for (const b of car.bindings) assert.equal(b.canonicalTitleSnapshot,byId.get(b.mfigId).canonicalTitle);
const mcd=read('content/professional/method-client-delivery/registries/mcd-6-mfig-binding-registry-v2.json');
assert.equal(mcd.rules.rendererMayRedefineMfigIdentity,false); assert.equal(mcd.rules.rendererMayCalculate,false); assert.equal(mcd.rules.rendererMayInterpret,false); assert.equal(mcd.rules.rendererMayCreateMeaning,false); assert.equal(mcd.rules.bindingGrantsProduction,false);
assert.equal(sha(mcd.supersedes),mcd.predecessorSha256,'historical MCD-6 MFIG binding v1 drift');
const irbind=read('content/interpretation/figure/mfig-ir-figure-binding-registry-v1.json');
assert.equal(irbind.bindings.length,50); assert.equal(irbind.rules.irOwnsIdentity,false); for (const b of irbind.bindings) assert.equal(b.interpretationAuthorityGranted,false);
console.log('✓ IR-W6 Figure Reconciliation passed: MFIG-bound snapshots only, all authoritative versions resolved, dependency ≠ causality, CAR/MCD/IR cannot redefine MFIG.');
