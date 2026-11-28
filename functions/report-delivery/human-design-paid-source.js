import {sealCanonicalPersonReportSource,openCanonicalPersonReportSource} from '../account/canonical-person-store.js';
import {normalizeConfirmedHumanDesignContextProfile,buildConfirmedHumanDesignContextTransport} from '../external-profile/human-design-context-transport.js';
import {EXTERNAL_PROFILE_CORE_FIELDS,EXTERNAL_PROFILE_STRUCTURAL_FIELDS} from '../external-profile/external-profile-confirmation.js';
import {EXTERNAL_PROFILE_MANUAL_FIELDS} from '../external-profile/external-profile-contract.js';
import {loadCanonicalPersonSubject,personIdentity} from '../account/canonical-person-store.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {buildHdReportGenerationContext,prepareHdReportRequest} from './hd-report-generation-context-r1.js';
const sourceType='HD_CUSTOMER_CONFIRMED_EXTERNAL_CHART';
const fields=new Set([...EXTERNAL_PROFILE_CORE_FIELDS,...EXTERNAL_PROFILE_STRUCTURAL_FIELDS,...EXTERNAL_PROFILE_MANUAL_FIELDS]);
function externalSource(profile){const normalized=normalizeConfirmedHumanDesignContextProfile(profile);if(normalized.records.some(r=>!fields.has(r.field)||/PHIOS_HDR_INTERNAL|INTERNAL_CALCULATION|CALCULATED_REFERENCE/.test(String(r.sourceType)+' '+String(r.priorSource))))throw Error('HD_PAID_SOURCE_EXTERNAL_ONLY_REQUIRED');return normalized;}
export async function prepareOwnedHumanDesignReportSource(context,{personId,confirmedExternalProfile,sourceUseConsent}){
 const profile=externalSource(confirmedExternalProfile);
 const sourceToken=await sealCanonicalPersonReportSource(context,{personId,sourceType,sourceSnapshot:profile,sourceUseConsent});
 return Object.freeze({methodCode:'HD',personId,profileDigest:profile.profileDigest,sourceToken,chartAuthority:'CUSTOMER_CONFIRMED_EXTERNAL_ONLY',commercialAdmission:false});
}
export async function loadOwnedHumanDesignReportSource(context,{personId,sourceToken,locale='en'}){
 const owned=await openCanonicalPersonReportSource(context,{personId,sourceType,token:sourceToken});
 const profile=externalSource(owned.sourceSnapshot);
 if(!Number.isFinite(Date.parse(profile.confirmedAt)))throw Error('HD_CONFIRMED_SOURCE_TIME_REQUIRED');
 const transport=buildConfirmedHumanDesignContextTransport(profile,{locale,generatedAt:profile.confirmedAt});
 return Object.freeze({...owned,profileDigest:profile.profileDigest,transport,chartAuthority:'CUSTOMER_CONFIRMED_EXTERNAL_ONLY',fullReportPublicationAdmitted:false});
}

// Current-report internal calculation successor. The external-chart contract
// above remains intact for its existing callers. Source/evidence must come from
// a trusted server loader, never Account request JSON or another subject.
export async function prepareOwnedHumanDesignReportRequest(context,{job,ownedSource,calculationEvidence,sectionIds,model,maxOutputTokens,schema,explicitBackground=null}){
 if(!['local','qa'].includes(context.env?.PHIOS_ENVIRONMENT))throw Error('HD_REPORT_REQUEST_LOCAL_QA_ONLY');
 if(job?.methodCode!=='HD'||job.productId!=='COM-REPORT-HD-FULL')throw Error('HD_REPORT_REQUEST_METHOD_MISMATCH');
 if(personIdentity(context).userId!==job?.ownerAccountId)throw Error('HD_REPORT_REQUEST_OWNER_MISMATCH');
 const subject=await loadCanonicalPersonSubject(context.env,job.ownerAccountId,job.personId);
 if(subject.personVersion!==job.personVersion||await sha256Stable(subject.canonicalBirthInput)!==job.inputDigest||ownedSource?.methodConsentRef!==subject.methodConsent.consentId||ownedSource?.reportConsentRef!==subject.reportConsent.consentId)throw Error('HD_REPORT_REQUEST_SUBJECT_CONSENT_MISMATCH');
 const authorityPack=await buildHdReportGenerationContext({ownedSource,calculationEvidence,subjectBinding:{ownerAccountId:job.ownerAccountId,personId:job.personId,personVersion:job.personVersion,inputDigest:job.inputDigest},locale:job.presentation?.reportLocale,explicitBackground});
 const request=await prepareHdReportRequest({authorityPack,sectionIds,model,maxOutputTokens,schema});
 return {authorityPack,request,execution:'NOT_DISPATCHED',providerCalls:0,commercialAdmission:false};
}
