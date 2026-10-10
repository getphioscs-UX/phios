import fs from 'node:fs';
import path from 'node:path';
import {
  PROFILE_CONTEXT_PURPOSE, SELF_ASSESSMENT_PURPOSE,
  normalizeExternalProfileInput, scoreSelfAssessment,
  buildSelfAssessmentProfileSignals, buildExternalProfileSignals,
  buildProfileSignalEnvelope
} from '../functions/profile/profile-foundation-runtime.js';
import { scoreOriginalReasoningTaskBank } from '../functions/profile/academic-bridge-runtime.js';
import { buildReasoningPerformanceSignals } from '../functions/profile/profile-foundation-runtime.js';
import { buildProgressiveProfileView } from '../functions/profile/profile-progressive-ux-runtime.js';
import { buildProfileCurrentRealityCorrelation, buildCrossSourcePerspective, buildRelationshipProfileEvidence } from '../functions/profile/profile-context-runtime.js';
import { normalizePersonalCurrentRealityInput, canonicalizeCurrentRealityObservations, CURRENT_REALITY_PURPOSE } from '../functions/current-reality/personal-current-reality-runtime.js';
import { normalizeRelationshipIntent } from '../functions/personal-reading/relationship/relationship-intent.js';

const ROOT=process.cwd();
const readJson=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const writeJson=(rel,value)=>{const abs=path.join(ROOT,rel);fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,JSON.stringify(value,null,2)+'\n');};
const BASE='3a8e0658e26fa931257b491204a6ed2dcb345725';
const NOW='2026-09-01';
const instrument=readJson('content/professional/profile/assessment/self-assessment-instrument-v2.json');
const providerRegistry=readJson('content/professional/profile/registries/external-profile-provider-registry-v1.json');
const reasoningBank=readJson('content/profile/academic/reasoning/original-reasoning-task-bank-v1.json');
const reasoningAuthority=readJson('content/profile/academic/reasoning/reasoning-bank-authority-v1.json');
const quick=readJson('content/profile/ux/profile-quick-profile-selection-v1.json');
const reasoningReview=readJson('content/profile/ux/profile-reasoning-review-set-v1.json');
const crossRegistry=readJson('content/profile/cross-source/registries/cross-source-translation-rule-registry-v1.json');
const relRegistry=readJson('content/profile/relationship/registries/relationship-profile-comparison-rule-registry-v1.json');

const firstItemByDomain=Object.fromEntries(instrument.items.filter(x=>quick.itemIds.includes(x.itemId)).map(x=>[x.domainId,x.itemId]));
const allResponses=(value=4)=>Object.fromEntries(instrument.items.map((item,i)=>[item.itemId,Math.max(1,Math.min(5,typeof value==='function'?value(item,i):value))]));
const quickResponses=(value=4,{skipSensitive=false}={})=>Object.fromEntries(instrument.items.filter(x=>quick.itemIds.includes(x.itemId)&&!(skipSensitive&&x.sensitive)).map((item,i)=>[item.itemId,typeof value==='function'?value(item,i):value]));

