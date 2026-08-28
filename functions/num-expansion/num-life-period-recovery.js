import {freezeDeep} from './num-expansion-rules.js';
export const NUM_LIFE_PERIOD_RECOVERY_SCHEMA='PHI-OS-NUM-R13-LIFE-PERIOD-RECOVERY-v1.0.0';
export const OBSERVED_LIFE_PERIOD_BANDS=Object.freeze([
  Object.freeze({bandCode:'LP_21_40',startAge:21,endAge:40}),
  Object.freeze({bandCode:'LP_41_60',startAge:41,endAge:60}),
  Object.freeze({bandCode:'LP_61_80',startAge:61,endAge:80})
]);
export function recoverLifePeriod({birthDate}={}){
  return freezeDeep({schemaVersion:NUM_LIFE_PERIOD_RECOVERY_SCHEMA,workCode:'NUM-R13',birthDate:birthDate||null,bands:OBSERVED_LIFE_PERIOD_BANDS,calculatedPatterns:[],formulaState:'UNRESOLVED_FROM_AVAILABLE_LEARNING_CORPUS',calculationAuthorityGranted:false,runtimeUseAllowed:false,reason:'The corpus gives repeated examples and age bands but not an unambiguous derivation formula for the three-digit period patterns.',state:'AUTHORITY_WITHHELD_FAIL_CLOSED'});
}
export default Object.freeze({recoverLifePeriod});
