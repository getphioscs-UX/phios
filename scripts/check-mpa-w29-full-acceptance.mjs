import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root=process.cwd();
const BASE='content/professional/method-production-activation';
const baseline='07391e717e64c2636ce22e3f97900ff97d9571d8';
const j=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const imp=rel=>import(pathToFileURL(path.join(root,rel)).href+`?v=${Date.now()}-${Math.random()}`);

const matrix=j(`${BASE}/acceptance/mpa-w29-full-acceptance-matrix-v1.json`);
const acceptance=j(`${BASE}/acceptance/mpa-w29-full-acceptance-v1.json`);
const elig=j(`${BASE}/registries/mpa-production-eligibility-decision-registry-v1.json`);
const execution=j(`${BASE}/registries/mpa-production-execution-gate-registry-v1.json`);
const w28=j(`${BASE}/acceptance/mpa-w28-downstream-integration-acceptance-v1.json`);

assert.equal(matrix.work,'MPA-W29');
assert.equal(matrix.baselineCommit,baseline);
assert.equal(matrix.tests.length,8);
assert.equal(matrix.currentState.unconditionalEligibleCapabilityCount,0);
assert.equal(matrix.currentState.conditionallyEligibleCapabilityCount,6);
assert.equal(matrix.currentState.blockedCapabilityCount,36);
assert.equal(execution.currentState.productionDispatchActive,false);
assert.equal(w28.acceptedFacts.mpaCreatesCustomerReadout,false);

for(const code of ['NUMEROLOGY','ASTROLOGY','BAZI','HUMAN_DESIGN']) assert.ok(matrix.methodStateMatrix[code]);
assert.equal(matrix.methodStateMatrix.NUMEROLOGY.capabilities.CALCULATION,'CONDITIONALLY_ELIGIBLE');
assert.equal(matrix.methodStateMatrix.NUMEROLOGY.capabilities.PROJECTION,'CONDITIONALLY_ELIGIBLE');
assert.equal(matrix.methodStateMatrix.BAZI.capabilities.CALCULATION,'CONDITIONALLY_ELIGIBLE');
assert.equal(matrix.methodStateMatrix.BAZI.capabilities.PROJECTION,'CONDITIONALLY_ELIGIBLE');
for(const d of elig.decisions.filter(x=>x.methodCode==='ASTROLOGY')) assert.equal(d.decision,'BLOCKED');
for(const d of elig.decisions.filter(x=>x.methodCode==='HUMAN_DESIGN')) assert.equal(d.decision,'BLOCKED');

