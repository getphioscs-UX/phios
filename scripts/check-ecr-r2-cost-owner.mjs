import fs from 'node:fs';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {createSqliteD1Adapter,loadRuntimeMigrations} from './runtime-migration-loader.mjs';
import {openProductCostEnvelope,reserveProductCost,settleProductCost} from '../functions/provider-cost/product-cost-envelope.js';
import {reportFollowupReserve,reportGenerationCeiling} from '../functions/pws/commercial/commerce-economics-policy.js';
const out='tools/review/phi-configuration-deep-reading-r2-integrated',file=`${out}/cost-local-${Date.now()}.sqlite`,sql=new DatabaseSync(file);for(const m of loadRuntimeMigrations(process.cwd()).migrations)sql.exec(m.sql);
const env={RUNTIME_DB:createSqliteD1Adapter(sql)},ownerAccountId='ECR-R2-SYNTHETIC-OWNER',productId='COM-REPORT-ECR-FULL',now=new Date().toISOString(),results=[];
await assert.rejects(openProductCostEnvelope(env,{ownerAccountId,purchaseId:'FORGED-REDIRECT',productId}),/ENVELOPE_REQUIRED/);results.push('unpaid / forged purchase rejected');
sql.prepare("INSERT INTO commerce_products(product_id,product_version,title,language,format,currency,amount_minor,source_object_key,created_at,updated_at) VALUES(?,'LOCAL-QA','Synthetic only','en','HTML','MYR',12900,'',?,?)").run(productId,now,now);
for(const [index,locale,price]of [[1,'zh-Hans',12900],[2,'en',12900],[3,'bilingual',13900]]){
 const purchaseId=`ECR-QA-P${index}`,order=`ECR-QA-O${index}`;
 sql.prepare("INSERT INTO commerce_checkout_attempts(checkout_attempt_id,customer_id,order_state,product_id,idempotency_key_hash,status,created_at,updated_at,environment) VALUES(?,?,'FULFILLED',?,?,'paid',?,?,'QA')").run(order,ownerAccountId,productId,order,now,now);
 sql.prepare("INSERT INTO commerce_purchases(purchase_id,customer_id,product_id,checkout_attempt_id,stripe_checkout_session_id,currency,amount_minor,purchase_state,created_at,updated_at) VALUES(?,?,?,?,?,'MYR',?,'purchased',?,?)").run(purchaseId,ownerAccountId,productId,order,`SYNTHETIC-NOT-STRIPE-${index}`,price,now,now);
 sql.prepare("INSERT INTO digital_entitlements(entitlement_id,purchase_id,customer_id,product_id,subject_hash,granted_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)").run(`ECR-QA-E${index}`,purchaseId,ownerAccountId,productId,'synthetic-only',now,now,now);
 const envelope=await openProductCostEnvelope(env,{ownerAccountId,purchaseId,productId});assert.equal(envelope.maximum_cost_micro_usd,6000000);
 assert.equal(reportGenerationCeiling(productId),5.4);assert.equal(reportFollowupReserve(productId),.6);
 const args={ownerAccountId,envelopeId:envelope.envelope_id,requestId:`ECR-QA-GEN${index}`,contextId:`LOCAL-${locale}`,costClass:'MODEL',conservativeMaximumUSD:5.4,payload:{spendStage:'REPORT_GENERATION',sourceVersion:'ECR-R2-LOCAL-QA'}};
 assert.equal((await reserveProductCost(env,args)).newReservation,true);assert.equal((await reserveProductCost(env,args)).newReservation,false);
 await settleProductCost(env,{ownerAccountId,requestId:args.requestId,measuredUSD:5.4,costBasis:'LOCAL_SYNTHETIC_COST_FIXTURE',payload:args.payload});
 for(let ask=1;ask<=4;ask++)await reserveProductCost(env,{...args,requestId:`ECR-QA-${index}-ASK${ask}`,contextId:`LOCAL-${locale}-ASK${ask}`,conservativeMaximumUSD:.15,payload:{spendStage:'REPORT_FOLLOWUP',sourceVersion:'ECR-R2-LOCAL-QA'}});
 await assert.rejects(reserveProductCost(env,{...args,requestId:`ECR-QA-${index}-OVER`,conservativeMaximumUSD:.000001}),/LIMIT_OR_UNKNOWN/);
 await assert.rejects(openProductCostEnvelope(env,{ownerAccountId:'OTHER-SYNTHETIC',purchaseId,productId}),/ENVELOPE_REQUIRED/);
 results.push({locale,order,purchaseId,amountMinor:price,capUsd:6,generationReserve:5.4,fourQuestionReserves:[.15,.15,.15,.15],idempotency:'PASS',overCap:'REJECTED',crossOwner:'REJECTED',mockProviderCalls:0,actualProviderCalls:0,delivery:'NOT_TESTED_ADAPTER_NOT_ADMITTED'});
}
sql.close();fs.writeFileSync(`${out}/cost-owner-results.json`,JSON.stringify({status:'PASS_SCOPED_COST_OWNER_ONLY',database:file,results,actualProviderCalls:0,actualCostUsd:0,realPayments:0,warning:'Synthetic ledger reservations are not actual provider costs or a full paid delivery test.'},null,2));console.log('PASS existing SQL cost owner: three synthetic orders, USD6 pool, 5.4 + four 0.15 reserves, retry idempotency and over-cap rejection. No delivery claimed.');
