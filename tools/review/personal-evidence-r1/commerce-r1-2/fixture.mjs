import fs from 'node:fs';
import {authenticatedFixture} from '../evidence-system-r1/receiver-closure/test.mjs';
import {fixture} from '../evidence-system-r1/local-test.mjs';
import {createCommerceOrder} from '../../../../functions/commerce/book-commerce-store.js';
import {commerceProduct} from '../../../../functions/pws/commercial/stripe-product-registry.js';
import {onRequest as root} from '../../../../functions/_middleware.js';
import {onRequest as auth} from '../../../../functions/api/_middleware.js';
import {symbolicLanguageExport} from '../../../../functions/report-delivery/symbolic-language-export.js';
import {profileEvidenceApi} from '../../../../functions/account/profile-evidence-store.js';
export {fixture};
export async function setup(){const f=await authenticatedFixture();
 const assetFetch=f.env.ASSETS.fetch;f.env.ASSETS.fetch=async request=>new URL(request.url).pathname==='/content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json'?new Response(fs.readFileSync('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json')):assetFetch(request);
 const batch=f.env.RUNTIME_DB.batch.bind(f.env.RUNTIME_DB);let queue=Promise.resolve();f.env.RUNTIME_DB.batch=statements=>{const result=queue.then(()=>batch(statements));queue=result.catch(()=>{});return result;};
 for(const file of ['db/migrations/0015_product_cost_envelopes.sql','db/migration-candidates/0018_continuity_quota_units.sql','db/migration-candidates/0019_continuity_ask_credit_allocations.sql'])f.sql.exec(fs.readFileSync(file,'utf8'));
 async function purchase(productId,owner='qa-A',context={},historical=false){
  const token=crypto.randomUUID();let o;if(historical){const p=commerceProduct(productId),id='historical_'+token,now=new Date().toISOString();f.sql.prepare("INSERT INTO commerce_checkout_attempts(checkout_attempt_id,product_id,idempotency_key_hash,status,locale,created_at,updated_at,customer_id,selected_products_json,order_state,amount_minor,currency,qa_price_id,request_hash,environment,context_json) VALUES(?,?,?,'creating','en',?,?,?,'[]','PENDING',?,'MYR',?,?,'QA',?)").run(id,productId,token,now,now,owner,p.amountMinor,p.qaPriceId,token,JSON.stringify(context));o=f.sql.prepare('SELECT * FROM commerce_checkout_attempts WHERE checkout_attempt_id=?').get(id);}else o=await createCommerceOrder({env:f.env,customerId:owner,productId,selectedProducts:[],idempotencyKeyHash:token,requestHash:token,locale:'en',context});const p=commerceProduct(productId),now=new Date().toISOString(),id='pur_'+o.checkout_attempt_id;
  f.sql.prepare("UPDATE commerce_checkout_attempts SET order_state='FULFILLED' WHERE checkout_attempt_id=?").run(o.checkout_attempt_id);
  f.sql.prepare("INSERT INTO commerce_purchases(purchase_id,customer_id,product_id,checkout_attempt_id,stripe_checkout_session_id,currency,amount_minor,purchase_state,created_at,updated_at) VALUES(?,?,?,?,?,'MYR',?,'purchased',?,?)").run(id,owner,productId,o.checkout_attempt_id,'cs_'+token,p.amountMinor,now,now);
  f.sql.prepare("INSERT INTO digital_entitlements(entitlement_id,purchase_id,customer_id,product_id,subject_hash,entitlement_code,granted_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").run('ent_'+token,id,owner,productId,owner,p.entitlementPolicy,now,now,now);
  return {id,order:o};
 }
 async function member(owner='qa-A'){
  const p=await purchase('COM-SUBSCRIPTION-MONTHLY',owner),start=Math.floor(Date.now()/1000)-3600,end=start+30*86400,sub='sub_'+owner.replace('-','');
  f.sql.prepare("INSERT INTO commerce_subscriptions(stripe_subscription_id,customer_id,order_id,stripe_customer_id,subscription_status,current_period_end,paid_until,last_invoice_id,updated_at) VALUES(?,?,?,?,'ACTIVE',?,?,?,?)").run(sub,owner,p.order.checkout_attempt_id,'cus_'+owner,end,end,'in_'+owner,new Date().toISOString());
  const {grantContinuityQuota}=await import('../../../../functions/personal-reading/continuity/continuity-quota-d1.js');await grantContinuityQuota(f.env,{ownerAccountId:owner,subscriptionId:sub,sourceId:'in_'+owner,kind:'INVOICE',purchaseId:p.id,periodStart:start,periodEnd:end});return {sub,start,end,purchase:p};
 }
 async function request(path,body=null,user='qa-A',extraHeaders={}){
  const request=new Request('https://localhost'+path,{method:body?'POST':'GET',headers:{...extraHeaders,...(user?{cookie:'__Host-phios-session='+f.cookies[user]}:{}),...(body?{'content-type':'application/json',origin:'https://localhost'}:{})},...(body?{body:JSON.stringify(body)}:{})});const c={request,env:{...f.env},data:{}};c.next=()=>auth({...c,next:()=>path.startsWith('/api/account-symbolic-reading-export')?symbolicLanguageExport(c):profileEvidenceApi(c)});const response=await root(c),bytes=new Uint8Array(await response.arrayBuffer()),raw=new TextDecoder().decode(bytes);let value;try{value=JSON.parse(raw)}catch{}return {status:response.status,body:value,raw,bytes,headers:Object.fromEntries(response.headers)};
 }
 return {...f,purchase,member,exportRequest:request};
}
