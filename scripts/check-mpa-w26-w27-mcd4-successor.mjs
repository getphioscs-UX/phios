import assert from 'node:assert/strict';
import fs from 'node:fs';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const base = 'content/professional/method-production-activation';
const eligibility = json(`${base}/contracts/mpa-production-eligibility-decision-v1.json`);
const execution = json(`${base}/contracts/mpa-production-execution-gate-v1.json`);
const acceptance = json(`${base}/acceptance/mpa-w26-w27-production-gate-acceptance-v1.json`);
const mcd1 = json(`${base}/successors/mpa-mcd-1-production-authority-successor-v1.json`);
const mcd4 = json(`${base}/successors/mpa-w30-mcd4-execution-successor-v1.json`);
const pkg = json('package.json');

assert.equal(eligibility.status, 'ACTIVE_CANONICAL_ELIGIBILITY_AUTHORITY_FAIL_CLOSED');
assert.equal(execution.status, 'ACTIVE_FAIL_CLOSED_PRODUCTION_EXECUTION_GATE');
assert.equal(acceptance.status, 'ACCEPT_CANONICAL_ELIGIBILITY_AND_FAIL_CLOSED_EXECUTION_GATE_NO_CURRENT_PRODUCTION_DISPATCH');
assert.equal(mcd1.authorityOwner, 'MPA');
assert.equal(mcd1.globalRules.onlyMpaDecisionControlsDispatchAllowed, true);
for (const code of ['AST', 'BZR', 'NUM']) {
  const method = mcd1.methods.find(record => record.pluginCode === code);
  assert.equal(method.dispatchAllowed, true, code);
}
assert.equal(mcd1.methods.find(record => record.pluginCode === 'HDR').dispatchAllowed, false);
assert.equal(mcd4.authorityOwner, 'MPA');
assert.equal(mcd4.executionBoundary.mpaEvaluatedBeforeInput, true);
assert.equal(mcd4.executionBoundary.mpaBlockedMayNotReachCore, true);
assert.equal(mcd4.executionBoundary.hdrProductionInvocationAllowed, false);
assert.equal(pkg.scripts['check:mpa-w26-w27'], 'node scripts/check-mpa-w26-w27-mcd4-successor.mjs');
assert.equal(pkg.scripts['check:mpa-w26-w27-historical'], 'node scripts/check-mpa-w26-w27-production-eligibility-execution-gate.mjs');

console.log('✓ MPA-W26/W27 → MCD-4 execution-gate successor passed.');
console.log('  Historical eligibility remains preserved and current execution stays MPA-first with HDR blocked.');