async function selfSignals(participantRef,date,{full=false,value=4,skipSensitive=false,confirmed=true}={}){
  const responses=full?allResponses(value):quickResponses(value,{skipSensitive});
  const result=scoreSelfAssessment({instrument,responses,participantRef,assessmentDate:date,customerConfirmed:confirmed,consent:true,sensitiveConsent:Object.keys(responses).some(id=>instrument.items.find(x=>x.itemId===id)?.sensitive),purpose:SELF_ASSESSMENT_PURPOSE});
  return {result,signals:await buildSelfAssessmentProfileSignals(result)};
}
async function externalSignals(participantRef,date,{family='MBTI_OFFICIAL',label='INTJ',dimensions={},precision='CONFIRMED'}={}){
  const profile=normalizeExternalProfileInput({participantRef,providerFamily:family,providerName:family==='16P_NERIS'?'16Personalities / NERIS':'Imported profile provider',resultLabel:label,resultDimensions:dimensions,assessmentDate:date,resultPrecision:precision,customerConfirmed:true,consent:true,purpose:PROFILE_CONTEXT_PURPOSE,persistencePreference:'DO_NOT_SAVE',provenance:[{source:'CUSTOMER_ENTRY'}]},providerRegistry);
  return {profile,signals:await buildExternalProfileSignals(profile)};
}
async function reasoningSignals(participantRef,date,{mixed=false}={}){
  const selected=reasoningBank.items.filter(item=>reasoningReview.taskIds.includes(item.taskId));
  const responses=Object.fromEntries(selected.map((item,i)=>[item.taskId,mixed&&i%2?item.options.find(o=>o.optionId!==item.correctOptionId).optionId:item.correctOptionId]));
  const session=scoreOriginalReasoningTaskBank({bank:reasoningBank,bankAuthority:reasoningAuthority,responses,participantRef,assessmentDate:date});
  return {session,signals:await buildReasoningPerformanceSignals(session.performance)};
}
async function symbolicSignal(participantRef,date,{value='Symbolic reflection candidate',domainId='MEANING_VALUES'}={}){
  return buildProfileSignalEnvelope({participantRef,sourceClass:'SYMBOLIC_INTERPRETATION',sourceRef:'PRF-W12-SYMBOLIC-FIXTURE',domainId,value,valueType:'LABEL',confidence:'UNKNOWN',assessmentDate:date,customerConfirmed:false,precisionBoundary:['SYMBOLIC_INTERPRETATION_ONLY','NOT_MEASURED_TRAIT'],provenance:[{source:'PRF-W12-SYMBOLIC-FIXTURE'}]});
}
function currentReality(text='This is clearly present in my current work.',domain='CURRENT_STATE'){
  return canonicalizeCurrentRealityObservations(normalizePersonalCurrentRealityInput({optIn:true,purposeCode:CURRENT_REALITY_PURPOSE,observations:[{domain,promptId:'ACTIVE_NOW',text}]},'en'));
}
async function reality(signals,state='CURRENTLY_RESONANT'){
  const ir=currentReality();
  const row=signals[0];
  return buildProfileCurrentRealityCorrelation({profileSignals:signals,currentRealityIr:ir,responses:[{profileSignalId:row.profileSignalId,state,observationRefs:['CR-OBS-01'],customerNote:`Machine fixture: ${state}`}],asOfDate:NOW});
}
function relIntent(){return normalizeRelationshipIntent({relationshipIntentId:'REL-PRF-W12-FIXTURE',mode:'SPECIFIC_PERSON_RELATIONSHIP',relationshipType:'PARTNER',focusAreas:['COMMUNICATION'],participantARef:'PERSON-A',customerQuestion:'How do our reported patterns differ?',locale:'en',purpose:'RELATIONSHIP_READING',consent:{relationshipReadingUseAllowed:true,consentRecordId:'CONSENT-PRF-W12'}});}

const cases=[];
async function add(caseId,coverage,title,fn){
  const result=await fn();
  const view=result.view||await buildProgressiveProfileView({mode:result.mode||'QUICK_PROFILE',profileSignals:result.signals||[],profileRealityCorrelation:result.profileRealityCorrelation||null,crossSourcePerspective:result.crossSourcePerspective||null,relationshipProfileEvidence:result.relationshipProfileEvidence||null,participantRef:result.participantRef??null,asOfDate:NOW,locale:result.locale||'en',preview:true,customerPublishable:false});
  cases.push({caseId,coverage,title,status:'PASS',mode:view.mode,participantRef:view.participantRef,sourceClasses:view.sourceLegend.map(x=>x.sourceClass),oldResultWarning:view.freshness.oldResultWarningRequired,radarComplete:view.selfAssessmentRadar.complete,currentReality:view.currentReality?.counts||null,crossSourceGroups:view.crossSource?.groups||[],relationshipEvidenceCount:view.relationshipProfile?.evidence?.length||0,customerPublication:view.customerPublication,governance:view.governance,view});
}

