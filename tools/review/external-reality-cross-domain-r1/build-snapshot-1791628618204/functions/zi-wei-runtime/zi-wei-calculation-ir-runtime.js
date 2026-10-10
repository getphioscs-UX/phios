import { loadZiWeiPolicy, assertZiWeiPolicyConsumable } from './policy-gate.js';
import { buildZiWeiCalendarRepresentationV2 } from './zi-wei-calendar-conversion-runtime-v2.js';
import { buildZiWeiPalaceStructureV2 } from './zi-wei-palace-construction-runtime-v2.js';
import { placeZiWeiMainStars } from './zi-wei-main-star-runtime.js';
import { placeZiWeiSupportStars } from './zi-wei-support-star-runtime.js';
import { placeZiWeiFourTransformations } from './zi-wei-four-transformations-runtime.js';
import { sha256Stable } from './zwr-utils.js';
import { assertZiWeiInternalCalculationActivated } from './runtime-activation-gate.js';
export function buildZiWeiCalculationIR(canonicalInput, options={}){
  assertZiWeiInternalCalculationActivated(options);
  const policy=options.policy||loadZiWeiPolicy(); assertZiWeiPolicyConsumable(policy);
  const calendar=buildZiWeiCalendarRepresentationV2(canonicalInput,{policy});
  const palaces=buildZiWeiPalaceStructureV2(calendar,{policy});
  const main=placeZiWeiMainStars(calendar,palaces); const support=placeZiWeiSupportStars(calendar);
  const allStars=[...main.stars,...support.stars];
  const transformations=placeZiWeiFourTransformations(calendar,allStars,{policy});
  const core={schemaVersion:'PHI-OS-ZWR-CALCULATION-IR-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',runtimeCode:'ZI_WEI_RUNTIME',scopeCode:'ZI_WEI_NATAL_STRUCTURAL_RUNTIME_V1',calendar,palaceStructure:palaces,mainStars:main,supportStars:support,transformations,policy:{authorityCode:policy.authorityCode,authorityVersion:policy.authorityVersion,status:policy.status},boundaries:{dynamicPeriodsIncluded:false,meaningIncluded:false,readingIncluded:false,professionalJudgmentIncluded:false,fortunePredictionIncluded:false}};
  return {...core,calculationDigest:sha256Stable(core)};
}
