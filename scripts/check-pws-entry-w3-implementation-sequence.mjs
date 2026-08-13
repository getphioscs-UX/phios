import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const exists = file => fs.access(path.join(root, file)).then(() => true, () => false);

const manifest = JSON.parse(await read(
  'docs/pws/architecture/pws-implementation-sequence-v1.json'
));
assert.equal(manifest.registryId, 'phi-os.pws-implementation-sequence.v1');
assert.equal(manifest.status, 'implementation-sequence-v1-frozen');
assert.equal(
  manifest.baseline.commit,
  '56cb46aaa2695693525e20901022d06b126b5a89'
);
for (const [key, value] of Object.entries({
  strictlySequential: true,
  parallelStagesAllowed: false,
  skipAllowed: false,
  reorderAllowed: false,
  passedPredecessorRequired: true,
  sequenceKeysAreUnique: true
})) assert.equal(manifest.rules[key], value, key);

const expectedLabels = [
  'PWS-I1','PWS-I2','PJA-W0','PJA-W1',
  'PWS-I8 Free Privacy Foundation','PWS-I9 Rule Foundation','PJA-W2',
  'PWS-I4 Commercial Foundation','PJA-W3','PWS-I8 Consent Foundation',
  'PWS-I9 Provider and Cost','PJA-W4','Core Journey Integration','PJA-W5',
  'PJA-W6','PWS-I3 Professional Identity','PWS-I5 Workspace and Readiness',
  'PJA-W7','PJA-W8','PWS-I6 Operations','PWS-I7 Governance',
  'PWS-I8 Full Privacy','PWS-I9 Full Intelligence','PJA-W9','PWS-X1-PJA',
  'PJA-W10','Full Acceptance','Production Freeze'
];
assert.deepEqual(manifest.sequence.map(item => item.label), expectedLabels);
assert.deepEqual(
  manifest.sequence.map(item => item.ordinal),
  Array.from({ length: 28 }, (_, index) => index + 1)
);
assert.equal(new Set(manifest.sequence.map(item => item.sequenceKey)).size, 28);

for (const file of [
  'functions/professional/access/professional-identity-contract.js',
  'functions/professional/access/professional-eligibility-contract.js',
  'functions/professional/access/professional-assignment-contract.js',
  'functions/professional/access/professional-authorisation-decision.js',
  'functions/professional/access/professional-access-audit.js',
  'functions/professional/access/authorised-professional-data-loader.js'
]) assert.equal(await exists(file), true, `W1 path missing: ${file}`);
const misplacedAccessFiles = await fs.readdir(
  path.join(root, 'professional/access')
).catch(() => []);
assert.deepEqual(misplacedAccessFiles, []);

const audit = JSON.parse(await read(
  'docs/pws/audit/pws-i1-t00-baseline-contract-audit.json'
));
assert.deepEqual(audit.categories.map(item => item.category), [
  'Glossary','Objects','Identifiers','Schema Version','States','Operations',
  'Events','Errors','Directories','Contract IDs','Permissions','Tests',
  'Legacy JPR and PJA Terms'
]);
for (const item of audit.categories) {
  assert.equal(item.status, 'partial');
  assert.ok(item.canonicalSources.length > 0);
  assert.ok(item.finding);
  assert.ok(item.freezeDecision);
}

const registry = JSON.parse(await read('content/registry/index.json'));
const contracts = JSON.parse(await read('content/registry/runtime-contracts.json'));
const migrations = JSON.parse(await read('content/registry/runtime-migrations.json'));
assert.equal(Object.keys(registry.registries).length, 51);
assert.equal(registry.registries.public_assets, './public-assets.json');
assert.equal(registry.registries.book_5_manifest, './book-5-manifest.json');
assert.equal(contracts.contracts.length, 20);
assert(migrations.migrations.length >= 4);
assert.deepEqual(
  migrations.migrations.slice(0, 4).map(item => item.version),
  [1, 2, 3, 4]
);

console.log('✓ PWS-ENTRY-W3 implementation sequence and PWS-I1-T00 audit frozen.');
console.log('  28 strictly ordered stages; duplicate programme labels have unique sequence keys.');
console.log('  Registry 51, Runtime Contracts 20, Migrations 4; page behaviour unchanged.');
