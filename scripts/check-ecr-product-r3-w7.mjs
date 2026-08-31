import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExternalProfileExtractionIr} from '../functions/external-profile/external-profile-extraction-ir.js';
import {buildExternalProfileConfirmationDraft,confirmExternalProfile} from '../functions/external-profile/external-profile-confirmation.js';
import {buildConfirmedHumanDesignContextTransport} from '../functions/external-profile/human-design-context-transport.js';
import {buildEcrHumanDesignComparisonIR} from '../functions/external-profile/ecr-human-design-comparison-ir.js';
import {
  ECR_HD_REALITY_BRIDGE_IR_VERSION,
  ECR_HD_REALITY_BRIDGE_RULE_VERSION,
  ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION,
  buildEcrHumanDesignRealityBridgeIR,
  validateEcrHumanDesignRealityBridgeResponse
} from '../functions/external-profile/ecr-human-design-reality-bridge.js';
import {renderEcrHumanDesignRealityBridge,ECR_HD_REALITY_BRIDGE_RENDERER_VERSION} from '../assets/customer-ui/js/specialists/ecr/reality-bridge-renderer.js';
import {buildEcrHumanDesignRealityBridgeReportedContext,onRequestPost as handoffPost} from '../functions/api/customer-reality-handoff.js';
import {buildBenchmark} from './smr-benchmark-support.mjs';

const acceptance=JSON.parse(fs.readFileSync('content/embodied-configuration/product-r3/acceptance/ecr-r3-w7-reality-bridge-v1.json','utf8'));
assert.equal(acceptance.baselineCommit,'8c44a0e023a15a2e6f786306a83bd792b90bdb65');
assert.equal(acceptance.status,'ENGINEERING_COMPLETE');
assert.equal(acceptance.runtimeAuthority.bridgeIrSchemaVersion,ECR_HD_REALITY_BRIDGE_IR_VERSION);
assert.equal(acceptance.runtimeAuthority.bridgeRuleVersion,ECR_HD_REALITY_BRIDGE_RULE_VERSION);
assert.equal(acceptance.runtimeAuthority.responseSchemaVersion,ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION);
assert.equal(acceptance.customerRenderer.rendererVersion,ECR_HD_REALITY_BRIDGE_RENDERER_VERSION);
assert.equal(acceptance.boundaries.currentRealityEvidenceCreated,false);
assert.equal(acceptance.boundaries.currentRealityConclusionCreated,false);
assert.equal(acceptance.boundaries.userResponseIsReportedContextNotEvidence,true);

function confirmedProfile({rich=true,intakeId='ECR-R3-W7-HD'}={}){
  const pastedText=(rich?[
    'Type: Generator','Strategy: Wait to Respond','Authority: Sacral','Profile: 5/1','Definition: Single Definition',
    'Incarnation Cross: Right Angle Cross of W7 Bridge','Signature: Satisfaction','Not-Self Theme: Frustration',
    'Channels: 43-23 | 29-46','Defined Centers: Ajna, Throat, G Center, Sacral','Open Centers: Head, Spleen, Root',
    'Design activated Gates: 29.1 46.2','Personality activated Gates: 43.5 23.5'
  ]:['Type: Generator','Strategy: Wait to Respond']).join('\n');
  const extraction=buildExternalProfileExtractionIr({intakeId,sources:[{sourceType:'CUSTOMER_PASTED_TEXT',sourceAuthority:'CUSTOMER'}],pastedText,manualFields:rich?{environment:'Markets',cognition:'Inner Vision',motivation:'Hope',perspective:'Possibility',determination:'Low Sound',trajectory:'Observer'}:{}});
  return confirmExternalProfile({confirmationDraft:buildExternalProfileConfirmationDraft(extraction),confirmedAt:'2026-08-31T04:00:00.000Z'});
}
function contextOf(profile,locale='zh-Hans'){return buildConfirmedHumanDesignContextTransport(profile,{locale,intent:'ECR-R3-W7 reality bridge regression',generatedAt:'2026-08-31T04:01:00.000Z'})}

