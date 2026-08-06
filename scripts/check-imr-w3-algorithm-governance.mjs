import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const registryPath = 'content/professional/method-governance/imr-algorithm-governance-registry-v1.json';
const schemaPath = 'content/professional/method-governance/imr-algorithm-governance-registry-v1.schema.json';
const methodPath = 'content/professional/method-governance/imr-method-registry-v1.json';
const licensePath = 'content/professional/method-governance/imr-commercial-license-registry-v1.json';
const calculationPath = 'content/professional/method-runtime/shared-calculation-runtime-v1.json';

for (const file of [registryPath, schemaPath, methodPath, licensePath, calculationPath]) {
  assert(fs.existsSync(path.join(root, file)), `Missing IMR-W3 dependency: ${file}`);
}
const registry = readJson(registryPath);
const schema = readJson(schemaPath);
const methods = readJson(methodPath);
const calculationRuntime = readJson(calculationPath);

assert.equal(registry.stageCode, 'IMR-W3');
assert.equal(registry.registryCode, 'IMR_ALGORITHM_GOVERNANCE_REGISTRY');
assert.equal(registry.runtimeAuthority, false);
assert.equal(registry.governancePolicy.algorithmRegistrationCreatesExecutionAuthority, false);
assert.equal(registry.governancePolicy.validationRequiredBeforeProduction, true);
assert.equal(registry.governancePolicy.toleranceRequiredBeforeValidationPass, true);
assert.equal(registry.governancePolicy.referenceLineageRequired, true);
assert.equal(registry.governancePolicy.providerForbiddenInCalculation, true);
assert.equal(registry.governancePolicy.aiForbiddenInCalculation, true);
assert.equal(registry.governancePolicy.productionEligibilityGovernedBy, 'IMR-W4');
assert.equal(schema.properties.runtimeAuthority.const, false);

const methodByCode = new Map(methods.methods.map(item => [item.methodCode, item]));
const governed = new Map(registry.methods.map(item => [item.methodCode, item]));
assert.equal(governed.size, registry.methods.length, 'Duplicate IMR-W3 methodCode.');
assert.deepEqual([...governed.keys()].sort(), [...methodByCode.keys()].sort());

for (const item of registry.methods) {
  assert.equal(item.methodVersion, methodByCode.get(item.methodCode).version);
  assert.equal(item.productionAuthorityCreated, false);
  assert.equal(item.calculation.deterministicRequired, true);
  assert.equal(item.calculation.implementedInSharedRuntime, false);
  assert.equal(item.validation.fixturesRequired, true);
  assert.equal(item.validation.fixturesPassed, false);
  assert.equal(item.validation.regressionPassed, false);
  assert.equal(item.audit.independentReviewRequired, true);
  assert(Array.isArray(item.references));
}
assert.equal(governed.get('HUMAN_DESIGN').algorithmStatus, 'external_only');
assert.equal(governed.get('ASTROLOGY').algorithmStatus, 'pilot_candidate');
assert(governed.get('ASTROLOGY').references.some(ref => ref.referenceCode === 'NASA_JPL_HORIZONS'));
assert.equal(governed.get('ASTROLOGY').tolerance.value, null);
assert.equal(governed.get('BAZI').algorithmStatus, 'policy_candidate');
assert.equal(governed.get('BAZI').tolerance.value, 0);
for (const code of ['I_CHING','TAROT','PSYCHOLOGY']) {
  assert.equal(governed.get(code).algorithmStatus, 'not_defined');
  assert.equal(governed.get(code).tolerance.value, null);
}

assert.equal(calculationRuntime.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(calculationRuntime.determinism.repeatExecutionRequired, true);
assert.equal(calculationRuntime.determinism.canonicalInputDigestRequired, true);
assert.equal(calculationRuntime.determinism.outputDigestRequired, true);
assert.equal(calculationRuntime.providerBoundary.providerAllowed, false);
assert.equal(calculationRuntime.providerBoundary.aiUsed, false);
assert.equal(calculationRuntime.resultBoundary.createsProjection, false);
assert.equal(calculationRuntime.resultBoundary.createsInterpretation, false);
assert.equal(calculationRuntime.resultBoundary.createsProfessionalConclusion, false);

for (const forbidden of ['productionReady','professionalReady','migration','deprecation','release']) {
  assert.equal(Object.hasOwn(registry.governancePolicy, forbidden), false, `IMR-W3 must not own ${forbidden}`);
}

const pkg = readJson('package.json');
assert.equal(pkg.scripts?.['check:imr-w3'], 'node scripts/check-imr-w3-algorithm-governance.mjs');
console.log('✓ IMR-W3 Algorithm Governance passed.');
console.log(`  Governed algorithms: ${registry.methods.length}`);
console.log('  Calculation, Reference, Validation, Tolerance and Audit remain governance-only.');
