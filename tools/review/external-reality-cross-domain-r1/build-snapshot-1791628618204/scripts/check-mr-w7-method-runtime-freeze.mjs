import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const manifestPath =
  'content/professional/method-runtime/method-runtime-freeze-v1.json';

const normalize = source =>
  source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');

const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const digest = source => crypto
  .createHash('sha256')
  .update(normalize(source), 'utf8')
  .digest('hex');

const manifest = await readJson(manifestPath);

assert.equal(manifest.contract, 'PHI-OS-METHOD-RUNTIME-FREEZE-v1');
assert.equal(manifest.freezeVersion, '1.0.0');
assert.equal(manifest.stageCode, 'MR-W7');
assert.equal(manifest.status, 'MR Frozen v1');
assert.match(manifest.baseline.commit, /^[a-f0-9]{40}$/);
assert.equal(manifest.freezeRules.hashOnlyRepairForbidden, true);
assert.equal(manifest.freezeRules.semanticValidationRequired, true);
assert.equal(manifest.freezeRules.futureChangeRequiresVersionedSuccessor, true);
assert.equal(manifest.successorPolicy.inPlaceMutationAllowed, false);

const scopes = [
  'contracts',
  'projectionSchema',
  'pluginInterface',
  'registry',
  'calculationBoundary',
  'runtimeContinuity'
];
const frozenFiles = scopes.flatMap(scope => {
  const files = manifest.frozenScope[scope];
  assert.ok(Array.isArray(files) && files.length > 0, `${scope} must be frozen.`);
  return files;
});
assert.equal(new Set(frozenFiles).size, frozenFiles.length);

try {
  execFileSync('git', ['cat-file', '-e', `${manifest.baseline.commit}^{commit}`], {
    cwd: root,
    stdio: 'pipe'
  });
} catch {
  throw new Error(
    `MR_W7_BASELINE_COMMIT_UNAVAILABLE:${manifest.baseline.commit}`
  );
}

