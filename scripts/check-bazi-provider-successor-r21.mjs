import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assertExactBaziProviderSuccessor,PROVIDER_PATH,SUCCESSOR_RECORD} from './lib/bazi-provider-successor-r21.mjs';
import {invokeOpenAIStructured,safeProviderFailure} from '../functions/personal-reading/narrative/narrative-provider.js';
const record=JSON.parse(fs.readFileSync(SUCCESSOR_RECORD,'utf8')),current=fs.readFileSync(PROVIDER_PATH);
const proof=assertExactBaziProviderSuccessor();
for(const mutate of [
 d=>delete d.owners.find(x=>x.path===PROVIDER_PATH).successorChain,
 d=>d.owners.find(x=>x.path===PROVIDER_PATH).successorChain[0].predecessorSha256='0'.repeat(64),
 d=>d.owners.find(x=>x.path===PROVIDER_PATH).successorChain.push({predecessorSha256:proof.currentSha256,successorSha256:'1'.repeat(64),authorityOrAcceptedTextRewritten:false}),
 d=>d.owners.find(x=>x.path===PROVIDER_PATH).successorChain[0].providerLiveEnabled=true
]){const d=structuredClone(record);mutate(d);assert.throws(()=>assertExactBaziProviderSuccessor({record:d,current}));}
assert.throws(()=>assertExactBaziProviderSuccessor({record,current:Buffer.concat([current,Buffer.from('\n// unknown third source')])}));
assert.throws(()=>assertExactBaziProviderSuccessor({record,current:Buffer.from(current.toString().replace('assertReportProviderAccess({','bypassReportProviderAccess({'))}));
let transportCalls=0;const fetcher=async()=>{transportCalls++;throw Error('UNEXPECTED_TRANSPORT');};
const args={fetcher,accessTier:'PAID',systemPrompt:'Synthetic QA',userPayload:{synthetic:true},schema:{type:'object'},schemaName:'qa'};
const replay=process.env.REPORT_ZERO_COST_REPLAY;
try{
 process.env.REPORT_ZERO_COST_REPLAY='false';
 await assert.rejects(()=>invokeOpenAIStructured({...args,env:{REPORT_PROVIDER_LIVE_ALLOWED:'false'}}),{code:'REPORT_PROVIDER_LIVE_OPT_IN_REQUIRED'});
 await assert.rejects(()=>invokeOpenAIStructured({...args,env:{REPORT_PROVIDER_LIVE_ALLOWED:'true'}}),{code:'PAID_REPORT_DURABLE_BUDGET_CONTEXT_REQUIRED'});
 for(const code of ['REPORT_USAGE_RECONCILIATION_REQUIRED','REPORT_GENERATION_AND_REPAIR_BUDGET_EXCEEDED','REPORT_TOTAL_COST_CAP_EXCEEDED','REPORT_SHARED_COST_RECONCILIATION_REQUIRED','REPORT_PROVIDER_USAGE_EXCEEDED_RESERVATION','PAID_REPORT_WORKER_FENCE_LOST','COMPLETE_PRODUCT_COST_LIMIT_OR_UNKNOWN_USAGE','PRODUCT_COST_USAGE_UNKNOWN_OR_OVER_BOUND']){
  const denied=Object.assign(Error(code),{code});let budgetCalls=0;
  await assert.rejects(()=>invokeOpenAIStructured({...args,env:{REPORT_PROVIDER_LIVE_ALLOWED:'true',OPENAI_API_KEY:'SYNTHETIC_NOT_A_SECRET',OPENAI_MODEL:'fixture',REPORT_PAID_GENERATION_CONTEXT:{purpose:'PAID_UNLOCKED_REPORT',invokeBudgeted:()=>{budgetCalls++;throw denied;}}}}),e=>e===denied);
  assert.equal(budgetCalls,1);
 }
 process.env.REPORT_ZERO_COST_REPLAY='true';
 await assert.rejects(()=>invokeOpenAIStructured({...args,fetcher:globalThis.fetch,env:{REPORT_PROVIDER_LIVE_ALLOWED:'true'}}),{code:'REPORT_PROVIDER_LIVE_OPT_IN_REQUIRED'});
 await assert.rejects(()=>invokeOpenAIStructured({...args,accessTier:'FREE',env:{REPORT_ZERO_COST_REPLAY:'true'}}),{code:'FREE_REPORT_PROVIDER_FORBIDDEN'});
 await assert.rejects(()=>fetch('https://api.openai.com/v1/responses',{method:'POST'}),/ZERO_COST_REPLAY_NETWORK_BLOCKED/);
 assert.deepEqual(safeProviderFailure({details:{status:503,providerErrorCode:'SECRET_OR_PROMPT',providerErrorType:'PRIVATE_DATA',networkErrorCode:'PRIVATE'}}),{httpStatus:503,providerErrorCode:null,providerErrorType:null,networkErrorCode:null});
 assert.equal(transportCalls,0);
}finally{if(replay===undefined)delete process.env.REPORT_ZERO_COST_REPLAY;else process.env.REPORT_ZERO_COST_REPLAY=replay;}
console.log(JSON.stringify({status:'PASS',...proof,unknownSourceRejected:true,missingRecordRejected:true,tamperedPredecessorRejected:true,permissionCodeMutationRejected:true,paidBudgetErrorsPreserved:true,transportCalls,providerCalls:0,cost:'USD0'}));
