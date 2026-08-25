import {buildAstV2CanonicalMeaningProductionBundle} from '../canonical-meaning-production/meaning-bundle-builder-ast-v2.js';
import {projectCanonicalMeaningLocale} from '../canonical-meaning-production/locale-projector.js';
import {buildAstRuntimeReadingIR} from '../runtime-reading/ast-reading-ir.js';
import {
  CMP_PRODUCTION_ADMISSION_REGISTRY,
  CMP_PRODUCTION_MAPPING_REGISTRY,
  CMP_PRODUCTION_ACTIVATION_REGISTRY,
  CMP_PRODUCTION_LOCALE_REGISTRY
} from '../canonical-meaning-production/production-registry-current-v3.js';

export async function buildAstrologyCustomerReading({canonicalProjection,locale='en'}={}){
  const meaningBundle=await buildAstV2CanonicalMeaningProductionBundle({
    projection:canonicalProjection,
    admissionRegistry:CMP_PRODUCTION_ADMISSION_REGISTRY,
    mappingRegistry:CMP_PRODUCTION_MAPPING_REGISTRY,
    activationRegistry:CMP_PRODUCTION_ACTIVATION_REGISTRY
  });
  const localeProjection=await projectCanonicalMeaningLocale({
    bundle:meaningBundle,
    localeRegistry:CMP_PRODUCTION_LOCALE_REGISTRY,
    locale:locale==='zh-Hans'?'zh-Hans':'en'
  });
  const reading=buildAstRuntimeReadingIR({projection:canonicalProjection,bundle:meaningBundle,localeProjection});
  return Object.freeze({
    executionCompleteness:reading.executionCompleteness,
    meaningBundle,
    localeProjection,
    reading
  });
}
