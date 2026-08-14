/** Canonical Production Method Execution API. All production Method execution enters here. */
import { executeMethodWithProductionGate } from '../method-production-activation/mcd1-successor-execution-gate-runtime.js';
import { MethodProductionEligibilityError } from '../method-production-activation/production-eligibility-runtime.js';
import {dispatchMethodThroughCanonicalAdapter} from '../method-client-delivery/adapter-registry-runtime.js';

const PRE_MCD2_ADAPTER_STATE = 'METHOD_RUNTIME_ADAPTER_NOT_REGISTERED'; // historical MCD-1 marker only; no longer the active dispatch state.
void PRE_MCD2_ADAPTER_STATE;
const EXECUTABLE_CAPABILITIES = new Set(['CALCULATION','PROJECTION']);
function json(payload,status=200,extraHeaders={}){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extraHeaders}})}
function clean(v){return typeof v==='string'?v.trim():''}
async function dispatchCanonicalMethodRuntime(request,decision){
  return dispatchMethodThroughCanonicalAdapter(request,decision);
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
    if (error?.code==='MCD_CANONICAL_INPUT_NOT_ESTABLISHED') return json({ok:false,error:error.code,nextWork:'MCD-3'},409);
    if (error?.code==='MCD_HDR_PRODUCTION_INVOCATION_FORBIDDEN' || error?.code==='MCD_ADAPTER_REQUIRES_MPA_ELIGIBLE_DECISION') return json({ok:false,error:error.code},423);
    return json({ok:false,error:'METHOD_EXECUTION_FAILED_CLOSED'},500);
  }
}
export async function onRequestGet(){return json({ok:false,error:'METHOD_EXECUTION_POST_ONLY'},405,{Allow:'POST'})}
