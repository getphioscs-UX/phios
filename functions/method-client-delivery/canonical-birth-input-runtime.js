const INPUT_VERSION='MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0';
const LOCALES=new Set(['en','zh-Hans']);
const ACCURACY=new Set(['EXACT','APPROXIMATE','UNKNOWN']);
const TZ_SOURCE=new Set(['PINNED_IANA_TZDB','GOVERNED_RESOLUTION','HUMAN_DECLARATION','UNKNOWN']);
const CONFIDENCE=new Set(['HIGH','MEDIUM','LOW','UNKNOWN']);
function isObject(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function validDate(v){if(typeof v!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v))return false;const d=new Date(`${v}T00:00:00.000Z`);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v}
function validTime(v){return typeof v==='string'&&/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(v)}
function nonempty(v){return typeof v==='string'&&v.trim().length>0}
function pathValue(input,path){return path.split('.').reduce((v,k)=>v==null?null:v[k],input)}
function present(v){return !(v===null||v===undefined||v==='')}
export function validateCanonicalBirthInput(input){
  const reasons=[];
  if(!isObject(input)) return Object.freeze({valid:false,reasonCodes:Object.freeze(['CANONICAL_INPUT_REQUIRED'])});
  const allowed=new Set(['birthDate','birthTime','birthPlace','timezone','timeAccuracy','locale','consent','inputVersion']);
  if(Object.keys(input).some(k=>!allowed.has(k))) reasons.push('CANONICAL_INPUT_ADDITIONAL_PROPERTY_FORBIDDEN');
  if(input.inputVersion!==INPUT_VERSION) reasons.push('CANONICAL_INPUT_VERSION_INVALID');
  if(input.birthDate!==null&&!validDate(input.birthDate)) reasons.push('BIRTH_DATE_INVALID');
  if(input.birthTime!==null&&!validTime(input.birthTime)) reasons.push('BIRTH_TIME_INVALID');
  if(!isObject(input.birthPlace)) reasons.push('BIRTH_PLACE_OBJECT_REQUIRED');
  else {
    const p=input.birthPlace;
    if(p.displayName!==null&&!nonempty(p.displayName)) reasons.push('BIRTH_PLACE_NAME_INVALID');
    if(p.countryCode!==null&&!(typeof p.countryCode==='string'&&/^[A-Z]{2}$/.test(p.countryCode))) reasons.push('BIRTH_COUNTRY_CODE_INVALID');
    if(p.latitude!==null&&!(Number.isFinite(p.latitude)&&p.latitude>=-90&&p.latitude<=90)) reasons.push('BIRTH_LATITUDE_INVALID');
    if(p.longitude!==null&&!(Number.isFinite(p.longitude)&&p.longitude>=-180&&p.longitude<=180)) reasons.push('BIRTH_LONGITUDE_INVALID');
  }
  if(!isObject(input.timezone)) reasons.push('BIRTH_TIMEZONE_OBJECT_REQUIRED');
  else {
    const t=input.timezone;
    if(t.iana!==null&&!(typeof t.iana==='string'&&/^[A-Za-z_+\-]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(t.iana))) reasons.push('BIRTH_TIMEZONE_IANA_INVALID');
    if(t.utcOffsetAtBirth!==null&&!(typeof t.utcOffsetAtBirth==='string'&&/^[+-](?:0[0-9]|1[0-4]):[0-5][0-9]$/.test(t.utcOffsetAtBirth))) reasons.push('BIRTH_UTC_OFFSET_INVALID');
    if(!TZ_SOURCE.has(t.source)) reasons.push('BIRTH_TIMEZONE_SOURCE_INVALID');
    if(!CONFIDENCE.has(t.confidence)) reasons.push('BIRTH_TIMEZONE_CONFIDENCE_INVALID');
  }
  if(!ACCURACY.has(input.timeAccuracy)) reasons.push('TIME_ACCURACY_INVALID');
  if(input.timeAccuracy==='UNKNOWN'&&input.birthTime!==null) reasons.push('UNKNOWN_TIME_MUST_REMAIN_NULL');
  if((input.timeAccuracy==='EXACT'||input.timeAccuracy==='APPROXIMATE')&&!validTime(input.birthTime)) reasons.push('KNOWN_TIME_REQUIRED');
  if(!LOCALES.has(input.locale)) reasons.push('LOCALE_INVALID');
  if(!isObject(input.consent)) reasons.push('CONSENT_OBJECT_REQUIRED');
  return Object.freeze({valid:reasons.length===0,reasonCodes:Object.freeze([...new Set(reasons)])});
}
const RULES=Object.freeze({
  ASTROLOGY:Object.freeze({pluginCode:'AST',required:Object.freeze(['birthDate','birthTime','birthPlace.displayName','timezone.iana','timezone.utcOffsetAtBirth'])}),
  BAZI:Object.freeze({pluginCode:'BZR',required:Object.freeze(['birthDate','birthPlace.displayName','timezone.iana'])}),
  NUMEROLOGY:Object.freeze({pluginCode:'NUM',required:Object.freeze(['birthDate'])}),
  HUMAN_DESIGN:Object.freeze({pluginCode:'HDR',required:Object.freeze(['birthDate','birthTime','birthPlace.displayName','birthPlace.latitude','birthPlace.longitude','timezone.iana','timezone.utcOffsetAtBirth'])}),
  EMBODIED_CONFIGURATION:Object.freeze({pluginCode:'ECR',required:Object.freeze(['birthDate','birthTime','birthPlace.displayName','timezone.iana','timezone.utcOffsetAtBirth'])})
});
export function evaluateMethodInputReadiness(methodCode,input,{targetDate=null}={}){
  const rule=RULES[methodCode]; if(!rule) return Object.freeze({state:'BLOCKED',missingFields:Object.freeze([]),reasonCodes:Object.freeze(['METHOD_INPUT_PROFILE_NOT_REGISTERED'])});
  const missing=rule.required.filter(path=>!present(pathValue(input,path)));
  const reasons=[];
  if(methodCode==='ASTROLOGY'){
    if(!present(input.birthDate)) reasons.push('AST_UNKNOWN_BIRTH_DATE');
    if(!present(input.birthTime)) reasons.push('AST_UNKNOWN_BIRTH_TIME');
    if(!present(input.birthPlace?.displayName)) reasons.push('AST_UNKNOWN_BIRTH_PLACE');
    if(!present(input.timezone?.iana)) reasons.push('AST_UNRESOLVED_HISTORICAL_TIMEZONE');
    if(!present(input.timezone?.utcOffsetAtBirth)) reasons.push('AST_UNRESOLVED_UTC_OFFSET_AT_BIRTH');
    if(input.timeAccuracy==='APPROXIMATE') reasons.push('AST_APPROXIMATE_TIME_PRECISION_WARNING');
  } else if(methodCode==='BAZI'){
    if(!present(input.birthDate)) reasons.push('BZR_UNKNOWN_BIRTH_DATE');
    if(!present(input.birthPlace?.displayName)) reasons.push('BZR_UNKNOWN_BIRTH_PLACE');
    if(!present(input.timezone?.iana)) reasons.push('BZR_UNRESOLVED_HISTORICAL_TIMEZONE');
    if(!present(input.birthTime)) reasons.push('BZR_UNKNOWN_TIME_DEGRADE_TO_THREE_PILLARS');
  } else if(methodCode==='NUMEROLOGY'){
    if(!present(input.birthDate)) reasons.push('NUM_UNKNOWN_BIRTH_DATE');
    if(targetDate&&(!present(input.timezone?.iana)||!present(input.timezone?.utcOffsetAtBirth))) reasons.push('NUM_CYCLE_TIMEZONE_CONTEXT_REQUIRED');
  }
  const blocking=missing.length>0 && !(methodCode==='BAZI'&&missing.length===0);
  return Object.freeze({state:blocking?'BLOCKED':reasons.some(x=>x.includes('DEGRADE')||x.includes('WARNING')||x.includes('CYCLE_TIMEZONE'))?'DEGRADED':'READY',missingFields:Object.freeze(missing),reasonCodes:Object.freeze(reasons)});
}
export function toTransientSharedBirthRecord(input,requestId){
  return Object.freeze({authority:'SHARED_DATA_AUTHORITY',status:'draft',methodOwner:null,pluginOwner:null,recordId:`SDA-MCD4-${requestId}-BIRTH`,recordType:'BIRTH_RECORD',recordVersion:INPUT_VERSION,payload:Object.freeze({birthDate:input.birthDate,source:'MCD3_CANONICAL_BIRTH_INPUT',declared:true})});
}