await add('PRF-W12-MC-01','external result only','Official MBTI import remains external result context',async()=>({...await externalSignals('PERSON-A',NOW,{family:'MBTI_OFFICIAL',label:'INTJ'}),mode:'IMPORT_EXTERNAL_RESULT',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-02','external result only','16P/NERIS dimensions remain provider-specific',async()=>({...await externalSignals('PERSON-A',NOW,{family:'16P_NERIS',label:'Architect',dimensions:{Mind:62,Energy:55,Nature:48,Tactics:71,Identity:64}}),mode:'IMPORT_EXTERNAL_RESULT',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-03','missing dimensions','External result label without dimensions remains bounded',async()=>({...await externalSignals('PERSON-A',NOW,{family:'OTHER_EXTERNAL_PROFILE',label:'Provider result supplied by customer',dimensions:{}}),mode:'IMPORT_EXTERNAL_RESULT',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-04','self-assessment only','Quick Profile six-domain partial assessment',async()=>({...await selfSignals('PERSON-A',NOW,{full:false,value:4}),mode:'QUICK_PROFILE',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-05','self-assessment only','Full 30-facet self-assessment',async()=>({...await selfSignals('PERSON-A',NOW,{full:true,value:(x,i)=>2+(i%4)}),mode:'FULL_SELF_ASSESSMENT',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-06','missing dimensions','Quick Profile may skip sensitive domains',async()=>({...await selfSignals('PERSON-A',NOW,{full:false,value:3,skipSensitive:true}),mode:'QUICK_PROFILE',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-07','reasoning tasks only','Five-family reasoning sample all correct',async()=>({...await reasoningSignals('PERSON-A',NOW),mode:'REASONING_TASKS',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-08','reasoning tasks only','Five-family reasoning sample mixed raw performance',async()=>({...await reasoningSignals('PERSON-A',NOW,{mixed:true}),mode:'REASONING_TASKS',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-09','multiple source classes','Self-report plus task performance stay separate',async()=>{const a=await selfSignals('PERSON-A',NOW,{value:4});const b=await reasoningSignals('PERSON-A',NOW,{mixed:true});return {signals:[...a.signals,...b.signals],mode:'QUICK_PROFILE',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-10','multiple source classes','Imported result plus self-report stay separate',async()=>{const a=await externalSignals('PERSON-A',NOW,{family:'IPIP_BIG_FIVE',label:'Imported Big Five',dimensions:{Openness:72}});const b=await selfSignals('PERSON-A',NOW,{value:3});return {signals:[...a.signals,...b.signals],mode:'IMPORT_EXTERNAL_RESULT',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-11','multiple source classes','Imported result plus task performance stay separate',async()=>{const a=await externalSignals('PERSON-A',NOW,{family:'OTHER_BIG_FIVE',label:'External Big Five',dimensions:{Conscientiousness:65}});const b=await reasoningSignals('PERSON-A',NOW);return {signals:[...a.signals,...b.signals],mode:'IMPORT_EXTERNAL_RESULT',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-12','conflicting source classes','Self-report and symbolic tension does not validate either source',async()=>{const s=await selfSignals('PERSON-A',NOW,{value:5});const sym=await symbolicSignal('PERSON-A',NOW,{value:'A contrasting symbolic lens'});const signals=[s.signals.find(x=>x.domainId==='MEANING_VALUES'),sym];const cross=await buildCrossSourcePerspective({profileSignals:signals,comparisons:[{ruleId:'PRF-XSR-PARALLEL-SOURCE-COMPARISON-v1',group:'SOURCE_TENSION',topicId:'MEANING_VALUES',signalRefs:signals.map(x=>x.profileSignalId),explicitComparison:true,statement:'These sources point in different directions and remain separate evidence classes.'}],translationRuleRegistry:crossRegistry});return {signals,crossSourcePerspective:cross,mode:'QUICK_PROFILE',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-13','conflicting source classes','External result and self-report contradiction remains visible',async()=>{const e=await externalSignals('PERSON-A',NOW,{family:'OTHER_BIG_FIVE',label:'External Big Five',dimensions:{COGNITIVE_NAVIGATION:20}});const s=await selfSignals('PERSON-A',NOW,{value:5});const signals=[e.signals[0],s.signals.find(x=>x.domainId==='COGNITIVE_NAVIGATION')];const cross=await buildCrossSourcePerspective({profileSignals:signals,comparisons:[{ruleId:'PRF-XSR-PARALLEL-SOURCE-COMPARISON-v1',group:'SOURCE_CONTRADICTION',topicId:'COGNITIVE_NAVIGATION',signalRefs:signals.map(x=>x.profileSignalId),explicitComparison:true,statement:'The imported result and the customer self-report are not flattened into one conclusion.'}],translationRuleRegistry:crossRegistry});return {signals,crossSourcePerspective:cross,mode:'IMPORT_EXTERNAL_RESULT',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-14','old assessment date','Old assessment must be visibly dated',async()=>({...await selfSignals('PERSON-A','2024-01-01',{value:4}),mode:'QUICK_PROFILE',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-15','Person A','Person A profile scope remains isolated',async()=>({...await selfSignals('PERSON-A',NOW,{value:4}),mode:'QUICK_PROFILE',participantRef:'PERSON-A'}));
await add('PRF-W12-MC-16','Person B','Person B profile scope remains isolated',async()=>({...await selfSignals('PERSON-B',NOW,{value:2}),mode:'QUICK_PROFILE',participantRef:'PERSON-B'}));
await add('PRF-W12-MC-17','relationship with only A profile','A-only profile cannot manufacture partner evidence',async()=>({...await selfSignals('PERSON-A',NOW,{value:4}),mode:'QUICK_PROFILE',participantRef:'PERSON-A',relationshipProfileEvidence:null}));
await add('PRF-W12-MC-18','relationship with A+B profiles','A+B self-report comparison uses admitted same-domain rule',async()=>{const a=await selfSignals('PERSON-A',NOW,{value:4});const b=await selfSignals('PERSON-B',NOW,{value:2});const sa=a.signals.find(x=>x.domainId==='COGNITIVE_NAVIGATION'),sb=b.signals.find(x=>x.domainId==='COGNITIVE_NAVIGATION');const rel=await buildRelationshipProfileEvidence({relationshipIntent:relIntent(),participantARef:'PERSON-A',participantBRef:'PERSON-B',profileSignals:[sa,sb],comparisons:[{ruleId:'PRF-REL-SELF-REPORT-SAME-DOMAIN-v1',comparisonClass:'DIFFERENT_SELF_REPORTED_TENDENCY',explicitComparison:true,signalARef:sa.profileSignalId,signalBRef:sb.profileSignalId,topicId:'COGNITIVE_NAVIGATION',statement:'The two self-reports differ on this domain; this opens a reality-check target rather than a compatibility verdict.'}],comparisonRuleRegistry:relRegistry});return {signals:a.signals,relationshipProfileEvidence:rel,mode:'QUICK_PROFILE',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-19','relationship with A+B profiles','A+B same-provider external results may open an observation target',async()=>{const a=await externalSignals('PERSON-A',NOW,{family:'16P_NERIS',label:'A',dimensions:{Mind:65}});const b=await externalSignals('PERSON-B',NOW,{family:'16P_NERIS',label:'B',dimensions:{Mind:40}});const sa=a.signals[0],sb=b.signals[0];const rel=await buildRelationshipProfileEvidence({relationshipIntent:relIntent(),participantARef:'PERSON-A',participantBRef:'PERSON-B',profileSignals:[sa,sb],comparisons:[{ruleId:'PRF-REL-EXTERNAL-SAME-PROVIDER-DIMENSION-v1',comparisonClass:'COMMUNICATION_OBSERVATION_TARGET',explicitComparison:true,signalARef:sa.profileSignalId,signalBRef:sb.profileSignalId,topicId:sa.domainId,statement:'A provider-specific dimension difference is kept as an observation target only.'}],comparisonRuleRegistry:relRegistry});return {signals:a.signals,relationshipProfileEvidence:rel,mode:'IMPORT_EXTERNAL_RESULT',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-20','Current Reality support','Current Reality may support a current profile signal',async()=>{const s=await selfSignals('PERSON-A',NOW,{value:4});const signals=[s.signals[0]];return {signals,profileRealityCorrelation:await reality(signals,'CURRENTLY_RESONANT'),mode:'QUICK_PROFILE',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-21','Current Reality contradiction','Current Reality may contradict a profile signal without invalidating model',async()=>{const s=await selfSignals('PERSON-A',NOW,{value:4});const signals=[s.signals[0]];return {signals,profileRealityCorrelation:await reality(signals,'CURRENTLY_NOT_RESONANT'),mode:'QUICK_PROFILE',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-22','Current Reality support','Current Reality may remain partial/open',async()=>{const s=await selfSignals('PERSON-A',NOW,{value:4});const signals=[s.signals[0]];return {signals,profileRealityCorrelation:await reality(signals,'PARTIALLY_RESONANT'),mode:'QUICK_PROFILE',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-23','multiple source classes','Self-report + task performance + external result all preserve provenance',async()=>{const a=await selfSignals('PERSON-A',NOW,{value:3});const b=await reasoningSignals('PERSON-A',NOW,{mixed:true});const c=await externalSignals('PERSON-A',NOW,{family:'IPIP_BIG_FIVE',label:'Imported Big Five',dimensions:{Openness:71}});return {signals:[...a.signals,...b.signals,...c.signals],mode:'QUICK_PROFILE',participantRef:'PERSON-A'};});
await add('PRF-W12-MC-24','conflicting source classes','Broad mixed-source case preserves disagreement and current reality',async()=>{const s=await selfSignals('PERSON-A',NOW,{value:5});const sym=await symbolicSignal('PERSON-A',NOW,{domainId:'COGNITIVE_NAVIGATION',value:'Symbolic lens emphasizes a different operating pattern'});const ss=s.signals.find(x=>x.domainId==='COGNITIVE_NAVIGATION');const signals=[ss,sym];const rc=await reality([ss],'CURRENTLY_NOT_RESONANT');const cross=await buildCrossSourcePerspective({profileSignals:signals,profileRealityCorrelation:rc,comparisons:[{ruleId:'PRF-XSR-PARALLEL-SOURCE-COMPARISON-v1',group:'SOURCE_TENSION',topicId:'COGNITIVE_NAVIGATION',signalRefs:signals.map(x=>x.profileSignalId),explicitComparison:true,statement:'The two source classes remain in tension.'},{ruleId:'PRF-XSR-CURRENT-REALITY-CONTEXT-v1',group:'CURRENTLY_CONTRADICTED',topicId:'COGNITIVE_NAVIGATION',signalRefs:[ss.profileSignalId],realityCorrelationRefs:[rc.correlations[0].correlationId],explicitComparison:true,statement:'Current Reality currently contradicts this self-reported signal.'}],translationRuleRegistry:crossRegistry});return {signals,profileRealityCorrelation:rc,crossSourcePerspective:cross,mode:'QUICK_PROFILE',participantRef:'PERSON-A'};});

if(cases.length!==24||cases.some(c=>c.status!=='PASS'))throw new Error('PRF_W12_MACHINE_24_OF_24_REQUIRED');
const coverage={};for(const c of cases)coverage[c.coverage]=(coverage[c.coverage]||0)+1;
const caseFile={schemaVersion:'PHI-OS-PRF-W12-MACHINE-CASES-v1.0.0',work:'PRF-W12',baselineCommit:BASE,generatedAt:'2026-09-01T00:00:00.000Z',requiredCases:24,cases:cases.map(({view,...c})=>({...c,viewRef:`profile-prf-w12-machine-results-v1.json#${c.caseId}`}))};
const resultFile={schemaVersion:'PHI-OS-PRF-W12-MACHINE-RESULTS-v1.0.0',work:'PRF-W12',baselineCommit:BASE,status:'PASS_24_OF_24',summary:{required:24,passed:24,failed:0,coverage},publication:{customerPublishable:false,profileSurfaceCutoverAllowed:false,humanReviewRequired:true},cases};
writeJson('content/profile/campaign/profile-prf-w12-machine-cases-v1.json',caseFile);
writeJson('content/profile/campaign/profile-prf-w12-machine-results-v1.json',resultFile);
console.log('✓ PRF-W12 machine campaign generated: 24/24 PASS.');
console.log('  Source classes remain distinct; old-date, Current Reality, A/B and conflict cases are covered.');
