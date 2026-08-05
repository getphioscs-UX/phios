import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');

const glossary = JSON.parse(await read(
  'docs/pws/contracts/pws-canonical-glossary-v1.json'
));
const identifiers = JSON.parse(await read(
  'docs/pws/contracts/pws-canonical-identifiers-v1.json'
));
const registry = JSON.parse(await read(
  'docs/pws/contracts/pws-canonical-object-registry-v1.json'
));
const versions = JSON.parse(await read(
  'docs/pws/contracts/pws-schema-version-v1.json'
));

assert.equal(registry.registryId, 'phi-os.pws.canonical-object-registry.v1');
assert.equal(registry.schemaVersion, 'pws-v1');
assert.equal(registry.status, 'frozen');
assert.equal(
  registry.baseline.commit,
  'ada3dc9229af299573df02d0986c7d6ce6616b46'
);
assert.deepEqual(registry.requiredFields, [
  'objectId','objectCode','canonicalName','displayName','definition','scope',
  'schemaVersion','status','introducedVersion','deprecatedAliases','ownerModule'
]);
assert.deepEqual(
  registry.objects.map(item => item.canonicalName),
  glossary.terms.map(item => item.term)
);
assert.deepEqual(
  registry.objects.map(item => item.canonicalName),
  identifiers.identifiers.map(item => item.term)
);

const objectIds = new Set();
const objectCodes = new Set();
const names = new Set();
for (const object of registry.objects) {
  assert.deepEqual(Object.keys(object), registry.requiredFields);
  assert.match(object.objectId, /^pws\.object\.[a-z0-9-]+$/);
  assert.match(object.objectCode, /^PWS-[A-Z0-9-]+$/);
  assert.ok(object.displayName.en);
  assert.ok(object.displayName.zhHans);
  assert.ok(object.definition);
  assert.ok(object.scope);
  assert.equal(object.schemaVersion, 'pws-v1');
  assert.equal(object.status, 'active');
  assert.equal(object.introducedVersion, 'pws-v1');
  assert.ok(Array.isArray(object.deprecatedAliases));
  assert.match(object.ownerModule, /^runtime\/[a-z0-9/-]+$/);
  assert.equal(objectIds.has(object.objectId), false);
  assert.equal(objectCodes.has(object.objectCode), false);
  assert.equal(names.has(object.canonicalName), false);
  objectIds.add(object.objectId);
  objectCodes.add(object.objectCode);
  names.add(object.canonicalName);
}
assert.equal(registry.objects.length, 35);
assert.equal(registry.rules.oneEntryPerCanonicalName, true);
assert.equal(registry.rules.oneOwnerModulePerObject, true);
assert.equal(registry.rules.duplicateObjectCodeAllowed, false);
assert.equal(registry.rules.legacyAliasesAreWriteSources, false);
assert.equal(registry.rules.presentationLabelsCreateObjects, false);
assert.equal(registry.rules.runtimeRegistryChanged, false);

const expectedAliasesByTarget = new Map();
for (const alias of glossary.legacyAliases) {
  for (const target of alias.canonicalTargets) {
    const aliases = expectedAliasesByTarget.get(target) || [];
    aliases.push(alias.alias);
    expectedAliasesByTarget.set(target, aliases);
  }
}
for (const object of registry.objects) {
  assert.deepEqual(
    [...object.deprecatedAliases].sort(),
    [...(expectedAliasesByTarget.get(object.canonicalName) || [])].sort(),
    `${object.canonicalName} aliases`
  );
}

assert.equal(versions.contractId, 'phi-os.pws.schema-version.v1');
assert.equal(versions.schemaVersion, 'pws-v1');
assert.equal(versions.status, 'frozen');
assert.equal(versions.backwardCompatibility.required, true);
assert.equal(versions.backwardCompatibility.writeRule,
  'New writes use canonical pws-v1 fields only.');
assert.equal(versions.breakingChange.requiresNewVersion, 'pws-v2');
assert.equal(versions.breakingChange.approvalRequired, true);
assert.equal(versions.breakingChange.compatibilityAdapterRequired, true);
assert.equal(versions.breakingChange.migrationAssessmentRequired, true);
assert.equal(versions.migration.automaticMigrationAllowed, false);
assert.equal(versions.deprecation.newWritesAllowed, false);
assert.equal(versions.deprecation.readCompatibilityRequired, true);
assert.equal(versions.deprecation.earliestRemovalVersion, 'pws-v2');
assert.equal(versions.schemaValidation.required, true);
assert.equal(
  versions.schemaValidation.failureMode,
  'reject without persistence or side effect'
);
assert.equal(versions.schemaValidation.providerOutputMayBypassValidation, false);
assert.equal(versions.schemaValidation.uiMayBypassValidation, false);
assert.equal(versions.schemaValidation.apiMayInventSchemaVersion, false);

const contentRegistry = JSON.parse(await read('content/registry/index.json'));
const runtimeContracts = JSON.parse(
  await read('content/registry/runtime-contracts.json')
);
const migrations = JSON.parse(
  await read('content/registry/runtime-migrations.json')
);
assert.equal(Object.keys(contentRegistry.registries).length, 50);
assert.equal(runtimeContracts.contracts.length, 20);
assert(migrations.migrations.length >= 4);
assert.deepEqual(
  migrations.migrations.slice(0, 4).map(item => item.version),
  [1, 2, 3, 4]
);

console.log('✓ PWS-I1-T02 Canonical Object Registry and T03 Schema Version passed.');
console.log('  35 objects × 11 required fields; schema version pws-v1 frozen.');
console.log('  Compatibility, breaking change, Migration, Deprecation and Validation rules closed.');
