/**
 * PHI OS I Ching FULL_PRODUCTION server authority.
 *
 * Authority lives in RUNTIME_DB and is promoted once per immutable I Ching release.
 * The promotion commit is recorded as evidence, while later unrelated site deployments
 * may continue consuming the same release-scoped authority.
 * Static files, client state, request bodies, query parameters, countries and
 * headers cannot promote production. Global public execution is a property of
 * the promoted D1 authority record, and guest persistence remains explicit-
 * consent-only through a signed anonymous session.
 */
export const ICHING_FULL_PRODUCTION_AUTHORITY_SCHEMA='PHI-OS-ICHING-FULL-PRODUCTION-AUTHORITY-v1.1.0';
export const ICHING_FULL_PRODUCTION_AUTHORITY_RUNTIME_ID='system_capability_iching_full_production';
export const ICHING_FULL_PRODUCTION_AUTHORITY_ARTIFACT_ID='system_capability_iching_full_production_authority';
export const ICHING_FULL_PRODUCTION_AUTHORITY_USER_ID='__phios_system_authority__';
export const ICHING_FULL_PRODUCTION_AUTHORITY_ARTIFACT_TYPE='system_capability_authority';
export const ICHING_FULL_PRODUCTION_RELEASE_ID='ICHING-1.0.1';
export const ICHING_GUEST_COOKIE='__Host-PHIOS_ICHING_GUEST';
export const ICHING_GUEST_PROVIDER='PHIOS_ICHING_GUEST_SESSION_V1';

