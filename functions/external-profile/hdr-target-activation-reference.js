import {createHdrInternalAstronomyAdapter} from '../professional/hdr-internal/hdr-internal-astronomy-adapter.js';
import {ACTIVATION_BODIES} from '../method-runtime/personal-structure/activation-builder.js';
import {resolveGateLine} from '../method-runtime/personal-structure/gate-line.js';

export const HDR_TARGET_ACTIVATION_REFERENCE_VERSION='PHI-OS-HDR-TARGET-ACTIVATION-REFERENCE-v1.0.0';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const clean=value=>String(value??'').trim();
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
const validTime=value=>/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
const validOffset=value=>/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(value);

function targetUtcIso(targetContext){
  const targetDate=clean(targetContext?.targetDate),rawTime=clean(targetContext?.targetTime),offset=clean(targetContext?.targetTimezone?.utcOffsetAtTarget);
  if(!validDate(targetDate))throw Object.assign(new Error('HDR_TARGET_DATE_INVALID'),{code:'HDR_TARGET_DATE_INVALID'});
  if(!validTime(rawTime))throw Object.assign(new Error('HDR_TARGET_TIME_INVALID'),{code:'HDR_TARGET_TIME_INVALID'});
  if(!validOffset(offset))throw Object.assign(new Error('HDR_TARGET_OFFSET_INVALID'),{code:'HDR_TARGET_OFFSET_INVALID'});
  const targetTime=rawTime.length===5?`${rawTime}:00`:rawTime;
  const instant=new Date(`${targetDate}T${targetTime}${offset}`);
  if(Number.isNaN(instant.valueOf()))throw Object.assign(new Error('HDR_TARGET_INSTANT_INVALID'),{code:'HDR_TARGET_INSTANT_INVALID'});
  return instant.toISOString();
}
function confirmedGateNumbers(profile){
  const activations=(profile?.records||[]).find(record=>record?.field==='activations')?.value||[];
  return [...new Set(activations.map(item=>Number(String(item?.gateLine||'').split('.')[0])).filter(gate=>Number.isInteger(gate)&&gate>=1&&gate<=64))].sort((a,b)=>a-b);
}

export async function buildHdrTargetActivationReference({targetContext,confirmedProfile,astronomyAdapter}={}){
  if(!targetContext)return null;
  const utcIso=targetUtcIso(targetContext),adapter=astronomyAdapter||createHdrInternalAstronomyAdapter();
  const astronomy=await adapter.calculateLongitudesAt(utcIso),activations=[];
  for(const bodyCode of ACTIVATION_BODIES){
    const longitude=astronomy?.longitudes?.[bodyCode];if(!Number.isFinite(longitude))continue;
    const resolved=resolveGateLine(longitude);
    activations.push(freeze({bodyCode,gate:resolved.gate,line:resolved.line,gateLine:`${resolved.gate}.${resolved.line}`,eclipticLongitude:resolved.eclipticLongitude}));
  }
  const gateNumbers=[...new Set(activations.map(item=>item.gate))].sort((a,b)=>a-b),confirmed=confirmedGateNumbers(confirmedProfile),confirmedSet=new Set(confirmed);
  return freeze({
    schemaVersion:HDR_TARGET_ACTIVATION_REFERENCE_VERSION,
    state:'AVAILABLE',
    targetContext:freeze({targetDate:clean(targetContext.targetDate),targetTime:clean(targetContext.targetTime),targetTimezone:freeze({iana:clean(targetContext?.targetTimezone?.iana)||null,utcOffsetAtTarget:clean(targetContext?.targetTimezone?.utcOffsetAtTarget)||null}),source:clean(targetContext.source)||'EXPLICIT_REQUEST'}),
    utcIso,
    activations:freeze(activations),
    gateNumbers:freeze(gateNumbers),
    natalGateOverlap:freeze(gateNumbers.filter(gate=>confirmedSet.has(gate))),
    boundary:freeze({targetMomentReferenceOnly:true,confirmedChartChanged:false,bodyGraphRebuilt:false,variableOrPhsDerived:false,interpretationCreated:false,persisted:false})
  });
}

export default Object.freeze({HDR_TARGET_ACTIVATION_REFERENCE_VERSION,buildHdrTargetActivationReference});
