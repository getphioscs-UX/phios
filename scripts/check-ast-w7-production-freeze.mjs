import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const manifest = await readJson(
  'content/professional/core-method-runtime/ast-production-freeze-v1.json'
);

assert.equal(manifest.contract, 'PHI-OS-AST-PRODUCTION-FREEZE-v1');
assert.equal(manifest.freezeVersion, '1.0.0');
assert.equal(manifest.stageCode, 'AST-W7');
assert.equal(manifest.status, 'AST Frozen v1');
assert.equal(manifest.productionStatus, 'blocked');
assert.equal(manifest.executionMode, 'validation_only');
assert.match(manifest.baseline.commit, /^[a-f0-9]{40}$/);
assert.equal(manifest.nextStage, null);

assert.equal(manifest.productionGates.commercialLicensePassed, true);
for (const gate of [
  'sharedRuntimeImplemented',
  'validationPassed',
  'regressionPassed',
  'productionReady',
  'professionalReady',
  'productionExecutionAllowed',
  'professionalReleaseAllowed'
]) {
  assert.equal(
    manifest.productionGates[gate],
    false,
    `AST-W7 production gate must remain false: ${gate}`
  );
}

assert.equal(manifest.freezeRules.checkerReadOnly, true);
assert.equal(manifest.freezeRules.currentFilesRequired, true);
assert.equal(
  manifest.freezeRules.historicalGitFileComparisonRequired,
  false
);
assert.equal(manifest.freezeRules.hashOnlyRepairForbidden, true);
assert.equal(manifest.freezeRules.semanticValidationRequired, true);
assert.equal(manifest.freezeRules.registryBypassForbidden, true);
assert.equal(manifest.freezeRules.implicitAstrologyDefaultsForbidden, true);
assert.equal(
  manifest.freezeRules.productionEligibilityPromotionForbidden,
  true
);
assert.equal(
  manifest.freezeRules.futureChangeRequiresVersionedSuccessor,
  true
);
assert.equal(manifest.successorPolicy.inPlaceMutationAllowed, false);

const frozenFiles = Object.values(manifest.frozenScope).flat();
assert.equal(new Set(frozenFiles).size, frozenFiles.length);
assert.ok(frozenFiles.length >= 35, 'AST-W7 frozen scope is incomplete.');
for (const file of frozenFiles) {
  try {
    await fs.access(path.join(root, file));
  } catch {
    throw new Error(`AST_W7_FROZEN_FILE_MISSING:${file}`);
  }
}

/* W0: Foundation remains audited but not activated. */
const foundation = await readJson(
  'content/professional/core-method-runtime/ast-runtime-manifest-v1.json'
);
assert.equal(foundation.stageCode, 'AST-W0');
assert.equal(foundation.activation.pluginActivated, false);
assert.equal(foundation.activation.sharedRuntimeImplemented, false);
assert.equal(foundation.activation.validationPassed, false);
assert.equal(foundation.activation.regressionPassed, false);
assert.equal(foundation.activation.productionEligible, false);
assert.equal(foundation.activation.professionalReady, false);
assert.equal(foundation.policyDefaults.fabricatedDefaultsAllowed, false);

/* W1: Astronomy establishes context only. */
const astronomy = await readJson(
  'content/professional/core-method-runtime/ast-astronomy-runtime-v1.json'
);
assert.equal(astronomy.stageCode, 'AST-W1');
assert.deepEqual(astronomy.execution.allowedModes, ['validation']);
assert.equal(astronomy.execution.productionExecutionAllowed, false);
assert.equal(astronomy.scope.createsJulianDay, true);
assert.equal(astronomy.scope.createsPlanetPositions, false);
assert.equal(astronomy.scope.createsHouseCusps, false);
assert.equal(astronomy.scope.createsAspects, false);
assert.equal(astronomy.scope.createsProjection, false);

