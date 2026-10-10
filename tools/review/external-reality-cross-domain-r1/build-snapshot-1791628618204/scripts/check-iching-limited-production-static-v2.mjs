import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto) globalThis.crypto=webcrypto;
import {verifyCloudflareAccessJwt,createIChingLimitedSession,verifyIChingLimitedSession,applyIChingLimitedAuthority,ICHING_LIMITED_COOKIE} from '../functions/iching-limited-production/iching-limited-production-v1.js';
import {onRequestPost as sessionEndpoint} from '../functions/api/iching-limited-session-v2.js';
import {onRequest as middleware} from '../functions/api/_middleware.js';
import {onRequestPost as stableExecute} from '../functions/api/symbolic-method-execute.js';
import {onRequestGet as runtimeStatus} from '../functions/api/iching-runtime-status.js';
import {onRequestPost as saveReading} from '../functions/api/symbolic-method-save.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const b64=bytes=>Buffer.from(bytes).toString('base64url'); const encode=value=>b64(Buffer.from(JSON.stringify(value)));
const now=Date.now();
const {publicKey,privateKey}=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',publicKey); Object.assign(jwk,{kid:'test-key',alg:'RS256',use:'sig'});
const team='https://phi-test.cloudflareaccess.com',aud='iching-limited-aud',email='tester@example.com';
const header=encode({alg:'RS256',kid:'test-key',typ:'JWT'}); const payload=encode({iss:team,aud:[aud],sub:'access-user-1',email,iat:Math.floor(now/1000)-10,exp:Math.floor(now/1000)+3600}); const signing=`${header}.${payload}`; const signature=b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',privateKey,new TextEncoder().encode(signing))); const jwt=`${signing}.${signature}`;
let observedRedirect=null; const certFetch=async(_input,init={})=>{observedRedirect=init.redirect;return new Response(JSON.stringify({keys:[jwk]}),{status:200,headers:{'content-type':'application/json'}});};
const verified=await verifyCloudflareAccessJwt({jwt,teamDomain:team,audiences:new Set([aud]),allowedEmails:new Set([email]),fetchImpl:certFetch,clock:()=>now}); assert.equal(verified.verified,true);
const jwtParts=jwt.split('.');const sigChars=[...jwtParts[2]];const tamperIndex=Math.min(12,sigChars.length-1);sigChars[tamperIndex]=sigChars[tamperIndex]==='A'?'B':'A';const badJwt=`${jwtParts[0]}.${jwtParts[1]}.${sigChars.join('')}`;
await assert.rejects(()=>verifyCloudflareAccessJwt({jwt:badJwt,teamDomain:team,audiences:new Set([aud]),allowedEmails:new Set([email]),fetchImpl:certFetch,clock:()=>now}),/SIGNATURE/);

class MockD1{
  constructor(){this.users=new Map();}
  prepare(sql){const db=this;return {values:[],bind(...values){this.values=values;return this;},async first(){if(sql.includes('sqlite_master'))return {name:'runtime_users'};if(sql.startsWith('SELECT user_id,status FROM runtime_users')){const row=db.users.get(this.values[0]);return row?{user_id:this.values[0],status:row.status}:null;}return null;},async run(){if(sql.startsWith('INSERT INTO runtime_users')){db.users.set(this.values[0],{status:'probe'});return {success:true};}if(sql.startsWith('DELETE FROM runtime_users')){db.users.delete(this.values[0]);return {success:true};}return {success:true};}};}
}
const db=new MockD1(); const sha='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const env={CF_PAGES_COMMIT_SHA:sha,ICHING_LIMITED_PRODUCTION_ENABLED:'true',ICHING_LIMITED_PRODUCTION_DEPLOYMENT_SHA:sha,ICHING_LIMITED_PRODUCTION_LIVE_BROWSER_ACCEPTED_SHA:sha,ICHING_LIMITED_PRODUCTION_COUNTRIES:'MY,US',ICHING_LIMITED_PRODUCTION_EMAILS:email,ICHING_LIMITED_PRODUCTION_SESSION_SECRET:'0123456789abcdef0123456789abcdef',ICHING_LIMITED_PRODUCTION_RIGHTS_REVIEW_ID:'OPS-RIGHTS-MY-US-2026-08-26',PHIOS_ACCESS_TEAM_DOMAIN:team,PHIOS_ACCESS_AUD:aud,RUNTIME_DB:db};
const request=new Request('https://example.test/api/iching-limited-session-v2',{method:'POST',headers:{'cf-access-jwt-assertion':jwt}});Object.defineProperty(request,'cf',{value:{country:'MY'}});
const originalFetch=globalThis.fetch; globalThis.fetch=certFetch; const sessionResponse=await sessionEndpoint({request,env,data:{}}); globalThis.fetch=originalFetch; assert.equal(sessionResponse.status,200,await sessionResponse.clone().text()); assert.equal(observedRedirect,'manual','v2 must adapt Access JWKS fetch to redirect:manual'); const setCookie=sessionResponse.headers.get('set-cookie'); assert.ok(setCookie.includes(ICHING_LIMITED_COOKIE)); assert.equal(db.users.size,0,'D1 probe must clean up');
const cookie=setCookie.split(';')[0]; const betaReq=new Request('https://example.test/api/iching-runtime-status',{headers:{cookie}});Object.defineProperty(betaReq,'cf',{value:{country:'MY'}});const betaContext={request:betaReq,env,data:{}};const session=await verifyIChingLimitedSession(betaContext,{clock:()=>now});assert.ok(session);applyIChingLimitedAuthority(betaContext,session);assert.equal(betaContext.data.symbolicAccountIdentity.verified,true);assert.equal(betaContext.data.ckaAccess.retentionPolicyAccepted,false);

