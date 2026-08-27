/** PHI OS canonical Tarot FULL_PRODUCTION authority.
 * Release-scoped and permanent for TAROT-1.0.0. Normal execution is not a D1 activation lease.
 * D1 may carry an explicit release revocation, but missing D1 never expires an accepted release.
 */
export const TAROT_FULL_PRODUCTION_RELEASE_ID='TAROT-1.0.0';
export const TAROT_FULL_PRODUCTION_AUTHORITY_DIGEST='1af9a57c7e7e2e23e235d709dda6c0cfc48d73f5d6f74878bc843dcbd01bca4a';
export const TAROT_FULL_PRODUCTION_AUTHORITY_SCHEMA='PHI-OS-TAROT-FULL-PRODUCTION-AUTHORITY-v1.1.0';
export const TAROT_REVOCATION_RUNTIME_ID='system_capability_tarot_full_production';
export const TAROT_REVOCATION_ARTIFACT_ID='system_capability_tarot_full_production_authority';
export const TAROT_REVOCATION_USER_ID='__phios_system_authority__';
export const TAROT_REVOCATION_ARTIFACT_TYPE='system_capability_authority';
const parse=v=>{try{return typeof v==='string'?JSON.parse(v):v;}catch{return null;}};
const base=()=>({authorized:true,state:'FULL_PRODUCTION',runAllowed:true,fullProduction:true,limitedProduction:false,productionCapabilityPromoted:true,releaseId:TAROT_FULL_PRODUCTION_RELEASE_ID,authorityScope:'RELEASE',authorityDigest:TAROT_FULL_PRODUCTION_AUTHORITY_DIGEST,normalProductionExpiry:null,ordinaryDeploymentRequiresRepromotion:false,executionRequiresPersistenceActivationRecord:false,clientMayGrantAuthority:false});
async function readOptionalAuthorityRecord(db){if(!db||typeof db.prepare!=='function')return null;try{const row=await db.prepare(`SELECT a.payload AS payload FROM runtimes r JOIN runtime_artifacts a ON a.runtime_id=r.runtime_id WHERE r.runtime_id=?1 AND r.user_id=?2 AND a.artifact_id=?3 AND a.artifact_type=?4 LIMIT 1`).bind(TAROT_REVOCATION_RUNTIME_ID,TAROT_REVOCATION_USER_ID,TAROT_REVOCATION_ARTIFACT_ID,TAROT_REVOCATION_ARTIFACT_TYPE).first();return parse(row?.payload??null);}catch{return null;}}
function explicitRevocation(record){return !!(record&&record.methodCode==='TAROT'&&record.releaseId===TAROT_FULL_PRODUCTION_RELEASE_ID&&record.authorityDigest===TAROT_FULL_PRODUCTION_AUTHORITY_DIGEST&&(record.state==='REVOKED'||record.runAllowed===false)&&record.explicitRevocation===true);}
export async function resolveTarotExecutionAuthority(context={}){const record=await readOptionalAuthorityRecord(context?.env?.RUNTIME_DB);if(explicitRevocation(record))return Object.freeze({...base(),authorized:false,state:'FULL_PRODUCTION_EXPLICITLY_REVOKED',runAllowed:false,fullProduction:false,productionCapabilityPromoted:false,revokedAt:record.revokedAt||null});return Object.freeze({...base(),liveProductionSha:String(context?.env?.CF_PAGES_COMMIT_SHA||'').trim()||null,revocationRecordChecked:!!context?.env?.RUNTIME_DB});}
export function inspectTarotExecutionAuthority(){return Object.freeze(base());}
export function createTarotExplicitRevocationPayload({revokedAt=new Date().toISOString(),reason='OPERATOR_REVOCATION'}={}){return Object.freeze({schemaVersion:TAROT_FULL_PRODUCTION_AUTHORITY_SCHEMA,methodCode:'TAROT',releaseId:TAROT_FULL_PRODUCTION_RELEASE_ID,authorityDigest:TAROT_FULL_PRODUCTION_AUTHORITY_DIGEST,state:'REVOKED',runAllowed:false,explicitRevocation:true,revokedAt,reason,expiresAt:null});}
