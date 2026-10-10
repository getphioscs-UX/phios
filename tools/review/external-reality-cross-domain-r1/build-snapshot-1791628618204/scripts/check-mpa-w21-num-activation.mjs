import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  BASELINE, readJson, sha256File
} from './lib/method-production-activation/mpa-num-activation-v1.mjs';
import {
  resolveNumCalculationAuthorities,
  independentNumBirthReference,
  evaluateNumActivationReadiness,
  assertNumProductionExecutionBlocked,
  MPA_NUM_ACTIVATION_DECISION_SCHEMA_VERSION
} from '../functions/method-production-activation/num-activation-runtime.js';
import {
  createNumBirthNumberRuntime,
  NUM_BIRTH_NUMBER_RUNTIME_CODE
} from '../functions/core-method-runtime/num-birth-number-runtime.js';

const root = 'content/professional/method-production-activation';
const contract = readJson(`${root}/contracts/mpa-num-activation-v1.json`);
const readinessRegistry = readJson(`${root}/registries/mpa-method-activation-readiness-registry-v1.json`);
const readinessSchema = readJson(`${root}/schemas/mpa-method-activation-readiness-v1.schema.json`);
const authorityRegistry = readJson(`${root}/registries/mpa-calculation-data-authority-registry-v1.json`);
const authorityResolutionRecord = readJson(`${root}/registries/mpa-num-calculation-authority-resolution-v1.json`);
const comparison = readJson(`${root}/registries/mpa-num-cross-implementation-evidence-v1.json`);
const regression = readJson(`${root}/registries/mpa-num-regression-freeze-v1.json`);
const fixtureReconciliation = readJson(`${root}/audits/mpa-w21-num-fixture-reconciliation-v1.json`);
const fixtures = readJson(`${root}/fixtures/mpa-w21-num-activation-fixture-corpus-v1.1.json`);
const sourceFixtures = readJson(`${root}/fixtures/mpa-reference-fixture-corpus-v1.json`);
const acceptance = readJson(`${root}/acceptance/mpa-w21-num-activation-acceptance-v1.json`);
const methodRegistry = readJson(`${root}/registries/method-registry-v2.json`);
const capabilityMatrix = readJson(`${root}/registries/mpa-method-capability-matrix-v1.json`);
const legacyFreeze = readJson('content/professional/core-method-runtime/num-production-freeze-v1.json');

assert.equal(contract.work, 'MPA-W21');
assert.equal(readinessSchema.properties.schemaVersion.const, MPA_NUM_ACTIVATION_DECISION_SCHEMA_VERSION);
assert.equal(readinessSchema.properties.work.const, 'MPA-W21');
assert.equal(readinessSchema.properties.productionEligible.const, false);
assert.equal(contract.baselineCommit, BASELINE);
assert.equal(contract.method.methodCode, 'NUMEROLOGY');
assert.equal(contract.activationSemantics.createsProductionEligibility, false);
assert.equal(contract.activationSemantics.createsProductionExecutionAuthority, false);
assert.equal(contract.activationSemantics.createsProfessionalEligibility, false);
assert.equal(contract.rules.legacyNumFreezeMutationAllowed, false);
assert.equal(contract.rules.w12HistoricalFixtureCorpusMayBeRewritten, false);
assert.equal(contract.rules.productionExecutionBeforeW27Forbidden, true);

// Historical W12 corpus is preserved exactly; W21 records an explicit versioned correction.
assert.equal(
  sha256File(`${root}/fixtures/mpa-reference-fixture-corpus-v1.json`),
  '4fc6d5ac30b5628d7c517d7ef757648834f2975bb0c74fb50cc60c64876b754a'
);
const oldEdge = sourceFixtures.fixtures.find(item => item.fixtureId === 'NUM-EDGE-LEAP-001');
assert.equal(oldEdge.expected.lifePath, 4);
assert.equal(fixtureReconciliation.predecessor.recordedExpectedLifePath, 4);
assert.equal(fixtureReconciliation.successor.correctedExpectedLifePath, 6);
assert.equal(fixtureReconciliation.preservation.w12CorpusRewritten, false);
assert.equal(fixtureReconciliation.preservation.productionEligibilityCreated, false);
assert.equal(fixtures.predecessor.sha256, '4fc6d5ac30b5628d7c517d7ef757648834f2975bb0c74fb50cc60c64876b754a');
assert.equal(fixtures.fixtures.find(item => item.fixtureId === 'NUM-W21-EDGE-LEAP-001').expected.lifePath, 6);

