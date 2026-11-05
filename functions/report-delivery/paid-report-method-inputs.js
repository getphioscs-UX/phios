import {resolveZiweiLiveTargetContext} from '../zi-wei-full-production/ziwei-live-target-context-runtime.js';
const fail=()=>{throw Object.assign(Error('PAID_REPORT_METHOD_INPUTS_INVALID'),{code:'PAID_REPORT_METHOD_INPUTS_INVALID',status:422});};
// Only declared method-owned input is frozen into the existing readiness/order
// snapshot. No generic client payload, calculation result or provider instruction.
export function normalizePaidReportMethodInputs(methodCode,value){
 if(value===undefined)return undefined;
 if(methodCode==='HD'){
  if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).some(k=>k!=='sourceToken')||typeof value.sourceToken!=='string'||value.sourceToken.length>131072||!/^PERSON_SOURCE_1\.[A-Za-z0-9_-]+$/.test(value.sourceToken))fail();
  return Object.freeze({sourceToken:value.sourceToken});
 }
 if(!value||Array.isArray(value)||typeof value!=='object'||methodCode!=='ZWR'||Object.keys(value).some(k=>k!=='targetContext')||!value.targetContext)fail();
 return Object.freeze({targetContext:resolveZiweiLiveTargetContext(value.targetContext)});
}
