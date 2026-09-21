import {EncryptJWT,jwtDecrypt,jwtVerify,createLocalJWKSet} from 'jose';

export const SESSION_COOKIE='__Host-phios-session';
const TRANSACTION_COOKIE='__Host-phios-login';
const encoder=new TextEncoder();
const metadataCache=new Map();
const keysCache=new Map();
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});
const now=()=>Math.floor(Date.now()/1000);
export async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
function random(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');}
function config(context){
  const env=context.env||{},origin=new URL(context.request.url).origin;
  if(env.AUTH_PROVIDER!=='auth0'||!env.AUTH_CLIENT_ID||!env.AUTH_CLIENT_SECRET||String(env.AUTH_SESSION_SECRET||'').length<32||!env.RUNTIME_DB?.prepare)throw fail('AUTH_CONFIGURATION_REQUIRED',503);
  let issuer;try{issuer=new URL(env.AUTH_ISSUER);}catch{throw fail('AUTH_ISSUER_INVALID',503);}
  if(issuer.protocol!=='https:'||issuer.username||issuer.password||issuer.search||issuer.hash||issuer.pathname!=='/')throw fail('AUTH_ISSUER_INVALID',503);
  const callback=env.AUTH_CALLBACK_URL||`${origin}/api/auth/callback`;
  if(new URL(callback).origin!==origin||new URL(callback).pathname!=='/api/auth/callback'||new URL(callback).search||new URL(callback).hash||!origin.startsWith('https://'))throw fail('AUTH_CALLBACK_INVALID',503);
  return {issuer:issuer.href,origin,callback,clientId:env.AUTH_CLIENT_ID,clientSecret:env.AUTH_CLIENT_SECRET,secret:env.AUTH_SESSION_SECRET,db:env.RUNTIME_DB};
}
function endpoint(url,issuer){const parsed=new URL(url);if(parsed.origin!==new URL(issuer).origin||parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.hash)throw fail('AUTH_DISCOVERY_ENDPOINT_INVALID',503);return parsed.href;}
async function fetchJson(context,url,options={}){
  const response=await (context.fetch||fetch)(url,{...options,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw fail('AUTH_PROVIDER_UNAVAILABLE',502);
  const text=await response.text();if(text.length>1000000)throw fail('AUTH_PROVIDER_RESPONSE_INVALID',502);
  return JSON.parse(text);
}
export async function discover(context){
  const c=config(context),cached=metadataCache.get(c.issuer);
  if(cached?.expires>now())return cached.value;
  const metadata=await fetchJson(context,`${c.issuer}.well-known/openid-configuration`);
  if(metadata.issuer!==c.issuer||!metadata.id_token_signing_alg_values_supported?.includes('RS256'))throw fail('AUTH_DISCOVERY_ISSUER_INVALID',503);
  for(const key of ['authorization_endpoint','token_endpoint','jwks_uri'])metadata[key]=endpoint(metadata[key],c.issuer);
  if(metadata.end_session_endpoint)metadata.end_session_endpoint=endpoint(metadata.end_session_endpoint,c.issuer);
  metadataCache.set(c.issuer,{value:metadata,expires:now()+300});return metadata;
}
async function key(c,purpose){return crypto.subtle.digest('SHA-256',encoder.encode(`${purpose}\0${c.issuer}\0${c.clientId}\0${c.origin}\0${c.secret}`)).then(v=>new Uint8Array(v));}
async function seal(c,purpose,payload,expires){return new EncryptJWT(payload).setProtectedHeader({alg:'dir',enc:'A256GCM'}).setIssuer(c.issuer).setAudience(c.origin).setIssuedAt().setExpirationTime(expires).encrypt(await key(c,purpose));}
async function unseal(c,purpose,token){const {payload}=await jwtDecrypt(token,await key(c,purpose),{issuer:c.issuer,audience:c.origin,keyManagementAlgorithms:['dir'],contentEncryptionAlgorithms:['A256GCM'],requiredClaims:['exp','iat']});return payload;}
function cookie(request,name){const values=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(`${name}=`));return values.length===1?values[0].slice(name.length+1):null;}
function setCookie(name,value,maxAge){return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;}
function response(body,status=200,headers={}){const safe=new Headers(headers);safe.set('Cache-Control','private, no-store');safe.set('X-Robots-Tag','noindex, nofollow, noarchive');safe.set('Referrer-Policy','no-referrer');return new Response(body,{status,headers:safe});}
function json(value,status=200){return response(JSON.stringify(value),status,{'Content-Type':'application/json'});}
export function requireSameOrigin(request){if(request.headers.get('origin')!==new URL(request.url).origin)throw fail('AUTH_ORIGIN_REQUIRED',403);}
export async function verifyIdToken(context,token,nonce){
  const c=config(context),metadata=await discover(context);let cached=keysCache.get(c.issuer);
  if(!cached||cached.expires<=now()){cached={value:await fetchJson(context,metadata.jwks_uri),expires:now()+300};keysCache.set(c.issuer,cached);}
  let verified;
  try{verified=await jwtVerify(token,createLocalJWKSet(cached.value),{issuer:c.issuer,audience:c.clientId,algorithms:['RS256'],requiredClaims:['sub','exp','iat','nonce'],maxTokenAge:'10m'});}catch(error){
    if(error.code!=='ERR_JWKS_NO_MATCHING_KEY')throw error;
    cached={value:await fetchJson(context,metadata.jwks_uri),expires:now()+300};keysCache.set(c.issuer,cached);
    verified=await jwtVerify(token,createLocalJWKSet(cached.value),{issuer:c.issuer,audience:c.clientId,algorithms:['RS256'],requiredClaims:['sub','exp','iat','nonce'],maxTokenAge:'10m'});
  }
  const p=verified.payload;
  if(!nonce||p.nonce!==nonce||typeof p.sub!=='string'||!p.sub||p.sub.length>512||(p.azp&&p.azp!==c.clientId)||(Array.isArray(p.aud)&&p.aud.length>1&&p.azp!==c.clientId))throw fail('AUTH_TOKEN_INVALID',401);
  if(p.email_verified!==true)throw fail('AUTH_EMAIL_VERIFICATION_REQUIRED',403);
  return p;
}
async function resolveUser(c,subject){
  // Deterministic ID makes concurrent first logins converge. Email is deliberately
  // absent because users.email is UNIQUE and cannot be an account-linking key.
  const userId=`oidc_${await digest(`${c.issuer}\0${subject}`)}`,timestamp=new Date().toISOString();
  await c.db.batch([
    c.db.prepare("INSERT OR IGNORE INTO users(user_id,email,display_name,role,status,created_at,updated_at) VALUES(?,NULL,NULL,'explorer','active',?,?)").bind(userId,timestamp,timestamp),
    c.db.prepare('INSERT OR IGNORE INTO account_provider_subjects(issuer,subject,user_id,created_at) VALUES(?,?,?,?)').bind(c.issuer,subject,userId,timestamp)
  ]);
  const user=await c.db.prepare('SELECT u.user_id,u.status FROM account_provider_subjects p JOIN users u ON u.user_id=p.user_id WHERE p.issuer=? AND p.subject=?').bind(c.issuer,subject).first();
  if(!user||user.status!=='active')throw fail('AUTH_ACCOUNT_UNAVAILABLE',403);return user.user_id;
}
export async function authenticate(context){
  const token=cookie(context.request,SESSION_COOKIE);if(!token)return null;
  const c=config(context);let p;try{p=await unseal(c,'session',token);}catch{return null;}
  if(typeof p.sid!=='string'||typeof p.uid!=='string')return null;
  const row=await c.db.prepare('SELECT s.user_id FROM account_verified_sessions s JOIN users u ON u.user_id=s.user_id WHERE s.session_hash=? AND s.user_id=? AND s.issuer=? AND s.expires_at>? AND s.revoked_at IS NULL AND u.status=\'active\'').bind(await digest(p.sid),p.uid,c.issuer,now()).first();
  if(!row)return null;
  return Object.freeze({userId:row.user_id,providerId:c.issuer,sessionId:await digest(p.sid),verified:true,authenticated:true});
}
export async function authApi(context,action){
  try{
    const method=context.request.method;
    if((action==='logout'&&method!=='POST')||(action!=='logout'&&method!=='GET'))return json({ok:false,code:'METHOD_NOT_ALLOWED'},405);
    if(action==='session'){
      const identity=await authenticate(context);
      let ready=true;try{const c=config(context);const tables=await c.db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('account_provider_subjects','account_verified_sessions')").first();ready=tables?.n===2;}catch{ready=false;}
      return json({ok:true,authenticated:!!identity,verified:!!identity,providerConfigured:ready});
    }
    const c=config(context),url=new URL(context.request.url);
    if(action==='login'){
      const tables=await c.db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('account_provider_subjects','account_verified_sessions')").first();
      if(tables?.n!==2)throw fail('AUTH_MIGRATION_REQUIRED',503);
      const metadata=await discover(context),state=random(),nonce=random(),verifier=random(),expires=now()+600;
      const challenge=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(verifier))))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      const tx=await seal(c,'transaction',{state,nonce,verifier},expires),destination=new URL(metadata.authorization_endpoint);
      for(const [k,v] of Object.entries({client_id:c.clientId,redirect_uri:c.callback,response_type:'code',scope:'openid profile email',state,nonce,code_challenge:challenge,code_challenge_method:'S256'}))destination.searchParams.set(k,v);
      if(url.searchParams.get('mode')==='signup')destination.searchParams.set('screen_hint','signup');
      if(url.searchParams.get('locale')==='zh-Hans')destination.searchParams.set('ui_locales','zh-CN');
      return response(null,302,{Location:destination.href,'Set-Cookie':setCookie(TRANSACTION_COOKIE,tx,600)});
    }
    if(action==='callback'){
      const tx=await unseal(c,'transaction',cookie(context.request,TRANSACTION_COOKIE)||'');
      if(!url.searchParams.get('state')||url.searchParams.getAll('state').length!==1||tx.state!==url.searchParams.get('state')||!url.searchParams.get('code')||url.searchParams.getAll('code').length!==1||url.searchParams.get('code').length>4096)throw fail('AUTH_TRANSACTION_INVALID',401);
      const metadata=await discover(context),tokens=await fetchJson(context,metadata.token_endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:c.clientId,client_secret:c.clientSecret,code:url.searchParams.get('code'),redirect_uri:c.callback,code_verifier:tx.verifier})});
      const claims=await verifyIdToken(context,tokens.id_token,tx.nonce),userId=await resolveUser(c,claims.sub),sid=random(),expires=Math.min(now()+8*3600,claims.exp);
      await c.db.prepare('INSERT INTO account_verified_sessions(session_hash,user_id,issuer,expires_at,created_at) VALUES(?,?,?,?,?)').bind(await digest(sid),userId,c.issuer,expires,now()).run();
      const token=await seal(c,'session',{uid:userId,sid},expires),headers=new Headers({Location:`${c.origin}/account/`});
      headers.append('Set-Cookie',setCookie(TRANSACTION_COOKIE,'',0));headers.append('Set-Cookie',setCookie(SESSION_COOKIE,token,expires-now()));
      return response(null,302,headers);
    }
    if(action==='logout'){
      requireSameOrigin(context.request);const identity=await authenticate(context);
      if(identity)await c.db.prepare('UPDATE account_verified_sessions SET revoked_at=? WHERE session_hash=? AND user_id=?').bind(now(),identity.sessionId,identity.userId).run();
      let destination=`${c.origin}/account/`;
      const metadata=await discover(context).catch(()=>null);
      if(metadata?.end_session_endpoint){const target=new URL(metadata.end_session_endpoint);target.searchParams.set('client_id',c.clientId);target.searchParams.set('post_logout_redirect_uri',destination);destination=target.href;}
      return response(null,303,{Location:destination,'Set-Cookie':setCookie(SESSION_COOKIE,'',0)});
    }
    return json({ok:false,code:'NOT_FOUND'},404);
  }catch(error){
    // Never echo provider responses, authorization codes, cookies or input.
    const code=/^AUTH_[A-Z_]+$/.test(error.code||'')?error.code:'AUTH_REQUEST_FAILED';
    const html=['login','callback'].includes(action)&&context.request.headers.get('accept')?.includes('text/html');
    const verification=code==='AUTH_EMAIL_VERIFICATION_REQUIRED';
    const res=html?response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PHI OS account</title><link rel="stylesheet" href="/assets/customer-ui/base.css"><main class="cx-container"><h1>${verification?'Verify your email':'Sign-in could not finish'}</h1><p>${verification?'Open the verification email from your account provider, then sign in again.':'Please try signing in again. If this continues, return to your account page later.'}</p><p lang="zh-Hans">${verification?'请打开账户验证邮件，完成邮箱验证后重新登录。':'登录暂未完成。请重试；若仍无法登录，请稍后返回账户页面。'}</p><p><a href="/api/auth/login">Sign in again · 重新登录</a></p><p><a href="/account/">Return to account · 返回账户</a></p></main></html>`,error.status||401,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'"}):json({ok:false,code},error.status||401);
    if(action==='callback')res.headers.append('Set-Cookie',setCookie(TRANSACTION_COOKIE,'',0));
    return res;
  }
}
