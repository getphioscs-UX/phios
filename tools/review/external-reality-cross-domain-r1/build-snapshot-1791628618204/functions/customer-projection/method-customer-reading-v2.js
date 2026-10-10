/** CX-R12R3B one shared customer interpretation preparation path. */
import {buildCanonicalMeaningProductionBundle} from '../canonical-meaning-production/meaning-bundle-builder-production.js';
import {buildAstV2CanonicalMeaningProductionBundle} from '../canonical-meaning-production/meaning-bundle-builder-ast-v2.js';
import {projectCanonicalMeaningLocale} from '../canonical-meaning-production/locale-projector.js';
import {buildAstRuntimeReadingIR} from '../runtime-reading/ast-reading-ir.js';
import {buildBzrRuntimeReadingIR} from '../runtime-reading/bzr-reading-ir.js';
import {buildNumRuntimeReadingIR} from '../runtime-reading/num-reading-ir.js';
import {buildZiWeiRuntimeReadingIR} from '../runtime-reading/zi-wei-reading-ir.js';
import {buildEcrRuntimeReadingIR} from '../runtime-reading/ecr-reading-ir.js';
import {buildEcrCanonicalMeaningBundle,projectEcrMeaningLocale} from '../canonical-meaning-production/ecr-meaning-runtime.js';
import {
  CMP_PRODUCTION_ADMISSION_REGISTRY,
  CMP_PRODUCTION_MAPPING_REGISTRY,
  CMP_PRODUCTION_ACTIVATION_REGISTRY,
  CMP_PRODUCTION_LOCALE_REGISTRY
} from '../canonical-meaning-production/production-registry-current-v3.js';
import {createMethodInterpretationInput,createMethodInterpretationCandidate,projectMethodGraph} from '../interpretation-runtime/cx-r12r3b-shared-runtime-v2.js';
import {resolveCustomerCompositionAdmission} from '../interpretation-runtime/customer-composition-admission-resolver-v1.js';
import {executeAdmittedCustomerInterpretation} from '../interpretation-runtime/admitted-customer-interpretation-runtime-v1.js';
import {projectCxR12R3bCustomerLanguage} from './cx-r12r3b-customer-language-v1.js';

const METHOD_ID=Object.freeze({ASTROLOGY_PROJECTION:'AST',NUMEROLOGY_PROJECTION:'NUM',BAZI_PROJECTION:'BZR',ZI_WEI_PROJECTION:'ZWR',EMBODIED_CONFIGURATION_PROJECTION:'ECR'});
const METHOD_LABELS=Object.freeze({AST:Object.freeze({en:'Astrology','zh-Hans':'占星'}),BZR:Object.freeze({en:'BaZi','zh-Hans':'八字'}),NUM:Object.freeze({en:'Numerology','zh-Hans':'数字学'}),ZWR:Object.freeze({en:'Zi Wei','zh-Hans':'紫微斗数'}),ECR:Object.freeze({en:'Embodied Configuration','zh-Hans':'载体构型读取'})});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

function customerVisualModel(graph){
  const {projectionDigest:_projectionDigest,graphDigest:_graphDigest,sourceRefs:_sourceRefs,...base}=graph;
  return {
    ...base,
    nodes:(graph.nodes||[]).map(({canonicalRef:_canonicalRef,interpretationUnitRefs:_interpretationUnitRefs,...node})=>node),
    edges:(graph.edges||[]).map(({canonicalRelationRef:_canonicalRelationRef,interpretationUnitRefs:_interpretationUnitRefs,...edge})=>edge),
    groups:(graph.groups||[]).map(({canonicalRef:_canonicalRef,...group})=>group),
    overlays:(graph.overlays||[]).map(({canonicalRef:_canonicalRef,...overlay})=>overlay),
    customerInterpretationBindingsAccepted:true
  };
}

