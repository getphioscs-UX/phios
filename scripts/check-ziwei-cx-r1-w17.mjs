import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {onRequestPost as customerPersonalReality} from '../functions/api/customer-personal-reality.js';
import {renderZiweiProduct} from '../assets/customer-ui/js/specialists/ziwei/product-renderer.js';
import {ZIWEI_CX_R1_PRINT_CONTRACT,buildZiweiPrintCoverHtml} from '../assets/customer-ui/js/specialists/ziwei/ziwei-print-product.js';
import {ZIWEI_CX_R1_W17_FINAL_SURFACE_ACTIVATION,isZiweiCustomerSurfaceActivated,isZiweiFinalCustomerSurfaceActivated} from '../functions/personal-reality-product/adapters/ziwei-customer-surface-activation.js';
import {auditZiweiDom,exerciseZiweiInteractionPlan,parseAuditDom,queryAll} from './lib/ziwei-cx-r1-w14-dom-harness.mjs';

const BASE='content/customer-experience-rebuild/ziwei-cx-r1';
const BASELINE='402735ec373fba021235187312e4f526ba919807';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const paths={
 contract:`${BASE}/contracts/ziwei-cx-r1-w17-actual-customer-surface-activation-contract-v1.json`,
 printContract:`${BASE}/contracts/ziwei-cx-r1-w17-print-product-contract-v1.json`,
 authority:`${BASE}/authority/ziwei-customer-surface-activation-authority-v1.json`,
 shared:`${BASE}/authority/ziwei-cx-r1-w17-current-shared-baseline-v1.json`,
 acceptance:`${BASE}/acceptance/ziwei-cx-r1-w17-actual-customer-surface-activation-acceptance-v1.json`,
 replay:`${BASE}/campaign/ziwei-cx-r1-w17-current-route-replay-v1.json`,
 roadmap:`${BASE}/roadmap/ziwei-cx-r1-master-work-v7.json`,
 w14:`${BASE}/campaign/ziwei-cx-r1-w14-real-api-dom-machine-campaign-v1.json`,
 w15:`${BASE}/admission/ziwei-cx-r1-w15-human-visual-admission-v1.json`,
 w16:`${BASE}/authority/ziwei-cx-r1-w16-customer-surface-activation-authority-v1.json`,
 route:`${BASE}/authority/ziwei-cx-r1-customer-route-authority-v1.json`,
 w0w4:`${BASE}/acceptance/ziwei-cx-r1-w0-w4-engineering-acceptance-v1.json`,
 fp23:'content/professional/zi-wei-full-production/acceptance/ziwei-fp-w23-production-cutover-acceptance-v1.json'
};
for(const p of Object.values(paths))assert.ok(fs.existsSync(p),`missing ${p}`);
const contract=j(paths.contract),printContract=j(paths.printContract),authority=j(paths.authority),shared=j(paths.shared),acceptance=j(paths.acceptance),replay=j(paths.replay),roadmap=j(paths.roadmap),w14=j(paths.w14),w15=j(paths.w15),w16=j(paths.w16),route=j(paths.route),w0w4=j(paths.w0w4),fp23=j(paths.fp23);
const currentSharedSuccessorPath=`${BASE}/authority/ziwei-cx-r1-w17r-current-shared-baseline-v1.json`;const currentShared=fs.existsSync(currentSharedSuccessorPath)?j(currentSharedSuccessorPath):shared;
for(const x of [contract,printContract,authority,shared,acceptance,replay,roadmap])assert.equal(x.integrationBaselineCommit,BASELINE,`${x.schemaVersion} baseline drift`);

