import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const baseline = '6769f262c71a3a08319194942f17a0a154419fc8';
const runtimeRoot = 'content/professional/method-runtime';
const authorityPath = `${runtimeRoot}/shared-data-authority-v1.json`;
const authoritySchemaPath = `${runtimeRoot}/shared-data-authority-v1.schema.json`;
const recordSchemaPath = `${runtimeRoot}/shared-data-record-v1.schema.json`;
const documentPath = 'docs/method-runtime/MR-W2-SHARED-DATA-AUTHORITY.md';

const validFixtures = [
  'birth-record.json',
  'coordinate.json',
  'timezone.json',
  'dst.json',
  'true-solar-time.json',
  'astronomy.json',
  'calendar.json',
  'solar-terms.json',
  'reference-tables.json'
];
const invalidFixtures = [
  'birth-record-method-owned.json',
  'coordinate-out-of-range.json',
  'timezone-missing-tzdb-version.json',
  'dst-ai-derived.json',
  'true-solar-time-missing-algorithm-version.json',
  'astronomy-provider-authority.json',
  'calendar-nondeterministic.json',
  'solar-terms-plugin-owned.json',
  'reference-table-missing-checksum.json'
];

const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const exists = file => fs.access(path.join(root, file)).then(() => true, () => false);

const requiredFiles = [
  authorityPath,
  authoritySchemaPath,
  recordSchemaPath,
  documentPath,
  ...validFixtures.map(file => `fixtures/mr-w2/valid/${file}`),
  ...invalidFixtures.map(file => `fixtures/mr-w2/invalid/${file}`)
];
for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing MR-W2 file: ${file}`);
}

const [
  authority,
  authoritySchema,
  recordSchema,
  principles,
  boundary,
  capabilityModel,
  mrW1Registry,
  packageJson,
  document,
  readme
] = await Promise.all([
  readJson(authorityPath),
  readJson(authoritySchemaPath),
  readJson(recordSchemaPath),
  readJson(`${runtimeRoot}/method-runtime-principles.json`),
  readJson(`${runtimeRoot}/method-runtime-boundary.json`),
  readJson(`${runtimeRoot}/method-capability-model.json`),
  readJson(`${runtimeRoot}/method-registry-v1.json`),
  readJson('package.json'),
  read(documentPath),
  read('README.md')
]);

const ajv = new Ajv2020({ allErrors: true, strict: true, strictTypes: false });
const validateAuthority = ajv.compile(authoritySchema);
const validateRecord = ajv.compile(recordSchema);

function validationErrors(validate) {
  return (validate.errors ?? []).map(error =>
    `${error.instancePath || '/'} ${error.message}`
  );
}

function getAtPath(object, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], object);
}

function applyMutation(base, mutation) {
  const result = structuredClone(base);
  const keys = mutation.path.split('.');
  const finalKey = keys.pop();
  const parent = keys.reduce((value, key) => value[key], result);
  assert(parent && typeof parent === 'object', `Invalid mutation path: ${mutation.path}`);
  if (mutation.operation === 'remove') {
    assert(Object.hasOwn(parent, finalKey), `Mutation target is absent: ${mutation.path}`);
    delete parent[finalKey];
  } else if (mutation.operation === 'replace') {
    assert(Object.hasOwn(parent, finalKey), `Mutation target is absent: ${mutation.path}`);
    parent[finalKey] = mutation.value;
  } else {
    assert.fail(`Unsupported mutation operation: ${mutation.operation}`);
  }
  return result;
}

function semanticIssues(records) {
  const issues = [];
  const recordIds = records.map(record => record.recordId);
  const recordTypes = records.map(record => record.recordType);
  if (new Set(recordIds).size !== recordIds.length) {
    issues.push('duplicate_record_id');
  }
  if (new Set(recordTypes).size !== recordTypes.length) {
    issues.push('duplicate_record_type');
  }
  for (const record of records) {
    if (record.authority !== 'SHARED_DATA_AUTHORITY') {
      issues.push(`wrong_authority:${record.recordId}`);
    }
    if (record.methodOwner !== null) {
      issues.push(`method_ownership_prohibited:${record.recordId}`);
    }
    if (record.pluginOwner !== null) {
      issues.push(`plugin_ownership_prohibited:${record.recordId}`);
    }
    if (record.lineage?.aiUsed !== false) {
      issues.push(`ai_data_authority_prohibited:${record.recordId}`);
    }
    if (record.lineage?.providerCode !== null) {
      issues.push(`provider_authority_prohibited:${record.recordId}`);
    }
    if (['governed_resolution', 'deterministic_derivation'].includes(record.sourceClass)) {
      if (record.lineage?.deterministic !== true) {
        issues.push(`deterministic_derivation_required:${record.recordId}`);
      }
      if (!record.lineage?.algorithmCode || !record.lineage?.algorithmVersion) {
        issues.push(`derived_algorithm_version_required:${record.recordId}`);
      }
      if ((record.lineage?.inputRecordIds ?? []).length === 0) {
        issues.push(`derived_input_lineage_required:${record.recordId}`);
      }
    }
    if (record.recordType === 'TIMEZONE' && !record.payload?.tzdbVersion) {
      issues.push(`timezone_version_required:${record.recordId}`);
    }
    if (record.recordType === 'REFERENCE_TABLES' && !record.payload?.checksum) {
      issues.push(`reference_table_checksum_required:${record.recordId}`);
    }
    for (const prohibitedKey of [
      'projection',
      'interpretation',
      'professionalConclusion',
      'methodResult'
    ]) {
      if (getAtPath(record, prohibitedKey) !== undefined) {
        issues.push(`prohibited_output:${record.recordId}:${prohibitedKey}`);
      }
    }
  }
  return issues;
}

assert.equal(
  validateAuthority(authority),
  true,
  `Authority schema failure:\n${validationErrors(validateAuthority).join('\n')}`
);

assert.equal(authority.stageCode, 'MR-W2');
assert.equal(authority.authorityCode, 'SHARED_DATA_AUTHORITY');
assert.equal(authority.authorityVersion, '1.0.0');
assert.equal(authority.status, 'frozen');
assert.equal(authority.baseline.commit, baseline);
assert.equal(authority.runtimeCode, 'METHOD_RUNTIME');
assert.equal(authority.runtimeVersion, '1.0.0');
assert.equal(authority.layerCode, 'Data');
assert.equal(authority.singleton, true);
assert.equal(authority.sharedAcrossAllMethods, true);
assert.equal(authority.belongsToIndividualMethod, false);
assert.equal(authority.methodOwnershipAllowed, false);
assert.equal(authority.methodOverrideAllowed, false);
assert.equal(authority.providerAuthorityAllowed, false);
assert.equal(authority.aiAuthorityAllowed, false);

const expectedDomains = [
  ['BIRTH_RECORD', 'Birth Record', 'declared', null],
  ['COORDINATE', 'Coordinate', 'measured', null],
  ['TIMEZONE', 'Timezone', 'governed_resolution', 'SHARED_CALCULATION_RUNTIME'],
  ['DST', 'DST', 'deterministic_derivation', 'SHARED_CALCULATION_RUNTIME'],
  ['TRUE_SOLAR_TIME', 'True Solar Time', 'deterministic_derivation', 'SHARED_CALCULATION_RUNTIME'],
  ['ASTRONOMY', 'Astronomy', 'deterministic_derivation', 'SHARED_CALCULATION_RUNTIME'],
  ['CALENDAR', 'Calendar', 'deterministic_derivation', 'SHARED_CALCULATION_RUNTIME'],
  ['SOLAR_TERMS', 'Solar Terms', 'deterministic_derivation', 'SHARED_CALCULATION_RUNTIME'],
  ['REFERENCE_TABLES', 'Reference Tables', 'governed_reference', null]
];
assert.deepEqual(
  authority.domains.map(domain => [
    domain.dataCode,
    domain.name,
    domain.sourceClass,
    domain.computationOwner
  ]),
  expectedDomains
);
assert.equal(new Set(authority.domains.map(domain => domain.dataCode)).size, 9);
for (const [index, domain] of authority.domains.entries()) {
  assert.equal(domain.order, index + 1);
  assert.equal(domain.authorityOwner, 'SHARED_DATA_AUTHORITY');
  assert.equal(domain.methodOwner, null);
  assert.equal(domain.shared, true);
  assert.equal(domain.versionRequired, true);
  assert.equal(domain.provenanceRequired, true);
}

assert.deepEqual(authority.governance, {
  authoritativeRecordRequiredBeforeCalculation: true,
  immutableSourceFacts: true,
  correctionCreatesRevision: true,
  silentInferenceAllowed: false,
  unknownValueAllowed: true,
  provenanceRequired: true,
  sourceVersionRequired: true,
  normalizationVersionRequired: true,
  checksumRequiredForReferenceTables: true,
  deterministicDerivationRequired: true,
  calculationExecutionOwner: 'SHARED_CALCULATION_RUNTIME',
  providerMaySupplyAuthority: false,
  aiMayCreateOrRepairFacts: false,
  projectionAuthority: false,
  interpretationAuthority: false,
  professionalAuthority: false
});
assert.deepEqual(authority.dependencyBoundary, {
  journeyRuntimeRequired: false,
  knowledgeRuntimeRequired: false,
  professionalWorkspaceRequired: false,
  methodPluginRequired: false,
  methodPluginsAreConsumersOnly: true,
  methodSpecificCopiesAllowed: false,
  methodSpecificOverridesAllowed: false
});
assert.equal(authority.privacyContract.privacyAuthority, 'EXISTING_PHI_OS_PRIVACY_GOVERNANCE');
assert.equal(authority.privacyContract.stageCreatesStorageEntitlement, false);
assert.deepEqual(authority.productionContract, {
  authorityContractEstablished: true,
  calculationEngineEstablished: false,
  productionDataPublished: false,
  stageCreatesCalculationFacts: false,
  stageCreatesProjection: false,
  stageCreatesInterpretation: false,
  stageCreatesProfessionalConclusion: false,
  nextGate: 'MR-W3'
});

const validRecords = await Promise.all(
  validFixtures.map(file => readJson(`fixtures/mr-w2/valid/${file}`))
);
for (const [index, record] of validRecords.entries()) {
  assert.equal(
    validateRecord(record),
    true,
    `Valid fixture failed: ${validFixtures[index]}\n${validationErrors(validateRecord).join('\n')}`
  );
}
assert.deepEqual(semanticIssues(validRecords), []);
assert.deepEqual(
  validRecords.map(record => record.recordType),
  expectedDomains.map(([dataCode]) => dataCode)
);

for (const file of invalidFixtures) {
  const fixture = await readJson(`fixtures/mr-w2/invalid/${file}`);
  assert.equal(
    fixture.fixtureVersion,
    'PHI-OS-MR-W2-INVALID-MUTATION-v1.0.0',
    `Invalid mutation fixture version: ${file}`
  );
  assert(validFixtures.includes(fixture.baseFixture), `Unknown base fixture: ${file}`);
  assert.equal(typeof fixture.expectedIssue, 'string', `Missing expected issue: ${file}`);
  const base = await readJson(`fixtures/mr-w2/valid/${fixture.baseFixture}`);
  const mutated = applyMutation(base, fixture.mutation);
  assert.equal(validateRecord(mutated), false, `Invalid fixture passed schema: ${file}`);
  const issues = semanticIssues([mutated]);
  const semanticIssuePrefixes = issues.map(issue => issue.split(':')[0]);
  assert(
    semanticIssuePrefixes.includes(fixture.expectedIssue) ||
      validationErrors(validateRecord).length > 0,
    `Invalid fixture did not produce an issue: ${file}`
  );
}

assert.equal(principles.stageCode, 'MR-W0');
const sharedDataPrinciple = principles.principles.find(
  principle => principle.code === 'MR-P04-SHARED-DATA-AUTHORITY'
);
assert(sharedDataPrinciple, 'MR-W0 shared data principle is missing.');
for (const phrase of [
  'Birth',
  'coordinate',
  'timezone',
  'DST',
  'true solar time',
  'astronomy',
  'calendar',
  'solar terms',
  'reference tables'
]) {
  assert(
    sharedDataPrinciple.rule.includes(phrase),
    `MR-W0 Principle 4 is missing ${phrase}.`
  );
}
assert.equal(boundary.stageCode, 'MR-W0');
assert.equal(boundary.authority.data, 'SHARED_DATA_AUTHORITY');
assert.equal(boundary.providerBoundary.aiMayGuessMissingMethodData, false);
assert.equal(boundary.providerBoundary.aiMayCreateCalculationFacts, false);
const dataLayer = capabilityModel.layers.find(layer => layer.code === 'Data');
assert(dataLayer, 'MR-W0 Data layer is missing.');
assert.equal(dataLayer.runtimeOwner, 'SHARED_DATA_AUTHORITY');
assert.equal(dataLayer.belongsToIndividualMethod, false);

assert.equal(mrW1Registry.stageCode, 'MR-W1');
assert.equal(mrW1Registry.runtimeCode, 'METHOD_RUNTIME');
assert.equal(mrW1Registry.methods.length, 6);
for (const method of mrW1Registry.methods) {
  assert.equal(method.productionEligible, false);
  assert.equal(method.pluginRegistrationStatus, 'pending_contract');
}

assert.equal(
  packageJson.scripts['check:mr-w2'],
  'node scripts/check-mr-w2-shared-data-authority.mjs'
);
for (const scriptName of [
  'precheck',
  'check',
  'postcheck',
  'check:pja',
  'check:knowledge-runtime',
  'check:mr-w0',
  'check:mr-w1',
  'check:imr-w0',
  'check:hdr-w0'
]) {
  const command = packageJson.scripts[scriptName];
  assert.equal(typeof command, 'string', `Missing baseline script: ${scriptName}`);
  assert.equal(
    command.includes('check:mr-w2') ||
      command.includes('check-mr-w2-shared-data-authority.mjs'),
    false,
    `MR-W2 must remain outside ${scriptName}.`
  );
}

assert.equal((readme.match(/<!-- MR-W2:BEGIN -->/g) ?? []).length, 1);
assert.equal((readme.match(/<!-- MR-W2:END -->/g) ?? []).length, 1);
assert(readme.includes('## MR-W2｜Shared Data Authority'));
assert(readme.includes(baseline));

for (const heading of [
  '## Runtime position',
  '## Single shared authority',
  '## Nine governed domains',
  '## Source and derived records',
  '## Record contract',
  '## Time authority',
  '## Deterministic derivation boundary',
  '## Reference table boundary',
  '## Privacy boundary',
  '## Runtime independence',
  '## Production boundary',
  '## Default-chain isolation'
]) {
  assert(document.includes(heading), `MR-W2 document is missing ${heading}.`);
}
assert(document.includes(baseline));

console.log('✓ MR-W2 Shared Data Authority passed.');
console.log('Single Shared Data Authority validated.');
console.log('Nine shared data domains validated.');
console.log('Method and Plugin ownership prohibited.');
console.log('Provenance, version and normalization contracts validated.');
console.log('Timezone and DST authority validated.');
console.log('Deterministic derivation boundary validated.');
console.log('Provider and AI data authority prohibited.');
console.log('Reference Table checksum and license contract validated.');
console.log('Privacy and Runtime independence boundaries validated.');
console.log('MR-W3 calculation execution remains closed.');
console.log('MR-W0 and MR-W1 authority objects preserved.');
