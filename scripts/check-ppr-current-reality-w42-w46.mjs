import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CURRENT_REALITY_DOMAINS,
  CURRENT_REALITY_SENSITIVE_DOMAINS,
  REALITY_COMPARISON_STATES,
  CURRENT_REALITY_PURPOSE,
  normalizePersonalCurrentRealityInput,
  canonicalizeCurrentRealityObservations,
  buildProgressiveCurrentRealityIntake,
  buildRealityComparisonCandidates,
  buildRealityComparisons,
  buildMethodCurrentRealityCorrelation
} from '../functions/current-reality/personal-current-reality-runtime.js';
import {onRequestPost} from '../functions/api/customer-current-reality.js';

const BASE='ba3ac00864644f7ac7861df59ce8c35db7ebad97';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const mustThrow=(fn,code)=>{let caught=null;try{fn()}catch(e){caught=e}assert.ok(caught,`expected ${code}`);assert.equal(caught.code,code)};

const authority=read('content/professional/personal-reality/current-reality/authority/ppr-current-reality-w42-w46-authority-v1.json');
assert.equal(authority.baselineCommit,BASE);
assert.equal(authority.upstream.currentRealityEntryAllowed,true);
assert.equal(authority.boundaries.birthStructureIsCurrentReality,false);
assert.equal(authority.boundaries.methodTimingIsCurrentReality,false);
assert.equal(authority.boundaries.customerSelfReportIsObjectiveFact,false);
assert.equal(authority.boundaries.customerAgreementProvesMethod,false);
assert.equal(authority.boundaries.automaticPersistence,false);
assert.equal(authority.boundaries.sensitiveContextRequiresSeparateConsent,true);

// W42: explicit opt-in, explicit purpose, minimal + sensitive collection.
mustThrow(()=>normalizePersonalCurrentRealityInput({observations:[{domain:'LOAD',promptId:'HEAVY_NOW',text:'Work feels heavy.'}]},'en'),'CURRENT_REALITY_EXPLICIT_OPT_IN_REQUIRED');
mustThrow(()=>normalizePersonalCurrentRealityInput({optIn:true,purposeCode:'WRONG',observations:[{domain:'LOAD',promptId:'HEAVY_NOW',text:'Work feels heavy.'}]},'en'),'CURRENT_REALITY_EXPLICIT_PURPOSE_REQUIRED');
mustThrow(()=>normalizePersonalCurrentRealityInput({optIn:true,purposeCode:CURRENT_REALITY_PURPOSE,sensitiveObservations:[{domain:'HEALTH',promptId:'SENSITIVE_DETAIL',text:'I feel tired.'}]},'en'),'CURRENT_REALITY_SENSITIVE_CONSENT_REQUIRED');
const input=normalizePersonalCurrentRealityInput({
  optIn:true,
  purposeCode:CURRENT_REALITY_PURPOSE,
  sensitiveConsent:true,
  observations:[{domain:'LOAD',promptId:'HEAVY_NOW',text:'Work feels heavy this week.'}],
  sensitiveObservations:[{domain:'HEALTH',promptId:'SENSITIVE_DETAIL',text:'I feel tired.'}]
},'en');
assert.equal(input.schemaVersion,'PHI-OS-PERSONAL-CURRENT-REALITY-INPUT-v2');
assert.equal(input.collectionMode,'PROGRESSIVE_MINIMAL');
assert.equal(input.governance.automaticPersistence,false);
assert.equal(CURRENT_REALITY_DOMAINS.length,12);
assert.equal(CURRENT_REALITY_SENSITIVE_DOMAINS.length,4);

// W43: progressive intake, exactly 8 first-step questions, separate level 3.
const intake=buildProgressiveCurrentRealityIntake('zh-Hans');
assert.equal(intake.level1.length,8);
assert.equal(intake.level2Domains.length,12);
assert.equal(intake.level3SensitiveDomains.length,4);
assert.equal(intake.governance.longQuestionnaire,false);
assert.equal(intake.governance.progressive,true);
assert.equal(intake.governance.sensitiveConsentSeparate,true);

// W44: literal self-report stays self-report and cannot become diagnosis/fact.
const observationIr=canonicalizeCurrentRealityObservations(input);
assert.equal(observationIr.schemaVersion,'PHI-OS-CURRENT-REALITY-OBSERVATION-v1');
assert.equal(observationIr.observations.length,2);
for(const item of observationIr.observations){
  assert.equal(item.source,'CUSTOMER');
  assert.equal(item.confidence,'SELF_REPORTED');
  assert.equal(item.objectiveFact,false);
  assert.equal(item.diagnosis,false);
  assert.equal(item.professionalEvidence,false);
}
const tired=observationIr.observations.find(x=>x.statement==='I feel tired.');
assert.ok(tired);
assert.doesNotMatch(JSON.stringify(tired),/burnout/i);

