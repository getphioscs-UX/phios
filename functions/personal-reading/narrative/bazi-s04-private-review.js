import {buildBaZiS04T2,prepareBaZiS04T2,BAZI_S04_T2_RUNTIME_VERSION} from './bazi-s04-t2-runtime.js';
import {REPORT_SECTION_T2_COMPOSER_VERSION,REPORT_SECTION_T2_PROMPT_VERSION} from './narrative-writer.js';
import {REPORT_SECTION_SEMANTIC_VERIFIER_VERSION} from './report-section-semantic-verifier.js';
import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {selectPaiRoute} from '../../_lib/pai-r1-economics.js';
import {safeProviderFailure} from './narrative-provider.js';
import {CAREER_IDENTITY_VERSION as CAREER_CSD_VERSION} from './bazi-s04-career-identity.js';
import comparisonFixtures from './bazi-s04-csd-fixtures.generated.js';
import {auditFrozenCareerCandidate} from './bazi-s04-review-audit.js';

export async function inspectBaZiS04Provider({env,userId,registry,fetcher=fetch}){
 if(env.PHIOS_ENVIRONMENT!=='qa'||env.RNT2_S04_REVIEW!=='enabled')return {status:409,body:{ok:false,code:'S04_REVIEW_DISABLED'}};
 if(!userId||!String(env.RNT2_REVIEWER_IDS||'').split(',').map(x=>x.trim()).includes(userId))return {status:403,body:{ok:false,code:'REVIEWER_REQUIRED'}};
 if(!String(env.OPENAI_API_KEY||'').trim())return {status:503,body:{ok:false,code:'PROVIDER_CREDENTIAL_NOT_CONFIGURED'}};
 const route=selectPaiRoute({aiExecutionClass:'T2_LIGHT_COMPOSITION',deterministicFallbackAvailable:true},registry);
 if(route.selectedProvider!=='OPENAI'||!route.selectedModel)return {status:409,body:{ok:false,code:'UNSUPPORTED_PROVIDER_PROBE'}};
 let response;
 try{response=await fetcher('https://api.openai.com/v1/models/'+encodeURIComponent(route.selectedModel),{headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`},signal:AbortSignal.timeout(15000),redirect:'manual'});}
 catch{return {status:503,body:{ok:false,code:'PROVIDER_PROBE_NETWORK_FAILED',generationCalled:false,sourceTransmitted:false}};}
 let data;try{data=await response.json();}catch{return {status:502,body:{ok:false,code:'PROVIDER_PROBE_UNREADABLE_RESPONSE',providerStatus:response.status,generationCalled:false,sourceTransmitted:false}};}
 return {status:200,body:{ok:true,model:route.selectedModel,modelAccessible:response.ok,providerStatus:response.status,...safeProviderFailure({details:{status:response.status,providerErrorCode:data?.error?.code,providerErrorType:data?.error?.type}}),generationCalled:false,sourceTransmitted:false}};
}

// Uses existing account authentication, D1 reservations and private R2 binding.
// This is a frozen QA candidate, never a customer delivery/admission snapshot.
export async function runBaZiS04PrivateReview({env,body,userId,source,registry,compose=buildBaZiS04T2}){
 const fail=(code,status)=>({status,body:{ok:false,code}});
 if(env.PHIOS_ENVIRONMENT!=='qa'||env.RNT2_S04_REVIEW!=='enabled')return fail('S04_REVIEW_DISABLED',409);
 const reviewers=String(env.RNT2_REVIEWER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!userId||!reviewers.includes(userId))return fail('REVIEWER_REQUIRED',403);
 if(!['en','zh-Hans'].includes(body.locale)||body.sectionKey!=='S04_CAREER'||(body.profileId&&body.profileId!=='BASELINE_NOW'&&!Object.hasOwn(comparisonFixtures,body.profileId)))return fail('S04_FIXED_FIXTURE_REQUIRED',400);
 if(body.profileId&&Object.hasOwn(comparisonFixtures,body.profileId))source=comparisonFixtures[body.profileId];
 if(!env.PRIVATE_REPORTS||!env.RUNTIME_DB)return fail('PREVIEW_STORAGE_UNAVAILABLE',503);
 const prepared=await prepareBaZiS04T2({reading:source.reading,temporalSnapshot:source.temporalSnapshot,locale:body.locale,successor:'v3'});
 if(!prepared.brief.careerNarrativeIR.eligibility.eligible)return fail('CSD_SOURCE_NOT_ELIGIBLE',409);
 const identity={schemaVersion:'RNT2-S04-PRIVATE-REVIEW-v1',successor:CAREER_CSD_VERSION,briefDigest:prepared.brief.briefSemanticDigest,locale:body.locale,runtime:BAZI_S04_T2_RUNTIME_VERSION,composer:REPORT_SECTION_T2_COMPOSER_VERSION,prompt:prepared.brief.successorPromptVersion||REPORT_SECTION_T2_PROMPT_VERSION,verifier:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,registryDigest:await sha256Stable(registry)};
 const digest=await sha256Stable(identity),key=`qa/rnt2/csd-v3/s04/${digest}.json`,id=`rnt2-csd-s04:${digest}`;
 const saved=await env.PRIVATE_REPORTS.get(key);
 if(saved){
  const record=await saved.json(),{artifactDigest,...payload}=record;
  if(await sha256Stable(payload)!==artifactDigest||await sha256Stable(record.identity)!==digest)return fail('S04_SNAPSHOT_INTEGRITY_FAILED',409);
  if(body.action==='rnt2-s04-reverify')return auditFrozenCareerCandidate({record,key,env,registry});
  return {status:200,body:{ok:true,cacheHit:true,objectKey:key,result:record}};
 }
 if(body.action==='rnt2-s04-reverify')return fail('CSD_FROZEN_CANDIDATE_REQUIRED',409);
 // A missing secret must not consume the one-run reservation.
 if(!String(env.OPENAI_API_KEY||'').trim())return fail('PROVIDER_CREDENTIAL_NOT_CONFIGURED',503);
 const now=new Date().toISOString(),runtime='QA-RNT2-S04-V1';
 await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtimes(runtime_id,status,current_stage,state,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(runtime,'active','review','{}',now,now).run();
 const reserved=await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,runtime,'RNT2_S04_REVIEW','RUNNING',JSON.stringify({objectKey:key,identity}),now,now).run();
 if(Number(reserved.meta?.changes??reserved.changes)!==1)return fail('S04_ALREADY_RESERVED',409);
 // Failed/interrupted attempts keep their reservation: reopening cannot spend again.
 const result=await compose({reading:source.reading,temporalSnapshot:source.temporalSnapshot,locale:body.locale,registry,env,requestId:id,successor:'v3'});
 const payload={identity,result,generatedAt:now,ownerAcceptance:'PENDING',productionActivated:false};
 const record={...payload,artifactDigest:await sha256Stable(payload)};
 const written=await env.PRIVATE_REPORTS.put(key,JSON.stringify(record),{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 if(!written)return fail('S04_SNAPSHOT_ALREADY_EXISTS',409);
 await env.RUNTIME_DB.prepare('UPDATE runtime_artifacts SET stage=?,updated_at=? WHERE artifact_id=?').bind(result.status,new Date().toISOString(),id).run();
 return {status:200,body:{ok:true,cacheHit:false,objectKey:key,result:record}};
}
