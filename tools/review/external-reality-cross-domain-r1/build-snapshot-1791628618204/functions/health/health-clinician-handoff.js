import { composeHealthProfessionalHandoff } from './health-reality-runtime.js';
export function createClinicianHandoff({reality,consentState,recipient}={}){
  if(String(consentState||'').toUpperCase()!=='GRANTED')throw new Error('HRX_CLINICIAN_HANDOFF_CONSENT_REQUIRED');
  const packet=composeHealthProfessionalHandoff(reality);
  return {...packet,schemaVersion:'PHI-OS-HRX-CLINICIAN-HANDOFF-v1.0.0',recipient:recipient||null,consentState:'GRANTED',transmissionPerformed:false,governance:{...packet.governance,recipientVerificationRequiredBeforeTransmission:true,professionalJudgmentRemainsExternal:true,automaticTransmission:false}};
}
