import crypto from 'node:crypto';
export const b64url=buf=>Buffer.from(buf).toString('base64url');
export const randomToken=(bytes=32)=>b64url(crypto.randomBytes(bytes));
export const pkceChallenge=verifier=>b64url(crypto.createHash('sha256').update(String(verifier),'utf8').digest());
export function buildAuthorizeUrl({host='https://webapi.moomoo.com',clientId,redirectUri,state,codeChallenge}={}){
  if(!clientId||!redirectUri||!state||!codeChallenge)throw new Error('MOOMOO_PKCE_AUTHORIZE_INPUT_REQUIRED');
  const u=new URL('/oauth2/authorize/confirm',host);
  u.searchParams.set('client_id',clientId);
  u.searchParams.set('code_challenge',codeChallenge);
  u.searchParams.set('code_challenge_method','S256');
  u.searchParams.set('redirect_uri',redirectUri);
  u.searchParams.set('response_type','code');
  u.searchParams.set('state',state);
  return u.toString();
}
export function assertLoopbackRedirect(uri){
  const u=new URL(uri);
  if(u.protocol!=='http:'||!['localhost','127.0.0.1','::1'].includes(u.hostname)||u.port!=='60355'||u.pathname!=='/callback')throw new Error('MOOMOO_PKCE_REDIRECT_NOT_ALLOWED');
  return true;
}
export function sanitizeClientRegistration(response={}){
  if(!response.client_id)throw new Error('MOOMOO_CLIENT_ID_MISSING');
  return {
    schemaVersion:'PHI-OS-MOOMOO-LOCAL-CLIENT-METADATA-v1.0.0',
    clientId:String(response.client_id),
    clientIdIssuedAt:response.client_id_issued_at??null,
    clientName:response.client_name??'PHI OS Moomoo OpenAPI',
    redirectUris:Array.isArray(response.redirect_uris)?response.redirect_uris:[],
    pkceRequired:Boolean(response.pkce_required),
    savedAt:new Date().toISOString()
  };
}

export function diagnoseAuthorizeUrl(url){
  const u=new URL(url);
  const required=['client_id','code_challenge','code_challenge_method','redirect_uri','response_type','state'];
  const unexpected=[...u.searchParams.keys()].filter(k=>!required.includes(k));
  const present=Object.fromEntries(required.map(k=>[k,u.searchParams.has(k)]));
  const values={
    codeChallengeMethod:u.searchParams.get('code_challenge_method'),
    responseType:u.searchParams.get('response_type'),
    redirectUri:u.searchParams.get('redirect_uri'),
    clientIdLength:(u.searchParams.get('client_id')||'').length,
    codeChallengeLength:(u.searchParams.get('code_challenge')||'').length,
    stateLength:(u.searchParams.get('state')||'').length
  };
  return {
    endpoint:u.origin+u.pathname,
    requiredPresent:present,
    unexpectedParameters:unexpected,
    formatChecks:{
      https:u.protocol==='https:',
      exactEndpoint:u.origin==='https://webapi.moomoo.com'&&u.pathname==='/oauth2/authorize/confirm',
      codeChallengeMethodS256:values.codeChallengeMethod==='S256',
      responseTypeCode:values.responseType==='code',
      redirectExact:values.redirectUri==='http://localhost:60355/callback',
      clientIdNonEmpty:values.clientIdLength>0,
      codeChallengeLengthValid:values.codeChallengeLength>=43&&values.codeChallengeLength<=128,
      stateNonEmpty:values.stateLength>0
    },
    redactedLengths:{
      clientId:values.clientIdLength,
      codeChallenge:values.codeChallengeLength,
      state:values.stateLength
    }
  };
}
