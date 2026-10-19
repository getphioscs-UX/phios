import {onRequestGet,onRequestPost} from '../../functions/api/professional-financial-packet.js';
import {createHouseholdParticipantConsent} from '../../functions/professional/consent/joint-household-consent.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {localAccount} from './local-account.mjs';
import {draftApi} from '../../functions/account/financial-will-draft-store.js';
import {prepareSavedWill,recordSavedWillEvent} from '../../functions/account/will-preparation-lifecycle.js';
import {customerFinancialPacket,readProfessionalFinancialPacket} from '../../functions/professional/access/financial-preparation-handoff.js';
import {createFinancialGrant,revokeFinancialGrant} from '../../functions/professional/consent/financial-purpose-grants.js';
import {createProfessionalIdentity} from '../../functions/professional/access/professional-identity-contract.js';
import {createProfessionalAssignment,activateProfessionalAssignment} from '../../functions/professional/access/professional-assignment-contract.js';
import {createProfessionalConsent} from '../../functions/professional/consent/professional-consent-contract.js';
import {createProfessionalCredential,createProfessionalCapability,evaluateProfessionalEligibility} from '../../functions/professional/access/professional-eligibility-contract.js';
import {saveFinancialProfessionalNote,readFinancialProfessionalNote} from '../../functions/professional/reports/financial-preparation-review-note.js';
import fs from 'node:fs';
import {sha256Hex} from '../../functions/document-assembly/digest.js';
import {resolveFinancialProfessionalOwnerContext} from '../../functions/professional/access/financial-professional-owner-context.js';
function professionalAccess(owner){
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

test('authenticated owner store rejects spoofed account, expiry, revocation, altered payload and test records in production',async()=>{
 const a=localAccount();a.sql.exec(fs.readFileSync('db/migration-candidates/professional_owner_access_records.sql','utf8'));
 const access=structuredClone(professionalAccess('synthetic-owner'));access.identity.subject_id='synthetic-other';const now=new Date().toISOString();
 const value=access;
 a.sql.prepare('INSERT INTO professional_owner_access_records VALUES(?,?,?,?,?,?,?,?,?)').run('test_access','synthetic-other',JSON.stringify(value),sha256Hex(value),'TEST_ONLY_RECEIPT',now,new Date(Date.now()+60000).toISOString(),null,1);
 const ctx=a.context({},{owner:'synthetic-other'});
 const resolved=await resolveFinancialProfessionalOwnerContext(ctx,'test_access');assert.equal(resolved.data.professionalAccess.identity.subject_id,'synthetic-other');assert.equal(resolved.data.professionalAccess.eligibility.eligible,true);
 const savedHttp=await draftApi(a.context({action:'save',draftType:'FINANCIAL',payload:{asOfDate:'2026-10-19',baseCurrency:'MYR',inventory:{assets:[{recordId:'a',label:'TEST_ONLY_BANK',value:10}],liabilities:[],guarantees:[]}},purpose:'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+60000).toISOString()}));assert.equal(savedHttp.status,200);const saved=await savedHttp.json();
 const grant=await createFinancialGrant(a.context({}),{source:saved.savedDraftRef,purpose:'PROFESSIONAL_REVIEW',scopes:['assets'],expiresAt:saved.expiresAt,recipientRef:'TEST_ONLY_PRO',jurisdictionScope:'MY_PENINSULAR',serviceScope:'FINANCIAL_REVIEW'});
 const args={savedDraftRef:saved.savedDraftRef,grantId:grant.grantId,scopes:['assets'],jurisdictionScope:'MY_PENINSULAR',serviceScope:'FINANCIAL_REVIEW'};
 assert.equal((await readProfessionalFinancialPacket(resolved,args)).workspace.resources.previous_reports.sections.assets[0].label,'TEST_ONLY_BANK');
 const listed=await onRequestGet(ctx);assert.equal(listed.status,200);assert.equal((await listed.json()).selections.length,1);
 const http=await onRequestPost(a.context({...args,accessId:'test_access',professionalAccess:{identity:{verified:true}}},{owner:'synthetic-other'}));assert.equal(http.status,200);
 assert.throws(()=>resolved.data.assertProfessionalSubjectScopes({assets:[{type:'PROPERTY',ownerReferences:['third-party']}]},['assets']),{code:'HOUSEHOLD_SUBJECT_AUTHORITY_REQUIRED'});
 value.householdLinks=[{personId:'third-party',clientId:'synthetic-owner',dataSubjectId:'TEST_ONLY_ADULT',receiptRef:'TEST_ONLY_SUBJECT_LINK'}];
 value.householdConsents=[{...createHouseholdParticipantConsent({participant_id:'TEST_ONLY_PARTICIPANT',data_subject_id:'TEST_ONLY_ADULT',role:'joint_client',is_adult:true,explicit_action:true,financial_data_scopes:['properties']}),expires_at:new Date(Date.now()+60000).toISOString()}];
 a.sql.prepare('UPDATE professional_owner_access_records SET payload_json=?,payload_digest=?').run(JSON.stringify(value),sha256Hex(value));
 const household=await resolveFinancialProfessionalOwnerContext(ctx,'test_access');household.data.assertProfessionalSubjectScopes({assets:[{type:'PROPERTY',ownerReferences:['third-party']}]},['assets']);assert.throws(()=>household.data.assertProfessionalSubjectScopes({liabilities:[{ownerReferences:['third-party']}]},['liabilities']),{code:'HOUSEHOLD_SUBJECT_CONSENT_REQUIRED'});
 value.householdConsents[0].revoked=true;a.sql.prepare('UPDATE professional_owner_access_records SET payload_json=?,payload_digest=?').run(JSON.stringify(value),sha256Hex(value));const revokedSubject=await resolveFinancialProfessionalOwnerContext(ctx,'test_access');assert.throws(()=>revokedSubject.data.assertProfessionalSubjectScopes({assets:[{type:'PROPERTY',ownerReferences:['third-party']}]},['assets']),{code:'HOUSEHOLD_SUBJECT_CONSENT_REQUIRED'});


 await assert.rejects(resolveFinancialProfessionalOwnerContext(a.context({}),'test_access'),{code:'PROFESSIONAL_OWNER_RECORD_INACTIVE'});
 a.sql.prepare("UPDATE professional_owner_access_records SET revoked_at=?").run(now);
 await assert.rejects(resolveFinancialProfessionalOwnerContext(ctx,'test_access'),{code:'PROFESSIONAL_OWNER_RECORD_INACTIVE'});await assert.rejects(readProfessionalFinancialPacket(resolved,args),{code:'PROFESSIONAL_OWNER_RECORD_INACTIVE'});
 a.sql.prepare("UPDATE professional_owner_access_records SET revoked_at=NULL, payload_digest='altered'").run();
 await assert.rejects(resolveFinancialProfessionalOwnerContext(ctx,'test_access'),{code:'PROFESSIONAL_OWNER_RECORD_BINDING_MISMATCH'});
 a.env.PHIOS_ENVIRONMENT='production';await assert.rejects(resolveFinancialProfessionalOwnerContext(ctx,'test_access'),{code:'PROFESSIONAL_TEST_AUTHORITY_DENIED'});a.sql.close();
});
