/** CX-R12R3B one shared customer interpretation preparation path. */
import {buildCanonicalMeaningProductionBundle} from '../canonical-meaning-production/meaning-bundle-builder-production.js';
import {buildAstV2CanonicalMeaningProductionBundle} from '../canonical-meaning-production/meaning-bundle-builder-ast-v2.js';
import {projectCanonicalMeaningLocale} from '../canonical-meaning-production/locale-projector.js';
import {buildAstRuntimeReadingIR} from '../runtime-reading/ast-reading-ir.js';
import {buildBzrRuntimeReadingIR} from '../runtime-reading/bzr-reading-ir.js';
import {buildNumRuntimeReadingIR} from '../runtime-reading/num-reading-ir.js';
import {buildZiWeiRuntimeReadingIR} from '../runtime-reading/zi-wei-reading-ir.js';
import {
  CMP_PRODUCTION_ADMISSION_REGISTRY,
  CMP_PRODUCTION_MAPPING_REGISTRY,
  CMP_PRODUCTION_ACTIVATION_REGISTRY,
  CMP_PRODUCTION_LOCALE_REGISTRY
} from '../canonical-meaning-production/production-registry-current-v3.js';
import {createMethodInterpretationInput,createMethodInterpretationCandidate,projectMethodGraph} from '../interpretation-runtime/cx-r12r3b-shared-runtime-v2.js';
import {projectCxR12R3bCustomerLanguage} from './cx-r12r3b-customer-language-v1.js';

const METHOD_ID=Object.freeze({ASTROLOGY_PROJECTION:'AST',NUMEROLOGY_PROJECTION:'NUM',BAZI_PROJECTION:'BZR',ZI_WEI_PROJECTION:'ZWR'});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

export async function buildMethodMeaningPayloadV2({canonicalProjection,locale='en'}={}){
  const publicMethodCode=canonicalProjection?.method?.publicMethodCode;
  if(!METHOD_ID[publicMethodCode])throw Object.assign(new Error('CX_R12R3B_METHOD_NOT_SUPPORTED'),{code:'CX_R12R3B_METHOD_NOT_SUPPORTED'});
  const ziWei=publicMethodCode==='ZI_WEI_PROJECTION'?await import('../canonical-meaning-production/zi-wei-meaning-runtime.js'):null;
  const meaningBundle=publicMethodCode==='ZI_WEI_PROJECTION'
    ?ziWei.buildZiWeiCanonicalMeaningBundle(canonicalProjection)
    :publicMethodCode==='ASTROLOGY_PROJECTION'
      ?await buildAstV2CanonicalMeaningProductionBundle({projection:canonicalProjection,admissionRegistry:CMP_PRODUCTION_ADMISSION_REGISTRY,mappingRegistry:CMP_PRODUCTION_MAPPING_REGISTRY,activationRegistry:CMP_PRODUCTION_ACTIVATION_REGISTRY})
      :await buildCanonicalMeaningProductionBundle({projection:canonicalProjection,admissionRegistry:CMP_PRODUCTION_ADMISSION_REGISTRY,mappingRegistry:CMP_PRODUCTION_MAPPING_REGISTRY,activationRegistry:CMP_PRODUCTION_ACTIVATION_REGISTRY,mode:'production'});
  const useLocale=locale==='zh-Hans'?'zh-Hans':'en';
  const localeProjection=publicMethodCode==='ZI_WEI_PROJECTION'
    ?ziWei.projectZiWeiMeaningLocale(meaningBundle,useLocale)
    :await projectCanonicalMeaningLocale({bundle:meaningBundle,localeRegistry:CMP_PRODUCTION_LOCALE_REGISTRY,locale:useLocale});
  const reading=publicMethodCode==='ASTROLOGY_PROJECTION'
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
