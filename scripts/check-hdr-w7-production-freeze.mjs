import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifestPath =
  'content/professional/core-method-runtime/hdr-production-freeze-v1.json';

const normalize = source =>
  source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const manifest = await readJson(manifestPath);

assert.equal(manifest.contract, 'PHI-OS-HDR-PRODUCTION-FREEZE-v1');
assert.equal(manifest.freezeVersion, '1.0.0');
assert.equal(manifest.stageCode, 'HDR-W7');
assert.equal(manifest.status, 'HDR Frozen v1');
assert.equal(manifest.productionStatus, 'blocked');
assert.equal(manifest.executionMode, 'validation_only');
assert.match(manifest.baseline.commit, /^[a-f0-9]{40}$/);
assert.equal(manifest.nextStage, null);

for (const [gate, value] of Object.entries(manifest.productionGates)) {
  assert.equal(value, false, `HDR-W7 production gate must remain false: ${gate}`);
}
assert.equal(manifest.freezeRules.checkerReadOnly, true);
assert.equal(manifest.freezeRules.hashOnlyRepairForbidden, true);
assert.equal(manifest.freezeRules.semanticValidationRequired, true);
assert.equal(manifest.freezeRules.productionEligibilityPromotionForbidden, true);
assert.equal(manifest.freezeRules.futureChangeRequiresVersionedSuccessor, true);
assert.equal(manifest.successorPolicy.inPlaceMutationAllowed, false);

const frozenFiles = Object.values(manifest.frozenScope).flat();
assert.equal(new Set(frozenFiles).size, frozenFiles.length);
assert.ok(frozenFiles.length >= 30, 'HDR-W7 frozen scope is incomplete.');

for (const file of frozenFiles) {
  try {
    await read(file);
  } catch {
    throw new Error(`HDR_W7_FROZEN_FILE_MISSING:${file}`);
  }
}

/*
 * HDR-W7 is a semantic Production Boundary Freeze.
 *
 * The baseline commit remains recorded as historical lineage, but the checker
 * does not compare every current file with `git show <old-baseline>:<file>`.
 * A restored or versioned file may validly post-date that historical commit.
 *
 * Integrity is enforced below through:
 * - required current-file presence;
 * - closed schemas and controlled values;
 * - validation-only execution;
 * - explicit production fail-closed guards;
 * - frozen MR and IMR authority;
 * - versioned-successor policy.
 */
/* W0: Foundation remains audit-only and not activated. */
const foundation = await readJson(
  'content/professional/core-method-runtime/hdr-runtime-manifest-v1.json'
);
assert.equal(foundation.stageCode, 'HDR-W0');
assert.equal(foundation.activation.productionEligible, false);

/* W1: Astronomy creates facts only. */
const astronomy = await readJson(
  'content/professional/core-method-runtime/hdr-astronomy-runtime-v1.json'
);
assert.equal(astronomy.stageCode, 'HDR-W1');
assert.equal(astronomy.boundaries.astronomyOnly, true);
assert.equal(astronomy.boundaries.designMomentCreated, false);
assert.equal(astronomy.boundaries.gateMappingCreated, false);
assert.equal(astronomy.boundaries.projectionCreated, false);
assert.equal(astronomy.boundaries.providerAllowed, false);
assert.equal(astronomy.boundaries.aiAllowed, false);

/* W2: 88-degree solar arc, never fixed 88 days. */
const designMoment = await readJson(
  'content/professional/core-method-runtime/hdr-design-moment-runtime-v1.json'
);
assert.equal(designMoment.stageCode, 'HDR-W2');
assert.equal(designMoment.solver.targetSolarArcDegrees, 88);
assert.equal(designMoment.solver.fixedEightyEightDaySubtractionAllowed, false);
assert.equal(designMoment.output.createsGateMapping, false);
assert.equal(designMoment.output.createsProjection, false);

/* W3 and W4 remain validation-only and adapter-led. */
const gate = await readJson(
  'content/professional/core-method-runtime/hdr-gate-runtime-v1.json'
);
assert.equal(gate.stageCode, 'HDR-W3');
assert.deepEqual(gate.execution.allowedModes, ['validation']);
assert.equal(gate.execution.productionExecutionAllowed, false);
assert.equal(gate.mappingAuthority.embeddedGateSequenceAllowed, false);
assert.equal(gate.mappingAuthority.embeddedProprietaryMappingAllowed, false);
assert.equal(gate.scope.createsBodyGraph, false);
assert.equal(gate.scope.createsProjection, false);

