import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const exists = file => fs.access(path.join(root, file))
  .then(() => true, () => false);

const assertRuntimePlaceholderBoundary = async () => {
  if (!(await exists('runtime'))) return;

  const allowedDirectories = new Set([
    'runtime',
    'runtime/production',
    'runtime/production/exporter',
    'runtime/production/validator',
    'runtime/production/importer',
    'runtime/production/publication',
    'runtime/production/localization'
  ]);
  const allowedFiles = new Set([
    'runtime/production/README.md',
    'runtime/production/exporter/README.md',
    'runtime/production/validator/README.md',
    'runtime/production/importer/README.md',
    'runtime/production/publication/README.md',
    'runtime/production/localization/README.md'
  ]);

  const walk = async relativeDirectory => {
    const entries = await fs.readdir(path.join(root, relativeDirectory), {
      withFileTypes: true
    });
    for (const entry of entries) {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        assert(
          allowedDirectories.has(relativePath),
          `Unexpected physical Runtime directory: ${relativePath}`
        );
        await walk(relativePath);
        continue;
      }
      assert(
        entry.isFile() && allowedFiles.has(relativePath),
        `Runtime placeholder boundary violation: ${relativePath}`
      );
    }
  };

  await walk('runtime');
};

const ownership = JSON.parse(await read(
  'docs/pws/architecture/pws-canonical-ownership-v1.json'
));
assert.equal(ownership.registryId, 'phi-os.pws-canonical-ownership.v1');
assert.equal(ownership.schemaVersion, '1.0.0');
assert.equal(ownership.status, 'canonical-ownership-v1-frozen');
assert.equal(
  ownership.baseline.commit,
  '39c45784994f36630cad62c368149c1cb99e9b13'
);
for (const [rule, expected] of Object.entries({
  oneWriteSourcePerObject: true,
  legacyWritesAllowed: false,
  duplicateObjectCreationAllowed: false,
  canonicalPathIsLogicalOwnerModule: true,
  physicalMovesPerformed: false,
  migrationExecuted: false,
  pageBehaviorChanged: false,
  runtimeRegistryChanged: false,
  contentRegistryChanged: false
})) assert.equal(ownership.rules[rule], expected, `Ownership rule: ${rule}`);

const requiredObjects = [
  'Professional',
  'Capability',
  'Credential',
  'Certification',
  'Method',
  'Service',
  'Product',
  'Offer',
  'Price',
  'Order',
  'Payment',
  'Entitlement',
  'Consent',
  'Assignment',
  'Workspace',
  'Evidence',
  'Journey',
  'Reading',
  'Navigation',
  'Deliverable',
  'Professional Response',
  'Knowledge Resource',
  'Question Route',
  'Provider Usage',
  'Provider Budget',
  'Follow-up',
  'Governance',
  'Security'
];
assert.deepEqual(
  ownership.objects.map(item => item.object),
  requiredObjects
);

const expectedCanonicalPaths = {
  Professional: 'runtime/professional',
  Capability: 'runtime/capability',
  Credential: 'runtime/credential',
  Certification: 'runtime/certification',
  Method: 'runtime/method',
  Service: 'runtime/service',
  Product: 'runtime/product',
  Offer: 'runtime/commercial',
  Price: 'runtime/commercial',
  Order: 'runtime/commercial',
  Payment: 'runtime/commercial',
  Entitlement: 'runtime/entitlement',
  Consent: 'runtime/consent',
  Assignment: 'runtime/assignment',
  Workspace: 'runtime/workspace',
  Evidence: 'runtime/evidence',
  Journey: 'runtime/journey',
  Reading: 'runtime/reading',
  Navigation: 'runtime/navigation',
  Deliverable: 'runtime/deliverable',
  'Professional Response':
    'runtime/deliverable/professional-response',
  'Knowledge Resource': 'runtime/knowledge',
  'Question Route': 'runtime/intelligence/routing',
  'Provider Usage': 'runtime/intelligence/usage',
  'Provider Budget': 'runtime/intelligence/cost',
  'Follow-up': 'runtime/operations',
  Governance: 'runtime/governance',
  Security: 'runtime/security'
};

