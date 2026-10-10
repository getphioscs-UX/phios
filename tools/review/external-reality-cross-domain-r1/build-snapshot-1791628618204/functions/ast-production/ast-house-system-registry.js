/**
 * Versioned Astrology house-system policy successor.
 * Whole Sign remains supported for compatibility. Placidus is the CX default.
 * Calculation only; no interpretation is created here.
 */
export const ASTA_HOUSE_SYSTEM_REGISTRY_VERSION='2.0.0';
export const ASTA_HOUSE_SYSTEM_WHOLE_SIGN='WHOLE_SIGN_V1';
export const ASTA_HOUSE_SYSTEM_PLACIDUS='PLACIDUS_V1';
export const ASTA_DEFAULT_HOUSE_SYSTEM_CODE=ASTA_HOUSE_SYSTEM_PLACIDUS;
export const ASTA_HOUSE_SYSTEMS=Object.freeze({
  [ASTA_HOUSE_SYSTEM_PLACIDUS]:Object.freeze({
    code:ASTA_HOUSE_SYSTEM_PLACIDUS,
    label:Object.freeze({en:'Placidus',zh:'普拉西德宫制'}),
    family:'TIME_BASED_QUADRANT',
    requiresExactBirthTime:true,
    requiresCoordinates:true,
    polarPolicy:'UNAVAILABLE_WHEN_PLACIDUS_UNDEFINED',
    customerDefault:true
  }),
  [ASTA_HOUSE_SYSTEM_WHOLE_SIGN]:Object.freeze({
    code:ASTA_HOUSE_SYSTEM_WHOLE_SIGN,
    label:Object.freeze({en:'Whole Sign',zh:'整宫制'}),
    family:'SIGN_BASED',
    requiresExactBirthTime:true,
    requiresCoordinates:true,
    polarPolicy:'AVAILABLE_WHEN_ASCENDANT_CALCULABLE',
    customerDefault:false
  })
});
export function getAstHouseSystemPolicy(code=ASTA_DEFAULT_HOUSE_SYSTEM_CODE){
  const policy=ASTA_HOUSE_SYSTEMS[String(code||'').trim().toUpperCase()];
  if(!policy)throw Object.assign(new Error('ASTA_HOUSE_SYSTEM_UNSUPPORTED'),{code:'ASTA_HOUSE_SYSTEM_UNSUPPORTED'});
  return policy;
}
