import {createHdrInternalAstronomyAdapter} from '../professional/hdr-internal/hdr-internal-astronomy-adapter.js';
import {ACTIVATION_BODIES} from '../method-runtime/personal-structure/activation-builder.js';
import {resolveGateLine} from '../method-runtime/personal-structure/gate-line.js';
import {resolveActivatedChannels,SCU_ENDPOINTS} from '../method-runtime/personal-structure/scu-resolver.js';
import {buildCenterGraph} from '../method-runtime/personal-structure/center-graph.js';
import {createTransitOverlay} from '../method-runtime/personal-structure/overlay.js';

export const HDR_TRANSIT_OVERLAY_VERSION='PHI-OS-HDR-TRANSIT-OVERLAY-v2.0.0';
// Compatibility export. Existing callers can keep the old symbol while receiving the v2 natal + transit overlay.
export const HDR_TARGET_ACTIVATION_REFERENCE_VERSION=HDR_TRANSIT_OVERLAY_VERSION;

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const clean=value=>String(value??'').trim();
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
const validTime=value=>/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
const validOffset=value=>/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(value);
const channelKey=(a,b)=>`${Math.min(Number(a),Number(b))}-${Math.max(Number(a),Number(b))}`;
const CHANNEL_BY_KEY=new Map(SCU_ENDPOINTS.map(item=>[channelKey(item.gateA,item.gateB),item]));

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
function record(profile,field){return (profile?.records||[]).find(item=>item?.field===field)||null}
function parseGateLine(value){const match=clean(value).match(/^([1-9]|[1-5]\d|6[0-4])[.]([1-6])$/);return match?{gate:Number(match[1]),line:Number(match[2])}:null}
function confirmedNatalActivations(profile){
  const values=record(profile,'activations')?.value||[],out=[],seen=new Set();
  for(const item of Array.isArray(values)?values:[]){
    const parsed=parseGateLine(item?.gateLine??item);if(!parsed)continue;
    const rawLayer=clean(item?.layer).toUpperCase(),layer=rawLayer==='DESIGN'?'DESIGN':rawLayer==='PERSONALITY'?'PERSONALITY':'UNSPECIFIED';
    const bodyCode=clean(item?.bodyCode).toUpperCase()||null,key=`${layer}:${bodyCode||''}:${parsed.gate}.${parsed.line}`;
    if(seen.has(key))continue;seen.add(key);
    out.push(freeze({activationId:`CONFIRMED-${layer}-${bodyCode||'UNKNOWN'}-${parsed.gate}.${parsed.line}`,layer,bodyCode,status:'CONFIRMED',gate:parsed.gate,line:parsed.line,gateLine:`${parsed.gate}.${parsed.line}`,source:'CUSTOMER_CONFIRMED_CHART'}));
  }
  return freeze(out);
}
function confirmedNatalChannels(profile){
  const values=record(profile,'channels')?.value||[],out=[],seen=new Set();
  for(const raw of Array.isArray(values)?values:[]){
    const match=clean(raw).match(/^([1-9]|[1-5]\d|6[0-4])\s*[–—-]\s*([1-9]|[1-5]\d|6[0-4])$/);if(!match)continue;
    const key=channelKey(match[1],match[2]),endpoint=CHANNEL_BY_KEY.get(key);if(!endpoint||seen.has(key))continue;seen.add(key);
    out.push(freeze({...endpoint,gates:freeze([endpoint.gateA,endpoint.gateB]),centers:freeze([endpoint.centerA,endpoint.centerB]),source:'CUSTOMER_CONFIRMED_CHART'}));
  }
  return freeze(out);
}
function confirmedDefinedCenters(profile){const values=record(profile,'definedCenters')?.value||[];return freeze([...new Set((Array.isArray(values)?values:[]).map(value=>clean(value).toUpperCase()).filter(Boolean))].sort())}
function mergeChannels(...groups){const map=new Map();for(const group of groups)for(const item of group||[]){const key=channelKey(item.gateA,item.gateB);if(!map.has(key))map.set(key,item)}return freeze([...map.values()].sort((a,b)=>a.gateA-b.gateA||a.gateB-b.gateB))}
function centerSetFromChannels(channels){return new Set((channels||[]).flatMap(item=>[item.centerA,item.centerB]))}
function classifyTemporaryChannel(channel,natalSet,transitSet){
  const natalA=natalSet.has(channel.gateA),natalB=natalSet.has(channel.gateB),transitA=transitSet.has(channel.gateA),transitB=transitSet.has(channel.gateB);
  const composition=(natalA||natalB)&&(transitA||transitB)?'TRANSIT_COMPLETES_NATAL':'TRANSIT_ONLY';
  return freeze({...channel,composition,natalEndpoints:freeze([natalA?channel.gateA:null,natalB?channel.gateB:null].filter(Boolean)),transitEndpoints:freeze([transitA?channel.gateA:null,transitB?channel.gateB:null].filter(Boolean))});
}

