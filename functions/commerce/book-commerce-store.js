import { BOOK_ONE_PRODUCT, resolveBookOneSourceKey, resolveCommerceBookSourceKey } from './book-product-registry.js';
import { STRIPE_PRODUCT_REGISTRY, commerceProduct, commerceEntitlements } from '../pws/commercial/stripe-product-registry.js';
import {commerceLog} from './commerce-observability.js';
import {
  encryptSensitive,
  randomId,
  randomToken,
  sha256Hex,
  subjectHash
} from './commerce-crypto.js';

function dbFrom(env) {
  const db = env?.RUNTIME_DB;
  if (!db?.prepare) {
    throw Object.assign(new Error('Commerce database is not configured.'), {
      status: 503,
      code: 'commerce_database_not_configured'
    });
  }
  return db;
}

// COM-STRIPE-R1 persists orders in the existing checkout-attempt owner.
// purchase_id remains the paid-order identity; no second order store is created.
export async function ensureCommerceProducts(env, clock=Date.now) {
  const db=dbFrom(env), now=nowIso(clock);
  await db.batch(STRIPE_PRODUCT_REGISTRY.map(p=>db.prepare(`INSERT INTO commerce_products
    (product_id,product_version,title,language,format,currency,amount_minor,source_object_key,active,created_at,updated_at,category,billing_type,qa_price_id,qa_product_id)
    VALUES (?1,'COM-STRIPE-R1',?2,'bilingual',?3,'MYR',?4,'',1,?5,?5,?6,?7,?8,?9)
    ON CONFLICT(product_id) DO UPDATE SET title=excluded.title,amount_minor=excluded.amount_minor,qa_price_id=excluded.qa_price_id,qa_product_id=excluded.qa_product_id,updated_at=excluded.updated_at`)
    .bind(p.productId,p.title,p.fulfillmentType,p.amountMinor,now,p.category,p.billingType,p.qaPriceId,p.qaProductId)));
}
export async function createCommerceOrder({env,customerId,productId,selectedProducts,idempotencyKeyHash,requestHash,locale,context={},clock=Date.now}){
  await ensureCommerceProducts(env,clock);
  const p=commerceProduct(productId), db=dbFrom(env), now=nowIso(clock);
  await db.prepare(`INSERT OR IGNORE INTO commerce_checkout_attempts
    (checkout_attempt_id,product_id,idempotency_key_hash,status,locale,created_at,updated_at,customer_id,selected_products_json,order_state,amount_minor,currency,qa_price_id,request_hash,environment,context_json)
    VALUES (?1,?2,?3,'creating',?4,?5,?5,?6,?7,'PENDING',?8,'MYR',?9,?10,'QA',?11)`)
    .bind(randomId('ord_'),productId,idempotencyKeyHash,locale,now,customerId,JSON.stringify(selectedProducts),p.amountMinor,p.qaPriceId,requestHash,JSON.stringify(context)).run();
  const order=await db.prepare('SELECT * FROM commerce_checkout_attempts WHERE idempotency_key_hash=?1').bind(idempotencyKeyHash).first();
  if(order.customer_id!==customerId||order.request_hash!==requestHash) throw Object.assign(new Error('Idempotency key conflicts with another request.'),{status:409,code:'idempotency_conflict'});
  return order;
}
export async function commerceOrder(env,id,customerId){
  return dbFrom(env).prepare(`SELECT * FROM commerce_checkout_attempts WHERE checkout_attempt_id=?1 AND environment='QA' ${customerId?'AND customer_id=?2':''}`).bind(...(customerId?[id,customerId]:[id])).first();
}
export async function commerceCustomerBinding(env,customerId){
  return dbFrom(env).prepare('SELECT * FROM commerce_customer_bindings WHERE customer_id=?1').bind(customerId).first();
}
export async function bindCommerceCustomer(env,customerId,stripeCustomerId){
  await dbFrom(env).prepare(`INSERT OR IGNORE INTO commerce_customer_bindings (customer_id,stripe_customer_id,environment,created_at) VALUES (?1,?2,'QA',?3)`).bind(customerId,stripeCustomerId,new Date().toISOString()).run();
  const binding=await commerceCustomerBinding(env,customerId);
  if(binding.stripe_customer_id!==stripeCustomerId) throw Object.assign(new Error('Customer binding conflict.'),{status:409,code:'customer_binding_conflict'});
  return binding;
}
export async function attachCommerceCheckout(env,order,session){
  const db=dbFrom(env);
  await db.prepare(`UPDATE commerce_checkout_attempts SET stripe_checkout_session_id=?2,stripe_checkout_url=?3,status='payment_pending',order_state='CHECKOUT_CREATED',expires_at=?4,updated_at=?5 WHERE checkout_attempt_id=?1 AND order_state IN ('PENDING','CHECKOUT_CREATED')`)
    .bind(order.checkout_attempt_id,session.id,session.url,new Date(session.expires_at*1000).toISOString(),new Date().toISOString()).run();
}
export async function setCommercePaymentState(env,orderId,state){
  const status=state==='PAYMENT_FAILED'?'failed':state==='CANCELED'?'cancelled':'payment_pending';
  await dbFrom(env).prepare(`UPDATE commerce_checkout_attempts SET order_state=?2,status=?3,updated_at=?4 WHERE checkout_attempt_id=?1 AND order_state IN ('PENDING','CHECKOUT_CREATED','PAYMENT_PROCESSING','PAYMENT_FAILED','CANCELED')`)
    .bind(orderId,state,status,new Date().toISOString()).run();
  if(state==='PAYMENT_FAILED') commerceLog('PAYMENT_FAILED',{order_id:orderId,status:state});
}
export async function markCommerceReview(env,orderId){
  if(orderId) await dbFrom(env).prepare('UPDATE commerce_checkout_attempts SET review_required=1 WHERE checkout_attempt_id=?1').bind(orderId).run();
}
export async function prepareCommerceBookDelivery(env,order){
  const source=resolveCommerceBookSourceKey(env,order.product_id);
  if(!env.BOOKS?.head||!await env.BOOKS.head(source)||String(env.BOOK_ACCESS_TOKEN_SECRET||'').length<32) throw Object.assign(new Error('Protected book delivery is not ready.'),{status:503,code:'commerce_book_delivery_unconfigured'});
  const entitlementCode=commerceProduct(order.product_id).entitlementPolicy;
  const entitlementId=`ent_${order.checkout_attempt_id}_${entitlementCode}`, purchaseId=`pur_${order.checkout_attempt_id}`,now=new Date().toISOString();
  const payload=await encryptSensitive(JSON.stringify({customerId:order.customer_id,purchaseId,productId:order.product_id,notice:'Licensed to this PHI OS account for personal use only.'}),env.BOOK_ACCESS_TOKEN_SECRET);
  await dbFrom(env).prepare(`INSERT OR IGNORE INTO commerce_watermark_jobs (watermark_job_id,entitlement_id,source_object_key,destination_object_key,watermark_payload_ciphertext,job_status,attempt_count,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,'pending',0,?6,?6)`)
    .bind(`wm_${order.checkout_attempt_id}`,entitlementId,source,`private/books/${order.product_id.toLowerCase()}/watermarked/${purchaseId}.pdf`,payload,now).run();
  return purchaseId;
}
export async function ownedCommerceBook(env,customerId,productId){
  return dbFrom(env).prepare(`SELECT entitlement_id,watermark_status,watermarked_object_key FROM digital_entitlements WHERE customer_id=?1 AND product_id=?2 AND entitlement_status='active' AND (expires_at IS NULL OR expires_at>?3) ORDER BY granted_at DESC LIMIT 1`).bind(customerId,productId,new Date().toISOString()).first();
}
export async function fulfillCommerceOrder({env,order,session,eventId,clock=Date.now}){
  const db=dbFrom(env), now=nowIso(clock), p=commerceProduct(order.product_id), purchaseId=`pur_${order.checkout_attempt_id}`;
  const human=p.fulfillmentType==='HUMAN_SERVICE'||p.professionalReviewRequired;
  const subscription=p.billingType==='RECURRING';
  const paidState=human||p.category==='BOOK'||subscription?'FULFILLMENT_PENDING':'FULFILLED';
  const statements=[db.prepare(`INSERT OR IGNORE INTO commerce_purchases
    (purchase_id,product_id,checkout_attempt_id,stripe_checkout_session_id,stripe_payment_intent_id,stripe_customer_id,currency,amount_minor,purchase_state,paid_at,created_at,updated_at,customer_id)
    VALUES (?1,?2,?3,?4,?5,?6,'MYR',?7,'purchased',?8,?8,?8,?9)`)
    .bind(purchaseId,p.productId,order.checkout_attempt_id,session.id,typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id||null,typeof session.customer==='string'?session.customer:session.customer.id,p.amountMinor,now,order.customer_id),
    db.prepare(`UPDATE commerce_checkout_attempts SET status='paid',order_state=?2,updated_at=?3 WHERE checkout_attempt_id=?1 AND order_state NOT IN ('REFUNDED','PARTIALLY_REFUNDED','FULFILLED')`).bind(order.checkout_attempt_id,paidState,now),
    db.prepare(`INSERT OR IGNORE INTO commerce_receipts (receipt_id,receipt_number,purchase_id,receipt_json,issued_at) VALUES (?1,?2,?3,?4,?5)`)
      .bind(`rcp_${order.checkout_attempt_id}`,`PHI-QA-${order.checkout_attempt_id}`,purchaseId,JSON.stringify({purchaseId,productId:p.productId,productTitle:p.title,currency:'MYR',amountMinor:p.amountMinor,displayAmount:p.amountMinor/100,issuedAt:now,paymentStatus:'paid',environment:'QA'}),now)];
  if(!human&&!subscription){
    const selected=p.productId.includes('BUNDLE')?JSON.parse(order.selected_products_json):[];
    for(const e of commerceEntitlements(p.productId,selected)) statements.push(db.prepare(`INSERT OR IGNORE INTO digital_entitlements
      (entitlement_id,purchase_id,product_id,subject_hash,customer_id,entitlement_code,entitlement_status,watermark_status,granted_at,created_at,updated_at)
      VALUES (?1,?2,?3,?4,?4,?5,'active','pending',?6,?6,?6)`)
      .bind(`ent_${order.checkout_attempt_id}_${e.entitlementCode}`,purchaseId,e.productId,order.customer_id,e.entitlementCode,now));
  }
  if(human) statements.push(db.prepare(`INSERT OR IGNORE INTO commerce_service_fulfillments
    (fulfillment_id,order_id,customer_id,product_id,fulfillment_state,duration_minutes,modality,created_at,updated_at)
    VALUES (?1,?2,?3,?4,'INTAKE_REQUIRED',?5,'UNDECIDED',?6,?6)`)
    .bind(`ful_${order.checkout_attempt_id}`,order.checkout_attempt_id,order.customer_id,p.productId,p.durationMinutes||null,now));
  if(eventId) statements.push(db.prepare(`UPDATE commerce_webhook_events SET processing_status='processed',order_id=?2,processed_at=?3,error_code=NULL WHERE stripe_event_id=?1`).bind(eventId,order.checkout_attempt_id,now));
  const outcomes=await db.batch(statements);
  if(!subscription) commerceLog(changes(outcomes[0])>0?(human?'FULFILLMENT_CREATED':'ENTITLEMENT_GRANTED'):'ENTITLEMENT_SKIPPED_DUPLICATE',{order_id:order.checkout_attempt_id,product_id:p.productId});
  return {orderId:order.checkout_attempt_id,state:paidState};
}
export async function recordCommerceSubscription({env,order,subscription,invoice=null,clock=Date.now}){
  const db=dbFrom(env), now=nowIso(clock);
  const end=Number(subscription.items?.data?.[0]?.current_period_end||subscription.current_period_end||0);
  const invoiceEnd=Number(invoice?.lines?.data?.[0]?.period?.end||0);
  const status=subscription.status==='canceled'?'CANCELED':subscription.status==='unpaid'?'UNPAID':subscription.status==='past_due'?'PAST_DUE':subscription.status==='active'?(subscription.cancel_at_period_end?'CANCEL_AT_PERIOD_END':'ACTIVE'):'INACTIVE';
  await db.prepare(`INSERT INTO commerce_subscriptions (stripe_subscription_id,customer_id,order_id,stripe_customer_id,subscription_status,current_period_end,paid_until,cancel_at_period_end,last_invoice_id,updated_at)
    VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)
    ON CONFLICT(stripe_subscription_id) DO UPDATE SET subscription_status=excluded.subscription_status,current_period_end=excluded.current_period_end,paid_until=MAX(commerce_subscriptions.paid_until,excluded.paid_until),cancel_at_period_end=excluded.cancel_at_period_end,last_invoice_id=CASE WHEN excluded.paid_until>=commerce_subscriptions.paid_until THEN COALESCE(excluded.last_invoice_id,commerce_subscriptions.last_invoice_id) ELSE commerce_subscriptions.last_invoice_id END,updated_at=excluded.updated_at`)
    .bind(subscription.id,order.customer_id,order.checkout_attempt_id,typeof subscription.customer==='string'?subscription.customer:subscription.customer.id,status,end,invoiceEnd,subscription.cancel_at_period_end?1:0,invoice?.id||null,now).run();
  const record=await db.prepare('SELECT * FROM commerce_subscriptions WHERE stripe_subscription_id=?1').bind(subscription.id).first();
  const active=['ACTIVE','CANCEL_AT_PERIOD_END'].includes(record.subscription_status)&&record.paid_until>Math.floor(clock()/1000)&&record.current_period_end>Math.floor(clock()/1000);
  if(active) await db.prepare("UPDATE commerce_checkout_attempts SET status='paid',order_state='FULFILLED',updated_at=?2 WHERE checkout_attempt_id=?1 AND order_state NOT IN ('REFUNDED','PARTIALLY_REFUNDED')").bind(order.checkout_attempt_id,now).run();
  // Subscription rows are the temporal authority; entitlement projection uses
  // this paid interval on every account read, even without another webhook.
  return {...record,accessGranted:active};
}
export async function refundCommerceOrder(env,object){
  const db=dbFrom(env), id=typeof object.payment_intent==='string'?object.payment_intent:object.payment_intent?.id;
  const p=await db.prepare("SELECT * FROM commerce_purchases WHERE stripe_payment_intent_id=?1 AND customer_id IS NOT NULL").bind(id||'').first();
  if(!p) return null;
  const amount=Number(object.amount_refunded), now=new Date().toISOString();
  if(object.currency!=='myr'||!Number.isInteger(amount)||amount<0||amount>p.amount_minor) throw Object.assign(new Error('Refund mismatch.'),{status:422,code:'refund_mismatch'});
  await db.batch([
    db.prepare('UPDATE commerce_purchases SET refunded_amount_minor=MAX(refunded_amount_minor,?2),refunded_at=?3,updated_at=?3 WHERE purchase_id=?1').bind(p.purchase_id,amount,now),
    db.prepare(`UPDATE commerce_checkout_attempts SET order_state=CASE WHEN ?2>=amount_minor THEN 'REFUNDED' ELSE 'PARTIALLY_REFUNDED' END,review_required=1,updated_at=?3 WHERE checkout_attempt_id=?1 AND order_state<>'REFUNDED'`).bind(p.checkout_attempt_id,Math.max(p.refunded_amount_minor,amount),now)
  ]);
  // No blanket revocation policy for these successor products has been approved.
  return {orderId:p.checkout_attempt_id,reviewRequired:true};
}
export async function commerceAccountProjection(env,customerId,clock=Date.now){
  const db=dbFrom(env), time=Math.floor(clock()/1000);
  const [orders,entitlements,subscriptions,services]=await Promise.all([
    db.prepare(`SELECT checkout_attempt_id AS orderId,product_id AS productId,order_state AS state,amount_minor AS amountMinor,currency,review_required AS reviewRequired FROM commerce_checkout_attempts WHERE customer_id=?1 ORDER BY created_at DESC LIMIT 100`).bind(customerId).all(),
    db.prepare(`SELECT product_id AS productId,entitlement_code AS entitlementCode,entitlement_status AS status,watermark_status AS deliveryState FROM digital_entitlements WHERE customer_id=?1 AND entitlement_status='active' AND (expires_at IS NULL OR expires_at>?2)`).bind(customerId,nowIso(clock)).all(),
    db.prepare('SELECT subscription_status AS status,current_period_end AS currentPeriodEnd,paid_until AS paidUntil,cancel_at_period_end AS cancelAtPeriodEnd FROM commerce_subscriptions WHERE customer_id=?1').bind(customerId).all(),
    db.prepare('SELECT product_id AS productId,fulfillment_state AS state,duration_minutes AS durationMinutes,modality FROM commerce_service_fulfillments WHERE customer_id=?1').bind(customerId).all()
  ]);
  return {orders:orders.results,entitlements:entitlements.results,subscriptions:subscriptions.results.map(s=>({...s,entitlementCode:'PHIOS_MEMBERSHIP',accessGranted:['ACTIVE','CANCEL_AT_PERIOD_END'].includes(s.status)&&s.paidUntil>time&&s.currentPeriodEnd>time})),services:services.results};
}

