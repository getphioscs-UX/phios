import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const policyPath = path.join(
  root,
  'content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json'
);
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

const pending = policy.requiredPolicies
  .filter((entry) => entry.frozen !== true)
  .map((entry) => `${entry.policyCode} (${entry.label})`);

if (pending.length > 0) {
  console.error('✗ ZWR-W2 Human freeze is not complete.');
  console.error(`  Pending ${pending.length}/10:`);
  for (const item of pending) console.error(`  - ${item}`);
  console.error('  W3+ must not consume Zi Wei calculation policy until all 10 decisions are Human-frozen.');
  process.exitCode = 1;
} else {
  assert.equal(policy.status, 'HUMAN_FROZEN');
  assert.equal(policy.freezeGate.state, 'HUMAN_FROZEN');
  assert.equal(policy.freezeGate.allRequiredDecisionsFrozen, true);
  assert.equal(policy.freezeGate.frozenDecisionCount, 10);
  assert.equal(policy.freezeGate.downstreamPolicyConsumptionAllowed, true);
  assert.equal(policy.freezeGate.calculationRuntimeActivationGranted, false);
  assert.equal(policy.freezeGate.productionActivationGranted, false);
  console.log('✓ ZWR-W2 Human freeze passed: 10/10 policy decisions are explicitly approved.');
  console.log('  Policy consumption may proceed to W3+; Production activation remains ungranted.');
}