/* W2: Planet policies remain explicit and validation-only. */
const planet = await readJson(
  'content/professional/core-method-runtime/ast-planet-runtime-v1.json'
);
assert.equal(planet.stageCode, 'AST-W2');
assert.equal(planet.requiredPolicies.implicitDefaultsAllowed, false);
assert.deepEqual(planet.execution.allowedModes, ['validation']);
assert.equal(planet.execution.productionExecutionAllowed, false);
assert.equal(planet.scope.createsPlanetLongitude, true);
assert.equal(planet.scope.createsHousePlacement, false);
assert.equal(planet.scope.createsAspects, false);
assert.equal(planet.scope.createsProjection, false);

/* W3: House calculation requires explicit policies and exact observer. */
const house = await readJson(
  'content/professional/core-method-runtime/ast-house-runtime-v1.json'
);
assert.equal(house.stageCode, 'AST-W3');
assert.equal(house.houseReadiness.topocentricObserverRequired, true);
assert.equal(house.houseReadiness.exactBirthTimeRequired, true);
assert.equal(house.houseReadiness.fabricatedBirthTimeAllowed, false);
assert.equal(house.requiredPolicies.implicitDefaultsAllowed, false);
assert.deepEqual(house.execution.allowedModes, ['validation']);
assert.equal(house.execution.productionExecutionAllowed, false);
assert.equal(house.scope.createsAspects, false);
assert.equal(house.scope.createsProjection, false);

/* W4A: Aspect Governance is frozen with exact-only validation Orb. */
const aspectGovernance = await readJson(
  'content/professional/core-method-runtime/ast-aspect-governance-v1.json'
);
const aspectGovernanceFreeze = await readJson(
  'content/professional/core-method-runtime/ast-aspect-governance-freeze-v1.json'
);
assert.equal(aspectGovernance.stageCode, 'AST-W4A');
assert.equal(
  aspectGovernance.status,
  'governance_frozen_runtime_not_started'
);
assert.equal(
  aspectGovernance.validationBoundary.maximumAuthorizedOrbDegrees,
  0
);
assert.equal(aspectGovernance.validationBoundary.exactOnly, true);
assert.equal(
  aspectGovernance.runtimeContract.registryReadRequired,
  true
);
assert.equal(
  aspectGovernance.runtimeContract.hardCodedAspectAnglesAllowed,
  false
);
assert.equal(
  aspectGovernance.runtimeContract.hardCodedOrbAllowed,
  false
);
assert.equal(
  aspectGovernance.runtimeContract.localPolicyOverrideAllowed,
  false
);
assert.equal(
  aspectGovernanceFreeze.status,
  'AST Aspect Governance Frozen v1'
);
assert.equal(aspectGovernanceFreeze.productionStatus, 'blocked');

/* W4B: Runtime reads Governance and remains validation-only. */
const aspect = await readJson(
  'content/professional/core-method-runtime/ast-aspect-runtime-v1.json'
);
assert.equal(aspect.stageCode, 'AST-W4B');
assert.equal(aspect.governanceAuthority.registryReadRequired, true);
assert.equal(aspect.governanceAuthority.runtimeMayInventPolicy, false);
assert.equal(
  aspect.currentPolicyBoundary.orbPolicyCode,
  'EXACT_ONLY_VALIDATION_V1'
);
assert.equal(
  aspect.currentPolicyBoundary.maximumAuthorizedOrbDegrees,
  0
);
assert.equal(aspect.currentPolicyBoundary.minorAspectsAllowed, false);
assert.deepEqual(aspect.execution.allowedModes, ['validation']);
assert.equal(aspect.execution.productionExecutionAllowed, false);
assert.equal(aspect.scope.createsProjection, false);

/* W5: Projection uses the frozen Shared Projection Runtime. */
const projection = await readJson(
  'content/professional/core-method-runtime/ast-projection-runtime-v1.json'
);
assert.equal(projection.stageCode, 'AST-W5');
assert.equal(
  projection.projectionAuthority.runtimeCode,
  'SHARED_PROJECTION_RUNTIME'
);
assert.deepEqual(
  projection.projectionTypes,
  ['PLANET', 'HOUSE', 'ASPECT']
);
assert.equal(
  projection.projectionAuthority.syntheticCombinedCalculationAllowed,
  false
);
assert.equal(projection.execution.productionExecutionAllowed, false);
assert.equal(projection.boundaries.createsInterpretation, false);
assert.equal(projection.boundaries.createsProfessionalConclusion, false);

