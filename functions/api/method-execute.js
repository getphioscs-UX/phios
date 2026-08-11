/** Canonical Production Method Execution API. All production Method execution enters here. */
import { executeMethodWithProductionGate } from '../method-production-activation/method-execution-gate-runtime.js';
import { MethodProductionEligibilityError } from '../method-production-activation/production-eligibility-runtime.js';

const EXECUTABLE_CAPABILITIES = new Set(['CALCULATION','PROJECTION']);
function json(payload,status=200,extraHeaders={}){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extraHeaders}})}
function clean(v){return typeof v==='string'?v.trim():''}
async function dispatchCanonicalMethodRuntime(){
  throw Object.assign(new Error('METHOD_RUNTIME_ADAPTER_NOT_REGISTERED'),{code:'METHOD_RUNTIME_ADAPTER_NOT_REGISTERED'});
}

export async function onRequestPost({request}) {
  let body; try { body=await request.json(); } catch { return json({ok:false,error:'INVALID_JSON'},400); }
  const executionRequest={
    schemaVersion:clean(body?.schemaVersion), methodCode:clean(body?.methodCode), methodVersion:clean(body?.methodVersion),
    capability:clean(body?.capability).toUpperCase(), purposeCode:clean(body?.purposeCode), input:body?.input && typeof body.input==='object' && !Array.isArray(body.input)?body.input:{},
    consentRecordId:clean(body?.consentRecordId), requestId:clean(body?.requestId)
  };
  if (executionRequest.schemaVersion!=='PHI-OS-MPA-METHOD-EXECUTION-REQUEST-v1.0.0') return json({ok:false,error:'METHOD_EXECUTION_SCHEMA_INVALID'},400);
  if (!executionRequest.methodCode || !executionRequest.methodVersion || !EXECUTABLE_CAPABILITIES.has(executionRequest.capability)) return json({ok:false,error:'METHOD_EXECUTION_REQUEST_INVALID'},400);
  try {
    const result=await executeMethodWithProductionGate(executionRequest,dispatchCanonicalMethodRuntime);
    return json({ok:true,result},200);
  } catch(error) {
    if (error instanceof MethodProductionEligibilityError) return json({ok:false,error:error.code,decision:error.decision},423);
    if (error?.code==='METHOD_RUNTIME_ADAPTER_NOT_REGISTERED') return json({ok:false,error:error.code},503);
    return json({ok:false,error:'METHOD_EXECUTION_FAILED_CLOSED'},500);
  }
}
export async function onRequestGet(){return json({ok:false,error:'METHOD_EXECUTION_POST_ONLY'},405,{Allow:'POST'})}
