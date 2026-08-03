import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = process.cwd();
const mrRoot = 'content/professional/method-runtime';
const baseline = '38d5f465cdb9a8db140e589f1f41f2e998237ab2';

const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const exists = file => fs.access(path.join(root, file)).then(() => true, () => false);

const requiredDocuments = [
  'docs/method-runtime/MR-W0-METHOD-RUNTIME-CONSTITUTION.md',
  'docs/method-runtime/METHOD-RUNTIME-ARCHITECTURE.md',
  'docs/method-runtime/METHOD-RUNTIME-LAYERS.md',
  'docs/method-runtime/METHOD-RUNTIME-GOVERNANCE.md',
  'docs/method-runtime/METHOD-PLUGIN-CONTRACT.md'
];

const requiredContracts = [
  `${mrRoot}/method-runtime-principles.json`,
  `${mrRoot}/method-runtime-boundary.json`,
  `${mrRoot}/method-runtime-lifecycle.json`,
  `${mrRoot}/method-capability-model.json`,
  `${mrRoot}/method-registry.json`,
  `${mrRoot}/method-plugin-registry.json`,
  `${mrRoot}/method-plugin-contract.schema.json`
];

for (const file of [...requiredDocuments, ...requiredContracts]) {
  assert.equal(await exists(file), true, `Missing MR-W0 file: ${file}`);
}

const [
  principles,
  boundary,
  lifecycle,
  capabilities,
  methodRegistry,
  pluginRegistry,
  pluginSchema,
  packageJson,
  constitution,
  architecture,
  layersDocument,
  governance,
  pluginContractDocument,
  readme
] = await Promise.all([
  readJson(`${mrRoot}/method-runtime-principles.json`),
  readJson(`${mrRoot}/method-runtime-boundary.json`),
  readJson(`${mrRoot}/method-runtime-lifecycle.json`),
  readJson(`${mrRoot}/method-capability-model.json`),
  readJson(`${mrRoot}/method-registry.json`),
  readJson(`${mrRoot}/method-plugin-registry.json`),
  readJson(`${mrRoot}/method-plugin-contract.schema.json`),
  readJson('package.json'),
  read(requiredDocuments[0]),
  read(requiredDocuments[1]),
  read(requiredDocuments[2]),
  read(requiredDocuments[3]),
  read(requiredDocuments[4]),
  read('README.md')
]);

assert.equal(principles.stageCode, 'MR-W0');
assert.equal(principles.status, 'frozen');
assert.equal(principles.runtimeCode, 'METHOD_RUNTIME');

const expectedPrinciples = [
  {
    code: 'MR-P01-SINGLE-RUNTIME',
    statement: 'Method Runtime 是唯一 Method 平台。'
  },
  {
    code: 'MR-P02-PLUGIN-REGISTRATION',
    statement: '所有 Method 必须以 Plugin 注册。'
  },
  {
    code: 'MR-P03-DEFINITION-FIRST',
    statement: 'Method Definition 必须先于 Runtime。'
  },
  {
    code: 'MR-P04-SHARED-DATA-AUTHORITY',
    statement: 'Data Authority 必须唯一。'
  },
  {
    code: 'MR-P05-DETERMINISTIC-CALCULATION',
    statement: 'Calculation 必须完全确定性。'
  },
  {
    code: 'MR-P06-PROJECTION-SEPARATION',
    statement: 'Projection 不等于 Interpretation。'
  },
  {
    code: 'MR-P07-INTERPRETATION-NOT-CONCLUSION',
    statement: 'Interpretation 不等于 Professional Conclusion。'
  },
  {
    code: 'MR-P08-PROVIDER-NOT-CALCULATION',
    statement: 'Provider 不参与 Calculation。'
  },
  {
    code: 'MR-P09-INDEPENDENT-PROFESSIONAL-REVIEW',
    statement: 'Professional Review 必须独立。'
  },
  {
    code: 'MR-P10-ALL-PLUGINS-PASS-IMR',
    statement: '所有 Plugin 必须通过 IMR。'
  },
  {
    code: 'MR-P11-UNIFIED-LIFECYCLE',
    statement: '所有 Plugin 必须遵守统一 Lifecycle。'
  },
  {
    code: 'MR-P12-RUNTIME-INDEPENDENCE',
    statement: 'Method Runtime 永远独立于 Journey、Knowledge 与 Professional Workspace。'
  }
];