function acceptedCustomerResult({canonicalProjection,input,candidate,acceptedInterpretation,graph,admission}){
  const methodId=input.methodId,label=METHOD_LABELS[methodId]?.[input.locale]||METHOD_LABELS[methodId]?.en||'Perspective';
  const uncertaintyCount=acceptedInterpretation.interpretationUnits.reduce((count,item)=>count+(item.uncertainties?.length||0),0);
  const openQuestions=[...new Set(acceptedInterpretation.interpretationUnits.flatMap(item=>item.realityComparisonQuestions||[]))];
  const insights=acceptedInterpretation.interpretationUnits.map(item=>Object.freeze({
    insightId:item.unitId,
    title:item.title,
    summary:item.summary,
    body:item.body,
    plainLanguageExplanation:item.plainLanguageExplanation,
    observableSignals:item.observableSignals,
    alternativeInterpretations:item.alternativeInterpretations,
    openQuestions:item.realityComparisonQuestions,
    confidenceBoundary:item.confidenceBoundary,
    ...(methodId==='AST'?{interpretationDetail:{
      schemaVersion:'PHI-OS-AST-INTERPRETATION-DETAIL-v1.0.0',
      structuralReason:item.structuralReason,
      relationContext:item.relationContext,
      constructiveExpression:item.constructiveExpression,
      frictionExpression:item.frictionExpression,
      activationConditions:item.activationConditions||[],
      uncertainties:item.uncertainties||[],
      sourceLineage:item.sourceLineage||[]
    }}:{})
  }));
  return freeze({
    schemaVersion:'PHI-OS-CX-R12R4B-CUSTOMER-READING-METHOD-v1.0.0',
    methodId,
    methodLabel:label,
    locale:input.locale,
    state:'READY_TO_READ',
    stateLabel:input.locale==='zh-Hans'?'可以阅读':'Ready to read',
    summary:input.locale==='zh-Hans'
      ?`${label}已经形成 ${acceptedInterpretation.interpretationUnits.length} 项经过审核的重点。`
      :`${label} has ${acceptedInterpretation.interpretationUnits.length} reviewed highlights ready to read.`,
    insights,
    visualModel:customerVisualModel(graph),
    source:Object.freeze({
      label:input.locale==='zh-Hans'?'受治理的方法解释':'Governed method interpretation',
      lineageAvailable:true
    }),
    openQuestions,
    technical:Object.freeze({
      methodId,
      publicMethodCode:canonicalProjection.method.publicMethodCode,
      projectionId:canonicalProjection.projectionId,
      projectionDigest:candidate.projectionDigest,
      interpretationResultId:acceptedInterpretation.interpretationResultId,
      semanticDigest:acceptedInterpretation.semanticDigest,
      derivationDigest:acceptedInterpretation.derivationDigest,
      graphDigest:graph.graphDigest,
      graphSourceRefs:graph.sourceRefs,
      lifecycle:acceptedInterpretation.lifecycle,
      meaningBundleCode:acceptedInterpretation.meaningBundleCode,
      compositionRuleVersion:acceptedInterpretation.compositionRuleVersion,
      admissionRef:acceptedInterpretation.admissionRef,
      acceptanceBasis:acceptedInterpretation.acceptanceBasis,
      humanReviewEvidenceRef:admission.reviewEvidenceRef,
      interpretationUnits:acceptedInterpretation.interpretationUnits.map(item=>({
        unitId:item.unitId,
        semanticTags:item.semanticTags,
        projectionRefs:item.projectionRefs,
        meaningRefs:item.meaningRefs,
        derivationRefs:item.derivationRefs,
        boundaryRefs:item.boundaryRefs
      })),
      houseSystemId:candidate.houseSystemId,
      openItemCount:uncertaintyCount,
      boundary:acceptedInterpretation.boundary
    })
  });
}

