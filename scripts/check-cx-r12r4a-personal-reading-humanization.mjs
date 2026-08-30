import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER,customerCompositionAdmissionFor} from '../functions/customer-projection/r12r3b-composition-admission-consumer-v1.js';

const read=path=>fs.readFileSync(path,'utf8');
const json=path=>JSON.parse(read(path));
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const BASE='content/customer-experience-rebuild';
const admissionPath=`${BASE}/admission/cx-r12r3b-human-reviewed-composition-admission-v1.json`;
const admission=json(admissionPath);
const contract=json(`${BASE}/contracts/cx-r12r4a-customer-reading-language-contract-v1.json`);
const acceptance=json(`${BASE}/acceptance/cx-r12r4a-personal-reading-cutover-acceptance-v1.json`);
const manifest=json(`${BASE}/registries/cx-r12r4-visual-delivery-manifest-v1.json`);
const customerAssets=json(`${BASE}/authority/customer-visual-asset-registry-v2.json`);
const surface=read('assets/customer-ui/js/surfaces/personal-reality.js');
const graphRenderer=read('assets/customer-ui/js/method-graph-v1.js');
const api=read('functions/api/customer-personal-reality.js');
const html=read('perspectives/personal/index.html');
const css=read('assets/customer-ui/surfaces/personal-reality.css');
const pprR3SpecialistHost=html.includes('data-cx-specialist-products')&&fs.existsSync('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');

assert.equal(contract.work,'CX-R12R4A');
assert.equal(contract.baselineCommit,'5c1d05f400bd01e5d278327c97dffb5322940129');
assert.equal(contract.authorityBoundary.createsInterpretationAuthority,false);
assert.equal(contract.authorityBoundary.changesR12R3BMeaningAuthority,false);
assert.equal(contract.authorityBoundary.consumesHumanReviewedCompositionAdmission,true);
assert.deepEqual(contract.readingMap,['WHAT_HAS_BEEN_ESTABLISHED','WHAT_CAN_BE_READ_NOW','WHAT_STILL_NEEDS_MORE_INFORMATION']);
assert.deepEqual(contract.crossPerspectiveRule.requiresAcceptedMethods,['AST','BZR','NUM','ZWR']);
assert.deepEqual(contract.methodLabels,{AST:{en:'Astrology','zh-Hans':'占星'},BZR:{en:'BaZi','zh-Hans':'八字'},NUM:{en:'Numerology','zh-Hans':'数字学'},ZWR:{en:'Zi Wei','zh-Hans':'紫微斗数'}});

assert.equal(admission.status,'HUMAN_REVIEWED_COMPOSITION_ADMITTED');
assert.equal(admission.admissionBoundary.atomicMeaningAuthorityChanged,false);
assert.equal(admission.admissionBoundary.admissionCreatesNewMeaning,false);
assert.equal(CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER.sourceAuthorityRef,admissionPath);
assert.equal(CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER.sourceAuthoritySha256,digest(read(admissionPath)));
assert.equal(CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER.boundary.presentationCutoverOnly,true);
for(const methodId of ['AST','BZR','NUM','ZWR']){
  assert.equal(admission.methodAdmission[methodId].compositionCustomerPublishable,true);
  const gate=customerCompositionAdmissionFor(methodId);
  assert.equal(gate.compositionCustomerPublishable,true);
  assert.equal(gate.humanReview.methodFidelityAccepted,true);
  assert.equal(gate.humanReview.customerClarityAccepted,true);
}

