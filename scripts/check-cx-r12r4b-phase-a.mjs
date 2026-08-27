import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';
import {executeAndProjectMcd5CurrentRequest} from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import {onRequestPost as executeZiWei} from '../functions/api/zi-wei-execute.js';
import {onRequestPost as executeCustomerPersonalReality} from '../functions/api/customer-personal-reality.js';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {CUSTOMER_COMPOSITION_ADMISSION_RESOLVER,resolveCustomerCompositionAdmission} from '../functions/interpretation-runtime/customer-composition-admission-resolver-v1.js';
import {ADMITTED_CUSTOMER_INTERPRETATION_RUNTIME} from '../functions/interpretation-runtime/admitted-customer-interpretation-runtime-v1.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const text=path=>fs.readFileSync(path,'utf8');
const stable=value=>JSON.stringify(value,Object.keys(value||{}).sort());
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const BASE='content/customer-experience-rebuild/r12r4b';
const baseline=read(`${BASE}/cx-r12r4b-baseline-v1.json`);
const authority=read(`${BASE}/cx-r12r4b-authority-map-v1.json`);
const retirement=read(`${BASE}/cx-r12r4b-retirement-map-v1.json`);
const campaign=read(`${BASE}/cx-r12r4b-phase-a-48-case-live-replay-v1.json`);
const acceptance=read(`${BASE}/cx-r12r4b-phase-a-acceptance-v1.json`);
const api=text('functions/api/customer-personal-reality.js');
const surface=text('assets/customer-ui/js/surfaces/personal-reality.js');
const customerRuntime=text('functions/customer-projection/method-customer-reading-v2.js');

assert.equal(baseline.baselineCommit,'4a9ddcaff07abaab4c12be62cd74e0681e528af8');
assert.equal(baseline.phaseABoundary.humanDesignImplementationStarted,false);
assert.equal(baseline.phaseABoundary.r12r3bMeaningAuthorityChanged,false);
assert.deepEqual(Object.keys(authority.owners.calculation),['AST','BZR','NUM','ZWR']);
for(const owner of [authority.owners.composition,authority.owners.admission,authority.owners.customerPublication,authority.owners.renderer]){
  assert.equal(fs.existsSync(owner.split('#')[0]),true,`missing authority owner ${owner}`);
}
assert.equal(authority.authorityBoundary.oneAdmissionResolver,true);
assert.equal(authority.authorityBoundary.oneAdmittedExecutor,true);
assert.equal(authority.authorityBoundary.admissionMeansLiveCustomerHumanReviewed,false);
assert.equal(retirement.boundary.productionCustomerConsumersUseLegacyInterpretation,false);
assert(retirement.retirements.some(item=>item.path==='view.interpretation.methods'&&item.productionConsumerState==='RETIRED'));
assert(retirement.retirements.some(item=>item.path==='view.methodResults'&&item.productionConsumerState==='RETIRED'));

assert.equal(CUSTOMER_COMPOSITION_ADMISSION_RESOLVER.boundary.comparesLiveProjectionToHistoricalReviewDigest,false);
assert.equal(CUSTOMER_COMPOSITION_ADMISSION_RESOLVER.boundary.customerIdentityMatching,false);
assert.equal(ADMITTED_CUSTOMER_INTERPRETATION_RUNTIME.boundary.createsMeaningAuthority,false);
assert.equal(ADMITTED_CUSTOMER_INTERPRETATION_RUNTIME.boundary.createsInterpretationAuthority,false);
for(const methodId of ['AST','BZR','NUM','ZWR']){
  const decision=resolveCustomerCompositionAdmission({
    methodId,
    candidateSchemaVersion:'PHI-OS-METHOD-INTERPRETATION-CANDIDATE-v2.0.0',
    meaningBundleCode:`GOVERNED-${methodId}-MEANING-BUNDLE`,
    compositionRuleVersion:CUSTOMER_COMPOSITION_ADMISSION_RESOLVER.ruleSetVersion,
    locale:'en',
    projectionAuthorityVersion:'CURRENT_PRODUCTION_PROJECTION',
    methodParameters:methodId==='AST'?{houseSystemId:'PLACIDUS_V1'}:{}
  });
  assert.equal(decision.publicationAllowed,true,`${methodId} current admitted ruleset must resolve`);
  assert.equal(decision.acceptanceBasis,'ADMITTED_COMPOSITION_RULESET');
  assert.equal(decision.authority.historicalProjectionDigestCompared,false);
  assert.equal(decision.authority.liveCustomerHumanReviewClaimed,false);
  assert(decision.admissionRef&&decision.reviewEvidenceRef);
}
assert.equal(resolveCustomerCompositionAdmission({methodId:'NUM',candidateSchemaVersion:'PHI-OS-METHOD-INTERPRETATION-CANDIDATE-v2.0.0',meaningBundleCode:'X',compositionRuleVersion:'NEW_UNADMITTED_RULESET',locale:'en',projectionAuthorityVersion:'CURRENT'}).publicationAllowed,false);
assert.equal(resolveCustomerCompositionAdmission({methodId:'AST',candidateSchemaVersion:'PHI-OS-METHOD-INTERPRETATION-CANDIDATE-v2.0.0',meaningBundleCode:'X',compositionRuleVersion:CUSTOMER_COMPOSITION_ADMISSION_RESOLVER.ruleSetVersion,locale:'en',projectionAuthorityVersion:'CURRENT',methodParameters:{houseSystemId:'UNADMITTED_HOUSES'}}).publicationAllowed,false);

