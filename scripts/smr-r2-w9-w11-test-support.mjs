import {acceptedSmrInput,SMR_METHODS} from './smr-campaign-support.mjs';
import {buildEcrCanonicalProjectionFromAnchor} from '../functions/embodied-configuration/ecr-canonical-projection-runtime.js';
import {buildAcceptedMethodCustomerResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {adaptAcceptedMethodReadingEnvelope} from '../functions/single-method-reading-r2/method-production-adapter-core.js';
import {buildCustomerClaimIR} from '../functions/single-method-reading-r2/customer-claim-ir.js';
import {resolveCustomerPriorities} from '../functions/single-method-reading-r2/customer-priority-resolver.js';
import {composeCustomerThemes} from '../functions/single-method-reading-r2/customer-theme-composer.js';
import {deduplicateClaims} from '../functions/single-method-reading-r2/claim-deduplicator.js';
import {resolveSectionInformationGain} from '../functions/single-method-reading-r2/section-information-gain-resolver.js';
import {preserveContradictions} from '../functions/single-method-reading-r2/contradiction-preservation.js';
import {buildCustomerNarrativeIR} from '../functions/single-method-reading-r2/customer-narrative-ir.js';

export const R2_METHODS=[...SMR_METHODS,'ECR'];
export const R2_INTENTS={AST:{intentId:'EXPRESSION',prompt:'Understand expression and communication patterns.'},BZR:{intentId:'WORK',prompt:'Explore work and resource themes where evidence exists.'},ZWR:{intentId:'RELATIONSHIP',prompt:'Explore relationship and exchange themes where evidence exists.'},NUM:{intentId:'DIRECTION',prompt:'Understand decision and direction patterns.'},ECR:{intentId:'OBSERVATION',prompt:'Identify observable signals to compare with reality.'}};

async function ecrMethodResult(){
  const input={birthDate:'2000-01-01',birthTime:'12:00:00',birthPlace:{displayName:'Fixture',countryCode:'MY',latitude:3.1,longitude:101.7},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'SMR-R2-W9-W11',granted:true,purposeCode:'SMR_R2_ENGINEERING_REGRESSION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
  const anchor={utcIso:'2000-01-01T04:00:00.000Z',longitude:233.4,referenceFrame:'TEST',engineCode:'TEST',engineVersion:'1'};
  const projection=await buildEcrCanonicalProjectionFromAnchor({canonicalInput:input,anchor,requestId:'SMR-R2-W9-W11-ECR'});
  return await buildAcceptedMethodCustomerResult({canonicalProjection:projection,locale:'en'});
}

export async function buildRealR2Narrative(methodId){
  const methodResult=methodId==='ECR'?await ecrMethodResult():(await acceptedSmrInput(methodId,'en')).methodResult;
  const intent=R2_INTENTS[methodId];
  const envelope=adaptAcceptedMethodReadingEnvelope(methodResult,{expectedMethodId:methodId});
  const claims=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope,customerIntent:intent});
  const priority=resolveCustomerPriorities({claimCollection:claims,customerIntent:intent});
  const themes=composeCustomerThemes({priorityResolution:priority});
  const claimDedup=deduplicateClaims({claims:priority.claims});
  const informationGain=resolveSectionInformationGain({priorityResolution:priority,themeCollection:themes});
  const contradiction=preserveContradictions({priorityResolution:priority,themeCollection:themes,claimDedup});
  const narrative=buildCustomerNarrativeIR({priorityResolution:priority,themeCollection:themes,sectionInformationGain:informationGain,contradictionPreservation:contradiction});
  return {methodResult,envelope,claims,priority,themes,claimDedup,informationGain,contradiction,narrative};
}

const claim=(id,{type='CORE_PATTERN',priority='SECONDARY',score=70,domains=['IDENTITY_EXPRESSION'],conditions=[],counter=[],text=`Accepted meaning ${id}`}={})=>({
  schemaVersion:'PHI-OS-CUSTOMER-READING-CLAIM-IR-v1.0.0',claimId:`C-${id}`,methodId:'AST',semanticDimension:`METHOD_NATIVE:AST:${id}`,claimType:type,headline:`Headline ${id}`,structuralMeaning:text,
  findingRefs:[],interpretationUnitRefs:[`U-${id}`],evidenceRefs:[`P-${id}`,`M-${id}`],counterEvidenceRefs:counter,priorityClass:priority,priorityScore:score,priorityReasonRefs:[`PRIORITY-${id}`],noveltyClass:'UNASSESSED',confidenceClass:'ADMITTED_AUTHORITY',conditions,boundaries:[],questionRelevance:{state:'RESOLVED_RELEVANT',intentId:'OPEN',score:0},sectionCandidates:[],customerDomains:domains,
  lineage:{productionAdmissionRef:'ADM',readingAuthorityRef:'READ',interpretationUnitRefs:[`U-${id}`],projectionRefs:[`P-${id}`],meaningRefs:[`M-${id}`],ruleRefs:[`R-${id}`],boundaryRefs:[],semanticDigest:'SEM'}
});

export function buildSyntheticR2Narrative(){
  const claims=[
    claim('A',{type:'SUPPORT',priority:'PRIMARY',score:100,domains:['IDENTITY_EXPRESSION'],text:'Accepted support meaning A.'}),
    claim('B',{type:'TENSION',priority:'SECONDARY',score:76,domains:['IDENTITY_EXPRESSION'],text:'Accepted tension meaning B.'}),
    claim('C',{type:'CONDITION',priority:'SECONDARY',score:72,domains:['ENVIRONMENT_DIRECTION'],conditions:['QUESTION:When does this pattern change in reality?'],text:'Accepted conditional meaning C.'}),
    claim('D',{type:'CORE_PATTERN',priority:'SUPPORTING',score:48,domains:['WORK_RESOURCES'],text:'Accepted work meaning D.'}),
    claim('E',{type:'CORE_PATTERN',priority:'SUPPORTING',score:46,domains:['COMMUNICATION_EXCHANGE'],text:'Accepted communication meaning E.'}),
    claim('F',{type:'TRADEOFF',priority:'SUPPORTING',score:44,domains:['RELATIONSHIP_EXCHANGE'],counter:['CE-F'],text:'Accepted counterbalanced meaning F.'})
  ];
  const priority={schemaVersion:'PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0',methodId:'AST',readingAuthorityRef:'READ',semanticDigest:'SEM',priorityRuleVersion:'TEST',claims,firstScreenClaimRefs:['C-A','C-B','C-C'],boundary:{}};
  const themes=composeCustomerThemes({priorityResolution:priority});
  const claimDedup=deduplicateClaims({claims});
  const informationGain=resolveSectionInformationGain({priorityResolution:priority,themeCollection:themes});
  const contradiction=preserveContradictions({priorityResolution:priority,themeCollection:themes,claimDedup});
  const narrative=buildCustomerNarrativeIR({priorityResolution:priority,themeCollection:themes,sectionInformationGain:informationGain,contradictionPreservation:contradiction});
  return {claims,priority,themes,claimDedup,informationGain,contradiction,narrative};
}