/* W6: Professional integration cannot create a parallel release path. */
const professional = await readJson(
  'content/professional/core-method-runtime/ast-professional-integration-v1.json'
);
assert.equal(professional.stageCode, 'AST-W6');
assert.equal(
  professional.professionalAuthority.runtimeCode,
  'SHARED_PROFESSIONAL_RUNTIME'
);
assert.equal(professional.professionalAuthority.parallelRuntimeAllowed, false);
assert.equal(professional.currentGovernanceResult.releaseStatus, 'blocked');
assert.equal(professional.boundaries.directReleaseAllowed, false);
assert.equal(professional.boundaries.productionEligibilityChanged, false);

/* IMR remains the current authority. */
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);
const astrology = eligibility.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.ok(astrology, 'Astrology eligibility record is required.');
assert.equal(astrology.commercialLicensePassed, true);
assert.equal(astrology.sharedRuntimeImplemented, false);
assert.equal(astrology.validationPassed, false);
assert.equal(astrology.regressionPassed, false);
assert.equal(astrology.productionReady, false);
assert.equal(astrology.professionalReady, false);
assert.equal(astrology.eligibilityStatus, 'blocked');
assert.equal(astrology.productionAuthorityCreated, false);

/* Shared Runtime and Governance freezes remain authoritative. */
const mrFreeze = await readJson(
  'content/professional/method-runtime/method-runtime-freeze-v1.json'
);
const imrFreeze = await readJson(
  'content/professional/method-governance/imr-method-governance-freeze-v1.json'
);
assert.equal(mrFreeze.status, 'MR Frozen v1');
assert.equal(imrFreeze.status, 'IMR Frozen v1');

/* Runtime code must preserve explicit fail-closed guards. */
const astronomyRuntime = await read(
  'functions/core-method-runtime/ast-astronomy-runtime.js'
);
const planetRuntime = await read(
  'functions/core-method-runtime/ast-planet-runtime.js'
);
const houseRuntime = await read(
  'functions/core-method-runtime/ast-house-runtime.js'
);
const aspectRuntime = await read(
  'functions/core-method-runtime/ast-aspect-runtime.js'
);
const projectionRuntime = await read(
  'functions/core-method-runtime/ast-projection-runtime.js'
);
const professionalRuntime = await read(
  'functions/core-method-runtime/ast-professional-integration-runtime.js'
);

assert.ok(
  astronomyRuntime.includes('AST_ASTRONOMY_PRODUCTION_EXECUTION_FORBIDDEN')
);
assert.ok(
  planetRuntime.includes('AST_PLANET_PRODUCTION_EXECUTION_FORBIDDEN')
);
assert.ok(
  houseRuntime.includes('AST_HOUSE_PRODUCTION_EXECUTION_FORBIDDEN')
);
assert.ok(
  aspectRuntime.includes('AST_ASPECT_PRODUCTION_EXECUTION_FORBIDDEN')
);
assert.ok(
  projectionRuntime.includes('AST_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN')
);
assert.ok(
  professionalRuntime.includes('AST_METHOD_NOT_PROFESSIONALLY_ELIGIBLE')
);
assert.ok(professionalRuntime.includes('SHARED_PROFESSIONAL_RUNTIME'));
assert.ok(
  !professionalRuntime.includes('parallelProfessionalRuntimeCreated: true')
);

console.log('✓ AST-W7 Production Freeze passed.');
console.log(`  Status: ${manifest.status}`);
console.log(`  Production: ${manifest.productionStatus}`);
console.log(`  Execution mode: ${manifest.executionMode}`);
console.log(`  Frozen files: ${frozenFiles.length}`);
console.log('  AST-W0 through AST-W6 are frozen without granting Production or Professional eligibility.');
