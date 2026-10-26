import assert from 'node:assert/strict';
import {VISUAL_REPORT_PRODUCTS,VISUAL_REPORT_BUNDLES} from '../functions/canonical-presentation-runtime/visual-report-registry.js';
import {commercialRuntime} from '../functions/pws/commercial/commercial-runtime.js';
import {resolveReportProduct} from '../functions/pws/commercial/report-successor-contract.js';
import {commerceProduct} from '../functions/pws/commercial/stripe-product-registry.js';

const catalog=commercialRuntime.projectReportCatalog();
assert.equal(VISUAL_REPORT_PRODUCTS.length,8);
for(const row of VISUAL_REPORT_PRODUCTS){
  assert.ok(Number.isFinite(row.targetMyr)&&row.targetMyr>0,row.productId);
  assert.equal(typeof row.currency,'string');
  assert.ok(['CURRENT_PRIMARY','LEGACY_READABLE_CONTRACT'].includes(row.commerceProjection),row.productId);
  const primary=catalog.products.find(p=>p.productId===row.productId),contract=resolveReportProduct(row.productId);
  assert.equal(row.commerceProjection,primary?'CURRENT_PRIMARY':'LEGACY_READABLE_CONTRACT',row.productId);
  assert.equal(row.targetMyr,(primary?.price?.amountMinor??contract.amountMinor)/100,row.productId);
  assert.equal(row.currency,primary?.price?.currency??contract.currency,row.productId);
  assert.equal(row.commerceBinding,catalog.contractId);
  assert.equal(row.customerPublishable,false);
}
const profile=VISUAL_REPORT_PRODUCTS.find(x=>x.methodId==='PROFILE');
assert.equal(profile.productId,'PROFILE_FULL_REPORT');
assert.equal(profile.commerceProjection,'LEGACY_READABLE_CONTRACT');
assert.equal(resolveReportProduct(profile.productId).newPrimaryPromotion,false);
assert.equal(resolveReportProduct(profile.productId).newPurchaseDefault,false);
assert(!catalog.products.some(p=>p.productId===profile.productId));
assert.equal(commerceProduct('COM-REPORT-PROFILE-FULL').commercialState,'LEGACY_HISTORY_ONLY');
assert.equal(commerceProduct('COM-REPORT-PROFILE-FULL').checkoutBlockedReason,'PERSONAL_EVIDENCE_MEMBERSHIP_NOT_STANDALONE');
assert.equal(profile.targetMyr,129);
assert.equal(VISUAL_REPORT_BUNDLES.length,2);
assert.ok(Array.isArray(VISUAL_REPORT_BUNDLES));
console.log('PASS visual-report commerce binding: current primary products use projected prices; legacy-readable reports fall back to the canonical report commerce contract without top-level undefined price access.');
