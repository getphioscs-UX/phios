import fs from 'node:fs';
import assert from 'node:assert/strict';
import {STRIPE_PRODUCT_REGISTRY,assertReportPriceParity} from '../functions/pws/commercial/stripe-product-registry.js';
import {COMMERCE_ECONOMICS_VERSION,COMMERCE_ECONOMICS} from '../functions/pws/commercial/commerce-economics-policy.js';
import {commerceApi} from '../functions/commerce/commerce-stripe-api.js';
const policies=Object.values(COMMERCE_ECONOMICS);
assertReportPriceParity();
const response=await commerceApi({request:new Request('https://phios.test/api/commerce-catalog'),env:{}},'catalog');
assert.equal(response.status,200);const catalog=await response.json();
const mappings=JSON.parse(fs.readFileSync('docs/commerce/economics-20261009/stripe-live-mappings.json'));
const products=JSON.parse(fs.readFileSync('docs/commerce/economics-20261009/stripe-product-readback.json')).accounts;
const checks=[];
for(const policy of policies){
 const id=policy.productId,p=STRIPE_PRODUCT_REGISTRY.find(x=>x.productId===id),publicRow=catalog.products.find(x=>x.productId===id);
 assert.equal(p.amountMinor,policy.amountMinor,id);assert.equal(publicRow.amountMinor,p.amountMinor,id);
 assert.equal(p.livePriceId,mappings.products[id].priceId,id);
 for(const mode of ['qa','live']){const row=products[mode].products.find(x=>x.id===p[mode+'ProductId']);assert(row?.active,id);assert.equal(row.default_price,p[mode+'PriceId'],id);assert.equal(row.metadata.pricing_version,COMMERCE_ECONOMICS_VERSION,id);}
 checks.push({productId:id,amountMinor:p.amountMinor,source:'PASS',stripeRecordedReadback:'PASS'});
}
assert(!catalog.products.some(p=>p.productId==='COM-REPORT-BUNDLE-5PLUS'));
const out={version:COMMERCE_ECONOMICS_VERSION,checks,source:'PASS',stripeCatalogRecordedReadback:'PASS',deployed:'NOT_DEPLOYED',liveCustomer:'NOT_RUN',modelCalls:0,payments:0,scope:'Local generated catalog and recorded authenticated Stripe readback; no live website or report-delivery claim.'};
fs.writeFileSync('docs/commerce/economics-20261009/canonical-check.json',JSON.stringify(out,null,2)+'\n');
console.log('PASS current canonical catalog and 14 Stripe product defaults; DEPLOYED/LIVE CUSTOMER remain unverified.');
