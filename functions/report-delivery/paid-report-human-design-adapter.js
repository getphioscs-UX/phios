import {createPendingNativeAdapter} from './paid-report-pending-native-adapter.js';
import {requireFullPublicationOwnerR32} from './full-publication-owner-gate-r32.js';
import {prepareOwnedHumanDesignReportRequest} from './human-design-paid-source.js';
import {prepareHdOwnedReportSourceR4} from './hd-owned-report-source-r4.js';
export function createHumanDesignPendingAdapter(dependencies){
 const adapter=createPendingNativeAdapter({methodCode:'HD',productId:'COM-REPORT-HD-FULL',sourceFamily:'HD_CONFIRMED_EXTERNAL_CHART',sectionCount:17,publicationVerifier:requireFullPublicationOwnerR32},dependencies);
 return Object.freeze({...adapter,async prepareGenerationRequest(context,job,plan){
  if(!['local','qa'].includes(context.env?.PHIOS_ENVIRONMENT))throw Error('HD_REPORT_REQUEST_LOCAL_QA_ONLY');
  if(job?.methodCode!=='HD'||job.productId!=='COM-REPORT-HD-FULL')throw Error('HD_REPORT_REQUEST_METHOD_MISMATCH');
  const load=dependencies.loadOwnedCalculation||async function(c,j){const ownedSource=await prepareHdOwnedReportSourceR4(c,{ownerAccountId:j.ownerAccountId,personId:j.personId});return {ownedSource,calculationEvidence:ownedSource.calculationEvidence};};
  const {ownedSource,calculationEvidence}=await load(context,job);
  return prepareOwnedHumanDesignReportRequest(context,{...plan,job,ownedSource,calculationEvidence});
 }});
}
