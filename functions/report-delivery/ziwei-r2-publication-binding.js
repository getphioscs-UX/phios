import manifest from '../../content/reports/shared/report-visual-assets-r2.json';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {ZWR_R13_PRINT_CORRECTION} from '../../assets/customer-ui/js/personal-products/ziwei-vfr-r1-styles.js';
import {reportBirthInputFingerprint,assertReportSubjectBinding} from '../canonical-presentation-runtime/report-cover-subject.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
export const ZWR_R13_PUBLICATION_VERSION='ZWR-R13-R2-PUBLICATION-1';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
export function ziweiPhysicalPageMap(plan){
 const b=manifest.reports.ZWR.nativeBindings,out=[];
 for(const p of plan){
  if(p.pageFamily==='SECTION_MASTER'&&b.bodyOnlySections.includes(p.sectionId))continue;
  if(p.pageFamily==='OVERVIEW')out.push({pageKey:b.overviewMaster,pageFamily:'R2_OVERVIEW_MASTER'});
  out.push({...p,pageNumber:out.length+1});
 }
 return out.map((p,i)=>({...p,pageNumber:i+1}));
}
export async function ziweiR2PublicationBinding(candidate){
 const c=candidate.snapshot.semanticContent;
 return {version:ZWR_R13_PUBLICATION_VERSION,visualRegistryDigest:await sha256Stable(manifest),physicalPageMapDigest:await sha256Stable(ziweiPhysicalPageMap(c.vfrPagePlan)),sourcePagePlanDigest:await sha256Stable(c.vfrPagePlan),printCorrectionDigest:await sha256Stable(ZWR_R13_PRINT_CORRECTION)};
}
// A versioned presentation projection of an existing native manuscript snapshot.
// It does not compute charts, compose copy, call a Provider or grant release.
export async function bindZiweiR13Publication(candidate){
 const result=structuredClone(candidate);
 result.snapshot=await createCustomerDeliverySnapshot({...result.snapshot,semanticContent:{...result.snapshot.semanticContent,vfrR2PublicationBinding:await ziweiR2PublicationBinding(result)}});
 await assertZiweiR2PublicationBinding(result);
 return result;
}
export async function assertZiweiR2PublicationBinding(candidate){
 const c=candidate.snapshot.semanticContent;
 if(JSON.stringify(c.vfrR2PublicationBinding)!==JSON.stringify(await ziweiR2PublicationBinding(candidate)))fail('ZWR_R2_PUBLICATION_BINDING_MISMATCH');
 // Frozen review fixtures are explicitly not a claim about a new Profile.
 if(candidate.schemaVersion==='ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1')return;
 const p=c.subject,input=c.vfrInputSnapshot;
 if(!input||!p||candidate.canonicalInputDigest!==await sha256Stable(input)||c.vfrLineage.canonicalInputDigest!==candidate.canonicalInputDigest||c.vfrLineage.calculationDigest!==await sha256Stable(c.evidence))fail('ZWR_PROFILE_CALCULATION_BINDING_REQUIRED');
 if(await reportBirthInputFingerprint(input)!==p.canonicalBirthInputFingerprint)fail('ZWR_PROFILE_BIRTH_CONTEXT_MISMATCH');
 await assertReportSubjectBinding({presentation:p,expectedBinding:c.subjectBinding});
 if(p.subjectReference!==candidate.personId||c.evidence.subjectId!==candidate.personId||c.evidence.inputFingerprint!==candidate.snapshot.inputFingerprint)fail('ZWR_PROFILE_SUBJECT_MISMATCH');
 if(!c.evidence.targetContext||await sha256Stable(c.evidence.targetContext)!==await sha256Stable(c.vfrObservationContext))fail('ZWR_OBSERVATION_CONTEXT_MISMATCH');
}
export {manifest as ziweiR2VisualManifest};
