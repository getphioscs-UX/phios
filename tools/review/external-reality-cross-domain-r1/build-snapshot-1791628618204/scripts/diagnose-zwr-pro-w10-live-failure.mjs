import fs from 'node:fs';
import {verifyReportSectionComposition} from '../functions/personal-reading/narrative/report-section-semantic-verifier.js';

const path='docs/reports/ziwei/production-admission/zwr-pro-w10-live-campaign.json';
const W4_ROLES=['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'];
function inferredRepairRoles(reasons,candidate){
 const roles=new Set(),joined=(reasons||[]).join('\n');
 for(const role of W4_ROLES)if(new RegExp('\\b'+role+'\\b','u').test(joined))roles.add(role);
 const hints=[['结构段','STRUCTURE'],['开篇','STRUCTURE'],['命身轴','STRUCTURE'],['意义段','MEANING'],['三方四正','MEANING'],['条件段','CONDITIONS'],['反向表现','COUNTERWEIGHTS'],['压力下','COUNTERWEIGHTS'],['时序段','TIMING_RELEVANCE'],['时序','TIMING_RELEVANCE'],['现实检验','OBSERVABLE_EXPRESSION'],['对照来检验','OBSERVABLE_EXPRESSION'],['导航段','NAVIGATION'],['实际运用','NAVIGATION']];
 for(const [hint,role] of hints)if(joined.includes(hint))roles.add(role);
 for(const reason of reasons||[])for(const m of String(reason).matchAll(/[“”]([^“”]{3,80})[“”]/gu)){
  const hit=(candidate?.blocks||[]).find(b=>String(b.text||'').includes(m[1]));
  if(hit?.role)roles.add(hit.role);
 }
 return [...roles];
}
if(!fs.existsSync(path))throw Error('ZWR_PRO_W10_FAILURE_EVIDENCE_MISSING');
const doc=JSON.parse(fs.readFileSync(path,'utf8'));
if(doc.status!=='FAIL'){
 console.log('W10 evidence status:',doc.status);
 process.exit(0);
}
const d=doc.detail||{},inner=d.detail||{},candidate=inner.candidate||{},composition=candidate.composition||{};
const verification=composition.verification||candidate.verification||inner.semantic||null;
const internal=composition.internalOnly||candidate.internalOnly||null;
const out={
 status:doc.status,
 failedFixtureId:doc.failedFixtureId,
 pipelineReason:d.reason||null,
 failedLocale:d.failedLocale||inner.locale||candidate.locale||null,
 failedSection:d.sectionId||inner.sectionId||candidate.sectionId||null,
 innerReason:inner.reason||null,
 w4Status:candidate.status||null,
 compositionStatus:composition.status||null,
 compositionReason:composition.reason||null,
 referenceId:composition.referenceId||null,
 provider:internal?.provider||null,
 model:internal?.model||null,
 actualTier:internal?.actualTier||null,
 fallbackReason:internal?.fallbackReason||null,
 providerCalled:internal?.providerCalled??null,
 providerAttemptCount:internal?.providerAttemptCount??null,
 transportCalls:internal?.transportCalls??null,
 semanticReviewCalls:internal?.semanticReviewCalls??null,
 repairCount:internal?.repairCount??null,
 resumedFromSavedComposition:internal?.resumedFromSavedComposition??null,
 historicalCompositionCalls:internal?.historicalCompositionCalls??null,
 historicalCompositionUsageUnavailable:internal?.historicalCompositionUsageUnavailable??null,
 currentResumeCalls:internal?.currentResumeCalls??null,
 targetedRepairRoles:internal?.targetedRepairRoles||[],
 targetedRepairAttempted:Number(internal?.repairCount||0)>0,
 reusedSavedSemanticReview:internal?.reusedSavedSemanticReview??null,
 compositionUsageRecordCount:Array.isArray(composition.compositionUsageRecords)?composition.compositionUsageRecords.length:(composition.usageRecord?1:0),
 verificationUsageRecordCount:Array.isArray(composition.verificationUsageRecords)?composition.verificationUsageRecords.length:0,
 attemptLog:internal?.attemptLog||[],
 verificationAccepted:verification?.accepted??null,
 verificationReasons:verification?.reasons||[],
 semanticReviewReasons:verification?.semanticReview?.reasons||[],
 semanticReviewPresent:Boolean(verification?.semanticReview),
 inferredTargetedRepairRoles:inferredRepairRoles(verification?.semanticReview?.reasons||[],composition.candidate),
 candidateBlockCount:composition.candidate?.blocks?.length??null,
 candidateBlocks:(composition.candidate?.blocks||[]).map((b,i)=>({index:i,role:b.role,text:b.text,claimRefs:b.claimRefs||[]})),
 usageRecord:composition.usageRecord||null,
 verificationUsageRecords:composition.verificationUsageRecords||[]
};
let replay=null;
if(composition.governedBrief&&composition.candidate){
 const allRefs=[...new Set((composition.candidate.blocks||[]).flatMap(b=>b.claimRefs||[]))];
 replay=await verifyReportSectionComposition({
  brief:composition.governedBrief,
  candidate:composition.candidate,
  semanticReview:async({brief,candidateDigest})=>({
   sourceBriefDigest:brief.briefSemanticDigest,
   candidateDigest,
   factsPreserved:true,
   boundariesPreserved:true,
   conditionsPreserved:true,
   counterSignalsPreserved:true,
   uncertaintyPreserved:true,
   timingScopePreserved:true,
   noInventedReality:true,
   noNewMethodFact:true,
   semanticOperatorsPreserved:true,
   rankPreserved:true,
   directionPreserved:true,
   meaningfullyUsedClaimRefs:allRefs,
   reasons:[]
  })
 });
}
out.zeroCostReplay=replay?{
 accepted:replay.accepted,
 reasons:replay.reasons,
 claimCoverage:replay.claimCoverage,
 semanticReviewPresent:Boolean(replay.semanticReview)
}:null;
console.log(JSON.stringify(out,null,2));