function changes(result) {
  return Number(
    result?.meta?.changes ??
    result?.changes ??
    0
  );
}

function nowIso(clock) {
  return new Date(clock()).toISOString();
}

function addSeconds(iso, seconds) {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}

export async function ensureBookProduct(env, clock = Date.now) {
  const db = dbFrom(env);
  const now = nowIso(clock);
  await db.prepare(`
    INSERT INTO commerce_products (
      product_id, product_version, title, language, format, currency,
      amount_minor, source_object_key, source_sha256, active,
      created_at, updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1, ?10, ?10)
    ON CONFLICT(product_id) DO UPDATE SET
      product_version = excluded.product_version,
      title = excluded.title,
      language = excluded.language,
      format = excluded.format,
      currency = excluded.currency,
      amount_minor = excluded.amount_minor,
      source_object_key = excluded.source_object_key,
      source_sha256 = excluded.source_sha256,
      updated_at = excluded.updated_at
  `).bind(
    BOOK_ONE_PRODUCT.productId,
    BOOK_ONE_PRODUCT.productVersion,
    BOOK_ONE_PRODUCT.title,
    BOOK_ONE_PRODUCT.language,
    BOOK_ONE_PRODUCT.format,
    BOOK_ONE_PRODUCT.currency,
    BOOK_ONE_PRODUCT.amountMinor,
    resolveBookOneSourceKey(env),
    /^[0-9a-f]{64}$/i.test(String(env.BOOK_ONE_SOURCE_SHA256 || ''))
      ? String(env.BOOK_ONE_SOURCE_SHA256).toLowerCase()
      : null,
    now
  ).run();
}

