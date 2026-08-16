import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCanonicalBirthInput,evaluateSurfaceEligibility,createExecutionRequest,executeCanonicalProjection,renderSurfaceProjection,MCD7_PRODUCTION_TABS} from '../assets/js/method-client-delivery/personal-runtime-surface-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8')); const read=p=>fs.readFileSync(p,'utf8');
const contract=j('content/professional/method-client-delivery/contracts/mcd-7-personal-runtime-result-surface-contract-v1.json');
const registry=j('content/professional/method-client-delivery/registries/mcd-7-personal-runtime-result-surface-registry-v1.json');
const acceptance=j('content/professional/method-client-delivery/acceptance/mcd-7-personal-runtime-result-surface-acceptance-v1.json');
const wpr=j('content/web-production/successors/wpr-w21-mcd7-personal-runtime-result-surface-successor-v1.json');
const inputMatrix=j('content/professional/method-client-delivery/registries/method-input-requirement-matrix-v1.json');
const mpa=j('content/professional/method-production-activation/successors/mpa-mcd-1-production-authority-successor-v1.json');

assert.equal(contract.work,'MCD-7'); assert.equal(contract.baselineCommit,'94d5efa953ff83713505b133d0039764df577675');
assert.deepEqual(contract.clientFlow,['INPUT','ELIGIBILITY','PROCESSING','RESULTS']);
assert.deepEqual(contract.resultTabs,['OVERVIEW','ASTROLOGY','BAZI','NUMERIC','READING']);
assert.deepEqual(MCD7_PRODUCTION_TABS,['overview','astrology','bazi','numeric','reading']);
assert.deepEqual(registry.productionTabs.map(x=>x.tabCode),MCD7_PRODUCTION_TABS);
assert.equal(registry.controlledAvailability.resultTab,false); assert.equal(registry.controlledAvailability.productionResult,false);
assert.equal(registry.controlledAvailability.label.en,'Personal Runtime Projection'); assert.equal(registry.controlledAvailability.label['zh-Hans'],'个人运行投射');
assert.equal(contract.hdr.productionResultTabAllowed,false); assert.equal(contract.hdr.customerChartAllowed,false); assert.equal(contract.hdr.interpretationResultAllowed,false); assert.equal(contract.hdr.productionReportAllowed,false);
assert.equal(contract.reading.calculationAllowed,false); assert.equal(contract.reading.interpretationAllowed,false);
for(const entry of registry.productionTabs.filter(x=>x.methodResult)){
  const authority=mpa.methods.find(x=>x.methodCode===entry.methodCode); assert.ok(authority); assert.equal(authority.dispatchAllowed,true); assert.equal(entry.methodVersion,authority.methodVersion);
  const matrix=inputMatrix.methods.find(x=>x.methodCode===entry.methodCode); assert.ok(matrix);
  const normalized=matrix.required.map(x=>x==='birthPlace'?'birthPlace.displayName':x);
  assert.deepEqual(entry.requiredInputPaths,normalized,`${entry.methodCode} input requirement projection drift`);
}
assert.equal(registry.productionTabs.some(x=>x.publicMethodCode==='PERSONAL_RUNTIME_PROJECTION'),false);
assert.equal(wpr.predecessor.mutated,false); assert.equal(wpr.successor.executionAuthority,'MPA'); assert.equal(wpr.successor.serverPersistenceAllowed,false); assert.equal(wpr.successor.interpretationIncluded,false);

const unknown=buildCanonicalBirthInput({birthDate:'1990-01-15',birthDatePrecision:'exact',birthTime:'',birthTimePrecision:'unknown',birthPlace:'Kuala Lumpur',birthPlacePrecision:'exact',countryCode:'MY',birthTimezone:'',utcOffsetAtBirth:'',timezonePrecision:'unknown',latitude:'',longitude:'',coordinatesPrecision:'unknown'},{locale:'en'});
assert.equal(unknown.birthTime,null); assert.equal(unknown.timeAccuracy,'UNKNOWN'); assert.equal(unknown.timezone.iana,null); assert.equal(unknown.timezone.utcOffsetAtBirth,null); assert.equal(unknown.birthPlace.latitude,null); assert.equal(unknown.birthPlace.longitude,null);
const numEntry=registry.productionTabs.find(x=>x.tabCode==='numeric'); const numEligibility=evaluateSurfaceEligibility(numEntry,unknown); assert.equal(numEligibility.state,'REQUESTABLE'); assert.equal(numEligibility.dispatchAllowed,null); assert.equal(numEligibility.mpaDecisionPending,true);
assert.throws(()=>createExecutionRequest(registry.controlledAvailability,{canonicalInput:unknown,consentRecordId:'C',requestId:'R'}),/MCD7_METHOD_REQUEST_FORBIDDEN/);

