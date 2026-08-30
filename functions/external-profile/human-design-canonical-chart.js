import crypto from 'node:crypto';
import {cleanExternalProfileText} from './external-profile-contract.js';

export const HD_CANONICAL_EXTERNAL_CHART_VERSION='PHI-OS-HD-PRO-R2-CANONICAL-EXTERNAL-CHART-v1.0.0';
export const HD_CENTER_CODES=Object.freeze(['HEAD','AJNA','THROAT','G','EGO','SPLEEN','SOLAR_PLEXUS','SACRAL','ROOT']);
export const HD_CORE_FIELDS=Object.freeze(['type','strategy','authority','profile','definition','incarnationCross','signature','notSelfTheme']);
export const HD_ADVANCED_FIELDS=Object.freeze(['cognition','determination','environment','perspective','motivation','trajectory']);
export const HD_STRUCTURE_FIELDS=Object.freeze(['activations','channels','definedCenters','openCenters']);

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const clean=value=>cleanExternalProfileText(value,800)||null;

function records(profile){const map=new Map();for(const record of profile?.records||[]){if(record?.field)map.set(record.field,record)}return map}
function scalar(map,field){const record=map.get(field);return freeze({value:clean(record?.value),sourceType:record?.sourceType||null,sourceRegion:record?.sourceRegion||null,customerConfirmed:record?.customerConfirmed===true,phiosCalculated:false})}
function channelCode(value){const match=String(value??'').trim().match(/^([1-9]|[1-5]\d|6[0-4])\s*[–—-]\s*([1-9]|[1-5]\d|6[0-4])$/);if(!match)return null;const a=Number(match[1]),b=Number(match[2]);return a===b?null:`${a}-${b}`}
function normalizeChannels(value){return [...new Set((Array.isArray(value)?value:[]).map(channelCode).filter(Boolean))].sort((a,b)=>Number(a.split('-')[0])-Number(b.split('-')[0])||Number(a.split('-')[1])-Number(b.split('-')[1]))}
function normalizeCenters(value){return HD_CENTER_CODES.filter(code=>new Set(Array.isArray(value)?value.map(x=>String(x).trim().toUpperCase()):[]).has(code))}
function normalizeActivations(value){const seen=new Set(),out=[];for(const item of Array.isArray(value)?value:[]){const gateLine=String(item?.gateLine??item??'').trim();const m=gateLine.match(/^([1-9]|[1-5]\d|6[0-4])[.]([1-6])$/);if(!m)continue;const layer=['DESIGN','PERSONALITY'].includes(String(item?.layer||'').toUpperCase())?String(item.layer).toUpperCase():'UNSPECIFIED';const bodyCode=cleanExternalProfileText(item?.bodyCode,40).toUpperCase()||null;const normalized=freeze({layer,bodyCode,gateLine:`${Number(m[1])}.${Number(m[2])}`,gate:Number(m[1]),line:Number(m[2])});const key=`${normalized.layer}:${normalized.bodyCode||''}:${normalized.gateLine}`;if(!seen.has(key)){seen.add(key);out.push(normalized)}}return out}
function structure(map){const activations=normalizeActivations(map.get('activations')?.value),channels=normalizeChannels(map.get('channels')?.value),definedCenters=normalizeCenters(map.get('definedCenters')?.value),openCenters=normalizeCenters(map.get('openCenters')?.value);const overlap=definedCenters.filter(code=>openCenters.includes(code));const classified=new Set([...definedCenters,...openCenters]);const unclassifiedCenters=HD_CENTER_CODES.filter(code=>!classified.has(code));return freeze({activations,channels,definedCenters,openCenters,unclassifiedCenters,conflicts:overlap.length?[freeze({code:'CENTER_CLASSIFICATION_CONFLICT',centers:overlap})]:[],gateNumbers:Object.freeze([...new Set(activations.map(item=>item.gate))].sort((a,b)=>a-b))})}

export function buildCanonicalHumanDesignExternalChart(confirmedExternalProfile,{generatedAt=new Date().toISOString()}={}){
  if(!confirmedExternalProfile||confirmedExternalProfile.authorityClass!=='CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT')throw new TypeError('HD_EXTERNAL_CONFIRMED_PROFILE_REQUIRED');
  if(confirmedExternalProfile.provenance?.customerConfirmed!==true)throw new TypeError('HD_EXTERNAL_CUSTOMER_CONFIRMATION_REQUIRED');
  const map=records(confirmedExternalProfile),core=Object.fromEntries(HD_CORE_FIELDS.map(field=>[field,scalar(map,field)])),advanced=Object.fromEntries(HD_ADVANCED_FIELDS.map(field=>[field,scalar(map,field)])),chartStructure=structure(map);
  const missingCore=HD_CORE_FIELDS.filter(field=>!core[field].value),presentCore=HD_CORE_FIELDS.filter(field=>Boolean(core[field].value));
  const completeness=freeze({corePresent:presentCore.length,coreExpected:HD_CORE_FIELDS.length,coreRatio:Number((presentCore.length/HD_CORE_FIELDS.length).toFixed(3)),hasChannels:chartStructure.channels.length>0,hasCenters:chartStructure.definedCenters.length+chartStructure.openCenters.length>0,hasActivations:chartStructure.activations.length>0,advancedPresent:HD_ADVANCED_FIELDS.filter(field=>advanced[field].value).length});
  const body={schemaVersion:HD_CANONICAL_EXTERNAL_CHART_VERSION,methodId:'XPF',profileFamily:'HUMAN_DESIGN',authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',sourceProfileDigest:confirmedExternalProfile.profileDigest||null,generatedAt:new Date(generatedAt).toISOString(),core:freeze(core),structure:chartStructure,advanced:freeze(advanced),completeness,missingCore:Object.freeze(missingCore),sourceRefs:confirmedExternalProfile.sourceRefs||[],provenance:freeze({customerConfirmed:true,phiosCalculated:false,automaticHumanDesignCalculationUsed:false,canonicalMethodProjection:false,hdrShadowMayValidateButMayNotOverwrite:true}),boundary:freeze({externalChartOnly:true,calculatedMethodConsensusEligible:false,medicalInferenceForbidden:true,deterministicIdentityClaimForbidden:true,runtimeEvidenceWritten:false,runtimeMemoryWritten:false})};
  return freeze({...body,chartDigest:digest(body)});
}
