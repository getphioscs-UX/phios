import {createProfessionalIdentity} from '../../functions/professional/access/professional-identity-contract.js';
import {createProfessionalAssignment,activateProfessionalAssignment} from '../../functions/professional/access/professional-assignment-contract.js';
import {createProfessionalConsent} from '../../functions/professional/consent/professional-consent-contract.js';
import {createProfessionalCredential,createProfessionalCapability,evaluateProfessionalEligibility} from '../../functions/professional/access/professional-eligibility-contract.js';
import assert from 'node:assert/strict';
export function professionalAccess(owner){
 const now=new Date().toISOString(),common={professional_id:'TEST_ONLY_PRO',domain:'finance',issued_at:now};
 const identity=createProfessionalIdentity({professional_id:common.professional_id,subject_id:'TEST_ONLY_PRO_ACCOUNT',display_name:'TEST_ONLY reviewer',status:'active',identity_verified:true,verified_at:now,verified_by:'TEST_ONLY_VERIFIER'});
 const credential=createProfessionalCredential({...common,credential_id:'TEST_ONLY_CREDENTIAL',credential_type:'experience_evidence',issuer:'TEST_ONLY_ISSUER',evidence_reference:'TEST_ONLY_EVIDENCE',capability_codes:['financial_review']});
 const capability=createProfessionalCapability({...common,capability_id:'TEST_ONLY_CAPABILITY',capability_code:'financial_review',basis_reference_ids:['TEST_ONLY_CREDENTIAL']});
 const eligibility=evaluateProfessionalEligibility({professional_id:common.professional_id,required_capability_codes:['financial_review'],credentials:[credential],capabilities:[capability]},{now});assert.equal(eligibility.eligible,true);
 const proposed=createProfessionalAssignment({assignment_id:'TEST_ONLY_ASSIGNMENT',professional_id:common.professional_id,client_id:owner,service_id:'TEST_ONLY_SERVICE',purpose:'professional_runtime_review',journey_ids:['TEST_ONLY_JOURNEY'],resource_scopes:['previous_reports'],required_capability_codes:['financial_review'],starts_at:now});
 const assignment=activateProfessionalAssignment(proposed,{explicit_assignment:true,professional_id:common.professional_id,client_id:owner,activated_by:'TEST_ONLY_ASSIGNER'},{now});
 const consent=createProfessionalConsent({consent_id:'TEST_ONLY_CONSENT',client_id:owner,professional_id:common.professional_id,service_id:'TEST_ONLY_SERVICE',purpose:'professional_runtime_review',consent_version:'1',duration:'thirty_days',explicit_action:true,runtime_ids:['TEST_ONLY_RUNTIME'],resource_scopes:['previous_reports'],acknowledgements:{scope_selected:true,data_accuracy:true,future_access_revocable:true}},{now});
 return {credentials:[credential],capabilities:[capability],identity,eligibility,assignment,consent,verifiedJurisdictionScopes:['MY_PENINSULAR'],verifiedServiceScopes:['FINANCIAL_REVIEW'],request:{request_id:crypto.randomUUID(),professional_id:common.professional_id,client_id:owner,service_id:'TEST_ONLY_SERVICE',journey_id:'TEST_ONLY_JOURNEY',runtime_id:'TEST_ONLY_RUNTIME',purpose:'professional_runtime_review',resource_scopes:['previous_reports'],requested_at:now}};
}

