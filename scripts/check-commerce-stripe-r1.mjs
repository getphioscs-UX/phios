import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createSqliteD1Adapter,loadRuntimeMigrations} from './runtime-migration-loader.mjs';
import {applyRuntimeMigrations} from '../functions/runtime/migrations/migration-runner.js';
import {STRIPE_PRODUCT_REGISTRY,commerceSelection,standardBundleProducts,assertReportPriceParity} from '../functions/pws/commercial/stripe-product-registry.js';
import {commerceApi} from '../functions/commerce/commerce-stripe-api.js';
import {createStripeTestSignature} from '../functions/commerce/stripe-client.js';
import {onRequestPost as webhook} from '../functions/api/stripe-webhook.js';
import {commerceAccountProjection,registerWebhookEvent,ensureBookProduct} from '../functions/commerce/book-commerce-store.js';
import {sha256Hex} from '../functions/commerce/commerce-crypto.js';

const cases=[];async function test(name,fn){await fn();cases.push({name,status:'PASS',evidence:'local SQLite D1 adapter / injected Stripe HTTP fixture; not provider end-to-end'});}
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
const db=createSqliteD1Adapter(sqlite), migrations=loadRuntimeMigrations(process.cwd()).migrations;
const env={RUNTIME_DB:db,STRIPE_ENVIRONMENT:'QA',STRIPE_SECRET_KEY:'sk_test_fixture_only',STRIPE_WEBHOOK_SECRET:'whsec_fixture_only',PHIOS_COMMERCE_QA_ENABLED:'true'};
Object.assign(env,{BOOKS:{head:async()=>({size:1})},BOOK_ACCESS_TOKEN_SECRET:'fixture-only-book-secret-at-least-32-characters',BOOK_WATERMARK_SERVICE_URL:'https://watermark.test',BOOK_WATERMARK_SERVICE_TOKEN:'fixture-only',COMMERCE_BOOK_SOURCE_KEYS_JSON:JSON.stringify(Object.fromEntries([2,3,4,5,6,7].map(n=>[`COM-BOOK-0${n}`,`private/fixture-book-${n}.pdf`])))});
await test('migration preserves existing book purchases, rights and download tokens',async()=>{
  await applyRuntimeMigrations({db,migrations:migrations.slice(0,5)});await ensureBookProduct(env);
  const product=sqlite.prepare('SELECT product_id FROM commerce_products').get().product_id;
  sqlite.prepare("INSERT INTO commerce_checkout_attempts(checkout_attempt_id,product_id,idempotency_key_hash,status,created_at,updated_at) VALUES('legacy',?,'legacy','paid','2026','2026')").run(product);
  sqlite.prepare("INSERT INTO commerce_purchases(purchase_id,product_id,checkout_attempt_id,stripe_checkout_session_id,buyer_email_ciphertext,buyer_email_hash,currency,amount_minor,purchase_state,created_at,updated_at) VALUES('legacy',?,'legacy','cs_test_legacy','cipher','hash','MYR',8900,'purchased','2026','2026')").run(product);
  sqlite.prepare("INSERT INTO digital_entitlements(entitlement_id,purchase_id,product_id,subject_hash,granted_at,created_at,updated_at) VALUES('legacy','legacy',?,'hash','2026','2026','2026')").run(product);
  sqlite.exec("INSERT INTO commerce_download_tokens(token_id,entitlement_id,token_hash,expires_at,max_uses,created_at) VALUES('legacy','legacy','hash','2030',3,'2026')");
  await applyRuntimeMigrations({db,migrations});
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM commerce_download_tokens').get().n,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM digital_entitlements').get().n,1);
  assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(),[]);
});
await test('24 approved QA prices and all existing report prices agree',()=>{
  assert.equal(STRIPE_PRODUCT_REGISTRY.length,24);assert.equal(new Set(STRIPE_PRODUCT_REGISTRY.map(p=>p.qaPriceId)).size,24);assertReportPriceParity();
  const approved={'COM-REPORT-FINANCIAL-FULL':15900,'COM-BOOK-01':8900,'COM-BOOK-02':8900,'COM-BOOK-03':8900,'COM-BOOK-04':8900,'COM-BOOK-05':10900,'COM-BOOK-06':5900,'COM-BOOK-07':5900,'COM-SUBSCRIPTION-MONTHLY':1900,'COM-WILL-WRITING':2900,'COM-SERVICE-FINANCIAL-CONSULTATION':10000,'COM-SERVICE-CASH-FLOW-GAME':10000,'COM-SERVICE-NATURAL-HEALER':10000};
  for(const [id,amount] of Object.entries(approved))assert.equal(STRIPE_PRODUCT_REGISTRY.find(p=>p.productId===id).amountMinor,amount);
  const provider=JSON.parse(fs.readFileSync('docs/qa/commerce-stripe-r1/stripe-provider-readback.json','utf8'));
  for(const p of STRIPE_PRODUCT_REGISTRY){const q=provider.prices.find(q=>q.id===p.qaPriceId);assert(q);assert.equal(q.product,p.qaProductId);assert.equal(q.unit_amount,p.amountMinor);assert.equal(q.currency,'myr');assert.equal(q.livemode,false);assert.equal(p.livePriceId,null);assert.equal(p.liveProductId,null);assert.equal(Boolean(q.recurring),p.billingType==='RECURRING');if(q.recurring){assert.equal(q.recurring.interval,'month');assert.equal(q.recurring.interval_count,1);}}
});
await test('bundle eligibility/count/uniqueness server policy',()=>{
  const eligible=standardBundleProducts();assert.equal(eligible.length,6);
  assert.equal(commerceSelection('COM-REPORT-BUNDLE-2',eligible.slice(0,2)).length,2);
  assert.equal(commerceSelection('COM-REPORT-BUNDLE-3',eligible.slice(0,3)).length,3);
  assert.equal(commerceSelection('COM-REPORT-BUNDLE-5PLUS',eligible).length,6);
  for(const bad of [[],eligible.slice(0,1),[eligible[0],eligible[0]],[eligible[0],'COM-REPORT-HD-FULL'],[eligible[0],'COM-REPORT-CROSS-FULL'],[eligible[0],'COM-REPORT-FINANCIAL-FULL']])assert.throws(()=>commerceSelection('COM-REPORT-BUNDLE-2',bad));
  assert.throws(()=>commerceSelection('COM-REPORT-BUNDLE-5PLUS',eligible.slice(0,4)));
});
let sequence=0;const sessions=new Map(),subscriptions=new Map(),stripeCalls=[];
const respond=object=>new Response(JSON.stringify(object),{headers:{'content-type':'application/json'}});
const fetcher=async(url,options={})=>{
  const pathname=new URL(url).pathname,body=new URLSearchParams(options.body);stripeCalls.push({pathname,body:Object.fromEntries(body)});
  if(new URL(url).host==='watermark.test')return respond({status:'completed',destinationObjectKey:JSON.parse(options.body).destinationObjectKey});
  if(pathname==='/v1/account')return respond({id:'acct_1UFr0TBEKXJyHMkK'});
  if(pathname==='/v1/customers')return respond({id:'cus_fixture',livemode:false});
  if(pathname==='/v1/billing_portal/sessions')return respond({url:'https://billing.stripe.com/p/session/test_fixture'});
  if(pathname==='/v1/checkout/sessions'){
    assert(![...body.keys()].some(k=>k.includes('payment_method_types')||k.includes('price_data')));
    const metadata=Object.fromEntries([...body].filter(([k])=>/^metadata\[/.test(k)).map(([k,v])=>[k.slice(9,-1),v]));
    const product=STRIPE_PRODUCT_REGISTRY.find(p=>p.qaPriceId===body.get('line_items[0][price]'));assert(product);
    const session={id:`cs_test_fixture${++sequence}`,url:`https://checkout.stripe.com/c/pay/cs_test_fixture${sequence}`,expires_at:Math.floor(Date.now()/1000)+1800,livemode:false,mode:body.get('mode'),metadata,customer:body.get('customer'),payment_status:'unpaid',currency:'myr',amount_total:product.amountMinor,payment_intent:`pi_fixture${sequence}`,line_items:{data:[{price:{id:product.qaPriceId},quantity:1}]}};
    if(session.mode==='subscription'){
      session.subscription=`sub_fixture${sequence}`;subscriptions.set(session.subscription,{id:session.subscription,metadata,customer:session.customer,livemode:false,status:'active',cancel_at_period_end:false,items:{data:[{price:{id:product.qaPriceId},quantity:1,current_period_end:Math.floor(Date.now()/1000)+2592000}]}});
    }
    sessions.set(session.id,session);return respond(session);
  }
  if(pathname.startsWith('/v1/checkout/sessions/'))return respond(sessions.get(pathname.split('/').at(-1)));
  if(pathname.startsWith('/v1/subscriptions/'))return respond(subscriptions.get(pathname.split('/').at(-1)));
  throw new Error('Unexpected fixture request '+pathname);
};
const identity={userId:'user_owner',providerId:'QA_TEST_FIXTURE',authenticated:true,verified:true};
const context=(body={},overrides={})=>({env,data:{symbolicAccountIdentity:identity},fetch:fetcher,request:new Request('https://phios.test/api/commerce-checkout',{method:'POST',headers:{origin:'https://phios.test','content-type':'application/json','idempotency-key':'test-key-'+String(++sequence).padStart(16,'0')},body:JSON.stringify({acceptDigitalPolicy:true,...body})}),...overrides});
let eventSeq=0;
async function send(type,object,eventId=`evt_fixture${++eventSeq}`,override={}){
  const event={id:eventId,type,livemode:false,data:{object},...override},raw=JSON.stringify(event);
  const signature=await createStripeTestSignature(raw,env.STRIPE_WEBHOOK_SECRET,Math.floor(Date.now()/1000));
  return webhook({env,fetch:fetcher,request:new Request('https://phios.test/api/stripe-webhook',{method:'POST',headers:{'stripe-signature':signature},body:raw})});
}
let bundleOrder,bundleSession;
await test('checkout authenticated, tamper rejected, live keys fail closed, origin protected',async()=>{
  const productId='COM-REPORT-BAZI-FULL';
  assert.equal((await commerceApi(context({productId},{data:{}}),'checkout')).status,401);
  for(const key of ['amount','priceId','currency','customerId'])assert.equal((await commerceApi(context({productId,[key]:'tamper'}),'checkout')).status,422);
  assert.equal((await commerceApi(context({productId},{env:{...env,STRIPE_SECRET_KEY:'sk_live_fixture'}}),'checkout')).status,503);
  const ctx=context({productId});ctx.request.headers.set('origin','https://attacker.test');assert.equal((await commerceApi(ctx,'checkout')).status,403);
});
await test('bundle checkout idempotency, collision protection, customer reuse',async()=>{
  const ctx=context({productId:'COM-REPORT-BUNDLE-2',selectedProducts:standardBundleProducts().slice(0,2)});
  const copy={...ctx,request:ctx.request.clone()},response=await commerceApi(ctx,'checkout');assert.equal(response.status,201);
  bundleOrder=(await response.json()).orderId;const replay=await commerceApi(copy,'checkout');assert.equal((await replay.json()).replay,true);
  bundleSession=[...sessions.values()].at(-1);
  const bad=context({productId:'COM-REPORT-HD-FULL'});bad.request.headers.set('idempotency-key',ctx.request.headers.get('idempotency-key'));assert.equal((await commerceApi(bad,'checkout')).status,409);
});
await test('success poll creates no rights, another account cannot read order',async()=>{
  const request=new Request(`https://phios.test/api/commerce-order-status?order_id=${bundleOrder}`);
  const response=await commerceApi(context({}, {request}),'status');assert.equal((await response.json()).order.state,'CHECKOUT_CREATED');
  assert.equal((await commerceAccountProjection(env,identity.userId)).entitlements.length,0);
  assert.equal((await commerceApi(context({}, {request,data:{symbolicAccountIdentity:{...identity,userId:'other'}}}),'status')).status,404);
});
await test('unpaid completed does not grant; paid replay and concurrent deliveries grant only selected rights',async()=>{
  assert.equal((await send('checkout.session.completed',bundleSession)).status,200);
  assert.equal((await commerceAccountProjection(env,identity.userId)).entitlements.length,0);
  bundleSession.payment_status='paid';
  assert.equal((await send('checkout.session.async_payment_succeeded',bundleSession,'evt_duplicate')).status,200);
  assert.equal((await send('checkout.session.async_payment_succeeded',bundleSession,'evt_duplicate')).status,200);
  await Promise.all([send('checkout.session.completed',bundleSession),send('checkout.session.completed',bundleSession)]);
  const rights=(await commerceAccountProjection(env,identity.userId)).entitlements;assert.equal(rights.length,2);assert(!rights.some(x=>/CROSS|BUNDLE/.test(x.entitlementCode)));
  await send('payment_intent.succeeded',{id:bundleSession.payment_intent,customer:bundleSession.customer,metadata:bundleSession.metadata});assert.equal((await commerceAccountProjection(env,identity.userId)).entitlements.length,2);
});
await test('invalid signature and live event do not mutate; RECEIVED replay recovers',async()=>{
  const before=sqlite.prepare('SELECT COUNT(*) n FROM commerce_webhook_events').get().n;
  assert.equal((await webhook({env,request:new Request('https://phios.test/api/stripe-webhook',{method:'POST',body:'{}'})})).status,400);
  assert.equal((await send('checkout.session.completed',bundleSession,'evt_live',{livemode:true})).status,400);
  assert.equal((await send('checkout.session.completed',{...bundleSession,livemode:true},'evt_liveobject')).status,400);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM commerce_webhook_events').get().n,before);
  const event={id:'evt_received',type:'checkout.session.completed',livemode:false,data:{object:bundleSession}};
  await registerWebhookEvent({env,event,payloadSha256:await sha256Hex(JSON.stringify(event))});
  assert.equal((await send(event.type,bundleSession,event.id)).status,200);
  assert.equal(sqlite.prepare("SELECT processing_status FROM commerce_webhook_events WHERE stripe_event_id='evt_received'").get().processing_status,'processed');
});
await test('all single products create QA checkouts and fulfill according to type',async()=>{
  for(const product of STRIPE_PRODUCT_REGISTRY.filter(p=>!p.productId.includes('BUNDLE'))){
    const response=await commerceApi(context({productId:product.productId}),'checkout');assert.equal(response.status,201,product.productId);
    const session=[...sessions.values()].at(-1);session.payment_status='paid';assert.equal((await send('checkout.session.completed',session)).status,200);
  }
  assert.equal(stripeCalls.filter(x=>x.pathname==='/v1/customers').length,1);
  const account=await commerceAccountProjection(env,identity.userId);
  assert.equal(account.services.length,5);assert(account.services.every(s=>s.state==='INTAKE_REQUIRED'));
  assert.equal(account.services.find(s=>s.productId.includes('CASH-FLOW')).durationMinutes,120);
  assert.equal(account.services.find(s=>s.productId.includes('NATURAL')).modality,'UNDECIDED');
  assert.equal(account.subscriptions[0].accessGranted,false);
});
await test('subscription created is not entitlement; invoice activates; cancellation retains only paid interval; terminal status denies',async()=>{
  const sub=[...subscriptions.values()][0],price=sub.items.data[0].price;
  const invoice={id:'in_fixture',subscription:sub.id,customer:sub.customer,status:'paid',paid:true,amount_paid:1900,currency:'myr',lines:{data:[{price,quantity:1,period:{end:sub.items.data[0].current_period_end}}]}};
  assert.equal((await send('invoice.paid',invoice)).status,200);
  assert.equal((await commerceAccountProjection(env,identity.userId)).subscriptions[0].accessGranted,true);
  sub.cancel_at_period_end=true;await send('customer.subscription.updated',sub);
  assert.equal((await commerceAccountProjection(env,identity.userId)).subscriptions[0].accessGranted,true);
  assert.equal((await commerceAccountProjection(env,identity.userId,()=>Date.now()+3000000000)).subscriptions[0].accessGranted,false);
  for(const status of ['past_due','unpaid','canceled']){sub.status=status;await send('customer.subscription.updated',sub);assert.equal((await commerceAccountProjection(env,identity.userId)).subscriptions[0].accessGranted,false);}
});
await test('partial/full refunds recorded with review; permanent rights not silently revoked',async()=>{
  for(const amount of [1000,6900])assert.equal((await send('charge.refunded',{payment_intent:bundleSession.payment_intent,amount_refunded:amount,currency:'myr'})).status,200);
  const account=await commerceAccountProjection(env,identity.userId);assert.equal(account.orders.find(o=>o.orderId===bundleOrder).state,'REFUNDED');assert(account.entitlements.some(x=>x.entitlementCode==='REPORT_BAZI_FULL'));
});
await test('provider price mismatch is review-required without grants; portal cannot select another customer',async()=>{
  const response=await commerceApi(context({productId:'COM-REPORT-BUNDLE-3',selectedProducts:standardBundleProducts().slice(0,3)}),'checkout');assert.equal(response.status,201);
  const session=[...sessions.values()].at(-1);session.payment_status='paid';session.line_items.data[0].price.id='price_wrong';
  const before=(await commerceAccountProjection(env,identity.userId)).entitlements.length;
  assert.equal((await (await send('checkout.session.completed',session)).json()).eventStatus,'review_required');
  assert.equal((await commerceAccountProjection(env,identity.userId)).entitlements.length,before);
  assert.equal((await commerceApi(context({customer:'cus_other'}),'portal')).status,422);
});
await test('temporary DB failure returns 503; failed event retry succeeds without duplicate rights',async()=>{
  assert.equal((await commerceApi(context({productId:'COM-REPORT-HD-FULL'}),'checkout')).status,201);
  const session=[...sessions.values()].at(-1);session.payment_status='paid';let fail=true;
  env.RUNTIME_DB={...db,prepare(sql){if(fail&&sql.includes('INSERT OR IGNORE INTO commerce_purchases')){fail=false;throw new Error('fixture temporary database error');}return db.prepare(sql);}};
  try{assert.equal((await send('checkout.session.completed',session,'evt_retrydb')).status,503);assert.equal(sqlite.prepare("SELECT processing_status FROM commerce_webhook_events WHERE stripe_event_id='evt_retrydb'").get().processing_status,'failed');assert.equal((await send('checkout.session.completed',session,'evt_retrydb')).status,200);}finally{env.RUNTIME_DB=db;}
  const count=sqlite.prepare('SELECT COUNT(*) n FROM digital_entitlements WHERE purchase_id=?').get('pur_'+session.metadata.order_id).n;assert.equal(count,1);
});
await test('expiration/payment failure do not grant; protected book access is account-bound',async()=>{
  assert.equal((await commerceApi(context({productId:'COM-REPORT-ECR-FULL'}),'checkout')).status,201);
  const session=[...sessions.values()].at(-1);await send('checkout.session.expired',session);await send('checkout.session.async_payment_failed',session);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM digital_entitlements WHERE purchase_id=?').get('pur_'+session.metadata.order_id).n,0);
  assert.equal((await commerceApi(context({productId:'COM-BOOK-01'},{data:{symbolicAccountIdentity:{...identity,userId:'other'}}}),'book-download')).status,403);
  assert.equal((await commerceApi(context({productId:'COM-BOOK-01'}),'book-download')).status,200);
});
await test('unknown order or absent metadata records terminal review without granting',async()=>{
  const before=(await commerceAccountProjection(env,identity.userId)).entitlements.length;
  const response=await send('checkout.session.completed',{id:'cs_test_unknown',livemode:false,metadata:{}});
  assert.equal(response.status,200);assert.equal((await response.json()).eventStatus,'review_required');
  assert.equal((await commerceAccountProjection(env,identity.userId)).entitlements.length,before);
});
fs.mkdirSync('docs/qa/commerce-stripe-r1',{recursive:true});
fs.writeFileSync('docs/qa/commerce-stripe-r1/machine-results.json',JSON.stringify({work:'COM-STRIPE-R1',status:'PASS',cases,providerEndToEnd:'NOT_RUN',humanReview:'PENDING',liveOperations:'NOT_EXECUTED'},null,2)+'\n');
sqlite.close();console.log(`COM-STRIPE-R1: ${cases.length} machine groups PASS (local fixtures; provider E2E NOT_RUN).`);
