import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExternalProfileExtractionIr} from '../functions/external-profile/external-profile-extraction-ir.js';
import {buildExternalProfileConfirmationDraft,confirmExternalProfile} from '../functions/external-profile/external-profile-confirmation.js';
import {buildConfirmedHumanDesignContextTransport} from '../functions/external-profile/human-design-context-transport.js';
import {buildEcrHumanDesignComparisonIR,ECR_HD_COMPARISON_IR_VERSION} from '../functions/external-profile/ecr-human-design-comparison-ir.js';
import {ECR_HD_CUSTOMER_COMPARISON_RENDERER_VERSION,renderEcrHumanDesignComparison} from '../assets/customer-ui/js/specialists/ecr/human-design-comparison-renderer.js';
import {buildBenchmark} from './smr-benchmark-support.mjs';

const acceptance=JSON.parse(fs.readFileSync('content/embodied-configuration/product-r3/acceptance/ecr-r3-w6-customer-comparison-renderer-v1.json','utf8'));
assert.equal(acceptance.baselineCommit,'d86589d0be33ace066b29f300959cfdc27ced6e6');
assert.equal(acceptance.status,'ENGINEERING_COMPLETE');
assert.equal(acceptance.rendererAuthority.rendererVersion,ECR_HD_CUSTOMER_COMPARISON_RENDERER_VERSION);
assert.equal(acceptance.rendererAuthority.inputAuthority.includes(ECR_HD_COMPARISON_IR_VERSION),true);
assert.equal(acceptance.boundaries.rendererCreatesMeaning,false);
assert.equal(acceptance.boundaries.directFieldEquivalenceCreated,false);
assert.equal(acceptance.boundaries.compatibilityScoreCreated,false);
assert.equal(acceptance.successorBoundary.w7CurrentRealityBridgeCreated,false);

function confirmedProfile({rich=true,intakeId='ECR-R3-W6-HD-COMPARISON'}={}){
  const pastedText=(rich?[
    'Type: Generator',
    'Strategy: Wait to Respond',
    'Authority: Sacral',
    'Profile: 5/1',
    'Definition: Single Definition',
    'Incarnation Cross: Right Angle Cross of W6 Renderer',
    'Signature: Satisfaction',
    'Not-Self Theme: Frustration',
    'Channels: 43-23 | 29-46',
    'Defined Centers: Ajna, Throat, G Center, Sacral',
    'Open Centers: Head, Spleen, Root',
    'Design activated Gates: 29.1 46.2',
    'Personality activated Gates: 43.5 23.5'
  ]:[
    'Type: Generator',
    'Strategy: Wait to Respond'
  ]).join('\n');
  const extraction=buildExternalProfileExtractionIr({
    intakeId,
    sources:[{sourceType:'CUSTOMER_PASTED_TEXT',sourceAuthority:'CUSTOMER'}],
    pastedText,
    manualFields:rich?{environment:'Markets',cognition:'Inner Vision',motivation:'Hope',perspective:'Possibility',determination:'Low Sound',trajectory:'Observer'}:{}
  });
  return confirmExternalProfile({confirmationDraft:buildExternalProfileConfirmationDraft(extraction),confirmedAt:'2026-08-31T01:00:00.000Z'});
}
function contextOf(profile,locale='zh-Hans'){
  return buildConfirmedHumanDesignContextTransport(profile,{locale,intent:'ECR-R3-W6 renderer regression',generatedAt:'2026-08-31T01:01:00.000Z'});
}

