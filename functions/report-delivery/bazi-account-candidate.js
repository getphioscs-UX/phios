import {personIdentity,loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {ownedReportPresentation} from '../commerce/book-commerce-store.js';
import {executeAndProjectMcd5CurrentRequest} from '../method-client-delivery/canonical-projection-runtime-current.js';
import {reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
const fail=(code,status)=>{throw Object.assign(new Error(code),{code,status});};
// Server-only preparation, not a release adapter. No API route or production
// registration is added. Existing Commerce and person owners remain mandatory.
export async function prepareAccountBaziCandidate(context,selection){
 const owner=personIdentity(context).userId;
 if(!['local','qa','preview'].includes(context.env?.PHIOS_ENVIRONMENT))fail('BAZI_CANDIDATE_PRODUCTION_NOT_ADMITTED',403);
 if(!selection||Object.keys(selection).some(k=>k!=='personId')||typeof selection.personId!=='string'||!selection.personId)fail('BAZI_SUBJECT_SELECTION_REQUIRED',400);
 const right=await ownedReportPresentation(context.env,owner,'COM-REPORT-BAZI-FULL');
 if(!right)fail('BAZI_ENTITLEMENT_REQUIRED',403);
 const subject=await loadCanonicalPersonSubject(context.env,owner,selection.personId);
 const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'BAZI',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput:subject.canonicalBirthInput,executionParameters:{traditionalCalculationSex:subject.calculationSex},consentRecordId:subject.methodConsent.consentId,requestId:`BAZI-CANDIDATE:${subject.person.personId}:v${subject.personVersion}`};
 const execution=await executeAndProjectMcd5CurrentRequest(request);
 const projection=execution.canonicalProjection;
 if(!projection||projection.method?.publicMethodCode!=='BAZI_PROJECTION')fail('BAZI_CALCULATION_UNAVAILABLE',409);
 return Object.freeze({schemaVersion:'PHI-OS-BAZI-ACCOUNT-CANDIDATE-v1',scope:'LOCAL_QA_PREPARATION_ONLY',customerId:owner,personId:subject.person.personId,personVersion:subject.personVersion,birthSourceRef:subject.birthSourceRef,purchaseId:right.purchase_id,presentation:right.reportPresentation,canonicalBirthInputFingerprint:await reportBirthInputFingerprint(subject.canonicalBirthInput),calculationDigest:await sha256Stable(projection),execution,
  state:projection.calculation?.status==='COMPLETE'?'RELEASE_PENDING':'INPUT_REQUIRED',
  downstream:{composition:'SUBJECT_BOUND_ADMITTED_SNAPSHOT_REQUIRED',verification:'BAZI_METHOD_RENDER_ADAPTER_NOT_ADMITTED',release:'BLOCKED',accountVisibility:'NO_RELEASE_CREATED',download:'DENIED_WITHOUT_NATIVE_RELEASE',versionHistory:'NATIVE_IMMUTABLE_RELEASE_STORE_REQUIRED'},
  providerCalls:0,productionAdmitted:false,released:false});
}
