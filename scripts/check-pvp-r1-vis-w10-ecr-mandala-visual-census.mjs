import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const census=read('content/product-visual-platform-r1/ecr/census/ecr-mandala-visual-census-v1.json');
const inventory=read('content/product-visual-platform-r1/ecr/census/ecr-mandala-renderer-capability-inventory-v1.json');
const acceptance=read('content/product-visual-platform-r1/acceptance/pvp-r1-vis-w10-ecr-mandala-visual-census-v1.json');
const contract=read('content/embodied-configuration/ecr-customer-mandala-contract-v1.json');
const r2=read('content/embodied-configuration/ecr-mandala-r2/contracts/ecr-mandala-r2-customer-visual-intelligence-contract-v1.json');
const w11ContractPath='content/product-visual-platform-r1/ecr/hierarchy/ecr-mandala-hierarchy-contract-v1.json';
const w11AcceptancePath='content/product-visual-platform-r1/acceptance/pvp-r1-vis-w11-ecr-mandala-hierarchy-v1.json';
const w11=fs.existsSync(w11ContractPath)?read(w11ContractPath):null;
const w11Acceptance=fs.existsSync(w11AcceptancePath)?read(w11AcceptancePath):null;
assert.equal(census.status,'CENSUS_COMPLETE_EXISTING_RENDERER_REUSED');
assert.deepEqual(census.canonicalLayerOrder,['CC12','G16','Q16','R9','D12','M8','H64','A8']);
assert.equal(census.layerCensus.reduce((n,x)=>n+x.count,0),145);
assert.equal(census.addressableVisualNodeCount,145);
assert.deepEqual(contract.layerOrder,census.canonicalLayerOrder);
assert.equal(census.pvpReconciliation.existingRendererRebuilt,false);
assert.equal(census.pvpReconciliation.existingGeometryRebuilt,false);
assert.equal(census.pvpReconciliation.existingEcrMeaningAuthorityChanged,false);
assert.equal(census.pvpReconciliation.existingEcrCalculationAuthorityChanged,false);
assert.equal(census.pvpReconciliation.duplicateMandalaRendererCreated,false);
for(const [p,digest] of Object.entries(census.sourceDigests)){
  const current=sha(p);
  if(current===digest)continue;
  const governedRendererSuccessor=p===census.existingProductionPath.renderer
    && w11?.baselineCommit==='0b130813c6b599b48b1d76fe326c44691990b4b5'
    && w11?.rendererReconciliation?.existingRenderer===p
    && w11?.rendererReconciliation?.semanticSelectionChanged===false
    && w11?.rendererReconciliation?.calculationAuthorityChanged===false
    && w11?.rendererReconciliation?.meaningAuthorityChanged===false
    && w11Acceptance?.status==='MACHINE_ACCEPTED_MANDALA_HIERARCHY';
  assert.equal(governedRendererSuccessor,true,`W10 source drift without governed successor: ${p}`);
}
const renderer=text(census.existingProductionPath.renderer),hierarchy=fs.existsSync('assets/customer-ui/js/specialists/ecr/mandala-hierarchy.js')?text('assets/customer-ui/js/specialists/ecr/mandala-hierarchy.js'):'',css=text(census.existingProductionPath.stylesheet),geometry=text(census.existingProductionPath.geometry),projection=text(census.existingProductionPath.projection);
for(const token of ['PRIMARY_ACTIVE','SUPPORTING_ACTIVE','BACKGROUND','LOCKED_DEPTH','FREE_SNAPSHOT','PAID_DEPTH'])assert.ok((renderer+hierarchy).includes(token),`Mandala visual-state witness missing: ${token}`);
for(const token of ['configureTopicLens','configureFullscreen','mountPhiMandalaCrossEvidenceRail','mountPhiMandalaRealityBridgeVisual'])assert.ok(renderer.includes(token),`renderer witness missing: ${token}`);
for(const token of ['cx-ecr-mandala__selected-path','is-mandala-fullscreen','prefers-reduced-motion','forced-colors','@media print'])assert.ok(css.includes(token),`css witness missing: ${token}`);
for(const token of ['PHI_MANDALA_LAYER_GEOMETRY','ringSegmentGeometry','circularNodeGeometry','radialBarGeometry'])assert.ok(geometry.includes(token),`geometry witness missing: ${token}`);
assert.ok(projection.includes("expectedCounts={contexts:12,grammars:16,questions:16,capabilities:9,drivers:12,motions:8,configurations:64,activations:8}"));
assert.equal(r2.authorityBoundary.calculationAuthorityChanged,false);
assert.equal(r2.authorityBoundary.semanticAuthorityChanged,false);
assert.equal(inventory.capabilities.length,8);
assert.ok(inventory.capabilities.every(x=>x.present===true));
assert.equal(inventory.admissionBoundary.inventoryIsNotSuccessorAdmission,true);
assert.equal(acceptance.status,'MACHINE_ACCEPTED_EXISTING_MANDALA_CENSUS');
assert.equal(acceptance.counts.layers,8);
assert.equal(acceptance.counts.addressableVisualNodes,145);
assert.equal(acceptance.assertions.w11AllowedNow,true);
console.log('✓ PVP-R1-VIS-W10 ECR Mandala Visual Census passed.');
console.log('  Existing production renderer reused; 8 layers / 145 addressable visual nodes reconciled.');
console.log('  Current W11–W16-like capabilities are inventoried only; no duplicate Mandala, calculation authority, or ECR meaning authority was created.');
