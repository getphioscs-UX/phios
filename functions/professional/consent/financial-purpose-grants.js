import {PREPARATION_SCOPES} from './financial-preparation-scopes.js';
import {sha256Hex} from '../../document-assembly/digest.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../../symbolic-method-persistence/symbolic-account-identity-v1.js';
const fail=code=>{throw Object.assign(new Error(code),{code,status:403});};
export function grantOwner(context){const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)fail('ACCOUNT_REQUIRED');return identity.userId;}
export const FINANCIAL_REPORT_SCOPES=Object.freeze(['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions']);
const allowed=[...FINANCIAL_REPORT_SCOPES,...PREPARATION_SCOPES];
const explicitId=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=160&&!['*','ALL','UNKNOWN','UNSPECIFIED','NONE','NULL'].includes(v.toUpperCase());
export async function createFinancialGrant(context,{source,purpose,scopes,expiresAt,recipientRef=null,jurisdictionScope=null,serviceScope=null,language=null,preparationBinding=null}){
 const owner=grantOwner(context),now=Date.now();
 if(source.ownerRef!==owner||!['WILL_ASSEMBLY','REPORT','PROFESSIONAL_REVIEW'].includes(purpose))fail('PURPOSE_GRANT_SCOPE_INVALID');
 if(!Array.isArray(scopes)||!scopes.length||Array.from(scopes).some(x=>!allowed.includes(x))||new Set(scopes).size!==scopes.length)fail('PURPOSE_GRANT_SCOPE_INVALID');
 if(scopes.some(s=>PREPARATION_SCOPES.includes(s))&&(purpose!=='PROFESSIONAL_REVIEW'||!preparationBinding||scopes.some(s=>!PREPARATION_SCOPES.includes(s))))fail('PREPARATION_BOUND_GRANT_REQUIRED');
 const expiry=Date.parse(expiresAt);if(!Number.isFinite(expiry)||expiry<=now||expiry>now+366*86400000)fail('PURPOSE_GRANT_EXPIRY_INVALID');
 if(purpose==='PROFESSIONAL_REVIEW'&&(!explicitId(recipientRef)||!explicitId(jurisdictionScope)||!explicitId(serviceScope)))fail('PURPOSE_GRANT_RECIPIENT_REQUIRED');
 if(purpose==='REPORT'){if(!['en','zh-Hans'].includes(language))fail('REPORT_GRANT_LANGUAGE_REQUIRED');serviceScope=`FINANCE_FACTUAL_R1:${language}`;jurisdictionScope='FACTUAL_ONLY';recipientRef=owner;}
 const id=crypto.randomUUID();const insert=context.env.RUNTIME_DB.prepare('INSERT INTO financial_purpose_grants(grant_id,owner_id,purpose,source_ref,source_digest,data_scopes,recipient_ref,jurisdiction_scope,service_scope,granted_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,owner,purpose,source.sourceRef,source.contentDigest,JSON.stringify(scopes),recipientRef,jurisdictionScope,serviceScope,now,expiry);if(preparationBinding){await context.env.RUNTIME_DB.batch([insert,context.env.RUNTIME_DB.prepare('INSERT INTO financial_preparation_grant_bindings(grant_id,binding_json,binding_digest) VALUES(?,?,?)').bind(id,JSON.stringify(preparationBinding),sha256Hex(preparationBinding))]);}else await insert.run();
 return {grantId:id,purpose,sourceRef:source.sourceRef,scopes,expiresAt:new Date(expiry).toISOString()};
}
export async function requireFinancialGrant(context,{grantId,source,purpose,scopes,language}){
 if(!Array.isArray(scopes)||!scopes.length||Array.from(scopes).some(x=>!allowed.includes(x))||new Set(scopes).size!==scopes.length)fail('PURPOSE_GRANT_SCOPE_INVALID');
 const row=await context.env.RUNTIME_DB.prepare('SELECT * FROM financial_purpose_grants WHERE grant_id=? AND owner_id=?').bind(grantId,grantOwner(context)).first();
 if(!row||row.revoked_at!==null||row.granted_at>Date.now()||row.expires_at<=Date.now()||row.purpose!==purpose||row.source_ref!==source.sourceRef||row.source_digest!==source.contentDigest)fail('PURPOSE_GRANT_INACTIVE');
 const granted=JSON.parse(row.data_scopes);if(scopes.some(s=>!granted.includes(s)))fail('PURPOSE_GRANT_SCOPE_INVALID');
 if(purpose==='REPORT'&&(!['en','zh-Hans'].includes(language)||row.service_scope!==`FINANCE_FACTUAL_R1:${language}`||row.jurisdiction_scope!=='FACTUAL_ONLY'||row.recipient_ref!==source.ownerRef))fail('REPORT_GRANT_SCOPE_MISMATCH');return row;
}
export async function revokeFinancialGrant(context,grantId){await context.env.RUNTIME_DB.prepare('UPDATE financial_purpose_grants SET revoked_at=? WHERE grant_id=? AND owner_id=? AND revoked_at IS NULL').bind(Date.now(),grantId,grantOwner(context)).run();}
