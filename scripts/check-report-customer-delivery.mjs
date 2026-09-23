import assert from 'node:assert/strict';
import {REPORT_DELIVERY_METHODS,REPORT_ACCESS_STATES} from '../functions/report-delivery/report-delivery-contract.js';
import {resolveReportAccess} from '../functions/report-delivery/report-access-resolver.js';
import {resolveReportRoute} from '../functions/report-delivery/report-route-resolver.js';
import {buildReportDeliveryEnvelope} from '../functions/report-delivery/report-delivery-envelope.js';
assert.equal(REPORT_DELIVERY_METHODS.length,8);
assert.equal(new Set(REPORT_DELIVERY_METHODS.map(p=>p.commerceProductId)).size,8);
assert(REPORT_DELIVERY_METHODS.every(p=>p.commerceProductId&&!p.productionActive&&!p.humanAccepted));
const context={env:{PHIOS_ENVIRONMENT:'qa'},data:{}};
let calls=0;
const deps={loadEntitlement:async(_env,id,product)=>{calls++;assert.equal(id,'test-owner');assert.equal(product,'COM-REPORT-BAZI-FULL');return {purchase_id:'server-purchase',entitlement_status:'active',reportPresentation:{reportLanguageMode:'BILINGUAL',reportLocale:'bilingual'}};}};
for(const method of REPORT_DELIVERY_METHODS){const a=await resolveReportAccess({methodId:method.methodId,locale:'en',context},deps);assert.equal(a.state,method.pilot?'FREE':'UNAVAILABLE');}
assert.equal(calls,0);
context.data.symbolicAccountIdentity={userId:'test-owner',providerId:'auth0',verified:true,authenticated:true};
for(const locale of ['en','zh-Hans']){
 const a=await resolveReportAccess({methodId:'BZR',locale,context},deps);assert.equal(a.state,'ENTITLED');assert.equal(a.offer.amountMinor,3900);
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
console.log('PASS: shared delivery mapping/access/routes; eight existing products; BaZi-only QA pilot; no global cutover; no new entitlement authority.');
