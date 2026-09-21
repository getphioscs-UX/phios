import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import {DatabaseSync} from 'node:sqlite';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {authApi} from '../functions/account/oidc-auth.js';
import {createSqliteD1Adapter} from './runtime-migration-loader.mjs';
const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE);
const database=new DatabaseSync(':memory:');
for(const f of fs.readdirSync('db/migrations').filter(f=>f.endsWith('.sql')).sort())database.exec(fs.readFileSync(`db/migrations/${f}`,'utf8'));
const env={AUTH_PROVIDER:'auth0',AUTH_CLIENT_ID:'browser-fixture',AUTH_CLIENT_SECRET:'browser-fixture-only',AUTH_SESSION_SECRET:'browser-fixture-session-secret-not-production-0001',RUNTIME_DB:createSqliteD1Adapter(database)};
const {publicKey,privateKey}=await generateKeyPair('RS256'),jwk={...await exportJWK(publicKey),kid:'fixture',alg:'RS256',use:'sig'};
let nonce,challenge,origin;
const fetcher=async (url,options)=>{
 if(url.endsWith('openid-configuration'))return Response.json({issuer:env.AUTH_ISSUER,authorization_endpoint:origin+'/authorize',token_endpoint:origin+'/token',jwks_uri:origin+'/jwks',end_session_endpoint:origin+'/logout',id_token_signing_alg_values_supported:['RS256']});
 if(url.endsWith('/jwks'))return Response.json({keys:[jwk]});
 if(url.endsWith('/token')){
  const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(options.body.get('code_verifier')))).toString('base64url');assert.equal(hash,challenge);
  return Response.json({id_token:await new SignJWT({nonce,email_verified:true}).setProtectedHeader({alg:'RS256',kid:'fixture'}).setIssuer(env.AUTH_ISSUER).setAudience(env.AUTH_CLIENT_ID).setSubject('fixture-person').setIssuedAt().setExpirationTime('5m').sign(privateKey)});
 }
 throw new Error('Unexpected provider URL');
};
const server=https.createServer({key:fs.readFileSync(process.env.PHIOS_TEST_TLS_KEY||'.tmp/fw-test-key.pem'),cert:fs.readFileSync(process.env.PHIOS_TEST_TLS_CERT||'.tmp/fw-test-cert.pem')},async(req,res)=>{
 try{
  const url=new URL(req.url,origin);
  if(url.pathname==='/authorize'){nonce=url.searchParams.get('nonce');challenge=url.searchParams.get('code_challenge');res.writeHead(302,{location:`${origin}/api/auth/callback?code=fixture&state=${url.searchParams.get('state')}`});return res.end();}
  if(url.pathname==='/logout'){res.writeHead(302,{location:origin+'/account/'});return res.end();}
  if(url.pathname.startsWith('/api/auth/')){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const result=await authApi({request:new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env,fetch:fetcher},url.pathname.split('/').at(-1));
   const headers=Object.fromEntries(result.headers),cookies=result.headers.getSetCookie();if(cookies.length)headers['set-cookie']=cookies;
   res.writeHead(result.status,headers);return res.end(await result.text());
  }
  if(url.pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});return res.end(JSON.stringify({ok:false,available:false}));}
  const relative=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname,file=path.resolve('.','.'+relative);
  if(!file.startsWith(path.resolve('.')+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  const type={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'content-type':type});res.end(fs.readFileSync(file));
 }catch{res.writeHead(500);res.end('Fixture server failed');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`https://127.0.0.1:${server.address().port}`;env.AUTH_ISSUER=origin+'/';
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],out='docs/financial-will-successor-r1/fw-production';fs.mkdirSync(`${out}/screenshots`,{recursive:true});
try{
 for(const locale of ['en','zh-Hans'])for(const width of [1440,390]){
  const ctx=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height:1000}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${origin}/account/?lang=${locale}`);
  await page.evaluate(async lang=>{const {applyCustomerLocale}=await import('/assets/customer-ui/js/locale.js');applyCustomerLocale(lang);},locale);
  await page.locator('a[href^="/api/auth/login"]').first().waitFor();await page.locator('a[href^="/api/auth/login"]').first().click();
  await page.locator('form[action="/api/auth/logout"]').waitFor();
  await page.evaluate(async lang=>{const {applyCustomerLocale}=await import('/assets/customer-ui/js/locale.js');applyCustomerLocale(lang);},locale);
  assert.equal(await page.locator('body').getAttribute('data-cx-account-state'),'AUTHENTICATED');
  const cookie=(await ctx.cookies()).find(c=>c.name==='__Host-phios-session');assert(cookie?.httpOnly&&cookie.secure);
  assert(!(await page.evaluate(()=>document.cookie)).includes('__Host-phios-session'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`${out}/screenshots/account-${locale}-${width}.png`,fullPage:true});
  await page.reload();await page.locator('form[action="/api/auth/logout"]').waitFor();
  await page.locator('form[action="/api/auth/logout"] button').click();await page.locator('a[href^="/api/auth/login"]').first().waitFor();
  assert.equal(await page.locator('body').getAttribute('data-cx-account-state'),'GUEST');assert.deepEqual(errors,[]);
  results.push({locale,width,signIn:true,refresh:true,logout:true,secureHttpOnly:true,overflow:false,errors});await ctx.close();
 }
 fs.writeFileSync(`${out}/auth-browser-evidence.json`,JSON.stringify({provider:'SYNTHETIC_OIDC',transport:'LOCAL_HTTPS',actualAuthHandlers:true,otherAccountApis:'STUBBED_NOT_ACCEPTED',liveAuth0:'NOT_RUN',results},null,2)+'\n');
 console.log('PASS HTTPS browser / actual auth handlers / synthetic OIDC: en + zh-Hans, desktop + mobile, sign-in, HttpOnly cookie, refresh, sign-out. Other Account services not accepted.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));database.close();}
