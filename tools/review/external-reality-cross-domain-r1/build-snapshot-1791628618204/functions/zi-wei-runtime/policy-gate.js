import {ZWR_RUNTIME_AUTHORITIES} from './zi-wei-runtime-authorities.generated.js';

const policy=ZWR_RUNTIME_AUTHORITIES.calculationPolicy;

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
