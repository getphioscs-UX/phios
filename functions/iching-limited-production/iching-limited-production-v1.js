const enc = new TextEncoder();
const dec = new TextDecoder();
const clean = value => String(value ?? '').normalize('NFKC').trim();
const csv = value => new Set(clean(value).split(',').map(x => x.trim()).filter(Boolean));
const lowerCsv = value => new Set([...csv(value)].map(x => x.toLowerCase()));
const base64url = bytes => {
  let text=''; for (const byte of new Uint8Array(bytes)) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const unbase64url = value => {
  const source=clean(value).replace(/-/g,'+').replace(/_/g,'/');
  const padded=source+'='.repeat((4-source.length%4)%4); const binary=atob(padded); const out=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i+=1) out[i]=binary.charCodeAt(i); return out;
};
const parseJsonSegment = value => JSON.parse(dec.decode(unbase64url(value)));
const sha40 = value => /^[0-9a-f]{40}$/i.test(clean(value));
const enabled = value => clean(value).toLowerCase()==='true';
const nowSeconds = clock => Math.floor(Number(clock?.() ?? Date.now())/1000);

export const ICHING_LIMITED_PRODUCTION_VERSION='1.0.0';
export const ICHING_LIMITED_COOKIE='__Host-PHIOS_ICHING_BETA';
export const ICHING_LIMITED_PROVIDER='CLOUDFLARE_ACCESS_LIMITED_V1';

function accessConfig(env={}){
  const teamDomain=clean(env.PHIOS_ACCESS_TEAM_DOMAIN).replace(/\/$/,'');
  const audiences=csv(env.PHIOS_ACCESS_AUD);
  const emails=lowerCsv(env.ICHING_LIMITED_PRODUCTION_EMAILS);
  const countries=new Set([...csv(env.ICHING_LIMITED_PRODUCTION_COUNTRIES)].map(x=>x.toUpperCase()));
  return Object.freeze({teamDomain,audiences,emails,countries});
}

function activationConfig(env={}){
  const deploymentSha=clean(env.ICHING_LIMITED_PRODUCTION_DEPLOYMENT_SHA).toLowerCase();
  const browserAcceptedSha=clean(env.ICHING_LIMITED_PRODUCTION_LIVE_BROWSER_ACCEPTED_SHA).toLowerCase();
  const currentSha=clean(env.CF_PAGES_COMMIT_SHA).toLowerCase();
  const rightsReviewId=clean(env.ICHING_LIMITED_PRODUCTION_RIGHTS_REVIEW_ID);
  const sessionSecret=clean(env.ICHING_LIMITED_PRODUCTION_SESSION_SECRET);
  return Object.freeze({
    enabled:enabled(env.ICHING_LIMITED_PRODUCTION_ENABLED), deploymentSha,browserAcceptedSha,currentSha,rightsReviewId,sessionSecret,
    shaAligned:sha40(deploymentSha)&&deploymentSha===currentSha&&browserAcceptedSha===currentSha,
    secretReady:sessionSecret.length>=32,
    rightsReviewPresent:Boolean(rightsReviewId)
  });
}

export function inspectIChingLimitedProductionConfiguration(context={}){
  const access=accessConfig(context.env); const activation=activationConfig(context.env); const country=clean(context.request?.cf?.country).toUpperCase();
  return Object.freeze({
    enabled:activation.enabled,
    accessConfigured:Boolean(access.teamDomain&&access.audiences.size&&access.emails.size),
    deploymentShaAligned:activation.shaAligned,
    rightsReviewPresent:activation.rightsReviewPresent,
    sessionSecretReady:activation.secretReady,
    countryAllowed:Boolean(country&&access.countries.has(country)),
    country:country||null,
    rightsReviewId:activation.rightsReviewId||null,
    currentSha:activation.currentSha||null
  });
}

