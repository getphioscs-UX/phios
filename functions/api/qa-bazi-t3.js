import fixtures from '../personal-reading/narrative/bazi-t3-preview-packs.generated.json';
import registry from '../../content/ai-economics/providers/ai-provider-cost-registry-v1.json';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {composeBaziT3Section} from '../personal-reading/narrative/bazi-t3-composition.js';
import {COMPOSITION_VERSION} from '../personal-reading/narrative/bazi-editorial-contract.js';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer'};
export async function onRequest(context){
 const reply=(body,status=200)=>Response.json(body,{status,headers});
 const {request,env}=context;
 if(new URL(request.url).origin!=='https://qa.phios-github.pages.dev'||env.PHIOS_ENVIRONMENT!=='qa'||env.BAZI_T3_PREVIEW_SHADOW!=='enabled')return reply({ok:false},404);
 if(!normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity))return reply({ok:false,code:'ACCOUNT_REQUIRED'},401);
 if(request.method!=='POST')return reply({ok:false},405);
 try{
  requireSameOrigin(request);
  const reader=request.body?.getReader();if(!reader)return reply({ok:false},400);
  let raw='',size=0;const decoder=new TextDecoder();
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>256){await reader.cancel();return reply({ok:false},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
  const body=JSON.parse(raw);
  if(!body||Object.keys(body).some(k=>!['locale','sectionKey'].includes(k)))return reply({ok:false},400);
  const pack=fixtures.packs[`${body.locale}:${body.sectionKey}`];if(!pack)return reply({ok:false},400);
  if(!env.PRIVATE_REPORTS||!env.RUNTIME_DB)return reply({ok:false,code:'PREVIEW_STORAGE_UNAVAILABLE'},503);
  const id=`bazi-t3:${COMPOSITION_VERSION}:${pack.canonicalEvidenceHash}`,key=`qa/bazi-t3/${COMPOSITION_VERSION}/${pack.canonicalEvidenceHash}.json`;
  const saved=await env.PRIVATE_REPORTS.get(key);
  if(saved)return reply({ok:true,cacheHit:true,result:await saved.json(),objectKey:key});
  const now=new Date().toISOString(),runtime='QA-BAZI-T3-SYNTHETIC-SHADOW-V1';
  await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtimes(runtime_id,status,current_stage,state,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(runtime,'active','shadow','{}',now,now).run();
  // Global idempotent reservation, not per account: at most one bounded run for
  // each of the 16 fixed packs, even under concurrent or repeated requests.
  const reserved=await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,runtime,'BAZI_T3_SHADOW_V1','RUNNING',JSON.stringify({objectKey:key,evidenceHash:pack.canonicalEvidenceHash}),now,now).run();
  if(Number(reserved.meta?.changes??reserved.changes)!==1)return reply({ok:false,code:'SHADOW_ALREADY_RESERVED'},409);
  const result=await composeBaziT3Section({pack,registry,env,timeoutMs:90000});
  const evidence={...result,generatedAt:now,fixtureClass:fixtures.fixtureClass,liveProviderAttempt:!['PROVIDER_CREDENTIAL_NOT_CONFIGURED','NO_ADMITTED_PROVIDER_ROUTE','INSUFFICIENT_ADMITTED_INTERPRETATION'].includes(result.internalOnly?.fallbackReason),productionActivated:false};
  await env.PRIVATE_REPORTS.put(key,JSON.stringify(evidence),{httpMetadata:{contentType:'application/json'}});
  await env.RUNTIME_DB.prepare('UPDATE runtime_artifacts SET stage=?,updated_at=? WHERE artifact_id=?').bind(result.status,new Date().toISOString(),id).run();
  return reply({ok:true,cacheHit:false,result:evidence,objectKey:key});
 }catch{return reply({ok:false,code:'SHADOW_UNAVAILABLE'},503);}
}
