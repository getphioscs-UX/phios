import {createHdrInternalValidationReportRuntime} from '../professional/hdr-internal/hdr-internal-validation-report-runtime.js';
import {loadCanonicalPersonSubject,personIdentity} from '../account/canonical-person-store.js';
import {buildHdrIntakeCalculationReference} from '../external-profile/hdr-intake-calculation-reference.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {HD_REPORT_SOURCE_POLICY} from './hd-report-source-policy-r1.js';
// Use the existing PHI OS calculation owner. Never relabel an internal result as
// a customer-confirmed external Chart, or manufacture Variable/PHS precision.
export async function prepareHdOwnedReportSourceR4(context,{ownerAccountId,personId}){
 if(personIdentity(context).userId!==ownerAccountId)throw Object.assign(Error('HD_OWNED_SOURCE_ACCOUNT_MISMATCH'),{status:403});
 const subject=await loadCanonicalPersonSubject(context.env,ownerAccountId,personId);
 let nativeReport;
 const reference=await buildHdrIntakeCalculationReference({canonicalBirthInput:subject.canonicalBirthInput,requestId:'HD-R4:'+personId+':'+subject.personVersion,runtimeFactory:()=>{const runtime=createHdrInternalValidationReportRuntime();return {async generate(request){nativeReport=await runtime.generate(request);return nativeReport;}};}});
 const full17Facts=projectHdOwnedFactsR4(nativeReport);
 const inputDigest=await sha256Stable(subject.canonicalBirthInput);
 return {version:'HD-PHIOS-CALCULATED-REPORT-SOURCE-R4-CONTEXT-1',sourceKind:'PHIOS_INTERNAL_CALCULATION',subjectBinding:{ownerAccountId,personId,personVersion:subject.personVersion,inputDigest},methodConsentRef:subject.methodConsent.consentId,reportConsentRef:subject.reportConsent.consentId,reference,full17Facts,calculationEvidence:nativeReport.calculationEvidence,referenceDigest:await sha256Stable(reference),full17PublisherInputReady:false,customerPublicationAllowed:false,commercialAdmission:false,missing:['CURRENT_SUBJECT_FULL17_MANUSCRIPT_AND_PUBLISHER_BINDING'],resourcePolicy:HD_REPORT_SOURCE_POLICY};
}

// Exact source projection, not an invented complete Chart or BodyGraph.
export function projectHdOwnedFactsR4(report){
 if(report?.schemaVersion!=='PHI-OS-HDR-INTERNAL-PROFESSIONAL-VALIDATION-REPORT-v1.0.0')throw Error('HD_OWNED_NATIVE_REPORT_REQUIRED');
 const sections=new Map(report.sections.map(s=>[s.sectionCode,s]));
 const get=key=>sections.get(key)?.content;
 const facts={typeCode:get('type')?.typeCode,authority:get('authority')?.authorityCode,profile:get('profile')?.profile,definition:get('definition')?.definition,definedCenters:get('centers')?.definedCenters,undefinedCenters:get('centers')?.undefinedCenters,channelCodes:get('channels')?.channels,activations:get('key_gates')?.activations,incarnationConfiguration:get('chart_overview')?.incarnationConfiguration};
 const sourcePaths={typeCode:'type.typeCode',authority:'authority.authorityCode',profile:'profile.profile',definition:'definition.definition',definedCenters:'centers.definedCenters',undefinedCenters:'centers.undefinedCenters',channelCodes:'channels.channels',activations:'key_gates.activations',incarnationConfiguration:'chart_overview.incarnationConfiguration'};
 const unknown=[...sections.values()].filter(s=>s.status==='UNKNOWN').map(s=>({section:s.sectionCode,reason:s.content.reason}));
 return {version:'HD-OWNED-FULL17-FACT-PROJECTION-R4-1',sourceVisibility:'INTERNAL_ONLY',publicCalculationAdmission:false,facts,sourcePaths,calculationReference:report.calculationReference,unknown,completeFull17OwnerChart:false,precisionAccepted:false,customerPublicationAllowed:false,commercialAdmission:false};
}
