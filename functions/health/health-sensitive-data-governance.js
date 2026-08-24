const SENSITIVE=new Set(['SYMPTOM','DIAGNOSIS','MEDICATION','LAB_RESULT','IMAGING','CLINIC_NOTE','HEALTH_IDENTIFIER','HEALTH_DOCUMENT']);
export function evaluateHealthDataGovernance(input={}){
  const classes=Array.isArray(input.dataClasses)?input.dataClasses.map(x=>String(x).toUpperCase()):[]; const hasSensitive=classes.some(x=>SENSITIVE.has(x));
  const consent=String(input.consentState||'').toUpperCase()==='GRANTED'; const purpose=String(input.purpose||'').toUpperCase();
  const allowedPurposes=new Set(['USER_REQUESTED_HEALTH_REALITY','USER_REQUESTED_CONTINUITY','USER_REQUESTED_CLINICIAN_HANDOFF']);
  return {schemaVersion:'PHI-OS-HRX-SENSITIVE-DATA-GOVERNANCE-v1.0.0',sensitive:hasSensitive,persistAllowed:hasSensitive?consent&&allowedPurposes.has(purpose):consent,shareAllowed:hasSensitive?consent&&purpose==='USER_REQUESTED_CLINICIAN_HANDOFF':false,analyticsAllowed:false,modelTrainingAllowed:false,advertisingAllowed:false,minimumNecessary:true,governance:{silentPersistence:false,silentSharing:false,thirdPartyAccess:false}};
}
