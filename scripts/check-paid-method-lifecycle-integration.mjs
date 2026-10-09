import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createSqliteD1Adapter,loadRuntimeMigrations} from './runtime-migration-loader.mjs';
import {COMMERCE_ECONOMICS} from '../functions/pws/commercial/commerce-economics-policy.js';
import {reportDeliveryMethod} from '../functions/report-delivery/report-delivery-contract.js';
import {createServerPaidReportContext} from '../functions/personal-reading/paid-report-context.js';
import {closeReleasedReportBudget} from '../functions/personal-reading/report-delivery-budget.js';
import {createReportGenerationStore} from '../functions/personal-reading/report-generation-store.js';
import {generatePaidReportFollowup} from '../functions/personal-reading/paid-report-followup.js';
import {grantDeliveredReportFollowups,readReportQuestionHistory} from '../functions/account/report-followup-store.js';
// Exercise the existing SQL owners and service adapters for all priced methods.
// Synthetic text/renderer receipts are fixtures; this does not admit real prose.
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'phios-method-lifecycle-'));
const filename=path.join(folder,'state.sqlite');let sql=new DatabaseSync(filename);
const objects=new Map(),env={STRIPE_ENVIRONMENT:'QA',RUNTIME_DB:createSqliteD1Adapter(sql),PRIVATE_REPORTS:{put:async(k,v)=>objects.set(k,v),get:async k=>objects.has(k)?{text:async()=>objects.get(k)}:null}};
for(const migration of loadRuntimeMigrations(process.cwd()).migrations)sql.exec(migration.sql);
const model={pricingVerified:true,inputPricePerMillion:1,cachedInputPricePerMillion:0.5,outputPricePerMillion:1},now=new Date().toISOString(),results=[];let fixtureCalls=0;
try{
for(const product of Object.values(COMMERCE_ECONOMICS).filter(p=>p.methodId)){
 const id=product.methodId,binding={environment:'QA',ownerAccountId:'owner-'+id,purchaseId:'purchase-'+id,orderId:'order-'+id,reportId:'report-'+id,productId:product.productId,authorityDigest:'fixture-authority-'+id};
 assert.equal(reportDeliveryMethod(id)?.commerceProductId,product.productId,'Missing delivery mapping: '+id);
 sql.prepare("INSERT INTO commerce_products(product_id,product_version,title,language,format,currency,amount_minor,source_object_key,created_at,updated_at) VALUES(?,'fixture','fixture','bilingual','HTML','MYR',?,'',?,?)").run(product.productId,product.amountMinor,now,now);
 sql.prepare("INSERT INTO commerce_checkout_attempts(checkout_attempt_id,customer_id,order_state,product_id,idempotency_key_hash,status,environment,created_at,updated_at) VALUES(?,?,'FULFILLED',?,?,'paid','QA',?,?)").run(binding.orderId,binding.ownerAccountId,product.productId,'key-'+id,now,now);
 sql.prepare("INSERT INTO commerce_purchases(purchase_id,customer_id,product_id,checkout_attempt_id,stripe_checkout_session_id,currency,amount_minor,purchase_state,created_at,updated_at) VALUES(?,?,?,?,?,'MYR',?,'purchased',?,?)").run(binding.purchaseId,binding.ownerAccountId,product.productId,binding.orderId,'fixture-session-'+id,product.amountMinor,now,now);
 sql.prepare("INSERT INTO digital_entitlements(entitlement_id,purchase_id,customer_id,product_id,subject_hash,granted_at,created_at,updated_at) VALUES(?,?,?,?,?, ?,?,?)").run('entitlement-'+id,binding.purchaseId,binding.ownerAccountId,product.productId,'fixture-'+id,now,now,now);
 const request={requestId:'primary-'+id,phase:'PRIMARY',projectedMaximumUsd:0.05};
 const validate=body=>{assert.equal(body.authorityDigest,binding.authorityDigest);assert(body.answer?.zhHans&&body.answer?.en,'METHOD_BILINGUAL_SOURCE_REQUIRED');};
 const args={env,binding,request,model,validateProviderOutput:validate},invoke=async()=>{fixtureCalls++;return Response.json({usage:{input_tokens:10,output_tokens:10},authorityDigest:binding.authorityDigest,answer:{zhHans:'仅测试正文',en:'Fixture only'}});};
 await assert.rejects(createServerPaidReportContext({...args,env:{...env,REPORT_ACCESS_TIER:'FREE'}}),/FREE_REPORT_PROVIDER_FORBIDDEN/);
 await assert.rejects(createServerPaidReportContext({...args,env:{...env,STRIPE_ENVIRONMENT:'LIVE'}}),/ENVIRONMENT_MISMATCH/);
 await assert.rejects(createServerPaidReportContext({...args,binding:{...binding,ownerAccountId:'intruder'}}),/ENVIRONMENT_MISMATCH/);
 const primary=await createServerPaidReportContext(args);await primary.transport.invokeBudgeted(invoke);
 const replay=await createServerPaidReportContext(args),count=fixtureCalls,response=await replay.transport.invokeBudgeted(invoke);assert.equal(fixtureCalls,count);assert.equal(response.reportBudget.providerCalls,0);assert.equal(response.reportBudget.cacheHit,true);
 const collision=await createServerPaidReportContext({...args,request:{...request,phase:'REPAIR',repairUnit:'S01/en'}});await assert.rejects(collision.transport.invokeBudgeted(invoke),/REQUEST_CONFLICT/);assert.equal(fixtureCalls,count);
 const failedRepair={...request,requestId:'repair-bad-'+id,phase:'REPAIR',repairUnit:'S01/en'};
 const bad=await createServerPaidReportContext({...args,request:failedRepair});await assert.rejects(bad.transport.invokeBudgeted(async()=>{fixtureCalls++;return Response.json({usage:{input_tokens:10,output_tokens:10},authorityDigest:binding.authorityDigest,answer:{zhHans:'缺少英文'}});}),/METHOD_BILINGUAL_SOURCE_REQUIRED/);
 const boundedRepair=await createServerPaidReportContext({...args,request:{...failedRepair,requestId:'repair-good-'+id,repairUnit:'S01/zh-Hans'}});await boundedRepair.transport.invokeBudgeted(invoke);
 const duplicateRepair=await createServerPaidReportContext({...args,request:{...failedRepair,requestId:'repair-duplicate-'+id,repairUnit:'S01/zh-Hans'}});await assert.rejects(duplicateRepair.transport.invokeBudgeted(invoke),/REPEATED_AUTOMATIC_REPAIR/);
 await assert.rejects(grantDeliveredReportFollowups(env,{...binding,methodCode:id}),/GRANT_REJECTED/);
 const candidate={customerId:binding.ownerAccountId,purchaseId:binding.purchaseId,paidReportBinding:binding,snapshot:{semanticSnapshotId:'snapshot-'+id}},release={reportId:binding.reportId},receipt={passed:true,outputDigest:'fixture-material-'+id};
 await assert.rejects(closeReleasedReportBudget({env},{candidate,release,receipt}),/MATERIAL_REQUIRED/);
 sql.prepare("INSERT INTO account_method_report_materials VALUES(?,?,?,?,'bilingual',?,?,?,?,'{}')").run(binding.reportId,binding.ownerAccountId,'person-'+id,id,candidate.snapshot.semanticSnapshotId,'fixture-material-object-'+id,receipt.outputDigest,now);
 await closeReleasedReportBudget({env},{candidate,release,receipt});await grantDeliveredReportFollowups(env,{...binding,methodCode:id});
 sql.close();sql=new DatabaseSync(filename);env.RUNTIME_DB=createSqliteD1Adapter(sql);
 const reopened=await createReportGenerationStore(env,binding);await reopened.withLock('lifecycle',async()=>assert.equal((await reopened.get('lifecycle')).delivered,true));
 const followup=n=>({env,binding,request:{requestId:'followup-request-'+id+'-'+n,phase:'FOLLOWUP',projectedMaximumUsd:0.01},question:'Fixture question '+n,consentVersion:'fixture-v1',model,invoke,validateAnswer:body=>{validate(body);return body.answer;}});
 for(let n=1;n<=4;n++)await generatePaidReportFollowup(followup(n));
 const beforeReplay=fixtureCalls;assert.equal((await generatePaidReportFollowup(followup(1))).providerCalls,0);assert.equal(fixtureCalls,beforeReplay);
 await assert.rejects(generatePaidReportFollowup({...followup(1),question:'Changed question'}),/IDEMPOTENCY_CONFLICT/);
 await assert.rejects(generatePaidReportFollowup(followup(5)),/FOUR_FOLLOWUPS_EXHAUSTED/);assert.equal(fixtureCalls,beforeReplay);
 assert.equal((await readReportQuestionHistory(env,{ownerAccountId:binding.ownerAccountId,reportId:binding.reportId})).includedRemaining,0);
 const spent=sql.prepare('SELECT SUM(x.measured_micro_usd) AS cost FROM provider_product_cost_entries x JOIN provider_product_cost_envelopes e ON e.envelope_id=x.envelope_id WHERE e.purchase_id=?').get(binding.purchaseId).cost;
 assert(spent/1e6<product.providerCapUsd);
 results.push({method:id,productId:product.productId,status:'PASS',sqlReopen:true,primaryAndRepair:true,bilingualFixtureValidated:true,immutableMaterialRequired:true,fourAnswersSaved:true,replayCalls:0,fifthDenied:true,crossOwnerAndEnvironmentDenied:true,costPool:'EXISTING_PRODUCT_COST_ENVELOPE',spentFixtureUSD:spent/1e6,productionProducerAndRenderer:'NOT_PROVEN_BY_FIXTURE'});
}
assert.equal(results.length,12);console.log(JSON.stringify({status:'PASS',methods:results.length,fixtureCalls,realProviderCalls:0,realPayments:0,productionMigration:false,results},null,2));
}finally{sql.close();fs.rmSync(folder,{recursive:true,force:true});}
