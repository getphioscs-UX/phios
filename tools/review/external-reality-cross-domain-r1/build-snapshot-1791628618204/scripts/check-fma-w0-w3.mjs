import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const BASE = '1d9b248f314308ef4f2a06354fb962ca46fff5c4';
const ROOT = 'content/governance/full-method-availability';

const w0 = json(`${ROOT}/audits/full-method-availability-authority-baseline-v1.json`);
const w1 = json(`${ROOT}/contracts/production-capability-status-contract-v2.json`);
const w2 = json(`${ROOT}/contracts/method-production-availability-contract-v1.json`);
const w3 = json(`${ROOT}/registries/canonical-method-production-scope-registry-v1.json`);
const acceptance = json(`${ROOT}/acceptance/fma-w0-w3-acceptance-v1.json`);
const batch = json(`${ROOT}/acceptance/fma-a-batch-acceptance-v1.json`);
const pcm = json('content/governance/production-capability-matrix/registries/production-capability-registry-v1.json');
const cmrFreeze = json('content/professional/canonical-meaning-runtime/freeze/cmr-w15-full-freeze-v1.json');

for (const doc of [w0, w1, w2, w3, acceptance, batch]) assert.equal(doc.baselineCommit, BASE, `${doc.work || doc.batch}: baseline drift`);
assert.equal(w0.work, 'FMA-W0');
assert.equal(w0.status, 'AUTHORITY_RECONCILED_SUCCESSOR_FOUNDATION_NO_HISTORICAL_REWRITE');
assert.equal(w0.currentMeaningBoundary.productionStatus, 'validation_only');
assert.equal(w0.currentMeaningBoundary.productionActivated, false);
assert.equal(w0.currentMeaningBoundary.successorRequiredForActivation, true);
assert.equal(cmrFreeze.productionStatus, 'validation_only');
assert.equal(cmrFreeze.productionActivated, false);
assert.equal(cmrFreeze.successorRequiredForActivation, true);
for (const ref of w0.auditedAuthorities) {
  assert.equal(fs.existsSync(ref.path), true, `FMA-W0 authority missing: ${ref.path}`);
  assert.equal(sha(ref.path), ref.sha256, `FMA-W0 authority drift: ${ref.path}`);
}
assert.equal(w0.invariants.historicalFreezeMutationAllowed, false);
assert.equal(w0.invariants.backendImplementationImpliesAvailability, false);
assert.equal(w0.invariants.projectionImpliesMeaning, false);
assert.equal(w0.invariants.meaningImpliesInterpretation, false);
assert.equal(w0.invariants.meaningImpliesProfessionalJudgment, false);

const baselineByPlugin = Object.fromEntries(w0.methods.map(x => [x.pluginCode, x]));
for (const plugin of ['AST','BZR','NUM']) {
  const m = baselineByPlugin[plugin];
  assert.ok(m, `FMA-W0 missing ${plugin}`);
  assert.equal(m.currentUserExecutable, true);
  assert.equal(m.currentFullyAvailable, false);
  assert.equal(m.meaningProductionStatus, 'validation_only');
}
assert.equal(baselineByPlugin.AST.validationMeaningMappingCount, 0);
assert.equal(baselineByPlugin.BZR.validationMeaningMappingCount, 29);
assert.equal(baselineByPlugin.NUM.validationMeaningMappingCount, 12);
assert.equal(baselineByPlugin.HDR.currentUserExecutable, false);
assert.equal(w0.reservedFutureMethods.find(x => x.runtimeCode === 'ZWR').state, 'DEFERRED_UNAVAILABLE_REQUIRES_INDEPENDENT_SUCCESSOR');

assert.equal(w1.work, 'FMA-W1');
assert.equal(w1.status, 'SUCCESSOR_CONTRACT_DEFINED_NOT_YET_CURRENT_PCM_REGISTRY');
assert.deepEqual(w1.dimensions.capabilityAvailability.values, ['AVAILABLE','LIMITED','PREVIEW','BLOCKED','COMING_LATER']);
assert.deepEqual(w1.dimensions.executionCompleteness.values, ['COMPLETE','PARTIAL','INPUT_REQUIRED','FAILED','UNAVAILABLE']);
assert.equal(w1.rules.missingBirthTimeMayReduceExecutionCompletenessWithoutReducingCapabilityAvailability, true);
assert.equal(w1.rules.globalCapabilityMayBeAvailableWhileOneExecutionIsPartial, true);
assert.equal(w1.rules.frontendMayNotInferCapabilityAvailabilityFromExecutionCompleteness, true);
assert.equal(w1.rules.pcmV1RemainsCurrentUntilVersionedRegistrySuccessor, true);
assert.equal(w1.currentRegistryUntilFMAW13, 'content/governance/production-capability-matrix/registries/production-capability-registry-v1.json');