const assetById=new Map(customerAssets.entries.map(asset=>[asset.assetId,asset]));
for(const asset of manifest.assets){
  assert.equal(fs.existsSync(asset.repoPath),true,`missing R12R4A asset ${asset.repoPath}`);
  const bytes=fs.readFileSync(asset.repoPath);
  assert.equal(bytes.length,asset.bytes,`R12R4A asset byte drift ${asset.repoPath}`);
  assert.equal(digest(bytes),asset.sha256,`R12R4A asset digest drift ${asset.repoPath}`);
}
for(const id of ['CXICON-GLOBAL-PROJECTION','CXICON-GLOBAL-INTERPRETATION','CXICON-GLOBAL-GOVERNANCE','CXICON-GLOBAL-NAVIGATION-THRESHOLD','CXICON-STATUS-AVAILABLE','CXICON-STATUS-PARTIAL','CXICON-STATUS-SEPARATE','CXICON-STATUS-UNAVAILABLE','CXICON-STATUS-TEMPORARY']){
  const asset=assetById.get(id);assert(asset,`missing customer asset ${id}`);
  const path=asset.publicUrl.slice(1);assert.equal(fs.existsSync(path),true,`unresolved customer asset ${id}`);
  assert.equal(digest(fs.readFileSync(path)),asset.sha256,`customer asset digest mismatch ${id}`);
}
assert.equal(assetById.get('CXICON-GLOBAL-PROJECTION').publicUrl,'/assets/icons/global/PHIOS-ICON-PROJECTION-v1.svg');

