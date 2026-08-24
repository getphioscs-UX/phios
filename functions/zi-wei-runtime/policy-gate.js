import policy from '../../content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json';

export function loadZiWeiPolicy() {
  return policy;
}

export function assertZiWeiPolicyConsumable(candidate = loadZiWeiPolicy()) {
  const gate = candidate?.freezeGate;
  const frozen =
    candidate?.status === 'HUMAN_FROZEN' &&
    gate?.state === 'HUMAN_FROZEN' &&
    gate?.allRequiredDecisionsFrozen === true &&
    gate?.frozenDecisionCount === 10 &&
    gate?.downstreamPolicyConsumptionAllowed === true;

  if (!frozen) {
    const error = new Error('Zi Wei calculation policy is not Human-frozen; calculation remains fail-closed.');
    error.code = 'ZWR_POLICY_NOT_HUMAN_FROZEN';
    error.pendingPolicyCodes = (candidate?.requiredPolicies || [])
      .filter((x) => x.frozen !== true)
      .map((x) => x.policyCode);
    throw error;
  }
  return candidate;
}
