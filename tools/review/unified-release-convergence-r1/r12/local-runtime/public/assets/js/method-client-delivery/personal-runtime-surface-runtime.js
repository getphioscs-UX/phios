import { renderCanonicalMethodProjection } from './dynamic-renderer-runtime.js';
import { renderZiWeiCanonicalProjection } from './renderers/zi-wei-renderer.js';

export const MCD7_SURFACE_VERSION = 'MCD-7-PERSONAL-RUNTIME-SURFACE-v1.0.0';
export const MCD7_CANONICAL_INPUT_VERSION = 'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0';
export const MCD7_REQUEST_SCHEMA = 'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0';
export const MCD7_PRODUCTION_TABS = Object.freeze(['overview','astrology','bazi','numeric','reading']);

const REQUIRED_VERSION_KEYS = Object.freeze(['methodRegistryVersion','runtimeVersion','adapterVersion','inputContractVersion','projectionContractVersion']);

function clean(value){ return typeof value === 'string' ? value.trim() : ''; }
function nullable(value){ const v=clean(value); return v || null; }
function numberOrNull(value){ const v=clean(value); if(!v) return null; const n=Number(v); return Number.isFinite(n)?n:null; }
function uniq(items){ return [...new Set(items.filter(Boolean))]; }
function getPath(value,path){ return String(path).split('.').reduce((current,key)=>current==null?null:current[key],value); }
function present(value){ return !(value===null || value===undefined || value===''); }
function publicError(code='METHOD_EXECUTION_FAILED_CLOSED'){ return Object.freeze({ok:false,error:code,reasonCodes:Object.freeze([code])}); }