export async function verifyCloudflareAccessJwt({jwt,teamDomain,audiences,allowedEmails,fetchImpl=fetch,clock}={}){
  const token=clean(jwt); if(!token) throw new Error('CLOUDFLARE_ACCESS_JWT_REQUIRED');
  teamDomain=clean(teamDomain).replace(/\/$/,''); if(!/^https:\/\/[a-z0-9.-]+\.cloudflareaccess\.com$/i.test(teamDomain)) throw new Error('CLOUDFLARE_ACCESS_TEAM_DOMAIN_INVALID');
  audiences=audiences instanceof Set?audiences:new Set(audiences||[]); allowedEmails=allowedEmails instanceof Set?allowedEmails:new Set(allowedEmails||[]);
  if(!audiences.size) throw new Error('CLOUDFLARE_ACCESS_AUDIENCE_REQUIRED');
  const parts=token.split('.'); if(parts.length!==3) throw new Error('CLOUDFLARE_ACCESS_JWT_INVALID');
  const header=parseJsonSegment(parts[0]); const payload=parseJsonSegment(parts[1]);
  if(header.alg!=='RS256'||!clean(header.kid)) throw new Error('CLOUDFLARE_ACCESS_JWT_ALGORITHM_REJECTED');
  const response=await fetchImpl(`${teamDomain}/cdn-cgi/access/certs`,{headers:{accept:'application/json'},redirect:'error'});
  if(!response?.ok) throw new Error('CLOUDFLARE_ACCESS_CERTS_UNAVAILABLE');
  const jwks=await response.json(); const jwk=(Array.isArray(jwks?.keys)?jwks.keys:[]).find(key=>key?.kid===header.kid&&key?.kty==='RSA');
  if(!jwk) throw new Error('CLOUDFLARE_ACCESS_SIGNING_KEY_NOT_FOUND');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,unbase64url(parts[2]),enc.encode(`${parts[0]}.${parts[1]}`));
  if(!valid) throw new Error('CLOUDFLARE_ACCESS_SIGNATURE_INVALID');
  const now=nowSeconds(clock); if(Number(payload.exp)<=now||Number(payload.nbf||0)>now+30) throw new Error('CLOUDFLARE_ACCESS_TOKEN_EXPIRED_OR_NOT_YET_VALID');
  if(clean(payload.iss).replace(/\/$/,'')!==teamDomain) throw new Error('CLOUDFLARE_ACCESS_ISSUER_MISMATCH');
  const tokenAud=Array.isArray(payload.aud)?payload.aud:[payload.aud]; if(!tokenAud.some(value=>audiences.has(clean(value)))) throw new Error('CLOUDFLARE_ACCESS_AUDIENCE_MISMATCH');
  const email=clean(payload.email).toLowerCase(); if(!email||!allowedEmails.has(email)) throw new Error('CLOUDFLARE_ACCESS_TESTER_NOT_ALLOWED');
  if(!clean(payload.sub)) throw new Error('CLOUDFLARE_ACCESS_SUBJECT_REQUIRED');
  return Object.freeze({email,subject:clean(payload.sub),issuer:teamDomain,audiences:Object.freeze(tokenAud.map(clean)),expiresAt:Number(payload.exp),verified:true});
}

