import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRuntimeReadingReportCandidate } from '../functions/runtime-reading/report-candidate-runtime.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const B='content/products/runtime-reading';
const roles=j(`${B}/registries/runtime-reading-visual-role-registry-v1.json`);
const contract=j(`${B}/contracts/runtime-reading-visual-reference-contract-v1.json`);
const carAsset=j('content/professional/canonical-asset-runtime/contracts/canonical-asset-contract-v1.json');
const carFigure=j('content/professional/canonical-asset-runtime/contracts/car-figure-diagram-contract-v1.json');
const carPub=j('content/professional/canonical-asset-runtime/contracts/car-asset-publication-runtime-v1.json');
const bindings=j('content/professional/canonical-asset-runtime/registries/mfig-car-binding-registry-v1.json');
const media=j('content/professional/canonical-asset-runtime/registries/asset-media-registry-v1.json');
const f12=j(`${B}/fixtures/cases/F12/input.json`);

assert.ok(roles.baselineCommit.startsWith('f010b29'));
assert.equal(roles.visualRoles.length,9);
for (const role of ['REALITY_OVERVIEW','METHOD_STRUCTURE_AST','METHOD_STRUCTURE_BZR','METHOD_STRUCTURE_HDR','CARRIER_STRUCTURE','TIMELINE','CONVERGENCE','BOUNDARY','CONTINUITY']) assert.ok(roles.visualRoles.some(x=>x.visualRole===role));
assert.deepEqual(contract.visualTypes,['CALCULATED_VISUAL','EXPLANATORY_VISUAL']);
assert.deepEqual(contract.visualStates,['AVAILABLE','UNAVAILABLE','NOT_REQUIRED']);
assert.equal(contract.canonicalVisualAuthority.runtime,'CAR');
assert.equal(contract.rules.calculatedVisualRequiresCanonicalMethodProjection,true);
assert.equal(contract.rules.explanatoryVisualRequiresCARPublicationOrKnowledgeAuthority,true);
assert.equal(contract.rules.rrpGeneratesAdHocSvg,false);
assert.equal(contract.rules.rrpHardcodesLocalImage,false);
assert.equal(contract.rules.rrpInventsChartContent,false);
assert.equal(contract.rules.rrpOwnsPlacement,false);
assert.equal(contract.rules.rrpOwnsSizing,false);
assert.equal(contract.rules.rrpOwnsPagination,false);
for (const f of ['position','width','height','page','column','mobileOrder','printScale','style']) assert.ok(contract.forbiddenFields.includes(f));

for (const c of [carAsset,carFigure,carPub]) assert.equal(c.productionStatus,'validation_only');
assert.equal(media.productionStatus,'validation_only');
const m18=bindings.bindings.find(x=>x.mfigId==='MFIG-018');
assert.ok(m18);
assert.equal(m18.carPublicationEligible,true);
assert.equal(m18.bindingStatus,'NO_CAR_ASSET_BOUND');
assert.deepEqual(m18.publishedAssetRefs,[]);

const c12=await createRuntimeReadingReportCandidate(f12);
const visuals=c12.sections.flatMap(s=>s.visualSemanticReferences);
assert.equal(visuals.length,1);
assert.equal(visuals[0].visualType,'CALCULATED_VISUAL');
assert.equal(visuals[0].visualState,'UNAVAILABLE');
assert.ok(visuals[0].sourceProjectionReferences.length>0);
assert.equal(visuals[0].sourceAuthority,'CAR');
assert.equal(visuals[0].figureIdentity,'MFIG-018');

const fakeAvailable=structuredClone(f12);
const v=fakeAvailable.candidateDraft.sections[4].visualSemanticReferences[0];
v.visualState='AVAILABLE'; delete v.assetIdentity;
let err=null; try { await createRuntimeReadingReportCandidate(fakeAvailable); } catch(e){ err=e; }
assert.ok(err,'Available visual without CAR asset identity must fail closed.');

for (const f of j(`${B}/fixtures/runtime-reading-fixture-registry-v1.json`).positiveFixtures) {
  const input=j(f.inputFile);
  for (const vr of input.candidateDraft.sections.flatMap(s=>s.visualSemanticReferences)) {
    assert.equal(vr.sourceAuthority,'CAR');
    if (vr.figureIdentity) assert.ok(bindings.bindings.some(x=>x.mfigId===vr.figureIdentity),`Unknown MFIG identity ${vr.figureIdentity}`);
    if (vr.visualState==='AVAILABLE') assert.ok(media.media.some(x=>x.assetCode===vr.assetIdentity || x.mediaId===vr.assetIdentity),`Available visual lacks CAR media authority: ${vr.assetIdentity}`);
  }
}

console.log('✓ RRP-W25 semantic visual reference binding passed.');
console.log('  RRP knows WHAT visual evidence is semantically eligible; CAR remains visual authority and RRP owns no placement, sizing, pagination or ad-hoc visual generation.');