// W23 semantic production + trusted server facade + canonical customer API.
assert.equal(fp23.status,'PRODUCTION_CUTOVER_ALLOWED');assert.equal(fp23.machineGate.passed,true);assert.equal(fp23.humanGate.passed,true);assert.equal(fp23.productionAllowed,true);assert.equal(fp23.customerCutoverAllowed,true);
assert.equal(w0w4.gates.W1_TRUSTED_FULL_PRODUCTION_EXECUTION_SPINE,true);assert.equal(w0w4.gates.W4_CANONICAL_API_RETURNS_ZIWEI_FULL_PRODUCTION,true);assert.equal(w0w4.gates.W4_GENERIC_SMR_COMPLETE_ZIWEI_REPORT_OWNER,false);
const facadeSource=text('functions/zi-wei-full-production/ziwei-full-production-customer-runtime.js');
assert.match(facadeSource,/ZIWEI_CX_R1_FULL_PRODUCTION_CUSTOMER_RUNTIME_SCHEMA/);assert.match(facadeSource,/buildZiweiFullProductionCustomerRuntime/);assert.match(facadeSource,/executeAndProjectZwrProductionWithSource/);assert.match(facadeSource,/composeZiweiCustomerReport/);assert.match(facadeSource,/buildZiweiInteractiveChartSurface/);assert.match(facadeSource,/buildZiweiTopicReadings/);
const apiSource=text('functions/api/customer-personal-reality.js');assert.match(apiSource,/buildZiweiFullProductionCustomerRuntime/);assert.match(apiSource,/ziweiFullProduction/);assert.match(apiSource,/ZIWEI_FULL_PRODUCTION/);
assert.equal(route.canonicalCustomerSurface.route,'/perspectives/personal/');assert.equal(route.canonicalCustomerSurface.api,'/api/customer-personal-reality');assert.equal(route.canonicalCustomerSurface.pageOwnerCount,1);assert.equal(route.rules.genericZwrRendererMayOwnCompleteZiweiReport,false);assert.equal(route.rules.smrRendererMayOwnCompleteZiweiReport,false);

// Machine/human proof remains explicit and independent.
assert.equal(w14.status,'MACHINE_ACCEPTED_96_OF_96');assert.equal(w14.summary.requiredCaseCount,96);assert.equal(w14.summary.passed,96);assert.equal(w14.summary.legacyVisibleOwnerCases,0);assert.equal(w14.summary.rawCodeLeakCases,0);assert.equal(w14.summary.interactionCasesPassed,96);assert.equal(w14.summary.deterministicReplayPassed,8);
assert.equal(w15.status,'HUMAN_ADMITTED_12_OF_12');assert.equal(w15.actual.accepted,12);assert.equal(w15.actual.pending,0);assert.equal(w15.humanAcceptanceSubstitutedByMachine,false);
assert.equal(w16.status,'ACTIVE_ACTUAL_CUSTOMER_SURFACE');assert.equal(w16.fullProductionVisibleToCustomer,true);
execFileSync(process.execPath,['scripts/check-ziwei-cx-r1-w14.mjs'],{stdio:'inherit'});

