import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const exists = file => fs.access(path.join(root, file)).then(() => true, () => false);

const glossary = JSON.parse(await read(
  'docs/pws/contracts/pws-canonical-glossary-v1.json'
));
const contract = JSON.parse(await read(
  'docs/pws/contracts/pws-canonical-identifiers-v1.json'
));
assert.equal(contract.contractId, 'phi-os.pws.canonical-identifiers.v1');
assert.equal(contract.schemaVersion, '1.0.0');
assert.equal(contract.status, 'frozen');
assert.equal(contract.glossaryContractId, glossary.contractId);
assert.equal(
  contract.baseline.commit,
  '25e7e22c8a067e7835d84ab43ec027a5ffb12faf'
);
assert.equal(
  contract.format.canonicalPatternTemplate,
  '^{prefix}_[0-9a-f]{32}$'
);
assert.equal(contract.format.canonicalDomainFieldStyle, 'snake_case');
assert.equal(contract.format.javascriptProjectionFieldStyle, 'camelCase');

for (const [rule, expected] of Object.entries({
  immutableAfterCreation: true,
  globallyUniqueWithinType: true,
  semanticDataAllowed: false,
  personalDataAllowed: false,
  sequentialDatabaseIdsAllowed: false,
  externalIdsAsCanonicalIdsAllowed: false,
  aiGeneratedFormalIdsAllowed: false,
  browserGeneratedFormalPwsIdsAllowed: false,
  legacyIdReadsAllowed: true,
  legacyIdWritesAllowed: false,
  bulkLegacyRewriteAllowed: false,
  identifierReuseAllowed: false
})) assert.equal(contract.rules[rule], expected, rule);

assert.deepEqual(
  contract.identifiers.map(item => item.term),
  glossary.terms.map(item => item.term)
);
const fields = new Set();
const projectionFields = new Set();
const prefixes = new Set();
for (const item of contract.identifiers) {
  assert.match(item.field, /^[a-z][a-z0-9_]*_id$/);
  assert.match(item.projectionField, /^[a-z][A-Za-z0-9]*Id$/);
  assert.match(item.prefix, /^[a-z][a-z0-9]{1,15}$/);
  assert.equal(fields.has(item.field), false, `Duplicate field: ${item.field}`);
  assert.equal(
    projectionFields.has(item.projectionField),
    false,
    `Duplicate projection field: ${item.projectionField}`
  );
  assert.equal(prefixes.has(item.prefix), false, `Duplicate prefix: ${item.prefix}`);
  fields.add(item.field);
  projectionFields.add(item.projectionField);
  prefixes.add(item.prefix);
}
assert.equal(contract.identifiers.length, 35);

const operationFields = new Set();
for (const item of contract.operationIdentifiers) {
  assert.match(item.field, /^[a-z][a-z0-9_]*_id$/);
  assert.equal(fields.has(item.field), false);
  assert.equal(operationFields.has(item.field), false);
  assert.equal(prefixes.has(item.prefix), false);
  operationFields.add(item.field);
  prefixes.add(item.prefix);
}

assert.deepEqual(contract.legacyFieldAliases.map(item => item.legacyField), [
  'case_id','task_id','job_id','project_id','ticket_id',
  'service_product_id','service_entitlement_id',
  'professional_candidate_report_id','jpr_id','public_journey_id',
  'reality_demo_id'
]);
for (const item of contract.legacyFieldAliases) {
  assert.ok(Array.isArray(item.canonicalFields));
  for (const field of item.canonicalFields) {
    assert.ok(fields.has(field) || field === 'journey_id', `${item.legacyField}`);
  }
}
for (const field of ['case_id','task_id','job_id','ticket_id']) {
  assert.equal(
    contract.legacyFieldAliases.find(item => item.legacyField === field).resolution,
    'context_required'
  );
}
assert.deepEqual(
  contract.legacyFieldAliases.find(
    item => item.legacyField === 'reality_demo_id'
  ).canonicalFields,
  []
);

for (const scope of contract.legacyCompatibility) {
  assert.ok(scope.paths.length > 0);
  for (const target of scope.paths) assert.equal(await exists(target), true, target);
}
assert.equal(contract.externalReferenceRule.canonicalPrimaryKeyAllowed, false);
assert.equal(contract.draftIdentifierRule.formalObjectAllowed, false);
assert.equal(contract.draftIdentifierRule.persistenceAllowed, false);
assert.equal(contract.draftIdentifierRule.promotionRequiresNewCanonicalId, true);

const registry = JSON.parse(await read('content/registry/index.json'));
const runtimeContracts = JSON.parse(
  await read('content/registry/runtime-contracts.json')
);
const migrations = JSON.parse(
  await read('content/registry/runtime-migrations.json')
);
assert.equal(Object.keys(registry.registries).length, 51);
assert.equal(registry.registries.public_assets, './public-assets.json');
assert.equal(registry.registries.book_5_manifest, './book-5-manifest.json');
assert.equal(runtimeContracts.contracts.length, 20);
assert(migrations.migrations.length >= 4);
assert.deepEqual(
  migrations.migrations.slice(0, 4).map(item => item.version),
  [1, 2, 3, 4]
);

console.log('✓ PWS-I1-T02 Canonical Identifier Contract v1 frozen.');
console.log('  35 object IDs, 5 operation IDs and 11 Legacy field decisions validated.');
console.log('  No generator, ID rewrite, Registry, Migration or presentation change.');