const bodyGraph = await readJson(
  'content/professional/core-method-runtime/hdr-bodygraph-runtime-v1.json'
);
assert.equal(bodyGraph.stageCode, 'HDR-W4');
assert.deepEqual(bodyGraph.execution.allowedModes, ['validation']);
assert.equal(bodyGraph.execution.productionExecutionAllowed, false);
assert.equal(bodyGraph.structureAuthority.embeddedChannelTableAllowed, false);
assert.equal(bodyGraph.structureAuthority.embeddedCenterRulesAllowed, false);
assert.equal(bodyGraph.structureAuthority.embeddedAuthorityRulesAllowed, false);
assert.equal(bodyGraph.scope.createsBodyGraph, true);
assert.equal(bodyGraph.scope.createsProjection, false);

/* W5 must use the frozen Shared Projection Runtime and canonical types. */
const projection = await readJson(
  'content/professional/core-method-runtime/hdr-projection-runtime-v1.json'
);
assert.equal(projection.stageCode, 'HDR-W5');
assert.equal(
  projection.projectionAuthority.runtimeCode,
  'SHARED_PROJECTION_RUNTIME'
);
assert.deepEqual(
  projection.projectionTypes,
  ['GATE', 'CHANNEL', 'CENTER', 'AUTHORITY', 'PROFILE']
);
assert.equal(projection.execution.productionExecutionAllowed, false);
assert.equal(projection.boundaries.createsInterpretation, false);
assert.equal(projection.boundaries.createsProfessionalConclusion, false);

/* W6 is an integration gate, not an independent professional runtime. */
const professional = await readJson(
  'content/professional/core-method-runtime/hdr-professional-integration-v1.json'
);
assert.equal(professional.stageCode, 'HDR-W6');
assert.equal(
  professional.professionalAuthority.runtimeCode,
  'SHARED_PROFESSIONAL_RUNTIME'
);
assert.equal(professional.professionalAuthority.parallelRuntimeAllowed, false);
assert.equal(professional.currentGovernanceResult.releaseStatus, 'blocked');
assert.equal(professional.boundaries.directReleaseAllowed, false);
assert.equal(professional.boundaries.productionEligibilityChanged, false);

/* Frozen IMR remains the authority for current blocked eligibility. */
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);
const humanDesign = eligibility.methods.find(
  item => item.methodCode === 'HUMAN_DESIGN'
);
assert.ok(humanDesign, 'Human Design eligibility record is required.');
assert.equal(humanDesign.productionReady, false);
assert.equal(humanDesign.professionalReady, false);
assert.equal(humanDesign.validationPassed, false);
assert.equal(humanDesign.regressionPassed, false);

/* Runtime code must preserve explicit fail-closed production guards. */
const gateRuntime = await read(
  'functions/core-method-runtime/hdr-gate-runtime.js'
);
const bodyGraphRuntime = await read(
  'functions/core-method-runtime/hdr-bodygraph-runtime.js'
);
const projectionRuntime = await read(
  'functions/core-method-runtime/hdr-projection-runtime.js'
);
const professionalRuntime = await read(
  'functions/core-method-runtime/hdr-professional-integration-runtime.js'
);

assert.ok(gateRuntime.includes('HDR_GATE_PRODUCTION_EXECUTION_FORBIDDEN'));
assert.ok(bodyGraphRuntime.includes('HDR_BODYGRAPH_PRODUCTION_EXECUTION_FORBIDDEN'));
assert.ok(projectionRuntime.includes('HDR_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN'));
assert.ok(professionalRuntime.includes('HDR_METHOD_NOT_PROFESSIONALLY_ELIGIBLE'));
assert.ok(professionalRuntime.includes('SHARED_PROFESSIONAL_RUNTIME'));
assert.ok(!professionalRuntime.includes('parallelProfessionalRuntimeCreated: true'));

console.log('✓ HDR-W7 Production Freeze passed.');
console.log(`  Status: ${manifest.status}`);
console.log(`  Production: ${manifest.productionStatus}`);
console.log(`  Execution mode: ${manifest.executionMode}`);
console.log(`  Frozen files: ${frozenFiles.length}`);
console.log('  HDR-W0 through HDR-W6 are frozen without granting Production or Professional eligibility.');