export async function createCheckoutAttempt({
  env,
  checkoutAttemptId,
  idempotencyKeyHash,
  locale,
  clock = Date.now
}) {
  const db = dbFrom(env);
  await ensureBookProduct(env, clock);
  const now = nowIso(clock);
  await db.prepare(`
    INSERT OR IGNORE INTO commerce_checkout_attempts (
      checkout_attempt_id, product_id, idempotency_key_hash, status,
      locale, created_at, updated_at
    ) VALUES (?1, ?2, ?3, 'creating', ?4, ?5, ?5)
  `).bind(
    checkoutAttemptId,
    BOOK_ONE_PRODUCT.productId,
    idempotencyKeyHash,
    locale,
    now
  ).run();
  return db.prepare(`
    SELECT * FROM commerce_checkout_attempts
    WHERE idempotency_key_hash = ?1
    LIMIT 1
  `).bind(idempotencyKeyHash).first();
}

export async function attachStripeCheckout({
  env,
  checkoutAttemptId,
  session,
  clock = Date.now
}) {
  const now = nowIso(clock);
  await dbFrom(env).prepare(`
    UPDATE commerce_checkout_attempts
    SET stripe_checkout_session_id = ?2,
        stripe_checkout_url = ?3,
        status = 'payment_pending',
        expires_at = ?4,
        updated_at = ?5
    WHERE checkout_attempt_id = ?1
  `).bind(
    checkoutAttemptId,
    session.id,
    session.url,
    session.expires_at
      ? new Date(Number(session.expires_at) * 1000).toISOString()
      : null,
    now
  ).run();
}

