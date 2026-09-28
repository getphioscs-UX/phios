import {acceptedS04,acceptedS05} from './bazi-owner-acceptance.generated.js';
import {buildBaZiS04T2,prepareBaZiS04T2,BAZI_S04_T2_RUNTIME_VERSION} from './bazi-s04-t2-runtime.js';
import {REPORT_SECTION_T2_COMPOSER_VERSION,REPORT_SECTION_T2_PROMPT_VERSION} from './narrative-writer.js';
import {REPORT_SECTION_SEMANTIC_VERIFIER_VERSION} from './report-section-semantic-verifier.js';
import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {selectPaiRoute} from '../../_lib/pai-r1-economics.js';
import {safeProviderFailure} from './narrative-provider.js';
import {MARKET_VERSION as CAREER_CSD_VERSION} from './bazi-s04-market-reading.js';
import comparisonFixtures from './bazi-s04-csd-fixtures.generated.js';
import {auditFrozenCareerCandidate} from './bazi-s04-review-audit.js';
import {buildWealthBrief,WEALTH_VERSION} from './bazi-s05-market-reading.js';
import {buildBaZiS05T2,WEALTH_RUNTIME_VERSION,validateS04OwnerAcceptance} from './bazi-s05-t2-runtime.js';
import {buildReconciledBaZiBrief} from './bazi-s02-s03-reconciliation.js';
import {buildReconciledBaZiT2,validateS05OwnerAcceptance} from './bazi-s02-s03-runtime.js';

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
export async function runBaZiS04PrivateReview({env,body,userId,source,registry,compose=null,lane='S04',ownerAcceptance=acceptedS04,s05Acceptance=acceptedS05}){
 const fail=(code,status)=>({status,body:{ok:false,code}});
 const wealth=lane==='S05';
 const reconciled=['S02','S03'].includes(lane),sectionKey=reconciled?(lane==='S02'?'S02_PERSONALITY':'S03_LIFE_STRUCTURE'):wealth?'S05_WEALTH':'S04_CAREER';
 if(!['S02','S03','S04','S05'].includes(lane))return fail('INVALID_REVIEW_LANE',400);
 compose=compose||(reconciled?buildReconciledBaZiT2:wealth?buildBaZiS05T2:buildBaZiS04T2);
 if(env.PHIOS_ENVIRONMENT!=='qa'||env.RNT2_S04_REVIEW!=='enabled')return fail('S04_REVIEW_DISABLED',409);
 const reviewers=String(env.RNT2_REVIEWER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!userId||!reviewers.includes(userId))return fail('REVIEWER_REQUIRED',403);
 if(!['en','zh-Hans'].includes(body.locale)||body.sectionKey!==sectionKey||(body.profileId&&body.profileId!=='BASELINE_NOW'&&!Object.hasOwn(comparisonFixtures,body.profileId)))return fail('S04_FIXED_FIXTURE_REQUIRED',400);
 if(reconciled&&![`rnt2-${lane.toLowerCase()}`,`rnt2-${lane.toLowerCase()}-reverify`].includes(body.action))return fail('RECONCILED_ACTION_REQUIRED',400);
 if(reconciled&&!await validateS05OwnerAcceptance(s05Acceptance))return fail('S05_BILINGUAL_OWNER_ACCEPTANCE_REQUIRED',409);
 if(wealth&&!await validateS04OwnerAcceptance(ownerAcceptance))return fail('S04_BILINGUAL_OWNER_ACCEPTANCE_REQUIRED',409);
 if(body.profileId&&body.profileId!=='BASELINE_NOW')return fail('V4_BASELINE_ONLY',400);
 if(!env.PRIVATE_REPORTS||!env.RUNTIME_DB)return fail('PREVIEW_STORAGE_UNAVAILABLE',503);
 const input={reading:source.reading,temporalSnapshot:source.temporalSnapshot,locale:body.locale,successor:'v4'};
 const prepared=reconciled?{brief:await buildReconciledBaZiBrief({...input,sectionKey})}:wealth?{brief:await buildWealthBrief(input)}:await prepareBaZiS04T2(input);
 if(!(reconciled?prepared.brief.reconciledNarrativeIR:wealth?prepared.brief.wealthNarrativeIR:prepared.brief.careerNarrativeIR).eligibility.eligible)return fail('CSD_SOURCE_NOT_ELIGIBLE',409);
 const identity={schemaVersion:wealth?'RNT2-S05-PRIVATE-REVIEW-v1':'RNT2-S04-PRIVATE-REVIEW-v1',successor:wealth?WEALTH_VERSION:CAREER_CSD_VERSION,briefDigest:prepared.brief.briefSemanticDigest,locale:body.locale,runtime:wealth?WEALTH_RUNTIME_VERSION:BAZI_S04_T2_RUNTIME_VERSION,composer:REPORT_SECTION_T2_COMPOSER_VERSION,prompt:prepared.brief.successorPromptVersion||REPORT_SECTION_T2_PROMPT_VERSION,verifier:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,registryDigest:await sha256Stable(registry)};
 if(reconciled)Object.assign(identity,{schemaVersion:`RNT2-${lane}-PRIVATE-REVIEW-v1`,successor:prepared.brief.successorVersion,runtime:`RNT2-BZR-${lane}-v1.0.0`});
 const digest=await sha256Stable(identity),key=`qa/rnt2/${reconciled?'market-v1/'+lane.toLowerCase():wealth?'market-v1/s05':'csd-v4/s04'}/${digest}.json`,id=`rnt2-${reconciled?'market-'+lane.toLowerCase():wealth?'market-s05':'csd-s04'}:${digest}`;
 const saved=await env.PRIVATE_REPORTS.get(key);
 if(saved){
  const record=await saved.json(),{artifactDigest,...payload}=record;
  if(await sha256Stable(payload)!==artifactDigest||await sha256Stable(record.identity)!==digest)return fail('S04_SNAPSHOT_INTEGRITY_FAILED',409);
  if(body.action===`rnt2-${lane.toLowerCase()}-reverify`)return auditFrozenCareerCandidate({record,key,env,registry});
  return {status:200,body:{ok:true,cacheHit:true,objectKey:key,result:record}};
 }
 if(body.action===`rnt2-${lane.toLowerCase()}-reverify`)return fail('CSD_FROZEN_CANDIDATE_REQUIRED',409);
 // A missing secret must not consume the one-run reservation.
 if(!String(env.OPENAI_API_KEY||'').trim())return fail('PROVIDER_CREDENTIAL_NOT_CONFIGURED',503);
 const now=new Date().toISOString(),runtime=`QA-RNT2-${lane}-V1`;
 await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtimes(runtime_id,status,current_stage,state,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(runtime,'active','review','{}',now,now).run();
 const reserved=await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,runtime,`RNT2_${lane}_REVIEW`,'RUNNING',JSON.stringify({objectKey:key,identity}),now,now).run();
 if(Number(reserved.meta?.changes??reserved.changes)!==1)return fail('S04_ALREADY_RESERVED',409);
 // Failed/interrupted attempts keep their reservation: reopening cannot spend again.
 const result=await compose({reading:source.reading,temporalSnapshot:source.temporalSnapshot,locale:body.locale,registry,env,requestId:id,successor:'v4',...(reconciled?{sectionKey}:{})});
 const payload={identity,result,generatedAt:now,ownerAcceptance:'PENDING',productionActivated:false};
 const record={...payload,artifactDigest:await sha256Stable(payload)};
 const written=await env.PRIVATE_REPORTS.put(key,JSON.stringify(record),{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 if(!written)return fail('S04_SNAPSHOT_ALREADY_EXISTS',409);
 await env.RUNTIME_DB.prepare('UPDATE runtime_artifacts SET stage=?,updated_at=? WHERE artifact_id=?').bind(result.status,new Date().toISOString(),id).run();
 return {status:200,body:{ok:true,cacheHit:false,objectKey:key,result:record}};
}
