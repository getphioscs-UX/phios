import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {executeAndProjectMcd5CurrentRequest} from '../method-client-delivery/canonical-projection-runtime-current.js';
import {buildCustomerNativeBaziInputs} from './bazi-customer-native-inputs.js';
import {reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {requireNativeQa} from './native-qa-publication.js';
export async function loadNativeQaMethod(c,j){requireNativeQa(c);if(c.env.REPORT_ZERO_COST_REPLAY!=='true')throw Error('BZR_ONLY_ZERO_COST_REQUIRED');const s=await loadCanonicalPersonSubject(c.env,j.ownerAccountId,j.personId);if(s.personVersion!==j.personVersion)throw Error('NATIVE_QA_SUBJECT_VERSION_CHANGED');
 if(j.methodCode==='BZR'){
  const execution=await executeAndProjectMcd5CurrentRequest({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'BAZI',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput:s.canonicalBirthInput,executionParameters:{traditionalCalculationSex:s.calculationSex},consentRecordId:s.methodConsent.consentId,requestId:`BAZI-CANDIDATE:${j.personId}:v${s.personVersion}`});
  const n=await buildCustomerNativeBaziInputs(c,{customerId:j.ownerAccountId,personId:j.personId,personVersion:s.personVersion,canonicalBirthInputFingerprint:await reportBirthInputFingerprint(s.canonicalBirthInput),calculationDigest:await sha256Stable(execution.canonicalProjection),execution});
  return {method:'BZR',pack:n.pack,calculation:n.calculationSnapshot,excerpts:[n.pack.natal],sourceScope:'CURRENT_SYNTHETIC_SUBJECT_NATIVE_AUTHORITY_NO_HISTORICAL_MANUSCRIPT_REBINDING'};
 }
throw Error('BZR_ONLY_METHOD_REQUIRED');}
