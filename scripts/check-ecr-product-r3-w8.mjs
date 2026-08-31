import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExternalProfileExtractionIr} from '../functions/external-profile/external-profile-extraction-ir.js';
import {buildExternalProfileConfirmationDraft,confirmExternalProfile} from '../functions/external-profile/external-profile-confirmation.js';
import {buildConfirmedHumanDesignContextTransport} from '../functions/external-profile/human-design-context-transport.js';
import {buildEcrHumanDesignComparisonIR} from '../functions/external-profile/ecr-human-design-comparison-ir.js';
import {buildEcrHumanDesignRealityBridgeIR,ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION} from '../functions/external-profile/ecr-human-design-reality-bridge.js';
import {renderEcrHumanDesignComparison} from '../assets/customer-ui/js/specialists/ecr/human-design-comparison-renderer.js';
import {renderEcrHumanDesignRealityBridge} from '../assets/customer-ui/js/specialists/ecr/reality-bridge-renderer.js';
import {buildEcrHumanDesignRealityBridgeReportedContext,onRequestPost as handoffPost} from '../functions/api/customer-reality-handoff.js';
import {buildBenchmark} from './smr-benchmark-support.mjs';

const acceptance=JSON.parse(fs.readFileSync('content/embodied-configuration/product-r3/acceptance/ecr-r3-w8-customer-acceptance-v1.json','utf8'));
assert.equal(acceptance.baselineCommit,'8c44a0e023a15a2e6f786306a83bd792b90bdb65');
assert.equal(acceptance.status,'CUSTOMER_ACCEPTANCE_PASSED');
assert.equal(acceptance.acceptanceClass,'MACHINE_VERIFIED_CUSTOMER_ROUTE');
assert.equal(acceptance.campaign.caseCount,12);
assert.equal(acceptance.campaign.passed,12);
assert.equal(acceptance.campaign.failed,0);
assert.equal(acceptance.boundaries.humanReviewClaimed,false);
assert.equal(acceptance.boundaries.currentRealityEvidenceCreated,false);
assert.equal(acceptance.boundaries.currentRealityConclusionCreated,false);
assert.equal(acceptance.boundaries.automaticPersistence,false);

