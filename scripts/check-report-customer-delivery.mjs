import assert from 'node:assert/strict';
import {REPORT_DELIVERY_METHODS,REPORT_ACCESS_STATES} from '../functions/report-delivery/report-delivery-contract.js';
import {resolveReportAccess} from '../functions/report-delivery/report-access-resolver.js';
import {resolveReportRoute} from '../functions/report-delivery/report-route-resolver.js';
import {buildReportDeliveryEnvelope} from '../functions/report-delivery/report-delivery-envelope.js';
// Current owner-approved Commerce v1.1 adds product identities; delivery
// admission remains independent. Keep an exact mapping, not a count-only gate.
assert.deepEqual(REPORT_DELIVERY_METHODS.map(p=>[p.methodId,p.commerceProductId]),[
 ['BZR','COM-REPORT-BAZI-FULL'],['ZWR','COM-REPORT-ZIWEI-FULL'],
 ['AST','COM-REPORT-ASTROLOGY-FULL'],['PROFILE','COM-REPORT-PROFILE-FULL'],
 ['HD','COM-REPORT-HD-FULL'],['ECR','COM-REPORT-ECR-FULL'],
 ['NUM','COM-REPORT-NUMEROLOGY-FULL'],['CROSS','COM-REPORT-CROSS-FULL'],
 ['TAROT','COM-READING-TAROT-FULL'],['ICHING','COM-READING-ICHING-FULL'],
 ['FINANCIAL','COM-REPORT-FINANCIAL-FULL'],['WILL','COM-WILL-WRITING']
]);
assert.equal(new Set(REPORT_DELIVERY_METHODS.map(p=>p.commerceProductId)).size,12);
assert.deepEqual(REPORT_DELIVERY_METHODS.filter(p=>p.pilot).map(p=>p.methodId),['BZR']);
assert(REPORT_DELIVERY_METHODS.every(p=>p.commerceProductId&&!p.productionActive&&!p.humanAccepted));
const context={env:{PHIOS_ENVIRONMENT:'qa'},data:{}};
let calls=0;
const deps={loadEntitlement:async(_env,id,product)=>{calls++;assert.equal(id,'test-owner');assert.equal(product,'COM-REPORT-BAZI-FULL');return {purchase_id:'server-purchase',entitlement_status:'active',reportPresentation:{reportLanguageMode:'BILINGUAL',reportLocale:'bilingual'}};}};
for(const method of REPORT_DELIVERY_METHODS){const a=await resolveReportAccess({methodId:method.methodId,locale:'en',context},deps);assert.equal(a.state,method.pilot?'FREE':'UNAVAILABLE');}
assert.equal(calls,0);
context.data.symbolicAccountIdentity={userId:'test-owner',providerId:'auth0',verified:true,authenticated:true};
for(const locale of ['en','zh-Hans']){
 const a=await resolveReportAccess({methodId:'BZR',locale,context},deps);assert.equal(a.state,'ENTITLED');assert.equal(a.offer.amountMinor,5900);
 const d=buildReportDeliveryEnvelope({methodId:'BZR',access:a,admitted:true,reportAvailable:true});
 assert.equal(resolveReportRoute(d),'PUBLICATION_FULL');assert.equal(resolveReportRoute(d,{technical:true}),'SPECIALIST_EXPLORER');
 assert.equal(buildReportDeliveryEnvelope({methodId:'BZR',access:a,admitted:false,reportAvailable:false}).access.state,'UNAVAILABLE');
}
for(const [extra,state] of [[{admitted:false},'UNAVAILABLE'],[{dataRequired:true},'DATA_REQUIRED']])assert.equal((await resolveReportAccess({methodId:'BZR',locale:'en',context,...extra},deps)).state,state);
assert.equal((await resolveReportAccess({methodId:'BZR',locale:'en',context},{loadEntitlement:async()=>{throw Error('offline');}})).state,'FREE');
assert.equal((await resolveReportAccess({methodId:'BZR',locale:'en',context:{...context,env:{PHIOS_ENVIRONMENT:'production'}}},deps)).state,'FREE');
const locked=await resolveReportAccess({methodId:'BZR',locale:'en',context,previewLocked:true},{loadEntitlement:async()=>null});assert.equal(locked.state,'LOCKED');assert.equal(resolveReportRoute({access:locked}),'PUBLICATION_LOCKED');
assert(!('sourceProduct' in locked));
assert.deepEqual(REPORT_ACCESS_STATES,['FREE','LOCKED','ENTITLED','UNAVAILABLE','DATA_REQUIRED']);
console.log('PASS: twelve exact owner-approved product mappings; BaZi-only QA pilot; all production delivery flags remain false; no global cutover or new entitlement authority.');
