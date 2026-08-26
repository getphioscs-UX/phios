/**
 * PHI OS TPA-M — trusted server-side Tarot LIMITED_PRODUCTION authority.
 *
 * Authority is stored in the existing RUNTIME_DB D1 schema. The record is
 * commit-pinned: a new Pages deployment automatically fails closed until the
 * new exact SHA is promoted. Request body/query/header input is never read.
 */
export const TAROT_PRODUCTION_AUTHORITY_SCHEMA='PHI-OS-TAROT-LIMITED-PRODUCTION-AUTHORITY-v1.0.0';
export const TAROT_PRODUCTION_AUTHORITY_RUNTIME_ID='system_capability_tarot_limited_production';
export const TAROT_PRODUCTION_AUTHORITY_ARTIFACT_ID='system_capability_tarot_limited_production_authority';
export const TAROT_PRODUCTION_AUTHORITY_USER_ID='__phios_system_authority__';
export const TAROT_PRODUCTION_AUTHORITY_ARTIFACT_TYPE='system_capability_authority';
export const TAROT_SOURCE_HUMAN_ACCEPTANCE=true;
export const TAROT_SOURCE_BROWSER_ACCEPTANCE=true;

const clean=v=>String(v??'').trim();
const fullSha=v=>/^[a-f0-9]{40}$/i.test(clean(v));
const parse=v=>{try{return typeof v==='string'?JSON.parse(v):v;}catch{return null;}};
const denied=(state,extra={})=>Object.freeze({
  authorized:false,state,runAllowed:false,limitedProduction:false,
  humanAcceptance:TAROT_SOURCE_HUMAN_ACCEPTANCE,sourceBrowserAcceptance:TAROT_SOURCE_BROWSER_ACCEPTANCE,
  verifiedPersistenceProvider:false,liveProductionShaVerified:false,productionCapabilityPromoted:false,
  approvedCommitSha:null,clientMayGrantAuthority:false,...extra
});

export function validateTarotProductionAuthorityRecord(record={},liveSha=''){
  const payload=parse(record);
  if(!payload||payload.schemaVersion!==TAROT_PRODUCTION_AUTHORITY_SCHEMA||payload.methodCode!=='TAROT')return denied('SERVER_PRODUCTION_AUTHORITY_NOT_PROMOTED');
  const sha=clean(liveSha);
  const gates=payload.gates||{};
  const ok=payload.state==='LIMITED_PRODUCTION'&&payload.runAllowed===true&&payload.productionCapabilityPromoted===true&&
    gates.humanAcceptance===true&&gates.liveBrowserAcceptance===true&&gates.productionShaAlignment===true&&gates.verifiedPersistenceProvider===true&&
    fullSha(payload.approvedCommitSha)&&fullSha(sha)&&payload.approvedCommitSha===sha;
  if(!ok){
    const state=fullSha(payload.approvedCommitSha)&&fullSha(sha)&&payload.approvedCommitSha!==sha
      ?'DEPLOYED_SHA_NOT_PROMOTED'
      :'SERVER_PRODUCTION_AUTHORITY_INVALID_OR_INCOMPLETE';
    return denied(state,{approvedCommitSha:fullSha(payload.approvedCommitSha)?payload.approvedCommitSha:null,liveProductionSha:fullSha(sha)?sha:null});
  }
  return Object.freeze({
    authorized:true,state:'LIMITED_PRODUCTION',runAllowed:true,limitedProduction:true,
    humanAcceptance:true,sourceBrowserAcceptance:true,verifiedPersistenceProvider:true,
    liveProductionShaVerified:true,productionCapabilityPromoted:true,
    approvedCommitSha:payload.approvedCommitSha,liveProductionSha:sha,
    promotedAt:payload.promotedAt||null,authorityVersion:payload.authorityVersion||'1.0.0',
    clientMayGrantAuthority:false
  });
}