assert.match(api,/buildAcceptedMethodCustomerResult/);
assert.match(api,/includeLegacyInterpretation:false/);
assert.match(api,/view=freeze\(\{\.\.\.stripLegacyInterpretation\(baseView\),astrology,reading\}\)/);
assert.match(api,/methods:readingMethods/);
assert.match(api,/map:\[/);
for(const stage of ['DATA','METHOD_CALCULATION','METHOD_INTERPRETATION','COMBINED_READING','CURRENT_REALITY','FULL_REPORT'])assert(api.includes(`'${stage}'`),`missing Reading Map stage ${stage}`);
assert.doesNotMatch(api,/interpretationGate\s*:/);
assert.doesNotMatch(api,/methodResults\s*:/);
assert.doesNotMatch(surface,/view\?\.methodResults|view\?\.interpretation/);
assert.match(surface,/view\?\.reading\?\.methods/);
assert.match(surface,/view\?\.reading\?\.map/);
assert.doesNotMatch(surface,/result\.openItems|result\.customerState|result\.technicalDetails/);
assert.match(customerRuntime,/createMethodInterpretationCandidate[\s\S]*resolveCustomerCompositionAdmission[\s\S]*executeAdmittedCustomerInterpretation/);

const customerApiResponse=await executeCustomerPersonalReality({
  request:new Request('https://phios.local/api/customer-personal-reality',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({birthDate:'1990-01-15',birthTimeUnknown:true,methods:['numeric'],consent:true,locale:'en'})
  }),
  env:{}
});
const customerApiPayload=await customerApiResponse.json();
assert.equal(customerApiResponse.status,200,JSON.stringify(customerApiPayload));
assert.equal(customerApiPayload.ok,true);
assert.equal(customerApiPayload.view.reading.state,'READY_TO_READ');
assert.equal(customerApiPayload.view.reading.methods.length,1);
assert.equal(customerApiPayload.view.reading.methods[0].methodId,'NUM');
for(const retired of ['overview','interpretation','methodResults','interpretationGate','handoff','details','patterns'])assert.equal(Object.hasOwn(customerApiPayload.view,retired),false,`retired live customer API path leaked: ${retired}`);
const primaryApiView=structuredClone(customerApiPayload.view);
for(const method of primaryApiView.reading.methods)delete method.technical;
assert.doesNotMatch(JSON.stringify(primaryApiView),/\b(?:AVAILABLE|PARTIAL|DETERMINISTIC|STRUCTURE_ONLY|HUMAN_REVIEW_REQUIRED|COMPOSITION_SUPPORTED|SOURCE_ADMITTED)\b|projectionId|projectionDigest|reasonCode/);

assert.equal(campaign.caseCount,48);
assert.equal(campaign.cases.length,48);
assert.deepEqual(Object.fromEntries(['AST','BZR','NUM','ZWR'].map(methodId=>[methodId,campaign.cases.filter(item=>item.methodId===methodId).length])),{AST:12,BZR:12,NUM:12,ZWR:12});
assert.equal(campaign.replayBoundary.liveProjectionDigestComparedToHistoricalReviewDigest,false);
assert.equal(campaign.replayBoundary.liveCustomerHumanReviewClaimed,false);