const frozenDigests = {};
for (const file of frozenFiles) {
  const current = await read(file);
  let baseline;
  try {
    baseline = execFileSync(
      'git',
      ['show', `${manifest.baseline.commit}:${file}`],
      { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
    );
  } catch {
    throw new Error(`MR_W7_BASELINE_FILE_UNAVAILABLE:${file}`);
  }
  assert.equal(
    normalize(current),
    normalize(baseline),
    `MR_W7_FROZEN_FILE_CHANGED:${file}`
  );
  frozenDigests[file] = digest(current);
}

/* Registry Seed: MR-W0 owns the frozen contract; MR-W1 owns population. */
const registry = await readJson(
  'content/professional/method-runtime/method-registry.json'
);
assert.equal(registry.registryCode, 'METHOD_REGISTRY');
assert.equal(registry.stageCode, 'MR-W0');
assert.equal(registry.populationAuthority, 'MR-W1');
assert.ok(Array.isArray(registry.requiredFields));
for (const field of [
  'methodCode',
  'methodVersion',
  'status',
  'runtimeVersion',
  'projectionVersion',
  'requiresProfessional',
  'licenseStatus'
]) {
  assert.ok(
    registry.requiredFields.includes(field),
    `Method Registry required field missing: ${field}`
  );
}
assert.ok(Array.isArray(registry.methods));
assert.ok(Array.isArray(registry.plannedMethods));
const plannedMethodCodes = registry.plannedMethods.map(item => item.methodCode);
assert.equal(
  new Set(plannedMethodCodes).size,
  plannedMethodCodes.length,
  'Method Registry planned methodCode values must be unique.'
);
for (const item of registry.plannedMethods) {
  assert.equal(typeof item.methodCode, 'string');
  assert.equal(typeof item.targetTrack, 'string');
}

/* Plugin Registry Seed: MR-W0 freezes the shared Plugin contract. */
const plugin = await readJson(
  'content/professional/method-runtime/method-plugin-registry.json'
);
assert.equal(plugin.registryCode, 'METHOD_PLUGIN_REGISTRY');
assert.equal(plugin.stageCode, 'MR-W0');
assert.equal(plugin.status, 'contract_frozen');
assert.ok(Array.isArray(plugin.runtimes) && plugin.runtimes.length === 1);
assert.equal(plugin.runtimes[0].runtimeCode, 'METHOD_RUNTIME');
assert.equal(plugin.runtimes[0].singleton, true);

assert.ok(Array.isArray(plugin.registrations));
assert.ok(Array.isArray(plugin.futurePlugins));
const futurePluginCodes = plugin.futurePlugins.map(item => item.pluginCode);
assert.equal(
  new Set(futurePluginCodes).size,
  futurePluginCodes.length,
  'Plugin Registry future pluginCode values must be unique.'
);
for (const item of plugin.futurePlugins) {
  assert.equal(typeof item.pluginCode, 'string');
  assert.equal(typeof item.method, 'string');
  assert.equal(item.registered, false);
}

assert.equal(plugin.registrationPolicy.registeredBeforeExecution, true);
assert.equal(plugin.registrationPolicy.imrEligibilityBeforeProduction, true);
assert.equal(
  plugin.registrationPolicy.registrationCreatesProductionAuthority,
  false
);
assert.equal(plugin.registrationPolicy.duplicatePluginCodeAllowed, false);
assert.equal(plugin.registrationPolicy.runtimeForkAllowed, false);
assert.equal(
  plugin.registrationPolicy.methodSpecificCalculationEngineRunsInsideSharedRuntime,
  true
);

assert.ok(Array.isArray(plugin.translationLayers));
for (const layer of plugin.translationLayers) {
  assert.equal(layer.createsRuntime, false);
}

/* Calculation Boundary: deterministic and unable to create later layers. */
const calculation = await read(
  'functions/method-runtime/shared-calculation-runtime.js'
);
for (const token of [
  'SHARED_CALCULATION_RUNTIME',
  'deterministic',
  'providerUsed',
  'aiUsed',
  'projectionCreated',
  'interpretationCreated',
  'professionalConclusionCreated'
]) {
  assert.ok(calculation.includes(token), `Calculation boundary missing: ${token}`);
}
assert.ok(
  /providerUsed\s*:\s*false/.test(calculation),
  'Calculation provider boundary must remain false.'
);
assert.ok(
  /aiUsed\s*:\s*false/.test(calculation),
  'Calculation AI boundary must remain false.'
);
assert.ok(
  /projectionCreated\s*:\s*false/.test(calculation),
  'Calculation must not create Projection.'
);

/* Projection Schema: stable Projection-only fields and complete Lineage. */
const projectionSchema = await readJson(
  'content/professional/method-runtime/canonical-projection-v1.schema.json'
);
const projectionSchemaText = JSON.stringify(projectionSchema);
for (const token of [
  'projectionType',
  'projectionCode',
  'projectionVersion',
  'projectionValue',
  'projectionSource',
  'projectionConfidence',
  'calculationId',
  'calculationRuntimeCode',
  'calculationRuntimeVersion',
  'methodCode',
  'pluginCode',
  'algorithmCode',
  'algorithmVersion',
  'inputDigest',
  'outputDigest'
]) {
  assert.ok(
    projectionSchemaText.includes(token),
    `Projection Schema missing: ${token}`
  );
}

/* Runtime separation and single Professional path. */
const projectionRuntime = await read(
  'functions/method-runtime/shared-projection-runtime.js'
);
assert.ok(projectionRuntime.includes('SHARED_PROJECTION_RUNTIME'));
assert.ok(projectionRuntime.includes('interpretationCreated'));
assert.ok(projectionRuntime.includes('professionalConclusionCreated'));

const interpretationRuntime = await read(
  'functions/method-runtime/shared-interpretation-runtime.js'
);
assert.ok(interpretationRuntime.includes('SHARED_INTERPRETATION_RUNTIME'));
assert.ok(interpretationRuntime.includes("candidateStatus: 'candidate'"));
assert.ok(interpretationRuntime.includes('professionalReportCreated: false'));
assert.ok(interpretationRuntime.includes('realityDecisionCreated: false'));

const professionalRuntime = await read(
  'functions/method-runtime/shared-professional-runtime.js'
);
for (const stage of [
  'PROFESSIONAL_REVIEW',
  'BOUNDARY_VALIDATION',
  'DELIVERABLE_ASSEMBLY',
  'PROFESSIONAL_SIGNATURE',
  'RELEASE'
]) {
  assert.ok(
    professionalRuntime.includes(stage),
    `Shared Professional Runtime missing: ${stage}`
  );
}
assert.ok(professionalRuntime.includes('SHARED_PROFESSIONAL_RUNTIME'));
assert.ok(professionalRuntime.includes('PROFESSIONAL_RUNTIME_SEQUENCE_VIOLATION'));
assert.ok(professionalRuntime.includes('PROFESSIONAL_SIGNATURE_DIGEST_MISMATCH'));

console.log('✓ MR-W7 Method Runtime Freeze passed.');
console.log(`  Status: ${manifest.status}`);
console.log(`  Baseline: ${manifest.baseline.commit}`);
console.log(`  Frozen files: ${frozenFiles.length}`);
console.log('  Contracts, Projection Schema, Plugin Interface, Registry and Calculation Boundary are frozen.');
