import {cachedMethodDelivery,methodCacheIdentity} from './method-delivery-cache.js';
import {requireZwrVfrProfile,requireZwrVfrGenerationAdmission} from './ziwei-vfr-profile-policy.js';
import {planZwrFiveCallExperiment,zwrVfrPromptIdentity} from '../personal-reading/visual-first/ziwei-vfr-five-call-composer.js';
import {assertVfrLiveAllowed} from '../personal-reading/visual-first/report-provider-budget.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {generateZiweiProductionCandidate} from './ziwei-production-generation-v1.js';
import {buildZwrVfrCompactAuthoringPack} from '../personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {composeZwrVfrProductionDeepManuscript} from '../personal-reading/visual-first/ziwei-vfr-production-deep-composer.js';
import {buildZwrVfrDeepPublicationIr} from '../personal-reading/visual-first/ziwei-vfr-deep-publication.js';
import {buildZwrVfrDiagramData} from '../personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';

import {ZIWEI_VFR_R1_GENERATION_VERSION} from './ziwei-vfr-r1-version.js';
export {ZIWEI_VFR_R1_GENERATION_VERSION} from './ziwei-vfr-r1-version.js';

function unavailable(code,details=null){
 const error=new Error(code);
 error.code=code;
 error.status=503;
 if(details)error.details=details;
 throw error;
}

export async function generateZiweiVfrR1Candidate(context,selection,deps={}){
 const profile=requireZwrVfrProfile(deps.methodProfile);
 const base=await generateZiweiProductionCandidate(context,selection,deps);
 const evidence=base.snapshot?.semanticContent?.evidence;
 if(!evidence)unavailable('ZWR_VFR_CANONICAL_EVIDENCE_REQUIRED');

 const pack=await buildZwrVfrCompactAuthoringPack({
  evidence,
  realityContext:selection?.targetContext||selection?.realityContext||null
 });

 const plan=planZwrFiveCallExperiment({pack});
 if(!plan.allowed)unavailable('ZWR_VFR_GENERATION_PLAN_BLOCKED');
 const semanticKey=await methodCacheIdentity({schemaVersion:'METHOD_SEMANTIC_CACHE_KEY_V1',methodCode:profile.methodCode,productId:profile.productId,generationVersion:profile.generationVersion,profileVersion:profile.profileVersion,subjectId:base.personId,birthSourceRef:base.birthSourceRef,canonicalInputDigest:base.canonicalInputDigest,calculationDigest:await sha256Stable(evidence),authorityDigest:pack.authorityDigest,realityContext:selection?.targetContext||null,presentationMode:profile.presentationMode,locale:base.locale,promptIdentity:await zwrVfrPromptIdentity(),generationPlan:plan});
 const semantic=await cachedMethodDelivery(context.env,{ownerAccountId:base.customerId,kind:'SEMANTIC',key:semanticKey,beforeClaim:async()=>{assertVfrLiveAllowed(context.env||{});if(!deps.fetcher||context.env.PHIOS_ENVIRONMENT!=='local')await requireZwrVfrGenerationAdmission(context.env);},
  validate:async value=>{if(value.status!=='PASS'||value.repairedResult?.authorityDigest!==pack.authorityDigest||value.completeness?.status!=='PASS')unavailable('METHOD_SEMANTIC_CACHE_INVALID');},
  produce:async()=>{
   // Only a cache miss can cross the paid-provider gate. Rights and consent were
   // rechecked by the canonical generator before this persistent lookup.
   assertVfrLiveAllowed(context.env||{});
   return composeZwrVfrProductionDeepManuscript({pack,env:context.env||{},fetcher:deps.fetcher||globalThis.fetch});
  }
 });
 const composed=semantic.value;
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
  snapshot:await createCustomerDeliverySnapshot({
   ...base.snapshot,
   createdAt:new Date(0).toISOString(),
   claimIrVersion:profile.publicationIrVersion,
   verifierVersion:profile.rendererContractVersion,
   compositionVersion:ZIWEI_VFR_R1_GENERATION_VERSION,
   semanticContent:{
    ...Object.fromEntries(Object.entries(base.snapshot.semanticContent).filter(([key])=>key!=='report')),
    vfrLineage:{profileVersion:profile.profileVersion,rendererContractVersion:profile.rendererContractVersion,birthSourceRef:base.birthSourceRef,canonicalInputDigest:base.canonicalInputDigest,calculationDigest:await sha256Stable(evidence),pagePlanDigest:await sha256Stable(pages),semanticCacheKey:semanticKey},
    visualReportIr:reportIr,
    vfrCompactAuthoringPackDigest:pack.authorityDigest,
    vfrDeepManuscriptDigest:repairedResult.resultDigest,
    vfrDiagramData:diagrams,
    vfrPagePlan:pages,
    vfrPublicationFit:pageCheck.fitProfile
   }
  }),
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
  productionAdmissionGranted:false,
  productionAdmissionStatus:profile.releaseStatus
 };
}
export default Object.freeze({generateZiweiVfrR1Candidate,ZIWEI_VFR_R1_GENERATION_VERSION});
