import {PROFILE_OBSERVATION_PROMPTS} from '../../assets/customer-ui/js/personal-products/profile-observation-prompts-r1.js';
const fail=(code,status=400)=>{throw Object.assign(Error(code),{code,status});};
export function normalizeProfileObservation(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['lens','responseState','answer','observedAt','processingConsent','sensitiveConsent','currentQuestion'].includes(k)))fail('OBSERVATION_FIELDS_INVALID');
 const prompt=Object.hasOwn(PROFILE_OBSERVATION_PROMPTS,input.lens)?PROFILE_OBSERVATION_PROMPTS[input.lens]:null;if(!prompt)fail('OBSERVATION_LENS_INVALID');
 if(!['ANSWERED','UNSURE','SKIPPED','NOT_APPLICABLE'].includes(input.responseState))fail('OBSERVATION_STATE_INVALID');
 if(input.processingConsent!==true)fail('OBSERVATION_PROCESSING_CONSENT_REQUIRED',403);
 if(prompt.sensitive&&input.sensitiveConsent!==true)fail('OBSERVATION_SENSITIVE_CONSENT_REQUIRED',403);
 const answer=typeof input.answer==='string'?input.answer.trim():'';if(answer.length>1500)fail('OBSERVATION_TOO_LONG',413);
 if(input.responseState==='ANSWERED'&&!answer)fail('OBSERVATION_ANSWER_REQUIRED');
 if(input.responseState!=='ANSWERED'&&answer)fail('OBSERVATION_STATE_TEXT_CONFLICT');
 const currentQuestion=typeof input.currentQuestion==='string'?input.currentQuestion.trim():'';if(input.responseState==='ANSWERED'&&(!currentQuestion||currentQuestion.length>800))fail('OBSERVATION_CURRENT_QUESTION_REQUIRED');
 const date=typeof input.observedAt==='string'?input.observedAt:null;
 if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))fail('OBSERVATION_DATE_INVALID');
 return {schemaVersion:'PHIOS-PROFILE-OBSERVATION-R1',questionRef:'MASTER-R1-5.4:'+input.lens,lens:input.lens,currentQuestion,responseState:input.responseState,answer,observedAt:date,sourceClass:'USER_REPORTED_OBSERVATION',sensitive:prompt.sensitive===true,kind:prompt.kind,scoringAuthority:null,realityFact:false,automaticPersistence:false};
}
