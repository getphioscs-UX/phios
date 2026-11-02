import {renderZwrVfrReview,ZWR_VFR_RENDERER_VERSION} from '../../assets/customer-ui/js/personal-products/ziwei-vfr-r1-pages.js';
import {ZWR_VFR_STYLES} from '../../assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';
import {ZIWEI_VFR_R1_GENERATION_VERSION} from './ziwei-vfr-r1-version.js';
import {ZWR_VFR_METHOD_PROFILE} from './ziwei-vfr-profile-policy.js';
import {buildZwrVfrDiagramData} from '../personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {renderPublicationReport} from '../../assets/customer-ui/js/personal-products/publication-report-pages.js';
import {finalizeZiweiNavigation} from '../canonical-presentation-runtime/ziwei-navigation-finalization.js';

export const HISTORICAL_ZIWEI_PAGE_COUNTS=Object.freeze({'ZIWEI-PRODUCTION-COMPOSER-V1':33,'ZIWEI-NATURAL-COMPOSER-R4':33,'ZIWEI-PROFESSIONAL-SYNTHESIS-R5':39,'ZIWEI-CONTEXTUAL-RCA-R1':41});
const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
export function resolveMethodRenderContract(candidate){
 const snapshot=candidate?.snapshot,c=snapshot?.semanticContent,version=snapshot?.compositionVersion;
 if(snapshot?.methodId!=='ZWR'||!['en','zh-Hans'].includes(candidate.locale))fail('METHOD_RENDER_CONTRACT_UNADMITTED');
 if(version===ZIWEI_VFR_R1_GENERATION_VERSION){
  if(candidate.generationSuccessor!==version||candidate.naturalCompositionSummary?.completenessStatus!=='PASS'||candidate.naturalCompositionSummary?.semanticReviewCalls!==0)fail('ZWR_VFR_GENERATION_INCOMPLETE');
  if(!c?.visualReportIr||!c.vfrDiagramData||!Array.isArray(c.vfrPagePlan)||!c.vfrPublicationFit||c.visualReportIr.methodId!=='ZWR'||c.visualReportIr.localeMode!=='BILINGUAL')fail('ZIWEI_VFR_GENERATION_RENDERER_MISMATCH');
  const subject=c.visualReportIr.subjectBinding;
  if(subject?.subjectId!==candidate.personId||subject.inputFingerprint!==snapshot.inputFingerprint)fail('ZWR_VFR_SUBJECT_MISMATCH');
  const ids=c.vfrDiagramData.diagrams?.map(d=>d.id)||[];
  if(ids.length!==15||new Set(ids).size!==15)fail('ZWR_VFR_DIAGRAM_REGISTRY_INVALID');
  const checked=validateZwrVfrPagePlan({diagramIds:ids,pages:c.vfrPagePlan,sections:c.visualReportIr.sections});
  if(!checked.accepted||JSON.stringify(c.vfrPagePlan)!==JSON.stringify(buildZwrVfrPagePlan({sections:c.visualReportIr.sections}))||JSON.stringify(c.vfrPublicationFit)!==JSON.stringify(checked.fitProfile))fail('ZWR_VFR_PAGE_PLAN_INVALID');
  return {methodCode:'ZWR',compositionVersion:version,rendererId:'ZIWEI_VFR',requiresBoundMaterialIdentity:true,rendererVersion:ZWR_VFR_RENDERER_VERSION,publicationVersion:c.visualReportIr.schemaVersion,pagePlanVersion:ZWR_VFR_PAGE_PLAN_VERSION,expectedPageCount:c.vfrPagePlan.length,expectedPageRule:'vfrPagePlan.length',requiredDiagramIds:ids,verificationMode:'ZWR_VFR_PHYSICAL_PAGE_CONTRACT_V1',pageSelector:'main.report-root > .zv-page',styles:ZWR_VFR_STYLES,safeLimits:{maxRequestBytes:8000000},renderFunction:()=>renderZwrVfrReview({reportIr:c.visualReportIr,diagramData:c.vfrDiagramData,pagePlan:c.vfrPagePlan})};
 }
 const expectedPageCount=HISTORICAL_ZIWEI_PAGE_COUNTS[version];
 // Never fall back to legacy publication for a VFR payload with an old version.
 if(c?.visualReportIr||c?.vfrPagePlan)fail('ZIWEI_VFR_GENERATION_RENDERER_MISMATCH');
 if(!expectedPageCount||c?.report?.totalPages!==expectedPageCount)fail('METHOD_RENDER_CONTRACT_UNADMITTED');
 return {methodCode:'ZWR',compositionVersion:version,rendererId:'ZIWEI_HISTORICAL',requiresBoundMaterialIdentity:false,rendererVersion:'METHOD_BROWSER_VERIFICATION_V1',publicationVersion:version,expectedPageCount,expectedPageRule:'HISTORICAL_METHOD_VERSION',requiredDiagramIds:[],verificationMode:'DOM_PHYSICAL_PAGE_CONTRACT_V1',pageSelector:'main .pub-report > .pub-static, main .pub-report > .pub-page',safeLimits:{maxRequestBytes:8000000},renderFunction:()=>finalizeZiweiNavigation(renderPublicationReport(c.report),candidate.locale)};
}
export const resolveMethodDeliveryDelta=resolveMethodRenderContract;
export function assertMethodRenderReceipt(candidate,receipt){
 const contract=resolveMethodRenderContract(candidate);
 if(!receipt||receipt.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||receipt.passed!==true||receipt.pageCount!==contract.expectedPageCount||receipt.brokenImages!==0||receipt.overflowCount!==0||receipt.errorCount!==0)fail('REPORT_RENDER_VERIFICATION_REQUIRED');
 if(contract.rendererId==='ZIWEI_VFR'&&(receipt.rendererVersion!==contract.rendererVersion||receipt.compositionVersion!==contract.compositionVersion||receipt.verificationMode!==contract.verificationMode||receipt.pageSequenceValid!==true||receipt.hiddenOrZeroGeometryCount!==0||receipt.hiddenRequiredContentCount!==0||receipt.expectedPageCount!==contract.expectedPageCount||receipt.actualPageCount!==contract.expectedPageCount||receipt.snapshotId!==candidate.snapshot.semanticSnapshotId||receipt.pagePlanDigest!==candidate.snapshot.semanticContent.vfrLineage?.pagePlanDigest||receipt.diagramRegistryValid!==true||receipt.undefinedText!==false))fail('REPORT_RENDER_VERIFICATION_REQUIRED');
 return contract;
}
export async function methodMaterialIdentity(candidate,receipt){
 const contract=assertMethodRenderReceipt(candidate,receipt);
 return {materialSchemaVersion:'METHOD_PRIVATE_RELEASED_MATERIAL_V2',ownerAccountId:candidate.customerId,subjectId:candidate.personId,purchaseId:candidate.purchaseId,releaseStatus:'ACTIVE',generationVersion:candidate.generationSuccessor||contract.compositionVersion,profileVersion:candidate.snapshot.semanticContent.vfrLineage?.profileVersion||null,publicationIrDigest:candidate.snapshot.semanticContent.visualReportIr?.publicationIrDigest||null,pagePlanDigest:candidate.snapshot.semanticContent.vfrLineage?.pagePlanDigest||null,diagramDigest:candidate.snapshot.semanticContent.vfrDiagramData?.diagramDataDigest||null,outputDigest:receipt.outputDigest,methodCode:contract.methodCode,compositionVersion:contract.compositionVersion,publicationVersion:contract.publicationVersion,rendererVersion:contract.rendererVersion,presentationMode:contract.rendererId==='ZIWEI_VFR'?'BILINGUAL':candidate.locale,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,semanticDigest:await sha256Stable(candidate.snapshot.semanticContent),manuscriptDigest:candidate.snapshot.semanticContent.vfrDeepManuscriptDigest||null,pagePlanVersion:contract.pagePlanVersion||null};
}

