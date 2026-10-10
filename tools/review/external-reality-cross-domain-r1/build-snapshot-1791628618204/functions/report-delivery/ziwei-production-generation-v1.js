// Separate production-composition successor; delivery remains LOCAL/QA only. No production activation or browser grants.
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {admitPersonUse} from '../account/person-use-policy.js';
import {ownedReportPresentation} from '../commerce/book-commerce-store.js';
import {requirePurchasedReportPresentation} from '../pws/commercial/report-successor-contract.js';
import {buildZiweiReportEvidence} from '../personal-reading/narrative/ziwei-publication-adapter.js';
import {buildZiweiProductionSections} from '../personal-reading/narrative/ziwei-production-composer-v1.js';

import {buildZiweiProductionPublication} from '../personal-reading/ziwei-production-publication-v1.js';
import {createReportSubjectPresentationFromAccountPerson,assertReportSubjectBinding,reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';

export const ZIWEI_PRODUCT='COM-REPORT-ZIWEI-FULL';
export function controlledZiweiIdentity(context){
 if(!['local','qa','preview'].includes(context.env?.PHIOS_ENVIRONMENT))throw Error('ZIWEI_PRODUCTION_DELIVERY_NOT_ADMITTED');
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
 if(!identity)throw Error('ACCOUNT_REQUIRED');return identity;
}
export async function requireZiweiEntitlement(context,locale){
 const identity=controlledZiweiIdentity(context);
 const owned=await ownedReportPresentation(context.env,identity.userId,ZIWEI_PRODUCT);
 const selection=requirePurchasedReportPresentation(owned);
 if(!['en','zh-Hans'].includes(locale)||(selection.reportLocale!==locale&&selection.reportLocale!=='bilingual'))throw Error('PURCHASED_LANGUAGE_MISMATCH');
 return owned;
}

// loadSubject is supplied by the trusted canonical subject owner, never request JSON.
// There is deliberately no substitute person store, login or default QA account.
export async function generateZiweiProductionCandidate(context,{personId,locale},{loadSubject,now=()=>new Date().toISOString()}={}){
 const identity=controlledZiweiIdentity(context),owned=await requireZiweiEntitlement(context,locale);
 if(typeof loadSubject!=='function')throw Error('CANONICAL_SUBJECT_OWNER_NOT_BOUND');
 const record=await loadSubject(identity.userId,personId);
 if(record?.person?.personId!==personId)throw Error('REPORT_PERSON_MISMATCH');
 const accountPerson=admitPersonUse({userId:identity.userId,person:record.person,consent:record.methodConsent,purpose:'PERSONAL_METHOD',requiredFields:['personId','displayName','birthDate','birthTime','birthPlace']});
 admitPersonUse({userId:identity.userId,person:record.person,consent:record.reportConsent,purpose:'REPORT'});
 const input={...record.canonicalBirthInput,locale};
 if(accountPerson.birthDate!==input.birthDate||accountPerson.birthTime!==input.birthTime||JSON.stringify(accountPerson.birthPlace)!==JSON.stringify(input.birthPlace))throw Error('CANONICAL_PERSON_BIRTH_MISMATCH');
 if(input.consent.recordId!==record.methodConsent.consentId)throw Error('CANONICAL_CONSENT_LINEAGE_MISMATCH');
 if(!record.birthSourceRef||!record.targetContext)throw Error('CANONICAL_LINEAGE_REQUIRED');
 const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:input.consent.purposeCode,canonicalInput:input,executionParameters:{traditionalCalculationSex:record.traditionalCalculationSex},consentRecordId:input.consent.recordId,requestId:'ZWR-'+crypto.randomUUID()};
 const evidence=await buildZiweiReportEvidence({subjectId:personId,executionRequest:request,targetContext:record.targetContext,locale});


 const subject=await createReportSubjectPresentationFromAccountPerson({accountPersonReference:accountPerson,canonicalBirthInput:input,birthSourceRef:record.birthSourceRef});
 const identitySeed={subjectReference:personId,displayName:accountPerson.displayName,birthDate:input.birthDate,birthTime:input.birthTime,timeAccuracy:input.timeAccuracy,identitySourceRef:'RDG_ACCOUNT_PERSON_REFERENCE:'+personId,birthSourceRef:record.birthSourceRef};
 const fingerprint=await sha256Stable(identitySeed),binding={...identitySeed,inputSubjectFingerprint:fingerprint,semanticSubjectFingerprint:fingerprint,canonicalBirthInputFingerprint:await reportBirthInputFingerprint(input)};
 await assertReportSubjectBinding({presentation:subject,expectedBinding:binding});
 const sections=await buildZiweiProductionSections({evidence,locale}),report=buildZiweiProductionPublication({evidence,sections,locale,subjectPresentation:subject});
 const snapshot=await createCustomerDeliverySnapshot({methodId:'ZWR',locale,subjectFingerprint:fingerprint,inputFingerprint:evidence.structured.inputFingerprint,compositionVersion:'ZIWEI-PRODUCTION-COMPOSER-V1',authorityVersion:'ZIWEI_PRO_R2_AUTHORITY_V2',claimIrVersion:'REPORT_PUBLICATION_IR_V2',verifierVersion:'ZWR-CONTROLLED-DELIVERY-1',createdAt:now(),semanticContent:{report,sections,evidence:evidence.structured,subjectBinding:binding,subject}});
 return {schemaVersion:'ZWR-PRODUCTION-COMPOSITION-CANDIDATE-1',scope:'CONTROLLED_QA_ONLY',customerId:identity.userId,personId,locale,purchaseId:owned.purchase_id,snapshot,executionReuse:evidence.executionReuse,canonicalInputDigest:await sha256Stable(input),birthSourceRef:record.birthSourceRef,productionAdmissionGranted:false};
}
