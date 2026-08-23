import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
export const policyPath = path.join(root, 'content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
export function loadZiWeiPolicy() { return JSON.parse(fs.readFileSync(policyPath, 'utf8')); }
export function assertZiWeiPolicyConsumable(policy = loadZiWeiPolicy()) {
  const gate = policy?.freezeGate;
  const frozen = policy?.status === 'HUMAN_FROZEN' && gate?.state === 'HUMAN_FROZEN' && gate?.allRequiredDecisionsFrozen === true && gate?.frozenDecisionCount === 10 && gate?.downstreamPolicyConsumptionAllowed === true;
  if (!frozen) {
    const error = new Error('Zi Wei calculation policy is not Human-frozen; calculation remains fail-closed.');
    error.code = 'ZWR_POLICY_NOT_HUMAN_FROZEN';
    error.pendingPolicyCodes = (policy?.requiredPolicies || []).filter((x) => x.frozen !== true).map((x) => x.policyCode);
    throw error;
  }
  return policy;
}
