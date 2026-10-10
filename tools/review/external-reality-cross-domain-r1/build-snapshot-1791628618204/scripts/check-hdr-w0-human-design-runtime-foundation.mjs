import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const foundationPath = 'content/professional/core-method-runtime/hdr-foundation-audit-v1.json';
const boundaryPath = 'content/professional/core-method-runtime/hdr-runtime-boundary-v1.json';
const manifestPath = 'content/professional/core-method-runtime/hdr-runtime-manifest-v1.json';
const schemaPath = 'content/professional/core-method-runtime/hdr-foundation-audit-v1.schema.json';

const [foundation, boundary, manifest, schema] = await Promise.all([
  readJson(foundationPath),
  readJson(boundaryPath),
  readJson(manifestPath),
  readJson(schemaPath)
]);

assert.equal(foundation.schemaVersion, 'PHI-OS-HDR-FOUNDATION-AUDIT-v1.0.0');
assert.equal(foundation.stageCode, 'HDR-W0');
assert.equal(foundation.status, 'foundation_audited_runtime_not_activated');
assert.match(foundation.baseline.commit, /^[a-f0-9]{40}$/);
assert.equal(foundation.methodIdentity.methodCode, 'HUMAN_DESIGN');
assert.equal(foundation.methodIdentity.pluginCode, 'HDR');
assert.equal(foundation.methodIdentity.runtimeTrack, 'HDR');

for (const field of ['birthDate', 'birthTime', 'birthLocation', 'timezone']) {
  assert.ok(foundation.inputBoundary.required.includes(field), `Missing HDR input: ${field}`);
}
assert.equal(foundation.inputBoundary.unknownBirthTimePolicy, 'fail_closed_for_full_chart');
assert.equal(foundation.inputBoundary.fabricatedBirthTimeForbidden, true);
assert.equal(foundation.inputBoundary.customerConsentRequired, true);

assert.deepEqual(foundation.calculationScope.sequence, [
  'BIRTH_DATA_NORMALIZATION',
  'PERSONALITY_ASTRONOMY',
  'DESIGN_MOMENT_SOLVER',
  'GATE_LINE_MAPPING',
  'BODYGRAPH_STRUCTURE'
]);
assert.equal(foundation.calculationScope.currentMode, 'external_only_preserved');
assert.equal(foundation.calculationScope.selfCalculationActivated, false);
assert.equal(foundation.calculationScope.fixedEightyEightDaySubtractionForbidden, true);
assert.equal(foundation.calculationScope.designMomentRule, 'backward_solar_arc_88_degrees');
assert.equal(foundation.calculationScope.advancedVariablePHS, 'deferred');

for (const type of ['GATE', 'CHANNEL', 'CENTER', 'AUTHORITY', 'PROFILE', 'BODYGRAPH']) {
  assert.ok(
    foundation.projectionScope.allowedFutureProjectionTypes.includes(type),
    `Missing future Projection type: ${type}`
  );
}
assert.equal(foundation.projectionScope.projectionRuntime, 'SHARED_PROJECTION_RUNTIME');
assert.equal(foundation.projectionScope.projectionCreatedThisStage, false);
assert.equal(foundation.projectionScope.interpretationCreatedThisStage, false);
assert.equal(foundation.projectionScope.professionalConclusionCreatedThisStage, false);

assert.equal(foundation.professionalScope.integrationStage, 'HDR-W6');
assert.equal(foundation.professionalScope.sharedProfessionalRuntimeRequired, true);
assert.equal(foundation.professionalScope.professionalReviewRequired, true);
assert.equal(foundation.professionalScope.releaseAllowedThisStage, false);
assert.equal(foundation.professionalScope.medicalDiagnosisForbidden, true);
assert.equal(foundation.professionalScope.actionAuthorizationForbidden, true);

for (const dependency of [
  'SHARED_DATA_AUTHORITY',
  'SHARED_CALCULATION_RUNTIME',
  'SHARED_PROJECTION_RUNTIME',
  'SHARED_INTERPRETATION_RUNTIME',
  'SHARED_PROFESSIONAL_RUNTIME'
]) {
  assert.ok(foundation.dependencies.shared.includes(dependency), `Missing dependency: ${dependency}`);
}
assert.ok(foundation.dependencies.external.includes('EXTERNAL_HUMAN_DESIGN_CALCULATION'));
assert.deepEqual(foundation.dependencies.futureHDRStages, [
  'HDR-W1', 'HDR-W2', 'HDR-W3', 'HDR-W4', 'HDR-W5', 'HDR-W6', 'HDR-W7'
]);

for (const rule of [
  'auditOnly',
  'registryLed',
  'governanceLed',
  'runtimeWriteForbidden',
  'providerCallForbidden',
  'aiCalculationForbidden',
  'productionEligibilityChangeForbidden',
  'frozenRuntimeMutationForbidden',
  'frozenGovernanceMutationForbidden'
]) {
  assert.equal(foundation.stageRules[rule], true, `HDR-W0 rule must be true: ${rule}`);
}

