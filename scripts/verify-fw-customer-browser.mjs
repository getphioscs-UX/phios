import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import {DatabaseSync} from 'node:sqlite';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {draftApi} from '../functions/account/financial-will-draft-store.js';
import {accountReportsApi} from '../functions/account/account-reports-api.js';
import {persistTrustedReleasedReport} from '../functions/account/released-report-material-store.js';
import {releasedFixture} from './lib/fw-released-fixture.mjs';
import {authApi,authenticate} from '../functions/account/oidc-auth.js';
import {createSqliteD1Adapter} from './runtime-migration-loader.mjs';
const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE);
const database=new DatabaseSync(':memory:');
for(const f of fs.readdirSync('db/migrations').filter(f=>f.endsWith('.sql')).sort())database.exec(fs.readFileSync(`db/migrations/${f}`,'utf8'));
const env={PHIOS_ENVIRONMENT:'qa',AUTH_PROVIDER:'auth0',AUTH_CLIENT_ID:'browser-fixture',AUTH_CLIENT_SECRET:'browser-fixture-only',AUTH_SESSION_SECRET:'browser-fixture-session-secret-not-production-0001',RUNTIME_DB:createSqliteD1Adapter(database)};
const {publicKey,privateKey}=await generateKeyPair('RS256'),jwk={...await exportJWK(publicKey),kid:'fixture',alg:'RS256',use:'sig'};
const objects=new Map(),seeded=new Set();
env.FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
env.PRIVATE_REPORTS={async put(k,v){objects.set(k,typeof v==='string'?new TextEncoder().encode(v):new Uint8Array(v));},async get(k){const b=objects.get(k);return b?{size:b.length,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.length)}:null;},async delete(k){objects.delete(k);}};
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
  if(['/api/account-financial-will-drafts','/api/account-reports','/api/account-report-download-grant','/api/account-report-download'].includes(url.pathname)){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const c={request:new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env,fetch:fetcher,data:{}};
   c.data.symbolicAccountIdentity=await authenticate(c);
   const user=c.data.symbolicAccountIdentity?.userId;
   if(user&&!seeded.has(user)){seeded.add(user);await persistTrustedReleasedReport(env,releasedFixture(user,'zh-Hans'),{fontBytes:fs.readFileSync('assets/fonts/private-report/NotoSansSC-Regular.ttf')});}
   const action={'/api/account-reports':'list','/api/account-report-download-grant':'grant','/api/account-report-download':'download'}[url.pathname];
   const result=action?await accountReportsApi(c,action):await draftApi(c),headers=Object.fromEntries(result.headers),cookies=result.headers.getSetCookie();if(cookies.length)headers['set-cookie']=cookies;
   res.writeHead(result.status,headers);return res.end(Buffer.from(await result.arrayBuffer()));
  }
  if(url.pathname.startsWith('/api/')){res.writeHead(503,{'content-type':'application/json'});return res.end(JSON.stringify({ok:false,available:false}));}
  const relative=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname,file=path.resolve('.','.'+relative);
  if(!file.startsWith(path.resolve('.')+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  const type={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'content-type':type});res.end(fs.readFileSync(file));
 }catch{res.writeHead(500);res.end('Fixture server failed');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`https://127.0.0.1:${server.address().port}`;env.AUTH_ISSUER=origin+'/';
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],out='docs/financial-will-successor-r1/fw-production';
async function language(page,locale){await page.evaluate(async lang=>{const {applyCustomerLocale}=await import('/assets/customer-ui/js/locale.js');applyCustomerLocale(lang);},locale);}
try{
 for(const locale of ['en','zh-Hans'])for(const width of [1440,390]){
  const ctx=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height:1000},acceptDownloads:true}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/account/');await page.locator('a[href^="/api/auth/login"]').first().click();await page.locator('form[action="/api/auth/logout"]').waitFor();
  await page.goto(origin+'/professional/financial/');await language(page,locale);
  const financial=page.locator('[data-secure-draft="FINANCIAL"]');await financial.locator('[data-save-secure]').waitFor();
  await page.locator('[name="household"]').fill('QA household '+locale+width);
  const before=database.prepare('SELECT count(*) n FROM account_financial_will_drafts').get().n;
  await financial.locator('[data-save-secure]').click();assert.equal(database.prepare('SELECT count(*) n FROM account_financial_will_drafts').get().n,before);
  await financial.locator('[data-save-consent]').check();await financial.locator('[data-retention-consent]').check();await financial.locator('[data-save-secure]').click();await financial.locator('[data-draft-state]').waitFor();
  const savedURL=page.url();await page.reload();await financial.locator('[data-draft-state]').waitFor();assert.equal(await page.locator('[name="household"]').inputValue(),'QA household '+locale+width);
  await page.locator('[name="household"]').fill('QA revised');await financial.locator('[data-save-secure]').click();await page.waitForFunction(()=>document.querySelector('[data-secure-draft="FINANCIAL"] [data-draft-state]')?.textContent.trim().endsWith('2'));
  // A second tab preserves its old expectedVersion; it must visibly refuse a stale write.
  const other=await ctx.newPage();await other.goto(savedURL);await other.locator('[data-secure-draft="FINANCIAL"] [data-draft-state]').waitFor();
  await financial.locator('[data-save-secure]').click();await page.waitForFunction(()=>document.querySelector('[data-secure-draft="FINANCIAL"] [data-draft-state]')?.textContent.trim().endsWith('3'));
  await other.locator('[data-secure-draft="FINANCIAL"] [data-save-secure]').click();await other.waitForFunction(()=>/newer version|较新版本/.test(document.querySelector('[data-secure-draft="FINANCIAL"] [data-draft-message]')?.textContent));await other.close();
  await page.goto(origin+'/account/');await page.goBack();await financial.locator('[data-draft-state]').waitFor();assert.equal(await page.locator('[name="household"]').inputValue(),'QA revised');
  await page.locator('[data-estate-start]').click();await page.locator('[data-estate-field="jurisdiction"]').fill('QA jurisdiction');
  const will=page.locator('[data-secure-draft="WILL"]');await will.locator('[data-save-consent]').check();await will.locator('[data-retention-consent]').check();await will.locator('[data-save-secure]').click();await will.locator('[data-draft-state]').waitFor();
  await page.reload();await will.locator('[data-draft-state]').waitFor();assert.equal(await page.locator('[data-estate-field="jurisdiction"]').inputValue(),'QA jurisdiction');
  await page.goto(origin+'/account/');await language(page,locale);await page.locator('[data-account-drafts] a').first().waitFor();
  assert.equal(await page.locator('[data-account-drafts] article').count(),2);await page.locator('[data-account-drafts] a').first().click();await page.goBack();await page.locator('[data-account-drafts] article').first().waitFor();
  await page.locator('[data-download]').first().waitFor();const download=page.waitForEvent('download');await page.locator('[data-download]').first().click();const file=await download;assert.equal(file.suggestedFilename(),'PHI-OS-private-report.pdf');
  await language(page,locale);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${out}/screenshots/private-account-${locale}-${width}.png`,fullPage:true});
  await page.locator('form[action="/api/auth/logout"] button').click();await page.locator('a[href^="/api/auth/login"]').first().waitFor();
  assert.equal(await page.evaluate(async()=> (await fetch('/api/account-financial-will-drafts')).status),401);
  await page.locator('a[href^="/api/auth/login"]').first().click();await page.locator('[data-account-drafts] article').first().waitFor();
  for(const action of ['withdraw','delete']){await page.locator(`[data-account-drafts] [data-right="${action}"]`).first().click();await page.locator('[data-account-drafts] [data-confirm]').click();await page.waitForFunction(n=>document.querySelectorAll('[data-account-drafts] article').length===n,action==='withdraw'?1:0);}
  assert.deepEqual(errors,[]);results.push({locale,width,saveConsent:true,financialRefreshRestore:true,willRefreshRestore:true,versionConflict:true,back:true,signOutSignIn:true,deleteWithdraw:true,privateDownload:true,overflow:false});await ctx.close();
 }
 fs.writeFileSync(`${out}/customer-browser-local-evidence.json`,JSON.stringify({mode:'LOCAL_HTTPS_SYNTHETIC_OIDC_SQLITE_FAKE_R2',livePreviewAccepted:false,results},null,2)+'\n');console.log('PASS local bilingual desktop/mobile actual customer handlers: save/restore, refresh, Back, version conflict, account cards, sign-out/sign-in, withdrawal/deletion and private PDF. Not deployed Preview acceptance.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));database.close();}
