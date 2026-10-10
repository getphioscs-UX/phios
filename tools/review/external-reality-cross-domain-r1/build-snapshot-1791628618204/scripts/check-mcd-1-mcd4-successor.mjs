import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const selection = json('content/professional/method-client-delivery/registries/mcd-1-production-method-selection-v1.json');
const acceptance = json('content/professional/method-client-delivery/acceptance/mcd-1-production-method-selection-acceptance-v1.json');
const mpa = json('content/professional/method-production-activation/successors/mpa-mcd-1-production-authority-successor-v1.json');
const mcd4 = json('content/professional/method-client-delivery/contracts/mcd-4-execution-contract-v1.json');
const mpaMcd4 = json('content/professional/method-production-activation/successors/mpa-w30-mcd4-execution-successor-v1.json');
const pkg = json('package.json');

assert.equal(selection.status, 'SELECTED_AUTHORITY_RESOLVED_ADAPTER_BINDING_PENDING');
assert.equal(acceptance.status, 'ACCEPTED_AUTHORITY_RESOLVED_NO_ADAPTER_BINDING');
assert.equal(mpa.authorityOwner, 'MPA');
assert.equal(mpa.predecessorMutated, false);
for (const code of ['AST', 'BZR', 'NUM']) {
  const method = mpa.methods.find(record => record.pluginCode === code);
  assert.equal(method.productionEligible, true, code);
  assert.equal(method.dispatchAllowed, true, code);
}
const hdr = mpa.methods.find(record => record.pluginCode === 'HDR');
assert.equal(hdr.state, 'BLOCKED');
assert.equal(hdr.dispatchAllowed, false);
for (const record of Object.values(mpa.frozenPredecessorDigests)) {
  assert.equal(sha256(record.path), record.sha256, `MCD-1 predecessor drift: ${record.path}`);
}
assert.equal(mcd4.rules.mpaEvaluationMustPrecedeInputEvaluation, true);
assert.equal(mcd4.rules.mcdMayNotGrantProductionAuthority, true);
assert.equal(mcd4.methodExecution.HDR.productionInvocationAllowed, false);
assert.equal(mpaMcd4.authorityOwner, 'MPA');
assert.equal(mpaMcd4.executionBoundary.mpaEvaluatedBeforeInput, true);
assert.equal(mpaMcd4.productionAuthority.HDR.dispatchAllowed, false);
assert.equal(pkg.scripts['check:mcd-1'], 'node scripts/check-mcd-1-mcd4-successor.mjs');
assert.equal(pkg.scripts['check:mcd-1-historical'], 'node scripts/check-mcd-1-production-method-selection.mjs');

console.log('✓ MCD-1 → MCD-4 Production Authority successor passed.');
console.log('  MPA remains the sole dispatch authority; AST/BZR/NUM are eligible and HDR remains fail-closed.');