assert.equal(w2.work, 'FMA-W2');
assert.deepEqual(w2.availableRequiredGates, ['authority','calculation','validated','projection','meaning','productionConsumer','frontendExecutable','acceptance']);
assert.equal(w2.decisionRule.AVAILABLE, 'ALL_REQUIRED_GATES_TRUE');
assert.equal(w2.decisionRule.OTHERWISE, 'FAIL_CLOSED_NON_AVAILABLE');
assert.ok(w2.prohibitions.includes('SEVEN_OF_EIGHT_GATES_CANNOT_YIELD_AVAILABLE'));
assert.ok(w2.prohibitions.includes('PROFESSIONAL_JUDGMENT_IS_NOT_REQUIRED_FOR_SELF_SERVICE_METHOD_AVAILABILITY'));

assert.equal(w3.work, 'FMA-W3');
assert.equal(w3.status, 'TARGET_CANONICAL_V1_SCOPES_REGISTERED_NOT_YET_PRODUCTION_ACCEPTED');
assert.equal(w3.rules.scopeRegistrationDoesNotGrantAvailability, true);
assert.deepEqual(w3.methods.map(x => x.pluginCode), ['NUM','BZR','AST']);
for (const method of w3.methods) {
  assert.equal(method.scopeStatus, 'TARGET_NOT_YET_ACCEPTED', `${method.pluginCode} target scope prematurely accepted`);
  assert.ok(method.includedFeatures.length > 0);
  assert.ok(method.excludedFeatures.includes('PROFESSIONAL_JUDGMENT'));
  assert.equal(method.projectionPolicy, 'CANONICAL_METHOD_PROJECTION_ONLY');
  assert.equal(method.meaningPolicy, 'CMP_PRODUCTION_SUCCESSOR_ONLY');
  assert.equal(method.readingPolicy, 'RRP_GOVERNED_COMPOSITION_ONLY');
}
const astScope = w3.methods.find(x => x.pluginCode === 'AST');
for (const feature of ['CORE_10_PLANETS','TRUE_LUNAR_NODE','ASC_MC_DSC_IC','TWELVE_HOUSES','MAJOR_ASPECTS']) assert.ok(astScope.includedFeatures.includes(feature), `AST target scope missing ${feature}`);

// FMA-A must not prematurely replace PCM v1 or promote current methods.
const expected = { AST:'LIMITED_SCOPED', BZR:'LIMITED_SCOPED', NUM:'LIMITED_SCOPED' };
for (const [plugin, state] of Object.entries(expected)) {
  const c = pcm.capabilities.find(x => x.methodRuntime.pluginCode === plugin);
  assert.equal(c.classification, state, `${plugin} prematurely promoted`);
  assert.equal(c.statusProjection, 'Limited', `${plugin} status prematurely promoted`);
}
for (const [path, expectedDigest] of Object.entries(acceptance.artifactDigests)) { assert.equal(fs.existsSync(path), true, `FMA acceptance artifact missing: ${path}`); assert.equal(sha(path), expectedDigest, `FMA acceptance artifact drift: ${path}`); }
assert.equal(acceptance.status, 'ACCEPTED_FOUNDATION_NO_METHOD_PROMOTION');
assert.equal(acceptance.exitGate.astBzrNumPromotedToAvailable, false);
assert.equal(batch.productionStateAfterBatch.CMP, 'FOUNDATION_NOT_USER_ACTIVATED');
assert.equal(batch.nextBatch, 'FMA-B: CMP-W7-W12 + NUMA-W0-W10');

const pkg = json('package.json');
assert.equal(pkg.scripts['check:fma-w0-w3'], 'node scripts/check-fma-w0-w3.mjs');
assert.equal(pkg.scripts['check:fma-a'], 'npm run check:fma-w0-w3 && npm run check:cmp-w0-w6');

console.log('✓ FMA-W0 Authority Reconciliation passed: current successor authority is explicit and historical freezes remain lineage-only.');
console.log('✓ FMA-W1 Capability Availability ≠ Execution Completeness contract passed.');
console.log('✓ FMA-W2 Production Availability Contract passed: AVAILABLE requires all eight production gates (plus governed persistence when applicable).');
console.log('✓ FMA-W3 Canonical Scope Contract passed: NUM/BZR/AST target v1 scopes are registered but not prematurely accepted or promoted.');