const ecr=await buildBenchmark('ECR');
const comparison=buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:contextOf(confirmedProfile()),locale:'zh-Hans'});
const bridge=buildEcrHumanDesignRealityBridgeIR({comparisonIr:comparison,locale:'zh-Hans'});
const repeated=buildEcrHumanDesignRealityBridgeIR({comparisonIr:comparison,locale:'zh-Hans'});
assert.equal(bridge.schemaVersion,ECR_HD_REALITY_BRIDGE_IR_VERSION);
assert.equal(bridge.ruleVersion,ECR_HD_REALITY_BRIDGE_RULE_VERSION);
assert.equal(bridge.state,'OBSERVATION_BRIDGE_READY');
assert.equal(bridge.bridgeDigest,repeated.bridgeDigest,'W7 bridge must be deterministic for identical governed comparison IR');
assert.equal(bridge.sourceComparisonDigest,comparison.comparisonDigest);
assert.equal(bridge.prompts.length,5);
assert.deepEqual(bridge.responseOptions.map(item=>item.code),['REPEATS_RELIABLY','CONTEXT_DEPENDENT','NOT_CLEAR_YET','CONTRADICTS_READING']);
assert.equal(bridge.prompts.every(prompt=>prompt.observationQuestion&&prompt.sourceLineage.ecrInterpretationUnitRefs.length),true);
assert.equal(bridge.boundaries.observationPromptOnly,true);
assert.equal(bridge.boundaries.currentRealityEvidenceCreated,false);
assert.equal(bridge.boundaries.currentRealityConclusionCreated,false);
assert.equal(bridge.boundaries.userResponseIsReportedContextNotEvidence,true);
assert.equal(bridge.boundaries.automaticPersistence,false);

const html=renderEcrHumanDesignRealityBridge(bridge);
assert(html.includes('id="ecr-section-10"'));
assert(html.includes('data-ecr-reality-bridge="true"'));
assert(html.includes('把比较带回你的现实经验'));
assert(html.includes('会稳定重复'));
assert(html.includes('只在特定情境出现'));
assert(html.includes('现在还看不出来'));
assert(html.includes('现实经验与这份读取不符合'));
assert(html.includes('不会自动变成证据'));
for(const prompt of bridge.prompts){assert(html.includes(prompt.promptId));assert(html.includes(prompt.observationQuestion))}

const response={schemaVersion:ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION,bridgeDigest:bridge.bridgeDigest,sourceComparisonDigest:bridge.sourceComparisonDigest,entries:[
  {promptId:bridge.prompts[0].promptId,dimensionId:bridge.prompts[0].dimensionId,responseCode:'REPEATS_RELIABLY',note:'在工作选择里重复出现'},
  {promptId:bridge.prompts[4].promptId,dimensionId:bridge.prompts[4].dimensionId,responseCode:'CONTRADICTS_READING',note:'时机感受与读取不同'}
]};
const validated=validateEcrHumanDesignRealityBridgeResponse(response,{bridgeIr:bridge});
assert.equal(validated.entries.length,2);
assert.equal(validated.boundaries.customerReported,true);
assert.equal(validated.boundaries.realityEvidence,false);
assert.equal(validated.boundaries.realityConclusion,false);
const reported=buildEcrHumanDesignRealityBridgeReportedContext({ecrHumanDesignRealityBridge:bridge,ecrHumanDesignRealityBridgeResponse:response},'zh-Hans');
assert.equal(reported.length,2);
assert(reported[0].includes('我观察到它会稳定重复'));
assert(reported[1].includes('我目前的现实经验与这份读取不符合'));
assert.equal(buildEcrHumanDesignRealityBridgeReportedContext({ecrHumanDesignRealityBridge:bridge},'zh-Hans').length,0,'No explicit response must create no reported context');

