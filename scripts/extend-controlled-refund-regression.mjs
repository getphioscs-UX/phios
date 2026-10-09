import fs from 'node:fs';
let path='scripts/check-controlled-purchase-integration.mjs',s=fs.readFileSync(path,'utf8');
if(!s.includes('refund cannot regress')){
 s="import {refundCommerceOrder} from '../functions/commerce/book-commerce-store.js';\n"+s;
 s=s.replace('const result={result:',"await assert.rejects(()=>refundCommerceOrder(env,{payment_intent:'pi_controlled',currency:'myr',amount_refunded:501}),{code:'refund_mismatch'});await refundCommerceOrder(env,{payment_intent:'pi_controlled',currency:'myr',amount_refunded:250});assert.equal(sql.prepare('SELECT order_state FROM commerce_checkout_attempts').get().order_state,'PARTIALLY_REFUNDED');await refundCommerceOrder(env,{payment_intent:'pi_controlled',currency:'myr',amount_refunded:500});assert.equal(sql.prepare('SELECT order_state FROM commerce_checkout_attempts').get().order_state,'REFUNDED');await refundCommerceOrder(env,{payment_intent:'pi_controlled',currency:'myr',amount_refunded:250});assert.equal(sql.prepare('SELECT refunded_amount_minor FROM commerce_purchases').get().refunded_amount_minor,500);const result={result:");
 s=s.replace("'duplicate webhook one purchase'","'duplicate webhook one purchase','over-net refund denied','partial net refund','full net refund','refund cannot regress'");fs.writeFileSync(path,s);
}
path='scripts/build-live-customer-master.mjs';s=fs.readFileSync(path,'utf8').replace('W00–W32 与38业务域逐项台账','历史33项补充盘点（非执行authority）').replace('Latest Tarot decision is RM9','Latest Tarot decision is RM19 bilingual with four contextual followups');fs.writeFileSync(path,s);
