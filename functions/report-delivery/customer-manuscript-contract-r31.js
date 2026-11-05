import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {buildAstPublicationIR} from '../ast-full-production/ast-publication-ir.js';
import {assertCustomerReadableProjection,customerReadingProjection,renderCustomerReadingR31} from './customer-publication-composer-r31.js';
const fail=c=>{throw Object.assign(Error(c),{code:c,status:409});};
const keys=['ownerAccountId','personId','personVersion','methodCode','productId','orderId','purchaseId','jobId','inputDigest','authorityDigest'];
// Loaded by the server-side native owner, never from a Checkout request. A
// version/filename or a HUMAN_ACCEPTED string alone is not a provenance proof.
export async function verifyCustomerManuscriptHandoffR31({job,source,expectedSourceFamily,requiredSectionIds}){
 if(source?.version!=='CUSTOMER-MANUSCRIPT-HANDOFF-R31-1'||source.sourceFamily!==expectedSourceFamily||source.fixture!==false||source.customerPublicationAllowed!==false)fail('CUSTOMER_MANUSCRIPT_TRUSTED_HANDOFF_REQUIRED');
 for(const k of keys)if(job[k]===undefined||source.binding?.[k]!==job[k])fail('CUSTOMER_MANUSCRIPT_SUBJECT_ORDER_BINDING_MISMATCH');
 if(!source.consentRef||!source.sourceRef||!source.sourceEvidenceSHA256?.match(/^[a-f0-9]{64}$/))fail('CUSTOMER_MANUSCRIPT_PROVENANCE_REQUIRED');
 if(!Array.isArray(source.sections)||source.sections.length!==requiredSectionIds.length||new Set(source.sections.map(s=>s.sectionId)).size!==requiredSectionIds.length||requiredSectionIds.some(id=>!source.sections.some(s=>s.sectionId===id)))fail('CUSTOMER_MANUSCRIPT_FULL_SECTION_COVERAGE_REQUIRED');
 for(const s of source.sections){if(!s.sourceRefs?.length||!s.paragraphs?.length)fail('CUSTOMER_MANUSCRIPT_SECTION_SOURCE_REQUIRED');for(const p of s.paragraphs)if(!p.sourceRefs?.length)fail('CUSTOMER_MANUSCRIPT_PARAGRAPH_SOURCE_REQUIRED');}
 const projection=assertCustomerReadableProjection(customerReadingProjection(source));
 if(await sha256Stable(source.sections)!==source.contentDigest)fail('CUSTOMER_MANUSCRIPT_CONTENT_DIGEST_MISMATCH');
 return {projection,contentDigest:source.contentDigest,customerPublicationAllowed:false};
}
export async function compileAstCustomerHandoffR31({job,source,manuscript,nativePublicationInputs}){
 await verifyCustomerManuscriptHandoffR31({job,source,expectedSourceFamily:'AST_NATIVE_CALCULATION',requiredSectionIds:Array.from({length:10},(_,i)=>'SEC-'+String(i+1).padStart(2,'0'))});
 if(source.nativeManuscriptDigest!==await sha256Stable(manuscript)||!nativePublicationInputs?.sourceDigests||nativePublicationInputs.sourceDigests.canonicalProjectionDigest!==source.nativeCalculationDigest)fail('AST_MANUSCRIPT_NATIVE_SOURCE_MISMATCH');
 const ir=buildAstPublicationIR({...nativePublicationInputs,manuscript});return {...ir,customerPublishable:false,ownerPublicationDecision:'PENDING',sourceHandoffDigest:await sha256Stable(source)};
}
// A new customer-manuscript successor contract, not a mutation of ECR_FULL_R1
// REJECTED or the author-only R33 publisher. Ten actual bilingual chapters are
// mandatory before any publication output exists; zero empty/unknown fillers.
export async function compileEcrCustomerSuccessorR31({job,source,nativeConfiguration}){
 await verifyCustomerManuscriptHandoffR31({job,source,expectedSourceFamily:'ECR_NATIVE_CONFIGURATION',requiredSectionIds:Array.from({length:10},(_,i)=>'SEC-'+String(i+1).padStart(2,'0'))});
 if(source.nativeConfigurationDigest!==await sha256Stable(nativeConfiguration))fail('ECR_MANUSCRIPT_NATIVE_CONFIGURATION_MISMATCH');
 const ir={...source,version:'ECR-CUSTOMER-PUBLICATION-SUCCESSOR-R31-1',method:'ECR',fullCustomerManuscriptReady:true,customerPublishable:false,ownerPublicationDecision:'PENDING_SUCCESSOR_HUMAN_REVIEW',predecessorDecisionPreserved:'ECR-FULL-R1_REJECTED',sourceHandoffDigest:await sha256Stable(source)};
 return {ir,html:renderCustomerReadingR31(ir)};
}