export async function markCheckoutFailed(
  env,
  checkoutAttemptId,
  status = 'failed',
  clock = Date.now
) {
  const allowed = ['failed', 'expired', 'cancelled'];
  const normalized = allowed.includes(status) ? status : 'failed';
  await dbFrom(env).prepare(`
    UPDATE commerce_checkout_attempts
    SET status = ?2, updated_at = ?3
    WHERE checkout_attempt_id = ?1 AND status <> 'paid'
  `).bind(checkoutAttemptId, normalized, nowIso(clock)).run();
}

function buyerFromSession(session) {
  const email = String(
    session?.customer_details?.email ||
    session?.customer_email ||
    ''
  ).trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw Object.assign(new Error('Paid Checkout Session has no buyer email.'), {
      status: 422,
      code: 'buyer_email_missing'
    });
  }
  return {
    email,
    name: String(session?.customer_details?.name || '').trim().slice(0, 200)
  };
}

export function validatePaidBookSession(session) {
  const metadata = session?.metadata || {};
  const valid = (
    session?.mode === 'payment' &&
    session?.payment_status === 'paid' &&
    metadata.product_id === BOOK_ONE_PRODUCT.productId &&
    metadata.product_version === BOOK_ONE_PRODUCT.productVersion &&
    metadata.currency === BOOK_ONE_PRODUCT.currency &&
    Number(metadata.amount_minor) === BOOK_ONE_PRODUCT.amountMinor &&
    String(session?.currency || '').toUpperCase() === BOOK_ONE_PRODUCT.currency &&
    Number(session?.amount_total) === BOOK_ONE_PRODUCT.amountMinor &&
    metadata.checkout_attempt_id &&
    metadata.purchase_id
  );
  if (!valid) {
    throw Object.assign(new Error(
      'Checkout Session does not match the frozen Book I product contract.'
    ), {
      status: 422,
      code: 'checkout_product_contract_mismatch'
    });
  }
  return metadata;
}

