import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {buildZiweiReportEvidence} from '../personal-reading/narrative/ziwei-publication-adapter.js';
import {buildZwrVfrCompactAuthoringPack} from '../personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {resolveZiweiLiveTargetContext} from '../zi-wei-full-production/ziwei-live-target-context-runtime.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
const fail=()=>{throw Object.assign(Error('ZWR_REFERENCE_CALCULATION_AUTHORITY_MISMATCH'),{code:'ZWR_REFERENCE_CALCULATION_AUTHORITY_MISMATCH',status:409});};
// Review-file compatibility only, never a new-customer source admission. Keep
// original digests; compare all native facts after removing this exact list of
// locale/display-only fields. Nothing else can be normalized away.
function facts(e){const x=structuredClone(e);delete x.targetContext.schemaVersion;delete x.targetContext.presentation;delete x.targetContext.governance;
 for(const k of ['readingDigest','reportDigest','interactiveSurfaceDigest','topicReadingDigest'])delete x.sourceDigests[k];
 for(const t of x.timing||[]){if(t.focus){delete t.focus.natalDomainLabel;delete t.focus.lifeBranchLabel;}}return x;}
function packFacts(p){const x=structuredClone(p);delete x.authorityDigest;delete x.subjectBinding.targetContext.schemaVersion;delete x.subjectBinding.targetContext.presentation;delete x.subjectBinding.targetContext.governance;for(const k of ['readingDigest','reportDigest','interactiveSurfaceDigest','topicReadingDigest'])delete x.subjectBinding.sourceDigests[k];if(x.realityContext&&Object.values(x.realityContext).every(v=>v===''))x.realityContext=null;return x;}
export async function assertZiweiReferenceJobAuthority(context,job,candidate){
 if(context.env.PHIOS_ENVIRONMENT!=='local'||context.env.REPORT_ZERO_COST_REPLAY!=='true'||candidate.schemaVersion!=='ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1'||candidate.productionAdmissionGranted!==false)fail();
 const subject=await loadCanonicalPersonSubject(context.env,job.ownerAccountId,job.personId);if(subject.personVersion!==job.personVersion)fail();const locale=job.presentation.reportLocale==='bilingual'?'zh-Hans':job.presentation.reportLocale,input={...subject.canonicalBirthInput,locale},targetContext=resolveZiweiLiveTargetContext(job.methodInputs.targetContext);
 const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:input.consent.purposeCode,canonicalInput:input,executionParameters:{traditionalCalculationSex:subject.calculationSex},consentRecordId:subject.methodConsent.consentId,requestId:'ZWR-PAID-PREFLIGHT:'+job.personId+':'+subject.personVersion};
 const current=(await buildZiweiReportEvidence({subjectId:job.personId,executionRequest:request,targetContext,locale})).structured,reference=candidate.snapshot.semanticContent.evidence;
 const a=await buildZwrVfrCompactAuthoringPack({evidence:reference}),b=await buildZwrVfrCompactAuthoringPack({evidence:current,realityContext:targetContext});
 if(a.authorityDigest!==candidate.snapshot.semanticContent.vfrCompactAuthoringPackDigest||b.authorityDigest!==job.authorityDigest||await sha256Stable(facts(reference))!==await sha256Stable(facts(current))||await sha256Stable(packFacts(a))!==await sha256Stable(packFacts(b)))fail();
 return Object.freeze({schemaVersion:'ZWR-REFERENCE-AUTHORITY-COMPATIBILITY-1',scope:'LOCAL_SAME_SUBJECT_FROZEN_REFERENCE_ONLY',referenceAuthorityDigest:a.authorityDigest,currentAuthorityDigest:b.authorityDigest,referenceEvidenceDigest:await sha256Stable(reference),currentEvidenceDigest:await sha256Stable(current),nativeFactDigest:await sha256Stable(facts(current)),authoringFactDigest:await sha256Stable(packFacts(b)),providerEvidenceRelabeled:false,newCustomerAdmission:false});
}
