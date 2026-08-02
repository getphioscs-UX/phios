import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const exists = file => fs.access(path.join(root, file))
  .then(() => true, () => false);

const freezePath = 'docs/pja/pja-w0-cross-system-boundary-freeze-v1.json';
const [freeze, pwsI2, khBlueprint, ownership, directory, packageJson] =
  await Promise.all([
    readJson(freezePath),
    readJson('docs/pws/contracts/pws-i2-v1-freeze.json'),
    readJson(
      'docs/knowledge/kh-w3-5g-book-i-knowledge-blueprint-freeze-v1.json'
    ),
    readJson('docs/pws/architecture/pws-canonical-ownership-v1.json'),
    readJson('docs/pws/contracts/pws-directory-blueprint-v1.json'),
    readJson('package.json')
  ]);

assert.equal(freeze.freezeId, 'PJA-W0-v1.0.0-Frozen');
assert.equal(freeze.programme, 'PJA Public Architecture');
assert.equal(freeze.step, 'PJA-W0');
assert.equal(freeze.version, '1.0.0');
assert.equal(freeze.status, 'frozen');
assert.deepEqual(freeze.baseline, {
  repository: 'getphioscs-UX/phios',
  branch: 'main',
  commit: 'fbd136e6d53de37bad2fd53fcc8c6c1753b3830b'
});

assert.deepEqual(
  freeze.role.allowedCapabilities,
  ['read', 'render', 'route', 'link']
);
assert.deepEqual(freeze.role.pjaWriteSources, []);
assert.equal(freeze.role.mayCreateCanonicalObjects, false);
assert.equal(freeze.role.mayPromoteProjectionToCanonicalState, false);

const expectedDependencies = new Map([
  ['Knowledge Resource', 'PWS-I2 + KH-W3.5G Book I Blueprint'],
  ['Question Route', 'PWS-I9'],
  ['Product / Offer / Price', 'PWS-I2 / PWS-I4'],
  ['Payment / Entitlement', 'PWS-I4'],
  ['Consent', 'PWS-I8'],
  ['Journey', 'Core Runtime'],
  ['Provider', 'PWS-I9'],
  ['Assignment / Workspace', 'PWS-I5'],
  ['Queue', 'PWS-I6'],
  ['Deliverable', 'PWS-I5']
]);
assert.equal(freeze.dependencies.length, expectedDependencies.size);
for (const dependency of freeze.dependencies) {
  const key = dependency.objectSet.join(' / ');
  assert.equal(
    dependency.owner,
    expectedDependencies.get(key),
    `Unexpected PJA dependency owner for ${key}.`
  );
  assert.equal(dependency.pjaWriteSource, null, `${key} has a PJA write source.`);
  assert(dependency.pjaAccess.length > 0, `${key} has no PJA access contract.`);
  assert(
    dependency.pjaAccess.every(access =>
      freeze.role.allowedCapabilities.includes(access)
    ),
    `${key} uses an unapproved PJA capability.`
  );
  assert.equal(
    typeof dependency.activationRule,
    'string',
    `${key} has no activation rule.`
  );
  assert(dependency.currentSources.length > 0, `${key} has no current source.`);
  for (const source of dependency.currentSources) {
    assert.equal(
      await exists(source),
      true,
      `${key} current source is not traceable: ${source}`
    );
  }
  expectedDependencies.delete(key);
}
assert.equal(expectedDependencies.size, 0, 'Dependency Map is incomplete.');

assert.deepEqual(freeze.duplicateAuthorityGuards, {
  product: {
    soleOwners: ['PWS-I2', 'PWS-I4'],
    pjaDefinesObject: false,
    pjaWriteSource: false
  },
  entitlement: {
    soleOwner: 'PWS-I4',
    pjaDefinesObject: false,
    pjaWriteSource: false
  },
  providerCost: {
    soleOwner: 'PWS-I9',
    pjaDefinesObject: false,
    pjaWriteSource: false,
    existingProviderBudgetIsNotPjaCostAuthority: true
  }
});

const ownershipByObject = new Map(
  ownership.objects.map(item => [item.object, item])
);
assert.equal(
  ownershipByObject.get('Product')?.canonicalPath,
  'runtime/product'
);
assert.equal(
  ownershipByObject.get('Entitlement')?.canonicalPath,
  'runtime/entitlement'
);
assert.equal(
  ownershipByObject.get('Provider Budget')?.canonicalPath,
  'runtime/intelligence/cost'
);
for (const item of [
  ownershipByObject.get('Product'),
  ownershipByObject.get('Entitlement'),
  ownershipByObject.get('Provider Budget')
]) {
  assert(item, 'Required canonical ownership object is missing.');
  assert.equal(item.canonicalPath.startsWith('pja/'), false);
  assert.equal(item.writeSource.startsWith('pja/'), false);
}

const moduleOwners = new Map(
  directory.modules.map(item => [item.module, item.owner])
);
assert.equal(moduleOwners.get('product'), 'PWS-I2/PWS-I4');
assert.equal(moduleOwners.get('commercial'), 'PWS-I4');
assert.equal(moduleOwners.get('entitlement'), 'PWS-I4');
assert.equal(moduleOwners.get('consent'), 'PWS-I8');
assert.equal(moduleOwners.get('journey'), 'Core Runtime');
assert.equal(moduleOwners.get('assignment'), 'PWS-I5');
assert.equal(moduleOwners.get('workspace'), 'PWS-I5');
assert.equal(moduleOwners.get('deliverable'), 'PWS-I5');
assert.equal(moduleOwners.get('operations'), 'PWS-I6');
assert.equal(moduleOwners.get('intelligence'), 'PWS-I9');
assert.equal(moduleOwners.has('pja'), false);