const enc=new TextEncoder();
const dec=new TextDecoder();
const clean=v=>String(v??'').normalize('NFKC').trim();
const fullSha=v=>/^[a-f0-9]{40}$/i.test(clean(v));
const parse=v=>{try{return typeof v==='string'?JSON.parse(v):v;}catch{return null;}};
const enabled=v=>['1','true','yes','on'].includes(clean(v).toLowerCase());
const b64=bytes=>{let text='';for(const byte of new Uint8Array(bytes))text+=String.fromCharCode(byte);return btoa(text).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64=value=>{const source=clean(value).replace(/-/g,'+').replace(/_/g,'/');const padded=source+'='.repeat((4-source.length%4)%4);const binary=atob(padded);const out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out;};
const hmacKey=secret=>crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const hmac=async(secret,value)=>new Uint8Array(await crypto.subtle.sign('HMAC',await hmacKey(secret),enc.encode(value)));
const days=v=>Math.max(1,Math.min(90,Number(v)||30));
const denied=(state,extra={})=>Object.freeze({
  authorized:false,state,runAllowed:false,fullProduction:false,globalPublicExecution:false,
  guestPersistenceAllowed:false,productionCapabilityPromoted:false,approvedCommitSha:null,
  clientMayGrantAuthority:false,...extra
});

export function validateIChingFullProductionAuthorityRecord(record={},liveSha='',env={}){
  const payload=parse(record);const sha=clean(liveSha);const secret=clean(env.ICHING_FULL_PRODUCTION_GUEST_SESSION_SECRET);
  if(!fullProductionEnabled(env))return denied('FULL_PRODUCTION_DISABLED_BY_ENV',{liveProductionSha:fullSha(sha)?sha:null});
  if(!payload||payload.schemaVersion!==ICHING_FULL_PRODUCTION_AUTHORITY_SCHEMA||payload.methodCode!=='I_CHING')return denied('FULL_PRODUCTION_AUTHORITY_NOT_PROMOTED');
  const gates=payload.gates||{};const promotionSha=clean(payload.promotionCommitSha||payload.approvedCommitSha);
  const releaseAligned=payload.releaseId===ICHING_FULL_PRODUCTION_RELEASE_ID&&payload.authorityScope==='RELEASE';
  const ok=releaseAligned&&payload.state==='FULL_PRODUCTION'&&payload.runAllowed===true&&
    payload.fullProduction===true&&payload.globalPublicExecution===true&&payload.guestPersistenceAllowed===true&&payload.productionCapabilityPromoted===true&&
    gates.w33FinalLimitedProductionAcceptance===true&&gates.humanApprovedDepth448===true&&gates.bilingualRuntime896===true&&
    gates.initialPromotionExactShaVerified===true&&gates.releaseScopedDeploymentContinuity===true&&gates.verifiedPersistenceProvider===true&&gates.globalRightsReviewAttested===true&&
    gates.guestPersistenceExplicitConsentRequired===true&&fullSha(promotionSha)&&fullSha(sha)&&secret.length>=32;
  if(!ok)return denied(secret.length<32?'GUEST_SESSION_SECRET_NOT_CONFIGURED':'FULL_PRODUCTION_AUTHORITY_INVALID_OR_INCOMPLETE',{
    approvedCommitSha:fullSha(promotionSha)?promotionSha:null,promotionCommitSha:fullSha(promotionSha)?promotionSha:null,liveProductionSha:fullSha(sha)?sha:null,
    releaseId:payload?.releaseId||null,authorityScope:payload?.authorityScope||null
  });
  return Object.freeze({
    authorized:true,state:'FULL_PRODUCTION',runAllowed:true,fullProduction:true,limitedProduction:false,
    globalPublicExecution:true,guestPersistenceAllowed:true,productionCapabilityPromoted:true,
    approvedCommitSha:promotionSha,promotionCommitSha:promotionSha,liveProductionSha:sha,
    deploymentContinuityApplied:promotionSha!==sha,authorityScope:'RELEASE',promotedAt:payload.promotedAt||null,
    releaseId:payload.releaseId,rightsReviewId:payload.rightsReviewId||null,rightsScope:'GLOBAL',
    guestRetentionDays:days(payload?.persistence?.guestRetentionDays),clientMayGrantAuthority:false
  });
}

export async function readIChingFullProductionAuthorityRecord(db){
  if(!db||typeof db.prepare!=='function')return null;
  try{
    const row=await db.prepare(`SELECT a.payload AS payload FROM runtimes r JOIN runtime_artifacts a ON a.runtime_id=r.runtime_id WHERE r.runtime_id=?1 AND r.user_id=?2 AND a.artifact_id=?3 AND a.artifact_type=?4 LIMIT 1`)
      .bind(ICHING_FULL_PRODUCTION_AUTHORITY_RUNTIME_ID,ICHING_FULL_PRODUCTION_AUTHORITY_USER_ID,ICHING_FULL_PRODUCTION_AUTHORITY_ARTIFACT_ID,ICHING_FULL_PRODUCTION_AUTHORITY_ARTIFACT_TYPE).first();
    return parse(row?.payload??null);
  }catch{return null;}
}

export async function resolveIChingFullProductionAuthority(context={}){
  const liveSha=clean(context?.env?.CF_PAGES_COMMIT_SHA);const db=context?.env?.RUNTIME_DB;
  if(!db||typeof db.prepare!=='function')return denied('RUNTIME_DB_PRODUCTION_AUTHORITY_UNAVAILABLE',{liveProductionSha:fullSha(liveSha)?liveSha:null});
  const record=await readIChingFullProductionAuthorityRecord(db);
  return validateIChingFullProductionAuthorityRecord(record,liveSha,context.env||{});
}

export function createIChingFullProductionAuthorityPayload({approvedCommitSha,rightsReviewId,guestRetentionDays=30,promotedAt=new Date().toISOString(),active=true}={}){
  const sha=clean(approvedCommitSha);const rights=clean(rightsReviewId);
  if(!fullSha(sha))throw new TypeError('ICHING_FULL_PRODUCTION_PROMOTION_COMMIT_SHA_REQUIRED');
  if(!rights)throw new TypeError('ICHING_FULL_PRODUCTION_GLOBAL_RIGHTS_REVIEW_ID_REQUIRED');
  return Object.freeze({
    schemaVersion:ICHING_FULL_PRODUCTION_AUTHORITY_SCHEMA,authorityVersion:'1.1.0',releaseId:ICHING_FULL_PRODUCTION_RELEASE_ID,methodCode:'I_CHING',authorityScope:'RELEASE',
    state:active?'FULL_PRODUCTION':'REVOKED',runAllowed:active,fullProduction:active,globalPublicExecution:active,guestPersistenceAllowed:active,
    productionCapabilityPromoted:active,approvedCommitSha:sha,promotionCommitSha:sha,promotedAt,rightsReviewId:rights,rightsScope:'GLOBAL',
    gates:Object.freeze({w33FinalLimitedProductionAcceptance:true,humanApprovedDepth448:true,bilingualRuntime896:true,initialPromotionExactShaVerified:true,
      releaseScopedDeploymentContinuity:true,verifiedPersistenceProvider:true,globalRightsReviewAttested:true,guestPersistenceExplicitConsentRequired:true}),
    deploymentContinuity:Object.freeze({mode:'RELEASE_SCOPED',initialPromotionCommitSha:sha,subsequentExactShaMatchRequired:false,
      unrelatedDeploymentMayRemainActive:true,releaseIdMustRemainCurrent:true,explicitRevocationSupported:true}),
    boundaries:Object.freeze({fortuneTellingAuthority:false,predictionAuthority:false,diagnosticAuthority:false,hiddenStateAuthority:false,professionalDirectiveAuthority:false,decisionAuthority:'USER'}),
    persistence:Object.freeze({provider:'RUNTIME_DB_D1',guestPersistence:true,guestPersistenceRequiresExplicitConsent:true,automaticPersistence:false,
      guestRetentionDays:days(guestRetentionDays),browserLocalFallback:false,canonicalRealityCreated:false}),
    clientMayGrantAuthority:false
  });
}

function guestSecret(context){return clean(context?.env?.ICHING_FULL_PRODUCTION_GUEST_SESSION_SECRET);}
function cookieValue(request){const raw=clean(request?.headers?.get?.('cookie'));const pair=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${ICHING_GUEST_COOKIE}=`));return pair?pair.slice(ICHING_GUEST_COOKIE.length+1):'';}

export async function verifyIChingGuestSession(context,{clock=Date.now}={}){
  const secret=guestSecret(context);if(secret.length<32)return null;const token=cookieValue(context?.request);if(!token)return null;
  const parts=token.split('.');if(parts.length!==2)return null;let supplied;try{supplied=unb64(parts[1]);}catch{return null;}
  const expected=await hmac(secret,parts[0]);if(supplied.length!==expected.length||!await crypto.subtle.verify('HMAC',await hmacKey(secret),supplied,enc.encode(parts[0])))return null;
  let payload;try{payload=JSON.parse(dec.decode(unb64(parts[0])));}catch{return null;}
  const acceptedGuestReleaseIds=new Set(['ICHING-1.0.0',ICHING_FULL_PRODUCTION_RELEASE_ID]);
  if(payload?.v!==1||payload?.providerId!==ICHING_GUEST_PROVIDER||!acceptedGuestReleaseIds.has(clean(payload?.releaseId))||!/^iching_guest_[A-Za-z0-9_-]{20,64}$/.test(clean(payload.userId)))return null;
  const now=Math.floor(Number(clock())/1000);if(Number(payload.exp)<=now||Number(payload.iat)>now+30)return null;
  return Object.freeze(payload);
}

export async function createIChingGuestSession(context,{clock=Date.now}={}){
  const secret=guestSecret(context);if(secret.length<32)throw new Error('ICHING_FULL_PRODUCTION_GUEST_SESSION_SECRET_REQUIRED');
  const authority=await resolveIChingFullProductionAuthority(context);if(!authority.authorized||authority.guestPersistenceAllowed!==true)throw new Error('ICHING_FULL_PRODUCTION_GUEST_SESSION_NOT_ALLOWED');
  const now=Math.floor(Number(clock())/1000);const maxAge=authority.guestRetentionDays*86400;
  const payload=Object.freeze({v:1,userId:`iching_guest_${b64(crypto.getRandomValues(new Uint8Array(24)))}`,providerId:ICHING_GUEST_PROVIDER,guest:true,iat:now,exp:now+maxAge,releaseId:authority.releaseId});
  const body=b64(enc.encode(JSON.stringify(payload)));const sig=b64(await hmac(secret,body));return Object.freeze({payload,token:`${body}.${sig}`,maxAge});
}

export async function ensureIChingGuestSession(context,options={}){
  const existing=await verifyIChingGuestSession(context,options);if(existing)return Object.freeze({session:existing,setCookie:null,created:false});
  const created=await createIChingGuestSession(context,options);return Object.freeze({session:created.payload,setCookie:guestCookie(created.token,created.maxAge),created:true});
}

export function guestCookie(token,maxAge){return `${ICHING_GUEST_COOKIE}=${token}; Path=/; Max-Age=${Math.max(60,Number(maxAge)||60)}; HttpOnly; Secure; SameSite=Lax`;}
export function clearGuestCookie(){return `${ICHING_GUEST_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;}
export function guestPersistenceIdentity(session={}){if(session?.guest!==true||session?.providerId!==ICHING_GUEST_PROVIDER||!clean(session.userId))return null;return Object.freeze({userId:clean(session.userId),providerId:ICHING_GUEST_PROVIDER,sessionId:null,verified:true,authenticated:true,guest:true,source:'SIGNED_SERVER_GUEST_SESSION'});}
export function explicitGuestRetentionConsent(body={}){const c=body?.retentionConsent;return Boolean(c&&c.accepted===true&&clean(c.scope)==='SYMBOLIC_READING'&&clean(c.policyVersion)==='ICHING-GUEST-RETENTION-v1');}
export function fullProductionEnabled(env={}){return enabled(env.ICHING_FULL_PRODUCTION_ENABLED??'true');}
