import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const audit = await readJson(
  'content/professional/core-method-runtime/bzr-foundation-audit-v1.json'
);
const boundary = await readJson(
  'content/professional/core-method-runtime/bzr-runtime-boundary-v1.json'
);
const manifest = await readJson(
  'content/professional/core-method-runtime/bzr-runtime-manifest-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/bzr-foundation-audit-v1.schema.json'
);
const runtimeMethodRegistry = await readJson(
  'content/professional/method-runtime/method-registry-v1.json'
);
const pluginRegistry = await readJson(
  'content/professional/method-runtime/method-plugin-registry.json'
);
const governanceMethodRegistry = await readJson(
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
const versionManagement = await readJson(
  'content/professional/method-governance/imr-version-management-registry-v1.json'
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
const sharedData = await readJson(
  'content/professional/method-runtime/shared-data-authority-v1.json'
);
const mrFreeze = await readJson(
  'content/professional/method-runtime/method-runtime-freeze-v1.json'
);
const imrFreeze = await readJson(
  'content/professional/method-governance/imr-method-governance-freeze-v1.json'
);

assert.equal(audit.stageCode, 'BZR-W0');
assert.equal(audit.methodCode, 'BAZI');
assert.equal(audit.pluginCode, 'BZR');
assert.equal(audit.status, 'foundation_audited_runtime_not_activated');
assert.equal(audit.auditConclusion.runtimeMayProceed, true);
assert.equal(audit.auditConclusion.nextStage, 'BZR-W1');
assert.equal(audit.auditConclusion.productionActivationAllowed, false);
assert.equal(audit.auditConclusion.professionalReleaseAllowed, false);
assert.match(audit.baseline.commit, /^[a-f0-9]{40}$/);
assert.equal(
  schema.properties.schemaVersion.const,
  'PHI-OS-BZR-FOUNDATION-AUDIT-v1.0.0'
);

const runtimeMethod = runtimeMethodRegistry.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.ok(runtimeMethod);
assert.equal(runtimeMethod.pluginCode, 'BZR');
assert.equal(runtimeMethod.status, 'experimental');
assert.equal(runtimeMethod.calculationStatus, 'policy_candidate_validation_required');
assert.equal(runtimeMethod.productionEligible, false);

const reservedPlugin = pluginRegistry.futurePlugins.find(
  item => item.pluginCode === 'BZR'
);
assert.ok(reservedPlugin);
assert.equal(reservedPlugin.method, 'BaZi');
assert.equal(reservedPlugin.category, 'core');
assert.equal(reservedPlugin.registered, false);

const governedMethod = governanceMethodRegistry.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.ok(governedMethod);
assert.equal(governedMethod.owner.implementationTrack, 'BZR');
assert.equal(governedMethod.version, '0.1.0');
assert.equal(governedMethod.status, 'experimental');
assert.equal(governedMethod.productionEligible, false);
assert.deepEqual(
  governedMethod.dependencies.externalDependencies,
  []
);

const license = commercial.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.equal(license.licenseStatus, 'conditional');
assert.equal(license.commercialRights.commercialUse, 'conditional');
assert.equal(license.commercialRights.productUse, 'blocked');
assert.equal(license.usageScope.internalResearch, true);
assert.equal(license.usageScope.professionalService, false);
assert.equal(license.productionAuthorityCreated, false);
assert.ok(license.thirdPartyDependencies.some(
  item => item.dependencyCode === 'IANA_TZDB' &&
    item.licenseStatus === 'review_required'
));
assert.ok(license.thirdPartyDependencies.some(
  item => item.dependencyCode === 'ASTRONOMY_ENGINE_JS' &&
    item.licenseStatus === 'approved'
));

const governedAlgorithm = algorithm.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.equal(governedAlgorithm.algorithmStatus, 'policy_candidate');
assert.equal(
  governedAlgorithm.calculation.authority,
  'PHI_OS_BAZI_POLICY_V1'
);
assert.equal(
  governedAlgorithm.calculation.implementedInSharedRuntime,
  false
);
assert.equal(governedAlgorithm.validation.status, 'not_executed');
assert.equal(governedAlgorithm.validation.fixturesPassed, false);
assert.equal(governedAlgorithm.validation.regressionPassed, false);
assert.equal(governedAlgorithm.tolerance.type, 'boundary_exactness');
assert.equal(governedAlgorithm.tolerance.value, 0);
assert.equal(governedAlgorithm.productionAuthorityCreated, false);

const governedEligibility = eligibility.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.equal(governedEligibility.commercialLicensePassed, false);
assert.equal(governedEligibility.sharedRuntimeImplemented, false);
assert.equal(governedEligibility.validationPassed, false);
assert.equal(governedEligibility.regressionPassed, false);
assert.equal(governedEligibility.productionReady, false);
assert.equal(governedEligibility.professionalReady, false);
assert.equal(governedEligibility.eligibilityStatus, 'blocked');
assert.equal(governedEligibility.productionAuthorityCreated, false);

const version = versionManagement.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.equal(version.currentVersion, '0.1.0');
assert.equal(version.compatibilityStatus, 'compatible_with_mr_frozen_v1');
assert.equal(version.deprecated, false);

const scope = scopeAudit.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.equal(scope.calculationStatus, 'policy_candidate_frozen');
assert.equal(scope.serviceStatus, 'inactive');
assert.equal(scope.productionEligible, false);

const candidateAlgorithm = algorithmAudit.algorithms.find(
  item => item.methodCode === 'BAZI'
);
assert.equal(candidateAlgorithm.algorithmCode, 'BAZI-NATAL-v1');
assert.equal(candidateAlgorithm.deterministic, true);
assert.equal(candidateAlgorithm.engine, 'PHIOS_DETERMINISTIC_IMPLEMENTATION');
assert.equal(candidateAlgorithm.policyStatus, 'human_frozen_candidate');
assert.equal(candidateAlgorithm.validationStatus, 'not_started');
assert.equal(candidateAlgorithm.productionEligible, false);
assert.equal(candidateAlgorithm.openAiCalculationAllowed, false);
assert.equal(
  candidateAlgorithm.policy.methodFamily,
  'zi_ping_four_pillars'
);
assert.equal(
  candidateAlgorithm.policy.formalTimeBasis,
  'true_solar_time'
);
assert.equal(
  candidateAlgorithm.policy.yearBoundary,
  'exact_li_chun_instant'
);
assert.equal(
  candidateAlgorithm.policy.monthBoundary,
  'exact_twelve_jie_instants'
);
assert.equal(
  candidateAlgorithm.policy.unknownBirthTime.threePillarCalculationAllowed,
  true
);
assert.equal(
  candidateAlgorithm.policy.unknownBirthTime.fabricatedHourPillarProhibited,
  true
);
assert.equal(
  candidateAlgorithm.policy.luckStart.rounding,
  'no_rounding_in_engine'
);

const tzdb = dataSources.sources.find(
  item => item.sourceCode === 'IANA_TZDB'
);
assert.equal(tzdb.versionPolicy, 'version_must_be_recorded');
assert.equal(tzdb.runtimeUse, 'candidate');
assert.equal(tzdb.productionStatus, 'validation_required');

for (const dataCode of [
  'BIRTH_RECORD',
  'COORDINATE',
  'TIMEZONE',
  'DST',
  'TRUE_SOLAR_TIME',
  'ASTRONOMY',
  'CALENDAR'
]) {
  assert.ok(
    sharedData.domains.some(item => item.dataCode === dataCode),
    `Shared Data Authority missing domain: ${dataCode}`
  );
}

assert.deepEqual(boundary.inputBoundary.requiredForFourPillars, [
  'birthDate',
  'birthTime',
  'birthLocation',
  'timezone'
]);
assert.equal(
  boundary.inputBoundary.unknownBirthTimePolicy,
  'three_pillars_only_hour_unresolved'
);
assert.equal(boundary.inputBoundary.fabricatedBirthTimeAllowed, false);
assert.equal(boundary.inputBoundary.fabricatedHourPillarAllowed, false);
assert.deepEqual(
  boundary.inputBoundary.traditionalCalculationSexRequiredOnlyFor,
  ['luck_cycle_direction']
);
assert.deepEqual(boundary.calculationBoundary.orderedStages, [
  'CIVIL_TIME_NORMALIZATION',
  'TIMEZONE_AND_DST_RESOLUTION',
  'TRUE_SOLAR_TIME',
  'SOLAR_TERM_CONTEXT',
  'SOLAR_CALENDAR',
  'FOUR_PILLARS',
  'LUCK_CYCLE'
]);
assert.equal(boundary.calculationBoundary.providerAllowed, false);
assert.equal(boundary.calculationBoundary.aiAllowed, false);
assert.equal(boundary.calculationBoundary.promptAllowed, false);
assert.equal(boundary.calculationBoundary.deterministicRequired, true);
assert.equal(
  boundary.calendarBoundary.yearBoundary,
  'exact_li_chun_instant'
);
assert.equal(
  boundary.calendarBoundary.monthBoundary,
  'exact_twelve_jie_instants'
);
assert.equal(
  boundary.calendarBoundary.fixedGregorianMonthBoundaryAllowed,
  false
);
assert.deepEqual(boundary.projectionBoundary.canonicalTypes, [
  'STEM',
  'BRANCH',
  'PILLAR',
  'LUCK_CYCLE'
]);
assert.equal(
  boundary.projectionBoundary.sharedProjectionRuntimeRequired,
  true
);
assert.equal(
  boundary.professionalBoundary.integrationStage,
  'BZR-W5'
);
assert.equal(
  boundary.professionalBoundary.sharedProfessionalRuntimeRequired,
  true
);

assert.equal(manifest.runtimeCode, 'BAZI_RUNTIME');
assert.equal(
  manifest.policyAuthority.policyCode,
  'PHI_OS_BAZI_POLICY_V1'
);
assert.equal(manifest.policyAuthority.runtimeMayOverride, false);
assert.equal(manifest.policyAuthority.runtimeMayInventDefaults, false);
assert.equal(manifest.activation.methodRegistered, true);
assert.equal(manifest.activation.pluginReserved, true);
assert.equal(manifest.activation.pluginActivated, false);
assert.equal(manifest.activation.sharedRuntimeImplemented, false);
assert.equal(manifest.activation.validationPassed, false);
assert.equal(manifest.activation.regressionPassed, false);
assert.equal(manifest.activation.commercialLicensePassed, false);
assert.equal(manifest.activation.productionEligible, false);
assert.equal(manifest.activation.professionalReady, false);
assert.equal(manifest.nextStage, 'BZR-W1');
assert.deepEqual(
  manifest.pipeline.map(item => item.stageCode),
  ['BZR-W0','BZR-W1','BZR-W2','BZR-W3','BZR-W4','BZR-W5','BZR-W6']
);

assert.equal(mrFreeze.status, 'MR Frozen v1');
assert.equal(imrFreeze.status, 'IMR Frozen v1');

console.log('✓ BZR-W0 BaZi Runtime Foundation Audit passed.');
console.log('  Existing Zi Ping, true-solar-time, Li Chun, Jie and unknown-time policies are preserved.');
console.log('  Input, Calendar, Calculation, Projection, Professional and Dependency boundaries are explicit.');
console.log('  BaZi is not activated, not Production Eligible and may proceed only to BZR-W1 Solar Calendar Runtime.');
