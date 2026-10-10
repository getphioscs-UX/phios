import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relativePath) {
  return (await fs.readFile(path.join(root, relativePath), 'utf8'))
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

const requiredFiles = [
  'content/registry/pds-w1-experience-contract.json',
  'tests/fixtures/pds-w1-experience-contract.json',
  'docs/design-system/PDS-W1-EXPERIENCE-CONTRACT.md',
  'scripts/check-pds-w1-experience-contract.mjs'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing PDS-W1 deliverable: ${file}`);
}

const contract = await readJson('content/registry/pds-w1-experience-contract.json');
const fixtures = await readJson('tests/fixtures/pds-w1-experience-contract.json');

assert.equal(contract.milestone, 'PDS-W1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.schemaVersion, 'phi-os.pds-experience-contract.v1');
assert.equal(contract.status, 'experience-contract-frozen');
assert.equal(contract.acceptance.implementationStatus, 'contract-only');
assert.equal(contract.acceptance.pageMigrationBeginsAt, 'PDS-W4');

assert.deepEqual(contract.journey.publicStageOrder, fixtures.expectedStageOrder);
assert.deepEqual(contract.journey.stages.map(stage => stage.id), fixtures.expectedStageOrder);
assert.equal(new Set(contract.journey.publicStageOrder).size, 6);

for (const stage of contract.journey.stages) {
  assert.equal(typeof stage.publicName.en, 'string');
  assert.equal(typeof stage.publicName['zh-Hans'], 'string');
  assert.ok(stage.publicName.en.trim().length > 0, `${stage.id}: missing English name`);
  assert.ok(stage.publicName['zh-Hans'].trim().length > 0, `${stage.id}: missing Chinese name`);
  assert.ok(stage.mission.en.trim().length > 0, `${stage.id}: missing English mission`);
  assert.ok(stage.mission['zh-Hans'].trim().length > 0, `${stage.id}: missing Chinese mission`);
  assert.ok(stage.systemSurfaces.length > 0, `${stage.id}: missing system surface`);
}

assert.deepEqual(contract.pageMissions.map(page => page.id), fixtures.expectedPageOrder);
assert.equal(new Set(contract.pageMissions.map(page => page.path)).size, 6);

for (const page of contract.pageMissions) {
  assert.ok(page.mission.trim().length > 0, `${page.id}: missing mission`);
  assert.ok(page.primaryAction.trim().length > 0, `${page.id}: missing primary action`);
  assert.equal(await exists(page.path), true, `${page.id}: page does not exist: ${page.path}`);
}

assert.deepEqual(
  contract.informationLayers.map(layer => layer.id),
  fixtures.expectedInformationLayerOrder
);
assert.deepEqual(
  contract.informationLayers.map(layer => layer.order),
  [1, 2, 3, 4]
);
assert.equal(contract.informationLayers[0].defaultVisibility, 'visible');
assert.equal(contract.informationLayers[1].defaultVisibility, 'visible');
assert.equal(contract.informationLayers[2].defaultVisibility, 'collapsed');
assert.equal(contract.informationLayers[3].defaultVisibility, 'restricted');

assert.equal(contract.viewBoundaries.customer.default, true);
assert.equal(contract.viewBoundaries.professional.default, false);
assert.equal(contract.viewBoundaries.technical.default, false);
assert.deepEqual(contract.viewBoundaries.customer.mustNotShowByDefault, ['technical-record']);
assert.equal(contract.contentRules.unknownRule.includes('must not'), true);

const mappedSystemTerms = contract.terminology.mappings.map(item => item.system);
assert.deepEqual(mappedSystemTerms, fixtures.requiredSystemTerms);
for (const mapping of contract.terminology.mappings) {
  assert.ok(mapping.public.en.trim().length > 0, `${mapping.system}: missing English public term`);
  assert.ok(mapping.public['zh-Hans'].trim().length > 0, `${mapping.system}: missing Chinese public term`);
}

for (const protectedPath of fixtures.protectedRuntimePaths) {
  assert.equal(await exists(protectedPath), true, `Protected Runtime path missing: ${protectedPath}`);
}

const requiredImmutableBoundaries = [
  'runtime route',
  'runtime state',
  'runtime schema',
  'storage key',
  'provider contract',
  'persistence behavior',
  'lineage behavior'
];
for (const boundary of requiredImmutableBoundaries) {
  assert.ok(contract.immutableBoundaries.includes(boundary), `Missing immutable boundary: ${boundary}`);
}

const registryIndex = await readJson('content/registry/index.json');
assert.equal(
  registryIndex.registries.pds_w1_experience_contract,
  './pds-w1-experience-contract.json',
  'PDS-W1 contract must be registered in content/registry/index.json'
);

console.log('✓ PDS-W1 experience contract frozen');
console.log('  Six-stage journey: enter → describe → discover → understand → choose → continue');
console.log('  Six page missions and primary actions validated');
console.log('  Four information layers and view boundaries validated');
console.log('  Runtime boundaries remain explicitly immutable');
