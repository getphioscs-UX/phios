/** Canonical MCD Production Method Execution API. MPA evaluates authority before MCD execution. */
import {executeMcd4Request,toMcd4ApiProjection} from '../method-client-delivery/execution-runtime.js';

const EXECUTABLE_CAPABILITIES=new Set(['CALCULATION','PROJECTION']);
const REQUEST_SCHEMAS=new Set(['PHI-OS-MPA-METHOD-EXECUTION-REQUEST-v1.0.0','PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0']);
function json(payload,status=200,extraHeaders={}){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extraHeaders}})}
function clean(v){return typeof v==='string'?v.trim():''}
function object(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}

export async function onRequestPost({request}){
  let body; try{body=await request.json();}catch{return json({ok:false,error:'INVALID_JSON'},400)}
  const schemaVersion=clean(body?.schemaVersion);
  if(!REQUEST_SCHEMAS.has(schemaVersion)) return json({ok:false,error:'METHOD_EXECUTION_SCHEMA_INVALID'},400);
  const canonicalInput=schemaVersion==='PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0'?object(body?.canonicalInput):object(body?.input);
  const executionRequest={
    schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',
    sourceSchemaVersion:schemaVersion,
    methodCode:clean(body?.methodCode),methodVersion:clean(body?.methodVersion),capability:clean(body?.capability).toUpperCase(),
    purposeCode:clean(body?.purposeCode),canonicalInput,executionParameters:object(body?.executionParameters),
    consentRecordId:clean(body?.consentRecordId),requestId:clean(body?.requestId)
  };
  if(!executionRequest.methodCode||!executionRequest.methodVersion||!EXECUTABLE_CAPABILITIES.has(executionRequest.capability)||!executionRequest.requestId||!executionRequest.purposeCode||!executionRequest.consentRecordId){
    return json({ok:false,error:'METHOD_EXECUTION_REQUEST_INVALID'},400);
  }
  try{
    const result=await executeMcd4Request(executionRequest);
    const projected=toMcd4ApiProjection(result);
    if(result.executionStatus==='BLOCKED_BY_MPA') return json({ok:false,error:'METHOD_PRODUCTION_NOT_ELIGIBLE',decision:result.mpaEvaluation,reasonCodes:result.reasonCodes,execution:projected},423);
    if(result.executionStatus==='INPUT_BLOCKED'){
      const missingCanonical=!canonicalInput?.inputVersion;
      return json({ok:false,error:missingCanonical?'MCD_CANONICAL_INPUT_NOT_ESTABLISHED':'MCD_EXECUTION_INPUT_BLOCKED',reasonCodes:result.reasonCodes,execution:projected},missingCanonical?409:422);
    }
    return json({ok:true,result:projected},200);
  }catch(error){
    if(error?.code==='MCD_HDR_PRODUCTION_INVOCATION_FORBIDDEN') return json({ok:false,error:error.code,reasonCodes:['HDR_PRODUCTION_INVOCATION_FORBIDDEN']},423);
    return json({ok:false,error:'METHOD_EXECUTION_FAILED_CLOSED',reasonCodes:[error?.code||'UNCLASSIFIED_EXECUTION_FAILURE']},500);
  }
}
export async function onRequestGet(){return json({ok:false,error:'METHOD_EXECUTION_POST_ONLY'},405,{Allow:'POST'})}