// Resolve NUM calculation authorities through W11 authority codes; do not rely on ungoverned magic constants.
const artifactDigests = {
  'content/professional/core-method-runtime/num-cycle-policy-registry-v1.json':
    sha256File('content/professional/core-method-runtime/num-cycle-policy-registry-v1.json')
};
const authorityResolution = resolveNumCalculationAuthorities({ authorityRegistry, artifactDigests });
assert.deepEqual(authorityResolution.authorityCodes,
  ['NUMERIC_REDUCTION_RULES_V1', 'NUMERIC_CYCLE_RULES_V1']);
assert.equal(authorityResolution.externalCalculationDatasetRequired, false);
assert.equal(authorityResolution.productionExecutionAuthorityCreated, false);
assert.deepEqual(
  authorityResolutionRecord.authorityBindings.map(item => item.authorityCode),
  authorityResolution.authorityCodes
);
assert.equal(authorityResolutionRecord.licenseDecision.externalCommercialLicensePassClaimed, false);
assert.equal(authorityResolutionRecord.effects.productionEligibilityCreated, false);

// Execute all W21 birth fixtures against both legacy deterministic validation runtime and an independent governed recalculation.
const runtime = createNumBirthNumberRuntime();
for (const fixture of fixtures.fixtures) {
  const birthDate = fixture.input.birthDate;
  const independent = independentNumBirthReference({ birthDate, authorityResolution });
  const birthRecord = {
    authority: 'SHARED_DATA_AUTHORITY', status: 'verified', methodOwner: null, pluginOwner: null,
    recordId: `W21-${fixture.fixtureId}`, recordType: 'BIRTH_RECORD', recordVersion: '1.0.0',
    payload: { birthDate }
  };
  const request = {
    calculationId: `W21-${fixture.fixtureId}`,
    runtimeCode: NUM_BIRTH_NUMBER_RUNTIME_CODE,
    executionMode: 'validation',
    inputRecords: [birthRecord]
  };
  if (fixture.expected.status === 'ERROR') {
    assert.equal(independent.status, 'ERROR', fixture.fixtureId);
    assert.equal(independent.errorCode, fixture.expected.errorCode, fixture.fixtureId);
    await assert.rejects(() => runtime.calculate(request), /birthDate is not a valid calendar date/, fixture.fixtureId);
    continue;
  }
  const first = await runtime.calculate(request);
  const second = await runtime.calculate(request);
  const actual = {
    status: 'PASS',
    lifePath: first.output.numbers.lifePath.reducedValue,
    birthdayNumber: first.output.numbers.birthdayNumber.reducedValue,
    attitudeNumber: first.output.numbers.attitudeNumber.reducedValue
  };
  assert.deepEqual(actual, {
    status: fixture.expected.status,
    lifePath: fixture.expected.lifePath,
    birthdayNumber: fixture.expected.birthdayNumber,
    attitudeNumber: fixture.expected.attitudeNumber
  }, fixture.fixtureId);
  assert.deepEqual(independent, actual, `INDEPENDENT_COMPARISON:${fixture.fixtureId}`);
  assert.equal(first.outputDigest, second.outputDigest, `DETERMINISM:${fixture.fixtureId}`);
}
assert.equal(comparison.status, 'EXACT_MATCH_METHOD_ACTIVATION_EVIDENCE');
assert.equal(comparison.productionComparisonSatisfiedForMethodSpecificReadiness, true);
assert.equal(comparison.effects.productionEligibilityCreated, false);

