import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const baseline = 'a8e8c642af0052c3579e75ce9c9a0fd124002241';
const runtimeRoot = 'content/professional/method-runtime';
const auditRoot = 'content/professional/method-audits';
const registryPath = `${runtimeRoot}/method-registry-v1.json`;
const schemaPath = `${runtimeRoot}/method-registry-v1.schema.json`;
const documentPath = 'docs/method-runtime/MR-W1-METHOD-REGISTRY.md';

const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const exists = file => fs.access(path.join(root, file)).then(() => true, () => false);

const validFixtures = [
  'human-design.json',
  'astrology.json',
  'bazi.json',
  'i-ching.json',
  'tarot.json',
  'psychology.json'
];
const schemaInvalidFixtures = [
  'method-missing-license-status.json',
  'method-illegal-lifecycle.json',
  'method-production-without-imr.json',
  'method-runtime-version-mismatch.json'
];
const semanticInvalidFixtures = [
  'method-gene-keys-runtime.json',
  'duplicate-method-code.json'
];

const requiredFiles = [
  registryPath,
  schemaPath,
  documentPath,
  ...validFixtures.map(file => `fixtures/mr-w1/valid/${file}`),
  ...schemaInvalidFixtures.map(file => `fixtures/mr-w1/invalid/${file}`),
  ...semanticInvalidFixtures.map(file => `fixtures/mr-w1/invalid/${file}`)
];
for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing MR-W1 file: ${file}`);
}

const [
  registry,
  schema,
  contractSeed,
  lifecycle,
  pluginRegistry,
  imrScope,
  hdrScope,
  packageJson,
  document,
  readme
] = await Promise.all([
  readJson(registryPath),
  readJson(schemaPath),
  readJson(`${runtimeRoot}/method-registry.json`),
  readJson(`${runtimeRoot}/method-runtime-lifecycle.json`),
  readJson(`${runtimeRoot}/method-plugin-registry.json`),
  readJson(`${auditRoot}/imr-w0-scope.json`),
  readJson(`${auditRoot}/hdr-w0-scope.json`),
  readJson('package.json'),
  read(documentPath),
  read('README.md')
]);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateRegistry = ajv.compile(schema);
const validateMethod = ajv.compile({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $defs: schema.$defs,
  $ref: '#/$defs/method'
});

function validationErrors(validate) {
  return (validate.errors ?? []).map(error =>
    `${error.instancePath || '/'} ${error.message}`
  );
}

function semanticIssues(methods) {
  const issues = [];
  const methodCodes = methods.map(method => method.methodCode);
  const pluginCodes = methods.map(method => method.pluginCode);
  if (new Set(methodCodes).size !== methodCodes.length) {
    issues.push('duplicate_method_code');
  }
  if (new Set(pluginCodes).size !== pluginCodes.length) {
    issues.push('duplicate_plugin_code');
  }
  for (const method of methods) {
    if (['GENE_KEYS', 'ZI_WEI_DOU_SHU'].includes(method.methodCode)) {
      issues.push(`prohibited_method_identity:${method.methodCode}`);
    }
    if (method.productionEligible === true && method.status !== 'production') {
      issues.push(`production_eligibility_without_production_status:${method.methodCode}`);
    }
    if (method.status === 'production') {
      if (method.imrStatus !== 'production_eligible') {
        issues.push(`production_without_imr:${method.methodCode}`);
      }
      if (!['approved', 'not_required'].includes(method.licenseStatus)) {
        issues.push(`production_without_license_gate:${method.methodCode}`);
      }
      if (method.productionEligible !== true) {
        issues.push(`production_not_eligible:${method.methodCode}`);
      }
    }
  }
  return issues;
}

assert.equal(
  validateRegistry(registry),
  true,
  `Registry schema failure:\n${validationErrors(validateRegistry).join('\n')}`
);
assert.deepEqual(semanticIssues(registry.methods), []);

assert.equal(registry.stageCode, 'MR-W1');
assert.equal(registry.registryCode, 'METHOD_REGISTRY');
assert.equal(registry.registryVersion, '1.0.0');
assert.equal(registry.status, 'frozen');
assert.equal(registry.baseline.commit, baseline);
assert.equal(registry.populationAuthority, 'MR-W1');
assert.equal(registry.runtimeCode, 'METHOD_RUNTIME');
assert.equal(registry.runtimeVersion, '1.0.0');
assert.deepEqual(registry.requiredFields, [
  'methodCode',
  'methodVersion',
  'status',
  'runtimeVersion',
  'projectionVersion',
  'requiresProfessional',
  'licenseStatus'
]);
assert.deepEqual(registry.registrationPolicy, {
  methodDefinitionBeforeRuntimeRequired: true,
  pluginCodeReservationRequired: true,
  methodRegistrationCreatesPluginExecution: false,
  registrationCreatesProductionAuthority: false,
  duplicateMethodCodeAllowed: false,
  duplicatePluginCodeAllowed: false,
  productionRequiresImr: true,
  productionAllowedLicenseStatus: ['approved', 'not_required'],
  futureRegistrationRequiresVersionedChange: true
});

const expectedMethods = [
  {
    methodCode: 'HUMAN_DESIGN',
    methodName: 'Human Design',
    pluginCode: 'HDR',
    targetTrack: 'HDR',
    category: 'core',
    status: 'internal',
    licenseStatus: 'restricted',
    definitionStatus: 'defined',
    imrStatus: 'conditional_passed',
    serviceStatus: 'preserved',
    calculationStatus: 'external_only_preserved'
  },
  {
    methodCode: 'ASTROLOGY',
    methodName: 'Astrology',
    pluginCode: 'AST',
    targetTrack: 'AST',
    category: 'core',
    status: 'experimental',
    licenseStatus: 'not_required',
    definitionStatus: 'defined',
    imrStatus: 'conditional_passed',
    serviceStatus: 'inactive',
    calculationStatus: 'pilot_candidate_validation_required'
  },
  {
    methodCode: 'BAZI',
    methodName: 'BaZi',
    pluginCode: 'BZR',
    targetTrack: 'BZR',
    category: 'core',
    status: 'experimental',
    licenseStatus: 'not_required',
    definitionStatus: 'defined',
    imrStatus: 'conditional_passed',
    serviceStatus: 'inactive',
    calculationStatus: 'policy_candidate_validation_required'
  },
  {
    methodCode: 'I_CHING',
    methodName: 'I Ching',
    pluginCode: 'ICH',
    targetTrack: 'ICH',
    category: 'planned',
    status: 'draft',
    licenseStatus: 'restricted',
    definitionStatus: 'draft',
    imrStatus: 'not_assessed',
    serviceStatus: 'not_implemented',
    calculationStatus: 'not_implemented'
  },
  {
    methodCode: 'TAROT',
    methodName: 'Tarot',
    pluginCode: 'TAR',
    targetTrack: 'TAR',
    category: 'planned',
    status: 'draft',
    licenseStatus: 'restricted',
    definitionStatus: 'draft',
    imrStatus: 'not_assessed',
    serviceStatus: 'not_implemented',
    calculationStatus: 'not_implemented'
  },
  {
    methodCode: 'PSYCHOLOGY',
    methodName: 'Psychology',
    pluginCode: 'PSY',
    targetTrack: 'PSY',
    category: 'planned',
    status: 'draft',
    licenseStatus: 'restricted',
    definitionStatus: 'draft',
    imrStatus: 'not_assessed',
    serviceStatus: 'not_implemented',
    calculationStatus: 'not_implemented'
  }
];
const selectedFields = method => ({
  methodCode: method.methodCode,
  methodName: method.methodName,
  pluginCode: method.pluginCode,
  targetTrack: method.targetTrack,
  category: method.category,
  status: method.status,
  licenseStatus: method.licenseStatus,
  definitionStatus: method.definitionStatus,
  imrStatus: method.imrStatus,
  serviceStatus: method.serviceStatus,
  calculationStatus: method.calculationStatus
});
assert.deepEqual(registry.methods.map(selectedFields), expectedMethods);

for (const method of registry.methods) {
  assert.equal(method.runtimeVersion, '1.0.0');
  assert.equal(method.requiresProfessional, true);
  assert.equal(method.productionEligible, false);
  assert.equal(method.methodRegistrationStatus, 'registered');
  assert.equal(method.pluginRegistrationStatus, 'pending_contract');
}

assert.equal(contractSeed.stageCode, 'MR-W0');
assert.equal(contractSeed.registryCode, 'METHOD_REGISTRY');
assert.equal(contractSeed.populationAuthority, 'MR-W1');
assert.deepEqual(contractSeed.methods, []);
assert.deepEqual(contractSeed.requiredFields, registry.requiredFields);
assert.deepEqual(
  contractSeed.plannedMethods.map(method => method.methodCode),
  registry.methods.map(method => method.methodCode)
);

assert.equal(pluginRegistry.stageCode, 'MR-W0');
assert.equal(pluginRegistry.registryCode, 'METHOD_PLUGIN_REGISTRY');
assert.deepEqual(pluginRegistry.registrations, []);
assert.equal(pluginRegistry.registrationPolicy.runtimeForkAllowed, false);
assert.equal(
  pluginRegistry.registrationPolicy.registrationCreatesProductionAuthority,
  false
);
const futurePluginByCode = new Map(
  pluginRegistry.futurePlugins.map(plugin => [plugin.pluginCode, plugin])
);
for (const method of registry.methods) {
  const reservation = futurePluginByCode.get(method.pluginCode);
  assert(reservation, `Missing MR-W0 Plugin reservation: ${method.pluginCode}`);
  assert.equal(reservation.registered, false);
}

assert.deepEqual(lifecycle.states, [
  'draft',
  'experimental',
  'internal',
  'pilot',
  'production',
  'deprecated',
  'archived'
]);
for (const method of registry.methods) {
  assert(lifecycle.states.includes(method.status));
}

const imrMethodByCode = new Map(
  imrScope.methods.map(method => [method.methodCode, method])
);
assert.equal(imrScope.stageStatus, 'conditional_passed');
assert.equal(imrMethodByCode.get('ASTROLOGY')?.serviceStatus, 'inactive');
assert.equal(imrMethodByCode.get('ASTROLOGY')?.productionEligible, false);
assert.equal(imrMethodByCode.get('BAZI')?.serviceStatus, 'inactive');
assert.equal(imrMethodByCode.get('BAZI')?.productionEligible, false);
assert.equal(imrMethodByCode.get('HUMAN_DESIGN')?.productionEligible, false);
assert.equal(imrMethodByCode.get('GENE_KEYS')?.status, 'not_planned');
assert.equal(
  imrMethodByCode.get('ZI_WEI_DOU_SHU')?.status,
  'deferred_out_of_scope'
);

assert.equal(hdrScope.stageStatus, 'conditional_passed');
assert.equal(hdrScope.methodCode, 'HUMAN_DESIGN');
assert.equal(hdrScope.serviceStatus, 'preserved');
assert.equal(hdrScope.calculationMode, 'external');
assert.equal(hdrScope.selfCalculationStatus, 'audit_required');

const validFixtureObjects = await Promise.all(
  validFixtures.map(file => readJson(`fixtures/mr-w1/valid/${file}`))
);
assert.equal(validFixtureObjects.length, registry.methods.length);
for (const [index, fixture] of validFixtureObjects.entries()) {
  assert.equal(
    validateMethod(fixture),
    true,
    `Valid fixture failed: ${validFixtures[index]}\n${validationErrors(validateMethod).join('\n')}`
  );
  assert.deepEqual(semanticIssues([fixture]), []);
  assert.deepEqual(fixture, registry.methods[index]);
}

for (const file of schemaInvalidFixtures) {
  const fixture = await readJson(`fixtures/mr-w1/invalid/${file}`);
  assert.equal(validateMethod(fixture), false, `Invalid fixture passed schema: ${file}`);
}
const geneKeysFixture = await readJson(
  'fixtures/mr-w1/invalid/method-gene-keys-runtime.json'
);
assert.equal(validateMethod(geneKeysFixture), true);
assert(
  semanticIssues([geneKeysFixture]).includes(
    'prohibited_method_identity:GENE_KEYS'
  )
);
const duplicateFixture = await readJson(
  'fixtures/mr-w1/invalid/duplicate-method-code.json'
);
assert.notEqual(
  new Set(duplicateFixture.methodCodes).size,
  duplicateFixture.methodCodes.length
);

assert.equal(
  packageJson.scripts['check:mr-w1'],
  'node scripts/check-mr-w1-method-registry.mjs'
);
for (const scriptName of [
  'precheck',
  'check',
  'postcheck',
  'check:pja',
  'check:knowledge-runtime',
  'check:mr-w0',
  'check:imr-w0',
  'check:hdr-w0'
]) {
  const command = packageJson.scripts[scriptName];
  assert.equal(typeof command, 'string', `Missing baseline script: ${scriptName}`);
  assert.equal(
    command.includes('check:mr-w1') ||
      command.includes('check-mr-w1-method-registry.mjs'),
    false,
    `MR-W1 must remain outside ${scriptName}.`
  );
}

assert.equal((readme.match(/<!-- MR-W1:BEGIN -->/g) ?? []).length, 1);
assert.equal((readme.match(/<!-- MR-W1:END -->/g) ?? []).length, 1);
assert(readme.includes('## MR-W1｜Method Registry'));
assert(readme.includes(baseline));

for (const heading of [
  '## Versioned population',
  '## Required fields',
  '## Registered Methods',
  '## Current authority alignment',
  '## Method and Plugin registration',
  '## Professional boundary',
  '## Production boundary',
  '## Exclusions',
  '## Default-chain isolation'
]) {
  assert(document.includes(heading), `MR-W1 document is missing ${heading}.`);
}
assert(document.includes(baseline));

console.log('✓ MR-W1 Method Registry passed.');
console.log('Single Method Registry validated.');
console.log('Six Method identities registered.');
console.log('Required field and version contracts validated.');
console.log('Lifecycle and license boundaries validated.');
console.log('IMR and HDR authority alignment validated.');
console.log('Plugin code reservations validated without activation.');
console.log('Production eligibility remains closed for all six Methods.');
console.log('MR-W0 contract seed and default-chain isolation preserved.');
