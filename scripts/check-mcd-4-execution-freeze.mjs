import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const freeze = json('content/professional/method-client-delivery/freeze/mcd-4-execution-freeze-v1.json');
const acceptance = json('content/professional/method-client-delivery/acceptance/mcd-4-execution-acceptance-v1.json');
const pkg = json('package.json');

assert.equal(freeze.status, 'FROZEN_MPA_FIRST_PARTIAL_EXECUTION_HDR_FAIL_CLOSED');
for (const record of [...freeze.frozenOutputs, ...freeze.predecessorEvidence]) {
  assert.equal(sha256(record.path), record.sha256, `MCD-4 freeze drift: ${record.path}`);
}
assert.equal(freeze.authorityFreeze.productionDispatchOwner, 'MPA');
assert.equal(freeze.authorityFreeze.mcdRole, 'EXECUTION_ORCHESTRATION_ONLY');
assert.equal(freeze.nonAuthority.rawCoreResultPublic, false);
assert.equal(freeze.nonAuthority.canonicalProjectionCreated, false);
assert.equal(freeze.hdrFreeze.productionInvocationAllowed, false);
assert.equal(freeze.hdrFreeze.mpaEvaluatedBeforeInput, true);
assert.equal(acceptance.nextWork, 'MCD-5');
assert.equal(pkg.scripts['check:mcd-4'], 'node scripts/check-mcd-4-execution.mjs && node scripts/check-mcd-4-execution-freeze.mjs');
assert.equal(pkg.scripts['check:mcd'], 'npm run check:mcd-production-authority && npm run check:mcd-2 && npm run check:mcd-3 && npm run check:mcd-4');

console.log('✓ MCD-4 successor freeze passed.');
console.log('  Frozen outputs and predecessor evidence are byte-exact; MCD-5 remains the first canonical projection phase.');