const input=buildCanonicalBirthInput({birthDate:'1990-01-15',birthDatePrecision:'exact',birthTime:'12:30',birthTimePrecision:'exact',birthPlace:'Kuala Lumpur',birthPlacePrecision:'exact',countryCode:'MY',birthTimezone:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',timezonePrecision:'exact',latitude:'3.139',longitude:'101.6869',coordinatesPrecision:'exact'},{locale:'en',consentRecordId:'CONSENT-MCD7-CHECK',consentGranted:true});
for(const entry of registry.productionTabs.filter(x=>x.methodResult)){
  const eligibility=evaluateSurfaceEligibility(entry,input); assert.notEqual(eligibility.state,'INPUT_INCOMPLETE',entry.tabCode);
  const request=createExecutionRequest(entry,{canonicalInput:input,consentRecordId:'CONSENT-MCD7-CHECK',requestId:`REQ-${entry.tabCode}`}); assert.equal(Object.hasOwn(request,'dispatchAllowed'),false); assert.equal(request.capability,'CALCULATION');
  const result=await executeCanonicalProjection(entry,{canonicalInput:input,consentRecordId:'CONSENT-MCD7-CHECK',requestId:`REQ-MCD7-${entry.tabCode}`},{fetchImpl:async (_url,options)=>{
    const {onRequestPost}=await import('../functions/api/method-execute.js'); return onRequestPost({request:new Request('https://phios.local/api/method-execute',{method:'POST',headers:{'content-type':'application/json'},body:options.body})});
  }});
  assert.equal(result.ok,true,`${entry.tabCode} MCD-7 execution failed`); assert.equal(result.canonicalProjection.execution.mpaDecision.authorityOwner,'MPA'); assert.equal(result.canonicalProjection.execution.mpaDecision.dispatchAllowed,true); assert.equal(result.canonicalProjection.interpretation.included,false);
  const rendered=renderSurfaceProjection(result.canonicalProjection,{locale:'en'}); assert.ok(['RENDERED','BLOCKED'].includes(rendered.status)); if(entry.tabCode==='astrology')assert.match(rendered.html,/mcd6-ast/); if(entry.tabCode==='bazi')assert.match(rendered.html,/mcd6-bzr/); if(entry.tabCode==='numeric')assert.match(rendered.html,/mcd6-num/);
}

const html=read('personal-runtime.html'); const js=read('assets/js/pages/personal-runtime.js'); const runtime=read('assets/js/method-client-delivery/personal-runtime-surface-runtime.js');
for(const tab of ['overview','astrology','bazi','numeric','reading']) assert.match(html,new RegExp(`data-tab="${tab}"`));
for(const marker of ['Requested Methods','Executed Methods','Blocked Methods','Input Completeness','Unknown','Consent','Version','Execution Status']) assert.ok(read('assets/js/locales/en/personal-runtime.js').includes(marker),marker);
assert.match(html,/Personal Runtime Projection/); assert.match(html,/Currently unavailable/);
for(const restricted of ['Human Design','人类图','HUMAN_DESIGN','>HDR<']){assert.equal(html.includes(restricted),false,restricted); assert.equal(js.includes(restricted),false,restricted); assert.equal(runtime.includes(restricted),false,restricted);}
assert.doesNotMatch(runtime,/core-method-runtime|method-runtime\/|execution-runtime|adapter-registry-runtime|canonical-projection-runtime/);
assert.doesNotMatch(js,/core-method-runtime|method-runtime\/|execution-runtime|adapter-registry-runtime|canonical-projection-runtime/);
assert.doesNotMatch(`${js}\n${runtime}`,/localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(`${js}\n${runtime}`,/resolvedOptions\(\)\.timeZone|Intl\.DateTimeFormat/);
assert.match(runtime,/\/api\/method-execute/); assert.match(html,/personalRuntime\.readingCopy/); assert.equal(acceptance.status,'ACCEPTED_PERSONAL_RUNTIME_CANONICAL_RESULT_SURFACE_HDR_NO_PRODUCTION_TAB');
console.log('✓ MCD-7 Personal Runtime Result Surface passed.');
console.log('  Input → Eligibility → Processing → Results is bound to MPA-gated CanonicalMethodProjection + MCD-6 renderers; Overview/AST/BaZi/Numeric/Reading are the only result tabs and restricted projection remains controlled-unavailable with no Production tab.');