const registryIds = new Set();
const schemaVersions = new Set();
for (const item of ownership.objects) {
  for (const field of [
    'canonicalPath',
    'readSource',
    'writeSource',
    'migrationOwner',
    'schemaVersion',
    'registryId'
  ]) {
    assert.equal(
      typeof item[field],
      'string',
      `${item.object}.${field} must be a scalar string.`
    );
    assert.notEqual(item[field].trim(), '', `${item.object}.${field}`);
    assert.equal(item[field].includes('*'), false, `${item.object}.${field}`);
  }
  assert.equal(
    item.canonicalPath,
    expectedCanonicalPaths[item.object],
    `${item.object} canonical owner changed.`
  );
  assert.equal(
    item.readSource.startsWith(`${item.canonicalPath}/`),
    true,
    `${item.object} read source is outside its owner.`
  );
  assert.equal(
    item.writeSource.startsWith(`${item.canonicalPath}/`),
    true,
    `${item.object} write source is outside its owner.`
  );
  assert.equal(
    Array.isArray(item.writeSource),
    false,
    `${item.object} has multiple write sources.`
  );
  assert.equal(
    Array.isArray(item.legacyPaths) && item.legacyPaths.length > 0,
    true,
    `${item.object} requires known Legacy paths.`
  );
  assert.equal(
    item.legacyPaths.includes(item.writeSource),
    false,
    `${item.object} Legacy path is still a write source.`
  );
  for (const legacyPath of item.legacyPaths) {
    assert.equal(
      await exists(legacyPath),
      true,
      `${item.object} Legacy path is not traceable: ${legacyPath}`
    );
  }
  assert.equal(
    item.deprecationPlan?.newWritesAllowed,
    false,
    `${item.object} permits new Legacy writes.`
  );
  assert.equal(
    item.deprecationPlan?.preserveHistory,
    true,
    `${item.object} does not preserve Legacy history.`
  );
  for (const field of ['mode', 'targetStage']) {
    assert.equal(
      typeof item.deprecationPlan?.[field],
      'string',
      `${item.object}.deprecationPlan.${field}`
    );
    assert.notEqual(
      item.deprecationPlan[field].trim(),
      '',
      `${item.object}.deprecationPlan.${field}`
    );
  }
  assert.equal(
    registryIds.has(item.registryId),
    false,
    `Duplicate ownership registryId: ${item.registryId}`
  );
  assert.equal(
    schemaVersions.has(item.schemaVersion),
    false,
    `Duplicate object schemaVersion: ${item.schemaVersion}`
  );
  registryIds.add(item.registryId);
  schemaVersions.add(item.schemaVersion);
}
assert.equal(registryIds.size, requiredObjects.length);
assert.equal(schemaVersions.size, requiredObjects.length);

// Logical owners are frozen without creating a parallel physical object tree.
await assertRuntimePlaceholderBoundary();

const registryIndex = JSON.parse(await read('content/registry/index.json'));
const runtimeContracts = JSON.parse(
  await read('content/registry/runtime-contracts.json')
);
const migrations = JSON.parse(
  await read('content/registry/runtime-migrations.json')
);
assert.equal(Object.keys(registryIndex.registries).length, 51);
assert.equal(registryIndex.registries.public_assets, './public-assets.json');
assert.equal(registryIndex.registries.book_5_manifest, './book-5-manifest.json');
assert.equal(runtimeContracts.contracts.length, 20);
assert(migrations.migrations.length >= 4);
assert.deepEqual(
  migrations.migrations.slice(0, 4).map(item => item.version),
  [1, 2, 3, 4]
);
assert.equal(
  Object.values(registryIndex.registries).some(value =>
    String(value).includes('canonical-ownership')
  ),
  false,
  'Architecture ownership metadata must not change Runtime/content registries.'
);

const document = await read(
  'docs/pws/architecture/PWS-ENTRY-W2-CANONICAL-OWNERSHIP-FREEZE.md'
);
for (const statement of [
  'Every formal object appears exactly once',
  'exactly one scalar `writeSource`',
  '`newWritesAllowed: false`',
  'does not mean deletion',
  'Payment',
  'Provider Budget',
  'Professional Response'
]) assert.equal(
  document.includes(statement),
  true,
  `Ownership document is missing: ${statement}`
);

console.log('✓ PWS-ENTRY-W2 Canonical Ownership v1 frozen.');
console.log(`  Formal objects: ${requiredObjects.length}; write sources: ${requiredObjects.length}.`);
console.log('  Every Legacy path is traceable and has a no-new-writes deprecation plan.');
console.log('  No physical duplicate owner tree, Migration, page or Registry change.');
