// Local source-reference adapter, not evidence that a person has experienced an impact.
import {createExternalRealityEvent,routeExternalRealityImpact} from '../external-reality-impact/external-reality-impact-runtime.js';
export function observationReferenceIdentity(o){
 return Object.fromEntries(['observationId','admittedEvidenceId','sourceId','sourceVersion','metricId','division','value','unit','geographyId','geographyName','geographicLevel','observationPeriod','frequency','definition','statisticalMethod','denominator','population','coverage','baseYear','sourceUrl','metadataUrl','sourceSnapshotReference','transformationVersion','admissionStatus','verificationStatus','productionEligible'].map(k=>[k,o[k]]));
}
export function validateObservationReference(source,observation,{now=new Date().toISOString()}={}){
 if(!source?.validUntil||!Number.isFinite(Date.parse(source.validUntil))||Date.parse(source.validUntil)<=Date.parse(now))return {state:'SOURCE_RECHECK_REQUIRED'};
 if(!observation)return {state:'SOURCE_NO_LONGER_AVAILABLE'};
 if(source.sourceRef!==observation.sourceId||source.sourceVersion!==observation.sourceVersion||source.supportLocation!==observation.sourceSnapshotReference||source.geography!==observation.geographyId||source.period!==observation.observationPeriod)return {state:'SOURCE_IDENTITY_CHANGED'};
 // Older local references do not pretend to have the newly required full measurement binding.
 if(!source.measurement)return {state:'SOURCE_BINDING_REVIEW_REQUIRED'};
 if(JSON.stringify(source.measurement)!==JSON.stringify(observationReferenceIdentity(observation)))return {state:'SOURCE_DEFINITION_OR_CONTENT_CHANGED'};
 return {state:'VALID'};
}
export function projectObservationImpact(observation,{caseId,userId,caseVersion,confirmApplicability=false,reason='',locale='en',now=new Date().toISOString()}={}){
 if(confirmApplicability!==true||!reason.trim())return {state:'APPLICABILITY_CONFIRMATION_REQUIRED',persisted:false,createsPersonalFacts:false};
 if(observation?.admissionStatus!=='LOCAL_CWA_ADMITTED'||observation.productionEligible!==false||!caseId||!userId)return {state:'SOURCE_OR_CASE_REQUIRED',persisted:false};
 const evidence=observation.evidence,jurisdiction=evidence.jurisdiction;
 const event=createExternalRealityEvent({eventId:observation.observationId,evidence,domain:'GENERAL_CURRENT',eventState:'UNKNOWN',authorityCoverage:{domain:'GENERAL_CURRENT',jurisdiction,state:'VERIFIED_STATIC_AUTHORITY_MAP',allowedSourceIds:[observation.sourceId],allowedSourceUrls:[observation.sourceUrl]},now});
 const impact=routeExternalRealityImpact({event,processingConsent:true,jurisdictionContext:{selectedExternalContext:[{jurisdictionCode:jurisdiction,jurisdictionType:observation.geographicLevel==='COUNTRY'?'COUNTRY':'SUBDIVISION',confirmationState:'USER_CONFIRMED',source:'EXPLICIT_SELECTED_WORLD_OBSERVATION',asOf:now,purpose:'SELECTED_CONTEXT'}]},caseContext:{ownerId:userId,currentRealityRef:caseId,sourceVersion:String(caseVersion),selectedEventRef:observation.observationId,relevanceEvidence:[]},now});
 if(impact.state!=='IMPACT_CANDIDATES_AVAILABLE')return impact;
 const zh=locale==='zh-Hans';const source={sourceRef:observation.sourceId,sourceVersion:observation.sourceVersion,observationId:observation.observationId,seriesKey:[observation.geographyId,observation.metricId,observation.division].join(':'),statement:zh?`世界参考：${observation.geographyName} ${observation.observationPeriod} ${observation.metricId} = ${observation.value} ${observation.unit}。与问题的相关性由用户确认，实际个人影响尚待核对。`:`World reference: ${observation.geographyName}, ${observation.observationPeriod}, ${observation.metricId} = ${observation.value} ${observation.unit}. Relevance is user-confirmed; actual personal impact is not established.`,validUntil:new Date(Date.parse(observation.retrievedAt)+86400000).toISOString(),href:observation.sourceUrl,supportLocation:observation.sourceSnapshotReference,geography:observation.geographyId,period:observation.observationPeriod,applicabilityReason:reason.trim().slice(0,500),applicabilityState:'USER_CONFIRMED_RELEVANCE_NOT_INDEPENDENT_IMPACT',role:'IMPACT_CANDIDATE',personalFact:false,causality:false,unknowns:impact.items[0].unknowns,permissionPurpose:'WORLD_R4_LOCAL_IMPACT_REFERENCE_ONLY',permissionSource:'USER_WORLD_R4_EXECUTION_2026_10_23',productionEligible:false};
 source.measurement=observationReferenceIdentity(observation);
 source.limits=['REPRESENTATIVE_BASKET_NOT_PERSONAL_BILLS','NO_PERSONAL_LOSS_OR_CAUSALITY_ESTABLISHED','LOCAL_VALIDATION_NOT_PRODUCTION_ADMISSION'];
 source.worldHref='/world/?r4Observation='+encodeURIComponent(observation.observationId)+'&locale='+locale+'&r4CaseId='+encodeURIComponent(caseId);
 return {...impact,resolvedEvidence:source,localPersistenceScope:'SYNTHETIC_QA_ONLY_EXPLICIT_SAVE',priorRicSessionPermissionUnchanged:true};
}
