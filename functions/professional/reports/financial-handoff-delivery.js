import {readProfessionalFinancialPacket} from '../access/financial-preparation-handoff.js';
import {createReportGenerationStore} from '../../personal-reading/report-generation-store.js';
import {sha256Hex} from '../../document-assembly/digest.js';
import {grantOwner} from '../consent/financial-purpose-grants.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
async function storeFor(context,request){const workspace=await readProfessionalFinancialPacket(context,request);const packet=workspace.workspace.resources.previous_reports,recipient=workspace.decision.professional_id;
 if(!/^[A-Za-z0-9_-]{1,128}$/.test(request.deliveryIntent||''))fail('DELIVERY_INTENT_REQUIRED');
 const binding={source:packet.source,recipient,grantId:request.grantId,scopes:[...request.scopes].sort(),serviceScope:request.serviceScope,jurisdictionScope:request.jurisdictionScope,assignmentRef:workspace.decision.assignment_id,deliveryIntent:request.deliveryIntent,packetDigest:sha256Hex(packet)};
 const deliveryId='financial_handoff_'+sha256Hex(binding).slice(0,32),store=await createReportGenerationStore(context.env,{environment:context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE',ownerAccountId:packet.source.ownerRef,orderId:'PROFESSIONAL_HANDOFF',reportId:deliveryId,productId:'FINANCIAL_HANDOFF'},{scope:'delivery'});return {store,binding,deliveryId,packet};}
export async function prepareFinancialHandoffDelivery(context,request){const {store,binding,deliveryId}=await storeFor(context,request);return store.withLock('handoff',async()=>{const prior=await store.get('HANDOFF');if(prior)return prior;const job={deliveryId,binding,state:'PREPARED',attempts:0,transport:'NOT_ADMITTED',createdAt:new Date().toISOString()};await store.putIfAbsent('HANDOFF',job);return job;});}
// Transport admission is closed in production. The only supplied callback seam
// is an isolated local fake; no provider is provisioned and no external send API exists.
export async function runFinancialHandoffDelivery(context,request,{transport,retryConfirmedFailure=false}={}){
 if(context.env.PHIOS_ENVIRONMENT!=='local-test'||!transport?.testOnly||typeof transport.send!=='function'||typeof transport.lookup!=='function')fail('FINANCIAL_DELIVERY_TRANSPORT_NOT_ADMITTED');
 const {store,binding,deliveryId,packet}=await storeFor(context,request);
 return store.withLock('handoff',async()=>{let job=await store.get('HANDOFF');if(!job)fail('HANDOFF_PREPARE_REQUIRED');if(sha256Hex(job.binding)!==sha256Hex(binding))fail('HANDOFF_BINDING_DRIFT');
  if(['DELIVERED','CANCELLED'].includes(job.state))return job;
  if(['DISPATCHED','OUTCOME_UNKNOWN'].includes(job.state)){
   const receipt=await transport.lookup(deliveryId);if(receipt?.deliveryId===deliveryId&&receipt.state==='DELIVERED')job={...job,state:'DELIVERED',receipt,synthetic:true};else job={...job,state:'OUTCOME_UNKNOWN',reconciliationRequired:true};await store.put('HANDOFF',job);return job;
  }
  if(job.state==='FAILED'&&(!retryConfirmedFailure||job.attempts>=2))return job;
  await readProfessionalFinancialPacket(context,request);
  job={...job,state:'DISPATCHED',attempts:job.attempts+1,synthetic:true};await store.put('HANDOFF',job);
  try{const receipt=await transport.send({deliveryId,binding,packet});if(receipt?.deliveryId!==deliveryId||!['DELIVERED','FAILED'].includes(receipt.state))throw Error('TRANSPORT_OUTCOME_UNKNOWN');job={...job,state:receipt.state,receipt};}catch{job={...job,state:'OUTCOME_UNKNOWN',reconciliationRequired:true};}
  await store.put('HANDOFF',job);return job;
 });
}
export async function cancelPreparedFinancialHandoff(context,{deliveryId,binding}){
 if(grantOwner(context)!==binding?.source?.ownerRef||deliveryId!=='financial_handoff_'+sha256Hex(binding).slice(0,32))fail('HANDOFF_CANCEL_OWNER_REQUIRED');
 const store=await createReportGenerationStore(context.env,{environment:context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE',ownerAccountId:binding.source.ownerRef,orderId:'PROFESSIONAL_HANDOFF',reportId:deliveryId,productId:'FINANCIAL_HANDOFF'},{scope:'delivery'});
 return store.withLock('handoff',async()=>{const job=await store.get('HANDOFF');if(!job||sha256Hex(job.binding)!==sha256Hex(binding))fail('HANDOFF_NOT_FOUND');if(['PREPARED','FAILED'].includes(job.state)){const cancelled={...job,state:'CANCELLED',cancelledAt:new Date().toISOString()};await store.put('HANDOFF',cancelled);return cancelled;}return {...job,recallGuaranteed:false,reconciliationRequired:['DISPATCHED','OUTCOME_UNKNOWN'].includes(job.state)};});
}