assert.equal(boundary.stageCode, 'HDR-W0');
assert.equal(boundary.runtimeCode, 'HUMAN_DESIGN_RUNTIME');
assert.equal(boundary.runtimeVersion, '0.0.0-foundation');
assert.equal(boundary.pluginCode, 'HDR');
assert.equal(boundary.status, 'not_activated');
assert.deepEqual(boundary.pipeline.map(item => item.stage), [
  'HDR-W1', 'HDR-W2', 'HDR-W3', 'HDR-W4', 'HDR-W5', 'HDR-W6', 'HDR-W7'
]);
assert.equal(boundary.pipeline.find(item => item.stage === 'HDR-W1')?.status, 'not_implemented');
assert.equal(
  boundary.pipeline.find(item => item.stage === 'HDR-W3')?.status,
  'blocked_pending_source_and_rights'
);
assert.equal(
  boundary.pipeline.find(item => item.stage === 'HDR-W4')?.status,
  'blocked_pending_source_and_rights'
);
for (const value of Object.values(boundary.separationRules)) assert.equal(value, true);
for (const operation of [
  'CALCULATE_CHART',
  'CREATE_PROJECTION',
  'CREATE_INTERPRETATION',
  'CREATE_PROFESSIONAL_CONCLUSION',
  'RELEASE_REPORT',
  'PUBLISH_SERVICE',
  'ACTIVATE_PLUGIN'
]) {
  assert.ok(boundary.prohibitedAtFoundation.includes(operation));
}

assert.equal(manifest.manifestCode, 'HDR_RUNTIME_MANIFEST');
assert.equal(manifest.status, 'foundation_only');
assert.equal(manifest.methodCode, 'HUMAN_DESIGN');
assert.equal(manifest.pluginCode, 'HDR');
assert.equal(manifest.sharedRuntimeCompatibility, 'MR Frozen v1');
assert.equal(manifest.governanceCompatibility, 'IMR Frozen v1');
assert.equal(manifest.nextStage, 'HDR-W1');
assert.equal(manifest.nextStageGate.astronomyOnly, true);
assert.equal(manifest.nextStageGate.gateMappingForbidden, true);
assert.equal(manifest.nextStageGate.bodyGraphForbidden, true);
assert.equal(manifest.nextStageGate.professionalIntegrationForbidden, true);
for (const value of Object.values(manifest.activation)) assert.equal(value, false);

assert.equal(schema.properties.schemaVersion.const, foundation.schemaVersion);
assert.equal(schema.properties.stageCode.const, 'HDR-W0');
assert.equal(schema.properties.status.const, foundation.status);

/* Preserve and consume the earlier HDR-W0 audit instead of replacing it. */
const legacyScope = await readJson('content/professional/method-audits/hdr-w0-scope.json');
const legacyLayers = await readJson('content/professional/method-audits/hdr-w0-calculation-layers.json');
const legacyRights = await readJson('content/professional/method-audits/hdr-w0-data-rights.json');
const legacyAi = await readJson('content/professional/method-audits/hdr-w0-ai-boundary.json');
const legacyDecision = await readJson('content/professional/method-audits/hdr-w0-decision-queue.json');
assert.equal(legacyScope.methodCode, 'HUMAN_DESIGN');
assert.equal(legacyScope.calculationMode, 'external');
assert.equal(legacyScope.stageStatus, 'conditional_passed');
assert.equal(
  legacyLayers.layers.find(item => item.layerCode === 'HD-L3-DESIGN-MOMENT')?.fixedDaysSubtractionAllowed,
  false
);
assert.equal(
  legacyRights.categories.find(item => item.categoryCode === 'GATE_LINE_MAPPING')?.selfCalculationEligibility,
  'blocked'
);
assert.equal(legacyAi.openAiCalculationAuthority, false);
assert.equal(
  legacyDecision.decisions.find(item => item.decisionCode === 'HDR_SELF_CALCULATION_GATE')?.selectedValue,
  'ASTRONOMY_CORE_ONLY'
);

/* Frozen governance is read-only and still blocks Production. */
const methodRegistry = await readJson('content/professional/method-governance/imr-method-registry-v1.json');
const licenseRegistry = await readJson('content/professional/method-governance/imr-commercial-license-registry-v1.json');
const algorithmRegistry = await readJson('content/professional/method-governance/imr-algorithm-governance-registry-v1.json');
const eligibilityRegistry = await readJson('content/professional/method-governance/imr-production-eligibility-registry-v1.json');
const method = methodRegistry.methods.find(item => item.methodCode === 'HUMAN_DESIGN');
const license = licenseRegistry.methods.find(item => item.methodCode === 'HUMAN_DESIGN');
const algorithm = algorithmRegistry.methods.find(item => item.methodCode === 'HUMAN_DESIGN');
const eligibility = eligibilityRegistry.methods.find(item => item.methodCode === 'HUMAN_DESIGN');
assert.equal(method.dependencies.pluginCode, 'HDR');
assert.equal(method.productionEligible, false);
assert.equal(license.licenseStatus, 'restricted');
assert.equal(license.productionAuthorityCreated, false);
assert.equal(algorithm.algorithmStatus, 'external_only');
assert.equal(algorithm.calculation.implementedInSharedRuntime, false);
assert.equal(algorithm.productionAuthorityCreated, false);
assert.equal(eligibility.productionReady, false);
assert.equal(eligibility.professionalReady, false);
assert.equal(eligibility.validationPassed, false);
assert.equal(eligibility.regressionPassed, false);
assert.equal(eligibility.productionAuthorityCreated, false);

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts?.['check:hdr-w0'],
  'node scripts/check-hdr-w0-human-design-runtime-foundation.mjs'
);

console.log('✓ HDR-W0 Human Design Runtime Foundation Audit passed.');
console.log('  Existing external Human Design calculation and frozen Governance remain preserved.');
console.log('  Input, Calculation, Projection, Professional and Dependency boundaries are explicit.');
console.log('  HDR is not activated, not Production Eligible and may proceed only to HDR-W1 Astronomy Runtime.');
