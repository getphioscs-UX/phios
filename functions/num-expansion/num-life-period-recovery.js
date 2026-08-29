import {freezeDeep} from './num-expansion-rules.js';
import {buildNumEnergyHologram} from './num-energy-hologram-runtime.js';
export const NUM_LIFE_PERIOD_RECOVERY_SCHEMA='PHI-OS-NUM-R13-LIFE-PERIOD-RECOVERY-v2.0.0';
export const OBSERVED_LIFE_PERIOD_BANDS=Object.freeze([
  Object.freeze({bandCode:'LP_21_40',startAge:21,endAge:40,positionCode:'XWS'}),
  Object.freeze({bandCode:'LP_41_60',startAge:41,endAge:60,positionCode:'QPR'}),
  Object.freeze({bandCode:'LP_61_80',startAge:61,endAge:80,positionCode:'VUT'})
]);
export function recoverLifePeriod({birthDate}={}){
  const triangle=buildNumEnergyHologram({birthDate});
  const calculatedPatterns=OBSERVED_LIFE_PERIOD_BANDS.map(b=>Object.freeze({...b,pattern:triangle.canonicalCodes[b.positionCode]}));
  return freezeDeep({schemaVersion:NUM_LIFE_PERIOD_RECOVERY_SCHEMA,workCode:'NUM-R13',schoolAuthorityId:triangle.schoolAuthorityId,birthDate,bands:OBSERVED_LIFE_PERIOD_BANDS,calculatedPatterns,
    formulaState:'RECOVERED_AND_PUBLICLY_CORROBORATED',calculationAuthorityGranted:true,runtimeUseAllowed:true,customerPublishable:true,
    ageCoverage:{pre21:'NOT_DEFINED_BY_THIS_AUTHORITY',post80:'NOT_DEFINED_BY_LEARNING_CORPUS'},
    meaningBoundary:'STRUCTURAL_PERIOD_CODE_ONLY_NO_EVENT_PREDICTION',fortunePredictionCreated:false,state:'CALCULATION_AUTHORITY_ACTIVE'});
}
export default Object.freeze({recoverLifePeriod});