assert.match(api,/buildAcceptedMethodCustomerResult/);
assert.doesNotMatch(api,/buildMethodCustomerDevelopmentResult/);
const r12r4bSuccessor=api.includes('PHI-OS-CX-R12R4B-CUSTOMER-READING-VIEW-v1.0.0')&&api.includes('const reading=buildReadingView(')&&api.includes('methods:readingMethods');
if(r12r4bSuccessor){
  assert.match(api,/const readingState=allReadable\?'READY_TO_READ':readable\.length\?'PARTIALLY_PREPARED':'NEEDS_ATTENTION'/);
  assert.match(api,/methods:readingMethods/);
  assert.match(api,/const view=freeze\(\{\.\.\.stripLegacyInterpretation\(baseView\).*reading.*\}\)/);
  assert.doesNotMatch(api,/methodResults\s*:/);
}else{
  assert.match(api,/state:readable\.length===projections\.length\?'READY_TO_READ'/);
}
assert.doesNotMatch(api,/interpretationGate:\{state:'HUMAN_REVIEW_REQUIRED'/);
if(r12r4bSuccessor){
  assert.match(surface,/view\?\.reading\?\.map/);
  assert.match(surface,/Six-stage reading map/);
  assert.doesNotMatch(surface,/view\?\.methodResults|view\?\.interpretation/);
}else{
  assert.match(surface,/WHAT_HAS_BEEN_ESTABLISHED|What has been established/);
  assert.match(surface,/What you can read now/);
  assert.match(surface,/What still needs more information/);
}
const crossProductionSuccessor=surface.includes('view?.reading?.combinedReading')&&surface.includes('PHI-OS-CROSS-METHOD-RUNTIME-READING-IR-v2.0.0')&&surface.includes('combined.claims');
if(crossProductionSuccessor){
  assert.match(surface,/view\?\.reading\?\.combinedReading/);
  assert.match(surface,/PHI-OS-CROSS-METHOD-RUNTIME-READING-IR-v2\.0\.0/);
  assert.match(surface,/combined\.claims/);
  assert.doesNotMatch(surface,/results\.length!==4/);
  assert.doesNotMatch(surface,/\['AST','BZR','NUM','ZWR'\]\.every/);
}else{
  assert.match(surface,/results\.length!==4/);
  assert.match(surface,/\['AST','BZR','NUM','ZWR'\]\.every/);
}
assert.doesNotMatch(surface,/r\.state\.replaceAll/);
assert.doesNotMatch(surface,/<strong>\$\{esc\(result\.methodId\)\}<\/strong>/);
assert.match(surface,/Internal method code/);
assert.match(surface,/Projection reference/);
assert.match(surface,/<details><summary>\$\{esc\(tr\('Technical Details'/);
assert.match(graphRenderer,/METHOD_LABELS/);
assert.match(graphRenderer,/roleLabel\(row\.role\)/);
assert.match(graphRenderer,/stateLabel\(row\.state\)/);
if(pprR3SpecialistHost){
  const pprR3=json('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
  const productRenderers=read('assets/customer-ui/js/personal-products/personal-product-renderers.js');
  const specialistHost=read('assets/customer-ui/js/personal-products/specialist-renderer-host.js');
  assert.equal(pprR3.status,'FROZEN_PPR_R3_SPECIALIST_HOST');
  assert.match(html,/data-cx-specialist-products/);
  assert.match(surface,/renderProductRoute\(view\.productRoute/);
  assert.match(productRenderers,/mountApprovedSpecialistRenderer/);
  assert.match(specialistHost,/mountApprovedSpecialistRenderer/);
}else{
  assert.match(html,/Start with three questions: what has been established, what you can read now, and what still needs more information/);
  if(crossProductionSuccessor){
    assert.match(html,/When at least two selected method readings are ready, the governed Cross layer may compose only customer-publishable claims/);
    assert.doesNotMatch(html,/Cross-perspective comparison opens only when all four accepted method readings are present/);
  }else{
    assert.match(html,/Cross-perspective comparison opens only when all four accepted method readings are present/);
  }
}
assert.match(css,/cx-personal-overview-highlights/);
if(pprR3SpecialistHost)assert.match(css,/cx-specialist-products/);else assert.match(css,/cx-reading-map-live article\[data-state="READY"\]/);

const numProjection=json('content/interpretation/integration/fixtures/numerology-projection.valid.json').fixture;
const accepted=await buildAcceptedMethodCustomerResult({canonicalProjection:numProjection,locale:'en'});
if(accepted.schemaVersion==='PHI-OS-CX-R12R4B-CUSTOMER-READING-METHOD-v1.0.0'){
  assert.equal(accepted.methodLabel,'Numerology');
  assert.equal(accepted.state,'READY_TO_READ');
  assert(accepted.insights.length>0);
  assert.equal(accepted.visualModel.customerInterpretationBindingsAccepted,true);
  assert.equal(accepted.technical.boundary.rendererCreatesMeaning,false);
  assert.equal(accepted.technical.boundary.realityKnown,false);
  assert.equal(accepted.technical.acceptanceBasis,'ADMITTED_COMPOSITION_RULESET');
  assert.match(accepted.technical.admissionRef,/cx-r12r3b-human-reviewed-composition-admission-v1\.json/);
  assert.equal(accepted.technical.lifecycle.liveCustomerHumanReviewed,false);
}else{
  assert.equal(accepted.schemaVersion,'PHI-OS-CX-R12R4A-ACCEPTED-CUSTOMER-METHOD-VIEW-v1.0.0');
  assert.equal(accepted.label,'Numerology');
  assert.equal(accepted.state,'CUSTOMER_PUBLISHABLE');
  assert.equal(accepted.customerState,'READY_TO_READ');
  assert(accepted.insights.length>0);
  assert.equal(accepted.graph.customerInterpretationBindingsAccepted,true);
  assert.equal(accepted.structureOnly,false);
  assert.equal(accepted.boundary.rendererCreatesMeaning,false);
  assert.equal(accepted.boundary.realityKnown,false);
  assert.equal(accepted.technicalDetails.admissionAuthorityRef,admissionPath);
}

assert.equal(acceptance.work,'CX-R12R4A');
assert.equal(acceptance.claims.acceptedCustomerInterpretationViewModelActive,true);
assert.equal(acceptance.claims.internalStatusesHumanized,true);
assert.equal(acceptance.claims.methodLabelsHumanized,true);
assert.equal(acceptance.claims.unknownsRemainTruthful,true);
assert.equal(acceptance.claims.technicalDetailsProgressivelyDisclosed,true);
assert.equal(acceptance.claims.realBrowserAccepted,false);
assert.equal(acceptance.claims.humanVisualAccepted,false);
assert.equal(acceptance.claims.fullProduction,false);

console.log('✓ CX-R12R4A Personal Reading Experience cutover and humanization passed.');
console.log(pprR3SpecialistHost?'  PASS2B humanization contracts remain valid, while the frozen PPR-R3 specialist product host now owns the live reading surface; historical Reading Map copy is no longer required as a static HTML mount.':'  PASS2B customer-publishable interpretation view models now drive the customer surface; internal method/status identifiers are humanized, technical provenance is progressively disclosed, and the active Reading Map remains truthful about limits.');
