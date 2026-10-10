import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const audit = await readJson(
  'content/professional/core-method-runtime/ast-foundation-audit-v1.json'
);
const boundary = await readJson(
  'content/professional/core-method-runtime/ast-runtime-boundary-v1.json'
);
const manifest = await readJson(
  'content/professional/core-method-runtime/ast-runtime-manifest-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/ast-foundation-audit-v1.schema.json'
);
const methodRegistry = await readJson(
  'content/professional/method-governance/imr-method-registry-v1.json'
);
const commercial = await readJson(
  'content/professional/method-governance/imr-commercial-license-registry-v1.json'
);
const algorithm = await readJson(
  'content/professional/method-governance/imr-algorithm-governance-registry-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);
const scopeAudit = await readJson(
  'content/professional/method-audits/imr-w0-scope.json'
);
const algorithmAudit = await readJson(
  'content/professional/method-audits/imr-w0-algorithms.json'
);
const dataSources = await readJson(
  'content/professional/method-audits/imr-w0-data-sources.json'
);
const mrFreeze = await readJson(
  'content/professional/method-runtime/method-runtime-freeze-v1.json'
);
const imrFreeze = await readJson(
  'content/professional/method-governance/imr-method-governance-freeze-v1.json'
);

assert.equal(audit.stageCode, 'AST-W0');
assert.equal(audit.methodCode, 'ASTROLOGY');
assert.equal(audit.pluginCode, 'AST');
assert.equal(audit.status, 'foundation_audited_runtime_not_activated');
assert.equal(audit.auditConclusion.runtimeMayProceed, true);
assert.equal(audit.auditConclusion.nextStage, 'AST-W1');
assert.equal(audit.auditConclusion.productionActivationAllowed, false);
assert.equal(audit.auditConclusion.professionalReleaseAllowed, false);
assert.match(audit.baseline.commit, /^[a-f0-9]{40}$/);
assert.equal(
  schema.properties.schemaVersion.const,
  'PHI-OS-AST-FOUNDATION-AUDIT-v1.0.0'
);

const method = methodRegistry.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.ok(method);
assert.equal(method.owner.implementationTrack, 'AST');
assert.equal(method.status, 'experimental');
assert.equal(method.version, '0.1.0');
assert.equal(method.productionEligible, false);
assert.ok(method.dependencies.sharedRuntimeDependencies.includes(
  'SHARED_CALCULATION_RUNTIME'
));
assert.ok(method.dependencies.externalDependencies.includes(
  'ASTRONOMY_ENGINE_JS'
));

const license = commercial.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(license.licenseStatus, 'approved');
assert.equal(license.license.licenseType, 'MIT');
assert.equal(license.productionAuthorityCreated, false);
assert.ok(license.thirdPartyDependencies.some(
  item => item.dependencyCode === 'NASA_JPL_HORIZONS' &&
    item.licenseStatus === 'reference_only'
));

const governedAlgorithm = algorithm.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(governedAlgorithm.algorithmStatus, 'pilot_candidate');
assert.equal(
  governedAlgorithm.calculation.authority,
  'ASTRONOMY_ENGINE_JS'
);
assert.equal(
  governedAlgorithm.calculation.implementedInSharedRuntime,
  false
);
assert.equal(governedAlgorithm.validation.status, 'not_executed');
assert.equal(governedAlgorithm.validation.fixturesPassed, false);
assert.equal(governedAlgorithm.validation.regressionPassed, false);
assert.equal(governedAlgorithm.tolerance.value, null);

const governedEligibility = eligibility.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(governedEligibility.commercialLicensePassed, true);
assert.equal(governedEligibility.sharedRuntimeImplemented, false);
assert.equal(governedEligibility.validationPassed, false);
assert.equal(governedEligibility.regressionPassed, false);
assert.equal(governedEligibility.productionReady, false);
assert.equal(governedEligibility.professionalReady, false);

const scope = scopeAudit.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(scope.calculationStatus, 'audit_complete_pilot_selected');
assert.equal(scope.serviceStatus, 'inactive');
assert.equal(scope.productionEligible, false);

const candidateAlgorithm = algorithmAudit.algorithms.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(candidateAlgorithm.engine, 'ASTRONOMY_ENGINE_JS');
assert.equal(candidateAlgorithm.engineSelected, true);
assert.equal(candidateAlgorithm.deterministic, true);
assert.equal(candidateAlgorithm.policyStatus, 'incomplete');
assert.equal(candidateAlgorithm.validationStatus, 'not_started');
assert.equal(candidateAlgorithm.openAiCalculationAllowed, false);

const jpl = dataSources.sources.find(
  item => item.sourceCode === 'NASA_JPL_HORIZONS'
);
assert.equal(jpl.runtimeUse, 'validation_only');
assert.equal(jpl.productionDependency, false);
assert.equal(jpl.customerPayloadAllowed, false);

assert.equal(mrFreeze.status, 'MR Frozen v1');
assert.equal(imrFreeze.status, 'IMR Frozen v1');

assert.deepEqual(boundary.inputBoundary.required, [
  'birthDate',
  'birthTime',
  'birthLocation',
  'timezone'
]);
assert.equal(boundary.inputBoundary.fabricatedBirthTimeAllowed, false);
assert.equal(
  boundary.inputBoundary.unknownBirthTimePolicy,
  'fail_closed_for_houses_and_angles'
);
assert.deepEqual(boundary.calculationBoundary.orderedStages, [
  'BIRTH_DATA_NORMALIZATION',
  'ASTRONOMY',
  'PLANET',
  'HOUSE',
  'ASPECT'
]);
assert.equal(boundary.calculationBoundary.providerAllowed, false);
assert.equal(boundary.calculationBoundary.aiAllowed, false);
assert.equal(boundary.calculationBoundary.promptAllowed, false);
assert.equal(boundary.calculationBoundary.deterministicRequired, true);
assert.deepEqual(boundary.projectionBoundary.canonicalTypes, [
  'PLANET',
  'HOUSE',
  'ASPECT'
]);
assert.equal(
  boundary.projectionBoundary.sharedProjectionRuntimeRequired,
  true
);
assert.equal(boundary.projectionBoundary.interpretationCreated, false);
assert.equal(
  boundary.professionalBoundary.integrationStage,
  'AST-W6'
);
assert.equal(
  boundary.professionalBoundary.sharedProfessionalRuntimeRequired,
  true
);

assert.equal(manifest.runtimeCode, 'ASTROLOGY_RUNTIME');
assert.equal(manifest.dependencies.candidateEngine.license, 'MIT');
assert.equal(
  manifest.dependencies.validationReference.runtimeRole,
  'validation_only'
);
assert.equal(
  Object.values(manifest.policyDefaults).every(
    value => value === null || value === false
  ),
  true
);
assert.equal(manifest.activation.pluginRegistered, true);
assert.equal(manifest.activation.pluginActivated, false);
assert.equal(manifest.activation.sharedRuntimeImplemented, false);
assert.equal(manifest.activation.validationPassed, false);
assert.equal(manifest.activation.regressionPassed, false);
assert.equal(manifest.activation.productionEligible, false);
assert.equal(manifest.activation.professionalReady, false);
assert.equal(manifest.nextStage, 'AST-W1');
assert.deepEqual(
  manifest.pipeline.map(item => item.stageCode),
  ['AST-W0', 'AST-W1', 'AST-W2', 'AST-W3', 'AST-W4', 'AST-W5', 'AST-W6', 'AST-W7']
);

console.log('✓ AST-W0 Astrology Runtime Foundation Audit passed.');
console.log('  Existing IMR audit, MIT candidate engine and JPL validation reference are preserved.');
console.log('  Input, Calculation, Projection, Professional and Dependency boundaries are explicit.');
console.log('  Astrology is not activated, not Production Eligible and may proceed only to AST-W1 Astronomy Runtime.');