// W17 successor authority is the only current final visibility claim.
assert.equal(contract.status,'FINAL_SUCCESSOR_CONTRACT_FROZEN');assert.equal(Object.values(contract.requiredProofs).every(Boolean),true);assert.equal(contract.activationOutput.fullProductionVisibleToCustomer,true);assert.equal(contract.sharedLayerMutationAllowed,false);
assert.equal(authority.status,'ACTIVE_FINAL_CUSTOMER_SURFACE_AUTHORITY');assert.equal(authority.fullProductionVisibleToCustomer,true);assert.equal(authority.customerSurfaceActivationAllowed,true);assert.equal(authority.printableCustomerProduct,true);assert.equal(authority.legacyGenericFallbackAllowed,false);assert.equal(Object.values(authority.proof).every(x=>x.passed===true),true);assert.equal(authority.currentRouteReplayDigest,replay.campaignDigest);
assert.equal(acceptance.status,'FINAL_CUSTOMER_SURFACE_ACTIVE_AND_PRINTABLE');assert.equal(Object.entries(acceptance.gates).filter(([k])=>k!=='CURRENT_SHARED_BASELINE_MUTATED_BY_W17').every(([,v])=>v===true),true);assert.equal(acceptance.gates.CURRENT_SHARED_BASELINE_MUTATED_BY_W17,false);assert.equal(acceptance.result.fullProductionVisibleToCustomer,true);assert.equal(acceptance.result.printableCustomerProduct,true);assert.equal(acceptance.blockers.length,0);
assert.equal(roadmap.status,'W0_W17_COMPLETE_FINAL_CUSTOMER_SURFACE_ACTIVE_PRINTABLE');assert.equal(roadmap.customerSurface.fullProductionVisibleToCustomer,true);assert.equal(roadmap.customerSurface.printableCustomerProduct,true);
assert.deepEqual(JSON.parse(JSON.stringify(ZIWEI_CX_R1_W17_FINAL_SURFACE_ACTIVATION)),{
 schemaVersion:'PHI-OS-ZIWEI-CX-R1-W17-FINAL-CUSTOMER-SURFACE-ACTIVATION-v1.0.0',work:'ZIWEI-CX-R1-W17',state:'ACTIVE_FINAL_CUSTOMER_SURFACE',integrationBaselineCommit:BASELINE,canonicalRoute:'/perspectives/personal/',sharedHostAuthority:'PPR-R3',rendererId:'ZIWEI_CX_R1_W12_W13_SPECIALIST_WORKSPACE',authorityRef:`${BASE}/authority/ziwei-customer-surface-activation-authority-v1.json`,acceptanceRef:`${BASE}/acceptance/ziwei-cx-r1-w17-actual-customer-surface-activation-acceptance-v1.json`,predecessorAuthorityRef:`${BASE}/authority/ziwei-cx-r1-w16-customer-surface-activation-authority-v1.json`,semanticProductionRef:'content/professional/zi-wei-full-production/acceptance/ziwei-fp-w23-production-cutover-acceptance-v1.json',machineDomCampaignRef:`${BASE}/campaign/ziwei-cx-r1-w14-real-api-dom-machine-campaign-v1.json`,humanVisualAdmissionRef:`${BASE}/admission/ziwei-cx-r1-w15-human-visual-admission-v1.json`,printContract:'PHI-OS-ZIWEI-CX-R1-PRINT-PRODUCT-v1.0.0',customerRouteMachineAdmission:'96/96',humanVisualAdmission:'12/12',fullProductionVisibleToCustomer:true,printableCustomerProduct:true,legacyGenericFallbackAllowed:false,sharedPersonalRealityMutationRequired:false
});

// Current-baseline route campaign reruns all 96 cases under W17 final activation and printability.
assert.equal(replay.status,'ACTIVATION_REPLAY_ACCEPTED_96_OF_96');assert.equal(replay.summary.required,96);assert.equal(replay.summary.executed,96);assert.equal(replay.summary.passed,96);assert.equal(replay.summary.failed,0);assert.deepEqual(replay.summary.localeCounts,{'zh-Hans':48,en:48});assert.deepEqual(replay.summary.sexCounts,{MALE:48,FEMALE:48});assert.equal(replay.summary.uniqueLifeBranches.length,12);assert.equal(replay.summary.uniqueBodyBranches.length,12);assert.equal(replay.summary.domPalaceButtons,1152);assert.equal(replay.summary.domTopicTabs,768);assert.equal(replay.summary.domTimingNodes,288);assert.equal(replay.summary.surfaceActivationCases,96);assert.equal(replay.summary.printableCases,96);assert.equal(replay.summary.interactionPassed,96);assert.equal(replay.summary.deterministicReplayPassed,8);assert.equal(replay.cases.every(x=>x.activation==='W17_ACTIVE'&&x.printable&&x.passed),true);assert.equal(replay.replay.every(x=>x.matched),true);

