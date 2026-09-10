import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sourcePath = 'content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-w15-100-question-machine-benchmark-v1.json';
const census = read('content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-deterministic-answerability-census-v1.json');
assert.equal(census.status, 'DETERMINISTIC_ANSWERABILITY_BASELINE_READY');
assert.equal(census.sourceBenchmarkSha256, crypto.createHash('sha256').update(fs.readFileSync(sourcePath, 'utf8')).digest('hex'));
assert.equal(census.cases.length, 100);
assert.equal(new Set(census.cases.map(item => item.caseId)).size, 100);
assert.deepEqual(
  [census.aggregate.t0Count,census.aggregate.t1Count,census.aggregate.t2Count,census.aggregate.t3Count],
  [2,96,1,1]
);
for (const item of census.cases) {
  assert.match(item.aiExecutionClass, /^T[0-3]_/);
  assert.equal(item.providerSelectedByCensus, null);
  assert.ok(Array.isArray(item.reasonCodes) && item.reasonCodes.length > 0);
  assert.ok(item.estimatedInputTokensAfterEvidenceDiscipline <= item.estimatedInputTokensWithoutOptimization);
}
assert.equal(census.boundaries.providerSelectedByCensusCount, 0);
assert.equal(census.boundaries.commerceDecisionCount, 0);
assert.equal(census.boundaries.retrievalMeaningMutationCount, 0);
console.log('✓ PAI-PRE-W0 deterministic answerability census passed: 100/100 classified (T0=2, T1=96, T2=1, T3=1).');
console.log('  Census selects no provider, makes no commerce decision and does not mutate KIR retrieval meaning.');
