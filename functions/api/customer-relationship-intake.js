import {requireSameOrigin} from '../account/oidc-auth.js';
import {normalizeRelationshipCurrentRealityInput,buildRelationshipCurrentRealityIR,RELATIONSHIP_CURRENT_REALITY_PURPOSE} from '../personal-reading/relationship/relationship-current-reality.js';
import {normalizeRelationshipIntent,RELATIONSHIP_INTENT_VALUES} from '../personal-reading/relationship/relationship-intent.js';
import {normalizeRelationshipPersonBInput} from '../personal-reading/relationship/relationship-person-b-input.js';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function onRequestGet(){return reply({ok:true,values:RELATIONSHIP_INTENT_VALUES,automaticPersistence:false});}
export async function onRequestPost({request}){
 try{
  requireSameOrigin(request);const raw=await request.text();if(new TextEncoder().encode(raw).length>12000)return reply({ok:false,code:'REL_INPUT_TOO_LARGE'},413);
  const body=JSON.parse(raw),id=crypto.randomUUID();
  const customerQuestion=typeof body.customerQuestion==='string'&&!body.customerQuestion.trim()?null:body.customerQuestion;
  const intent=normalizeRelationshipIntent({relationshipIntentId:'REL-'+id,mode:body.mode,relationshipType:body.relationshipType,focusAreas:body.focusAreas,customerQuestion,participantARef:'SESSION-A-'+id,locale:body.locale,purpose:'RELATIONSHIP_READING',consent:{relationshipReadingUseAllowed:body.consent===true,consentRecordId:'SESSION-CONSENT-'+id}});
  let selfObservation=null;
  if(intent.mode==='SELF_RELATIONSHIP_PATTERN'&&typeof body.selfObservation==='string'&&body.selfObservation.trim()){
   const input=normalizeRelationshipCurrentRealityInput({optIn:body.observationConsent===true,sensitiveConsent:body.observationConsent===true,sensitiveConsentRef:intent.consent.consentRecordId,purposeCode:RELATIONSHIP_CURRENT_REALITY_PURPOSE,observations:[{scope:'ME',domain:body.focusAreas?.[0]||'OPEN_QUESTION',statement:body.selfObservation,source:'CUSTOMER',confidence:'UNSURE',observableVsInterpretive:'OBSERVABLE',sensitive:true}]},intent);
   const ir=await buildRelationshipCurrentRealityIR(input);
   selfObservation={schemaVersion:'PHIOS-SELF-RELATIONSHIP-OBSERVATION-VIEW-R1',source:ir,observations:ir.observations,unknowns:['OTHER_PARTICIPANT_VIEW_NOT_SUPPLIED','REPEATING_PATTERN_NOT_ESTABLISHED_FROM_ONE_EVENT'],sourceDigest:ir.semanticDigest,automaticPersistence:false,providerCalls:0,methodReadingEstablished:false};
  }
  let personB=null;
  if(intent.participantBRequired){
   if(!['SELF_DECLARED_BY_B','CUSTOMER_DECLARED_WITH_PERMISSION','DOCUMENTED_WITH_PERMISSION'].includes(body.personBSource))return reply({ok:false,code:'REL_PERSON_B_SOURCE_REQUIRED'},403);
   personB=normalizeRelationshipPersonBInput({participantId:'SESSION-B-'+id,displayName:body.personB?.displayName,relationshipType:body.relationshipType,birthDate:body.personB?.birthDate,birthTimePrecision:'UNKNOWN',birthTime:null,birthPlaceInput:null,confirmedBirthLocationSnapshot:null,timezoneResolution:null,purpose:'RELATIONSHIP_READING',persistencePreference:'SESSION_ONLY',consent:{consentRecordId:'SESSION-B-SOURCE-CONSENT-'+id,status:'ACTIVE',relationshipReadingUseAllowed:body.personBUseConsent===true,sourceDataUseAllowed:body.personBUseConsent===true,thirdPartyDataDeclared:body.personBUseConsent===true}});
  }
  return reply({ok:true,state:selfObservation?'SELF_OBSERVATION_READY_METHOD_READING_PENDING':'INPUT_VALIDATED_READING_SOURCES_PENDING',selfObservation,intent,personB,personBSource:personB?body.personBSource:null,firstStop:'OWNED_ACCEPTED_PARTICIPANT_METHOD_READINGS_NOT_WIRED',freeRelationshipResult:null,paidReport:null,governance:{automaticPersistence:false,personBAccountCreated:false,unknownBirthTimePreserved:true,otherParticipantConsentInferred:false,relationshipClaimsGenerated:false,compatibilityScoreCreated:false,partnerHiddenFactsCreated:false}});
 }catch(error){return reply({ok:false,code:error.code||'REL_INTAKE_INVALID'},error.status||422);}
}
