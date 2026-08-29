export const ZIWEI_CX_R1_TARGET_CONTEXT_SCHEMA='PHI-OS-ZIWEI-CX-R1-LIVE-TARGET-CONTEXT-v1.0.0';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e;}
const clean=v=>String(v??'').trim();
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(`${value}T00:00:00.000Z`);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===value;}
function normalizeTime(value){const v=clean(value);if(/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v))return `${v}:00`;if(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(v))return v;return null;}
function validOffset(value){return /^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(value||'');}
function validIana(value){try{new Intl.DateTimeFormat('en',{timeZone:value}).format(new Date());return true}catch{return false;}}

/**
 * Resolves the explicit live target context supplied by the customer surface.
 * There is intentionally no fallback to the birth timezone or birth date/time.
 */
export function resolveZiweiLiveTargetContext(input={}){
  const targetDate=clean(input.targetDate);
  const targetTime=normalizeTime(input.targetTime);
  const iana=clean(input.targetTimezone?.iana||input.timezoneIana);
  const utcOffsetAtTarget=clean(input.targetTimezone?.utcOffsetAtTarget||input.utcOffsetAtTarget);
  const source=clean(input.source||'').toUpperCase();
  if(!validDate(targetDate))fail('ZIWEI_CX_R1_TARGET_DATE_REQUIRED');
  if(!targetTime)fail('ZIWEI_CX_R1_TARGET_TIME_REQUIRED');
  if(!iana||!validIana(iana))fail('ZIWEI_CX_R1_TARGET_TIMEZONE_IANA_REQUIRED');
  if(!validOffset(utcOffsetAtTarget))fail('ZIWEI_CX_R1_TARGET_UTC_OFFSET_REQUIRED');
  if(!['DEVICE_DEFAULT','CUSTOMER_EDITED','EXPLICIT_REQUEST'].includes(source))fail('ZIWEI_CX_R1_TARGET_CONTEXT_SOURCE_REQUIRED');
  const normalized=freeze({
    schemaVersion:ZIWEI_CX_R1_TARGET_CONTEXT_SCHEMA,
    targetDate,
    targetTime,
    targetTimezone:freeze({iana,utcOffsetAtTarget}),
    source,
    presentation:freeze({visibleToCustomer:true,customerEditable:true,defaultMayUseDeviceTimezone:true}),
    governance:freeze({birthTimezoneFallbackUsed:false,birthDateFallbackUsed:false,birthTimeFallbackUsed:false,serverTimezoneGuessUsed:false})
  });
  return normalized;
}

export function projectZiweiTargetContextForDynamic(targetContext){
  if(targetContext?.schemaVersion!==ZIWEI_CX_R1_TARGET_CONTEXT_SCHEMA)fail('ZIWEI_CX_R1_TARGET_CONTEXT_REQUIRED');
  return freeze({
    targetDate:targetContext.targetDate,
    targetTime:targetContext.targetTime,
    targetTimezone:freeze({iana:targetContext.targetTimezone.iana,utcOffsetAtTarget:targetContext.targetTimezone.utcOffsetAtTarget})
  });
}

export default Object.freeze({resolveZiweiLiveTargetContext,projectZiweiTargetContextForDynamic});