const authorities={
 '/content/professional/core-method-runtime/iching-hexagram-registry-v1.json':read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),
 '/content/interpretation/iching/registries/iching-source-registry-v2.json':read('content/interpretation/iching/registries/iching-source-registry-v2.json'),
 '/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json':read('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json'),
 '/content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json':read('content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'),
 '/content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json':read('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json')
};
env.ASSETS={fetch:async req=>{const path=new URL(req.url).pathname;return authorities[path]?new Response(JSON.stringify(authorities[path]),{status:200,headers:{'content-type':'application/json'}}):new Response('missing',{status:404});}};
const lines=authorities['/content/professional/core-method-runtime/iching-hexagram-registry-v1.json'].entries[0].lineStructure.map(bit=>bit===1?7:8);
const executeReq=new Request('https://example.test/api/symbolic-method-execute',{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify({method:'I_CHING',question:'What can I observe?',inputMode:'MANUAL_LINES',lines,sessionId:'lp-static-v2',timestamp:new Date(now).toISOString(),projectionVersion:'1.0.0',locale:'en'})});Object.defineProperty(executeReq,'cf',{value:{country:'MY'}});
const execContext={request:executeReq,env,data:{},next:()=>stableExecute({request:executeReq,env,data:{}})};const execResponse=await middleware(execContext);assert.equal(execResponse.status,200);const execBody=await execResponse.json();assert.equal(execBody.runtimeVersion,'2.0.0');assert.equal(execBody.depthSupplement.status,'AVAILABLE');assert.equal(execBody.production.state,'LIMITED_PRODUCTION');assert.equal(execBody.production.runAllowed,true);assert.equal(execBody.production.limitedProductionActivated,true);
const guestReq=new Request('https://example.test/api/symbolic-method-execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'I_CHING'})});Object.defineProperty(guestReq,'cf',{value:{country:'MY'}});const guest=await middleware({request:guestReq,env,data:{},next:()=>stableExecute({request:guestReq,env,data:{}})});assert.equal(guest.status,423);
const statusReq=new Request('https://example.test/api/iching-runtime-status',{headers:{cookie}});Object.defineProperty(statusReq,'cf',{value:{country:'MY'}});const status=await middleware({request:statusReq,env,data:{},next:function(){return runtimeStatus(this);}});assert.equal(status.status,200);const statusBody=await status.json();assert.equal(statusBody.activation.state,'LIMITED_PRODUCTION');assert.equal(statusBody.activation.runAllowed,true);
const saveReq=new Request('https://example.test/api/symbolic-method-save',{method:'POST',headers:{'content-type':'application/json',cookie},body:'{}'});Object.defineProperty(saveReq,'cf',{value:{country:'MY'}});const save=await middleware({request:saveReq,env,data:{},next:function(){return saveReading(this);}});assert.equal(save.status,403);assert.equal((await save.json()).error.code,'RETENTION_POLICY_REQUIRED');
console.log('✓ ICH-PROD-W29 Limited Production edge-fetch successor v2 static acceptance passed.');
console.log('  RS256 Access JWT + manual edge-safe JWKS fetch + issuer/audience/email/country + exact SHA + D1 write/read/cleanup + signed beta session + stable depth execution are closed.');
console.log('  Guest execution stays 423; retention remains explicit-consent-only; FULL_PRODUCTION is not granted.');