export async function buildMethodMeaningPayloadV2({canonicalProjection,locale='en'}={}){
  const publicMethodCode=canonicalProjection?.method?.publicMethodCode;
  if(!METHOD_ID[publicMethodCode])throw Object.assign(new Error('CX_R12R3B_METHOD_NOT_SUPPORTED'),{code:'CX_R12R3B_METHOD_NOT_SUPPORTED'});
  const ziWei=publicMethodCode==='ZI_WEI_PROJECTION'?await import('../canonical-meaning-production/zi-wei-meaning-runtime.js'):null;
  const meaningBundle=publicMethodCode==='EMBODIED_CONFIGURATION_PROJECTION'
    ?await buildEcrCanonicalMeaningBundle(canonicalProjection)
    :publicMethodCode==='ZI_WEI_PROJECTION'
      ?ziWei.buildZiWeiCanonicalMeaningBundle(canonicalProjection)
      :publicMethodCode==='ASTROLOGY_PROJECTION'
        ?await buildAstV2CanonicalMeaningProductionBundle({projection:canonicalProjection,admissionRegistry:CMP_PRODUCTION_ADMISSION_REGISTRY,mappingRegistry:CMP_PRODUCTION_MAPPING_REGISTRY,activationRegistry:CMP_PRODUCTION_ACTIVATION_REGISTRY})
        :await buildCanonicalMeaningProductionBundle({projection:canonicalProjection,admissionRegistry:CMP_PRODUCTION_ADMISSION_REGISTRY,mappingRegistry:CMP_PRODUCTION_MAPPING_REGISTRY,activationRegistry:CMP_PRODUCTION_ACTIVATION_REGISTRY,mode:'production'});
  const useLocale=locale==='zh-Hans'?'zh-Hans':'en';
  const localeProjection=publicMethodCode==='EMBODIED_CONFIGURATION_PROJECTION'
    ?projectEcrMeaningLocale(meaningBundle,useLocale)
    :publicMethodCode==='ZI_WEI_PROJECTION'
      ?ziWei.projectZiWeiMeaningLocale(meaningBundle,useLocale)
      :await projectCanonicalMeaningLocale({bundle:meaningBundle,localeRegistry:CMP_PRODUCTION_LOCALE_REGISTRY,locale:useLocale});
  const reading=publicMethodCode==='EMBODIED_CONFIGURATION_PROJECTION'
    ?buildEcrRuntimeReadingIR({projection:canonicalProjection,bundle:meaningBundle,localeProjection})
    :publicMethodCode==='ASTROLOGY_PROJECTION'
      ?buildAstRuntimeReadingIR({projection:canonicalProjection,bundle:meaningBundle,localeProjection})
      :publicMethodCode==='BAZI_PROJECTION'
        ?buildBzrRuntimeReadingIR({projection:canonicalProjection,bundle:meaningBundle,localeProjection})
        :publicMethodCode==='NUMEROLOGY_PROJECTION'
          ?buildNumRuntimeReadingIR({projection:canonicalProjection,bundle:meaningBundle,localeProjection})
          :buildZiWeiRuntimeReadingIR({projection:canonicalProjection,bundle:meaningBundle,localeProjection});
  const projected=projectCxR12R3bCustomerLanguage({meaningPayload:{executionCompleteness:reading.executionCompleteness,meaningBundle,localeProjection,reading},methodId:METHOD_ID[publicMethodCode],locale:useLocale});
  return freeze(projected);
}

