import assert from 'node:assert/strict';
import { readJson, BASELINE } from './lib/web-production/wpr-foundation-v1.mjs';

const schema = readJson('content/web-production/schemas/canonical-web-production-v1.schema.json');
const registry = readJson('content/web-production/registries/canonical-web-production-registry-v1.json');

assert.equal(registry.baselineCommit, BASELINE);
const required = ['productionCode','productionVersion','surfaceCode','routeCode','locale','audience','sourceReferences','runtimeReferences','presentationReferences','assetReferences','accessMode','dataPurpose','compositionCode','renderPolicy','hydrationPolicy','cachePolicy','seoPolicy','lineage','productionState'];
for (const field of required) assert.ok(schema.required.includes(field), `WPR_W2_SCHEMA_FIELD_MISSING:${field}`);

assert.ok(Array.isArray(registry.productionRecords));
const codes = new Set();
for (const record of registry.productionRecords) {
  for (const field of required) assert.ok(Object.hasOwn(record, field), `WPR_W2_RECORD_FIELD_MISSING:${field}`);
  assert.ok(!codes.has(record.productionCode), `WPR_W2_DUPLICATE_PRODUCTION_CODE:${record.productionCode}`);
  codes.add(record.productionCode);
  assert.ok(['en','zh-Hans'].includes(record.locale));
  assert.ok(['PUBLIC','CUSTOMER','PROFESSIONAL'].includes(record.audience));
  assert.ok(Array.isArray(record.sourceReferences));
  assert.ok(Array.isArray(record.runtimeReferences));
  assert.ok(Array.isArray(record.presentationReferences));
  assert.ok(Array.isArray(record.assetReferences));
  assert.ok(Array.isArray(record.dataPurpose));
  assert.equal(record.renderPolicy?.htmlIsProjectionOnly, true);
  assert.notEqual(record.lineage?.cprBindingState, 'CPR_BOUND_PRODUCTION', 'WPR-D may not claim CPR-bound production while CPR productionRecords are empty.');
}
assert.equal(registry.rules.productionRecordsMayBeEmptyDuringWprA,true);
assert.equal(registry.rules.productionRecordsMustNotRemainEmptyAtFinalWprFreeze,true);
assert.equal(registry.rules.htmlIsProjectionOnly,true);
console.log(`✓ WPR-W2 Canonical Web Production Contract passed (${registry.productionRecords.length} production records).`);