export async function buildHdrTransitOverlay({targetContext,confirmedProfile,astronomyAdapter}={}){
  if(!targetContext)return null;
  if(!confirmedProfile||typeof confirmedProfile!=='object')throw Object.assign(new Error('HDR_TRANSIT_CONFIRMED_PROFILE_REQUIRED'),{code:'HDR_TRANSIT_CONFIRMED_PROFILE_REQUIRED'});
  const utcIso=targetUtcIso(targetContext),adapter=astronomyAdapter||createHdrInternalAstronomyAdapter();
  const astronomy=await adapter.calculateLongitudesAt(utcIso),transitActivations=[];
  for(const bodyCode of ACTIVATION_BODIES){
    const longitude=astronomy?.longitudes?.[bodyCode];if(!Number.isFinite(longitude))continue;
    const resolved=resolveGateLine(longitude);
    transitActivations.push(freeze({activationId:`TRANSIT-PERSONALITY-${bodyCode}`,layer:'TRANSIT_PERSONALITY',bodyCode,status:'CALCULATED',instantUTC:utcIso,gate:resolved.gate,line:resolved.line,gateLine:`${resolved.gate}.${resolved.line}`,eclipticLongitude:resolved.eclipticLongitude,source:'TARGET_MOMENT_ASTRONOMY'}));
  }

  const natalActivations=confirmedNatalActivations(confirmedProfile);
  const transitGateNumbers=freeze([...new Set(transitActivations.map(item=>item.gate))].sort((a,b)=>a-b));
  const natalGateNumbers=freeze([...new Set(natalActivations.map(item=>item.gate))].sort((a,b)=>a-b));
  const natalSet=new Set(natalGateNumbers),transitSet=new Set(transitGateNumbers);
  const natalGateOverlap=freeze(transitGateNumbers.filter(gate=>natalSet.has(gate)));

  const computedNatal=resolveActivatedChannels(natalActivations);
  const explicitNatalChannels=confirmedNatalChannels(confirmedProfile);
  const natalChannels=mergeChannels(explicitNatalChannels,computedNatal.activatedChannels);
  const baselineKeys=new Set(natalChannels.map(item=>channelKey(item.gateA,item.gateB)));
  const combinedResolution=resolveActivatedChannels([...natalActivations,...transitActivations]);
  const combinedChannels=mergeChannels(natalChannels,combinedResolution.activatedChannels);
  const temporaryChannels=freeze(combinedChannels.filter(item=>!baselineKeys.has(channelKey(item.gateA,item.gateB))).map(item=>classifyTemporaryChannel(item,natalSet,transitSet)));
  const reinforcedNatalChannels=freeze(natalChannels.filter(item=>transitSet.has(item.gateA)||transitSet.has(item.gateB)).map(item=>freeze({...item,composition:'NATAL_CHANNEL_REINFORCED',transitEndpoints:freeze([transitSet.has(item.gateA)?item.gateA:null,transitSet.has(item.gateB)?item.gateB:null].filter(Boolean))})));

  const explicitNatalCenters=confirmedDefinedCenters(confirmedProfile);
  const calculatedNatalGraph=buildCenterGraph(natalChannels,computedNatal.hangingGates);
  const natalDefinedCenters=freeze([...new Set([...explicitNatalCenters,...calculatedNatalGraph.definedCenters])].sort());
  const combinedCenterSet=centerSetFromChannels(combinedChannels);for(const center of natalDefinedCenters)combinedCenterSet.add(center);
  const combinedDefinedCenters=freeze([...combinedCenterSet].sort());
  const newlyDefinedCenters=freeze(combinedDefinedCenters.filter(center=>!natalDefinedCenters.includes(center)));
  const combinedGateNumbers=freeze([...new Set([...natalGateNumbers,...transitGateNumbers])].sort((a,b)=>a-b));
  const transitObject=createTransitOverlay({natalRef:confirmedProfile.profileDigest||confirmedProfile.intakeId||'CUSTOMER_CONFIRMED_HD_CHART',asOf:utcIso,activations:transitActivations});

  const state=natalActivations.length||natalChannels.length||natalDefinedCenters.length?'AVAILABLE':'PARTIAL';
  return freeze({
    schemaVersion:HDR_TRANSIT_OVERLAY_VERSION,
    state,
    mode:'CONFIRMED_NATAL_PLUS_TRANSIT',
    targetContext:freeze({targetDate:clean(targetContext.targetDate),targetTime:clean(targetContext.targetTime),targetTimezone:freeze({iana:clean(targetContext?.targetTimezone?.iana)||null,utcOffsetAtTarget:clean(targetContext?.targetTimezone?.utcOffsetAtTarget)||null}),source:clean(targetContext.source)||'EXPLICIT_REQUEST'}),
    utcIso,
    natal:freeze({source:'CUSTOMER_CONFIRMED_CHART',profileDigest:confirmedProfile.profileDigest||null,activations:natalActivations,gateNumbers:natalGateNumbers,channels:natalChannels,definedCenters:natalDefinedCenters}),
    transit:freeze({layer:'TRANSIT_PERSONALITY',activations:freeze(transitActivations),gateNumbers:transitGateNumbers}),
    overlay:freeze({transitObject,combinedGateNumbers,channels:combinedChannels,temporaryChannels,reinforcedNatalChannels,combinedDefinedCenters,newlyDefinedCenters,natalGateOverlap}),
    // Compatibility aliases for one release cycle. These are the transit layer only, not a second natal chart.
    activations:freeze(transitActivations),
    gateNumbers:transitGateNumbers,
    natalGateOverlap,
    boundary:freeze({usesConfirmedNatalChart:true,natalBaselineImmutable:true,transitLayer:'TRANSIT_PERSONALITY',transitDesignLayerCalculated:false,temporaryStructureDerived:true,natalTypeStrategyAuthorityProfileDefinitionRecomputed:false,confirmedChartChanged:false,variableOrPhsDerived:false,interpretationCreated:false,persisted:false})
  });
}

export const buildHdrTargetActivationReference=buildHdrTransitOverlay;

export default Object.freeze({HDR_TRANSIT_OVERLAY_VERSION,HDR_TARGET_ACTIVATION_REFERENCE_VERSION,buildHdrTransitOverlay,buildHdrTargetActivationReference});
