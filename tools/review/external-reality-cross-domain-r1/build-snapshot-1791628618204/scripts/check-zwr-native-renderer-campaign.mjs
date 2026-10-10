import assert from 'node:assert/strict';
import {fixture} from './check-zwr-native-renderer-qa.mjs';
import {advanceNativeRendererCampaign as advance} from '../functions/report-delivery/zwr-native-renderer-campaign.js';
const admissionKey='qa/method-delivery/ZWR/generation-admission.json';
function campaignFixture(options){
 const f=fixture(options),store=f.env.PRIVATE_REPORTS,versions=new Map();
 const get=store.get.bind(store),put=store.put.bind(store);
 store.get=async key=>{const object=await get(key);return object?{...object,etag:String(versions.get(key)||0)}:null;};
 store.put=async(key,value,options)=>{
  if(options?.onlyIf?.etagMatches!==undefined&&options.onlyIf.etagMatches!==String(versions.get(key)||0))return null;
  versions.set(key,(versions.get(key)||0)+1);await put(key,value);return {etag:String(versions.get(key))};
 };
 return f;
}
const success=campaignFixture(),start=await advance(success.env,'account-a',{action:'START'});
assert.equal(success.calls,0);assert.equal(success.objects.has(admissionKey),false);
await assert.rejects(()=>advance(success.env,'account-b',{action:'NEXT',campaignId:start.campaignId,sequence:1}),{code:'NATIVE_RENDERER_CAMPAIGN_OWNER_DENIED'});
await assert.rejects(()=>advance(success.env,'account-a',{action:'NEXT',campaignId:start.campaignId,sequence:2}),{code:'NATIVE_RENDERER_CAMPAIGN_SEQUENCE_INVALID'});
let result;
for(let sequence=1;sequence<=8;sequence++){
 const before=success.calls;
 result=await advance(success.env,'account-a',{action:'NEXT',campaignId:start.campaignId,sequence});
 assert.equal(success.calls,before+1);assert.equal(result.sequentialRuns,sequence);
 assert.equal(success.objects.has(admissionKey),sequence===8);
 if(sequence<8)await assert.rejects(()=>advance(success.env,'account-a',{action:'NEXT',campaignId:start.campaignId,sequence}),{code:'NATIVE_RENDERER_CAMPAIGN_SEQUENCE_INVALID'});
}
assert.equal(result.status,'PASS');assert.equal(result.productionAdmissionGranted,false);
for(const badRun of [1,4,8]){
 const f=campaignFixture({badRun}),s=await advance(f.env,'account-a',{action:'START'});
 for(let sequence=1;sequence<badRun;sequence++)await advance(f.env,'account-a',{action:'NEXT',campaignId:s.campaignId,sequence});
 await assert.rejects(()=>advance(f.env,'account-a',{action:'NEXT',campaignId:s.campaignId,sequence:badRun}),{code:'NATIVE_RENDERER_RUN_FAILED'});
 assert.equal(f.objects.has(admissionKey),false);
 await assert.rejects(()=>advance(f.env,'account-a',{action:'NEXT',campaignId:s.campaignId,sequence:badRun}),{code:'NATIVE_RENDERER_CAMPAIGN_FAILED'});
}
const concurrent=campaignFixture(),s=await advance(concurrent.env,'account-a',{action:'START'});
const attempts=await Promise.allSettled([1,2].map(()=>advance(concurrent.env,'account-a',{action:'NEXT',campaignId:s.campaignId,sequence:1})));
assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal(concurrent.calls,1);
const changed=campaignFixture(),c=await advance(changed.env,'account-a',{action:'START'});
const key='qa/method-delivery/ZWR/renderer-manifest.json',manifest=JSON.parse(changed.objects.get(key));manifest.candidateDigest='f'.repeat(64);changed.objects.set(key,JSON.stringify(manifest));
await assert.rejects(()=>advance(changed.env,'account-a',{action:'NEXT',campaignId:c.campaignId,sequence:1}));assert.equal(changed.calls,0);
console.log('PASS OFFLINE resumable campaign: one render/request; eight ordered runs; owner/sequence/CAS lock; failures 1/4/8 never admit; source drift denied. Live proof NOT_RUN.');
