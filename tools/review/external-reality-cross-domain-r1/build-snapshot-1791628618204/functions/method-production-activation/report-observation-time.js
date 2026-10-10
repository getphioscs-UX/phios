// Subordinate to the existing temporal/spatial owner. No method calculation.
function localParts(instant,timeZone){const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant);const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));return {localDate:`${v.year}-${v.month}-${v.day}`,localTime:`${v.hour}:${v.minute}:${v.second}`};}
function offsetAt(instant,zone){const p=localParts(instant,zone);return Math.round((Date.parse(`${p.localDate}T${p.localTime}Z`)-Math.floor(instant.getTime()/1000)*1000)/60000);}
const formatOffset=n=>`${n<0?'-':'+'}${String(Math.floor(Math.abs(n)/60)).padStart(2,'0')}:${String(Math.abs(n)%60).padStart(2,'0')}`;
function customInstant(request,zone){
 const date=request?.localDate,time=request?.localTime?.length===5?request.localTime+':00':request?.localTime;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!/^\d{2}:\d{2}:\d{2}$/.test(time||''))throw Error('CUSTOM_OBSERVATION_TIME_REQUIRED');
 const wall=Date.parse(`${date}T${time}Z`);if(!Number.isFinite(wall)||new Date(wall).toISOString().slice(0,19)!==`${date}T${time}`)throw Error('CUSTOM_OBSERVATION_TIME_INVALID');
 // Discover both offsets around DST transitions; reject nonexistent and
 // ambiguous civil times unless the customer supplied a matching offset.
 const offsets=new Set([-36,0,36].map(h=>offsetAt(new Date(wall+h*3600000),zone)));
 const candidates=[...offsets].map(n=>new Date(wall-n*60000)).filter(d=>{const p=localParts(d,zone);return p.localDate===date&&p.localTime===time;}).filter(d=>!request.utcOffset||formatOffset(offsetAt(d,zone))===request.utcOffset);
 if(candidates.length!==1)throw Error(candidates.length?'CUSTOM_OBSERVATION_TIME_AMBIGUOUS':'CUSTOM_OBSERVATION_TIME_NONEXISTENT');return candidates[0];
}
export function resolveReportObservationTime({mode='NOW',generatedAt,customerTimezone,requestedTarget}={}){
 if(!['NOW','CUSTOM'].includes(mode))throw Error('OBSERVATION_MODE_INVALID');
 if(!customerTimezone)throw Error('CUSTOMER_TIMEZONE_REQUIRED');
 const generated=new Date(generatedAt);if(!generatedAt||!Number.isFinite(generated.getTime()))throw Error('REPORT_GENERATED_AT_REQUIRED');
 // Invalid IANA identifiers fail here; never substitute the server timezone.
 localParts(generated,customerTimezone);
 const zone=mode==='CUSTOM'?(requestedTarget?.timezone||customerTimezone):customerTimezone;
 const instant=mode==='CUSTOM'?customInstant(requestedTarget,zone):generated;
 return Object.freeze({mode,...localParts(instant,zone),timezone:zone,utcOffset:formatOffset(offsetAt(instant,zone)),instant:instant.toISOString(),resolvedMethodLayers:[],generatedAt:generated.toISOString(),...(mode==='CUSTOM'?{requestedTarget:{...requestedTarget}}:{})});
}
export function toMethodTargetContext(snapshot){return {targetDate:snapshot.localDate,targetTime:snapshot.localTime,targetTimezone:{iana:snapshot.timezone,utcOffsetAtTarget:snapshot.utcOffset}};}
