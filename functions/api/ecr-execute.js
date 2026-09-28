import {executeEcrCanonicalProjection} from '../embodied-configuration/ecr-canonical-projection-runtime.js';
import {buildEcrHumanRuntime} from '../embodied-configuration/ecr-canonical-projection-runtime-v2.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const previewRequested=(request,env)=>env?.PHIOS_ENVIRONMENT==='qa'&&request.headers.get('x-phios-ecr-v41-preview')==='1';

export async function onRequestPost({request,env={}}){
  let body;
  try{body=await request.json()}catch{return json({ok:false,error:'INVALID_JSON'},400)}
  if(body?.consent!==true)return json({ok:false,error:'ECR_PROCESSING_CONSENT_REQUIRED'},403);
  try{
    const result=await executeEcrCanonicalProjection({canonicalInput:body.canonicalInput,requestId:body.requestId||`ECR-${crypto.randomUUID()}`});
    if(!previewRequested(request,env))return json({ok:true,result});
    const previewHumanRuntime=await buildEcrHumanRuntime({canonicalInput:body.canonicalInput});
    return json({ok:true,result,previewHumanRuntime,previewMode:'ECR_V41_R9_QA'});
  }catch(error){
    return json({ok:false,error:error?.code||'ECR_EXECUTION_FAILED'},422);
  }
}
