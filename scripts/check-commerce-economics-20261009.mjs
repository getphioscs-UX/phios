import assert from 'node:assert/strict';
import fs from 'node:fs';
import {COMMERCE_ECONOMICS,reportGenerationCeiling} from '../functions/pws/commercial/commerce-economics-policy.js';
import {STRIPE_PRODUCT_REGISTRY,commerceProduct,commerceSelection,standardBundleProducts,commerceOrderProduct,assertReportPriceParity} from '../functions/pws/commercial/stripe-product-registry.js';
import {quoteReportPresentation} from '../functions/pws/commercial/report-successor-contract.js';
import {commerceReportQuote,validateOrderReportPresentation} from '../functions/commerce/report-presentation.js';
import {createCommerceCheckoutSession,verifyStripeQaAccount} from '../functions/commerce/stripe-client.js';
import {commerceApi} from '../functions/commerce/commerce-stripe-api.js';
import {createReportBudget,reserveReportCall,settleReportCall,markReportBudgetDelivered,runBudgetedReportCall} from '../functions/personal-reading/report-generation-budget.js';
import {createPaidReportTransport} from '../functions/personal-reading/paid-report-transport.js';
import {assertReportProviderAccess} from '../functions/personal-reading/report-provider-access.js';
import {assertBaziOwnerCallBudget} from '../functions/personal-reading/deep-manuscript/bazi-owner-cost-contract.js';
const checks=[];const test=async(name,fn)=>{await fn();checks.push({name,status:'PASS'});};
const expected={BAZI:[59,4],ZIWEI:[59,3],ASTROLOGY:[59,3],PROFILE:[129,6],HD:[129,5],ECR:[129,6],NUMEROLOGY:[39,2],CROSS:[299,10],FINANCIAL:[159,7]};
await test('Exact owner MYR price / USD cap for all products and both environments',()=>{
 for(const [name,[myr,usd]] of Object.entries(expected)){const id=`COM-REPORT-${name}-FULL`;assert.equal(COMMERCE_ECONOMICS[id].amountMinor,myr*100);assert.equal(COMMERCE_ECONOMICS[id].providerCapUsd,usd);}
 for(const p of Object.values(COMMERCE_ECONOMICS)){const row=commerceProduct(p.productId);assert.equal(row.amountMinor,p.amountMinor);assert(row.qaPriceId&&row.livePriceId&&row.qaProductId&&row.liveProductId);}
 assertReportPriceParity();
});
await test('Bundle 5+ is rejected; 2/3 only BaZi, Zi Wei, Astrology',()=>{
 assert.throws(()=>commerceProduct('COM-REPORT-BUNDLE-5PLUS'));
 assert.deepEqual(standardBundleProducts(),['COM-REPORT-BAZI-FULL','COM-REPORT-ZIWEI-FULL','COM-REPORT-ASTROLOGY-FULL']);
 assert.throws(()=>commerceSelection('COM-REPORT-BUNDLE-2',['COM-REPORT-BAZI-FULL','COM-REPORT-ECR-FULL']));
 assert.throws(()=>commerceSelection('COM-REPORT-BUNDLE-2',['COM-REPORT-BAZI-FULL','COM-REPORT-BAZI-FULL']));
});
await test('Bundle bilingual surcharge is exactly once; totals RM109/RM159',()=>{
 const s=['BAZI_FULL_REPORT','ZIWEI_FULL_REPORT','ASTROLOGY_FULL_REPORT'];
 for(const [id,n,total]of [['BUNDLE_2',2,10900],['BUNDLE_3',3,15900]]){const q=quoteReportPresentation(id,{reportLanguageMode:'BILINGUAL',reportLocale:'bilingual'},s.slice(0,n));assert.equal(q.surchargeAmountMinor,1000);assert.equal(q.amountMinor,total);}
});
await test('Five bilingual-only products reject single locale and never add surcharge',()=>{
 for(const id of ['COM-READING-TAROT-FULL','COM-READING-ICHING-FULL','COM-REPORT-FINANCIAL-FULL','COM-WILL-WRITING','COM-REPORT-PROFILE-FULL']){
  const p=commerceProduct(id),q=commerceReportQuote(p,{reportLanguageMode:'BILINGUAL',reportLocale:'bilingual'});assert.equal(q.surchargeAmountMinor,0);assert.equal(q.amountMinor,p.amountMinor);assert.throws(()=>commerceReportQuote(p,{reportLanguageMode:'SINGLE',reportLocale:'en'}),/BILINGUAL_ONLY/);
 }
});
await test('Old paid order price and locale preserved; historical Bundle5 readable',()=>{
 const old={product_id:'COM-REPORT-BAZI-FULL',qa_price_id:'price_1UGr3JBEKXJyHMkK8gOJBTe7',amount_minor:4900,selected_products_json:'[]',context_json:JSON.stringify({reportPresentation:{reportLanguageMode:'BILINGUAL',reportLocale:'bilingual',productId:'BAZI_FULL_REPORT',currency:'MYR',baseAmountMinor:3900,surchargeAmountMinor:1000,amountMinor:4900,pricingVersion:'REPORT-LANGUAGE-R3-2026-09-23',modifierRule:'INDIVIDUAL_BILINGUAL',selectedProductIds:['BAZI_FULL_REPORT']}})};
 assert.equal(commerceOrderProduct(old).amountMinor,3900);assert.equal(validateOrderReportPresentation(commerceOrderProduct(old),old).amountMinor,4900);
 assert.equal(commerceOrderProduct({product_id:'COM-REPORT-BUNDLE-5PLUS',qa_price_id:'price_1UGr3eBEKXJyHMkKRDancawo'}).amountMinor,15900);
});
await test('Catalog excludes retired/private products and emits only valid language options',async()=>{
 const response=await commerceApi({request:new Request('https://getphios.com/api/commerce-catalog'),env:{}},'catalog'),body=await response.json();assert.equal(response.status,200);
 assert(!body.products.some(p=>p.productId==='COM-REPORT-BUNDLE-5PLUS'||p.productId==='COM-BOOK-07'));
 assert.equal(body.products.find(p=>p.productId==='COM-READING-TAROT-FULL').reportPresentationOptions.length,1);
 assert.equal(body.products.find(p=>p.productId==='COM-REPORT-PROFILE-FULL').reportPurchaseState,'AVAILABLE');
});
await test('LIVE checkout uses live price with fixed bilingual zero surcharge; gate stays closed by default',async()=>{
 const p=commerceProduct('COM-REPORT-PROFILE-FULL'),q=commerceReportQuote(p,{reportLanguageMode:'BILINGUAL',reportLocale:'bilingual'});
 const order={checkout_attempt_id:'ord_abcdef1234567890',customer_id:'owner',selected_products_json:'[]',amount_minor:12900,context_json:JSON.stringify({reportPresentation:q})};let sent;
 const env={STRIPE_ENVIRONMENT:'LIVE',STRIPE_SECRET_KEY:'rk_live_EXPLICIT_FAKE_FIXTURE',PHIOS_COMMERCE_LIVE_ENABLED:'true'};
 const fetcher=async(url,o)=>{sent=new URLSearchParams(o.body);return Response.json({id:'cs_live_SYNTHETIC',livemode:true});};
 await createCommerceCheckoutSession({env,product:p,order,customerId:'cus_SYNTHETIC',origin:'https://getphios.com',locale:'en',fetcher});
 assert.equal(sent.get('line_items[0][price]'),p.livePriceId);assert.equal(sent.get('metadata[environment]'),'LIVE');assert(!sent.has('line_items[1][quantity]'));
 await assert.rejects(()=>createCommerceCheckoutSession({env:{...env,PHIOS_COMMERCE_LIVE_ENABLED:'false'},product:p,order,fetcher}),/not admitted/);
 await assert.rejects(()=>verifyStripeQaAccount(env,async()=>Response.json({id:'acct_WRONG'})),/Wrong Stripe account/);
});
await test('Free tier and missing server-paid context stop before any transport',()=>{
 assert.throws(()=>assertReportProviderAccess({env:{REPORT_ACCESS_TIER:'FREE',REPORT_PAID_GENERATION_CONTEXT:{purpose:'PAID_UNLOCKED_REPORT',invokeBudgeted(){}}}}),/FREE_REPORT_PROVIDER_FORBIDDEN/);
 assert.throws(()=>assertReportProviderAccess({env:{}}),/PAID_REPORT_DURABLE_BUDGET_CONTEXT_REQUIRED/);
});
const binding={productId:'COM-REPORT-BAZI-FULL',orderId:'paid-order',reportId:'report-1',ownerAccountId:'owner',verifiedPayment:true,authorityDigest:'authority'};
await test('Full report + repairs share cap and reserve budget for four answers',()=>{
 const l=createReportBudget(binding);reserveReportCall(l,{requestId:'p',phase:'PRIMARY',projectedMaximumUsd:3.2});settleReportCall(l,'p',3.2);
 reserveReportCall(l,{requestId:'repair',phase:'REPAIR',repairUnit:'S04/en',projectedMaximumUsd:.2});settleReportCall(l,'repair',.2);
 assert.throws(()=>reserveReportCall(l,{requestId:'bad',phase:'REPAIR',repairUnit:'S05/en',projectedMaximumUsd:.3}),/GENERATION_AND_REPAIR_BUDGET_EXCEEDED/);
 markReportBudgetDelivered(l,{generationComplete:true,publicationComplete:true});
 for(let i=1;i<=4;i++){reserveReportCall(l,{requestId:`q${i}`,phase:'FOLLOWUP',projectedMaximumUsd:.1});settleReportCall(l,`q${i}`,.1);l.requests[`q${i}`].output={answer:'Complete test answer.'};}
 assert.throws(()=>reserveReportCall(l,{requestId:'q5',phase:'FOLLOWUP',projectedMaximumUsd:.01}),/FOUR_FOLLOWUPS_EXHAUSTED/);
 assert(reserveReportCall(l,{requestId:'q1',phase:'FOLLOWUP',projectedMaximumUsd:.1}).replay);
});
await test('All method budgets reject unknown usage and duplicate repair; exact hard cap owner',()=>{
 for(const p of Object.values(COMMERCE_ECONOMICS).filter(p=>p.providerCapUsd!==null)){
  const l=createReportBudget({...binding,productId:p.productId});assert.throws(()=>reserveReportCall(l,{requestId:'huge',phase:'PRIMARY',projectedMaximumUsd:p.providerCapUsd}),/GENERATION_AND_REPAIR_BUDGET_EXCEEDED/);
  reserveReportCall(l,{requestId:'p',phase:'PRIMARY',projectedMaximumUsd:.01});settleReportCall(l,'p',null);assert.throws(()=>reserveReportCall(l,{requestId:'r',phase:'PRIMARY',projectedMaximumUsd:0}),/RECONCILIATION_REQUIRED/);
 }
 const l=createReportBudget(binding);reserveReportCall(l,{requestId:'repair',phase:'REPAIR',repairUnit:'S04/en',projectedMaximumUsd:.1});settleReportCall(l,'repair',.1);
 assert.throws(()=>reserveReportCall(l,{requestId:'repeat',phase:'REPAIR',repairUnit:'S04/en',projectedMaximumUsd:.1}),/REPEATED_AUTOMATIC_REPAIR_DENIED/);
});
await test('Atomic durable request replay produces one fixture invocation; cross-owner denied',async()=>{
 const map=new Map();let calls=0;const store={async get(k){return structuredClone(map.get(k));},async put(k,v){map.set(k,structuredClone(v));},async putIfAbsent(){},async withLock(k,fn){return fn();}};
 const opts={store,key:'fixture-budget',binding,request:{requestId:'once',phase:'PRIMARY',projectedMaximumUsd:.2},invoke:async()=>{calls++;return {usage:.1,output:'complete'};},usageCost:r=>r?.usage??null,validateOutput:r=>r.output};
 await runBudgetedReportCall(opts);const second=await runBudgetedReportCall(opts);assert.equal(calls,1);assert.equal(second.providerCalls,0);
 await assert.rejects(()=>runBudgetedReportCall({...opts,binding:{...binding,ownerAccountId:'other'}}),/OWNER_MISMATCH/);
});
await test('Unknown provider usage holds its reservation and returns no output',async()=>{
 const map=new Map();let calls=0;const store={async get(k){return structuredClone(map.get(k));},async put(k,v){map.set(k,structuredClone(v));},async putIfAbsent(){},async withLock(k,fn){return fn();}};
 const opts={store,key:'unknown-budget',binding,request:{requestId:'unknown',phase:'PRIMARY',projectedMaximumUsd:.2},invoke:async()=>{calls++;return {};},usageCost:()=>null,validateOutput:()=>{throw Error('MUST_NOT_VALIDATE_UNKNOWN_COST');}};
 await assert.rejects(()=>runBudgetedReportCall(opts),/REPORT_USAGE_RECONCILIATION_REQUIRED/);
 await assert.rejects(()=>runBudgetedReportCall({...opts,request:{...opts.request,requestId:'retry'}}),/REPORT_USAGE_RECONCILIATION_REQUIRED/);
 assert.equal(calls,1);assert.equal(map.get('unknown-budget').requests.unknown.state,'UNKNOWN');
});
await test('Paid transport requires verified rates and domain validation before counting an answer',async()=>{
 const map=new Map();const store={async get(k){return structuredClone(map.get(k));},async put(k,v){map.set(k,structuredClone(v));},async putIfAbsent(){},async withLock(k,fn){return fn();}};
 const model={pricingVerified:true,inputPricePerMillion:1,cachedInputPricePerMillion:.1,outputPricePerMillion:1};
 const paidBinding={...binding,purchaseId:'purchase'};const productCostAuthority={ownerAccountId:binding.ownerAccountId,purchaseId:'purchase',productId:binding.productId,reserve:async()=>({newReservation:true}),settle:async()=>{}};
 const args={store,key:'transport',binding:paidBinding,productCostAuthority,request:{requestId:'answer',phase:'PRIMARY',projectedMaximumUsd:.01},model,validateProviderOutput:async()=>{throw Error('INVALID_METHOD_NARRATIVE');}};
 assert.throws(()=>createPaidReportTransport({...args,model:{...model,pricingVerified:false}}),/VERIFIED_MODEL_PRICING_REQUIRED/);
 assert.throws(()=>createPaidReportTransport({...args,validateProviderOutput:null}),/DOMAIN_VALIDATOR_REQUIRED/);
 const transport=createPaidReportTransport(args);
 await assert.rejects(()=>transport.invokeBudgeted(async()=>Response.json({usage:{input_tokens:10,output_tokens:10},output:'invalid'})),/INVALID_METHOD_NARRATIVE/);
 assert.equal(map.get('transport').requests.answer.state,'RECORDED');assert.equal(map.get('transport').requests.answer.output,undefined);
});
await test('LIVE catalog cannot offer checkout for unbound products; service appointments retained',async()=>{
 const result=await commerceApi({request:new Request('https://phios.test/api/commerce-catalog'),env:{STRIPE_ENVIRONMENT:'LIVE',PHIOS_COMMERCE_LIVE_ENABLED:'true',STRIPE_SECRET_KEY:'sk_live_fixture'}},'catalog');
 const body=await result.json();assert.equal(body.products.find(p=>p.productId==='COM-REPORT-BAZI-FULL').checkoutAvailable,true);
 const appointment=body.products.find(p=>p.productId==='COM-SERVICE-FINANCIAL-CONSULTATION');assert(appointment);assert.equal(appointment.checkoutAvailable,false);
});
await test('BaZi permits professional USD3.27 plan and counts repair against same USD4 lifecycle',()=>{
 assert.doesNotThrow(()=>assertBaziOwnerCallBudget({checkpoint:{ledger:[]},callType:'NORMAL',projectedMaximumCostUSD:3.27}));
 assert.throws(()=>assertBaziOwnerCallBudget({checkpoint:{ledger:[{callType:'STANDARD_RECOVERY',cost:3.5,usageStatus:'RECORDED'}]},callType:'NORMAL',projectedMaximumCostUSD:.2}),/COST_HARD_STOP/);
 assert.equal(reportGenerationCeiling('BZR'),3.6);
});
fs.mkdirSync('docs/commerce/economics-20261009',{recursive:true});fs.writeFileSync('docs/commerce/economics-20261009/source-checks.json',JSON.stringify({version:'PHIOS-COMMERCE-2026-10-09',checks,providerCalls:0,providerCostUsd:0,realPayments:0,SOURCE:'TARGETED_PASS',DEPLOYED:'NOT_RUN',LIVE_CUSTOMER:'NOT_RUN'},null,2)+'\n');
console.log(`PASS ${checks.length} commerce / budget groups; model calls=0, payments=0; deployed/live customer not tested.`);