function confirmedProfile({rich=true,intakeId='ECR-R3-W8-HD'}={}){
  const pastedText=(rich?[
    'Type: Generator','Strategy: Wait to Respond','Authority: Sacral','Profile: 5/1','Definition: Single Definition',
    'Incarnation Cross: Right Angle Cross of W8 Acceptance','Signature: Satisfaction','Not-Self Theme: Frustration',
    'Channels: 43-23 | 29-46','Defined Centers: Ajna, Throat, G Center, Sacral','Open Centers: Head, Spleen, Root',
    'Design activated Gates: 29.1 46.2','Personality activated Gates: 43.5 23.5'
  ]:['Type: Generator','Strategy: Wait to Respond']).join('\n');
  const extraction=buildExternalProfileExtractionIr({intakeId,sources:[{sourceType:'CUSTOMER_PASTED_TEXT',sourceAuthority:'CUSTOMER'}],pastedText,manualFields:rich?{environment:'Markets',cognition:'Inner Vision',motivation:'Hope',perspective:'Possibility',determination:'Low Sound',trajectory:'Observer'}:{}});
  return confirmExternalProfile({confirmationDraft:buildExternalProfileConfirmationDraft(extraction),confirmedAt:'2026-08-31T05:00:00.000Z'});
}
function contextOf(profile,locale){return buildConfirmedHumanDesignContextTransport(profile,{locale,intent:'ECR-R3-W8 customer acceptance',generatedAt:'2026-08-31T05:01:00.000Z'})}
const ecr=await buildBenchmark('ECR');
function fixture({locale='en',rich=true,id='FIX'}={}){
  const comparison=buildEcrHumanDesignComparisonIR({acceptedEcrReading:ecr.methodResult,humanDesignContext:contextOf(confirmedProfile({rich,intakeId:`ECR-R3-W8-${id}`}),locale),locale});
  const bridge=buildEcrHumanDesignRealityBridgeIR({comparisonIr:comparison,locale});
  return {comparison,bridge,comparisonHtml:renderEcrHumanDesignComparison(comparison),bridgeHtml:renderEcrHumanDesignRealityBridge(bridge)};
}
function responseFor(bridge,responseCode,index=0,note=''){
  const prompt=bridge.prompts[index];
  return {schemaVersion:ECR_HD_REALITY_BRIDGE_RESPONSE_VERSION,bridgeDigest:bridge.bridgeDigest,sourceComparisonDigest:bridge.sourceComparisonDigest,entries:[{promptId:prompt.promptId,dimensionId:prompt.dimensionId,responseCode,note}]};
}
async function handoff({bridge,response,locale='en',consent=true}={}){
  const request=new Request('https://example.test/api/customer-reality-handoff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sourceType:'PERSONAL_REALITY',locale,consent:{explicit:consent,accepted:consent},viewModel:{intent:'Reality bridge acceptance',reading:{methods:[]},ecrHumanDesignRealityBridge:bridge,ecrHumanDesignRealityBridgeResponse:response}})});
  const result=await handoffPost({request});
  return {response:result,payload:await result.json()};
}
const outcomes=[];
function pass(caseId,condition,message){assert.equal(Boolean(condition),true,`${caseId}: ${message}`);outcomes.push(caseId)}

const zhRich=fixture({locale:'zh-Hans',rich:true,id:'C01'});
pass('ECR-R3-W8-C01',zhRich.comparisonHtml.includes('同一份出生背景，两种不同的问题')&&zhRich.bridgeHtml.includes('把比较带回你的现实经验')&&zhRich.bridge.prompts.length===5&&zhRich.bridge.responseOptions.length===4,'rich zh-Hans customer composition must render comparison + five-prompt bridge + four response states');

const enRich=fixture({locale:'en',rich:true,id:'C02'});
pass('ECR-R3-W8-C02',enRich.comparisonHtml.includes('The same birth context, two different questions')&&enRich.bridgeHtml.includes('Bring the comparison back to lived experience')&&enRich.bridge.prompts.length===5,'rich English customer composition must render comparison + Reality Bridge');

const zhPartial=fixture({locale:'zh-Hans',rich:false,id:'C03'});
pass('ECR-R3-W8-C03',zhPartial.comparisonHtml.includes('不会在这里补填或重新计算缺失字段')&&!zhPartial.comparisonHtml.includes('Sacral')&&!zhPartial.comparisonHtml.includes('5/1')&&zhPartial.bridge.prompts.length===5,'partial zh-Hans confirmed HD must stay partial while bridge remains usable');

const enPartial=fixture({locale:'en',rich:false,id:'C04'});
pass('ECR-R3-W8-C04',enPartial.comparisonHtml.includes('PHI OS does not fill in or calculate a missing field here.')&&!enPartial.comparisonHtml.includes('Sacral')&&!enPartial.comparisonHtml.includes('5/1')&&enPartial.bridge.prompts.length===5,'partial English confirmed HD must stay partial without backfill');

const unsafe=structuredClone(enRich.comparison);unsafe.boundaries.directFieldEquivalenceCreated=true;
let blocked=false;try{buildEcrHumanDesignRealityBridgeIR({comparisonIr:unsafe,locale:'en'})}catch(error){blocked=error?.code==='ECR_HD_REALITY_BRIDGE_GOVERNED_COMPARISON_REQUIRED'}
pass('ECR-R3-W8-C05',blocked,'unsafe comparison boundary must fail closed before Reality Bridge');

pass('ECR-R3-W8-C06',buildEcrHumanDesignRealityBridgeReportedContext({ecrHumanDesignRealityBridge:zhRich.bridge},'zh-Hans').length===0,'no explicit bridge response must create no reported context');

const repeatResponse=responseFor(zhRich.bridge,'REPEATS_RELIABLY',0,'重复三次');
const repeatHandoff=await handoff({bridge:zhRich.bridge,response:repeatResponse,locale:'zh-Hans'});
pass('ECR-R3-W8-C07',repeatHandoff.response.status===200&&repeatHandoff.payload.view.currentReality.reportedContext.some(x=>x.includes('我观察到它会稳定重复')),'repeat response must enter My Reality only after handoff');

const contextResponse=responseFor(zhRich.bridge,'CONTEXT_DEPENDENT',1,'只在工作情境');
const contextHandoff=await handoff({bridge:zhRich.bridge,response:contextResponse,locale:'zh-Hans'});
pass('ECR-R3-W8-C08',contextHandoff.response.status===200&&contextHandoff.payload.view.currentReality.reportedContext.some(x=>x.includes('只在特定情境观察到它')),'context-dependent response must remain contextual reported material');

const unclearResponse=responseFor(enRich.bridge,'NOT_CLEAR_YET',2,'Need more time');
const unclearHandoff=await handoff({bridge:enRich.bridge,response:unclearResponse,locale:'en'});
pass('ECR-R3-W8-C09',unclearHandoff.response.status===200&&unclearHandoff.payload.view.currentReality.reportedContext.some(x=>x.includes('I cannot tell yet')),'unclear response must remain unresolved instead of being forced into fit/non-fit');

const contradictionResponse=responseFor(enRich.bridge,'CONTRADICTS_READING',4,'Observed timing is different');
const contradictionHandoff=await handoff({bridge:enRich.bridge,response:contradictionResponse,locale:'en'});
pass('ECR-R3-W8-C10',contradictionHandoff.response.status===200&&contradictionHandoff.payload.view.currentReality.reportedContext.some(x=>x.includes('contradicts this reading'))&&contradictionHandoff.payload.view.currentReality.findings.length===0,'contradiction must remain visible and unresolved');

const denied=await handoff({bridge:enRich.bridge,response:contradictionResponse,locale:'en',consent:false});
pass('ECR-R3-W8-C11',denied.response.status===403&&denied.payload.error==='MY_REALITY_HANDOFF_CONSENT_REQUIRED','explicit handoff consent must remain mandatory');

pass('ECR-R3-W8-C12',contradictionHandoff.payload.view.currentReality.externalEvidence.length===0&&contradictionHandoff.payload.view.currentReality.findings.length===0&&contradictionHandoff.payload.view.governance.persisted===false&&contradictionHandoff.payload.view.governance.canonicalRealityCreated===false&&contradictionHandoff.payload.governance.currentRealityEvidenceCreated===false&&contradictionHandoff.payload.governance.currentRealityConclusionCreated===false,'handoff must not create evidence, findings, fact promotion or persistence');

assert.deepEqual(outcomes,acceptance.campaign.cases.map(item=>item.caseId));
assert.equal(acceptance.campaign.cases.every(item=>item.result==='PASS'),true);

const personal=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');
const comparisonMount=personal.indexOf('mountEcrHumanDesignComparison(view?.ecrHumanDesignComparison||null,productsRoot)');
const bridgeMount=personal.indexOf('mountEcrHumanDesignRealityBridge(view?.ecrHumanDesignRealityBridge||null,productsRoot)');
assert(comparisonMount>=0&&bridgeMount>comparisonMount,'W8 customer route must mount comparison before Reality Bridge');
const bridgeRenderer=fs.readFileSync('assets/customer-ui/js/specialists/ecr/reality-bridge-renderer.js','utf8');
assert(bridgeRenderer.includes("comparison.insertAdjacentHTML('afterend',html)"),'W8 Reality Bridge must follow comparison when available');
assert(bridgeRenderer.includes("cards.insertAdjacentHTML('beforebegin',html)"),'W8 Reality Bridge must remain before PHI Cards fallback');

console.log('✓ ECR-R3-W8 Checker + Customer Acceptance passed 12/12.');
console.log('  Customer-route acceptance covers zh-Hans/en, rich/partial confirmed Human Design, all four observation outcomes, fail-closed boundaries, consent and My Reality handoff classification.');
console.log('  This is machine-verified customer-route acceptance; no human-review approval is claimed.');
