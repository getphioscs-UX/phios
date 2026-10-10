import { planAskHealthBridge } from './ask-health-bridge.js';
import { retrieveApprovedHealthSource } from './health-live-authority-retrieval.js';
import { buildHealthGuidedContext } from './health-guided-context.js';
export async function routeAskHealthLive(input={},env={},registry={},options={}){
  const plan=planAskHealthBridge(input,{...env,PHIOS_HEALTH_AUTHORITY_ENABLED:env.PHIOS_HEALTH_AUTHORITY_ENABLED||'1'});
  if(!plan.healthIntent)return {route:'CKA_STANDARD',handled:false};
  if(['EMERGENCY','URGENT_EVALUATION'].includes(plan.safety?.careState))return {route:'HRX_SAFETY_FIRST',handled:true,plan,sources:[],guided:null,governance:{medicalEmergencyDiagnosis:false,continuedGeneralAnswer:false}};
  const sourceRequests=Array.isArray(input.sourceRequests)?input.sourceRequests:[]; const sources=[];
  for(const request of sourceRequests){const r=await retrieveApprovedHealthSource(request,{fetchImpl:options.fetchImpl||globalThis.fetch,registry,now:options.now||Date.now()});if(r.ok)sources.push(r.source);}
  const guided=buildHealthGuidedContext(input);
  if(['HEALTH_INFORMATION','HEALTH_DOCUMENT_UNDERSTANDING'].includes(plan.intent)&&!sources.length)return {route:'HRX_AUTHORITY_REQUIRED',handled:true,plan,sources:[],guided,governance:{generalModelFallback:false}};
  return {route:sources.length?'HRX_GROUNDED_HEALTH':'HRX_GUIDED_CONTEXT',handled:true,plan,sources,guided,governance:{generalModelFallback:false,methodExecution:false,diagnosis:false,treatmentPrescription:false}};
}
