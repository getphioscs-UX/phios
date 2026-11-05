import {personIdentity,loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {executeAndProjectAstV2} from '../method-client-delivery/canonical-projection-runtime-ast-v2.js';
import {buildAstCustomerWorkspaceCandidate} from '../ast-full-production/ast-customer-reading-production.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';

// Server-owned native input preparation. The full-report owner needs AST v2
// (Placidus, angles/houses/aspects); the shared v1 projection is not interchangeable.
// No paid admission, order, Provider request, publication or artifact is created.
export async function prepareAstrologyCustomerNativeInputs(context,{personId,locale='en'}={}){
 if(!['en','zh-Hans'].includes(locale))throw Object.assign(Error('AST_NATIVE_LOCALE_REQUIRED'),{code:'AST_NATIVE_LOCALE_REQUIRED',status:422});
 const owner=personIdentity(context).userId;
 const subject=await loadCanonicalPersonSubject(context.env,owner,personId);
 const execution=await executeAndProjectAstV2({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput:subject.canonicalBirthInput,executionParameters:{houseSystemCode:'PLACIDUS_V1'},consentRecordId:subject.methodConsent.consentId,requestId:`AST-PAID-NATIVE:${personId}:v${subject.personVersion}`},{astronomyModuleLoader:()=>import('astronomy-engine')});
 const projection=execution.canonicalProjection;
 if(projection?.schemaVersion!=='PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0'||projection.calculation?.status!=='COMPLETE'||projection.projection?.status!=='COMPLETE')throw Object.assign(Error('AST_PAID_NATIVE_CALCULATION_INCOMPLETE'),{code:'AST_PAID_NATIVE_CALCULATION_INCOMPLETE',status:409});
 const workspace=await buildAstCustomerWorkspaceCandidate({canonicalProjection:projection,locale,consentRecordId:subject.methodConsent.consentId});
 return {ownerAccountId:owner,personId,personVersion:subject.personVersion,reportConsentId:subject.reportConsent.consentId,inputDigest:await sha256Stable(subject.canonicalBirthInput),calculationDigest:await sha256Stable(projection),execution,workspace,paidPublicationAdmitted:false};
}