assert.equal(principles.principles.length, 12, 'MR-W0 must freeze exactly twelve principles.');
for (const [index, expected] of expectedPrinciples.entries()) {
  const actual = principles.principles[index];
  assert.equal(actual.number, index + 1, `Principle ${index + 1} number changed.`);
  assert.equal(actual.code, expected.code, `Principle ${index + 1} code changed.`);
  assert.equal(
    actual.statementZhHans,
    expected.statement,
    `Principle ${index + 1} statement changed.`
  );
  assert.equal(typeof actual.rule, 'string');
  assert(actual.rule.length > 20, `Principle ${index + 1} has no governed rule.`);
  assert(
    constitution.includes(`${index + 1}. ${expected.statement}`),
    `Constitution does not contain Principle ${index + 1} exactly.`
  );
}

assert.equal(boundary.runtimeIdentity.runtimeCode, 'METHOD_RUNTIME');
assert.equal(boundary.runtimeIdentity.runtimeVersion, '1.0.0');
assert.equal(boundary.runtimeIdentity.singleton, true);
assert.equal(boundary.runtimeIdentity.pluginRegistrationRequired, true);
assert.equal(boundary.runtimeIdentity.perMethodRuntimeAllowed, false);
assert.equal(pluginRegistry.runtimes.length, 1, 'Method Runtime must be unique.');
assert.deepEqual(pluginRegistry.runtimes[0], {
  runtimeCode: 'METHOD_RUNTIME',
  runtimeVersion: '1.0.0',
  singleton: true
});
assert.equal(pluginRegistry.registryCode, 'METHOD_PLUGIN_REGISTRY');
assert.deepEqual(pluginRegistry.registrations, []);
assert.equal(pluginRegistry.registrationPolicy.runtimeForkAllowed, false);
assert.equal(
  pluginRegistry.registrationPolicy.methodSpecificCalculationEngineRunsInsideSharedRuntime,
  true
);

assert.equal(methodRegistry.registryCode, 'METHOD_REGISTRY');
assert.equal(methodRegistry.populationAuthority, 'MR-W1');
assert.deepEqual(methodRegistry.methods, []);
assert.deepEqual(methodRegistry.requiredFields, [
  'methodCode',
  'methodVersion',
  'status',
  'runtimeVersion',
  'projectionVersion',
  'requiresProfessional',
  'licenseStatus'
]);

const expectedLayerOrder = [
  'Definition',
  'Data',
  'Calculation',
  'Projection',
  'Interpretation',
  'Professional'
];
assert.deepEqual(capabilities.layerOrder, expectedLayerOrder);
assert.deepEqual(
  capabilities.layers.map(layer => layer.code),
  expectedLayerOrder
);
assert.deepEqual(
  capabilities.layers.map(layer => layer.order),
  [1, 2, 3, 4, 5, 6]
);
assert.equal(capabilities.layers[0].name, 'Method Definition');
assert.equal(capabilities.layers[1].runtimeOwner, 'SHARED_DATA_AUTHORITY');
assert.equal(capabilities.layers[1].belongsToIndividualMethod, false);

const calculationLayer = capabilities.layers[2];
assert.equal(calculationLayer.runtimeOwner, 'SHARED_CALCULATION_RUNTIME');
assert.equal(calculationLayer.aiAllowed, false);
assert.equal(calculationLayer.workersAiAllowed, false);
assert.equal(calculationLayer.promptAllowed, false);
assert.equal(calculationLayer.interpretationAllowed, false);
assert.equal(calculationLayer.repeatability, '100_percent');

const projectionLayer = capabilities.layers[3];
assert.equal(projectionLayer.runtimeOwner, 'SHARED_PROJECTION_RUNTIME');
assert.equal(projectionLayer.interpretationAllowed, false);
assert.equal(projectionLayer.professionalAuthority, false);

const interpretationLayer = capabilities.layers[4];
assert.equal(interpretationLayer.runtimeOwner, 'SHARED_INTERPRETATION_RUNTIME');
assert.equal(interpretationLayer.output, 'INTERPRETATION_CANDIDATE');
assert.equal(interpretationLayer.directReleaseAllowed, false);
assert.deepEqual(interpretationLayer.allowedAiProviders, ['WORKERS_AI', 'OPENAI']);