// Print is a composed customer product, not a new semantic/calculation runtime.
assert.equal(ZIWEI_CX_R1_PRINT_CONTRACT,printContract.printContract);assert.equal(printContract.status,'PRINT_PRODUCT_ACTIVE');assert.equal(printContract.boundaries.printCreatesMeaning,false);assert.equal(printContract.boundaries.printRunsCalculation,false);assert.equal(printContract.boundaries.printChangesCustomerProductProjection,false);assert.equal(printContract.boundaries.browserWindowPrintRequiredByRuntime,false);
const printSource=text('assets/customer-ui/js/specialists/ziwei/ziwei-print-product.js'),workspaceSource=text('assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js'),css=text('assets/customer-ui/surfaces/ziwei-specialist-workspace.css');
assert.doesNotMatch(printSource,/buildZiWei|calculateZiwei|resolveZiwei|window\.print\s*\(/);assert.doesNotMatch(workspaceSource,/window\.print\s*\(/);
for(const token of ['@media print','@page{margin:14mm 13mm 16mm','data-ziwei-print-cover','break-after:page','[data-ziwei-inspector-index][hidden]{display:grid!important}','[data-ziwei-topic-panel-index][hidden]{display:grid!important}','details:not([open])>*:not(summary)','orphans:3','widows:3'])assert.ok((css+printSource).includes(token),`print token missing ${token}`);

// W17 inherits the current 402735e shared PPR baseline without changing it.
for(const row of currentShared.files){assert.ok(fs.existsSync(row.path),`shared current path missing ${row.path}`);assert.equal(sha(row.path),row.sha256,`current governed shared baseline drift: ${row.path}`);assert.equal(fs.statSync(row.path).size,row.sizeBytes,`current governed shared size drift: ${row.path}`);}for(const p of currentShared.requiredAbsent)assert.equal(fs.existsSync(p),false,`retired shared file resurrected: ${p}`);

// One current live API -> full product -> specialist DOM + print witness.
function mockExternalFetch(){return async input=>{const url=String(input?.url||input);if(url.includes('nominatim.openstreetmap.org/lookup'))return new Response(JSON.stringify([{name:'Hong Kong',lat:'22.3193',lon:'114.1694',display_name:'Hong Kong',address:{city:'Hong Kong',country:'Hong Kong',country_code:'hk'},namedetails:{'name:en':'Hong Kong','name:zh':'香港'}}]),{status:200,headers:{'content-type':'application/json'}});if(url.includes('timeapi.io/api/TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'Asia/Hong_Kong'}),{status:200,headers:{'content-type':'application/json'}});throw new Error(`ZIWEI_CX_R1_W17_UNEXPECTED_FETCH:${url}`);};}
const oldFetch=globalThis.fetch;globalThis.fetch=mockExternalFetch();try{
 const body={birthDate:'2023-01-22',birthTime:'05:00',birthTimeUnknown:false,placeRef:'N123',methods:['ziwei'],traditionalCalculationSex:'MALE',ziweiTargetDate:'2026-08-30',ziweiTargetTime:'12:00',ziweiTargetTimezoneIana:'Asia/Kuala_Lumpur',ziweiTargetUtcOffset:'+08:00',ziweiTargetContextSource:'EXPLICIT_REQUEST',consent:true,locale:'zh-Hans'};
 const response=await customerPersonalReality({request:new Request('https://getphios.com/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env:{}});const payload=await response.json();assert.equal(response.status,200);assert.equal(payload.ok,true);const product=payload.view?.productRoute?.primaryProduct;assert.equal(isZiweiCustomerSurfaceActivated(product),true);assert.equal(isZiweiFinalCustomerSurfaceActivated(product),true);assert.equal(product.finalSurfaceActivation.authorityRef,authority.schemaVersion?ZIWEI_CX_R1_W17_FINAL_SURFACE_ACTIVATION.authorityRef:null);assert.equal(product.boundaries.w17ActualCustomerSurfaceActivated,true);assert.equal(product.boundaries.printableCustomerProduct,true);
 const sourceProduct=product.sourceProduct;assert.equal(sourceProduct?.report?.schemaVersion,'PHI-OS-ZIWEI-CUSTOMER-REPORT-v1.0.0');assert.equal(sourceProduct?.interactiveSurface?.schemaVersion,'PHI-OS-ZIWEI-INTERACTIVE-CHART-SURFACE-v1.0.0');assert.equal(sourceProduct?.interactiveSurface?.palaces?.length,12);assert.equal(sourceProduct?.topics?.schemaVersion,'PHI-OS-ZIWEI-TOPIC-READING-v1.0.0');assert.equal(sourceProduct?.topics?.topics?.length,8);
 const plan=renderZiweiProduct({product});assert.equal(plan.status,'RENDERED');assert.equal(plan.rendererId,'ZIWEI_CX_R1_W12_W13_SPECIALIST_WORKSPACE');assert.equal(plan.customerSurfaceActivation,'W16_ACTIVE');assert.equal(plan.finalCustomerSurfaceActivation,'W17_ACTIVE');assert.equal(plan.fullProductionVisibleToCustomer,true);assert.equal(plan.printableCustomerProduct,true);assert.equal(plan.printContract,ZIWEI_CX_R1_PRINT_CONTRACT);assert.match(plan.visualHtml,/data-ziwei-print-cover="true"/);assert.match(plan.visualHtml,/data-ziwei-print-contract="PHI-OS-ZIWEI-CX-R1-PRINT-PRODUCT-v1\.0\.0"/);
 const dom=auditZiweiDom(plan);assert.equal(Object.values(dom.invariants).every(Boolean),true);assert.equal(dom.counts.palaceButtons,12);assert.equal(dom.counts.topicTabs,8);assert.equal(dom.counts.timingNodes,3);const tree=parseAuditDom(plan.readingHtml);assert.equal(queryAll(tree,'[data-ziwei-final-surface-activation="W17_ACTIVE"]').length,1);assert.equal(queryAll(tree,'[data-ziwei-printable-product="true"]').length,1);const presentation=product.visuals.find(x=>x.type==='ZIWEI_SPECIALIST_PRESENTATION')?.payload;const interaction=exerciseZiweiInteractionPlan(plan,{defaultPalaceIndex:presentation?.defaultPalaceIndex||0});assert.equal(interaction.passed,true);const cover=buildZiweiPrintCoverHtml(product,presentation);assert.match(cover,/专业紫微打印版/);assert.match(cover,/data-ziwei-print-contract/);
 const stripped={...product,finalSurfaceActivation:null};const blocked=renderZiweiProduct({product:stripped});assert.equal(blocked.finalActivationBlocked,true);assert.equal(blocked.fullProductionVisibleToCustomer,false);assert.equal(blocked.printableCustomerProduct,false);assert.match(blocked.readingHtml,/data-ziwei-specialist-fail-closed="true"/);assert.doesNotMatch(blocked.readingHtml,/data-ziwei-palace-index/);
}finally{globalThis.fetch=oldFetch;}

console.log('✓ ZIWEI-CX-R1-W17 Final Actual Customer Surface Activation + printable product passed.');
console.log('  W23 semantics, server facade, canonical customer API, W18/W19/W20 bindings, route ownership, legacy suppression, W14 96/96 and W15 12/12 are proven together.');
console.log(`  Current 402735e route replay: ${replay.summary.passed}/96; palace buttons ${replay.summary.domPalaceButtons}; topic tabs ${replay.summary.domTopicTabs}; timing nodes ${replay.summary.domTimingNodes}; printable ${replay.summary.printableCases}/96; deterministic replay ${replay.summary.deterministicReplayPassed}/8.`);
console.log(`  fullProductionVisibleToCustomer=true; print contract ${ZIWEI_CX_R1_PRINT_CONTRACT}; current shared PPR baseline remains unmodified by W17.`);