async function hmacKey(secret){return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function hmac(secret,value){return new Uint8Array(await crypto.subtle.sign('HMAC',await hmacKey(secret),enc.encode(value)));}
async function testerId(secret,email){const bytes=await hmac(secret,`tester:${email.toLowerCase()}`);return `iching_beta_${base64url(bytes).slice(0,32)}`;}

export async function probeIChingLimitedProductionD1(db,{probeId,clock}={}){
  if(!db||typeof db.prepare!=='function') throw new Error('RUNTIME_DB_REQUIRED');
  const id=clean(probeId)||`iching_lp_probe_${crypto.randomUUID()}`; const timestamp=new Date(Number(clock?.()??Date.now())).toISOString(); let inserted=false;
  try{
    const schema=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='runtime_users' LIMIT 1").first();
    if(schema?.name!=='runtime_users') throw new Error('RUNTIME_DB_RUNTIME_USERS_SCHEMA_REQUIRED');
    await db.prepare("INSERT INTO runtime_users (user_id,status,created_at,updated_at) VALUES (?1,'probe',?2,?2)").bind(id,timestamp).run(); inserted=true;
    const row=await db.prepare('SELECT user_id,status FROM runtime_users WHERE user_id=?1 LIMIT 1').bind(id).first();
    if(row?.user_id!==id||row?.status!=='probe') throw new Error('RUNTIME_DB_PROBE_READBACK_FAILED');
    return Object.freeze({provider:'RUNTIME_DB_D1',writeReadVerified:true,probeId:id});
  } finally {
    if(inserted){try{await db.prepare('DELETE FROM runtime_users WHERE user_id=?1').bind(id).run();}catch{}}
  }
}

export async function createIChingLimitedSession(context,{fetchImpl=fetch,clock}={}){
  const config=inspectIChingLimitedProductionConfiguration(context); const access=accessConfig(context.env); const activation=activationConfig(context.env);
  if(!config.enabled) throw Object.assign(new Error('ICHING_LIMITED_PRODUCTION_DISABLED'),{status:503});
  if(!config.accessConfigured||!config.deploymentShaAligned||!config.rightsReviewPresent||!config.sessionSecretReady||!config.countryAllowed) throw Object.assign(new Error('ICHING_LIMITED_PRODUCTION_EXTERNAL_GATE_PENDING'),{status:503});
  const jwt=context.request.headers.get('cf-access-jwt-assertion');
  const verified=await verifyCloudflareAccessJwt({jwt,teamDomain:access.teamDomain,audiences:access.audiences,allowedEmails:access.emails,fetchImpl,clock});
  const d1=await probeIChingLimitedProductionD1(context.env.RUNTIME_DB,{clock});
  const userId=await testerId(activation.sessionSecret,verified.email); const issued=nowSeconds(clock); const maxAge=Math.max(300,Math.min(14400,Number(context.env.ICHING_LIMITED_PRODUCTION_SESSION_SECONDS)||1800));
  const payload=Object.freeze({v:1,userId,providerId:ICHING_LIMITED_PROVIDER,sessionId:`iching_lp_${crypto.randomUUID()}`,country:config.country,rightsReviewId:activation.rightsReviewId,deploymentSha:activation.currentSha,d1Verified:d1.writeReadVerified,iat:issued,exp:issued+maxAge});
  const body=base64url(enc.encode(JSON.stringify(payload))); const sig=base64url(await hmac(activation.sessionSecret,body));
  return Object.freeze({token:`${body}.${sig}`,payload,maxAge,access:Object.freeze({verified:true,emailAllowed:true}),d1});
}

export async function verifyIChingLimitedSession(context,{clock}={}){
  const activation=activationConfig(context.env); if(!activation.enabled||!activation.shaAligned||!activation.rightsReviewPresent||!activation.secretReady) return null;
  const cookie=clean(context.request.headers.get('cookie')); const pair=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${ICHING_LIMITED_COOKIE}=`)); if(!pair) return null;
  const token=pair.slice(ICHING_LIMITED_COOKIE.length+1); const parts=token.split('.'); if(parts.length!==2) return null;
  const expected=await hmac(activation.sessionSecret,parts[0]); let supplied; try{supplied=unbase64url(parts[1]);}catch{return null;}
  if(supplied.length!==expected.length||!await crypto.subtle.verify('HMAC',await hmacKey(activation.sessionSecret),supplied,enc.encode(parts[0]))) return null;
  let payload; try{payload=JSON.parse(dec.decode(unbase64url(parts[0])));}catch{return null;}
  const country=clean(context.request?.cf?.country).toUpperCase(); const allowedCountries=accessConfig(context.env).countries;
  if(payload?.v!==1||payload?.providerId!==ICHING_LIMITED_PROVIDER||!clean(payload.userId)||!clean(payload.sessionId)||payload.d1Verified!==true) return null;
  if(Number(payload.exp)<=nowSeconds(clock)||payload.deploymentSha!==activation.currentSha||payload.rightsReviewId!==activation.rightsReviewId) return null;
  if(!country||country!==payload.country||!allowedCountries.has(country)) return null;
  return Object.freeze(payload);
}

export function applyIChingLimitedAuthority(context,session){
  if(!session) return context;
  context.data ||= {};
  context.data.symbolicAccountIdentity=Object.freeze({userId:session.userId,providerId:session.providerId,sessionId:session.sessionId,verified:true,authenticated:true});
  context.data.ckaAccess=Object.freeze({accountState:'ACCOUNT',permission:true,privacy:true,entitlement:true,retentionPolicyAccepted:false,roles:Object.freeze(['ELIGIBLE_METHOD_USER'])});
  context.data.symbolicExecutionAuthority={...(context.data.symbolicExecutionAuthority||{}),I_CHING:Object.freeze({methodCode:'I_CHING',state:'LIMITED_PRODUCTION',runAllowed:true,humanAcceptance:true,verifiedPersistenceIdentity:true,liveBrowserAcceptance:true,liveProductionShaVerified:true,liveProductionSha:session.deploymentSha,rightsReviewId:session.rightsReviewId,limitedBeta:true})};
  return context;
}

export function limitedCookie(token,maxAge){return `${ICHING_LIMITED_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;}
