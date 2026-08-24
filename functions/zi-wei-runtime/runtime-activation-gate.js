import activationAuthority from '../../content/zi-wei-runtime/successors/zwr-w7-w13-internal-calculation-activation-v1.json';

export function loadZiWeiInternalActivation() {
  return activationAuthority;
}

export function assertZiWeiInternalCalculationActivated(options = {}) {
  if (options.executionMode !== 'INTERNAL_VALIDATION') {
    throw Object.assign(
      new Error('Zi Wei W7-W13 runtime is admitted for INTERNAL_VALIDATION only.'),
      { code: 'ZWR_PRODUCTION_NOT_ACTIVATED' }
    );
  }

  const a = options.activation || loadZiWeiInternalActivation();
  const ok =
    a?.status === 'INTERNAL_VALIDATION_ACTIVATED_PRODUCTION_BLOCKED' &&
    a?.grants?.internalDeterministicCalculationAllowed === true &&
    a?.grants?.productionMethodDispatchAllowed === false;

  if (!ok) {
    throw Object.assign(
      new Error('Zi Wei internal calculation activation authority is unavailable.'),
      { code: 'ZWR_INTERNAL_CALCULATION_NOT_ACTIVATED' }
    );
  }
  return a;
}
