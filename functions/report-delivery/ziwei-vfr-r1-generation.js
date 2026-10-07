import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {buildZwrVfrCompactAuthoringPack} from '../personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {resolveAcceptedZwrVfrDeepManuscript} from '../personal-reading/visual-first/ziwei-vfr-accepted-deep-manuscript-registry.js';
import {buildZwrVfrDeepPublicationIr} from '../personal-reading/visual-first/ziwei-vfr-deep-publication.js';
import {buildZwrVfrDiagramData} from '../personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';

export const ZIWEI_VFR_R1_GENERATION_VERSION='ZIWEI-VFR-R1-DEEP-REGISTRY-GENERATION-v2';

function unavailable(code,details=null){
 const error=new Error(code);
 error.code=code;
 error.status=503;
 if(details)error.details=details;
 throw error;
}

export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
 const base=await generateZiweiProductionCandidate(context,selection,deps);
 const evidence=base.snapshot?.semanticContent?.evidence;
 if(!evidence)unavailable('ZWR_VFR_CANONICAL_EVIDENCE_REQUIRED');

 const pack=await buildZwrVfrCompactAuthoringPack({
  evidence,
  realityContext:selection?.targetContext||selection?.realityContext||null
 });

 const accepted=resolveAcceptedZwrVfrDeepManuscript(pack.authorityDigest);
 const repairedResult=accepted.repairedResult;
 if(repairedResult?.status!=='PASS')unavailable('ZWR_VFR_ACCEPTED_MANUSCRIPT_INVALID',{manuscriptId:accepted.manuscriptId});
 if(repairedResult.authorityDigest!==pack.authorityDigest)unavailable('ZWR_VFR_ACCEPTED_MANUSCRIPT_AUTHORITY_DRIFT',{manuscriptId:accepted.manuscriptId});

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
  schemaVersion:'ZWR-VFR-R1-DEEP-REGISTRY-CANDIDATE-v2',
  snapshot:{
   ...base.snapshot,
   semanticContent:{
    ...base.snapshot.semanticContent,
    visualReportIr:reportIr,
    vfrCompactAuthoringPackDigest:pack.authorityDigest,
    vfrAcceptedManuscriptId:accepted.manuscriptId,
    vfrAcceptedManuscriptDigest:accepted.resultDigest,
    vfrDiagramData:diagrams,
    vfrPagePlan:pages,
    vfrPublicationFit:pageCheck.fitProfile
   }
  },
  generationSuccessor:ZIWEI_VFR_R1_GENERATION_VERSION,
  providerAuthority:'ACCEPTED_MANUSCRIPT_REGISTRY_ONLY',
  naturalCompositionSummary:{
   providerCalls:0,
   semanticReviewCalls:0,
   cacheHit:true,
   manuscriptSource:'HUMAN_ACCEPTED_DEEP_MANUSCRIPT',
   manuscriptId:accepted.manuscriptId,
   historicalAuthoringProviderCost:repairedResult.providerUsage?.totalEstimatedProviderCost??null
  },
  visualFirst:true,
  physicalPageCount:pages.length,
  deterministicDiagramCount:15,
  productionAdmissionGranted:true
 };
}
export default Object.freeze({generateZiweiVfrR1Candidate,ZIWEI_VFR_R1_GENERATION_VERSION});
