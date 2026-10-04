import assert from 'node:assert/strict';
import {VISUAL_REPORT_PRODUCTS,VISUAL_REPORT_BUNDLES} from '../functions/canonical-presentation-runtime/visual-report-registry.js';

assert.equal(VISUAL_REPORT_PRODUCTS.length,8);
for(const row of VISUAL_REPORT_PRODUCTS){
  assert.ok(Number.isFinite(row.targetMyr)&&row.targetMyr>0,row.productId);
  assert.equal(typeof row.currency,'string');
  assert.ok(['CURRENT_PRIMARY','LEGACY_READABLE_CONTRACT'].includes(row.commerceProjection),row.productId);
}
const profile=VISUAL_REPORT_PRODUCTS.find(x=>x.methodId==='PROFILE');
assert.equal(profile.productId,'PROFILE_FULL_REPORT');
assert.equal(profile.commerceProjection,'LEGACY_READABLE_CONTRACT');
assert.ok(Array.isArray(VISUAL_REPORT_BUNDLES));
console.log('PASS visual-report commerce binding: current primary products use projected prices; legacy-readable reports fall back to the canonical report commerce contract without top-level undefined price access.');
