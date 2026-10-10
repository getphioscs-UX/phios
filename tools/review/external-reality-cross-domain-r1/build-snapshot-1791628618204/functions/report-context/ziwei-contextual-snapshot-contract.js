import {assertReportRealityBrief,fail} from './report-context-admission.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export async function assertZiweiContextSnapshot(candidate){
 const s=candidate.snapshot.semanticContent,c=s.reportContext;
 await assertReportRealityBrief(c?.authorityLanes?.currentReality,{ownerAccountId:candidate.customerId,personId:candidate.personId,reportProductId:'COM-REPORT-ZIWEI-FULL',methodId:'ZWR'});
 if(s.report.totalPages!==41||s.report.pages.length!==35||c.canonicalMethodDigest!==await sha256Stable({sections:s.sections,evidence:s.evidence})||s.report.pages.filter(p=>p.contextualTrace).length!==2||s.report.pages.some(p=>p.contextualTrace&&!p.visualBinding.bodyUrl))fail('CONTEXTUAL_REPORT_AUTHORITY_UNAVAILABLE',503);
 const brief=c.authorityLanes.currentReality;
 if(c.realityBriefId!==brief.realityBriefId||c.realityBriefDigest!==brief.realityBriefDigest||c.automaticPersistence!==false)fail('CONTEXTUAL_REPORT_AUTHORITY_UNAVAILABLE',503);
 for(const page of s.report.pages.filter(p=>p.contextualTrace)){
  const trace=page.contextualTrace,section=s.sections.find(x=>x.sectionId===trace.reportSectionId);
  const claims=[...(section?.synthesisIr?.claims||[]),...(section?.claims||[])];
  if(trace.realityBriefId!==brief.realityBriefId||trace.knowledgeState!=='CUSTOMER_SELF_REPORTED'||trace.allowedUse!=='CURRENT_COMPARISON'||trace.canonicalReadingRef!==c.authorityLanes.methodAuthority.canonicalSnapshotId||!claims.some(x=>x.claimId===trace.methodClaimRef)||!trace.realityObservationRefs?.length||trace.realityObservationRefs.some(id=>!brief.observations.some(o=>o.observationId===id&&o.sectionId===trace.reportSectionId&&o.comparisonState===trace.comparisonState)))fail('CONTEXTUAL_REPORT_TRACE_INVALID',503);
 }
}
