import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE,
  SHARED_CALCULATION_RUNTIME_VERSION,
  stableSerialize
} from '../functions/method-runtime/shared-calculation-runtime.js';

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const contract = await readJson('content/professional/method-runtime/shared-calculation-runtime-v1.json');
const packageJson = await readJson('package.json');
assert.equal(contract.stageCode, 'MR-W3');
assert.equal(contract.runtimeCode, SHARED_CALCULATION_RUNTIME_CODE);
assert.equal(contract.runtimeVersion, SHARED_CALCULATION_RUNTIME_VERSION);
assert.equal(contract.status, 'frozen');
assert.equal(contract.authority.input, 'SHARED_DATA_AUTHORITY');
assert.equal(contract.providerBoundary.openAIAllowed, false);
assert.equal(contract.providerBoundary.workersAIAllowed, false);
assert.equal(contract.providerBoundary.promptAllowed, false);
assert.equal(contract.resultBoundary.createsProjection, false);
assert.equal(contract.resultBoundary.createsInterpretation, false);
assert.equal(contract.resultBoundary.createsProfessionalConclusion, false);
assert.equal(contract.productionContract.nextGate, 'MR-W4');
assert.equal(packageJson.scripts['check:mr-w3'], 'node scripts/check-mr-w3-shared-calculation-runtime.mjs');
assert.equal(stableSerialize({b:2,a:1}), '{"a":1,"b":2}');

const record = {
  schemaVersion: 'PHI-OS-SHARED-DATA-RECORD-v1.0.0', recordId: 'SDA-TEST-0001',
  recordType: 'CALENDAR', authority: 'SHARED_DATA_AUTHORITY', authorityVersion: '1.0.0',
  recordVersion: '1.0.0', status: 'verified', methodOwner: null, pluginOwner: null,
  payload: { year: 2026, month: 8, day: 6 }
};
const runtime = createSharedCalculationRuntime({ algorithms: [{
  algorithmCode: 'TEST_CALENDAR_NORMALIZE', algorithmVersion: '1.0.0',
  authority: 'IMR_ALGORITHM_GOVERNANCE',
  calculate: records => ({ isoDate: `${records[0].payload.year}-08-06` })
}] });
const request = {
  calculationId: 'CALC-MR-W3-TEST', runtimeCode: 'SHARED_CALCULATION_RUNTIME',
  methodCode: 'ASTROLOGY', pluginCode: 'AST', algorithmCode: 'TEST_CALENDAR_NORMALIZE',
  algorithmVersion: '1.0.0', inputRecords: [record], referenceVersions: { calendar: '1.0.0' }
};
const first = await runtime.execute(request);
const second = await runtime.execute(request);
assert.deepEqual(first, second);
assert.equal(first.deterministic, true);
assert.equal(first.aiUsed, false);
assert.equal(first.providerUsed, false);
assert.equal(first.projectionCreated, false);
assert.equal(first.interpretationCreated, false);
assert.equal(first.professionalConclusionCreated, false);
assert.match(first.inputDigest, /^[a-f0-9]{64}$/);
assert.match(first.outputDigest, /^[a-f0-9]{64}$/);

await assert.rejects(() => runtime.execute({ ...request, prompt: 'interpret this' }), /forbidden/i);
await assert.rejects(() => runtime.execute({ ...request, inputRecords: [{ ...record, authority: 'AST' }] }), /Shared Data Authority/);
const nondeterministic = createSharedCalculationRuntime({ algorithms: [{
  algorithmCode: 'BAD_RANDOM', algorithmVersion: '1.0.0',
  calculate: () => ({ value: Math.random() })
}] });
await assert.rejects(() => nondeterministic.execute({ ...request, algorithmCode: 'BAD_RANDOM' }), /NON_DETERMINISTIC/);
for (const name of ['precheck','check','postcheck','check:pja','check:knowledge-runtime','check:mr-w0','check:mr-w1','check:mr-w2','check:imr-w0','check:hdr-w0']) {
  const command = packageJson.scripts[name];
  assert.equal(typeof command, 'string', `Missing baseline script: ${name}`);
  assert.equal(command.includes('check:mr-w3') || command.includes('check-mr-w3'), false, `MR-W3 must remain outside ${name}.`);
}
console.log('✓ MR-W3 Shared Calculation Runtime passed.');
console.log('  Deterministic double execution and SHA-256 lineage validated.');
console.log('  Shared Data Authority is the only accepted input authority.');
console.log('  OpenAI, Workers AI, Prompt and Interpretation are forbidden.');
console.log('  Calculation Result creates no Projection or Professional Conclusion.');