assert.equal(pwsI2.freezeId, 'PWS-I2-v1.0.0-Frozen');
assert.equal(pwsI2.status, 'frozen');
assert.equal(khBlueprint.completionId, 'KH-W3.5G-Completed');
assert.equal(khBlueprint.status, 'knowledge_hub_planning_frozen');
const frozenBlueprintNodeCount = khBlueprint.canonicalNodePlan.reduce(
  (total, part) => total + part.canonicalNodes,
  0
);
assert.equal(
  khBlueprint.totals.bookICanonicalNodes,
  frozenBlueprintNodeCount
);
assert.equal(khBlueprint.totals.maximumActiveArticles, 8);
assert.equal(
  pwsI2.frozenBoundaries.registryPresenceCreatesContentRequirement,
  false
);

assert(
  Object.values(freeze.runtimePreservation).every(value => value === true),
  'A Core Runtime preservation boundary is open.'
);
assert.equal(freeze.changeScope.contractOnly, true);
for (const [boundary, changed] of Object.entries(freeze.changeScope)) {
  if (boundary === 'contractOnly') continue;
  assert.equal(changed, false, `PJA-W0 changed ${boundary}.`);
}

const rootPages = (await fs.readdir(root))
  .filter(file => file.endsWith('.html'))
  .sort();
const mappedPages = freeze.pageCapabilities
  .flatMap(capability => capability.pages)
  .filter(page => page !== 'reality-demo.html')
  .sort();
assert.deepEqual(mappedPages, rootPages, 'Page-to-Capability Map is incomplete.');
assert(
  freeze.pageCapabilities.some(capability => capability.pages.includes('reality-demo.html')),
  'Frozen PJA-W0 history must retain the retired Demo record.'
);
assert.match(await fs.readFile(path.join(root, '_redirects'), 'utf8'), /^\/reality-demo \/reality-journey 308$/m);
assert.equal(
  new Set(mappedPages).size,
  mappedPages.length,
  'A page is mapped to more than one PJA capability.'
);
for (const capability of freeze.pageCapabilities) {
  assert.equal(capability.writeAuthority, 'none');
  assert(capability.sourceObjects.length > 0);
  assert(capability.dependencyOwners.length > 0);
  assert.notEqual(capability.activationState.trim(), '');
}

const requiredDocuments = [
  'docs/pja/pja-system-boundary.md',
  'docs/pja/pja-pws-dependency-map.md',
  'docs/pja/pja-runtime-preservation-map.md',
  'docs/pja/pja-canonical-object-usage.md',
  'docs/pja/pja-page-to-capability-map.md'
];
assert.deepEqual(freeze.requiredDocuments, requiredDocuments);
const documents = await Promise.all(requiredDocuments.map(read));
for (const [index, document] of documents.entries()) {
  assert(
    document.includes('fbd136e6d53de37bad2fd53fcc8c6c1753b3830b'),
    `${requiredDocuments[index]} does not identify the frozen baseline.`
  );
}
const joinedDocuments = documents.join('\n');
for (const requiredStatement of [
  'PJA-W0-v1.0.0-Frozen',
  'Registry Presence ≠ Production Requirement',
  'PWS-I2 / PWS-I4',
  'Payment / Entitlement',
  'Consent',
  'Core Runtime',
  'PWS-I9',
  'PWS-I5',
  'PWS-I6',
  'second Product',
  'second Entitlement',
  'Provider Cost',
  'writeAuthority: none'
]) {
  assert(
    joinedDocuments.includes(requiredStatement),
    `PJA-W0 documents are missing: ${requiredStatement}`
  );
}

const migrationFiles = (await fs.readdir(path.join(root, 'db/migrations')))
  .filter(file => file.endsWith('.sql'))
  .sort();
assert.deepEqual(migrationFiles, [
  '0001_platform_foundation.sql',
  '0002_initial_runtime.sql',
  '0003_financial_professional_infrastructure.sql',
  '0004_book_commerce.sql',
  '0005_pws_universal_registry.sql'
]);
assert.equal(await exists('runtime'), false);

assert.equal(
  packageJson.scripts['check:pja-w0'],
  'node scripts/check-pja-w0-cross-system-boundary.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pja-w0-cross-system-boundary.mjs'
  ),
  'PJA-W0 acceptance is not wired into precheck.'
);
assert(
  packageJson.scripts.precheck.indexOf('check-pja-w0-cross-system-boundary') >
    packageJson.scripts.precheck.indexOf('check-pws-i2-v1-freeze'),
  'PJA-W0 must run after the PWS-I2 freeze gate.'
);

assert.deepEqual(freeze.acceptance, {
  pjaWriteSourceConflict: false,
  secondEntitlement: false,
  secondProduct: false,
  secondProviderCost: false,
  dependencyMapComplete: true,
  command: 'npm run check:pja-w0'
});

console.log('✓ PJA-W0 Cross-System Boundary and Dependency Freeze passed.');
console.log('  PJA capabilities: read, render, route and link; write sources: 0.');
console.log('  10 dependency groups and every top-level public page are mapped.');
console.log('  No second Product, Entitlement or Provider Cost authority exists.');
console.log('  Core Runtime, PKR, PWS-I2 and future PWS-I4–I9 boundaries are preserved.');
console.log('  State: PJA-W0-v1.0.0-Frozen.');
