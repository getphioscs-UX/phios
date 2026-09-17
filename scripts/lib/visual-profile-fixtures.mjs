import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PROFILE_CONTEXT_PURPOSE,SELF_ASSESSMENT_PURPOSE,normalizeExternalProfileInput,scoreSelfAssessment,
  buildSelfAssessmentProfileSignals,buildExternalProfileSignals,buildReasoningPerformanceSignals
} from '../../functions/profile/profile-foundation-runtime.js';
import {
  scoreOriginalReasoningTaskBank,scoreIpipAssessment,scoreFinancialCapabilityAssessment,
  buildAcademicProfileSignalBundle,normalizeOnetInterestProfilerResult,buildOnetProfileSignals
} from '../../functions/profile/academic-bridge-runtime.js';
import {buildProgressiveProfileView,PROFILE_PROGRESSIVE_MODES} from '../../functions/profile/profile-progressive-ux-runtime.js';
export async function visualProfileFixtures(locale='en'){
const sources=[];
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const instrument=j('content/professional/profile/assessment/self-assessment-instrument-v2.json');
const providers=j('content/professional/profile/registries/external-profile-provider-registry-v1.json');
const quick=j('content/profile/ux/profile-quick-profile-selection-v1.json');
const reasoningBank=j('content/profile/academic/reasoning/original-reasoning-task-bank-v1.json');
const reasoningAuthority=j('content/profile/academic/reasoning/reasoning-bank-authority-v1.json');
const reasoningReview=j('content/profile/ux/profile-reasoning-review-set-v1.json');
const ipip50=j('content/profile/academic/ipip/ipip-big-five-50-v1.json');
const ipip120=j('content/profile/academic/ipip/ipip-neo-120-v1.json');
const financial=j('content/profile/academic/financial/phi-financial-capability-instrument-v1.json');
const date='2026-09-03',participantRef='PERSON-A';
const views=[];
const view=async(mode,signals)=>{const v=await buildProgressiveProfileView({mode,profileSignals:signals,participantRef,asOfDate:date,locale,customerPublishable:true,preview:false});assert.equal(v.mode,mode);assert.ok(v.signalCards.length>0);assert.equal(v.governance?.personalReadingGateCreated,false);assert.equal(v.governance?.skipAllowed,true);views.push(v);sources.push({mode,signals,view:v});return v};

// Quick Profile: one admitted item per domain.
const quickIds=new Set(quick.itemIds);const quickResponses=Object.fromEntries(instrument.items.filter(x=>quickIds.has(x.itemId)).map(x=>[x.itemId,3]));
const quickResult=scoreSelfAssessment({instrument,responses:quickResponses,participantRef,assessmentDate:date,customerConfirmed:true,consent:true,sensitiveConsent:true,purpose:SELF_ASSESSMENT_PURPOSE});
await view('QUICK_PROFILE',await buildSelfAssessmentProfileSignals(quickResult));

// Full 30-facet self-assessment.
const fullResponses=Object.fromEntries(instrument.items.map((x,i)=>[x.itemId,(i%5)+1]));
const fullResult=scoreSelfAssessment({instrument,responses:fullResponses,participantRef,assessmentDate:date,customerConfirmed:true,consent:true,sensitiveConsent:true,purpose:SELF_ASSESSMENT_PURPOSE});
await view('FULL_SELF_ASSESSMENT',await buildSelfAssessmentProfileSignals(fullResult));

// Original reasoning task sample; raw task performance only.
const reviewIds=new Set(reasoningReview.taskIds);const reasoningResponses=Object.fromEntries(reasoningBank.items.filter(x=>reviewIds.has(x.taskId)).map(x=>[x.taskId,x.options[0].optionId]));
const reasoning=scoreOriginalReasoningTaskBank({bank:reasoningBank,bankAuthority:reasoningAuthority,responses:reasoningResponses,participantRef,assessmentDate:date});
const reasoningSignals=await buildReasoningPerformanceSignals(reasoning.performance);const reasoningView=await view('REASONING_TASKS',reasoningSignals);assert.ok(reasoningView.boundaries.some(x=>/IQ/i.test(x)));

// External result import stays provider-owned.
const provider=providers.providers.find(x=>x.manualResultImportAllowed===true);assert.ok(provider);
const external=normalizeExternalProfileInput({participantRef,providerFamily:provider.providerFamily,providerName:provider.providerName,resultLabel:'Customer confirmed external profile',resultDimensions:{example:1},assessmentDate:date,resultPrecision:'CONFIRMED',customerConfirmed:true,consent:true,purpose:PROFILE_CONTEXT_PURPOSE,persistencePreference:'DO_NOT_SAVE',provenance:[{source:'CUSTOMER_ENTRY'}]},providers);
await view('IMPORT_EXTERNAL_RESULT',await buildExternalProfileSignals(external));

// IPIP Big Five 50 and IPIP-NEO 120 use raw keyed self-report scores, never invented norms.
for(const source of [ipip50,ipip120]){const responses=Object.fromEntries(source.items.map((x,i)=>[x.itemId,(i%5)+1]));const result=await scoreIpipAssessment({instrument:source,responses,participantRef,assessmentDate:date,consent:true,sensitiveConsent:true,customerConfirmed:true});assert.equal(result.normingState,'NOT_NORMED');const bundle=await buildAcademicProfileSignalBundle({ipipResult:result});const v=await view('BIG_FIVE',bundle.signals);assert.ok(v.sourceLegend.some(x=>x.sourceClass==='STANDARDIZED_SELF_REPORT'));}

// O*NET provider-normalized RIASEC + career/job-zone context, using the exact live provider shape already admitted by PRF-ONET-LIVE-ACTIVATION.
const providerResult={result:[
  {code:'realistic',title:'Realistic',score:14},{code:'investigative',title:'Investigative',score:20},{code:'artistic',title:'Artistic',score:18},
  {code:'social',title:'Social',score:21},{code:'enterprising',title:'Enterprising',score:23},{code:'conventional',title:'Conventional',score:12}
]};
const careers={career:[{code:'11-2021.00',title:'Marketing Managers',fit:'Best'},{code:'13-1161.00',title:'Market Research Analysts & Marketing Specialists',fit:'Great'}]};
const jobZones=[{code:2,title:'Job Zone 1-2: Very Little to Some Preparation Needed'},{code:3,title:'Job Zone Three: Medium Preparation Needed'},{code:4,title:'Job Zone Four: High Preparation Needed'},{code:5,title:'Job Zone Five: Extensive Preparation Needed'}];
const onet=await normalizeOnetInterestProfilerResult({participantRef,assessmentDate:date,form:'MINI_30',providerResult,careers,jobZones,selectedJobZone:4,customerConfirmed:true});const onetSignals=await buildOnetProfileSignals(onet);const onetView=await view('CAREER_INTERESTS',onetSignals);assert.equal(onetView.careerInterest.governance.jobFitGuaranteeCreated,false);

// Adapted Financial Capability keeps measured knowledge separate from self-report and creates no advice authority.
const financialResponses={};for(const item of financial.items){financialResponses[item.itemId]=item.response==='LIKERT_1_5'?3:(item.scoring?.options?.[0]??null);}const fcap=await scoreFinancialCapabilityAssessment({instrument:financial,responses:financialResponses,participantRef,assessmentDate:date,consent:true,customerConfirmed:true});assert.equal(fcap.governance.professionalFinancialAdviceCreated,false);const fcapBundle=await buildAcademicProfileSignalBundle({financialResult:fcap});await view('FINANCIAL_CAPABILITY',fcapBundle.signals);

return sources;
}