const professionalLayer = capabilities.layers[5];
assert.equal(professionalLayer.runtimeOwner, 'SHARED_PROFESSIONAL_RUNTIME');
assert.equal(professionalLayer.insideMethodRuntime, false);
assert.equal(professionalLayer.authorizedHumanRequired, true);
assert.equal(professionalLayer.professionalWorkspaceDirectAiReadAllowed, false);

assert.deepEqual(boundary.authority, {
  constitution: 'PHI_OS_GOVERNANCE',
  methodDefinition: 'IMR_APPROVED_METHOD_DEFINITION',
  data: 'SHARED_DATA_AUTHORITY',
  calculation: 'SHARED_CALCULATION_RUNTIME',
  projection: 'SHARED_PROJECTION_RUNTIME',
  interpretation: 'SHARED_INTERPRETATION_RUNTIME',
  professional: 'SHARED_PROFESSIONAL_RUNTIME',
  release: 'AUTHORIZED_HUMAN_VIA_PROFESSIONAL_RUNTIME'
});
assert.equal(boundary.boundary.aiCalculationAllowed, false);
assert.equal(boundary.boundary.workersAiCalculationAllowed, false);
assert.equal(boundary.boundary.promptCalculationAllowed, false);
assert.equal(boundary.boundary.projectionMayContainInterpretation, false);
assert.equal(boundary.boundary.projectionProfessionalAuthority, false);
assert.equal(boundary.boundary.interpretationOutput, 'INTERPRETATION_CANDIDATE');
assert.equal(boundary.boundary.interpretationDirectReleaseAllowed, false);
assert.equal(boundary.boundary.professionalRuntimeIndependent, true);
assert.equal(boundary.boundary.professionalWorkspaceDirectProviderAccessAllowed, false);

for (const dependency of [
  'journeyRuntime',
  'knowledgeRuntime',
  'professionalWorkspace'
]) {
  assert.equal(
    boundary.dependencies[dependency].required,
    false,
    `Method Runtime must not depend on ${dependency}.`
  );
}
assert.equal(
  boundary.dependencies.professionalRuntime.required,
  false,
  'Professional Runtime must remain an independent handoff.'
);

assert.deepEqual(
  boundary.providerBoundary.calculationProhibitedProviders,
  ['OPENAI', 'WORKERS_AI', 'PROMPT']
);
assert.equal(boundary.providerBoundary.aiMayCreateCalculationFacts, false);
assert.equal(boundary.providerBoundary.aiMayGuessMissingMethodData, false);
assert.equal(boundary.providerBoundary.aiMayPromoteProjectionToProfessional, false);
assert.equal(boundary.providerBoundary.aiMayDirectlyReleaseInterpretation, false);
assert.equal(boundary.providerBoundary.providerFailureMustNotFabricateOutput, true);

const expectedStates = [
  'draft',
  'experimental',
  'internal',
  'pilot',
  'production',
  'deprecated',
  'archived'
];
assert.deepEqual(lifecycle.states, expectedStates);
assert.equal(lifecycle.initialState, 'draft');
assert.equal(lifecycle.terminalState, 'archived');
const stateSet = new Set(expectedStates);
const transitionKeys = new Set();
for (const transition of lifecycle.transitions) {
  assert(stateSet.has(transition.from), `Unknown lifecycle source: ${transition.from}`);
  assert(stateSet.has(transition.to), `Unknown lifecycle target: ${transition.to}`);
  const key = `${transition.from}->${transition.to}`;
  assert.equal(transitionKeys.has(key), false, `Duplicate lifecycle transition: ${key}`);
  transitionKeys.add(key);
}
assert.equal(transitionKeys.has('draft->production'), false);
assert.equal(
  lifecycle.transitions.some(transition => transition.from === 'archived'),
  false
);
assert.equal(lifecycle.guards.productionImrGateRequired, true);
assert.equal(lifecycle.guards.productionLicenseGateRequired, true);

