import {POLICY,BATCHES,FIELD,unitKey} from './bazi-deep-manuscript-contract.js';
import {unresolvedBaziUnits,guardBaziPaidUnitRequest} from './bazi-deep-manuscript-checkpoint.js';
import {projectBaziBatchAuthority} from './bazi-deep-manuscript-batch-authority.js';
export function planBaziTechnicalRecovery(cp,pack,{mode='PRODUCTION',sectionIds=null}={}){
 const unresolved=unresolvedBaziUnits(cp).filter(u=>!sectionIds||sectionIds.includes(u.sectionId));if(!unresolved.length)return null;
 const sectionId=unresolved[0].sectionId,units=unresolved.filter(u=>u.sectionId===sectionId);
 guardBaziPaidUnitRequest(cp,units,true);
 const callType=cp.standardRecoveryCallsUsed<POLICY.maxStandardRecoveryCalls?'STANDARD_RECOVERY':'DELIVERY_RESCUE';
 if(mode==='EXPERIMENT'&&callType==='DELIVERY_RESCUE')return {approvalRequired:true,units,callType};
 const batchId=BATCHES.find(b=>b.sectionIds.includes(sectionId)).batchId;
 const anchorLocale=units.length===1?(units[0].locale==='en'?'zh-Hans':'en'):null;
 return {callType,batchId,units,authority:projectBaziBatchAuthority(pack,batchId,[sectionId]),semanticAnchor:anchorLocale?{locale:anchorLocale,manuscript:cp.units[unitKey(sectionId,anchorLocale)]?.manuscript||null}:null};
}
export function retryableBaziTransport(error){return [429,500,502,503,504].includes(error?.httpStatus)||['BDM_TRANSPORT_TIMEOUT','BDM_TRANSPORT_NETWORK'].includes(error?.code);}
export function costTelemetry(cost,tiers){return Object.fromEntries(Object.entries(tiers||{}).filter(([,v])=>Number.isFinite(v)&&v!==null).map(([k,v])=>[k,{threshold:v,exceeded:cost>v}]));}
