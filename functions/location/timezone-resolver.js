const DEFAULT_ENDPOINT='https://timeapi.io/api/TimeZone/coordinate';
// Same existing public provider; consume only the IANA identifier, never its current offset.
const DEFAULT_ZONE_FALLBACK='https://timeapi.io/api/Time/current/coordinate';
const clean=v=>String(v??'').trim();
function validZone(zone){try{new Intl.DateTimeFormat('en',{timeZone:zone}).format(new Date());return true}catch{return false}}
function partsAt(epochMs,timeZone){const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epochMs));const get=t=>Number(parts.find(x=>x.type===t)?.value);return {year:get('year'),month:get('month'),day:get('day'),hour:get('hour'),minute:get('minute'),second:get('second')}}
function historicalOffsetMinutes({birthDate,birthTime,timeZone}){
  if(!birthDate||!validZone(timeZone))return null;
  const [y,m,d]=birthDate.split('-').map(Number);const timeParts=String(birthTime||'12:00:00').split(':').map(Number);const hh=timeParts[0],mm=timeParts[1],ss=Number.isFinite(timeParts[2])?timeParts[2]:0;if(![y,m,d,hh,mm,ss].every(Number.isFinite))return null;
  const desired=Date.UTC(y,m-1,d,hh,mm,ss||0);let guess=desired;
  for(let i=0;i<4;i++){const p=partsAt(guess,timeZone);const represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);const delta=desired-represented;if(Math.abs(delta)<1000)break;guess+=delta}
  const p=partsAt(guess,timeZone);const localAsUtc=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);return Math.round((localAsUtc-guess)/60000);
}
function offsetString(minutes){if(!Number.isFinite(minutes))return null;const sign=minutes>=0?'+':'-';const abs=Math.abs(minutes);return `${sign}${String(Math.floor(abs/60)).padStart(2,'0')}:${String(abs%60).padStart(2,'0')}`}
async function requestIanaZone(endpoint,latitude,longitude,timeoutMs){
  const url=new URL(endpoint);url.searchParams.set('latitude',String(latitude));url.searchParams.set('longitude',String(longitude));
  let response;
  try{response=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(timeoutMs)});}catch(cause){throw Object.assign(new Error('TIMEZONE_PROVIDER_UNAVAILABLE'),{code:'TIMEZONE_PROVIDER_UNAVAILABLE',timedOut:cause?.name==='TimeoutError'||cause?.name==='AbortError',cause});}
  if(!response.ok)throw Object.assign(new Error('TIMEZONE_PROVIDER_UNAVAILABLE'),{code:'TIMEZONE_PROVIDER_UNAVAILABLE',status:response.status});
  let payload;try{payload=await response.json();}catch(cause){if(cause?.name==='TimeoutError'||cause?.name==='AbortError')throw Object.assign(new Error('TIMEZONE_PROVIDER_UNAVAILABLE'),{code:'TIMEZONE_PROVIDER_UNAVAILABLE',timedOut:true,cause});throw Object.assign(new Error('TIMEZONE_NOT_RESOLVED'),{code:'TIMEZONE_NOT_RESOLVED'});}
  const timeZone=clean(payload?.timeZone||payload?.timezone||payload?.ianaTimeId);if(!timeZone||!validZone(timeZone))throw Object.assign(new Error('TIMEZONE_NOT_RESOLVED'),{code:'TIMEZONE_NOT_RESOLVED'});
  return timeZone;
}
export async function resolveTimezoneForCoordinates({latitude,longitude,birthDate=null,birthTime=null,env={}}={}){
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude < -90||latitude > 90||longitude < -180||longitude > 180)throw Object.assign(new Error('LOCATION_COORDINATES_REQUIRED'),{code:'LOCATION_COORDINATES_REQUIRED'});
  const endpoint=clean(env?.PHIOS_TIMEZONE_ENDPOINT)||DEFAULT_ENDPOINT;
  let timeZone;
  try{timeZone=await requestIanaZone(endpoint,latitude,longitude,5000);}catch(error){
    // Never override an explicit custom source, a 4xx refusal or an invalid zone.
    if(endpoint!==DEFAULT_ENDPOINT||!(error.timedOut===true||(error.status>=500&&error.status<=599)))throw error;
    timeZone=await requestIanaZone(DEFAULT_ZONE_FALLBACK,latitude,longitude,8000);
  }
  const offsetMinutes=historicalOffsetMinutes({birthDate,birthTime,timeZone});
  return Object.freeze({iana:timeZone,utcOffsetAtBirth:offsetString(offsetMinutes),historicalOffsetMinutes:offsetMinutes,source:'GOVERNED_RESOLUTION',confidence:'HIGH'});
}
export {historicalOffsetMinutes,offsetString};
