import fs from 'node:fs';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';import assert from 'node:assert/strict';
import {createSqliteD1Adapter,loadRuntimeMigrations} from '../runtime-migration-loader.mjs';
import {persistentPrivateReportsQa} from './persistent-private-reports-qa.mjs';
import {evaluatePaidReportReadiness} from '../../functions/report-delivery/paid-report-readiness.js';
import {ensureVerifiedPaidReportJob} from '../../functions/report-delivery/paid-report-delivery-core.js';
export function qaCoreEnvironment(root,{fresh=false,clock=()=>1000000}={}){
 fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'.gitignore'),'*\n');const file=path.join(root,'runtime.sqlite');if(fresh)assert(!fs.existsSync(file),'QA_MATRIX_ALREADY_EXISTS');const sql=new DatabaseSync(file);if(fresh){for(const m of loadRuntimeMigrations(process.cwd()).migrations)sql.exec(m.sql);sql.exec('CREATE TABLE qa_mock_invocations(job_id TEXT,stage TEXT,PRIMARY KEY(job_id,stage));');}
 const env={RUNTIME_DB:createSqliteD1Adapter(sql),PRIVATE_REPORTS:persistentPrivateReportsQa(path.join(root,'objects')),PHIOS_ENVIRONMENT:'local',STRIPE_ENVIRONMENT:'QA',PHIOS_COMMERCE_QA_ENABLED:'true'};
 const ctx=owner=>({env,data:{symbolicAccountIdentity:{userId:owner,providerId:'P8_QA',verified:true,authenticated:true}},request:new Request('https://local.invalid/api/report')});
 return {sql,env,ctx,clock,file};
}
export function qaMockAdapter(qa,{code='MOCK_PROVIDER_REPORT',reportClass='PROVIDER_COMPOSED',failure=null,onCheckpoint=()=>{}}={}){
 const objectKey=j=>'qa-material/'+j.jobId,generatedKey=j=>'qa-generated/'+j.jobId;
 return {methodCode:code,productId:'COM-REPORT-BAZI-FULL',reportClass,p8Admitted:true,supportedPresentations:['en','zh-Hans','bilingual'],recoveryPolicy:{maximumAttempts:2,rescue:true},
  async readiness(c,r){if(r.personId==='missing-time')throw Object.assign(Error('BIRTH_TIME_REQUIRED'),{responsibilityOwner:'CUSTOMER_INPUT'});if(r.personId==='system')throw Error('AUTHORITY_PROJECTION_ERROR');if(r.personId==='service')throw Object.assign(Error('TEMPORARY_PROVIDER_UNAVAILABLE'),{responsibilityOwner:'EXTERNAL_TEMPORARY_SERVICE'});if(r.personId==='unsupported')throw Object.assign(Error('INPUT_CLASS_UNSUPPORTED'),{responsibilityOwner:'METHOD_SCOPE'});return {inputValid:true,calculationReady:true,authorityReady:true,publicationPreflightReady:true,rendererReady:true,productionConfigReady:true,commercialProductReady:true,personVersion:1,inputDigest:'qa-input:'+r.personId,authorityDigest:'qa-authority:'+r.personId};},
  async prepare(c,j){return {personId:j.personId,locale:j.presentation.reportLocale};},
  async generate(c,j){const old=await c.env.PRIVATE_REPORTS.get(generatedKey(j));if(old)return old.json();if(failure&&(failure==='ALWAYS'||j.attempts<failure))throw Error('MALFORMED_OUTPUT');qa.sql.prepare("INSERT OR IGNORE INTO qa_mock_invocations VALUES(?,'generate')").run(j.jobId);await onCheckpoint('provider_reservation',j);const output={reportId:j.reportId};await c.env.PRIVATE_REPORTS.put(generatedKey(j),JSON.stringify(output));await onCheckpoint('provider_output_persisted',j);return output;},
  async recoverCheckpoint(c,j){return (await c.env.PRIVATE_REPORTS.get(generatedKey(j)))?.json()||null;},
  async validate(c,j,o){return o;},async compile(c,j,o){await onCheckpoint('publication_compiled',j);return o;},async render(c,j,o){await onCheckpoint('renderer_succeeded',j);return o;},
  async release(c,j,o){const artifact={owner:j.ownerAccountId,person:j.personId,purchase:j.purchaseId,reportId:o.reportId,locale:j.presentation.reportLocale};for(const stage of ['artifact_persisted','html_persisted','material_row_persisted','budget_closed','followups_granted']){await c.env.PRIVATE_REPORTS.put(objectKey(j)+'/'+stage,JSON.stringify(artifact));await onCheckpoint(stage,j);}return o;},
  async reconcile(c,j){let a;for(const stage of ['artifact_persisted','html_persisted','material_row_persisted','budget_closed','followups_granted']){const object=await c.env.PRIVATE_REPORTS.get(objectKey(j)+'/'+stage);if(!object)return null;a=await object.json();if(a.owner!==j.ownerAccountId||a.person!==j.personId||a.purchase!==j.purchaseId)throw Error('MATERIAL_OWNER_MISMATCH');}return {reportId:a.reportId};},
  async verifyDelivered(c,j,o){assert.deepEqual(await this.reconcile(c,j),o);return true;},async reopen(c,j,o){assert.deepEqual(await this.reconcile(c,j),o);return o;}
 };
}
export async function seedQaPaidJob(qa,adapter,{owner,person='valid',clock=qa.clock,job=false}={}){
 const registry={[adapter.methodCode]:adapter},context=qa.ctx(owner),r=await evaluatePaidReportReadiness(context,{methodCode:adapter.methodCode,personId:person,presentation:{reportLocale:'bilingual',reportLanguageMode:'BILINGUAL'}},{registry,clock});
 if(!job)return {readiness:r,context,registry};
 const id=owner.replace(/[^A-Za-z0-9]/g,''),orderId='ord_'+id,purchaseId='pur_'+orderId,now=new Date(clock()).toISOString(),p=adapter.productId;
 qa.sql.prepare("INSERT OR IGNORE INTO commerce_products(product_id,product_version,title,language,format,currency,amount_minor,source_object_key,created_at,updated_at) VALUES(?,'qa','QA','zh-Hans','html','MYR',6900,'qa',?,?)").run(p,now,now);
 const presentation={...r.presentation},snapshot={reportIntentId:r.readinessId,reportPresentation:presentation};
 qa.sql.prepare("INSERT INTO commerce_checkout_attempts(checkout_attempt_id,product_id,idempotency_key_hash,status,locale,created_at,updated_at,customer_id,order_state,amount_minor,currency,environment,context_json) VALUES(?,?,?,'paid','en',?,?,?,'FULFILLED',6900,'MYR','QA',?)").run(orderId,p,'key'+id,now,now,owner,JSON.stringify(snapshot));
 qa.sql.prepare("INSERT INTO commerce_purchases(purchase_id,product_id,checkout_attempt_id,stripe_checkout_session_id,stripe_payment_intent_id,currency,amount_minor,purchase_state,created_at,updated_at,customer_id) VALUES(?,?,?,?,?,'MYR',500,'purchased',?,?,?)").run(purchaseId,p,orderId,'cs_test_'+id,'pi_'+id,now,now,owner);
 qa.sql.prepare("INSERT INTO digital_entitlements(entitlement_id,purchase_id,product_id,subject_hash,entitlement_status,granted_at,created_at,updated_at,customer_id) VALUES(?,?,?,'qa','active',?,?,?,?)").run('ent_'+id,purchaseId,p,now,now,now,owner);
 const order=qa.sql.prepare('SELECT * FROM commerce_checkout_attempts WHERE checkout_attempt_id=?').get(orderId),j=await ensureVerifiedPaidReportJob(qa.env,order,{registry,clock});return {readiness:r,context,registry,job:j,order};
}
export function qaRefundTransport(){let calls=0;const known=new Map();return {get calls(){return calls;},async execute(r){calls++;const response={id:'re_'+r.jobId,payment_intent:r.paymentIntentId,amount:r.amountMinor,currency:'myr',livemode:false,status:'succeeded'};known.set(r.refundKey,response);return response;},async reconcile(r){return known.get(r.refundKey)||null;}};}
