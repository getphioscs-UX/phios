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
async function save(a,kind,payload){const r=await draftApi(a.context({action:'save',draftType:kind,payload,purpose:kind==='WILL'?'WILL_ASSEMBLY':'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString()}));assert.equal(r.status,200,await r.clone().text());return r.json();}
test('Will preparation preserves wishes; download/read/signing declarations never become legal validity',async()=>{
 const a=localAccount(),w=await save(a,'WILL',{dataDate:'2026-10-19',jurisdiction:'MALAYSIA',currency:'MYR',sections:{gifts:{status:'PARTIAL',items:[{instruction:'TEST_ONLY original personal wish'}]}}});
 const p=await prepareSavedWill(a.context({}),{willRef:w.savedDraftRef,language:'en',signatureMethod:'WET_INK_IN_PERSON',intendedSigningDate:'2026-11-01'});assert.equal(p.preparation.sections.gifts.items[0].instruction,'TEST_ONLY original personal wish');assert.equal(p.signingExportAllowed,false);assert(p.blockers.includes('WILL_APPROVED_CLAUSE_TEXT_REQUIRED'));
 for(const eventCode of ['INFORMATION_DOWNLOADED','CUSTOMER_READ','CUSTOMER_DECLARED_SIGNED']){const e=await recordSavedWillEvent(a.context({}),{willRef:w.savedDraftRef,eventCode});assert.equal(e.legalValidity,'NOT_DETERMINED');}
 await assert.rejects(recordSavedWillEvent(a.context({}),{willRef:w.savedDraftRef,eventCode:'PROFESSIONAL_VERIFIED_EXECUTION',evidenceRef:'fabricated'}),{code:'PROFESSIONAL_EXECUTION_EVIDENCE_REQUIRED'});a.sql.close();
});
function professionalAccess(owner){
 const now=new Date().toISOString(),common={professional_id:'TEST_ONLY_PRO',domain:'finance',issued_at:now};
 const identity=createProfessionalIdentity({professional_id:common.professional_id,subject_id:'TEST_ONLY_PRO_ACCOUNT',display_name:'TEST_ONLY reviewer',status:'active',identity_verified:true,verified_at:now,verified_by:'TEST_ONLY_VERIFIER'});
 const credential=createProfessionalCredential({...common,credential_id:'TEST_ONLY_CREDENTIAL',credential_type:'experience_evidence',issuer:'TEST_ONLY_ISSUER',evidence_reference:'TEST_ONLY_EVIDENCE',capability_codes:['financial_review']});
 const capability=createProfessionalCapability({...common,capability_id:'TEST_ONLY_CAPABILITY',capability_code:'financial_review',basis_reference_ids:['TEST_ONLY_CREDENTIAL']});
 const eligibility=evaluateProfessionalEligibility({professional_id:common.professional_id,required_capability_codes:['financial_review'],credentials:[credential],capabilities:[capability]},{now});assert.equal(eligibility.eligible,true);
 const proposed=createProfessionalAssignment({assignment_id:'TEST_ONLY_ASSIGNMENT',professional_id:common.professional_id,client_id:owner,service_id:'TEST_ONLY_SERVICE',purpose:'professional_runtime_review',journey_ids:['TEST_ONLY_JOURNEY'],resource_scopes:['previous_reports'],required_capability_codes:['financial_review'],starts_at:now});
 const assignment=activateProfessionalAssignment(proposed,{explicit_assignment:true,professional_id:common.professional_id,client_id:owner,activated_by:'TEST_ONLY_ASSIGNER'},{now});
 const consent=createProfessionalConsent({consent_id:'TEST_ONLY_CONSENT',client_id:owner,professional_id:common.professional_id,service_id:'TEST_ONLY_SERVICE',purpose:'professional_runtime_review',consent_version:'1',duration:'thirty_days',explicit_action:true,runtime_ids:['TEST_ONLY_RUNTIME'],resource_scopes:['previous_reports'],acknowledgements:{scope_selected:true,data_accuracy:true,future_access_revocable:true}},{now});
 return {identity,eligibility,assignment,consent,verifiedJurisdictionScopes:['MY_PENINSULAR'],verifiedServiceScopes:['FINANCIAL_REVIEW'],request:{request_id:crypto.randomUUID(),professional_id:common.professional_id,client_id:owner,service_id:'TEST_ONLY_SERVICE',journey_id:'TEST_ONLY_JOURNEY',runtime_id:'TEST_ONLY_RUNTIME',purpose:'professional_runtime_review',resource_scopes:['previous_reports'],requested_at:now}};
}
test('professional owner authorizes before decrypt; recipient, exact version, jurisdiction and revocation remain mandatory',async()=>{
 const a=localAccount(),f=await save(a,'FINANCIAL',{asOfDate:'2026-10-19',baseCurrency:'MYR',inventory:{assets:[{recordId:'asset-one',label:'TEST_ONLY bank',value:10}],liabilities:[],guarantees:[]}}),source=f.savedDraftRef;
 const preview=await customerFinancialPacket(a.context({}),{savedDraftRef:source,scopes:['assets']});assert.equal(preview.externalSend,false);assert.equal(preview.assignmentCreated,false);
 await assert.rejects(readProfessionalFinancialPacket(a.context({}),{savedDraftRef:source,scopes:['assets']}),{code:'PROFESSIONAL_OWNER_CONTEXT_REQUIRED'});
 const grant=await createFinancialGrant(a.context({}),{source,purpose:'PROFESSIONAL_REVIEW',scopes:['assets'],expiresAt:f.expiresAt,recipientRef:'TEST_ONLY_PRO',jurisdictionScope:'MY_PENINSULAR',serviceScope:'FINANCIAL_REVIEW'});
 const context=a.context({},{owner:'synthetic-other'});context.data.professionalAccess=professionalAccess('synthetic-owner');const args={savedDraftRef:source,grantId:grant.grantId,scopes:['assets'],jurisdictionScope:'MY_PENINSULAR',serviceScope:'FINANCIAL_REVIEW'};
 const result=await readProfessionalFinancialPacket(context,args);assert.equal(result.read_performed_after_authorisation,true);assert.equal(result.workspace.resources.previous_reports.sections.assets[0].label,'TEST_ONLY bank');assert.equal(result.workspace.resources.previous_reports.sections.liabilities,undefined);
 const noteRequest={...args,noteToken:crypto.randomUUID(),action:'REQUEST_EVIDENCE',comment:'TEST_ONLY independently authored request for statement evidence'};
 const note=await saveFinancialProfessionalNote(context,noteRequest);assert.equal(note.reused,false);assert.equal((await saveFinancialProfessionalNote(context,noteRequest)).reused,true);assert.equal((await readFinancialProfessionalNote(context,noteRequest)).professionalId,'TEST_ONLY_PRO');assert.equal(a.sql.prepare('SELECT COUNT(*) AS n FROM account_financial_will_drafts').get().n,1);await assert.rejects(saveFinancialProfessionalNote(context,{...noteRequest,comment:'changed under same token'}),{code:'PROFESSIONAL_NOTE_IDEMPOTENCY_CONFLICT'});
 await assert.rejects(readProfessionalFinancialPacket(context,{...args,jurisdictionScope:'MY_SABAH'}),{code:'PROFESSIONAL_JURISDICTION_SERVICE_UNVERIFIED'});
 await assert.rejects(readProfessionalFinancialPacket(context,{...args,savedDraftRef:{...source,version:2,sourceRef:source.sourceRef.replace(':1',':2')}}),{code:'PURPOSE_GRANT_INACTIVE'});
 await revokeFinancialGrant(a.context({}),grant.grantId);await assert.rejects(readProfessionalFinancialPacket(context,args),{code:'PURPOSE_GRANT_INACTIVE'});await assert.rejects(readFinancialProfessionalNote(context,noteRequest),{code:'PURPOSE_GRANT_INACTIVE'});a.sql.close();
});
