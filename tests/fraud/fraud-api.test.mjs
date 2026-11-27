import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../../functions/api/customer-contextual-ask.js';
import {onRequestPost as intentPost,onRequestGet as intentGet} from '../../functions/api/client-intent-route.js';
const run=async(body,handler=onRequestPost)=>{const response=await handler({request:new Request('https://phios.test/api/customer-contextual-ask',{method:'POST',body:JSON.stringify(body)}),env:{}});return {response,body:await response.json()};};
test('explicit scam check including unmatched input cannot fetch, spend, read private data or write',async()=>{
 const previous=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('NETWORK_MUST_NOT_RUN');};
 try{
  for(const locale of ['en','zh-Hans'])for(const jurisdiction of ['MY','SG','US','GB','AU','DE',undefined])for(const question of ['Is this genuine?','Someone asks me for my OTP.','有人要求我先转账才能提取投资盈利，我还没转账。']){
   const r=await run({question,locale,jurisdiction,task:'SCAM_CHECK',contexts:[{contextType:'PROFESSIONAL',contextRef:'UNAUTHORIZED'}],guidedRouting:true});
   const entry=await run({question,locale,jurisdiction,task:'SCAM_CHECK'},intentPost);assert.equal(entry.response.status,200);assert.equal(entry.body.execution.providerCalls,0);assert(entry.body.scam);
   assert.equal(r.response.status,200);assert.equal(r.body.execution.providerCalls,0);assert.equal(r.body.execution.providerInvoked,false);assert.equal(r.body.scam.governance.persisted,false);assert.equal(r.response.headers.get('cache-control'),'no-store');
   assert(r.body.scam.sourceReferences.every(s=>s.jurisdiction===jurisdiction));
  }
  assert.equal(calls,0);
 }finally{globalThis.fetch=previous;}
});
test('multi-country, explicit exposures, scope validation and no sensitive response echo',async()=>{
 const r=await run({question:'I shared my password TOP_SECRET',task:'SCAM_CHECK',jurisdiction:'SG',bankJurisdiction:'US',exposure:['PAID_OR_LOST','APP_INSTALLED']});assert.equal(r.response.status,200);assert.deepEqual(r.body.scam.jurisdictions,['SG','US']);assert.equal(r.body.scam.exposures.length,3);assert(!JSON.stringify(r.body).includes('TOP_SECRET'));assert(!JSON.stringify(r.body).includes('997'));
 for(const exposure of ['PAID_OR_LOST',[true],['NOT_ALLOWED'],{},null])assert.equal((await run({question:'check',task:'SCAM_CHECK',exposure})).response.status,400);
 assert.equal((await run({question:'x'.repeat(2001),task:'SCAM_CHECK'})).response.status,400);
});
test('plain Ask and public intent share the global rule owner; urgency preserves zero execution',async()=>{
 for(const handler of [onRequestPost,intentPost])for(const jurisdiction of [undefined,'SG']){
  const r=await run({question:'Someone asks me for my OTP. I shared my OTP.',jurisdiction,selectedMethod:'TAROT'},handler);assert.equal(r.response.status,200);assert(r.body.scam);assert.equal(r.body.execution.providerCalls,0);assert(!JSON.stringify(r.body.scam).includes('997'));
 }
 for(const handler of [onRequestPost,intentPost]){const r=await run({question:'Someone asks me for my password. I shared my password TOP_SECRET',task:'SCAM_CHECK'},handler);assert(!JSON.stringify(r.body).includes('TOP_SECRET'));}
 const response=await intentGet({request:new Request('https://phios.test/api/client-intent-route?q=Someone%20asks%20me%20for%20my%20OTP&jurisdiction=SG'),env:{}});const body=await response.json();assert.equal(body.scam.jurisdiction,'SG');assert(body.scam.sourceReferences.every(s=>s.jurisdiction==='SG'));
});
test('catalog never defaults to another country and never claims a live database',async()=>{
 for(const country of ['','SG','GB','DE']){const response=await onRequestGet({request:new Request('https://phios.test/api/customer-contextual-ask?catalog=scam&jurisdiction='+country)});const b=await response.json();assert(b.sources.every(s=>s.jurisdiction===country));assert.equal(b.providerCalls,0);assert(b.sources.every(s=>s.apiAuthorized===false));}
});
