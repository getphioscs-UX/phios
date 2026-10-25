import fs from 'node:fs';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {createSqliteD1Adapter} from './runtime-migration-loader.mjs';
import {paidReportStateStore} from '../functions/report-delivery/paid-report-state-store.js';
import {ensureVerifiedPaidReportJob,sharedPaidReportCore} from '../functions/report-delivery/paid-report-delivery-core.js';
import {createContinuityD1Store} from '../functions/personal-reading/continuity/continuity-persistence-d1.js';
const out='tools/review/phi-configuration-deep-reading-r2-integrated',cost=JSON.parse(fs.readFileSync(`${out}/cost-owner-results.json`));
const sql=new DatabaseSync(cost.database),env={RUNTIME_DB:createSqliteD1Adapter(sql),PHIOS_ENVIRONMENT:'qa',STRIPE_ENVIRONMENT:'QA'},owner='ECR-R2-SYNTHETIC-OWNER',store=paidReportStateStore(env),artifacts=createContinuityD1Store(env.RUNTIME_DB),calls=new Map(),results=[];
const context=userId=>({env,data:{symbolicAccountIdentity:{userId,providerId:'LOCAL_SYNTHETIC',authenticated:true,verified:true}}});
// Test-only adapter injection. This is not imported into the production registry,
// never changes p8 admission, and composes no model interpretation.
const adapter={methodCode:'ECR',productId:'COM-REPORT-ECR-FULL',p8Admitted:true,productionAdmitted:false,recoveryPolicy:{maximumAttempts:1,rescue:false},
 async prepare(c,j){return {reportId:`ECR-QA-NOT-ISSUED-${j.jobId}`};},
 async generate(c,j,output){calls.set(j.jobId,(calls.get(j.jobId)||0)+1);const review=JSON.parse(fs.readFileSync(`${out}/review-${j.presentation.reportLocale}.json`));await artifacts.put({subjectRef:j.ownerAccountId,type:'ECR_R2_MOCK_DELIVERY',key:output.reportId,payload:{purchaseId:j.purchaseId,personId:j.personId,presentation:j.presentation,review,issued:false,mockOnly:true}});return output;},
 async validate(c,j,o){const a=await artifacts.get({subjectRef:j.ownerAccountId,type:'ECR_R2_MOCK_DELIVERY',key:o.reportId});if(!a||a.purchaseId!==j.purchaseId||a.personId!==j.personId||JSON.stringify(a.presentation)!==JSON.stringify(j.presentation)||a.review.customerPublishable!==false)throw Error('MOCK_MATERIAL_IDENTITY_MISMATCH');return o;},
 async compile(c,j,o){return this.validate(c,j,o);},async render(c,j,o){return this.validate(c,j,o);},async release(c,j,o){return this.validate(c,j,o);},async reconcile(){return null;},
 async verifyDelivered(c,j,o){await this.validate(c,j,o);const e=await c.env.RUNTIME_DB.prepare("SELECT entitlement_id FROM digital_entitlements WHERE purchase_id=? AND customer_id=? AND product_id=? AND entitlement_status='active'").bind(j.purchaseId,j.ownerAccountId,j.productId).first();if(!e)throw Error('ENTITLEMENT_MISMATCH');return true;}
};const registry={ECR:adapter};
for(const [i,locale]of [[1,'zh-Hans'],[2,'en'],[3,'bilingual']]){
 const presentation={reportLocale:locale,reportLanguageMode:locale==='bilingual'?'BILINGUAL':'SINGLE'},readinessId=`ECR-QA-INTENT-${i}`;
 await store.saveReadiness({readinessId,ownerAccountId:owner,productId:adapter.productId,methodCode:'ECR',personId:'SYNTHETIC-1',personVersion:1,inputDigest:'SYNTHETIC-1-NOT-CUSTOMER',authorityDigest:'ECR-R2-REVIEW-ONLY',presentation,state:'READY_TO_PAY',expiresAt:Date.now()+3600000,updatedAt:Date.now()});
 const order=sql.prepare('SELECT * FROM commerce_checkout_attempts WHERE checkout_attempt_id=?').get(`ECR-QA-O${i}`);order.context_json=JSON.stringify({reportIntentId:readinessId,reportPresentation:presentation});
 const mismatch={...order,context_json:JSON.stringify({reportIntentId:readinessId,reportPresentation:{reportLocale:locale==='en'?'zh-Hans':'en',reportLanguageMode:'SINGLE'}})};
 for(const state of ['CANCELED','PAYMENT_FAILED']){sql.prepare('UPDATE commerce_checkout_attempts SET order_state=? WHERE checkout_attempt_id=?').run(state,order.checkout_attempt_id);await assert.rejects(ensureVerifiedPaidReportJob(env,order,{registry}),/VERIFIED_PURCHASE_REQUIRED/);assert.equal(calls.size,i-1);}sql.prepare("UPDATE commerce_checkout_attempts SET order_state='FULFILLED' WHERE checkout_attempt_id=?").run(order.checkout_attempt_id);
 await assert.rejects(ensureVerifiedPaidReportJob(env,mismatch,{registry}),/PRESENTATION_MISMATCH/);
 await assert.rejects(ensureVerifiedPaidReportJob(env,{...order,checkout_attempt_id:'FORGED-REDIRECT',paid:true,entitlement:{entitlement_status:'active',purchase_id:'FAKE'}},{registry}),/VERIFIED_PURCHASE_REQUIRED/);
 const job=await ensureVerifiedPaidReportJob(env,order,{registry}),repeat=await ensureVerifiedPaidReportJob(env,order,{registry});assert.equal(job.jobId,repeat.jobId);
 const core=sharedPaidReportCore(context(owner),{registry});const delivered=await core.work(job.jobId);assert.equal(delivered.state,'DELIVERED');assert.equal(calls.get(job.jobId),1);
 await core.work(job.jobId);assert.equal(calls.get(job.jobId),1);assert.equal((await core.status(job.jobId)).status,'READY');
 await assert.rejects(sharedPaidReportCore(context('OTHER-SYNTHETIC'),{registry}).status(job.jobId),/UNAVAILABLE/);
 sql.prepare("UPDATE digital_entitlements SET entitlement_status='revoked' WHERE purchase_id=?").run(`ECR-QA-P${i}`);await assert.rejects(core.status(job.jobId),/ENTITLEMENT_MISMATCH/);
 results.push({locale,jobId:job.jobId,status:'PASS_MOCK_ONLY',state:delivered.state,issued:false,providerCalls:0,mockGenerateCalls:1,repeatGenerateCalls:0,canceledAndFailedOrder:'REJECTED_BEFORE_GENERATION',wrongLanguage:'REJECTED',forgedPurchase:'REJECTED',crossAccount:'REJECTED',revokedReopen:'REJECTED',renderValidation:'STRUCTURAL_MOCK_ONLY_NOT_RENDER_SERVICE'});
}
sql.close();fs.writeFileSync(`${out}/shared-mock-results.json`,JSON.stringify({status:'PASS_LOCAL_SHARED_RUNTIME_MOCK_ONLY',results,productionAdapterAdmitted:false,realProviderCalls:0,realPayments:0},null,2));console.log(JSON.stringify(results));
