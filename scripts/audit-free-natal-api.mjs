import './lib/report-zero-cost-preload.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import {syncBuiltinESMExports} from 'node:module';
const attempts=[];
const deny=(input)=>{attempts.push(String(input?.url||input));throw Error('AUDIT_ALL_NETWORK_DENIED');};
globalThis.fetch=async input=>deny(input);
for(const m of [http,https])for(const key of ['request','get'])m[key]=deny;
syncBuiltinESMExports();
const {onRequestPost}=await import('../functions/api/customer-personal-reality.js');
const {createConfirmedBirthLocationSnapshot}=await import('../functions/location/confirmed-birth-location-snapshot.js');
const {installPhase10DomStub}=await import('./lib/pvp-phase10-method-fixture.mjs');
const {renderBaziProduct}=await import('../assets/customer-ui/js/specialists/bazi/product-renderer.js');
const {renderAstrologyProduct}=await import('../assets/customer-ui/js/specialists/ast/product-renderer.js');
const {renderZiweiProduct}=await import('../assets/customer-ui/js/specialists/ziwei/product-renderer.js');
const renderers={bazi:renderBaziProduct,astrology:renderAstrologyProduct,ziwei:renderZiweiProduct};
const checks=[];
for(const method of Object.keys(renderers))for(const birthDate of ['1984-02-12','1991-07-23']){
 const birthTime='12:30';
 const snapshot=createConfirmedBirthLocationSnapshot({providerRef:'N123',displayName:'SYNTHETIC Kuala Lumpur',countryCode:'MY',latitude:3.139,longitude:101.6869,timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00'}},{birthDate,birthTime});
 const body={consent:true,methods:[method],birthDate,birthTime,placeRef:'N123',birthLocationSnapshot:snapshot,traditionalCalculationSex:'MALE',astrologyHouseSystem:'WHOLE_SIGN_V1',locale:'en',intent:'',reportSubjectName:'SYNTHETIC AUDIT'};
 try{
  const response=await onRequestPost({request:new Request('https://fixture.invalid/api/customer-personal-reality',{method:'POST',body:JSON.stringify(body)}),env:{PHIOS_ENVIRONMENT:'local'},data:{symbolicAccountIdentity:{userId:'SYNTHETIC_DIAGRAM_AUDIT',authenticated:true,verified:true}}});
  const payload=await response.json();installPhase10DomStub('en');
  const product=payload.view?.productRoute?.primaryProduct;
  const plan=product?renderers[method]({product}):null;
  checks.push({method,birthDate,status:response.status,ok:payload.ok,error:payload.error||null,methodId:product?.methodId,access:product?.reportAccess?.state,diagramMarkup:plan?.visualHtml||'',payloadBoundary:method==='bazi'?{freePillars:product?.freeChartSource?.structuralModel?.pillars,paidNativeExposed:Boolean(product?.sourceProduct||payload.view?.methodNativeReading?.BZR)}:null});
 }catch(e){checks.push({method,birthDate,error:e.message});}
}
const out='docs/commerce/economics-20261009/windows-integration/free-natal-diagram-audit/API-RESULTS.json';
fs.writeFileSync(out,JSON.stringify({scope:'REAL_REQUEST_HANDLER_AND_RENDERER_SYNTHETIC_AUTH_NO_HTTP_BROWSER_SESSION_NO_ACCOUNT_PERSISTENCE',externalNetworkAttempts:attempts,providerCalls:0,checks},null,2)+'\n');
console.log(JSON.stringify(checks.map(({diagramMarkup,...r})=>({...r,diagramBytes:diagramMarkup?.length})),null,2));
assert.equal(attempts.length,0,'Actual handler attempted network');
