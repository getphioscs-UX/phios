/** Canonical MCD Production Method Execution API. MPA evaluates authority before MCD execution; clients receive only MCD-5 CanonicalMethodProjection. */
import {executeAndProjectMcd5Request} from '../method-client-delivery/canonical-projection-runtime.js';

const EXECUTABLE_CAPABILITIES=new Set(['CALCULATION','PROJECTION']);
const REQUEST_SCHEMAS=new Set(['PHI-OS-MPA-METHOD-EXECUTION-REQUEST-v1.0.0','PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0']);
function json(payload,status=200,extraHeaders={}){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extraHeaders}})}
function clean(v){return typeof v==='string'?v.trim():''}
function object(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function hdrBlockedPayload(reasonCodes=[]){return {ok:false,error:'METHOD_PRODUCTION_NOT_ELIGIBLE',publicMethodLabel:'Personal Runtime Projection',projectionContractStatus:'VALIDATION_ONLY_NOT_CLIENT_DISPATCHABLE',reasonCodes:[...new Set(['RESTRICTED_METHOD_PRODUCTION_BLOCKED','PRODUCTION_INVOCATION_FORBIDDEN',...reasonCodes.filter(code=>!String(code).includes('HDR'))])]};}

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
    const {execution,canonicalProjection}=await executeAndProjectMcd5Request(executionRequest);
    if(execution.executionStatus==='BLOCKED_BY_MPA'){
      if(executionRequest.methodCode==='HUMAN_DESIGN') return json(hdrBlockedPayload(execution.reasonCodes),423);
      return json({ok:false,error:'METHOD_PRODUCTION_NOT_ELIGIBLE',reasonCodes:execution.reasonCodes},423);
    }
    if(execution.executionStatus==='INPUT_BLOCKED'){
      const missingCanonical=!canonicalInput?.inputVersion;
      return json({ok:false,error:missingCanonical?'MCD_CANONICAL_INPUT_NOT_ESTABLISHED':'MCD_EXECUTION_INPUT_BLOCKED',reasonCodes:execution.reasonCodes,result:canonicalProjection},missingCanonical?409:422);
    }
    return json({ok:true,result:canonicalProjection},200);
  }catch(error){
    if(error?.code==='MCD_HDR_PRODUCTION_INVOCATION_FORBIDDEN'||error?.code==='MCD_HDR_PRODUCTION_CLIENT_PROJECTION_FORBIDDEN') return json(hdrBlockedPayload([]),423);
    return json({ok:false,error:'METHOD_EXECUTION_FAILED_CLOSED',reasonCodes:[error?.code||'UNCLASSIFIED_EXECUTION_FAILURE']},500);
  }
}
export async function onRequestGet(){return json({ok:false,error:'METHOD_EXECUTION_POST_ONLY'},405,{Allow:'POST'})}
