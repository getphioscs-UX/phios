import {sha256Hex} from '../../document-assembly/digest.js';
import {evaluateProfessionalEligibility} from './professional-eligibility-contract.js';
import {evaluateProfessionalAuthorisation} from './professional-authorisation-decision.js';
import {authorizeHouseholdFinancialAccess} from '../consent/joint-household-consent.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:403});};
// Read-only adapter inside the existing professional access owner. This does not
// admit qualifications, create assignments, or manufacture client consent.
export async function resolveFinancialProfessionalOwnerContext(context,accessId){
 const identity=context.data?.symbolicAccountIdentity;
 if(!identity?.authenticated||!identity?.verified||!identity.userId)fail('PROFESSIONAL_AUTHENTICATED_ACCOUNT_REQUIRED');
 if(typeof accessId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(accessId))fail('PROFESSIONAL_OWNER_CONTEXT_REQUIRED');
 let row;try{row=await context.env.RUNTIME_DB.prepare('SELECT * FROM professional_owner_access_records WHERE access_id = ? AND subject_account_id = ?').bind(accessId,identity.userId).first();}catch{fail('PROFESSIONAL_OWNER_STORE_NOT_AVAILABLE');}
 const now=new Date().toISOString();
 if(!row||row.revoked_at||!row.owner_receipt_ref||!Number.isFinite(Date.parse(row.effective_at))||!Number.isFinite(Date.parse(row.expires_at))||Date.parse(row.effective_at)>Date.parse(now)||Date.parse(row.expires_at)<=Date.parse(now))fail('PROFESSIONAL_OWNER_RECORD_INACTIVE');
 if(row.test_only&&context.env.PHIOS_ENVIRONMENT!=='local-test')fail('PROFESSIONAL_TEST_AUTHORITY_DENIED');
 let value;try{value=JSON.parse(row.payload_json);}catch{fail('PROFESSIONAL_OWNER_RECORD_INVALID');}
 if(sha256Hex(value)!==row.payload_digest||value.identity?.subject_id!==identity.userId)fail('PROFESSIONAL_OWNER_RECORD_BINDING_MISMATCH');
 const eligibility=evaluateProfessionalEligibility({professional_id:value.identity.professional_id,required_capability_codes:value.assignment?.required_capability_codes,credentials:value.credentials,capabilities:value.capabilities},{now});
 const access={identity:value.identity,assignment:value.assignment,consent:value.consent,request:{...value.request,request_id:crypto.randomUUID(),requested_at:now},eligibility,verifiedJurisdictionScopes:value.verifiedJurisdictionScopes,verifiedServiceScopes:value.verifiedServiceScopes};
 if(!evaluateProfessionalAuthorisation(access,{now}).allowed)fail('PROFESSIONAL_OWNER_AUTHORISATION_DENIED');
 const assertSubjectScopes=(inventory,scopes)=>{
  const scopeMap={assets:'properties',liabilities:'liabilities',guarantees:'liabilities',incomeStreams:'income',expenses:'expenses',policies:'insurance',people:'previous_financial_reports',goals:'previous_financial_reports',assumptions:'previous_financial_reports'};
  for(const scope of scopes)for(const item of inventory?.[scope]||[])for(const personId of new Set([...(item.ownerReferences||[]),...(scope==='people'&&item.personId?[item.personId]:[])])){
   const link=value.householdLinks?.find(x=>x.personId===personId&&x.clientId===access.assignment.client_id);
   if(!link||!link.dataSubjectId||!link.receiptRef)fail('HOUSEHOLD_SUBJECT_AUTHORITY_REQUIRED');
   if(link.dataSubjectId===access.assignment.client_id)continue;
   const consent=value.householdConsents?.find(x=>x.data_subject_id===link.dataSubjectId);
   if(!consent||!Number.isFinite(Date.parse(consent.expires_at))||Date.parse(consent.expires_at)<=Date.now()||!Number.isFinite(Date.parse(consent.granted_at))||Date.parse(consent.granted_at)>Date.now()||!consent.authorised_by||consent.is_adult&&consent.authorised_by!==link.dataSubjectId||!consent.is_adult&&consent.authority_basis!=='guardian')fail('HOUSEHOLD_SUBJECT_CONSENT_REQUIRED');
   const financialScope=scope==='assets'?({BANK_ACCOUNT:'bank_balances',INVESTMENT:'investments',PROPERTY:'properties',REAL_ESTATE:'properties',CASH:'bank_balances'})[item.type]:scopeMap[scope];
   if(!financialScope)fail('HOUSEHOLD_ASSET_SCOPE_UNRESOLVED');
   try{authorizeHouseholdFinancialAccess([consent],{data_subject_id:link.dataSubjectId,scope:financialScope});}catch{fail('HOUSEHOLD_SUBJECT_CONSENT_REQUIRED');}
  }
 };
 return {...context,data:{...context.data,professionalAccess:access,assertProfessionalSubjectScopes:assertSubjectScopes,reloadProfessionalOwner:()=>resolveFinancialProfessionalOwnerContext(context,accessId)}};
}