// W45/W46: only governed ready readings become comparison candidates; explicit responses control state.
const candidates=buildRealityComparisonCandidates([
  {methodId:'AST',state:'READY_TO_READ',methodLabel:'Astrology',summary:'Governed AST summary',insights:[{claimId:'AST-C1',title:'Work rhythm',plainLanguageExplanation:'Work rhythm changes under current timing.'}]},
  {methodId:'BZR',state:'READY_TO_READ',methodLabel:'BaZi',summary:'Governed BZR summary',insights:[{claimId:'BZR-C1',title:'Resource pattern',summary:'Resource pressure is prominent.'}]},
  {methodId:'ZWR',state:'NOT_READY',methodLabel:'Zi Wei',summary:'Must not enter candidates'},
  {methodId:'HDR',state:'READY_TO_READ',methodLabel:'Human Design',summary:'Not a customer authority here'}
]);
assert.equal(candidates.length,2);
assert.deepEqual(candidates.map(x=>x.methodId),['AST','BZR']);
const comparisons=buildRealityComparisons({
  candidates,
  observationIr,
  responses:[
    {candidateId:candidates[0].candidateId,state:'CURRENTLY_RESONANT',observationRefs:['CR-OBS-01']},
    {candidateId:candidates[1].candidateId,state:'CURRENTLY_NOT_RESONANT'}
  ]
});
assert.deepEqual(REALITY_COMPARISON_STATES,['CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT','OPEN']);
assert.equal(comparisons.comparisons[0].responseState,'CURRENTLY_RESONANT');
assert.equal(comparisons.comparisons[1].responseState,'CURRENTLY_NOT_RESONANT');
for(const item of comparisons.comparisons){
  assert.equal(item.customerControlled,true);
  assert.equal(item.methodProvenTrue,false);
  assert.equal(item.methodProvenFalse,false);
}
const open=buildRealityComparisons({candidates:[candidates[0]],observationIr,responses:[]});
assert.equal(open.comparisons[0].responseState,'OPEN');
const correlation=buildMethodCurrentRealityCorrelation({comparisons});
assert.equal(correlation.governance.automaticSemanticMatching,false);
assert.equal(correlation.governance.agreementMayProveMethod,false);
assert.equal(correlation.governance.currentRealityMayRewriteMethod,false);
assert.ok(correlation.correlations.every(x=>x.truthConversion===false));

// API round trip: explicit customer input returns canonical observation + comparison, saved=false.
const req=new Request('https://example.test/api/customer-current-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
  locale:'en',consent:true,
  input:{optIn:true,purposeCode:CURRENT_REALITY_PURPOSE,observations:[{domain:'DECISION',promptId:'DECISION_STUCK',text:'I have not decided whether to move projects.'}]},
  comparisonCandidates:[{candidateId:'CRC-AST-1',methodId:'AST',claimRef:'AST-C1'}],
  responses:[{candidateId:'CRC-AST-1',state:'PARTIALLY_RESONANT',observationRefs:['CR-OBS-01']}]
})});
const res=await onRequestPost({request:req});
assert.equal(res.status,200);
const payload=await res.json();
assert.equal(payload.ok,true);
assert.equal(payload.currentRealityObservations.observations[0].source,'CUSTOMER');
assert.equal(payload.currentRealityObservations.observations[0].confidence,'SELF_REPORTED');
assert.equal(payload.realityComparison.comparisons[0].responseState,'PARTIALLY_RESONANT');
assert.equal(payload.realityComparison.comparisons[0].methodProvenTrue,false);
assert.equal(payload.privacy.saved,false);
assert.equal(payload.governance.agreementIsMethodProof,false);
assert.equal(payload.governance.methodReadingRewritten,false);

// Product surface/API integration markers.
const api=text('functions/api/customer-personal-reality.js');
const ui=text('assets/customer-ui/js/surfaces/personal-reality.js');
const html=text('perspectives/personal/index.html');
const css=text('assets/customer-ui/surfaces/personal-reality.css');
assert.match(api,/buildRealityComparisonCandidates/);
assert.match(api,/methodTimingIsCurrentReality:false/);
assert.match(api,/automaticPersistence:false/);
assert.match(ui,/installCurrentRealityExperience/);
assert.match(ui,/\/api\/customer-current-reality/);
assert.match(ui,/PERSONAL_READING_REALITY_COMPARISON/);
assert.match(html,/data-cx-current-reality-intake/);
assert.match(html,/data-cx-current-reality-comparison/);
assert.match(html,/data-cx-current-reality-result/);
assert.match(html,/BRING IT BACK TO REALITY/);
assert.match(html,/data-cx-reality-choice/); // historical compatibility token remains hidden
assert.match(css,/cx-current-reality-shell/);
assert.doesNotMatch(html,/Current timing context/);

console.log('✓ PPR Successor W42–W46 Current Reality passed.');
console.log('  W42 explicit opt-in/purpose/minimal collection + separate sensitive consent enforced.');
console.log('  W43 progressive 8-question entry; no long questionnaire.');
console.log('  W44 customer observations remain CUSTOMER / SELF_REPORTED and never become diagnosis/fact.');
console.log('  W45/W46 explicit customer comparison uses four governed states; agreement never becomes proof.');
