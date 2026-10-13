import {createProductionKnowledgeCapability,productionKnowledgeReady} from './membership-production-gate.js';
import {runAutomaticDeliveryCandidate} from './membership-auto-delivery-candidate.js';
import {prepareKnowledgeMembershipAsk} from './membership-knowledge-service.js';
import {personIdentity} from '../../account/canonical-person-store.js';
import {activeContinuitySubscription} from './continuity-quota-d1.js';
import {shortDeliveryMaximum} from './membership-short-delivery-qa.js';
export {productionKnowledgeReady};
export async function executeProductionKnowledge(context,input){
 const env=context.env,capability=createProductionKnowledgeCapability(env),owner=personIdentity(context).userId;
 await activeContinuitySubscription(env,owner);
 if(!env.OPENAI_API_KEY)throw Object.assign(Error('MEMBERSHIP_PROVIDER_UNAVAILABLE'),{code:'MEMBERSHIP_PROVIDER_UNAVAILABLE',status:503});
 const row=await env.RUNTIME_DB.prepare('SELECT envelope_id FROM provider_product_cost_envelopes WHERE owner_account_id=? AND product_id=? ORDER BY created_at DESC LIMIT 1').bind(owner,'COM-SUBSCRIPTION-MONTHLY').first();if(!row)throw Object.assign(Error('ACTIVE_MEMBERSHIP_OR_BALANCE_REQUIRED'),{code:'ACTIVE_MEMBERSHIP_OR_BALANCE_REQUIRED',status:409});
 return runAutomaticDeliveryCandidate(context,input,{capability,prepare:prepareKnowledgeMembershipAsk,platformEnvelopeId:row.envelope_id,evidenceKind:'CUSTOMER_KNOWLEDGE_EXECUTION',invoke:async(body,{maximumMicroUSD})=>{
  if(!productionKnowledgeReady(env)||body.model!=='gpt-5.6-luna'||body.tools?.length||shortDeliveryMaximum(body)>maximumMicroUSD)throw Error('MEMBERSHIP_PROVIDER_REQUEST_NOT_ADMITTED');
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.OPENAI_API_KEY},body:JSON.stringify({...body,text:{format:{type:'json_object'}}}),signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error('MEMBERSHIP_PROVIDER_REQUEST_FAILED');const raw=await response.json();
  return {status:raw.status,usage:raw.usage,text:raw.output_text||raw.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('')||''};
 }});
}
