import contract from '../../content/reports/shared-report-delivery-e2e-contract-v2.json' with {type:'json'};
import {requireVfrAdmission} from './shared-report-e2e-v2.js';
import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {buildZwrVfrCompactAuthoringPack} from '../personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {composeZwrVfrProductionDeepManuscript} from '../personal-reading/visual-first/ziwei-vfr-production-deep-composer.js';
import {buildZwrVfrDeepPublicationIr} from '../personal-reading/visual-first/ziwei-vfr-deep-publication.js';
import {buildZwrVfrDiagramData} from '../personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';

export const ZIWEI_VFR_R1_GENERATION_VERSION='ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3';

function unavailable(code,details=null){
 const error=new Error(code);
 error.code=code;
 error.status=503;
 if(details)error.details=details;
 throw error;
}

export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
 requireVfrAdmission(contract.profiles['ZWR:'+ZIWEI_VFR_R1_GENERATION_VERSION]);
 const base=await generateZiweiProductionCandidate(context,selection,deps);
 const evidence=base.snapshot?.semanticContent?.evidence;
 if(!evidence)unavailable('ZWR_VFR_CANONICAL_EVIDENCE_REQUIRED');

 const pack=await buildZwrVfrCompactAuthoringPack({
  evidence,
  realityContext:selection?.targetContext||selection?.realityContext||null
 });

 const composed=await composeZwrVfrProductionDeepManuscript({
  pack,
  env:context?.env||{},
  fetcher:deps.fetcher||globalThis.fetch
 });
 if(composed.status!=='PASS')unavailable('ZWR_VFR_PRODUCTION_DEEP_COMPOSITION_UNAVAILABLE',{status:composed.status});

 const repairedResult=composed.repairedResult;
 const reportIr=await buildZwrVfrDeepPublicationIr({pack,repairedResult});
 const diagrams=await buildZwrVfrDiagramData({evidence});
 const pages=buildZwrVfrPagePlan({sections:reportIr.sections});
 const pageCheck=validateZwrVfrPagePlan({
  diagramIds:diagrams.diagrams.map(d=>d.id),
  pages,
  sections:reportIr.sections
 });
 if(!pageCheck.accepted)unavailable('ZWR_VFR_PUBLICATION_PLAN_INVALID',{reasons:pageCheck.reasons});

 return {
  ...base,
  schemaVersion:'ZWR-VFR-R1-AUTO-DEEP-CANDIDATE-v3',
  snapshot:{
   ...base.snapshot,
   semanticContent:{
    ...base.snapshot.semanticContent,
    visualReportIr:reportIr,
    vfrCompactAuthoringPackDigest:pack.authorityDigest,
    vfrDeepManuscriptDigest:repairedResult.resultDigest,
    vfrDiagramData:diagrams,
    vfrPagePlan:pages,
    vfrPublicationFit:pageCheck.fitProfile
   }
  },
  generationSuccessor:ZIWEI_VFR_R1_GENERATION_VERSION,
  providerAuthority:'WRITING_ONLY_AUTOMATIC',
  naturalCompositionSummary:{
   providerCalls:composed.providerCalls,
   repairProviderCalls:composed.repairProviderCalls,
   semanticReviewCalls:0,
   estimatedProviderCost:composed.estimatedProviderCost,
   completenessStatus:composed.completeness.status
  },
  visualFirst:true,
  physicalPageCount:pages.length,
  deterministicDiagramCount:15,
  productionAdmissionGranted:false
 };
}
export default Object.freeze({generateZiweiVfrR1Candidate,ZIWEI_VFR_R1_GENERATION_VERSION});
