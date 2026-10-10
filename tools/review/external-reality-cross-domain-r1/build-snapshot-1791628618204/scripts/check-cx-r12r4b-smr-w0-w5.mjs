import assert from 'node:assert/strict';
import {acceptedSmrInput,SMR_METHODS} from './smr-regression-fixture-support.mjs';
import {buildEcrCanonicalProjectionFromAnchor} from '../functions/embodied-configuration/ecr-canonical-projection-runtime.js';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {adaptAcceptedMethodReadingEnvelope} from '../functions/single-method-reading/method-production-adapter-core.js';
import {buildCustomerClaimIR} from '../functions/single-method-reading/customer-claim-ir.js';
import {resolveCustomerPriorities} from '../functions/single-method-reading/customer-priority-resolver.js';
import {composeCustomerThemes} from '../functions/single-method-reading/customer-theme-composer.js';
import {deduplicateEvidence} from '../functions/single-method-reading/evidence-deduplicator.js';
import {deduplicateClaims} from '../functions/single-method-reading/claim-deduplicator.js';
import {deduplicateNarrativeBlocks} from '../functions/single-method-reading/narrative-deduplicator.js';

async function ecrMethodResult(){
  const input={birthDate:'2000-01-01',birthTime:'12:00:00',birthPlace:{displayName:'Fixture',countryCode:'MY',latitude:3.1,longitude:101.7},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'SMR-R2-W0-W5',granted:true,purposeCode:'SMR_R2_ENGINEERING_REGRESSION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
  const anchor={utcIso:'2000-01-01T04:00:00.000Z',longitude:233.4,referenceFrame:'TEST',engineCode:'TEST',engineVersion:'1'};
  const projection=await buildEcrCanonicalProjectionFromAnchor({canonicalInput:input,anchor,requestId:'SMR-R2-W0-W5-ECR'});
  return buildAcceptedMethodCustomerResult({canonicalProjection:projection,locale:'en'});
}
const intents={AST:{intentId:'EXPRESSION',prompt:'Understand expression and communication patterns.'},BZR:{intentId:'WORK',prompt:'Explore work and resource themes where evidence exists.'},ZWR:{intentId:'RELATIONSHIP',prompt:'Explore relationship and exchange themes where evidence exists.'},NUM:{intentId:'DIRECTION',prompt:'Understand decision and direction patterns.'},ECR:{intentId:'OBSERVATION',prompt:'Identify observable signals to compare with reality.'}};
const methods=[...SMR_METHODS,'ECR'];const summary={};
for(const methodId of methods){
  const methodResult=methodId==='ECR'?await ecrMethodResult():(await acceptedSmrInput(methodId,'en')).methodResult;
  const envelope=adaptAcceptedMethodReadingEnvelope(methodResult,{expectedMethodId:methodId});
  const claims=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope,customerIntent:intents[methodId]});
  const priority=resolveCustomerPriorities({claimCollection:claims,customerIntent:intents[methodId]});
  const themes=composeCustomerThemes({priorityResolution:priority});
  const evidence=deduplicateEvidence({claims:priority.claims});
  const claimDedup=deduplicateClaims({claims:priority.claims});
  const narrative=deduplicateNarrativeBlocks({blocks:themes.themes.flatMap(theme=>[
    {narrativeRef:`${theme.themeId}:WHAT`,themeRef:theme.themeId,text:theme.whatStandsOut,contextKey:'WHAT_STANDS_OUT'},
    ...(theme.whyItMatters?[{narrativeRef:`${theme.themeId}:WHY`,themeRef:theme.themeId,text:theme.whyItMatters,contextKey:'WHY_IT_MATTERS',newInformationRefs:theme.supportClaimRefs}]:[]),
    ...(theme.howItMayShow?[{narrativeRef:`${theme.themeId}:HOW`,themeRef:theme.themeId,text:theme.howItMayShow,contextKey:'HOW_IT_MAY_SHOW',newInformationRefs:theme.conditionClaimRefs}]:[]),
    ...(theme.whenItMayDiffer?[{narrativeRef:`${theme.themeId}:DIFFER`,themeRef:theme.themeId,text:theme.whenItMayDiffer,contextKey:'WHEN_IT_MAY_DIFFER',newInformationRefs:theme.tensionClaimRefs}]:[])
  ])});
  assert.ok(priority.claims.length===claims.claims.length);assert.ok(priority.claims.every(c=>c.priorityReasonRefs.length));assert.ok(priority.firstScreenClaimRefs.length<=3);assert.ok(themes.themeCount>0&&themes.themeCount<=priority.claims.filter(c=>!['SUPPRESS','TECHNICAL'].includes(c.priorityClass)).length);assert.equal(evidence.boundary.evidenceDeleted,false);assert.ok(claimDedup.semanticClusters.every(c=>c.fullExplanationCount===1));assert.equal(narrative.boundary.fullExplanationMax,1);
  summary[methodId]={claims:claims.claims.length,primary:priority.claims.filter(c=>c.priorityClass==='PRIMARY').length,secondary:priority.claims.filter(c=>c.priorityClass==='SECONDARY').length,supporting:priority.claims.filter(c=>c.priorityClass==='SUPPORTING').length,conditional:priority.claims.filter(c=>c.priorityClass==='CONDITIONAL').length,suppressed:priority.claims.filter(c=>c.priorityClass==='SUPPRESS').length,firstScreen:priority.firstScreenClaimRefs.length,themes:themes.themeCount,claimClusters:claimDedup.semanticClusters.length,narrativeBlocks:narrative.blocks.length};
}
console.log('✓ CX-R12R4B SMR-R2 W0-W5 real-method regression passed across AST/BZR/ZWR/NUM/ECR.');
for(const methodId of methods)console.log(`  ${methodId}: ${JSON.stringify(summary[methodId])}`);
