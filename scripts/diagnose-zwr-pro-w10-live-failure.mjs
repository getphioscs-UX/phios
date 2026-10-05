import fs from 'node:fs';
import {verifyReportSectionComposition} from '../functions/personal-reading/narrative/report-section-semantic-verifier.js';

const path='docs/reports/ziwei/production-admission/zwr-pro-w10-live-campaign.json';
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
 attemptLog:internal?.attemptLog||[],
 verificationAccepted:verification?.accepted??null,
 verificationReasons:verification?.reasons||[],
 semanticReviewReasons:verification?.semanticReview?.reasons||[],
 semanticReviewPresent:Boolean(verification?.semanticReview),
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
