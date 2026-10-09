import fs from 'node:fs';
import assert from 'node:assert/strict';
import {collectMyRealitySavedSources} from '../functions/account/my-reality-saved-sources.js';
const identity={userId:'qa-owner',providerId:'synthetic-verified-server',authenticated:true,verified:true};
const context={request:new Request('https://phios.test/api/customer-my-reality'),data:{symbolicAccountIdentity:identity},env:{PHIOS_ENVIRONMENT:'qa',PHIOS_MY_REALITY_SAVED_QA_ENABLED:'true'}};
let calls=0;
const reply=v=>{calls++;return Response.json(v);};
const readers={
 reports:async c=>{assert.equal(c.data.symbolicAccountIdentity.userId,'qa-owner');assert.equal(c.request.method,'GET');return reply({ok:true,reports:[{reportId:'professional',reportVersion:'1',releaseStatus:'ACTIVE',releasedAt:'2026-10-01T00:00:00Z',acceptanceFixture:true}]});},
 methodReports:async()=>reply({ok:true,reports:[{reportId:'method',method:'ZWR',version:2,status:'RELEASED',releasedAt:'2026-10-02T00:00:00Z'}]}),
 readings:async()=>Response.json({ok:false,error:{code:'RETENTION_POLICY_REQUIRED'}},{status:403}),
 financialDrafts:async()=>reply({ok:true,drafts:[{draftId:'financial',draftType:'FINANCIAL',version:3,priorDigest:'previous-only-digest',createdAt:'2026-10-03T00:00:00Z'}]})
};
const options={sourceReaders:readers,questionReader:async c=>{assert.equal(new URL(c.request.url).searchParams.get('reportId'),'method');return reply({ok:true,items:[{requestId:'saved-question',question:'Synthetic question',answer:{text:'Saved answer'},sourceClass:'PURCHASED_REPORT_CONTEXT',sourceVersion:'snapshot-v2',historyState:'COMPLETE',createdAt:'2026-10-04T00:00:00Z'}]});}};
const result=await collectMyRealitySavedSources(context,options);
assert.equal(result.reports.length,2);assert.equal(result.history.length,4);assert.equal(result.history[0].answer.text,'Saved answer');
assert.equal(result.reports[0].sourceClass,'SYNTHETIC_QA_REPORT');assert.equal(result.lanes.readings.state,'CONSENT_OR_ADMISSION_REQUIRED');
assert.equal(result.history.filter(h=>h.id==='financial').length,1,'prior digest must not manufacture prior history');
assert.equal(result.governance.writesPerformed,false);assert.equal(result.governance.providerCalls,0);
const before=calls;
assert.equal((await collectMyRealitySavedSources({...context,data:{}},options)).state,'ACCOUNT_REQUIRED');
assert.equal((await collectMyRealitySavedSources({...context,env:{...context.env,PHIOS_ENVIRONMENT:'production'}},options)).state,'NOT_ADMITTED');assert.equal(calls,before);
const empty=await collectMyRealitySavedSources(context,{sourceReaders:{reports:async()=>Response.json({ok:true,reports:[]})},questionReader:()=>{throw Error('No report means no question sweep');}});
assert.deepEqual(empty.history,[]);assert.equal(empty.lanes.reports.state,'EMPTY');
const evidence={result:'PASS',scope:'SYNTHETIC_SOURCE_ADAPTER_QA_NOT_LIVE',checks:['server identity preserved','read-only source adapters','retention denial retained','real saved questions projected','prior digest does not manufacture history','QA fixture remains labelled','guest no source access','production denied','empty remains empty'],writes:0,providerCalls:0,currentRealityAndMembershipIntegration:'PENDING'};
fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/MY-REALITY-SAVED-SOURCE-QA.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
