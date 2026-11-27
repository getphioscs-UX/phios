import {createPendingNativeAdapter} from './paid-report-pending-native-adapter.js';
export function createEcrPendingAdapter(dependencies){
 return createPendingNativeAdapter({methodCode:'ECR',productId:'COM-REPORT-ECR-FULL',sourceFamily:'ECR_NATIVE_CONFIGURATION',sectionCount:10},dependencies);
}

import {loadCanonicalPersonSubject,personIdentity} from '../account/canonical-person-store.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {buildEcrHumanRuntime} from '../embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {buildEcrReportGenerationContext,prepareEcrReportRequest} from './ecr-report-generation-context-r1.js';

// Existing native-adapter source port; no Provider dispatch or paid admission.
export async function prepareOwnedEcrReportRequest(context,{job,sectionIds,model,maxOutputTokens,schema,explicitBackground=null}={}){
 const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
 if(!['local','qa'].includes(context.env?.PHIOS_ENVIRONMENT))fail('ECR_REPORT_REQUEST_LOCAL_QA_ONLY');
 if(job?.methodCode!=='ECR'||job.productId!=='COM-REPORT-ECR-FULL')fail('ECR_REPORT_REQUEST_METHOD_MISMATCH');
 if(personIdentity(context).userId!==job.ownerAccountId)fail('ECR_REPORT_REQUEST_OWNER_MISMATCH');
 const subject=await loadCanonicalPersonSubject(context.env,job.ownerAccountId,job.personId);
 if(subject.personVersion!==job.personVersion||await sha256Stable(subject.canonicalBirthInput)!==job.inputDigest)fail('ECR_REPORT_REQUEST_SUBJECT_MISMATCH');
 // Reuse the existing calculation owner, never accept caller-supplied activations.
 const ir=await buildEcrHumanRuntime({canonicalInput:subject.canonicalBirthInput});
 const subjectBinding={ownerAccountId:job.ownerAccountId,personId:job.personId,personVersion:job.personVersion,inputDigest:job.inputDigest};
 const authorityPack=await buildEcrReportGenerationContext({ir,subjectBinding,locale:job.presentation?.reportLocale,sectionIds,explicitBackground});
 const request=await prepareEcrReportRequest({authorityPack,model,maxOutputTokens,schema});
 return {authorityPack,request,execution:'NOT_DISPATCHED',providerCalls:0,commercialAdmission:false};
}
