import {personIdentity,loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {verifyCustomerReportSource} from './paid-report-customer-source-contract.js';

const stages=['prepare','generate','validate','compile','render','release','reconcile','verifyDelivered'];
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};

// A handoff boundary for existing native owners, not another generation engine.
// Deliberately not installed in PAID_REPORT_METHODS. Until the native owner and
// publication are signed off this adapter cannot create shared-core paid jobs.
export function createPendingNativeAdapter({methodCode,productId,sourceFamily,sectionCount,publicationVerifier},{publicationVersion,requiredSectionIds,loadSource,nativeOwner}={}){
 if(!publicationVersion||typeof loadSource!=='function'||!nativeOwner||stages.some(stage=>typeof nativeOwner[stage]!=='function'))fail('NATIVE_OWNER_LIFECYCLE_REQUIRED');
 if(!Array.isArray(requiredSectionIds)||requiredSectionIds.length!==sectionCount||new Set(requiredSectionIds).size!==sectionCount)fail('NATIVE_OWNER_SECTION_CONTRACT_REQUIRED');
 const ids=Object.freeze([...requiredSectionIds]);
 async function preflight(context,job){
  if(context.env?.PHIOS_ENVIRONMENT!=='local'||context.env?.STRIPE_ENVIRONMENT!=='QA')fail('PENDING_ADAPTER_LOCAL_QA_ONLY');
  if(personIdentity(context).userId!==job.ownerAccountId)fail('PENDING_ADAPTER_OWNER_MISMATCH');
  if(job.methodCode!==methodCode||job.productId!==productId)fail('PENDING_ADAPTER_PRODUCT_MISMATCH');
  const subject=await loadCanonicalPersonSubject(context.env,job.ownerAccountId,job.personId);
  if(subject.personVersion!==job.personVersion)fail('PENDING_ADAPTER_SUBJECT_VERSION_MISMATCH');
  const source=await loadSource(context,job);
  if(publicationVerifier)publicationVerifier(methodCode,source,job);
  if(source?.consentRef!==subject.reportConsent.consentId)fail('PENDING_ADAPTER_REPORT_CONSENT_MISMATCH');
  return verifyCustomerReportSource({source,sourceFamily,requiredSectionIds:ids,binding:{ownerAccountId:job.ownerAccountId,personId:job.personId,personVersion:job.personVersion,methodCode,productId,publicationVersion,inputDigest:job.inputDigest,authorityDigest:job.authorityDigest,locale:job.presentation?.reportLocale}});
 }
 const adapter={methodCode,productId,version:publicationVersion,p8Admitted:false,admissionScope:'LOCAL_NATIVE_OWNER_HANDOFF_NOT_COMMERCIAL',supportedPresentations:Object.freeze(['en','zh-Hans','bilingual']),recoveryPolicy:Object.freeze({maximumAttempts:2,rescue:false}),
  async readiness(context,intent){await preflight(context,intent);return {productionConfigReady:false,commercialProductReady:false,publicationPreflightReady:false,blockerCode:'PUBLICATION_AND_COMMERCIAL_ADMISSION_REQUIRED'};}
 };
 for(const stage of stages)adapter[stage]=async(context,job,...args)=>{await preflight(context,job);return nativeOwner[stage](context,job,...args);};
 return Object.freeze(adapter);
}
