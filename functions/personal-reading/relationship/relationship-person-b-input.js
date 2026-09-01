export const RELATIONSHIP_PERSON_B_INPUT_SCHEMA='PHI-OS-RELATIONSHIP-PERSON-B-INPUT-v1.0.0';
const PRECISION=new Set(['EXACT','APPROXIMATE','UNKNOWN']);
const TZ_SOURCE=new Set(['PINNED_IANA_TZDB','GOVERNED_RESOLUTION','HUMAN_DECLARATION','UNKNOWN']);
const TZ_CONFIDENCE=new Set(['HIGH','MEDIUM','LOW','UNKNOWN']);
const REL_TYPES=new Set(['PARTNER','SPOUSE','DATING','FORMER_PARTNER','PARENT_CHILD','SIBLING','FAMILY','FRIEND','BUSINESS_PARTNER','COLLABORATOR','COLLEAGUE','OTHER']);
function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function txt(v,code,{optional=false}={}){if((v==null||v==='')&&optional)return null;if(typeof v!=='string'||!v.trim())fail(code,400);return v.trim();}
function date(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(new Date(`${v}T00:00:00Z`).valueOf());}
function time(v){return typeof v==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(v);}
function num(v,min,max){return v===null||v===undefined||Number.isFinite(v)&&v>=min&&v<=max;}
function validIana(v){return typeof v==='string'&&/^[A-Za-z_+\-]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(v);}
function validOffset(v){return typeof v==='string'&&/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(v);}
function list(v){return Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()))]:[];}
export function normalizeRelationshipPersonBInput(input={}){
  const participantId=txt(input.participantId,'REL_W1_PARTICIPANT_ID_REQUIRED');
  const displayName=txt(input.displayName,'REL_W1_DISPLAY_NAME_INVALID',{optional:true});
  if(!REL_TYPES.has(input.relationshipType))fail('REL_W1_RELATIONSHIP_TYPE_INVALID',400);
  if(!date(input.birthDate))fail('REL_W1_BIRTH_DATE_REQUIRED',400);
  if(!PRECISION.has(input.birthTimePrecision))fail('REL_W1_TIME_PRECISION_INVALID',400);
  if(input.birthTimePrecision==='UNKNOWN'&&input.birthTime!=null)fail('REL_W1_UNKNOWN_TIME_MUST_REMAIN_NULL',400);
  if(input.birthTimePrecision!=='UNKNOWN'&&!time(input.birthTime))fail('REL_W1_KNOWN_TIME_REQUIRED',400);
  const place=txt(input.birthPlaceInput,'REL_W1_BIRTH_PLACE_INVALID',{optional:true});
  const location=input.confirmedBirthLocationSnapshot??null;
  if(location!==null){
    if(typeof location!=='object'||Array.isArray(location))fail('REL_W1_LOCATION_SNAPSHOT_INVALID',400);
    if(!num(location.latitude,-90,90)||!num(location.longitude,-180,180))fail('REL_W1_LOCATION_COORDINATES_INVALID',400);
  }
  const tz=input.timezoneResolution??null;
  if(tz!==null){
    if(typeof tz!=='object'||Array.isArray(tz)||!validIana(tz.iana)||!validOffset(tz.utcOffsetAtBirth)||!TZ_SOURCE.has(tz.source)||!TZ_CONFIDENCE.has(tz.confidence))fail('REL_W1_TIMEZONE_RESOLUTION_INVALID',400);
  }
  const methodExtensions=input.methodExtensions&&typeof input.methodExtensions==='object'&&!Array.isArray(input.methodExtensions)?input.methodExtensions:{};
  const profileExtensions=input.profileExtensions&&typeof input.profileExtensions==='object'&&!Array.isArray(input.profileExtensions)?input.profileExtensions:{};
  if(input.purpose!=='RELATIONSHIP_READING')fail('REL_W1_PURPOSE_NOT_ADMITTED',403);
  const consent=input.consent;if(!consent||typeof consent!=='object'||Array.isArray(consent)||consent.status!=='ACTIVE'||consent.relationshipReadingUseAllowed!==true||consent.sourceDataUseAllowed!==true||consent.thirdPartyDataDeclared!==true)fail('REL_W1_THIRD_PARTY_RELATIONSHIP_CONSENT_REQUIRED',403);
  const persistencePreference=input.persistencePreference??'SESSION_ONLY';if(!['SESSION_ONLY','EXPLICIT_SAVE'].includes(persistencePreference))fail('REL_W1_PERSISTENCE_PREFERENCE_INVALID',400);
  return freeze({
    schemaVersion:RELATIONSHIP_PERSON_B_INPUT_SCHEMA,participantId,displayName,relationshipType:input.relationshipType,birthDate:input.birthDate,
    birthTime:input.birthTimePrecision==='UNKNOWN'?null:input.birthTime,birthTimePrecision:input.birthTimePrecision,birthPlaceInput:place,
    confirmedBirthLocationSnapshot:location?freeze({displayName:txt(location.displayName,'REL_W1_LOCATION_DISPLAY_NAME_INVALID',{optional:true}),countryCode:txt(location.countryCode,'REL_W1_LOCATION_COUNTRY_INVALID',{optional:true}),latitude:location.latitude??null,longitude:location.longitude??null}):null,
    timezoneResolution:tz?freeze({iana:tz.iana,utcOffsetAtBirth:tz.utcOffsetAtBirth,source:txt(tz.source,'REL_W1_TIMEZONE_SOURCE_REQUIRED'),confidence:txt(tz.confidence,'REL_W1_TIMEZONE_CONFIDENCE_REQUIRED')}):null,
    methodExtensions:freeze({NUM:methodExtensions.NUM?.birthName?freeze({birthName:txt(methodExtensions.NUM.birthName,'REL_W1_NUM_BIRTH_NAME_INVALID')}):freeze({}),HD:methodExtensions.HD?.confirmedExternalChartRef?freeze({confirmedExternalChartRef:txt(methodExtensions.HD.confirmedExternalChartRef,'REL_W1_HD_CHART_REF_INVALID')}):freeze({})}),
    profileExtensions:freeze({externalProfileRefs:list(profileExtensions.externalProfileRefs),selfAssessmentRef:txt(profileExtensions.selfAssessmentRef,'REL_W1_SELF_ASSESSMENT_REF_INVALID',{optional:true}),reasoningTaskRef:txt(profileExtensions.reasoningTaskRef,'REL_W1_REASONING_TASK_REF_INVALID',{optional:true})}),
    purpose:'RELATIONSHIP_READING',consent:freeze({consentRecordId:txt(consent.consentRecordId,'REL_W1_CONSENT_RECORD_REQUIRED'),status:'ACTIVE',relationshipReadingUseAllowed:true,sourceDataUseAllowed:true,thirdPartyDataDeclared:true}),persistencePreference,
    governance:freeze({personBAccountCreated:false,hiddenPersistenceAllowed:false,silentReuseAllowed:false,minimalCollectionRequired:true,utcOffsetCustomerManualEntryRequired:false,birthDateSharedAcrossMethods:true})
  });
}
export function toCanonicalBirthInputFromPersonB(personB,{locale='en'}={}){
  if(personB?.schemaVersion!==RELATIONSHIP_PERSON_B_INPUT_SCHEMA)fail('REL_W1_NORMALIZED_PERSON_B_REQUIRED',400);
  const location=personB.confirmedBirthLocationSnapshot;
  const tz=personB.timezoneResolution;
  return freeze({birthDate:personB.birthDate,birthTime:personB.birthTime,birthPlace:freeze({displayName:location?.displayName??personB.birthPlaceInput??null,countryCode:location?.countryCode??null,latitude:location?.latitude??null,longitude:location?.longitude??null}),timezone:freeze({iana:tz?.iana??null,utcOffsetAtBirth:tz?.utcOffsetAtBirth??null,source:tz?.source??'UNKNOWN',confidence:tz?.confidence??'UNKNOWN'}),timeAccuracy:personB.birthTimePrecision,locale:locale==='zh-Hans'?'zh-Hans':'en',consent:personB.consent,inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'});
}
