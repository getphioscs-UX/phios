import assert from 'node:assert/strict';
import { BASELINE, readJson } from './lib/method-production-activation/mpa-projection-integration-v1.mjs';
import { createProjectionFreezeRecord, projectionFreezeStableSerialize } from '../functions/method-production-activation/projection-integration-runtime.js';

const contract = readJson('content/professional/method-production-activation/contracts/mpa-projection-freeze-v1.json');
const registry = readJson('content/professional/method-production-activation/registries/mpa-projection-freeze-registry-v1.json');
const projection = readJson('content/professional/method-production-activation/fixtures/mpa-w17-num-projection-freeze.valid.json');
assert.equal(contract.work, 'MPA-W17');
assert.equal(contract.baselineCommit, BASELINE);
assert.equal(contract.rules.projectionSnapshotImmutable, true);
assert.equal(contract.rules.validationProjectionBecomesProductionByFreeze, false);
assert.equal(contract.rules.productionAuthorityCreated, false);
assert.equal(registry.productionRecordsActivated, false);
const request = {
  projection,
  methodVersion: '0.1.0-candidate',
  calculationPolicyCode: 'PHI_OS_NUMERIC_REDUCTION_V1',
  calculationPolicyVersion: '1.0.0',
  projectionPolicyCode: 'MR-PROJECTION-EXT-NUMERIC-001',
  projectionPolicyVersion: '1.0.0'
};
const first = await createProjectionFreezeRecord(request);
const second = await createProjectionFreezeRecord(structuredClone(request));
assert.equal(first.freezeDigest, second.freezeDigest);
assert.equal(projectionFreezeStableSerialize(first), projectionFreezeStableSerialize(second));
assert.equal(first.methodReference.methodCode, 'NUMEROLOGY');
assert.equal(first.calculationReference.inputDigest, '1'.repeat(64));
assert.equal(first.calculationReference.outputDigest, '2'.repeat(64));
assert.equal(first.policyReferences.calculationPolicyCode, 'PHI_OS_NUMERIC_REDUCTION_V1');
assert.equal(first.projectionReference.projectionType, 'NUMBER');
assert.equal(first.immutable, true);
assert.equal(first.validationArtifactOnly, true);
assert.equal(first.productionAuthorityCreated, false);
assert.equal(first.interpretationCreated, false);
assert.equal(first.realityFactCreated, false);
assert.equal(first.diagnosisCreated, false);
assert.equal(first.professionalJudgmentCreated, false);
console.log('✓ MPA-W17 Projection Freeze passed.');
console.log('  Method/calculation/policy/projection lineage is frozen without promoting validation projection to Production.');
