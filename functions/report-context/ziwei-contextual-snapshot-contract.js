import {assertReportRealityBrief,fail} from './report-context-admission.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export async function assertZiweiContextSnapshot(candidate){
 const s=candidate.snapshot.semanticContent,c=s.reportContext;
 await assertReportRealityBrief(c?.authorityLanes?.currentReality,{ownerAccountId:candidate.customerId,personId:candidate.personId,reportProductId:'COM-REPORT-ZIWEI-FULL',methodId:'ZWR'});
 if(s.report.totalPages!==41||s.report.pages.length!==35||c.canonicalMethodDigest!==await sha256Stable({sections:s.sections,evidence:s.evidence})||s.report.pages.filter(p=>p.contextualTrace).length!==2||s.report.pages.some(p=>p.contextualTrace&&!p.visualBinding.bodyUrl))fail('CONTEXTUAL_REPORT_AUTHORITY_UNAVAILABLE',503);
}
