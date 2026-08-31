import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildZiweiFullProductionCustomerRuntime} from '../functions/zi-wei-full-production/ziwei-full-production-customer-runtime.js';
import {resolveZiweiLiveTargetContext} from '../functions/zi-wei-full-production/ziwei-live-target-context-runtime.js';
import {ZIWEI_CX_R1_CURRENT_PUBLICATION_AUTHORITY} from '../functions/zi-wei-full-production/ziwei-current-publication-envelope-runtime.js';
import {onRequestPost as customerPersonalReality} from '../functions/api/customer-personal-reality.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const txt=p=>fs.readFileSync(p,'utf8');
const integration='343773fd6fb61fbf1b37aa861537d7e8f091ec24';
const semantic='d16d757a477e2a9f7e3c7a38e4e5d044ce7e4aaf';
const cx='content/customer-experience-rebuild/ziwei-cx-r1';
const fp='content/professional/zi-wei-full-production';

// W0 — baseline + route authority reconciliation.
const audit=j(`${cx}/audit/ziwei-cx-r1-w0-baseline-route-audit-v1.json`);
const route=j(`${cx}/authority/ziwei-cx-r1-customer-route-authority-v1.json`);
const legacy=j(`${cx}/legacy/ziwei-cx-r1-legacy-renderer-registry-v1.json`);
const ppr=j('content/customer-experience-rebuild/ppr-c1/authority/canonical-personal-surface-authority-v1.json');
const w0w4=j(`${cx}/acceptance/ziwei-cx-r1-w0-w4-engineering-acceptance-v1.json`);
const roadmap=j(`${cx}/roadmap/ziwei-cx-r1-master-work-v1.json`);
for(const x of [audit,route,w0w4,roadmap]){
  assert.equal(x.integrationBaselineCommit,integration);
  assert.equal(x.ziweiFullProductionSemanticBaselineCommit,semantic);
}
assert.equal(audit.baselineReconciliation.semanticBaselineRole,'UNIQUE_ZIWEI_FULL_PRODUCTION_CUTOVER_BASELINE');
assert.equal(audit.baselineReconciliation.integrationBaselineRole,'CURRENT_DESCENDANT_CHECKOUT_FOR_CUSTOMER_SURFACE_BINDING');
assert.equal(audit.baselineReconciliation.semanticBaselineReplacedByLaterZiweiSemanticBaseline,false);
assert.equal(audit.baselineReconciliation.archive.name,'tools.zip');
assert.equal(audit.baselineReconciliation.archive.gitDirectoryPresent,false);
assert.equal(audit.routeAudit.canonicalCustomerRoute,'/perspectives/personal/');
assert.equal(audit.routeAudit.customerPageOwnerCount,1);
assert.equal(route.canonicalCustomerSurface.route,'/perspectives/personal/');
assert.equal(route.canonicalCustomerSurface.pageOwnerCount,1);
assert.equal(route.rules.personalRuntimeHtmlMayOwnCurrentRoute,false);
assert.equal(route.rules.genericZwrRendererMayOwnCompleteZiweiReport,false);
assert.equal(route.rules.smrRendererMayOwnCompleteZiweiReport,false);
assert.equal(ppr.canonicalCustomerSurface?.route,'/perspectives/personal/');
const redirects=txt('_redirects');
for(const oldRoute of ['/personal-runtime ','/personal-runtime.html ','/professional/personal-runtime ','/professional/personal-runtime/ '])assert.ok(redirects.includes(`${oldRoute}/perspectives/personal/ 308`));
assert.equal(legacy.entries.find(x=>x.path==='personal-runtime.html')?.mayOwnCustomerRoute,false);
assert.equal(legacy.entries.find(x=>x.path==='assets/customer-ui/js/surfaces/single-method-reading.js')?.mayOwnCompleteZiweiReport,false);
assert.equal(legacy.entries.find(x=>x.path==='functions/single-method-reading/single-method-reading-production.js')?.mayOwnCompleteZiweiReport,false);
// The actual W22/W23 admission artifacts are the current evidence. Do not require nonexistent successor authority files.
const w22Admission=j(`${fp}/admission/ziwei-fp-w22-human-admission-v1.json`);
const w22Acceptance=j(`${fp}/acceptance/ziwei-fp-w22-human-review-acceptance-v1.json`);
assert.equal(w22Admission.baselineCommit,'3f6825a9b57dc9e62e34fb69bc55d2aac2c39768');
assert.equal(w22Admission.status,'HUMAN_ADMITTED_24_OF_24');
assert.equal(w22Admission.actual?.accepted,24);
assert.equal(w22Admission.allDecisionsAccept,true);
assert.equal(w22Admission.customerCutoverGateSatisfied,true);
assert.equal(w22Acceptance.status,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(w22Acceptance.gates?.ALL_24_DECISIONS_ACCEPT,true);
const w23Cutover=j(`${fp}/admission/ziwei-fp-w23-full-production-cutover-v1.json`);
const w23Acceptance=j(`${fp}/acceptance/ziwei-fp-w23-production-cutover-acceptance-v1.json`);
assert.equal(w23Cutover.status,'FULL_PRODUCTION_ACTIVE');
assert.equal(w23Cutover.publicationState,'CUSTOMER_PUBLISHABLE');
assert.equal(w23Cutover.runtimeUseAllowed,true);
assert.equal(w23Cutover.defaultCustomerCutover,true);
assert.equal(w23Cutover.preservedFailClosedGaps?.extensionStarStandaloneMeaningCountBlocked,8);
assert.equal(w23Cutover.preservedFailClosedGaps?.genericMeaningFallbackAllowed,false);
assert.equal(w23Acceptance.decision,'PRODUCTION_CUTOVER_ALLOWED');
assert.equal(w23Acceptance.productionAllowed,true);
assert.equal(w23Acceptance.customerCutoverAllowed,true);

// W2 — explicit, visible target context with no birth-time fallback.
const target=resolveZiweiLiveTargetContext({
  targetDate:'2026-08-28',targetTime:'12:00',
  targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'
});
assert.equal(target.targetTime,'12:00:00');
assert.equal(target.presentation.visibleToCustomer,true);
assert.equal(target.presentation.customerEditable,true);
assert.equal(target.presentation.defaultMayUseDeviceTimezone,true);
for(const v of Object.values(target.governance))assert.equal(v,false);
assert.throws(()=>resolveZiweiLiveTargetContext({targetDate:'',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'}),/ZIWEI_CX_R1_TARGET_DATE_REQUIRED/);
assert.throws(()=>resolveZiweiLiveTargetContext({targetDate:'2026-08-28',targetTime:'',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'}),/ZIWEI_CX_R1_TARGET_TIME_REQUIRED/);
assert.throws(()=>resolveZiweiLiveTargetContext({targetDate:'2026-08-28',targetTime:'12:00',targetTimezone:{iana:'',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'}),/ZIWEI_CX_R1_TARGET_TIMEZONE_IANA_REQUIRED/);
assert.throws(()=>resolveZiweiLiveTargetContext({targetDate:'2026-08-28',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'0800'},source:'EXPLICIT_REQUEST'}),/ZIWEI_CX_R1_TARGET_UTC_OFFSET_REQUIRED/);

// W1 — one source calculation, reused by canonical projection and the full-production spine.
function fixedExecutionRequest(locale='zh-Hans'){
  const consentRecordId='CONSENT-ZIWEI-CX-R1-W0-W4';
  const canonicalInput={
    birthDate:'2023-01-22',birthTime:'05:00:00',
    birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},
    timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_RESOLUTION',confidence:'HIGH'},
    timeAccuracy:'EXACT',locale,
    consent:{recordId:consentRecordId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},
    inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'
  };
  return {schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{traditionalCalculationSex:'MALE'},consentRecordId,requestId:'REQ-ZIWEI-CX-R1-W0-W4'};
}
const full=await buildZiweiFullProductionCustomerRuntime({executionRequest:fixedExecutionRequest(),targetContext:target,locale:'zh-Hans'});
assert.equal(full.state,'CUSTOMER_PUBLISHABLE');
assert.equal(full.executionReuse.sourceCalculationBuiltOnce,true);
assert.equal(full.executionReuse.canonicalProjectionConsumesSameSourceCalculationIR,true);
assert.equal(full.executionReuse.secondNatalCalculationPerformed,false);
assert.equal(full.executionReuse.sourceCalculationIrExposedToCustomer,false);
assert.equal(full.canonicalProjection.zwrLineage.sourceCalculationDigest,full.sourceDigests.sourceCalculationDigest);
assert.equal('sourceCalculationIR' in full,false);
const product=full.customerProduct;
assert.equal(product.state,'CUSTOMER_PUBLISHABLE');
assert.equal(product.report.schemaVersion,'PHI-OS-ZIWEI-CUSTOMER-REPORT-v1.0.0');
assert.equal(product.report.sections.find(x=>x.sectionCode==='PALACES').items.length,12);
assert.equal(product.interactiveSurface.schemaVersion,'PHI-OS-ZIWEI-INTERACTIVE-CHART-SURFACE-v1.0.0');
assert.equal(product.interactiveSurface.palaces.length,12);
assert.equal(product.topics.schemaVersion,'PHI-OS-ZIWEI-TOPIC-READING-v1.0.0');
assert.equal(product.topics.topics.length,8);

// W3 — current successor publication envelope, without rewriting historical W18/W19/W20 boundaries.
const currentAuthJson=j(`${cx}/authority/ziwei-cx-r1-current-publication-authority-v1.json`);
assert.deepEqual(JSON.parse(JSON.stringify(ZIWEI_CX_R1_CURRENT_PUBLICATION_AUTHORITY)),currentAuthJson);
assert.equal(product.currentAuthority.status,'ACTIVE_CURRENT_PUBLICATION_AUTHORITY');
assert.equal(product.currentAuthority.publicationState,'CUSTOMER_PUBLISHABLE');
assert.equal(product.currentAuthority.sourceAuthority.status,'FULL_PRODUCTION_ACTIVE');
assert.equal(product.currentAuthority.sourceAuthority.machineGate,'PASS_96_OF_96');
assert.equal(product.currentAuthority.sourceAuthority.humanGate,'PASS_24_OF_24_ACCEPT');
assert.equal(product.governance.historicalW18BoundaryMutated,false);
assert.equal(product.governance.historicalW19BoundaryMutated,false);
assert.equal(product.governance.historicalW20BoundaryMutated,false);
assert.equal(product.report.boundaries.customerCutoverAllowed,false);
assert.equal(product.interactiveSurface.boundaries.customerCutoverAllowed,false);
assert.equal(product.topics.boundaries.customerCutoverAllowed,false);
assert.equal(product.governance.genericSmrOwnsCompleteZiweiReport,false);

// W2 customer surface — fields are visible/editable when Zi Wei is selected and sent to canonical API.
const html=txt('perspectives/personal/index.html');
const client=txt('assets/customer-ui/js/surfaces/personal-reality.js');
assert.match(html,/data-cx-shared-target-context/);
for(const name of ['sharedTargetDate','sharedTargetTime','sharedTargetTimezoneIana','sharedTargetUtcOffset','sharedTargetContextSource'])assert.match(html,new RegExp(`name="${name}"`));
for(const legacy of ['ziweiTargetDate','ziweiTargetTime','ziweiTargetTimezoneIana','ziweiTargetUtcOffset','ziweiTargetContextSource'])assert.doesNotMatch(html,new RegExp(`name="${legacy}"`));
const sharedTarget=txt('assets/customer-ui/js/personal-inputs/shared-target-context.js');
assert.match(sharedTarget,/紫微需要完整的目标日期、时间与已确认地点/);
assert.doesNotMatch(html,/DEVICE_DEFAULT|device's current context/);
assert.doesNotMatch(client,/function seedZiweiTargetContext|new Date\s*\(|resolvedOptions\(\)\.timeZone|DEVICE_DEFAULT/);
assert.match(client,/collectSharedTargetContext/);
for(const name of ['ziweiTargetDate','ziweiTargetTime','ziweiTargetTimezoneIana','ziweiTargetUtcOffset','ziweiTargetContextSource'])assert.ok(client.includes(name));

// W4 — actual canonical API call returns the governed full-production payload.
const originalFetch=globalThis.fetch;
globalThis.fetch=async input=>{
  const url=String(input?.url||input);
  if(url.includes('nominatim.openstreetmap.org/lookup'))return new Response(JSON.stringify([{name:'Hong Kong',lat:'22.3193',lon:'114.1694',display_name:'Hong Kong',address:{city:'Hong Kong',country:'Hong Kong',country_code:'hk'},namedetails:{'name:en':'Hong Kong','name:zh':'香港'}}]),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('timeapi.io/api/TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'Asia/Hong_Kong'}),{status:200,headers:{'content-type':'application/json'}});
  throw new Error(`ZIWEI_CX_R1_UNEXPECTED_FETCH:${url}`);
};
try{
  const body={birthDate:'2023-01-22',birthTime:'05:00',birthTimeUnknown:false,placeRef:'N123',methods:['ziwei'],traditionalCalculationSex:'MALE',ziweiTargetDate:'2026-08-28',ziweiTargetTime:'12:00',ziweiTargetTimezoneIana:'Asia/Kuala_Lumpur',ziweiTargetUtcOffset:'+08:00',ziweiTargetContextSource:'EXPLICIT_REQUEST',consent:true,locale:'zh-Hans'};
  const request=new Request('https://getphios.com/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const response=await customerPersonalReality({request,env:{}});
  assert.equal(response.status,200);
  const payload=await response.json();
  assert.equal(payload.ok,true);
  assert.ok(payload.view.ziweiFullProduction);
  assert.equal(payload.view.ziweiFullProduction.state,'CUSTOMER_PUBLISHABLE');
  for(const key of ['report','interactiveSurface','topics','currentAuthority','sourceDigests','targetContext'])assert.ok(payload.view.ziweiFullProduction[key],`view.ziweiFullProduction.${key} missing`);
  assert.equal(payload.view.ziweiFullProduction.report.sections.find(x=>x.sectionCode==='PALACES').items.length,12);
  assert.equal(payload.view.ziweiFullProduction.interactiveSurface.palaces.length,12);
  assert.equal(payload.view.ziweiFullProduction.topics.topics.length,8);
  assert.equal(payload.view.primaryCustomerProduct.type,'ZIWEI_FULL_PRODUCTION');
  assert.equal(payload.view.primaryCustomerProduct.owner,'ZIWEI_CX_R1_FULL_PRODUCTION_PRODUCT');
  assert.equal(payload.view.primaryCustomerProduct.genericSmrCompleteReportOwner,false);
  assert.equal(payload.view.singleMethodReading,null);
  const stages=new Map(payload.view.reading.map.map(x=>[x.stageId,x]));
  // W42–W46 Current Reality successor: a governed Zi Wei reading makes lived-reality
  // comparison available, but the stage must remain fail-closed until the customer
  // explicitly supplies or confirms their own observations. Historical W0–W4 used
  // READABLE here; the successor state is intentionally WAITING_FOR_CONFIRMATION.
  assert.equal(stages.get('CURRENT_REALITY').state,'WAITING_FOR_CONFIRMATION');
  assert.match(stages.get('CURRENT_REALITY').detail,/读取已经可以进入可选的现实对照/);
  assert.equal(stages.get('FULL_REPORT').state,'READABLE');
  assert.match(stages.get('FULL_REPORT').detail,/紫微完整报告/);
  assert.equal(payload.view.reading.governance.currentRealityAssumed,false);
  assert.equal(payload.view.reading.governance.ziweiLiveIndividualHumanReviewClaimed,false);
  const compatibility=payload.view.reading.methods.find(x=>x.methodId==='ZWR');
  assert.ok(compatibility);
  assert.notEqual(compatibility.technical?.completeZiweiReportOwner,true);

  // Direct API requests also fail closed when target context is absent.
  const bad={...body,ziweiTargetTimezoneIana:''};
  const badReq=new Request('https://getphios.com/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(bad)});
  const badRes=await customerPersonalReality({request:badReq,env:{}});
  assert.equal(badRes.status,422);
  const badPayload=await badRes.json();
  assert.equal(badPayload.error,'ZIWEI_CX_R1_TARGET_TIMEZONE_IANA_REQUIRED');
}finally{globalThis.fetch=originalFetch;}

assert.equal(w0w4.gates.W4_CANONICAL_API_RETURNS_ZIWEI_FULL_PRODUCTION,true);
assert.equal(w0w4.gates.W5_PROFESSIONAL_INFORMATION_ARCHITECTURE_COMPLETE,false);
assert.equal(w0w4.currentCustomerSurface.pageOwnerCount,1);
assert.equal(w0w4.currentCustomerSurface.professionalZiweiRendererCutoverComplete,false);
assert.equal(roadmap.nextWork,'ZIWEI-CX-R1-W5｜Zi Wei Professional Information Architecture');

console.log('✓ ZIWEI-CX-R1-W0–W4 Full Production customer binding passed.');
console.log('  W0: d16d757 is the frozen Zi Wei FP semantic baseline; 343773f is the current descendant integration checkout; /perspectives/personal/ has one page owner.');
console.log('  W1: one sourceCalculationIR -> the same canonical projection -> W3–W20 full-production chain; no second natal calculation.');
console.log('  W2: Zi Wei consumes the shared customer target; date/time/place are customer-visible while IANA timezone/UTC offset remain confirmed hidden transport; birth-timezone fallback is forbidden.');
console.log('  W3: current successor envelope is CUSTOMER_PUBLISHABLE from W23 96/96 machine + 24/24 Human, while historical W18/W19/W20 boundaries remain unchanged.');
console.log('  W4: /api/customer-personal-reality returns report + 12-palace surface + 8 topics + current authority + source digests and makes Full Production the primary single-Zi-Wei product.');
console.log('  Professional Zi Wei page IA/renderer is intentionally still W5+; W0–W4 bind the live governed payload rather than pretending the visual cutover is complete.');