export async function assertMethodGeneration(candidate){
 const contract=resolveMethodRenderContract(candidate),s=candidate.snapshot;
 const {createCustomerDeliverySnapshot}=await import('../personal-reading/narrative/report-section-snapshot.js');
 if((await createCustomerDeliverySnapshot(s)).semanticSnapshotId!==s.semanticSnapshotId)fail('METHOD_SEMANTIC_SNAPSHOT_TAMPERED');
 if(contract.rendererId==='ZIWEI_VFR'){
  const c=s.semanticContent;
  if(c.vfrLineage?.profileVersion!==ZWR_VFR_METHOD_PROFILE.profileVersion||c.vfrLineage?.rendererContractVersion!==ZWR_VFR_METHOD_PROFILE.rendererContractVersion||c.vfrLineage?.pagePlanDigest!==await sha256Stable(c.vfrPagePlan)||JSON.stringify(await buildZwrVfrDiagramData({evidence:c.evidence}))!==JSON.stringify(c.vfrDiagramData))fail('METHOD_PUBLICATION_LINEAGE_MISMATCH');
  const {publicationIrDigest,...ir}=c.visualReportIr,{diagramDataDigest,...diagrams}=c.vfrDiagramData;
  if(await sha256Stable(ir)!==publicationIrDigest||await sha256Stable(diagrams)!==diagramDataDigest)fail('METHOD_PUBLICATION_DIGEST_MISMATCH');
  if(diagrams.subjectId!==candidate.personId||diagrams.inputFingerprint!==s.inputFingerprint||ir.sourceResultDigest!==c.vfrDeepManuscriptDigest||ir.authorityDigest!==c.vfrCompactAuthoringPackDigest)fail('METHOD_PUBLICATION_LINEAGE_MISMATCH');
  const ids=c.vfrPagePlan.filter(p=>p.pageFamily==='SECTION_MASTER').map(p=>p.sectionId);
  if(ir.sections.length!==ids.length||new Set(ir.sections.map(x=>x.sectionId)).size!==ids.length)fail('METHOD_SOURCE_SECTION_COVERAGE_INCOMPLETE');
  for(const id of ids){
   const section=ir.sections.find(x=>x.sectionId===id);
   if(!section?.authorityRefs?.length)fail('METHOD_SOURCE_COVERAGE_REQUIRED');
   for(const locale of ['zhHans','en']){
    const copy=section[locale],expected=String(copy?.manuscript||'').trim().split(/\n\s*\n/u).map(x=>x.trim()).filter(Boolean);
    if(!expected.length||JSON.stringify(copy?.paragraphs)!==JSON.stringify(expected))fail('METHOD_MANUSCRIPT_SPAN_COVERAGE_INCOMPLETE');
   }
  }
 }
 return contract;
}
export function assertMethodPresentationMode(methodCode,mode){
 if(['PROFILE','FINANCIAL','WILL'].includes(methodCode)&&mode!=='BILINGUAL')fail('METHOD_BILINGUAL_ONLY');
}