export async function fulfillPaidBookSession({
  env,
  session,
  clock = Date.now
}) {
  const metadata = validatePaidBookSession(session);
  const buyer = buyerFromSession(session);
  const db = dbFrom(env);
  await ensureBookProduct(env, clock);
  const secret = String(env.BOOK_ACCESS_TOKEN_SECRET || '');
  const now = nowIso(clock);
  const emailHash = await subjectHash(buyer.email, secret);
  const encryptedEmail = await encryptSensitive(buyer.email, secret);
  const encryptedName = buyer.name
    ? await encryptSensitive(buyer.name, secret)
    : null;
  const entitlementId = `ent_${metadata.purchase_id.replace(/^pur_/, '')}`;
  const receiptId = `rcp_${metadata.purchase_id.replace(/^pur_/, '')}`;
  const receiptNumber =
    `PHI-${now.slice(0, 4)}-${metadata.purchase_id.slice(-10).toUpperCase()}`;
  const destinationKey =
    `private/books/book-one/watermarked/${metadata.purchase_id}.pdf`;
  const watermarkPayload = await encryptSensitive(JSON.stringify({
    purchaserEmail: buyer.email,
    purchaserName: buyer.name,
    receiptNumber,
    purchaseId: metadata.purchase_id,
    notice: 'Licensed to the named purchaser for personal use only.'
  }), secret);
  const receipt = {
    receiptNumber,
    issuedAt: now,
    merchant: 'PHI OS',
    productId: BOOK_ONE_PRODUCT.productId,
    productTitle: BOOK_ONE_PRODUCT.title,
    currency: BOOK_ONE_PRODUCT.currency,
    amountMinor: BOOK_ONE_PRODUCT.amountMinor,
    displayAmount: BOOK_ONE_PRODUCT.displayPrice,
    purchaseId: metadata.purchase_id,
    stripeCheckoutSessionId: session.id,
    paymentStatus: 'paid',
    delivery: 'purchaser-watermarked-pdf'
  };

  const statements = [
    db.prepare(`
      UPDATE commerce_checkout_attempts
      SET stripe_checkout_session_id = ?2,
          status = 'paid',
          updated_at = ?3
      WHERE checkout_attempt_id = ?1
    `).bind(metadata.checkout_attempt_id, session.id, now),
    db.prepare(`
      INSERT INTO commerce_purchases (
        purchase_id, product_id, checkout_attempt_id,
        stripe_checkout_session_id, stripe_payment_intent_id,
        stripe_customer_id, buyer_email_ciphertext, buyer_email_hash,
        buyer_name_ciphertext, currency, amount_minor, refunded_amount_minor,
        purchase_state, paid_at, created_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0,
        'purchased', ?12, ?12, ?12
      )
      ON CONFLICT(stripe_checkout_session_id) DO UPDATE SET
        stripe_payment_intent_id = COALESCE(
          commerce_purchases.stripe_payment_intent_id,
          excluded.stripe_payment_intent_id
        ),
        stripe_customer_id = COALESCE(
          commerce_purchases.stripe_customer_id,
          excluded.stripe_customer_id
        ),
        updated_at = excluded.updated_at
    `).bind(
      metadata.purchase_id,
      BOOK_ONE_PRODUCT.productId,
      metadata.checkout_attempt_id,
      session.id,
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null,
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id || null,
      encryptedEmail,
      emailHash,
      encryptedName,
      BOOK_ONE_PRODUCT.currency,
      BOOK_ONE_PRODUCT.amountMinor,
      now
    ),
    db.prepare(`
      INSERT OR IGNORE INTO digital_entitlements (
        entitlement_id, purchase_id, product_id, subject_hash,
        entitlement_status, watermark_status, granted_at,
        created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, 'active', 'pending', ?5, ?5, ?5)
    `).bind(
      entitlementId,
      metadata.purchase_id,
      BOOK_ONE_PRODUCT.productId,
      emailHash,
      now
    ),
    db.prepare(`
      INSERT OR IGNORE INTO commerce_receipts (
        receipt_id, receipt_number, purchase_id, receipt_json, issued_at
      ) VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(
      receiptId,
      receiptNumber,
      metadata.purchase_id,
      JSON.stringify(receipt),
      now
    ),
    db.prepare(`
      INSERT OR IGNORE INTO commerce_delivery_messages (
        delivery_message_id, purchase_id, channel, delivery_type,
        delivery_status, attempt_count, created_at, updated_at
      ) VALUES (
        ?1, ?2, 'email', 'receipt_and_book_delivery',
        'pending', 0, ?3, ?3
      )
    `).bind(
      `msg_${metadata.purchase_id.replace(/^pur_/, '')}`,
      metadata.purchase_id,
      now
    ),
    db.prepare(`
      INSERT OR IGNORE INTO commerce_watermark_jobs (
        watermark_job_id, entitlement_id, source_object_key,
        destination_object_key, watermark_payload_ciphertext,
        job_status, attempt_count, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, 'pending', 0, ?6, ?6)
    `).bind(
      `wm_${metadata.purchase_id.replace(/^pur_/, '')}`,
      entitlementId,
      resolveBookOneSourceKey(env),
      destinationKey,
      watermarkPayload,
      now
    )
  ];
  await db.batch(statements);
  return purchaseAccessBySession(env, session.id);
}

export async function purchaseAccessBySession(env, sessionId) {
  return dbFrom(env).prepare(`
    SELECT
      p.purchase_id,
      p.product_id,
      p.stripe_checkout_session_id,
      p.purchase_state,
      p.currency,
      p.amount_minor,
      p.paid_at,
      e.entitlement_id,
      e.entitlement_status,
      e.watermark_status,
      e.watermarked_object_key,
      r.receipt_number,
      r.receipt_json
    FROM commerce_purchases p
    LEFT JOIN digital_entitlements e ON e.purchase_id = p.purchase_id
    LEFT JOIN commerce_receipts r ON r.purchase_id = p.purchase_id
    WHERE p.stripe_checkout_session_id = ?1
    LIMIT 1
  `).bind(sessionId).first();
}

export async function purchaseAccessByClaims(env, claims) {
  return dbFrom(env).prepare(`
    SELECT
      p.purchase_id,
      p.product_id,
      p.purchase_state,
      p.currency,
      p.amount_minor,
      p.paid_at,
      e.entitlement_id,
      e.entitlement_status,
      e.watermark_status,
      e.watermarked_object_key,
      e.expires_at,
      r.receipt_number,
      r.receipt_json
    FROM digital_entitlements e
    JOIN commerce_purchases p ON p.purchase_id = e.purchase_id
    LEFT JOIN commerce_receipts r ON r.purchase_id = p.purchase_id
    WHERE e.entitlement_id = ?1
      AND p.purchase_id = ?2
    LIMIT 1
  `).bind(claims.entitlementId, claims.purchaseId).first();
}

export async function registerWebhookEvent({
  env,
  event,
  payloadSha256,
  clock = Date.now
}) {
  const db = dbFrom(env);
  const result = await db.prepare(`
    INSERT OR IGNORE INTO commerce_webhook_events (
      stripe_event_id, event_type, livemode, payload_sha256,
      processing_status, received_at
    ) VALUES (?1, ?2, ?3, ?4, 'received', ?5)
  `).bind(
    event.id,
    event.type,
    event.livemode ? 1 : 0,
    payloadSha256,
    nowIso(clock)
  ).run();
  if (changes(result) > 0) return true;

  const existing = await db.prepare(`
    SELECT payload_sha256, processing_status
    FROM commerce_webhook_events
    WHERE stripe_event_id = ?1
    LIMIT 1
  `).bind(event.id).first();
  if (!existing || existing.payload_sha256 !== payloadSha256) {
    throw Object.assign(new Error('Stripe event replay payload does not match.'), {
      status: 400,
      code: 'stripe_event_replay_mismatch'
    });
  }
  if (['processed', 'ignored', 'failed_terminal'].includes(existing.processing_status)) return false;

  const retry = await db.prepare(`
    UPDATE commerce_webhook_events
    SET processing_status = 'received',
        error_code = NULL,
        received_at = ?2,
        processed_at = NULL
    WHERE stripe_event_id = ?1
      AND processing_status IN ('failed', 'received', 'processing')
  `).bind(event.id, nowIso(clock)).run();
  return changes(retry) > 0;
}

export async function finishWebhookEvent({
  env,
  eventId,
  status,
  errorCode = null,
  clock = Date.now
}) {
  await dbFrom(env).prepare(`
    UPDATE commerce_webhook_events
    SET processing_status = ?2,
        error_code = ?3,
        processed_at = ?4
    WHERE stripe_event_id = ?1
  `).bind(eventId, status, errorCode, nowIso(clock)).run();
}

export async function applyRefund({
  env,
  paymentIntentId,
  refundedAmountMinor,
  clock = Date.now
}) {
  const db = dbFrom(env);
  const purchase = await db.prepare(`
    SELECT purchase_id, amount_minor, refunded_amount_minor, purchase_state
    FROM commerce_purchases
    WHERE stripe_payment_intent_id = ?1
    LIMIT 1
  `).bind(paymentIntentId).first();
  if (!purchase) return { matched: false };

  const amount = Math.max(
    Number(purchase.refunded_amount_minor || 0),
    Number(refundedAmountMinor || 0)
  );
  const fullyRefunded = amount >= Number(purchase.amount_minor);
  const now = nowIso(clock);
  const statements = [
    db.prepare(`
      UPDATE commerce_purchases
      SET refunded_amount_minor = ?2,
          purchase_state = CASE WHEN ?3 = 1 THEN 'refunded' ELSE purchase_state END,
          refunded_at = CASE WHEN ?3 = 1 THEN ?4 ELSE refunded_at END,
          updated_at = ?4
      WHERE purchase_id = ?1
    `).bind(purchase.purchase_id, amount, fullyRefunded ? 1 : 0, now)
  ];
  if (fullyRefunded) {
    statements.push(
      db.prepare(`
        UPDATE digital_entitlements
        SET entitlement_status = 'refunded',
            revoked_at = ?2,
            updated_at = ?2
        WHERE purchase_id = ?1
      `).bind(purchase.purchase_id, now),
      db.prepare(`
        UPDATE commerce_download_tokens
        SET revoked_at = ?2
        WHERE entitlement_id IN (
          SELECT entitlement_id FROM digital_entitlements WHERE purchase_id = ?1
        ) AND revoked_at IS NULL
      `).bind(purchase.purchase_id, now)
    );
  }
  await db.batch(statements);
  return { matched: true, fullyRefunded, purchaseId: purchase.purchase_id };
}

export async function issueDownloadToken({
  env,
  entitlementId,
  purpose = 'buyer_download',
  lifetimeSeconds = BOOK_ONE_PRODUCT.downloadTokenLifetimeSeconds,
  maxUses = BOOK_ONE_PRODUCT.downloadTokenMaxUses,
  clock = Date.now
}) {
  const rawToken = randomToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const tokenId = randomId('dlt_');
  const createdAt = nowIso(clock);
  const expiresAt = addSeconds(createdAt, lifetimeSeconds);
  await dbFrom(env).prepare(`
    INSERT INTO commerce_download_tokens (
      token_id, entitlement_id, token_hash, purpose, expires_at,
      max_uses, use_count, created_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)
  `).bind(
    tokenId,
    entitlementId,
    tokenHash,
    purpose,
    expiresAt,
    maxUses,
    createdAt
  ).run();
  return { rawToken, tokenId, expiresAt, maxUses };
}

export async function consumeDownloadToken({
  env,
  rawToken,
  clock = Date.now
}) {
  const db = dbFrom(env);
  const tokenHash = await sha256Hex(rawToken);
  const now = nowIso(clock);
  const authorization = await db.prepare(`
    SELECT
      t.token_id,
      t.entitlement_id,
      t.expires_at,
      t.max_uses,
      t.use_count,
      e.entitlement_status,
      e.watermark_status,
      e.watermarked_object_key,
      p.purchase_state
    FROM commerce_download_tokens t
    JOIN digital_entitlements e ON e.entitlement_id = t.entitlement_id
    JOIN commerce_purchases p ON p.purchase_id = e.purchase_id
    WHERE t.token_hash = ?1
      AND t.revoked_at IS NULL
      AND t.expires_at > ?2
      AND t.use_count < t.max_uses
      AND e.entitlement_status = 'active'
      AND e.watermark_status = 'ready'
      AND e.watermarked_object_key IS NOT NULL
      AND p.purchase_state = 'purchased'
    LIMIT 1
  `).bind(tokenHash, now).first();
  if (!authorization) return null;

  const result = await db.prepare(`
    UPDATE commerce_download_tokens
    SET use_count = use_count + 1,
        last_used_at = ?2
    WHERE token_id = ?1
      AND revoked_at IS NULL
      AND expires_at > ?2
      AND use_count < max_uses
  `).bind(authorization.token_id, now).run();
  return changes(result) > 0 ? authorization : null;
}

export async function recordDownload({
  env,
  authorization,
  requestFingerprint,
  clock = Date.now
}) {
  await dbFrom(env).prepare(`
    INSERT INTO commerce_download_events (
      download_event_id, entitlement_id, token_id, object_key,
      request_fingerprint, downloaded_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `).bind(
    randomId('dle_'),
    authorization.entitlement_id,
    authorization.token_id,
    authorization.watermarked_object_key,
    requestFingerprint,
    nowIso(clock)
  ).run();
}

export async function watermarkJobForPurchase(env, purchaseId) {
  return dbFrom(env).prepare(`
    SELECT
      j.watermark_job_id,
      j.entitlement_id,
      j.source_object_key,
      j.destination_object_key,
      j.watermark_payload_ciphertext,
      j.job_status,
      j.attempt_count
    FROM commerce_watermark_jobs j
    JOIN digital_entitlements e ON e.entitlement_id = j.entitlement_id
    WHERE e.purchase_id = ?1
    LIMIT 1
  `).bind(purchaseId).first();
}

export async function watermarkJobById(env, watermarkJobId) {
  return dbFrom(env).prepare(`
    SELECT
      j.watermark_job_id,
      j.entitlement_id,
      j.source_object_key,
      j.destination_object_key,
      j.watermark_payload_ciphertext,
      j.job_status,
      j.attempt_count,
      e.purchase_id
    FROM commerce_watermark_jobs j
    JOIN digital_entitlements e ON e.entitlement_id = j.entitlement_id
    WHERE j.watermark_job_id = ?1
    LIMIT 1
  `).bind(watermarkJobId).first();
}

export async function deliveryRecordForPurchase(env, purchaseId) {
  return dbFrom(env).prepare(`
    SELECT
      p.purchase_id,
      p.buyer_email_ciphertext,
      p.buyer_name_ciphertext,
      p.purchase_state,
      e.entitlement_id,
      e.entitlement_status,
      e.watermark_status,
      e.watermarked_object_key,
      r.receipt_number,
      r.receipt_json,
      m.delivery_status,
      m.attempt_count
    FROM commerce_purchases p
    JOIN digital_entitlements e ON e.purchase_id = p.purchase_id
    JOIN commerce_receipts r ON r.purchase_id = p.purchase_id
    JOIN commerce_delivery_messages m ON m.purchase_id = p.purchase_id
    WHERE p.purchase_id = ?1
      AND m.delivery_type = 'receipt_and_book_delivery'
    LIMIT 1
  `).bind(purchaseId).first();
}

export async function markWatermarkProcessing(
  env,
  watermarkJobId,
  clock = Date.now
) {
  const db = dbFrom(env);
  const now = nowIso(clock);
  await db.batch([
    db.prepare(`
      UPDATE commerce_watermark_jobs
      SET job_status = 'processing',
          attempt_count = attempt_count + 1,
          started_at = COALESCE(started_at, ?2),
          updated_at = ?2
      WHERE watermark_job_id = ?1
        AND job_status IN ('pending', 'failed')
    `).bind(watermarkJobId, now),
    db.prepare(`
      UPDATE digital_entitlements
      SET watermark_status = 'processing', updated_at = ?2
      WHERE entitlement_id = (
        SELECT entitlement_id FROM commerce_watermark_jobs
        WHERE watermark_job_id = ?1
      )
    `).bind(watermarkJobId, now)
  ]);
}

export async function markWatermarkReady({
  env,
  watermarkJobId,
  destinationObjectKey,
  clock = Date.now
}) {
  const db = dbFrom(env);
  const now = nowIso(clock);
  await db.batch([
    db.prepare(`
      UPDATE commerce_watermark_jobs
      SET job_status = 'completed',
          destination_object_key = ?2,
          completed_at = ?3,
          updated_at = ?3,
          last_error_code = NULL
      WHERE watermark_job_id = ?1
    `).bind(watermarkJobId, destinationObjectKey, now),
    db.prepare(`
      UPDATE digital_entitlements
      SET watermark_status = 'ready',
          watermarked_object_key = ?2,
          updated_at = ?3
      WHERE entitlement_id = (
        SELECT entitlement_id FROM commerce_watermark_jobs
        WHERE watermark_job_id = ?1
      )
    `).bind(watermarkJobId, destinationObjectKey, now),
    db.prepare(`UPDATE commerce_checkout_attempts SET order_state='FULFILLED',updated_at=?2 WHERE checkout_attempt_id IN (SELECT p.checkout_attempt_id FROM commerce_purchases p JOIN digital_entitlements e ON e.purchase_id=p.purchase_id JOIN commerce_watermark_jobs j ON j.entitlement_id=e.entitlement_id WHERE j.watermark_job_id=?1 AND p.customer_id IS NOT NULL) AND order_state='FULFILLMENT_PENDING'`).bind(watermarkJobId,now)
  ]);
}

export async function markWatermarkFailed({
  env,
  watermarkJobId,
  errorCode,
  clock = Date.now
}) {
  const db = dbFrom(env);
  const now = nowIso(clock);
  await db.batch([
    db.prepare(`
      UPDATE commerce_watermark_jobs
      SET job_status = 'failed',
          last_error_code = ?2,
          updated_at = ?3
      WHERE watermark_job_id = ?1
    `).bind(watermarkJobId, String(errorCode || 'watermark_failed'), now),
    db.prepare(`
      UPDATE digital_entitlements
      SET watermark_status = 'failed', updated_at = ?2
      WHERE entitlement_id = (
        SELECT entitlement_id FROM commerce_watermark_jobs
        WHERE watermark_job_id = ?1
      )
    `).bind(watermarkJobId, now)
  ]);
}

export async function updateDeliveryStatus({
  env,
  purchaseId,
  status,
  providerMessageId = null,
  errorCode = null,
  clock = Date.now
}) {
  const now = nowIso(clock);
  await dbFrom(env).prepare(`
    UPDATE commerce_delivery_messages
    SET delivery_status = ?2,
        provider_message_id = ?3,
        attempt_count = attempt_count + 1,
        last_error_code = ?4,
        sent_at = CASE WHEN ?2 = 'sent' THEN ?5 ELSE sent_at END,
        updated_at = ?5
    WHERE purchase_id = ?1
      AND delivery_type = 'receipt_and_book_delivery'
  `).bind(
    purchaseId,
    status,
    providerMessageId,
    errorCode,
    now
  ).run();
}
