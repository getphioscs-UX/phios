import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
const dir='tools/review/membership-ask-credit-r1',sha=x=>createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const planPath=dir+'/FULL-DELIVERY-QA-REQUESTS.json',planBytes=fs.readFileSync(planPath),plan=JSON.parse(planBytes),grant=read(dir+'/FULL-DELIVERY-QA-OWNER-GRANT.json');
assert.equal(sha(planBytes),grant.requestManifestSha256);for(const d of grant.dependencies)assert.equal(sha(fs.readFileSync(d.path)),d.sha256,'RELEVANT_INPUT_CHANGED:'+d.path);
// Reuse the existing source setup verbatim. This does not regenerate its evidence.
const setup=fs.readFileSync('scripts/prepare-membership-delivery-source-extension.mjs','utf8').split('const questions=')[0];
fs.writeFileSync('.tmp/full-delivery-source-setup.mjs',setup+'\nexport {api,env,manifest,reads,metadata};\n');
const source=await import(pathToFileURL(process.cwd()+'/.tmp/full-delivery-source-setup.mjs'));
assert.equal(sha(JSON.stringify(source.metadata)),plan.isolatedMetadataDigest);
await build({entryPoints:['functions/personal-reading/continuity/membership-short-delivery-qa.js','functions/personal-reading/continuity/continuity-credit-d1.js','functions/personal-reading/continuity/continuity-quota-d1.js','functions/api/membership-ask.js'],bundle:true,platform:'node',format:'esm',entryNames:'[name]',outdir:'.tmp/full-delivery-runtime'});
const load=async name=>import(pathToFileURL(process.cwd()+'/.tmp/full-delivery-runtime/'+name+'.js'));
const runtime=await load('membership-short-delivery-qa'),credit=await load('continuity-credit-d1'),quota=await load('continuity-quota-d1'),route=await load('membership-ask');
const dbPath=dir+'/FULL-DELIVERY-QA.sqlite',fresh=!fs.existsSync(dbPath),db=new DatabaseSync(dbPath);
if(fresh){db.exec(`CREATE TABLE commerce_subscriptions(stripe_subscription_id TEXT PRIMARY KEY,customer_id TEXT,order_id TEXT,subscription_status TEXT,paid_until INTEGER,current_period_end INTEGER,last_invoice_id TEXT);CREATE TABLE commerce_checkout_attempts(checkout_attempt_id TEXT PRIMARY KEY,customer_id TEXT,environment TEXT,product_id TEXT,review_required INTEGER,order_state TEXT,context_json TEXT);CREATE TABLE commerce_purchases(purchase_id TEXT PRIMARY KEY,checkout_attempt_id TEXT,customer_id TEXT,purchase_state TEXT,amount_minor INTEGER);`);for(const p of ['db/migrations/0015_product_cost_envelopes.sql','db/migration-candidates/0018_continuity_quota_units.sql','db/migration-candidates/0019_continuity_ask_credit_allocations.sql'])db.exec(fs.readFileSync(p,'utf8'));}
class Stmt{constructor(sql){this.sql=sql;}bind(...args){this.args=args;return this;}sync(){return db.prepare(this.sql).run(...this.args);}async first(){return db.prepare(this.sql).get(...this.args)||null;}async all(){return {results:db.prepare(this.sql).all(...this.args)};}async run(){return {meta:{changes:Number(this.sync().changes)}};}}
const env={...source.env,STRIPE_ENVIRONMENT:'QA',PHIOS_MEMBERSHIP_ASK_CREDIT_ENABLED:'true',RUNTIME_DB:{prepare:sql=>new Stmt(sql),async batch(stmts){db.exec('BEGIN IMMEDIATE');try{const r=stmts.map(s=>({meta:{changes:Number(s.sync().changes)}}));db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}}};
if(fresh){const now=Math.floor(Date.now()/1000),until=now+86400;db.prepare('INSERT INTO commerce_checkout_attempts VALUES(?,?,?,?,?,?,?)').run('isolated-qa-only','qa-member','QA','COM-SUBSCRIPTION-MONTHLY',0,'PAID','{}');db.prepare('INSERT INTO commerce_purchases VALUES(?,?,?,?,?)').run('isolated-qa-purchase','isolated-qa-only','qa-member','purchased',1900);db.prepare('INSERT INTO commerce_subscriptions VALUES(?,?,?,?,?,?,?)').run('isolated-qa-sub','qa-member','isolated-qa-only','ACTIVE',until,until,'isolated-qa-invoice');await quota.grantContinuityQuota(env,{ownerAccountId:'qa-member',subscriptionId:'isolated-qa-sub',sourceId:'isolated-qa-invoice',kind:'INVOICE',purchaseId:'isolated-qa-purchase',periodStart:now-1,periodEnd:until});}
const envelope=db.prepare('SELECT envelope_id FROM provider_product_cost_envelopes').get().envelope_id,capability=runtime.createMembershipDeliveryQACapability(env,grant),jobs=new Map(),ledgerPath=dir+'/FULL-DELIVERY-QA-LEDGER.json',ledger=fs.existsSync(ledgerPath)?read(ledgerPath):{grantSha256:sha(fs.readFileSync(dir+'/FULL-DELIVERY-QA-OWNER-GRANT.json')),entries:[],events:[],platformFunded:true,realCustomerCharge:0};
const save=()=>fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n'),token=randomBytes(24).toString('hex');
const context=(owner='qa-member',url='http://localhost/api/membership-ask')=>({env,data:{symbolicAccountIdentity:{userId:owner,providerId:'ISOLATED_QA_SERVER',verified:true,authenticated:true}},request:new Request(url)});
const snapshot=()=>({tasks:db.prepare('SELECT task_id,state,reserved_micro_usd,customer_charge_micro_usd FROM continuity_ask_tasks').all(),allocations:db.prepare('SELECT * FROM continuity_ask_allocations').all(),platformEntries:db.prepare('SELECT request_id,measured_micro_usd,state FROM provider_product_cost_entries').all()});
async function execute(r,owner){
 const taskId='full-delivery-'+r.id,job={taskId,state:'RETRIEVING',id:r.id};jobs.set(r.id,job);
 try{job.balanceBefore=await credit.readCreditBalance(env,owner);job.result=await runtime.runMembershipDeliveryQA(context(owner),r,{capability,taskId,depth:r.depth,confirmed:r.confirmed,platformEnvelopeId:envelope,
 prepare:async()=>{source.reads.length=0;const actual=await source.api.prepare(env,source.manifest,{q:r.question,locale:r.locale,bookCode:r.bookCode});assert.deepEqual(actual.pack,r.pack,'DYNAMIC_SOURCE_PACK_CHANGED');assert.equal(actual.errors.length,0);job.retrieval={...actual,storageReads:[...source.reads]};return actual;},
 invoke:async(body,{maximumMicroUSD})=>{
  assert.deepEqual(body,r.body,'FROZEN_REQUEST_CHANGED');for(const d of grant.dependencies)assert.equal(sha(fs.readFileSync(d.path)),d.sha256,'DEPENDENCY_CHANGED');
  if(ledger.entries.some(e=>e.actualNanoUSD===null))throw Error('UNKNOWN_COST_STOP');const spent=ledger.entries.reduce((n,e)=>n+e.actualNanoUSD,0);
  assert.ok(ledger.entries.length<5&&ledger.entries.filter(e=>e.model===body.model).length<plan.models[body.model]&&spent+maximumMicroUSD*1000<=60000000,'OWNER_CAP_BEFORE_CALL');
  const e={id:r.id,model:body.model,taskId,bodySha256:sha(JSON.stringify(body)),promptSha256:sha(body.input[0].content),packDigest:r.pack.packDigest,maximumMicroUSD,actualNanoUSD:null,state:'RESERVED',startedAt:new Date().toISOString()};ledger.entries.push(e);save();
  const started=Date.now(),response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)}),raw=await response.json();
  e.latencyMs=Date.now()-started;e.httpStatus=response.status;e.rawPath=dir+'/full-delivery-response-'+r.id+'.json';fs.writeFileSync(e.rawPath,JSON.stringify(raw,null,2)+'\n',{flag:'wx'});e.rawSha256=sha(fs.readFileSync(e.rawPath));e.usage=raw.usage;e.providerStatus=raw.status;
  const meter=runtime.meterShortDeliveryUsage(body.model,raw.usage);e.actualNanoUSD=meter.modelCostNanoUSD;e.actualMicroUSD=meter.modelCostMicroUSD;e.state='METERED';e.costBasis='ACTUAL_USAGE_CURRENT_RATES_INVOICE_NOT_RECONCILED';save();
  assert.ok(e.actualNanoUSD<=maximumMicroUSD*1000&&spent+e.actualNanoUSD<=60000000,'ACTUAL_BUDGET_EXCEEDED');if(!response.ok)throw Error('PROVIDER_FAILURE_NO_RETRY');
  const text=raw.output?.filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n')||'';job.rawText=text;
  return {status:raw.status,text,usage:raw.usage};},
 assess:async evidence=>{job.state='AWAITING_QA_SEMANTIC_REVIEW';job.evidence=evidence;fs.writeFileSync(dir+'/full-delivery-pending-'+r.id+'.json',JSON.stringify({id:r.id,taskId,...evidence,retrieval:job.retrieval},null,2)+'\n');return new Promise(resolve=>{job.resolveReview=resolve;});}
 });job.state=job.result.state;
 }catch(e){job.state='FAILED';job.error=e.message;}
 job.balanceAfter=await credit.readCreditBalance(env,owner).catch(()=>null);job.database=snapshot();ledger.events.push({...job,resolveReview:undefined,at:new Date().toISOString()});save();fs.writeFileSync(dir+'/full-delivery-result-'+r.id+'.json',JSON.stringify({...job,resolveReview:undefined},null,2)+'\n');
}
const server=http.createServer(async(req,res)=>{const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};try{
 const url=new URL(req.url,'http://localhost');if(req.headers['x-qa-token']!==token)return json(401,{error:'QA_SERVER_AUTH_REQUIRED'});const owner=req.headers['x-qa-owner']||'qa-member';
 if(req.method==='GET'&&url.pathname==='/qa/status')return json(200,{jobs:[...jobs.values()].map(j=>({...j,resolveReview:undefined})),ledger,database:snapshot()});
 if(req.method==='GET'&&url.pathname==='/api/membership-ask'){const response=await route.onRequest(context(owner,'http://localhost'+req.url));ledger.events.push({type:'REOPEN',owner,taskId:url.searchParams.get('taskId'),status:response.status,calls:ledger.entries.length,at:new Date().toISOString()});save();return json(response.status,await response.json());}
 let body='';for await(const chunk of req)body+=chunk;if(body.length>20000)throw Error('REQUEST_TOO_LARGE');const input=JSON.parse(body||'{}');
 if(url.pathname==='/qa/review'){const j=jobs.get(input.id);if(!j?.resolveReview)throw Error('NO_PENDING_REVIEW');assert.ok(typeof input.assessment?.deliverable==='boolean'&&input.assessment?.rationale);j.assessment=input.assessment;const resolve=j.resolveReview;delete j.resolveReview;resolve(input.assessment);return json(200,{reviewRecorded:true});}
 if(req.method==='POST'&&url.pathname==='/api/membership-ask'){const r=plan.requests.find(r=>r.id===input.id);assert.ok(r,'REQUEST_NOT_FROZEN');const taskId='full-delivery-'+r.id,prior=db.prepare('SELECT state FROM continuity_ask_tasks WHERE task_id=? AND owner_account_id=?').get(taskId,owner);if(prior){ledger.events.push({type:'REPEAT',taskId,calls:ledger.entries.length,at:new Date().toISOString()});save();return json(200,{taskId,state:prior.state,replayed:true,providerCalls:0});}await quota.activeContinuitySubscription(env,owner);void execute(r,owner);return json(202,{id:r.id,taskId});}
 return json(404,{error:'NOT_FOUND'});
 }catch(e){json(400,{error:e.message});}});
server.listen(55641,'127.0.0.1',()=>{fs.writeFileSync('.tmp/full-delivery-qa-session.json',JSON.stringify({url:'http://127.0.0.1:55641',token}));console.log('Isolated QA service ready on 127.0.0.1:55641; synthetic SQLite; no production resources.');});