/** Compatibility-only synchronous inspection of trusted request context.
 * Historical Phase-K acceptance uses this path; production routes use the
 * async D1 resolver below.
 */
export function inspectTarotExecutionAuthority(context={}){
  const authority=context?.data?.symbolicExecutionAuthority?.TAROT;
  const liveSha=clean(context?.env?.CF_PAGES_COMMIT_SHA);
  if(!authority)return denied('SERVER_PRODUCTION_AUTHORITY_NOT_PROMOTED');
  const normalized={
    schemaVersion:TAROT_PRODUCTION_AUTHORITY_SCHEMA,
    methodCode:'TAROT',state:authority.state,runAllowed:authority.runAllowed,
    productionCapabilityPromoted:authority.productionCapabilityPromoted??authority.runAllowed,
    approvedCommitSha:authority.approvedCommitSha??authority.liveProductionSha,
    promotedAt:authority.promotedAt??null,
    gates:{
      humanAcceptance:authority.humanAcceptance,
      liveBrowserAcceptance:authority.liveBrowserAcceptance,
      productionShaAlignment:authority.liveProductionShaVerified,
      verifiedPersistenceProvider:authority.verifiedPersistenceProvider??authority.verifiedPersistenceIdentity
    }
  };
  return validateTarotProductionAuthorityRecord(normalized,liveSha);
}

export async function readTarotProductionAuthorityRecord(db){
  if(!db||typeof db.prepare!=='function')return null;
  try{
    const row=await db.prepare(`SELECT a.payload AS payload FROM runtimes r JOIN runtime_artifacts a ON a.runtime_id=r.runtime_id WHERE r.runtime_id=?1 AND r.user_id=?2 AND a.artifact_id=?3 AND a.artifact_type=?4 LIMIT 1`)
      .bind(TAROT_PRODUCTION_AUTHORITY_RUNTIME_ID,TAROT_PRODUCTION_AUTHORITY_USER_ID,TAROT_PRODUCTION_AUTHORITY_ARTIFACT_ID,TAROT_PRODUCTION_AUTHORITY_ARTIFACT_TYPE).first();
    return parse(row?.payload??null);
  }catch{return null;}
}

export async function resolveTarotExecutionAuthority(context={}){
  const liveSha=clean(context?.env?.CF_PAGES_COMMIT_SHA);
  const db=context?.env?.RUNTIME_DB;
  if(!db||typeof db.prepare!=='function')return denied('RUNTIME_DB_PRODUCTION_AUTHORITY_UNAVAILABLE',{liveProductionSha:fullSha(liveSha)?liveSha:null});
  const record=await readTarotProductionAuthorityRecord(db);
  return validateTarotProductionAuthorityRecord(record,liveSha);
}

export function createTarotProductionAuthorityPayload({approvedCommitSha,promotedAt=new Date().toISOString()}={}){
  const sha=clean(approvedCommitSha);
  if(!fullSha(sha))throw new TypeError('TAROT_PRODUCTION_APPROVED_COMMIT_SHA_REQUIRED');
  return Object.freeze({
    schemaVersion:TAROT_PRODUCTION_AUTHORITY_SCHEMA,authorityVersion:'1.0.0',methodCode:'TAROT',
    state:'LIMITED_PRODUCTION',runAllowed:true,productionCapabilityPromoted:true,
    approvedCommitSha:sha,promotedAt,
    gates:Object.freeze({humanAcceptance:true,liveBrowserAcceptance:true,productionShaAlignment:true,verifiedPersistenceProvider:true}),
    boundaries:Object.freeze({fortuneTellingAuthority:false,predictionAuthority:false,diagnosticAuthority:false,hiddenStateAuthority:false,professionalDirectiveAuthority:false,decisionAuthority:'USER'}),
    persistence:Object.freeze({provider:'RUNTIME_DB_D1',guestPersistence:false,accountPersistenceRequiresVerifiedServerIdentityAndRetention:true}),
    clientMayGrantAuthority:false
  });
}
