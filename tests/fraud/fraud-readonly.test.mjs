import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest as root} from '../../functions/_middleware.js';
import {onRequest as api} from '../../functions/api/_middleware.js';
import {onRequestPost as handler} from '../../functions/api/customer-contextual-ask.js';
const base={question:'Someone asks me to share my OTP.',task:'SCAM_CHECK',locale:'en',jurisdiction:'SG',bankJurisdiction:'UNKNOWN',eventJurisdiction:'UNKNOWN',exposure:[],knowledgeContext:null,contexts:[],questionOnly:true,guidedContext:{},contextConsent:{},guidedRouting:false,methodGuidanceRequested:false,followUpContext:null};
async function run(body,origin='https://phios.test'){
 let downstream=0,capabilities=0;
 const deny=()=>{capabilities++;throw Error('NO_CAPABILITY_ACCESS');};
 const env={PHIOS_D1_MAINTENANCE_MODE:'READ_ONLY',RUNTIME_DB:{prepare:deny},AI:{run:deny},PRIVATE_REPORTS:{get:deny},PAID_REPORT_QUEUE:{send:deny}};
 const context={env,data:{},request:new Request('https://phios.test/api/customer-contextual-ask',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})};
 context.next=()=>api({...context,next:()=>{downstream++;return handler(context);}});
 const previous=globalThis.fetch;globalThis.fetch=deny;
 try{return {response:await root(context),downstream,capabilities};}finally{globalThis.fetch=previous;}
}
test('actual READ_ONLY root and identity middleware reach deterministic fraud review without private capabilities',async()=>{
 for(const locale of ['en','zh-Hans']){const r=await run({...base,locale});assert.equal(r.response.status,200);const b=await r.response.json();assert(b.scam);assert.equal(b.execution.providerCalls,0);assert.equal(b.scam.governance.persisted,false);assert.equal(r.downstream,1);assert.equal(r.capabilities,0);}
});
test('READ_ONLY rejects forged scopes, paid tasks, private identity, nonempty context and foreign origin before handler',async()=>{
 const cases=[{task:'REPORT'},{contexts:[{contextType:'ACCOUNT',contextRef:'X'}]},{knowledgeContext:{contextRef:'BOOK:PRIVATE'}},{personId:'X'},{orderId:'X'},{guidedContext:{whatIsHappening:'private'}},{contextConsent:{CURRENT_REALITY:true}},{followUpContext:{parentAnswerId:'X'}},{questionOnly:false},{exposure:['UNKNOWN']},{exposure:['APP_INSTALLED','APP_INSTALLED']},{jurisdiction:'DE'},{question:'x'.repeat(2001)},{productionEligible:true}];
 for(const delta of cases){const r=await run({...base,...delta});assert.equal(r.response.status,503,JSON.stringify(delta));assert.equal(r.downstream,0);assert.equal(r.capabilities,0);}
 const foreign=await run(base,'https://foreign.test');assert.equal(foreign.response.status,503);assert.equal(foreign.downstream,0);
});
