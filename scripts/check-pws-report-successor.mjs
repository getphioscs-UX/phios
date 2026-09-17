import assert from 'node:assert/strict';
import fs from 'node:fs';
import Ajv from 'ajv';
import {REPORT_COMMERCE_CONTRACT as contract,mapReportEntitlements,eligibleReportIds,REPORT_PRODUCT_DEFINITIONS} from '../functions/pws/commercial/report-successor-contract.js';
import {commercialRuntime,createCommercialRuntime,DEFAULT_COMMERCIAL_DEFINITIONS} from '../functions/pws/commercial/commercial-runtime.js';
import {createProductRuntime,productRuntime} from '../functions/pws/product/product-runtime.js';
const root='content/pws/commercial/report-successor-r1';
const validate=new Ajv({strict:false}).compile(JSON.parse(fs.readFileSync(`${root}/contract.schema.json`)));
assert(validate(contract),JSON.stringify(validate.errors));
const expected={BAZI_FULL_REPORT:3900,ZIWEI_FULL_REPORT:3900,ASTROLOGY_FULL_REPORT:3900,PROFILE_FULL_REPORT:3900,NUMEROLOGY_FULL_REPORT:3900,ECR_FULL_REPORT:3900,HD_FULL_REPORT:12900,CROSS_FULL_REPORT:29900,BUNDLE_2:6900,BUNDLE_3:9900,BUNDLE_5PLUS:15900};
assert.deepEqual(Object.fromEntries(contract.products.map(p=>[p.productId,p.amountMinor])),expected);
const catalog=commercialRuntime.projectReportCatalog();assert.equal(catalog.products.length,11);
for(const p of catalog.products){assert.equal(p.price.amountMinor,expected[p.productId]);assert.equal(p.price.currency,'MYR');assert.equal(p.checkoutEnabled,false);assert.equal(productRuntime.resolveProduct(p.productCode).state,'draft');assert.throws(()=>commercialRuntime.createOrder({offer_code:p.offerCode,customer_id:'synthetic'}));}
let validSelections=0,rejectedSelections=0;
const eligible=eligibleReportIds('BUNDLE_2');assert.equal(eligible.length,6);assert(!eligible.includes('HD_FULL_REPORT'));assert(!eligible.includes('CROSS_FULL_REPORT'));
for(const bundle of ['BUNDLE_2','BUNDLE_3','BUNDLE_5PLUS'])for(let mask=0;mask<64;mask++){
 const ids=eligible.filter((_,i)=>mask&(1<<i));const valid=bundle==='BUNDLE_2'?ids.length===2:bundle==='BUNDLE_3'?ids.length===3:ids.length>=5;
 if(valid){const q=commercialRuntime.previewReportSelection(bundle,ids),plan=q.entitlementPlan;assert.deepEqual(plan.entitlements.map(e=>e.productId),ids);assert(plan.entitlements.every(e=>e.scope==='INDEPENDENT_SINGLE_METHOD_REPORT'));assert(!plan.grantsEntitlement&&!plan.createsCrossReading&&!q.createsOrder);validSelections++;}
 else{assert.throws(()=>mapReportEntitlements(bundle,ids),/SELECTION_COUNT/);rejectedSelections++;}
}
for(const bad of [[eligible[0],eligible[0]],[eligible[0],'HD_FULL_REPORT'],[eligible[0],'CROSS_FULL_REPORT'],[eligible[0],'UNKNOWN']])assert.throws(()=>mapReportEntitlements('BUNDLE_2',bad));
assert.throws(()=>mapReportEntitlements('BUNDLE_2',{}));assert.throws(()=>mapReportEntitlements('UNKNOWN'));
for(const p of contract.products.filter(p=>p.kind!=='BUNDLE')){const plan=mapReportEntitlements(p.productId);assert.deepEqual(plan.entitlements.map(e=>e.productId),[p.productId]);assert.equal(plan.entitlements[0].scope,p.kind==='SYNTHESIS'?'CROSS_SYNTHESIS':'INDEPENDENT_SINGLE_METHOD_REPORT');assert.throws(()=>mapReportEntitlements(p.productId,[eligible[0]]));}
// Even locally forcing draft records active cannot bypass the production gate.
const activatedProducts=createProductRuntime({products:REPORT_PRODUCT_DEFINITIONS.map(p=>({...structuredClone(p),state:'active'}))});
const definitions={...structuredClone(DEFAULT_COMMERCIAL_DEFINITIONS),offers:DEFAULT_COMMERCIAL_DEFINITIONS.offers.filter(o=>contract.products.some(p=>p.productCode===o.product_code)).map(o=>({...o,status:'active'})),prices:DEFAULT_COMMERCIAL_DEFINITIONS.prices.map(p=>({...p,status:'active'}))};
const forced=createCommercialRuntime({productRuntime:activatedProducts,definitions});assert.throws(()=>forced.createOrder({offer_code:'bundle-2-myr',customer_id:'synthetic',selected_product_ids:eligible.slice(0,2)}),e=>e.code==='PWS_REPORT_PRODUCTION_GATE_CLOSED');
const result={status:'PASS',owner:'EXISTING_PWS_PRODUCT_AND_COMMERCIAL_RUNTIME',products:11,validBundleSelections:validSelections,rejectedBundleCounts:rejectedSelections,premiumAndDuplicateRejection:true,crossEntitlementIndependent:true,productionPaymentEnabled:false,schemaGap:'NONE: existing knowledge_access configuration supports selection-policy references',entitlementGrantTested:false};
fs.writeFileSync(`${root}/registry.json`,JSON.stringify(contract,null,2)+'\n');fs.writeFileSync(`${root}/machine-results.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