export function buildCanonicalBirthInput(fields,{locale='en',consentRecordId='',consentGranted=false}={}){
  const timePrecision=clean(fields.birthTimePrecision).toUpperCase() || 'UNKNOWN';
  const placeUnknown=clean(fields.birthPlacePrecision).toUpperCase()==='UNKNOWN';
  const timezoneUnknown=clean(fields.timezonePrecision).toUpperCase()==='UNKNOWN';
  const coordinatesUnknown=clean(fields.coordinatesPrecision).toUpperCase()==='UNKNOWN';
  const birthTime=timePrecision==='UNKNOWN'?null:(nullable(fields.birthTime)?`${clean(fields.birthTime)}:00`:null);
  const timezoneIana=timezoneUnknown?null:nullable(fields.birthTimezone);
  const utcOffsetAtBirth=timezoneUnknown?null:nullable(fields.utcOffsetAtBirth);
  return Object.freeze({
    birthDate: clean(fields.birthDatePrecision).toUpperCase()==='UNKNOWN' ? null : nullable(fields.birthDate),
    birthTime,
    birthPlace:Object.freeze({
      displayName:placeUnknown?null:nullable(fields.birthPlace),
      countryCode:placeUnknown?null:(nullable(fields.countryCode)?.toUpperCase()||null),
      latitude:coordinatesUnknown?null:numberOrNull(fields.latitude),
      longitude:coordinatesUnknown?null:numberOrNull(fields.longitude)
    }),
    timezone:Object.freeze({
      iana:timezoneIana,
      utcOffsetAtBirth,
      source:timezoneUnknown?'UNKNOWN':(timezoneIana||utcOffsetAtBirth?'HUMAN_DECLARATION':'UNKNOWN'),
      confidence:timezoneUnknown?'UNKNOWN':(timezoneIana&&utcOffsetAtBirth?'MEDIUM':'LOW')
    }),
    timeAccuracy:['EXACT','APPROXIMATE'].includes(timePrecision)?timePrecision:'UNKNOWN',
    locale:locale==='zh-Hans'?'zh-Hans':'en',
    consent:Object.freeze({recordId:clean(consentRecordId)||null,granted:consentGranted===true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'}),
    inputVersion:MCD7_CANONICAL_INPUT_VERSION
  });
}

export function validateCanonicalInputShape(input){
  const reasons=[];
  if(input?.inputVersion!==MCD7_CANONICAL_INPUT_VERSION) reasons.push('CANONICAL_INPUT_VERSION_INVALID');
  if(input?.birthDate!==null && !/^\d{4}-\d{2}-\d{2}$/.test(input?.birthDate||'')) reasons.push('BIRTH_DATE_INVALID');
  if(input?.birthTime!==null && !/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(input?.birthTime||'')) reasons.push('BIRTH_TIME_INVALID');
  if(input?.timeAccuracy==='UNKNOWN' && input?.birthTime!==null) reasons.push('UNKNOWN_TIME_MUST_REMAIN_NULL');
  if(!['EXACT','APPROXIMATE','UNKNOWN'].includes(input?.timeAccuracy)) reasons.push('TIME_ACCURACY_INVALID');
  const place=input?.birthPlace||{};
  if(place.countryCode!==null && !/^[A-Z]{2}$/.test(place.countryCode||'')) reasons.push('BIRTH_COUNTRY_CODE_INVALID');
  if(place.latitude!==null && !(Number.isFinite(place.latitude)&&place.latitude>=-90&&place.latitude<=90)) reasons.push('BIRTH_LATITUDE_INVALID');
  if(place.longitude!==null && !(Number.isFinite(place.longitude)&&place.longitude>=-180&&place.longitude<=180)) reasons.push('BIRTH_LONGITUDE_INVALID');
  const timezone=input?.timezone||{};
  if(timezone.iana!==null && !/^[A-Za-z_+\-]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(timezone.iana||'')) reasons.push('BIRTH_TIMEZONE_IANA_INVALID');
  if(timezone.utcOffsetAtBirth!==null && !/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(timezone.utcOffsetAtBirth||'')) reasons.push('BIRTH_UTC_OFFSET_INVALID');
  return Object.freeze({valid:reasons.length===0,reasonCodes:Object.freeze(uniq(reasons))});
}

export function evaluateSurfaceEligibility(entry,canonicalInput,{targetDate=null}={}){
  if(!entry || entry.productionTab!==true) return Object.freeze({state:'BLOCKED',missingFields:Object.freeze([]),reasonCodes:Object.freeze(['MCD7_METHOD_NOT_PRODUCTION_TAB'])});
  const missing=(entry.requiredInputPaths||[]).filter(path=>!present(getPath(canonicalInput,path)));
  const reasons=[];
  if(entry.publicMethodCode==='BAZI_PROJECTION' && !present(canonicalInput.birthTime)) reasons.push('BIRTH_TIME_UNKNOWN_DEGRADED_SCOPE');
  if(entry.publicMethodCode==='ASTROLOGY_PROJECTION' && canonicalInput.timeAccuracy==='APPROXIMATE') reasons.push('BIRTH_TIME_APPROXIMATE');
  if(entry.publicMethodCode==='ZI_WEI_PROJECTION' && canonicalInput.timeAccuracy!=='EXACT') missing.push('timeAccuracy.EXACT');
  if(entry.publicMethodCode==='NUMEROLOGY_PROJECTION' && targetDate && (!present(canonicalInput.timezone?.iana)||!present(canonicalInput.timezone?.utcOffsetAtBirth))) reasons.push('NUM_CYCLE_TIMEZONE_CONTEXT_REQUIRED');
  return Object.freeze({state:missing.length?'INPUT_INCOMPLETE':reasons.length?'REQUESTABLE_WITH_DECLARED_LIMITS':'REQUESTABLE',missingFields:Object.freeze(missing),reasonCodes:Object.freeze(reasons),mpaDecisionPending:true,dispatchAllowed:null});
}

export function createExecutionRequest(entry,{canonicalInput,consentRecordId,requestId,targetDate=null}={}){
  if(!entry?.methodCode || entry.productionTab!==true || !['ASTROLOGY_PROJECTION','BAZI_PROJECTION','NUMEROLOGY_PROJECTION','ZI_WEI_PROJECTION'].includes(entry.publicMethodCode)) throw Object.assign(new Error('MCD7_METHOD_REQUEST_FORBIDDEN'),{code:'MCD7_METHOD_REQUEST_FORBIDDEN'});
  if(!consentRecordId || canonicalInput?.consent?.granted!==true) throw Object.assign(new Error('MCD7_EXECUTION_CONSENT_REQUIRED'),{code:'MCD7_EXECUTION_CONSENT_REQUIRED'});
  return Object.freeze({
    schemaVersion:MCD7_REQUEST_SCHEMA,
    methodCode:entry.methodCode,
    methodVersion:entry.methodVersion,
    capability:'CALCULATION',
    purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',
    canonicalInput,
    executionParameters:Object.freeze(targetDate?{targetDate}:{ }),
    consentRecordId,
    requestId
  });
}

export async function executeCanonicalProjection(entry,options,{fetchImpl=globalThis.fetch}={}){
  if(typeof fetchImpl!=='function') throw Object.assign(new Error('MCD7_FETCH_UNAVAILABLE'),{code:'MCD7_FETCH_UNAVAILABLE'});
  const request=createExecutionRequest(entry,options);
  let response;
  try{
    response=await fetchImpl(entry.publicMethodCode==='ZI_WEI_PROJECTION'?'/api/zi-wei-execute':'/api/method-execute',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify(request)});
  }catch{return publicError('METHOD_EXECUTION_NETWORK_FAILURE');}
  let payload;
  try{payload=await response.json();}catch{return publicError('METHOD_EXECUTION_RESPONSE_INVALID');}
  if(!response.ok || payload?.ok!==true) return Object.freeze({ok:false,status:response.status,error:clean(payload?.error)||'METHOD_EXECUTION_FAILED_CLOSED',reasonCodes:Object.freeze(uniq(payload?.reasonCodes||[]))});
  const canonical=payload?.result;
  assertClientCanonicalProjection(canonical);
  return Object.freeze({ok:true,status:response.status,canonicalProjection:canonical});
}

export function assertClientCanonicalProjection(canonical){
  if(canonical?.schemaVersion!=='PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0') throw Object.assign(new Error('MCD7_CANONICAL_PROJECTION_REQUIRED'),{code:'MCD7_CANONICAL_PROJECTION_REQUIRED'});
  if(canonical?.interpretation?.included!==false) throw Object.assign(new Error('MCD7_INTERPRETATION_PROJECTION_FORBIDDEN'),{code:'MCD7_INTERPRETATION_PROJECTION_FORBIDDEN'});
  if(canonical?.execution?.mpaDecision?.authorityOwner!=='MPA') throw Object.assign(new Error('MCD7_MPA_DECISION_REQUIRED'),{code:'MCD7_MPA_DECISION_REQUIRED'});
  if(canonical?.execution?.mpaDecision?.dispatchAllowed!==true) throw Object.assign(new Error('MCD7_MPA_DISPATCH_REQUIRED'),{code:'MCD7_MPA_DISPATCH_REQUIRED'});
  if(canonical?.projection?.productionResult!==true || canonical?.projection?.clientRenderable!==true) throw Object.assign(new Error('MCD7_PRODUCTION_CANONICAL_PROJECTION_REQUIRED'),{code:'MCD7_PRODUCTION_CANONICAL_PROJECTION_REQUIRED'});
  for(const key of REQUIRED_VERSION_KEYS) if(!clean(canonical?.version?.[key])) throw Object.assign(new Error(`MCD7_VERSION_REQUIRED:${key}`),{code:'MCD7_VERSION_REQUIRED',field:key});
  return canonical;
}

export function renderSurfaceProjection(canonical,{locale='en'}={}){
  assertClientCanonicalProjection(canonical);
  if(canonical?.method?.publicMethodCode==='ZI_WEI_PROJECTION') return renderZiWeiCanonicalProjection(canonical,{locale:locale==='zh-Hans'?'zh-Hans':'en'});
  return renderCanonicalMethodProjection(canonical,{locale:locale==='zh-Hans'?'zh-Hans':'en',mode:'PRODUCTION'});
}

export function summarizeResults({requestedEntries=[],results=new Map(),canonicalInput=null,consentGranted=false}={}){
  const requested=requestedEntries.map(x=>x.tabCode);
  const executed=[]; const blocked=[]; let unknownCount=0; const versions=new Set(); const statuses=[];
  for(const entry of requestedEntries){
    const result=results.get(entry.tabCode);
    if(result?.ok===true){
      executed.push(entry.tabCode); unknownCount+=(result.canonicalProjection?.unknown||[]).length;
      const version=result.canonicalProjection?.version?.projectionContractVersion; if(version)versions.add(version);
      statuses.push({tabCode:entry.tabCode,status:result.canonicalProjection?.execution?.status||'UNKNOWN'});
    }else if(result){ blocked.push({tabCode:entry.tabCode,error:result.error||'BLOCKED',reasonCodes:result.reasonCodes||[]}); }
  }
  const shape=canonicalInput?validateCanonicalInputShape(canonicalInput):{valid:false,reasonCodes:['CANONICAL_INPUT_NOT_BUILT']};
  return Object.freeze({requested:Object.freeze(requested),executed:Object.freeze(executed),blocked:Object.freeze(blocked),inputComplete:shape.valid,unknownCount,consentGranted:consentGranted===true,projectionContractVersions:Object.freeze([...versions]),executionStatuses:Object.freeze(statuses)});
}