const handoffRequest=new Request('https://example.test/api/customer-reality-handoff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
  sourceType:'PERSONAL_REALITY',locale:'zh-Hans',consent:{explicit:true,accepted:true},viewModel:{intent:'现实核对',reading:{methods:[]},ecrHumanDesignRealityBridge:bridge,ecrHumanDesignRealityBridgeResponse:response}
})});
const handoffResponse=await handoffPost({request:handoffRequest});
assert.equal(handoffResponse.status,200);
const handoffPayload=await handoffResponse.json();
assert.equal(handoffPayload.ok,true);
assert.equal(handoffPayload.view.currentReality.reportedContext.length,2);
assert(handoffPayload.view.currentReality.reportedContext.some(item=>item.includes('现实经验与这份读取不符合')));
assert.equal(handoffPayload.view.currentReality.externalEvidence.length,0,'Bridge responses must not enter external evidence');
assert.equal(handoffPayload.view.currentReality.findings.length,0,'Bridge responses must not enter findings');
assert.equal(handoffPayload.view.governance.persisted,false);
assert.equal(handoffPayload.view.governance.canonicalRealityCreated,false);
assert.equal(handoffPayload.governance.currentRealityEvidenceCreated,false);
assert.equal(handoffPayload.governance.currentRealityConclusionCreated,false);

const noConsent=new Request('https://example.test/api/customer-reality-handoff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sourceType:'PERSONAL_REALITY',locale:'zh-Hans',consent:{explicit:false,accepted:false},viewModel:{ecrHumanDesignRealityBridge:bridge,ecrHumanDesignRealityBridgeResponse:response}})});
const noConsentResponse=await handoffPost({request:noConsent});
assert.equal(noConsentResponse.status,403,'W7 must preserve explicit handoff consent');

const partialComparison=buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:contextOf(confirmedProfile({rich:false,intakeId:'ECR-R3-W7-PARTIAL'}),'en'),locale:'en'});
const partialBridge=buildEcrHumanDesignRealityBridgeIR({comparisonIr:partialComparison,locale:'en'});
assert.equal(partialBridge.prompts.length,5,'Partial confirmed HD context keeps observation prompts without inventing missing fields');
assert.equal(partialBridge.boundaries.currentRealityEvidenceCreated,false);

const drift=structuredClone(comparison);drift.boundaries.directFieldEquivalenceCreated=true;
assert.throws(()=>buildEcrHumanDesignRealityBridgeIR({comparisonIr:drift}),error=>error?.code==='ECR_HD_REALITY_BRIDGE_GOVERNED_COMPARISON_REQUIRED');
const tampered={...response,bridgeDigest:'tampered'};
assert.throws(()=>validateEcrHumanDesignRealityBridgeResponse(tampered,{bridgeIr:bridge}),error=>error?.code==='ECR_HD_REALITY_BRIDGE_RESPONSE_LINEAGE_MISMATCH');

const renderer=fs.readFileSync('assets/customer-ui/js/specialists/ecr/reality-bridge-renderer.js','utf8');
for(const token of ['renderEcrHumanDesignRealityBridge','mountEcrHumanDesignRealityBridge','collectEcrHumanDesignRealityBridgeResponse','data-ecr-reality-response','data-ecr-reality-note','#ecr-section-11','data-ecr-reality-bridge-nav'])assert(renderer.includes(token),`W7 renderer contract token missing: ${token}`);
for(const forbidden of ['meaning-registry','calculateHumanDesign','BodyGraph','compatibilityScore='])assert.equal(renderer.includes(forbidden),false,`W7 renderer must not own semantic/calculation authority: ${forbidden}`);
const personal=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
assert(personal.includes("from '../specialists/ecr/reality-bridge-renderer.js'"));
assert(personal.includes('mountEcrHumanDesignRealityBridge(view?.ecrHumanDesignRealityBridge||null,productsRoot)'));
assert(personal.includes('ecrHumanDesignRealityBridgeResponse:collectEcrHumanDesignRealityBridgeResponse'));
const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
assert(api.includes("from '../external-profile/ecr-human-design-reality-bridge.js'"));
assert(api.includes('ecrHumanDesignRealityBridge=buildEcrHumanDesignRealityBridgeIR'));
assert(api.includes('ecrHumanDesignComparison,ecrHumanDesignRealityBridge'));

console.log('✓ ECR-R3-W7 Reality Bridge passed.');
console.log('  Five governed comparison questions now become explicit observation controls in section 10, between ECR × Human Design comparison and PHI Cards.');
console.log('  Only customer-selected responses cross the consented My Reality handoff, where they remain USER_REPORTED_CONTEXT; contradiction stays visible and no evidence, conclusion, fact, persistence or method recalculation is created.');