export async function buildMethodCustomerDevelopmentResult({canonicalProjection,locale='en',requestedDepth='STANDARD',acceptedInterpretation=null}={}){
  const methodId=METHOD_ID[canonicalProjection?.method?.publicMethodCode];
  const meaningPayload=await buildMethodMeaningPayloadV2({canonicalProjection,locale});
  const input=await createMethodInterpretationInput({canonicalProjection,methodId,locale:locale==='zh-Hans'?'zh-Hans':'en',requestedDepth,availableContext:{timing:'UPSTREAM_AUTHORISED_ONLY'},authorityState:{meaningBundleCode:meaningPayload.meaningBundle.bundleCode}});
  const candidate=await createMethodInterpretationCandidate({input,meaningPayload});
  const graph=await projectMethodGraph({input,candidate,acceptedInterpretation});
  const accepted=acceptedInterpretation?.resultStatus==='CUSTOMER_PUBLISHABLE';
  return freeze({
    schemaVersion:'PHI-OS-CX-R12R3B-CUSTOMER-METHOD-RESULT-v1.0.0',
    methodId,
    publicMethodCode:canonicalProjection.method.publicMethodCode,
    projectionId:canonicalProjection.projectionId,
    projectionDigest:candidate.projectionDigest,
    houseSystemId:candidate.houseSystemId,
    locale:input.locale,
    lifecycle:candidate.lifecycle,
    state:accepted?'CUSTOMER_PUBLISHABLE':candidate.validation.valid?'HUMAN_REVIEW_REQUIRED':'STRUCTURE_ONLY',
    insights:accepted?acceptedInterpretation.interpretationUnits:[],
    graph:{...graph,interpretationBindings:accepted?graph.interpretationBindings:[],nodes:graph.nodes.map(x=>({...x,interpretationUnitRefs:accepted?x.interpretationUnitRefs:[]})),edges:graph.edges.map(x=>({...x,interpretationUnitRefs:accepted?x.interpretationUnitRefs:[]})),customerInterpretationBindingsAccepted:accepted},
    structureOnly:!accepted,
    development:{candidatePrepared:candidate.validation.valid,candidateId:candidate.candidateId,humanReviewRequired:!accepted,candidateNotCustomerPublished:!accepted},
    boundary:{atomicMeaningPublishedDirectly:false,rendererCreatesMeaning:false,aiCreatesMeaning:false,realityKnown:false,professionalJudgmentCreated:false}
  });
}

/**
 * R12R4A customer cutover. This consumes PASS2B admission and promotes the
 * current projection's governed candidate through the existing R12R3B
 * promotion function; it does not create or replace interpretation authority.
 */
export async function buildAcceptedMethodCustomerResult({canonicalProjection,locale='en',requestedDepth='STANDARD'}={}){
  const methodId=METHOD_ID[canonicalProjection?.method?.publicMethodCode];
  const meaningPayload=await buildMethodMeaningPayloadV2({canonicalProjection,locale});
  const input=await createMethodInterpretationInput({canonicalProjection,methodId,locale:locale==='zh-Hans'?'zh-Hans':'en',requestedDepth,availableContext:{timing:'UPSTREAM_AUTHORISED_ONLY'},authorityState:{meaningBundleCode:meaningPayload.meaningBundle.bundleCode,humanReviewedCompositionAdmissionRef:'RESOLVED_AFTER_CANDIDATE_VALIDATION'}});
  const candidate=await createMethodInterpretationCandidate({input,meaningPayload});
  if(candidate.validation.valid!==true)throw Object.assign(new Error('CX_R12R4A_ACCEPTED_CANDIDATE_VALIDATION_REQUIRED'),{code:'CX_R12R4A_ACCEPTED_CANDIDATE_VALIDATION_REQUIRED',failures:candidate.validation.failures});
  const admission=resolveCustomerCompositionAdmission({
    methodId,
    candidateSchemaVersion:candidate.schemaVersion,
    meaningBundleCode:meaningPayload.meaningBundle.bundleCode,
    compositionRuleVersion:candidate.compositionVersion,
    locale:input.locale,
    projectionAuthorityVersion:candidate.sourceReference.projectionVersion,
    methodParameters:{houseSystemId:candidate.houseSystemId}
  });
  if(admission.publicationAllowed!==true)throw Object.assign(new Error('CX_R12R4B_COMPOSITION_NOT_ADMITTED'),{code:'CX_R12R4B_COMPOSITION_NOT_ADMITTED',constraints:admission.constraints});
  const acceptedInterpretation=await executeAdmittedCustomerInterpretation({canonicalProjection,meaningPayload,candidate,admission});
  const graph=await projectMethodGraph({input,candidate,acceptedInterpretation,meaningPayload});
  return acceptedCustomerResult({canonicalProjection,input,candidate,acceptedInterpretation,graph,admission});
}
