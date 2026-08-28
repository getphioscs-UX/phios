import assert from 'node:assert/strict';
import {acceptedSmrInput,SMR_METHODS} from './smr-campaign-support.mjs';
import {buildEcrCanonicalProjectionFromAnchor} from '../functions/embodied-configuration/ecr-canonical-projection-runtime.js';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {adaptAcceptedMethodReadingEnvelope} from '../functions/single-method-reading-r2/method-production-adapter-core.js';
import {buildCustomerClaimIR} from '../functions/single-method-reading-r2/customer-claim-ir.js';
import {resolveCustomerPriorities} from '../functions/single-method-reading-r2/customer-priority-resolver.js';
import {composeCustomerThemes} from '../functions/single-method-reading-r2/customer-theme-composer.js';
import {deduplicateEvidence} from '../functions/single-method-reading-r2/evidence-deduplicator.js';
import {deduplicateClaims} from '../functions/single-method-reading-r2/claim-deduplicator.js';
import {deduplicateNarrativeBlocks} from '../functions/single-method-reading-r2/narrative-deduplicator.js';
import {resolveSectionInformationGain} from '../functions/single-method-reading-r2/section-information-gain-resolver.js';
import {preserveContradictions} from '../functions/single-method-reading-r2/contradiction-preservation.js';
import {buildCustomerNarrativeIR} from '../functions/single-method-reading-r2/customer-narrative-ir.js';

