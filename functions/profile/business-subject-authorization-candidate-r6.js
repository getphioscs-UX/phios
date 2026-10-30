// Restricted design adapter over the existing Account/PWS relationship owner.
// No issuer, grant registry, production route, or organization verification is created.
import {authorizeR3, assertLocalR3, requireR3, R3_SCOPES} from './subject-bft-authority-candidate-r3.js';
export const BUSINESS_AUTHORIZATION_R6='SUBJECT-BFT-BUSINESS-AUTHORIZATION-CANDIDATE-R6';
export const BUSINESS_AUTHORIZATION_PURPOSE_R6='BUSINESS_OWNER_LIQUIDITY_DIAGNOSTIC';
const roles=Object.freeze({
 SOLE_PROPRIETOR:{businessType:'SOLE_PROPRIETORSHIP',basis:'VERIFIED_OPERATOR',scopes:R3_SCOPES},
 COMPANY_REPRESENTATIVE:{businessType:'LIMITED_COMPANY',basis:'ORGANIZATION_MANDATE',scopes:R3_SCOPES},
 DELEGATED_EMPLOYEE:{basis:'SCOPED_EMPLOYEE_DELEGATION',scopes:['intake:read','intake:write','reading:probe','navigation:probe','continuity:reopen']},
 EXTERNAL_CONSULTANT:{basis:'EXPLICIT_CLIENT_MANDATE',scopes:['intake:read','intake:review','reading:probe','navigation:probe','continuity:save','continuity:reopen']},
 PUBLIC_OBSERVER:{basis:'PUBLIC_SOURCE_ONLY',scopes:['public:read']}
});
export const businessAuthorizationRoleProposalR6=()=>structuredClone(roles);
const ref=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=200&&!['*','ALL','UNKNOWN'].includes(v);
const time=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&Number.isFinite(Date.parse(v));
export function validateBusinessAuthorizationContractR6(c,{accountId,subjectId,subjectVersion,caseId,scope,now=Date.now()}={}){
 const role=roles[c?.representativeRole];
 requireR3(c?.schemaVersion===BUSINESS_AUTHORIZATION_R6&&role,'R6_AUTHORIZATION_CONTRACT_REQUIRED');
 requireR3(ref(c.accountId)&&c.accountId===accountId&&ref(c.subjectId)&&c.subjectId===subjectId&&c.subjectVersion===subjectVersion&&c.caseId===caseId,'R6_ACCOUNT_SUBJECT_CASE_BINDING_MISMATCH');
 requireR3(['SOLE_PROPRIETORSHIP','LIMITED_COMPANY'].includes(c.businessType)&&(!role.businessType||role.businessType===c.businessType),'R6_BUSINESS_ROLE_TYPE_MISMATCH');
 requireR3(c.purpose===BUSINESS_AUTHORIZATION_PURPOSE_R6&&c.authorityBasis?.kind===role.basis&&ref(c.authorityBasis.reference)&&ref(c.authorityBasis.reviewAccountRef)&&ref(c.authorityBasis.reviewVersion)&&ref(c.auditReference),'R6_AUTHORITY_BASIS_REVIEW_REQUIRED');
 requireR3(Number.isSafeInteger(c.grantVersion)&&c.grantVersion>0&&time(c.effectiveAt)&&time(c.expiresAt)&&Date.parse(c.effectiveAt)<=now&&Date.parse(c.expiresAt)>now&&Date.parse(c.effectiveAt)<Date.parse(c.expiresAt),'R6_GRANT_TIME_OR_VERSION_INVALID');
 requireR3(c.revocation&&Object.hasOwn(c.revocation,'revokedAt')&&c.revocation.revokedAt===null,'R6_GRANT_REVOKED');
 requireR3(Array.isArray(c.resourceScope)&&c.resourceScope.length>0&&new Set(c.resourceScope).size===c.resourceScope.length&&c.resourceScope.every(s=>role.scopes.includes(s))&&c.resourceScope.includes(scope),'R6_RESOURCE_SCOPE_DENIED');
 return {contractVersion:c.schemaVersion,grantVersion:c.grantVersion,accountId,subjectId,subjectVersion,caseId,role:c.representativeRole,businessType:c.businessType,purpose:c.purpose,scope,expiresAt:c.expiresAt,auditReference:c.auditReference,authorityReference:c.authorityBasis.reference,externalMandateVerified:false,formalIssuanceAuthorized:false};
}
export async function authorizeBusinessCandidateR6(deps,subjectId,identity,scope){
 assertLocalR3(deps);
 const native=await authorizeR3(deps,subjectId,identity,scope);
 requireR3(native.subject.metadata.subjectType==='BUSINESS','R6_BUSINESS_SUBJECT_REQUIRED');
 const workspace=await deps.workflow.read(native.caseId,identity.userId),member=workspace.members.find(m=>m.id===native.membershipId&&m.accountId===identity.userId&&m.state==='ACTIVE');
 requireR3(member?.dataScopes?.includes('FINANCIAL_SUMMARY')&&member.resourceId===native.caseId&&member.purpose==='BFT_LOCAL_CASE'&&time(member.expiresAt)&&Date.parse(member.expiresAt)>Date.now(),'R6_CURRENT_PRIVATE_FINANCIAL_MEMBERSHIP_REQUIRED');
 // The contract is read from the native, already-authorized relationship. No
 // request-body contract or client role is consulted.
 const row=(await deps.registry.relationshipStore.listForObject(subjectId)).find(r=>r.relationship_id===native.grantId);
 const contract=validateBusinessAuthorizationContractR6(row?.attributes?.businessAuthorizationContractR6,{accountId:identity.userId,subjectId,subjectVersion:native.subject.metadata.version,caseId:native.caseId,scope});
 return {...native,restrictedContract:contract,formalAdmission:false};
}