const ecr=await buildBenchmark('ECR');
const richIr=buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:contextOf(confirmedProfile()),locale:'zh-Hans'});
const html=renderEcrHumanDesignComparison(richIr);
assert(html.includes('id="ecr-hd-comparison"'));
assert(html.includes('data-ecr-hd-comparison="true"'));
assert(html.includes(ECR_HD_CUSTOMER_COMPARISON_RENDERER_VERSION));
assert(html.includes('同一份出生背景，两种不同的问题'));
assert(html.includes('共同观察领域'));
assert(html.includes('互补视角'));
assert(html.includes('没有直接对应'));
assert(html.includes('Generator'));
assert(html.includes('Wait to Respond'));
assert(html.includes('Sacral'));
assert(html.includes('5/1'));
assert(html.includes('Markets'));
assert(html.includes('可继续观察的问题'));
assert(html.includes('已确认外部图表 · 非 PHI OS 计算'));
for(const dimension of richIr.dimensions.filter(item=>item.status!=='NO_SOURCE_MATERIAL')){
  assert(html.includes(dimension.label),`W6 missing governed dimension label: ${dimension.dimensionId}`);
  assert(html.includes(dimension.comparisonStatement),`W6 missing governed comparison statement: ${dimension.dimensionId}`);
  assert(html.includes(dimension.observationQuestion),`W6 missing governed observation question: ${dimension.dimensionId}`);
}
assert.equal(html.includes('R03 = Sacral'),false);
assert.equal(html.includes('A04 = Profile'),false);

const partialIr=buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:contextOf(confirmedProfile({rich:false,intakeId:'ECR-R3-W6-HD-PARTIAL'}),'en'),locale:'en'});
const partialHtml=renderEcrHumanDesignComparison(partialIr);
assert(partialHtml.includes('PHI OS does not fill in or calculate a missing field here.'));
assert(partialHtml.includes('Generator'));
assert(partialHtml.includes('Wait to Respond'));
assert.equal(partialHtml.includes('Sacral'),false,'W6 must not invent missing Authority');
assert.equal(partialHtml.includes('5/1'),false,'W6 must not invent missing Profile');

const blocked=structuredClone(richIr);
blocked.boundaries.directFieldEquivalenceCreated=true;
assert.equal(renderEcrHumanDesignComparison(blocked),'','W6 must fail closed if upstream comparison boundary drifts');

const renderer=fs.readFileSync('assets/customer-ui/js/specialists/ecr/human-design-comparison-renderer.js','utf8');
for(const token of [
  'renderEcrHumanDesignComparison',
  'mountEcrHumanDesignComparison',
  'data-ecr-hd-comparison',
  '#ecr-hd-comparison',
  '#ecr-section-11',
  "comparison?.boundaries?.rendererCreatesMeaning===false",
  "comparison?.boundaries?.directFieldEquivalenceCreated===false",
  "comparison?.boundaries?.compatibilityScoreCreated===false"
])assert(renderer.includes(token),`W6 renderer contract token missing: ${token}`);
for(const forbidden of ['canonical-meaning','meaning-registry','buildEcrHumanDesignComparisonIR','calculateHumanDesign','BodyGraph'])assert.equal(renderer.includes(forbidden),false,`W6 renderer must not own semantic/calculation authority: ${forbidden}`);

const personal=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
assert(personal.includes("from '../specialists/ecr/human-design-comparison-renderer.js'"));
assert(personal.includes('mountEcrHumanDesignComparison(view?.ecrHumanDesignComparison||null,productsRoot)'));
const css=fs.readFileSync('assets/customer-ui/surfaces/ecr-specialist.css','utf8');
for(const token of ['.cx-ecr-hd-comparison{','.cx-ecr-hd-comparison__columns{','@media(max-width:767px)','@media print'])assert(css.includes(token),`W6 CSS missing: ${token}`);

const w5=JSON.parse(fs.readFileSync('content/embodied-configuration/product-r3/acceptance/ecr-r3-w5-ecr-human-design-comparison-ir-v1.json','utf8'));
assert.equal(w5.canonicalCustomerRoute.customerRendererCreated,false,'W6 must not rewrite W5 historical acceptance');
assert.equal(richIr.boundaries.customerRendererCreated,false,'W6 must consume W5 IR without mutating its historical boundary object');

console.log('✓ ECR-R3-W6 Customer Comparison Renderer passed.');
console.log('  Governed W5 comparison statements, source units, confirmed Human Design claims and observation questions are rendered inside the ECR specialist reading before PHI Cards.');
console.log('  Partial confirmed charts stay partial; no field equivalence, compatibility score, second Human Design calculation or Current Reality conclusion is created by the renderer.');
