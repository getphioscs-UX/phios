import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from 'esbuild';import {pathToFileURL} from 'node:url';
import {env,db} from './check-membership-ask-source-boundaries-r1.mjs';
const dir='tools/review/membership-ask-credit-r1';
const compiled='.tmp/member-delivery-preparation.mjs';await build({entryPoints:['functions/personal-reading/continuity/membership-model-request.js','functions/personal-reading/continuity/continuity-credit-cutover.js'],bundle:true,platform:'node',format:'esm',outdir:'.tmp/member-preparation'});
const model=await import(pathToFileURL(process.cwd()+'/.tmp/member-preparation/membership-model-request.js')),cutover=await import(pathToFileURL(process.cwd()+'/.tmp/member-preparation/continuity-credit-cutover.js'));
const packs=JSON.parse(fs.readFileSync(dir+'/DYNAMIC-PACKS-AND-EXPERIMENT.json'));const requests=[];
await build({entryPoints:['functions/_lib/knowledge-access-api.js','functions/personal-reading/continuity/membership-authority-pack.js'],bundle:true,platform:'node',format:'esm',entryNames:'[name]',outdir:'.tmp/member-fresh-evaluation'});
const retrieval=await import(pathToFileURL(process.cwd()+'/.tmp/member-fresh-evaluation/knowledge-access-api.js')),packing=await import(pathToFileURL(process.cwd()+'/.tmp/member-fresh-evaluation/membership-authority-pack.js'));
const registry=JSON.parse(fs.readFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v12-candidate.json')),objects=new Map(registry.records.filter(r=>r.localPath).map(r=>[r.r2ObjectKey,fs.readFileSync(r.localPath)]));
const sourceEnv={...env,PHIOS_ENVIRONMENT:'local',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'true',PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:'true',PHIOS_MANUSCRIPT_DERIVATIVE_QA:'false',MANUSCRIPTS:{async get(key){return objects.has(key)?{body:objects.get(key)}:null;}},ASSETS:{async fetch(request){const path='.'+new URL(request.url).pathname;return fs.existsSync(path)?new Response(fs.readFileSync(path)):new Response('',{status:404});}}};
const fresh=[];for(const [index,question] of ['系统更换组成部分后，持续与原样不变有什么区别？','如果部件不断更新，整体的持续依赖哪些条件？','正常维持与发生损坏后恢复有什么区别？'].entries()){
 const url='http://localhost/api/knowledge-access?'+new URLSearchParams({q:question,locale:'zh-Hans',source:'manuscript'});const response=await retrieval.handleKnowledgeAccessRequest(new Request(url),sourceEnv),result=await response.json();
 fresh.push({id:'FRESH-'+(index+1),q:question,role:'NEW_MODEL_EVALUATION_CASE_NOT_USED_TO_TUNE_RULES; RETRIEVAL_ONLY_NOT_ANSWER_PASS',pack:await packing.buildMembershipAuthorityPack({question,locale:'zh-Hans',records:result.manuscript?.records||[]}),retrievalStatus:response.status});
}
packs.ready.push(...fresh);
for(const row of packs.ready.filter(r=>r.pack.sources.length))for(const name of ['gpt-5.6-luna','gpt-5.6-terra']){
 try{requests.push({requestId:row.id+'-'+name,caseId:row.id,role:row.role,...model.createMembershipModelRequest(row.pack,name),status:'AWAITING_INDEPENDENT_PAID_AUTHORIZATION'});}catch(error){requests.push({caseId:row.id,model:name,status:'BLOCKED',reason:error.message});}
}
const executable=requests.filter(r=>r.body),maximum=executable.reduce((n,r)=>n+r.maximumMicroUSD,0);assert.ok(maximum<=600000);assert.ok(executable.length<=20);
assert.equal(model.meterMembershipModelUsage('gpt-5.6-luna',{input_tokens:1000,input_tokens_details:{cached_tokens:200},output_tokens:100}).modelCostMicroUSD,284);
assert.throws(()=>model.meterMembershipModelUsage('gpt-5.6-luna',{}),/RECONCILIATION/);
const audit=await cutover.auditCreditCutover(env,'alice');assert.equal(audit.grantsCreated,0);assert.ok(audit.balance.availableMicroUSD>=0);
fs.writeFileSync(dir+'/EXECUTABLE-REQUESTS.json',JSON.stringify({requests,maximumReservedMicroUSD:maximum,capMicroUSD:600000,platformFunded:true,memberCreditsCharged:false,providerCalls:0,automaticRetry:0,authorization:false,independentQualityEvaluation:'NOT_RUN',reviewRubric:['answers original question','each argument supported','conditions preserved','comparison both sides','language','completeness','latency','actual usage cost'],newQuestionsRequiredBeforeDispatch:true},null,2)+'\n');
fs.writeFileSync(dir+'/CUTOVER-RECONCILIATION-QA.json',JSON.stringify({fixtureOnly:true,productionRead:false,audit,migrationCandidate:'db/migration-candidates/0019_continuity_ask_credit_allocations.sql',activeMigrationSequenceConflict:'CANDIDATE_0018_IS_NOT_ACTIVE_P9_0018; REGISTER_NEW_SEQUENCE_BEFORE_PRODUCTION',steps:['freeze legacy dispatch, not renewal webhook','snapshot grants/purchase IDs/actual costs/unknown usage/reservations','reconcile or drain unresolved calls; never assume zero cost','apply registered additive schema in QA','verify old and new readers produce same net spend; no grant replay','enable exactly one dispatcher after explicit production authorization'],rollback:audit.rollback,productionMigration:0},null,2)+'\n');
console.log(JSON.stringify({preparedRequests:executable.length,maximumMicroUSD:maximum,cutoverFixture:true,providerCalls:0}));
export {sourceEnv};
