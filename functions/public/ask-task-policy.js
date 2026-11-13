import {maintenanceMode} from '../_lib/d1-maintenance-guard.js';
// Server-owned public task boundary. Client depth, entitlement and labels cannot grant execution.
export const FREE_ASK_TASKS=Object.freeze(['ENTRY','KNOWLEDGE_BASIC','PRODUCT_HELP']);
export const ASK_TASK_CONTRACT=Object.freeze({version:'PHI-OS-ASK-TASK-R1-v1',free:FREE_ASK_TASKS,enhanced:'NOT_ENABLED',reality:'EXISTING_AUTHORIZED_OWNER_ONLY'});
// Server-only deployment/account evidence; no client flag grants model access.
export const FREE_ASK_MODEL='gpt-6-luna';
export function freeAskModelAdmission(env={},now=Date.now()){
 try{
  if(env.PHIOS_FREE_ASK_PROVIDER_ENABLED!=='true'||maintenanceMode(env.PHIOS_D1_MAINTENANCE_MODE)!=='OFF')return null;
  const raw=env.PHIOS_FREE_ASK_MODEL_ADMISSION;
  const a=typeof raw==='string'?JSON.parse(raw):raw;
  if(!a||a.state!=='ACCOUNT_MODEL_VERIFIED'||a.modelId!==FREE_ASK_MODEL||!/^([a-f0-9]{64})$/.test(a.keySha256||''))return null;
  if(!/^[a-f0-9]{40}$/.test(a.deploymentSha||'')||a.deploymentSha!==env.CF_PAGES_COMMIT_SHA)return null;
  const checked=Date.parse(a.verifiedAt),expires=Date.parse(a.expiresAt);
  if(!Number.isFinite(now)||!Number.isFinite(checked)||!Number.isFinite(expires)||checked>now+60000||expires<=now||expires<=checked||expires-checked>31*86400000)return null;
  if(typeof a.evidenceRef!=='string'||!a.evidenceRef.trim()||a.evidenceRef.length>240)return null;
  return Object.freeze({state:a.state,modelId:a.modelId,keySha256:a.keySha256,deploymentSha:a.deploymentSha,verifiedAt:a.verifiedAt,expiresAt:a.expiresAt,evidenceRef:a.evidenceRef});
 }catch{return null;}
}
export function publicAskExecutionPolicy({env={},now=Date.now()}={}){return Object.freeze({task:'KNOWLEDGE_BASIC',providerAllowed:Boolean(freeAskModelAdmission(env,now)),reportGenerationAllowed:false,automaticPersistence:false});}