const gate=await imp('functions/method-production-activation/method-execution-gate-runtime.js');
let dispatchCount=0;
const dispatch=async()=>{dispatchCount++;return {bad:true};};
for(const request of [
  {methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION'},
  {methodCode:'HUMAN_DESIGN',methodVersion:'1.0.0',capability:'PROJECTION'},
  {methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',capability:'CALCULATION'},
  {methodCode:'BAZI',methodVersion:'0.1.0',capability:'PROJECTION'}
]){
  await assert.rejects(()=>gate.executeMethodWithProductionGate(request,dispatch),/METHOD_PRODUCTION_NOT_ELIGIBLE/);
}
assert.equal(dispatchCount,0,'Blocked/conditional method dispatched unexpectedly.');

const downstream=await imp('functions/method-production-activation/downstream-integration-runtime.js');
const ref={
  schemaVersion:'PHI-OS-MPA-DOWNSTREAM-PROJECTION-REFERENCE-v1.0.0',
  methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',
  projectionCode:'MPA-W29-VALIDATION-PROJECTION',projectionVersion:'1.0.0',
  projectionDigest:'b'.repeat(64),projectionStatus:'VALIDATION_ONLY',
  truthClaimed:false,professionalJudgmentCreated:false
};
assert.throws(()=>downstream.assertProductionMethodProjectionReference(ref),/METHOD_PROJECTION_NOT_PRODUCTION/);

const birth=await imp('functions/method-production-activation/birth-initialization-data-runtime.js');
const unknownTime=birth.createBirthInitializationData({
  initializationId:'MPA-W29-BIRTH-INPUT-001',subjectReference:'SUBJECT-W29-001',methodCode:'NUMEROLOGY',
  birthDate:'1989-11-15',birthTime:null,birthPlace:'Taiping, Malaysia',timezone:'Asia/Kuala_Lumpur',
  coordinates:null,
  inputPrecision:{date:'exact',time:'unknown',place:'exact',timezone:'exact',coordinates:'unknown'},
  source:{sourceType:'CUSTOMER_DECLARATION',sourceReference:'MPA-W29-SOURCE-001',sourceVersion:'1.0.0'},
  customerConfirmation:{confirmed:true,confirmedAt:'2026-08-11T12:00:00.000Z'},
  fabricatedDefaultsUsed:false
});
assert.equal(unknownTime.birthTime.value,null);
assert.equal(unknownTime.birthTime.precision,'unknown');
assert.equal(unknownTime.fabricatedDefaultsUsed,false);
assert.throws(()=>birth.createBirthInitializationData({
  initializationId:'MPA-W29-BIRTH-INPUT-002',subjectReference:'SUBJECT-W29-002',methodCode:'NUMEROLOGY',
  birthDate:'1989-11-15',birthTime:'12:00',birthPlace:'Taiping, Malaysia',timezone:'Asia/Kuala_Lumpur',
  coordinates:null,inputPrecision:{date:'exact',time:'exact',place:'exact',timezone:'exact',coordinates:'unknown'},
  source:{sourceType:'SYSTEM_DEFAULT',sourceReference:'MPA-W29-SOURCE-002',sourceVersion:'1.0.0'},
  customerConfirmation:{confirmed:false,confirmedAt:null},fabricatedDefaultsUsed:true
}),/FABRICATED_DEFAULT_FORBIDDEN/);

const projection=await imp('functions/method-production-activation/projection-integration-runtime.js');
const fixture=j(`${BASE}/fixtures/mpa-w17-num-projection-freeze.valid.json`);
const freeze=await projection.createProjectionFreezeRecord({
  projection:fixture,methodVersion:'0.1.0-candidate',
  calculationPolicyCode:'NUM-CALC-POLICY-W29',calculationPolicyVersion:'1.0.0',
  projectionPolicyCode:'NUM-PROJECTION-POLICY-W29',projectionPolicyVersion:'1.0.0'
});
assert.equal(freeze.realityFactCreated,false);
assert.equal(freeze.diagnosisCreated,false);
assert.equal(freeze.professionalJudgmentCreated,false);
const boundary=projection.assertInterpretationBoundary({projectionFreeze:freeze});
assert.equal(boundary.projectionIsRealityFact,false);
assert.equal(boundary.interpretationIsDiagnosis,false);
assert.equal(boundary.interpretationIsProfessionalJudgment,false);

const customer=projection.evaluateProfessionalIntegration({methodCode:'NUMEROLOGY',mode:'CUSTOMER_CALCULATION'});
assert.equal(customer.professionalRuntimeHandoffAllowed,false);
assert.equal(customer.professionalReleaseAllowed,false);
const blockedProfessional=projection.evaluateProfessionalIntegration({
  methodCode:'NUMEROLOGY',mode:'PROFESSIONAL_INTERPRETATION',
  methodProfessionalEligible:false,separateProfessionalEligibility:false,
  activeAssignment:false,activeServiceConsent:false,boundaryAcknowledged:false,workspaceAccess:false,prV2AuthorityResolved:true
});
assert.equal(blockedProfessional.decision,'PROFESSIONAL_INTEGRATION_BLOCKED');
assert.equal(blockedProfessional.professionalReleaseAllowed,false);
const handoffOnly=projection.evaluateProfessionalIntegration({
  methodCode:'NUMEROLOGY',mode:'PROFESSIONAL_INTERPRETATION',
  methodProfessionalEligible:true,separateProfessionalEligibility:true,
  activeAssignment:true,activeServiceConsent:true,boundaryAcknowledged:true,workspaceAccess:true,prV2AuthorityResolved:true
});
assert.equal(handoffOnly.professionalRuntimeHandoffAllowed,true);
assert.equal(handoffOnly.professionalReleaseAllowed,false);

const hdr=await imp('functions/method-production-activation/hdr-boundary-runtime.js');
assert.equal(hdr.assertPublicHdrVocabulary({text:'Personal Runtime Projection / 个人运行投射'}),true);
assert.throws(()=>hdr.assertPublicHdrVocabulary({text:'Human Design customer result'}),/MPA_HDR_RESTRICTED_PUBLIC_TERM/);
assert.throws(()=>hdr.assertPublicHdrVocabulary({text:'人类图客户报告'}),/MPA_HDR_RESTRICTED_PUBLIC_TERM/);
const vocab=j('content/web-production/registries/wpr-public-vocabulary-registry-v2.json');
const hdrVocab=vocab.entries.find(x=>x.internalCodes?.includes('HUMAN_DESIGN'));
assert.ok(hdrVocab);
assert.equal(hdrVocab.renderPolicy,'CONTROLLED_PUBLIC_LABEL_ONLY');
assert.equal(hdrVocab.publicLabels.en,'Personal Runtime Projection');
assert.equal(hdrVocab.publicLabels['zh-Hans'],'个人运行投射');

assert.equal(acceptance.status,'ACCEPT_FULL_FAIL_CLOSED_METHOD_PRODUCTION_ACTIVATION_GOVERNANCE');
for(const value of Object.values(acceptance.acceptedFacts)) {
  if(typeof value==='boolean') assert.equal(value,true);
}
assert.equal(acceptance.acceptedFacts.currentProductionDispatchCount,0);

const pkg=j('package.json');
assert.equal(pkg.scripts['check:mpa-w29'],'node scripts/check-mpa-w29-full-acceptance.mjs');
assert.equal(pkg.scripts['check:mpa-full-acceptance'],'npm run check:mpa-w29');
const chain=String(pkg.scripts['check:mpa']||'').split(' && ');
assert.equal(chain.filter(x=>x==='npm run check:mpa-full-acceptance').length,1);
assert.ok(chain.indexOf('npm run check:mpa-full-acceptance')>chain.indexOf('npm run check:mpa-downstream-integration'));
assert.equal(String(pkg.scripts.postcheck||'').includes('check:mpa'),false);

console.log('✓ MPA-W29 Full Acceptance passed.');
console.log('  NUM/BZR conditional state, AST/HDR blocked state, execution fail-closed, no fabricated input, Projection≠Fact, Professional boundary and public vocabulary boundary are all enforced.');
console.log('  MPA still creates no Customer Readout and current Production Method dispatch count remains zero.');
