import crypto from 'node:crypto';
import {HD_R3_RUNTIME_SOURCE_INDEX as INDEX} from '../../functions/external-profile/human-design-r3-runtime-source-index.js';
const stable=v=>v&&typeof v==='object'?(Array.isArray(v)?v.map(stable):Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]))):v;
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
export const CHANNEL_IDS=Object.keys(INDEX.channels).sort((a,b)=>Number(a.split('-')[0])-Number(b.split('-')[0])||Number(a.split('-')[1])-Number(b.split('-')[1]));
export const GATE_IDS=Object.keys(INDEX.gates).map(Number).sort((a,b)=>a-b);
const TYPES=['Generator','Manifesting Generator','Projector','Manifestor','Reflector'];
const AUTHORITIES=['Emotional','Sacral','Splenic','Self Projected','Ego Manifested','Ego Projected','Mental / Environmental','Lunar'];
const PROFILES=['1/3','1/4','2/4','2/5','3/5','3/6','4/6','4/1','5/1','5/2','6/2','6/3'];
const DEFINITIONS=['Single Definition','Split Definition','Triple Split','Quad Split','No Definition'];
export function env(side,id='01') {return {schemaVersion:'PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0',methodId:'HD',readingAuthorityRef:`HD-${side}-READING-${id}`,semanticDigest:sha({side,id}),sourceLineage:[`CONFIRMED_HD_CHART:${side}:${id}`],ruleLineage:['HD-PRO-R3-CUSTOMER-PUBLISHED'],acceptedUnits:[{interpretationUnitId:`HD-${side}-${id}-U1`,summary:`Accepted independent Human Design reading ${side}`}],boundary:{acceptedAuthorityOnly:true,methodRuntimeExecuted:false,canonicalProjectionCreated:false,rawProjectionConsumedAsCustomerConclusion:false,newMeaningCreated:false,rendererMeaningCreated:false}};}
export function chart({id='A',channels=[],gates=[],seed=0,openCenters=[]}={}){
 const channelSet=[...new Set(channels.filter(x=>INDEX.channels[x]))];const gateSet=new Set(gates.filter(g=>INDEX.gates[String(g)]));for(const c of channelSet){const r=INDEX.channels[c];gateSet.add(r.gateA);gateSet.add(r.gateB)}
 const activations=[...gateSet].sort((a,b)=>a-b).map((g,i)=>({layer:i%2?'DESIGN':'PERSONALITY',bodyCode:i%2?'EARTH':'SUN',gateLine:`${g}.${(i%6)+1}`,gate:g,line:(i%6)+1}));
 const core={type:{value:TYPES[seed%TYPES.length]},strategy:{value:'Customer supplied'},authority:{value:AUTHORITIES[seed%AUTHORITIES.length]},profile:{value:PROFILES[seed%PROFILES.length]},definition:{value:DEFINITIONS[seed%DEFINITIONS.length]},incarnationCross:{value:null},signature:{value:null},notSelfTheme:{value:null}};
 const c={schemaVersion:'PHI-OS-HD-PRO-R2-CANONICAL-EXTERNAL-CHART-v1.0.0',methodId:'XPF',profileFamily:'HUMAN_DESIGN',authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',sourceProfileDigest:`SRC-${id}`,generatedAt:'2026-09-01T00:00:00.000Z',core,structure:{activations,channels:channelSet,definedCenters:[],openCenters,unclassifiedCenters:[],conflicts:[],gateNumbers:[...gateSet].sort((a,b)=>a-b)},advanced:{variable:{value:null},cognition:{value:null},determination:{value:null},environment:{value:null},perspective:{value:null},motivation:{value:null},trajectory:{value:null}},completeness:{corePresent:4,coreExpected:8,coreRatio:.5,hasChannels:channelSet.length>0,hasCenters:false,hasActivations:activations.length>0,advancedPresent:0},missingCore:[],sourceRefs:[`FIXTURE:${id}`],provenance:{customerConfirmed:true,phiosCalculated:false,automaticHumanDesignCalculationUsed:false,canonicalMethodProjection:false,hdrShadowMayValidateButMayNotOverwrite:true},boundary:{externalChartOnly:true,calculatedMethodConsensusEligible:false,medicalInferenceForbidden:true,deterministicIdentityClaimForbidden:true,runtimeEvidenceWritten:false,runtimeMemoryWritten:false}};
 return {...c,chartDigest:sha(c)};
}
export function classFixture(channelId,interactionClass,{owner='A',seed=0}={}){
 const row=INDEX.channels[channelId];if(!row)throw new Error(`UNKNOWN_CHANNEL:${channelId}`);const a={channels:[],gates:[],seed},b={channels:[],gates:[],seed:seed+1};
 if(interactionClass==='ELECTROMAGNETIC'){a.gates=[row.gateA];b.gates=[row.gateB];}
 else if(interactionClass==='DOMINANCE'){(owner==='A'?a:b).channels=[channelId];}
 else if(interactionClass==='COMPROMISE'){const full=owner==='A'?a:b,other=owner==='A'?b:a;full.channels=[channelId];other.gates=[row.gateA];}
 else if(interactionClass==='COMPANIONSHIP'){a.channels=[channelId];b.channels=[channelId];}
 else throw new Error(`UNKNOWN_CLASS:${interactionClass}`);
 return {A:chart({id:`${channelId}-${interactionClass}-A`,...a}),B:chart({id:`${channelId}-${interactionClass}-B`,...b})};
}
export function gateCompanionFixture(gate,{seed=0}={}){return {A:chart({id:`G${gate}-A`,gates:[gate],seed}),B:chart({id:`G${gate}-B`,gates:[gate],seed:seed+1})};}
export function noHitFixture(seed=0){const pairs=[[1,2],[3,4],[5,6],[7,9]];const [a,b]=pairs[seed%pairs.length];return {A:chart({id:`NOHIT-${seed}-A`,gates:[a],seed}),B:chart({id:`NOHIT-${seed}-B`,gates:[b],seed:seed+1})};}
export function coreCoverage(){return {types:TYPES,authorities:AUTHORITIES,profiles:PROFILES,definitions:DEFINITIONS};}
