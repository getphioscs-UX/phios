import { planAskHealthBridge } from './ask-health-bridge.js';
import { retrieveApprovedHealthSource } from './health-live-authority-retrieval.js';
import { buildHealthGuidedContext } from './health-guided-context.js';
import {healthAuthorityEnabled,locateHealthSupport} from './health-source-policy.js';
export async function routeAskHealthLive(input={},env={},registry={},options={}){
  const plan=planAskHealthBridge(input,env);
  if(!plan.healthIntent)return {route:'CKA_STANDARD',handled:false};
  if(['EMERGENCY','URGENT_EVALUATION'].includes(plan.safety?.careState))return {route:'HRX_SAFETY_FIRST',handled:true,plan,sources:[],guided:null,governance:{medicalEmergencyDiagnosis:false,continuedGeneralAnswer:false}};
  if(!healthAuthorityEnabled(env))return {route:'HRX_AUTHORITY_REQUIRED',handled:true,plan,sources:[],guided:buildHealthGuidedContext(input),governance:{generalModelFallback:false,externalFetch:false}};
  const sourceRequests=Array.isArray(input.sourceRequests)?input.sourceRequests:[]; const sources=[];
  for(const request of sourceRequests.slice(0,9)){const r=await retrieveApprovedHealthSource(request,{enabled:true,fetchImpl:options.fetchImpl||globalThis.fetch,registry,now:options.now||Date.now()});if(r.ok)sources.push(r.source);}
  const support=(options.supportRequests||[]).map(p=>locateHealthSupport(sources.find(s=>s.sourceId===p.sourceId),p.quote)).filter(Boolean);
  const guided=buildHealthGuidedContext(input);
  if(['HEALTH_INFORMATION','HEALTH_DOCUMENT_UNDERSTANDING'].includes(plan.intent)&&!sources.length)return {route:'HRX_AUTHORITY_REQUIRED',handled:true,plan,sources:[],guided,governance:{generalModelFallback:false}};
  return {route:support.length?'HRX_GROUNDED_SOURCE_EXCERPTS':sources.length?'HRX_SOURCE_RETRIEVED_SUPPORT_PENDING':'HRX_GUIDED_CONTEXT',handled:true,plan,sources,support,guided,governance:{generalModelFallback:false,methodExecution:false,diagnosis:false,treatmentPrescription:false}};
}
