import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {prepareAstrologyCustomerNativeInputs} from './astrology-customer-native-inputs.js';
import {loadOwnedHumanDesignReportSource} from './human-design-paid-source.js';
import {buildEcrHumanRuntime} from '../embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {executeAndProjectMcd5CurrentRequest} from '../method-client-delivery/canonical-projection-runtime-current.js';
import {buildCustomerNativeBaziInputs} from './bazi-customer-native-inputs.js';
import {reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {buildAstDiagramData} from '../ast-full-production/ast-diagram-data-builder.js';
import {renderAstR1R2Diagram} from '../ast-full-production/ast-vfr-r1r2-diagram-system.js';
import {createNativeQaDeliveryAdapter} from './paid-report-native-qa-adapter.js';
import {requireNativeQa} from './native-qa-publication.js';
export async function loadNativeQaMethod(c,j){
 requireNativeQa(c);const s=await loadCanonicalPersonSubject(c.env,j.ownerAccountId,j.personId);
 if(s.personVersion!==j.personVersion)throw Error('NATIVE_QA_SUBJECT_VERSION_CHANGED');
 if(j.methodCode==='AST'){
  const n=await prepareAstrologyCustomerNativeInputs(c,{personId:j.personId,locale:'en'}),w=n.workspace;
  const data=buildAstDiagramData({canonicalProjection:n.execution.canonicalProjection,r4Projection:w.professionalSemanticProjection,r5Synthesis:w.synthesis,sourceDigests:{calculation:n.calculationDigest}});
  const ids=['AST-D01','AST-D02','AST-D03','AST-D04','AST-D05','AST-D06','AST-D07','AST-D08','AST-D09','AST-D10','AST-D11','AST-D12','AST-D14'];
  return {method:'AST',calculation:n.execution.canonicalProjection,reading:w.reading,excerpts:w.reading.sections,diagrams:ids.map(id=>({id,svg:renderAstR1R2Diagram(id,data)})),sourceScope:'ACTUAL_V2_PLACIDUS_AND_NATIVE_READING_NOT_PAID_MANUSCRIPT'};
 }
 if(j.methodCode==='HD'){
  const n=await loadOwnedHumanDesignReportSource(c,{personId:j.personId,sourceToken:j.methodInputs?.sourceToken,locale:'en'});
  return {method:'HD',profileDigest:n.profileDigest,chart:n.transport.canonicalHumanDesignChart,reading:n.transport.humanDesignProfessionalReading,excerpts:n.transport.humanDesignProfessionalReading.customerReading.customerSections,sourceScope:'EXPLICIT_SYNTHETIC_CONFIRMED_EXTERNAL_CHART_R3_NOT_GENERAL_FULL17',rightsAccepted:false,full17Accepted:false};
 }
 if(j.methodCode==='ECR'){
  const n=await buildEcrHumanRuntime({canonicalInput:s.canonicalBirthInput});
  return {method:'ECR',configuration:n,excerpts:[{configurationId:n.configurationId,baselineDigest:n.baselineDigest}],sourceScope:'ACTUAL_NATIVE_RUNTIME_NOT_ACCEPTED_CUSTOMER_MANUSCRIPT',customerPublishable:false};
 }
 if(j.methodCode==='BZR'){
  const execution=await executeAndProjectMcd5CurrentRequest({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'BAZI',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput:s.canonicalBirthInput,executionParameters:{traditionalCalculationSex:s.calculationSex},consentRecordId:s.methodConsent.consentId,requestId:`BAZI-CANDIDATE:${j.personId}:v${s.personVersion}`});
  const n=await buildCustomerNativeBaziInputs(c,{customerId:j.ownerAccountId,personId:j.personId,personVersion:s.personVersion,canonicalBirthInputFingerprint:await reportBirthInputFingerprint(s.canonicalBirthInput),calculationDigest:await sha256Stable(execution.canonicalProjection),execution});
  return {method:'BZR',pack:n.pack,calculation:n.calculationSnapshot,excerpts:[n.pack.natal],sourceScope:'CURRENT_SYNTHETIC_SUBJECT_NATIVE_AUTHORITY_NO_HISTORICAL_MANUSCRIPT_REBINDING'};
 }
 throw Error('NATIVE_QA_METHOD_NOT_SUPPORTED');
}
export const createBaziNativeQaAdapter=d=>createNativeQaDeliveryAdapter({...d,methodCode:'BZR',loadNative:loadNativeQaMethod});
export const createAstrologyNativeQaAdapter=d=>createNativeQaDeliveryAdapter({...d,methodCode:'AST',loadNative:loadNativeQaMethod});
export const createHumanDesignNativeQaAdapter=d=>createNativeQaDeliveryAdapter({...d,methodCode:'HD',loadNative:loadNativeQaMethod});
export const createEcrNativeQaAdapter=d=>createNativeQaDeliveryAdapter({...d,methodCode:'ECR',loadNative:loadNativeQaMethod});
