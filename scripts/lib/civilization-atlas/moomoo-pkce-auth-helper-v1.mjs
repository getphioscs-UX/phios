import crypto from 'node:crypto';
export const b64url=buf=>Buffer.from(buf).toString('base64url');
export const randomToken=(bytes=32)=>b64url(crypto.randomBytes(bytes));
export const pkceChallenge=verifier=>b64url(crypto.createHash('sha256').update(String(verifier),'utf8').digest());
export function buildAuthorizeUrl({host='https://webapi.moomoo.com',clientId,redirectUri,state,codeChallenge,scope='quote:read'}={}){
  if(!clientId||!redirectUri||!state||!codeChallenge)throw new Error('MOOMOO_PKCE_AUTHORIZE_INPUT_REQUIRED');
  const u=new URL('/oauth2/authorize/confirm',host);
  u.searchParams.set('client_id',clientId);
  u.searchParams.set('code_challenge',codeChallenge);
  u.searchParams.set('code_challenge_method','S256');
  u.searchParams.set('redirect_uri',redirectUri);
  u.searchParams.set('response_type','code');
  u.searchParams.set('state',state);
  if(scope)u.searchParams.set('scope',scope);
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