const frozenPluginFields = [
  'pluginCode',
  'pluginVersion',
  'runtimeVersion',
  'projectionVersion',
  'status',
  'licenseStatus',
  'dependencies'
];
for (const field of frozenPluginFields) {
  assert(
    pluginSchema.required.includes(field),
    `Plugin Contract does not require ${field}.`
  );
}
for (const field of [
  'imrStatus',
  'methodDefinitionVersion',
  'dataAuthority',
  'authority',
  'calculationPolicy',
  'projectionPolicy',
  'interpretationPolicy',
  'professionalPolicy',
  'capabilities'
]) {
  assert(
    pluginSchema.required.includes(field),
    `Governed Plugin Contract does not require ${field}.`
  );
}
assert.equal(pluginSchema.properties.runtimeVersion.const, '1.0.0');
assert.equal(pluginSchema.properties.dataAuthority.const, 'SHARED_DATA_AUTHORITY');
assert.equal(
  pluginSchema.properties.dependencies.properties.journeyRuntime.const,
  false
);
assert.equal(
  pluginSchema.properties.dependencies.properties.knowledgeRuntime.const,
  false
);
assert.equal(
  pluginSchema.properties.dependencies.properties.professionalWorkspace.const,
  false
);
assert.equal(
  pluginSchema.properties.calculationPolicy.properties.providerParticipation.const,
  false
);
assert.equal(
  pluginSchema.properties.calculationPolicy.properties.aiAllowed.const,
  false
);
assert.equal(
  pluginSchema.properties.projectionPolicy.properties.containsInterpretation.const,
  false
);
assert.equal(
  pluginSchema.properties.interpretationPolicy.properties.professionalConclusion.const,
  false
);
assert.equal(
  pluginSchema.properties.professionalPolicy.properties.independentReview.const,
  true
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validatePlugin = ajv.compile(pluginSchema);
const validFixtureDirectory = path.join(root, 'fixtures/mr-w0/valid');
const invalidFixtureDirectory = path.join(root, 'fixtures/mr-w0/invalid');
const validFixtureNames = (await fs.readdir(validFixtureDirectory)).sort();
const invalidFixtureNames = (await fs.readdir(invalidFixtureDirectory)).sort();
assert.deepEqual(validFixtureNames, ['astrology.json', 'bazi.json', 'human-design.json']);
assert.deepEqual(invalidFixtureNames, [
  'plugin-ai-calculation.json',
  'plugin-missing-runtime.json',
  'plugin-no-authority.json',
  'plugin-no-lifecycle.json'
]);

const orderIndex = new Map(expectedLayerOrder.map((layer, index) => [layer, index]));
for (const fixtureName of validFixtureNames) {
  const fixture = await readJson(`fixtures/mr-w0/valid/${fixtureName}`);
  const valid = validatePlugin(fixture);
  assert.equal(
    valid,
    true,
    `Valid Plugin fixture failed: ${fixtureName}: ${JSON.stringify(validatePlugin.errors)}`
  );
  assert(
    fixture.imrStatus === 'approved' || fixture.imrStatus === 'production_eligible',
    `${fixtureName} did not pass IMR.`
  );
  assert.equal(fixture.dataAuthority, 'SHARED_DATA_AUTHORITY');
  assert.equal(fixture.calculationPolicy.providerParticipation, false);
  assert.equal(fixture.professionalPolicy.independentReview, true);
  for (let index = 1; index < fixture.capabilities.length; index += 1) {
    assert(
      orderIndex.get(fixture.capabilities[index - 1]) <
        orderIndex.get(fixture.capabilities[index]),
      `${fixtureName} bypasses or reorders Method Layers.`
    );
  }
}

const invalidErrors = new Map();
for (const fixtureName of invalidFixtureNames) {
  const fixture = await readJson(`fixtures/mr-w0/invalid/${fixtureName}`);
  const valid = validatePlugin(fixture);
  assert.equal(valid, false, `Invalid Plugin fixture passed: ${fixtureName}`);
  invalidErrors.set(
    fixtureName,
    (validatePlugin.errors ?? []).map(error => ({
      instancePath: error.instancePath,
      keyword: error.keyword,
      missingProperty: error.params?.missingProperty
    }))
  );
}
assert(
  invalidErrors.get('plugin-missing-runtime.json').some(
    error => error.keyword === 'required' && error.missingProperty === 'runtimeVersion'
  )
);
assert(
  invalidErrors.get('plugin-ai-calculation.json').some(
    error => error.keyword === 'const' && error.instancePath.startsWith('/calculationPolicy/')
  )
);
assert(
  invalidErrors.get('plugin-no-authority.json').some(
    error => error.keyword === 'required' && error.missingProperty === 'authority'
  )
);
assert(
  invalidErrors.get('plugin-no-lifecycle.json').some(
    error => error.keyword === 'required' && error.missingProperty === 'status'
  )
);

assert.equal(boundary.productionContract.imrProductionEligibilityRequired, true);
assert.deepEqual(
  boundary.productionContract.allowedProductionLicenseStatus,
  ['approved', 'not_required']
);
assert.equal(boundary.productionContract.repeatabilityEvidenceRequired, true);
assert.equal(boundary.productionContract.providerBoundaryValidationRequired, true);
assert.equal(boundary.productionContract.professionalReleaseHandoffRequired, true);
assert.equal(boundary.futurePluginPolicy.constitutionAmendmentByPluginAllowed, false);
assert.equal(boundary.futurePluginPolicy.newRuntimeByPluginAllowed, false);
assert.equal(boundary.futurePluginPolicy.productionWithoutImrAllowed, false);
assert.equal(
  boundary.futurePluginPolicy.geneKeysRuntimePolicy,
  'translation_layer_over_human_design_projection_only'
);

for (const heading of [
  '## Runtime Identity',
  '## Runtime Layer',
  '## Authority',
  '## Boundary',
  '## Plugin Contract',
  '## Lifecycle',
  '## Provider Boundary',
  '## Production Contract',
  '## Future Plugin Policy',
  '## Twelve Principles'
]) {
  assert(constitution.includes(heading), `Constitution is missing ${heading}.`);
}
assert(constitution.includes(baseline));
assert(architecture.includes('Method Runtime Platform'));
assert(architecture.includes('Method Projection'));
assert(layersDocument.includes('100% repeatable'));
assert(governance.includes('Every Plugin must pass IMR before Production.'));
for (const field of frozenPluginFields) {
  assert(pluginContractDocument.includes(field));
}

assert.equal(
  packageJson.scripts['check:mr-w0'],
  'node scripts/check-mr-w0-method-runtime-constitution.mjs'
);
for (const scriptName of [
  'check',
  'check:pja',
  'check:knowledge-runtime'
]) {
  const command = packageJson.scripts[scriptName];
  assert.equal(typeof command, 'string', `Missing baseline script: ${scriptName}`);
  assert.equal(
    command.includes('check:mr-w0') ||
      command.includes('check-mr-w0-method-runtime-constitution.mjs'),
    false,
    `MR-W0 must remain outside ${scriptName}.`
  );
}
for (const scriptName of ['check:imr-w0', 'check:hdr-w0']) {
  const command = packageJson.scripts[scriptName];
  if (command === undefined) continue;
  assert.equal(typeof command, 'string', `Invalid optional script: ${scriptName}`);
  assert.equal(
    command.includes('check:mr-w0') ||
      command.includes('check-mr-w0-method-runtime-constitution.mjs'),
    false,
    `MR-W0 must remain outside ${scriptName}.`
  );
}
assert.equal(
  await exists('scripts/check-imr-w0-scope-data-algorithm-license-audit.mjs'),
  true,
  'The existing IMR-W0 checker authority must remain present.'
);
assert.equal(
  await exists('scripts/check-hdr-w0-human-design-runtime-foundation.mjs'),
  true,
  'The existing HDR-W0 checker authority must remain present.'
);

assert.equal((readme.match(/<!-- MR-W0:BEGIN -->/g) ?? []).length, 1);
assert.equal((readme.match(/<!-- MR-W0:END -->/g) ?? []).length, 1);
assert(readme.includes('## MR-W0｜Method Runtime Constitution'));
assert(readme.includes(baseline));

console.log('✓ MR-W0 Method Runtime Constitution passed.');
console.log('Method Runtime Platform established.');
console.log('Single Runtime Constitution validated.');
console.log('Plugin Contract validated.');
console.log('Authority Boundary validated.');
console.log('Layer Contract validated.');
console.log('Capability Model validated.');
console.log('Lifecycle validated.');
console.log('Provider Boundary validated.');
console.log('Production Contract validated.');
console.log('Future Plugin Policy validated.');
