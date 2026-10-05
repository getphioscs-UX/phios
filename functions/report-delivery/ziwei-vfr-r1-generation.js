import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {buildZwrVfrCompactAuthoringPack} from '../personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {composeZwrVfrOneCall} from '../personal-reading/visual-first/ziwei-vfr-one-call-composer.js';
import {buildZwrVfrDiagramData} from '../personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {ZWR_VFR_PAGE_PLAN,validateZwrVfrPagePlan} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';

export const ZIWEI_VFR_R1_GENERATION_VERSION='ZIWEI-VFR-R1-GENERATION-v1';

export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
 const base=await generateZiweiProductionCandidate(context,selection,deps);
 const evidence=base.snapshot?.semanticContent?.evidence;
 if(!evidence)throw Error('ZWR_VFR_CANONICAL_EVIDENCE_REQUIRED');
 const pack=await buildZwrVfrCompactAuthoringPack({evidence,realityContext:selection?.realityContext||null});
 const composed=await composeZwrVfrOneCall({pack,env:context?.env||{},fetcher:deps.fetcher||globalThis.fetch,cache:deps.cache||null});
 if(composed.status!=='PASS')throw Object.assign(new Error('ZWR_VFR_COMPOSITION_UNAVAILABLE'),{details:composed.plan||null});
 const diagrams=await buildZwrVfrDiagramData({evidence});
 const pagePlan=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id)});
 if(!pagePlan.accepted||pagePlan.pageCount!==47)throw Object.assign(new Error('ZWR_VFR_PUBLICATION_PLAN_INVALID'),{details:pagePlan});
 return {
  ...base,
  schemaVersion:'ZWR-VFR-R1-CANDIDATE-1',
  snapshot:{
   ...base.snapshot,
   semanticContent:{
    ...base.snapshot.semanticContent,
    visualReportIr:composed.reportIr,
    vfrCompactAuthoringPackDigest:pack.authorityDigest,
    vfrDiagramData:diagrams,
    vfrPagePlan:ZWR_VFR_PAGE_PLAN
   }
  },
  generationSuccessor:ZIWEI_VFR_R1_GENERATION_VERSION,
  providerAuthority:'WRITING_ONLY',
  naturalCompositionSummary:{
   providerCalls:composed.providerCalls,
   semanticReviewCalls:composed.semanticReviewCalls,
   cacheHit:composed.cacheHit,
   estimatedProviderCost:composed.reportIr?.providerUsage?.estimatedProviderCost??null
  },
  visualFirst:true,
  physicalPageCount:47,
  deterministicDiagramCount:15,
  productionAdmissionGranted:true
 };
}
export default Object.freeze({generateZiweiVfrR1Candidate,ZIWEI_VFR_R1_GENERATION_VERSION});
