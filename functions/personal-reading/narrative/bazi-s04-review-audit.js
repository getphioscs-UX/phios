import {naturalizeCareerLabels} from './bazi-s04-career-compression.js';
import {editFrozenMarketCandidate,MARKET_EDIT_VERSION} from './bazi-s04-market-editorial.js';
import {editFrozenWealthCandidate,WEALTH_EDIT_VERSION} from './bazi-s05-market-editorial.js';
import {editFrozenReconciledCandidate,RECONCILED_EDIT_VERSION} from './bazi-s02-s03-editorial.js';
import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {createPublicationProviderAdapters,safeProviderFailure} from './narrative-provider.js';
import {createReportSemanticReview,SEMANTIC_REVIEW_CHECKS} from './report-section-semantic-review.js';
import {verifyReportSectionComposition} from './report-section-semantic-verifier.js';
import {CSD_REVIEW_AUDIT_VERSION} from './report-editorial-quality-r4.js';
import {careerReviewState} from './bazi-s04-customer-value.js';
import {createPaiUsageRecord,estimatePaiProviderCost} from '../../_lib/pai-r1-economics.js';

// Caller owns QA host, authentication, CSRF, allowlist and fixed source gates.
// This action can only verify an already frozen candidate; it has no composer.
export async function auditFrozenCareerCandidate({record,key,env,registry,adapter=null}){
 const market=Boolean(record.result.brief?.marketContract);
 const wealth=record.result.brief?.marketDomain==='WEALTH';
 const reconciled=Boolean(record.result.brief?.reconciliation);
 const auditVersion=reconciled?RECONCILED_EDIT_VERSION:wealth?WEALTH_EDIT_VERSION:market?MARKET_EDIT_VERSION:record.result.brief?.identityContract?'CSD-IDENTITY-REVIEW-v1.0.1':CSD_REVIEW_AUDIT_VERSION;
 const auditKey=key.replace(/\.json$/,'.'+auditVersion+'.json');
 const saved=await env.PRIVATE_REPORTS.get(auditKey);
 if(saved){const value=await saved.json(),{artifactDigest,...seed}=value;if(await sha256Stable(seed)!==artifactDigest||value.sourceArtifactDigest!==record.artifactDigest)return {status:409,body:{ok:false,code:'CSD_AUDIT_INTEGRITY_FAILED'}};return {status:200,body:{ok:true,cacheHit:true,objectKey:auditKey,result:value}};}
 let r=record.result;const naturalization=r.candidate&&r.brief?.identityContract?await naturalizeCareerLabels(r.candidate,r.locale):null;if(naturalization)r={...r,candidate:naturalization.candidate};if(!r.candidate||!r.brief?.successorVersion)return {status:409,body:{ok:false,code:'CSD_FROZEN_CANDIDATE_REQUIRED'}};
 const editorial=reconciled?await editFrozenReconciledCandidate(r.candidate,r.locale,r.brief.sectionKey):wealth?await editFrozenWealthCandidate(r.candidate,r.locale):market?await editFrozenMarketCandidate(r.candidate,r.locale):null;if(editorial)r={...r,candidate:editorial.candidate};
 const candidateDigest=await sha256Stable(r.candidate);let prior=r.verification?.semanticReview,previousAuditDigest=null,previousAccepted=false;
 const previous=await env.PRIVATE_REPORTS.get(key.replace(/\.json$/,r.brief?.identityContract?'.CSD-IDENTITY-REVIEW-v1.0.0.json':'.CSD-REVIEW-v1.1.0.json'));
 if(previous){const previousRecord=await previous.json(),{artifactDigest,...seed}=previousRecord;if(await sha256Stable(seed)!==artifactDigest||previousRecord.sourceArtifactDigest!==record.artifactDigest||await sha256Stable(previousRecord.result.candidate)!==candidateDigest)return {status:409,body:{ok:false,code:'CSD_PRIOR_AUDIT_INTEGRITY_FAILED'}};prior=previousRecord.result.verification?.semanticReview;previousAuditDigest=artifactDigest;previousAccepted=previousRecord.result.verification?.accepted===true;}
 const reusable=!market&&(!r.brief?.identityContract||previousAccepted)&&prior?.candidateDigest===candidateDigest&&prior.sourceBriefDigest===r.brief.briefSemanticDigest&&SEMANTIC_REVIEW_CHECKS.every(k=>prior[k]===true)&&!prior.reasons?.length&&prior.meaningfullyUsedClaimRefs?.every(id=>r.brief.claims.some(c=>c.claimId===id));
 if(!reusable&&!adapter&&!env.OPENAI_API_KEY)return {status:503,body:{ok:false,code:'PROVIDER_CREDENTIAL_NOT_CONFIGURED'}};
 const id='rnt2-csd-review:'+await sha256Stable({source:record.artifactDigest,version:auditVersion}),now=new Date().toISOString();
 const reserved=await env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,wealth?'QA-RNT2-S05-V1':'QA-RNT2-S04-V1','RNT2_CSD_REVIEW_AUDIT','RUNNING',JSON.stringify({auditKey,sourceArtifactDigest:record.artifactDigest}),now,now).run();
 if(Number(reserved.meta?.changes??reserved.changes)!==1)return {status:409,body:{ok:false,code:'CSD_AUDIT_ALREADY_RESERVED'}};
 const invoke=adapter||createPublicationProviderAdapters({env}).OPENAI;
 const model=r.internalOnly.model,usageRecords=[];let reviewCalls=0;
 const reviewer=reusable?async()=>prior:createReportSemanticReview({model,invoke:async request=>{
  reviewCalls++;const started=Date.now();
  const result=await invoke({...request,signal:AbortSignal.timeout(120000)});
  const usage=result.usage||{},counts={inputTokens:usage.input_tokens||0,cachedInputTokens:usage.input_tokens_details?.cached_tokens||0,outputTokens:usage.output_tokens||0};
  usageRecords.push(createPaiUsageRecord({requestId:id,timestamp:new Date().toISOString(),requestType:'QA_REVIEW',aiExecutionClass:'T2_LIGHT_COMPOSITION',provider:'openai',model,...counts,estimatedProviderCost:estimatePaiProviderCost(registry.models.find(m=>m.modelId===model)||{},counts),providerAttemptCount:1,success:true,fallbackUsed:false,latencyMs:Date.now()-started}));return result;
 }});
 let verification;
 try{verification=await verifyReportSectionComposition({brief:r.brief,candidate:r.candidate,semanticReview:reviewer});}
 catch(error){return {status:502,body:{ok:false,code:'CSD_AUDIT_FAILED',...safeProviderFailure(error)}};}
 const reviewState=careerReviewState({technicalPass:verification.technicalAccepted===true,editorialPass:verification.editorialQuality?.accepted===true});
 const result={...r,status:verification.accepted?'PASS':'FALLBACK',verification,editorialQuality:verification.editorialQuality,reviewState,
  internalOnly:{...r.internalOnly,initialAdmission:r.internalOnly.actualTier,actualTier:verification.accepted?'T2_GOVERNED_NATURAL_COMPOSITION':r.internalOnly.actualTier,fallbackUsed:!verification.accepted,fallbackReason:verification.accepted?null:'FROZEN_CANDIDATE_REVIEW_FAILED',reverificationOnly:true},
  reviewAudit:{version:auditVersion,sourceArtifactDigest:record.artifactDigest,previousAuditDigest,candidateDigest,generationCalls:0,...(editorial?{editorialRevision:editorial.audit}:{}),...(naturalization?{naturalization:naturalization.audit}:{}),semanticReviewReused:reusable,reviewCalls,usageRecords},ownerAcceptance:'PENDING'};
 const payload={identity:{...record.identity,auditVersion},sourceArtifactDigest:record.artifactDigest,result,generatedAt:now,ownerAcceptance:'PENDING',productionActivated:false};
 const value={...payload,artifactDigest:await sha256Stable(payload)};
 const written=await env.PRIVATE_REPORTS.put(auditKey,JSON.stringify(value),{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 if(!written)return {status:409,body:{ok:false,code:'CSD_AUDIT_ALREADY_EXISTS'}};
 await env.RUNTIME_DB.prepare('UPDATE runtime_artifacts SET stage=?,updated_at=? WHERE artifact_id=?').bind(result.status,new Date().toISOString(),id).run();
 return {status:200,body:{ok:true,cacheHit:false,objectKey:auditKey,result:value}};
}