const refs={285:'1989-01-05T08:45:57.000Z',315:'1989-02-03T20:27:10.000Z',345:'1989-03-05T14:34:09.000Z',15:'1989-04-04T19:29:54.000Z',45:'1989-05-05T12:53:55.000Z',75:'1989-06-05T17:05:13.000Z',105:'1989-07-07T03:19:26.000Z',135:'1989-08-07T13:03:53.000Z',165:'1989-09-07T15:53:54.000Z',195:'1989-10-08T07:27:19.000Z',225:'1989-11-07T10:33:32.000Z',255:'1989-12-07T03:20:57.000Z'};
const speeds={Sun:1,Moon:13,Mercury:-.2,Venus:1.1,Mars:.5,Jupiter:.08,Saturn:.03,Uranus:.01,Neptune:.006,Pluto:.004};
const bodyNames=Object.keys(speeds);
const astronomyFixture=Object.freeze({
  Body:Object.freeze(Object.fromEntries(bodyNames.map(name=>[name,name]))),
  MakeTime(date){const ut=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;return {ut,tt:ut+64/86400,date}},
  GeoVector(body,date){const day=(date.getTime()-Date.UTC(1989,10,15,14,50))/86400000;return {x:1,y:0,z:0,_lon:((bodyNames.indexOf(body)*30+232.5)+(speeds[body]||.1)*day+360)%360,_lat:bodyNames.indexOf(body)*.1}},
  Ecliptic(vector){return {elon:vector._lon,elat:vector._lat}},
  SearchSunLongitude(longitude,start){return {date:new Date(refs[longitude]||start)}},
  GeoMoonState(){return {x:1,y:0,z:0,vx:0,vy:1,vz:.1}},
  Rotation_EQJ_ECT(){return {}},
  RotateState(_rotation,state){return state}
});
const astronomyModuleLoader=async()=>astronomyFixture;
const astInput=read('content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json').input;
const baseInput={...astInput,consent:{recordId:'CX-R12R4B-CONSENT',granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'}};
const ziWeiInput={birthDate:'2023-01-22',birthTime:'05:00:00',birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_FIXTURE',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'CX-R12R4B-CONSENT',granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};

function requestFor(methodId,testCase,suffix){
  const requestId=`${testCase.caseId}-${suffix}`;
  const common={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',capability:'CALCULATION',purposeCode:'CX_R12R4B_PHASE_A_LIVE_REPLAY',consentRecordId:'CX-R12R4B-CONSENT',requestId};
  if(methodId==='AST')return {...common,methodCode:'ASTROLOGY',methodVersion:'0.1.0',canonicalInput:{...baseInput,locale:testCase.locale},executionParameters:{houseSystemCode:testCase.calculationVariant}};
  if(methodId==='BZR')return {...common,methodCode:'BAZI',methodVersion:'0.1.0',canonicalInput:{...baseInput,locale:testCase.locale},executionParameters:{traditionalCalculationSex:'FEMALE'}};
  if(methodId==='NUM')return {...common,methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',canonicalInput:{...baseInput,birthDate:'1990-01-15',locale:testCase.locale},executionParameters:{targetDate:'2026-08-27'}};
  return {...common,methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',canonicalInput:{...ziWeiInput,locale:testCase.locale},executionParameters:{}};
}

async function executeProjection(testCase,suffix){
  const request=requestFor(testCase.methodId,testCase,suffix);
  if(testCase.methodId==='AST'){
    const output=await executeAndProjectAstV2(request,{astronomyModuleLoader});
    assert.equal(output.execution.executionStatus,'EXECUTED_BOUND_SCOPE');
    return output.canonicalProjection;
  }
  if(testCase.methodId==='BZR'||testCase.methodId==='NUM'){
    const output=await executeAndProjectMcd5CurrentRequest(request,{astronomyModuleLoader});
    assert.equal(output.execution.executionStatus,'EXECUTED_BOUND_SCOPE');
    return output.canonicalProjection;
  }
  const response=await executeZiWei({request:new Request('https://phios.local/api/zi-wei-execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request)})});
  const payload=await response.json();
  assert.equal(response.status,200,JSON.stringify(payload));
  assert.equal(payload.ok,true);
  return payload.result;
}

const forbiddenPrimary=/\b(?:AVAILABLE|PARTIAL|DETERMINISTIC|STRUCTURE_ONLY|HUMAN_REVIEW_REQUIRED|COMPOSITION_SUPPORTED|SOURCE_ADMITTED)\b|projectionId|projectionDigest|reasonCode/;
const totals={calculationReproducible:0,meaningAuthorityResolved:0,admittedCompositionResolved:0,customerInterpretationGenerated:0,noRawInternalStateLeak:0,lineageComplete:0};
for(const testCase of campaign.cases){
  const first=await executeProjection(testCase,'REPLAY');
  const second=await executeProjection(testCase,'REPLAY');
  assert.equal(first.projectionId,second.projectionId,`${testCase.caseId} projection identity drift`);
  assert.equal(hash(first.calculation),hash(second.calculation),`${testCase.caseId} calculation drift`);
  totals.calculationReproducible++;

  const result=await buildAcceptedMethodCustomerResult({canonicalProjection:first,locale:testCase.locale,requestedDepth:testCase.requestedDepth});
  const repeated=await buildAcceptedMethodCustomerResult({canonicalProjection:second,locale:testCase.locale,requestedDepth:testCase.requestedDepth});
  assert.equal(result.state,'READY_TO_READ',`${testCase.caseId} customer publication unavailable`);
  assert.equal(result.technical.acceptanceBasis,'ADMITTED_COMPOSITION_RULESET');
  assert.equal(result.technical.lifecycle.liveCustomerHumanReviewed,false);
  assert.equal(result.technical.lifecycle.flags.LIVE_CUSTOMER_HUMAN_REVIEWED,false);
  assert.equal(result.technical.lifecycle.flags.ADMITTED_COMPOSITION_RULESET,true);
  assert.equal(result.technical.semanticDigest,repeated.technical.semanticDigest,`${testCase.caseId} semantic drift`);
  assert(result.technical.derivationDigest&&repeated.technical.derivationDigest,`${testCase.caseId} derivation lineage missing`);
  assert(result.technical.meaningBundleCode);totals.meaningAuthorityResolved++;
  assert(result.technical.admissionRef&&result.technical.compositionRuleVersion);totals.admittedCompositionResolved++;
  assert(result.insights.length>0&&result.visualModel?.customerInterpretationBindingsAccepted===true);totals.customerInterpretationGenerated++;

  const {technical,...primary}=result;
  const primaryText=JSON.stringify(primary);
  assert.doesNotMatch(primaryText,forbiddenPrimary,`${testCase.caseId} raw primary state leak`);
  assert.equal(Object.hasOwn(result.visualModel,'projectionDigest'),false);
  assert.equal(Object.hasOwn(result.visualModel,'sourceRefs'),false);
  totals.noRawInternalStateLeak++;

  assert(technical.projectionId&&technical.projectionDigest&&technical.meaningBundleCode&&technical.compositionRuleVersion&&technical.admissionRef&&technical.semanticDigest&&technical.derivationDigest);
  assert(technical.interpretationUnits.length>0);
  for(const unit of technical.interpretationUnits){
    for(const field of ['unitId','semanticTags','projectionRefs','meaningRefs','derivationRefs','boundaryRefs'])assert(unit[field]&&unit[field].length,`${testCase.caseId} ${field} lineage missing`);
  }
  totals.lineageComplete++;
}

assert.deepEqual(totals,campaign.requiredTotals);
assert.deepEqual(acceptance.totals,{cases:48,...totals});
assert.equal(acceptance.status,'ACCEPTED_BY_EXECUTABLE_MACHINE_REPLAY');
assert.equal(acceptance.claims.liveCustomerHumanReviewClaimed,false);
assert.equal(acceptance.claims.humanDesignImplementationStarted,false);
assert.equal(acceptance.claims.fullR12R4BProduction,false);

const packageJson=read('package.json');
assert.equal(packageJson.scripts['check:cx-r12r4b:phase-a'],'node scripts/generate-zwr-meaning-authorities-runtime-projection.mjs --check && node scripts/generate-zwr-runtime-authorities-projection.mjs --check && node scripts/generate-cx-r12r4b-phase-a-replay-campaign.mjs --check && node scripts/check-cx-r12r4b-phase-a.mjs');
assert.equal(packageJson.scripts['check:cx-r12r4b'],'npm run check:cx-r12r4b:phase-a && npm run check:cx-r12r4b:hdr-audit && npm run check:cx-r12r4b:r1');
assert(packageJson.scripts['check:cx-r12r4'].endsWith('&& npm run check:cx-r12r4b'));

console.log('✓ CX-R12R4B W00–W08 Phase A four-method live cutover passed.');
console.log('  48/48 governed live replays reproduced calculation, resolved admitted composition, generated customer interpretation, preserved lineage, and kept internal states outside the primary customer model.');
console.log('  Acceptance is ruleset admission, not a claim that any live customer projection received individual human review.');