async function ecrMethodResult(){
  const input={birthDate:'2000-01-01',birthTime:'12:00:00',birthPlace:{displayName:'Fixture',countryCode:'MY',latitude:3.1,longitude:101.7},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'SMR-R2-W0-W8',granted:true,purposeCode:'SMR_R2_ENGINEERING_REGRESSION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
  const anchor={utcIso:'2000-01-01T04:00:00.000Z',longitude:233.4,referenceFrame:'TEST',engineCode:'TEST',engineVersion:'1'};
  const projection=await buildEcrCanonicalProjectionFromAnchor({canonicalInput:input,anchor,requestId:'SMR-R2-W0-W8-ECR'});
  return await buildAcceptedMethodCustomerResult({canonicalProjection:projection,locale:'en'});
}
const intents={AST:{intentId:'EXPRESSION',prompt:'Understand expression and communication patterns.'},BZR:{intentId:'WORK',prompt:'Explore work and resource themes where evidence exists.'},ZWR:{intentId:'RELATIONSHIP',prompt:'Explore relationship and exchange themes where evidence exists.'},NUM:{intentId:'DIRECTION',prompt:'Understand decision and direction patterns.'},ECR:{intentId:'OBSERVATION',prompt:'Identify observable signals to compare with reality.'}};
const methods=[...SMR_METHODS,'ECR'];
const summary={};
for(const methodId of methods){
  const methodResult=methodId==='ECR'?await ecrMethodResult():(await acceptedSmrInput(methodId,'en')).methodResult;
  const envelope=adaptAcceptedMethodReadingEnvelope(methodResult,{expectedMethodId:methodId});
  const claims=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope,customerIntent:intents[methodId]});
  const priority=resolveCustomerPriorities({claimCollection:claims,customerIntent:intents[methodId]});
  const themes=composeCustomerThemes({priorityResolution:priority});
  const evidenceDedup=deduplicateEvidence({claims:priority.claims});
  const claimDedup=deduplicateClaims({claims:priority.claims});
  const legacyNarrativeDedup=deduplicateNarrativeBlocks({blocks:themes.themes.flatMap(theme=>[
    {narrativeRef:`${theme.themeId}:WHAT`,themeRef:theme.themeId,text:theme.whatStandsOut,contextKey:'WHAT_STANDS_OUT'},
    ...(theme.whyItMatters?[{narrativeRef:`${theme.themeId}:WHY`,themeRef:theme.themeId,text:theme.whyItMatters,contextKey:'WHY_IT_MATTERS',newInformationRefs:theme.supportClaimRefs}]:[]),
    ...(theme.howItMayShow?[{narrativeRef:`${theme.themeId}:HOW`,themeRef:theme.themeId,text:theme.howItMayShow,contextKey:'HOW_IT_MAY_SHOW',newInformationRefs:theme.conditionClaimRefs}]:[]),
    ...(theme.whenItMayDiffer?[{narrativeRef:`${theme.themeId}:DIFFER`,themeRef:theme.themeId,text:theme.whenItMayDiffer,contextKey:'WHEN_IT_MAY_DIFFER',newInformationRefs:theme.tensionClaimRefs}]:[])
  ])});
  const info=resolveSectionInformationGain({priorityResolution:priority,themeCollection:themes});
  const contradiction=preserveContradictions({priorityResolution:priority,themeCollection:themes,claimDedup});
  const narrative=buildCustomerNarrativeIR({priorityResolution:priority,themeCollection:themes,sectionInformationGain:info,contradictionPreservation:contradiction});

  assert.equal(evidenceDedup.boundary.evidenceDeleted,false);
  assert.ok(claimDedup.semanticClusters.every(cluster=>cluster.fullExplanationCount===1));
  assert.equal(legacyNarrativeDedup.boundary.fullExplanationMax,1);
  for(const section of info.sections){
    const gain=section.newClaimRefs.length+section.newRelationRefs.length+section.newConditionRefs.length+section.newCounterEvidenceRefs.length+section.newObservationRefs.length;
    assert.equal(gain,section.informationGainCount);
    if(gain===0)assert.equal(section.eligibility,'SECTION_NOT_ELIGIBLE');
  }
  const temporalClaims=priority.claims.filter(claim=>claim.claimType==='TEMPORAL_ACTIVATION');
  const timing=info.sections.find(section=>section.sectionId==='TIMING');
  if(!temporalClaims.length)assert.equal(timing.eligibility,'SECTION_NOT_ELIGIBLE');
  const mustPreserve=priority.claims.filter(claim=>['TENSION','CONDITION','TRADEOFF','OPEN','TEMPORAL_ACTIVATION'].includes(claim.claimType)||claim.counterEvidenceRefs.length).map(claim=>claim.claimId);
  for(const ref of mustPreserve)assert.ok(contradiction.preservedClaimRefs.includes(ref));
  assert.equal(narrative.boundary.admittedClaimTextOnly,true);
  assert.equal(narrative.boundary.newMeaningCreated,false);
  assert.equal(narrative.boundary.genericIntroCreated,false);
  assert.equal(narrative.boundary.genericEndingCreated,false);
  assert.equal(narrative.boundary.suppressedDuplicateRenderable,false);
  assert.equal(narrative.technicalAppendix.defaultCollapsed,true);
  const admittedTexts=new Set(priority.claims.flatMap(claim=>[claim.structuralMeaning,...claim.conditions.flatMap(condition=>condition&&typeof condition==='object'?[condition.structuralReason,condition.relationContext,condition.constructiveExpression,condition.frictionExpression,...(condition.activationConditions||[]),...(condition.observableSignals||[]),...(condition.alternativeInterpretations||[])]:[])]).filter(Boolean));
  const blocks=[];
  const visit=value=>{if(!value||typeof value!=='object')return;if(value.narrativeRef)blocks.push(value);for(const nested of Object.values(value))if(nested&&typeof nested==='object')visit(nested)};
  visit(narrative);
  const renderable=blocks.filter(block=>block.renderable);
  for(const block of renderable)assert.ok(admittedTexts.has(block.text),`${methodId}: non-admitted narrative text: ${block.text}`);
  const texts=renderable.map(block=>block.text);
  assert.equal(new Set(texts).size,texts.length,`${methodId}: exact duplicate renderable narrative text`);
  assert.ok(narrative.whyThisReading.every(item=>item.priorityReasonRefs.length>0));
  summary[methodId]={
    claims:priority.claims.length,themes:themes.themeCount,
    eligibleSections:info.eligibleSectionRefs,
    suppressedSections:info.suppressedSectionRefs,
    contradictionCounts:contradiction.counts,
    primaryThemes:narrative.primaryThemes.length,
    deeperSections:narrative.deeperSections.map(section=>section.sectionId),
    renderableNarrativeBlocks:narrative.narrativeDedup.renderableBlockCount,
    suppressedNarrativeDuplicates:narrative.narrativeDedup.suppressedDuplicateCount
  };
}
console.log('✓ CX-R12R4B SMR-R2 W0-W8 real-method regression passed across AST/BZR/ZWR/NUM/ECR.');
for(const methodId of methods)console.log(`  ${methodId}: ${JSON.stringify(summary[methodId])}`);