// Freeze the exact NUM validation/regression implementation set used by W21.
for (const item of regression.fingerprints) {
  assert.equal(sha256File(item.path), item.sha256, `NUM_W21_REGRESSION_DRIFT:${item.path}`);
}
for (const alias of regression.checkerAliases) {
  const pkg = readJson('package.json');
  const command = pkg.scripts[alias];
  assert.ok(command?.startsWith('node '), `NUM_CHECKER_ALIAS_MISSING:${alias}`);
  const script = command.slice('node '.length);
  const run = spawnSync(process.execPath, [script], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(run.status, 0, `${alias}\n${run.stdout}\n${run.stderr}`);
}
assert.equal(regression.status, 'PASS_METHOD_SPECIFIC_ACTIVATION_EVIDENCE');
assert.equal(regression.rules.productionEligibilityCreated, false);

// Historical method and capability authority remain unchanged; W21 uses a separate readiness registry.
const numMethod = methodRegistry.methods.find(item => item.methodCode === 'NUMEROLOGY');
assert.equal(numMethod.state, 'ACTIVATION_CANDIDATE');
assert.equal(numMethod.productionEligible, false);
assert.equal(numMethod.professionalEligible, false);
const numCapabilities = capabilityMatrix.methods.find(item => item.methodCode === 'NUMEROLOGY');
assert.equal(numCapabilities.capabilities.CALCULATION.state, 'IMPLEMENTED_VALIDATION_ONLY');
assert.equal(numCapabilities.capabilities.PROJECTION.state, 'IMPLEMENTED_VALIDATION_ONLY');
assert.equal(numCapabilities.capabilities.PROFESSIONAL.state, 'BLOCKED');
assert.equal(legacyFreeze.productionStatus, 'blocked');
assert.equal(legacyFreeze.executionMode, 'validation_only');
assert.equal(legacyFreeze.freezeRules.inPlaceMutationAllowed, false);

const gates = {
  registrationSuccessor: true,
  canonicalInput: true,
  consentPurpose: true,
  calculationAuthorityResolver: true,
  determinism: true,
  fixtureCorpus: true,
  validationHarness: true,
  regression: true,
  crossImplementationComparison: true,
  projectionFreeze: true,
  interpretationBoundary: true,
  meaningKnowledgeBoundary: true,
  professionalSeparation: true
};
const decision = evaluateNumActivationReadiness({
  gates,
  evidenceReferences: [
    `${root}/registries/mpa-num-calculation-authority-resolution-v1.json`,
    `${root}/fixtures/mpa-w21-num-activation-fixture-corpus-v1.1.json`,
    `${root}/registries/mpa-num-regression-freeze-v1.json`,
    `${root}/registries/mpa-num-cross-implementation-evidence-v1.json`
  ]
});
assert.equal(decision.schemaVersion, MPA_NUM_ACTIVATION_DECISION_SCHEMA_VERSION);
assert.equal(decision.decision, 'READY_FOR_MPA_W26_ELIGIBILITY_DECISION');
assert.equal(decision.methodSpecificReady, true);
assert.equal(decision.productionEligible, false);
assert.equal(decision.productionExecutionAllowed, false);
assert.equal(decision.globalEligibilityGate, 'MPA-W26_REQUIRED');
assert.equal(decision.productionExecutionGate, 'MPA-W27_REQUIRED');
assert.equal(decision.professionalEligible, false);
assert.equal(decision.professionalReleaseAllowed, false);
assert.equal(decision.publicEligible, false);
assert.throws(() => assertNumProductionExecutionBlocked('production'),
  /MPA_W27_PRODUCTION_EXECUTION_GATE_REQUIRED/);
assert.equal(assertNumProductionExecutionBlocked('validation'), true);

const registeredReadiness = readinessRegistry.entries.find(item => item.methodCode === 'NUMEROLOGY');
assert.equal(registeredReadiness.decision, decision.decision);
assert.equal(registeredReadiness.methodSpecificReady, true);
assert.equal(registeredReadiness.productionEligible, false);
assert.equal(registeredReadiness.globalGates['MPA-W26'], 'REQUIRED');
assert.equal(registeredReadiness.globalGates['MPA-W27'], 'REQUIRED');

assert.equal(acceptance.baselineCommit, BASELINE);
assert.equal(acceptance.status,
  'ACCEPT_NUM_METHOD_SPECIFIC_ACTIVATION_READY_FOR_W26_NO_PRODUCTION_EXECUTION');
assert.equal(acceptance.acceptedFacts.methodSpecificReadyForW26, true);
assert.equal(acceptance.acceptedFacts.productionEligible, false);
assert.equal(acceptance.acceptedFacts.productionExecutionAllowed, false);
assert.equal(acceptance.acceptedFacts.professionalEligible, false);
assert.equal(acceptance.nextWork, 'MPA-W22_AST_ACTIVATION');

const pkg = readJson('package.json');
assert.equal(pkg.scripts['check:mpa-w21'], 'node scripts/check-mpa-w21-num-activation.mjs');
assert.equal(pkg.scripts['check:mpa-num-activation'], 'npm run check:mpa-w21');
const segments = String(pkg.scripts['check:mpa'] || '').split(' && ');
const requiredSegments = [
  'npm run check:mpa-foundation',
  'npm run check:mpa-input-calculation',
  'npm run check:mpa-validation-evidence',
  'npm run check:mpa-projection-integration',
  'npm run check:mpa-num-activation'
];
assert.deepEqual(segments.slice(0, requiredSegments.length), requiredSegments);
assert.equal(String(pkg.scripts.postcheck || '').includes('check:mpa'), false,
  'MPA remains outside global postcheck before W30.');

console.log('✓ MPA-W21 NUM Activation passed.');
console.log('  NUM method-specific activation evidence is ready for MPA-W26 eligibility decision.');
console.log('  Production eligibility remains false; W26 is required and Production execution remains blocked until W27.');
console.log('  W12 leap-year fixture discrepancy is reconciled through a versioned successor, not by rewriting history.');
