import {ZWR_RUNTIME_AUTHORITIES} from '../zi-wei-runtime/zi-wei-runtime-authorities.generated.js';

const authority=ZWR_RUNTIME_AUTHORITIES.productionActivation;

const clean = v => typeof v === 'string' ? v.trim() : '';

export function getZwrMpaProductionDecision(methodCode, methodVersion, capability) {
  const code = clean(methodCode);
  const version = clean(methodVersion);
  const cap = clean(capability).toUpperCase();
  const m = authority.method;
  const methodMatch = code === m.methodCode && version === m.methodVersion;
  const allowed =
    methodMatch &&
    m.productionEligible === true &&
    m.dispatchAllowed === true &&
    m.dispatchableCapabilities.includes(cap);

  return Object.freeze({
    authorityOwner: 'MPA',
    authoritySource: 'MPA_ZWR_PRODUCTION_ACTIVATION_SUCCESSOR',
    methodCode: code,
    pluginCode: 'ZWR',
    methodVersion: version,
    capability: cap,
    state: allowed ? m.state : 'BLOCKED',
    decision: allowed ? 'ELIGIBLE' : 'BLOCKED',
    productionEligible: allowed,
    dispatchAllowed: allowed,
    blockingReasons: Object.freeze(
      allowed ? [] : [methodMatch ? 'CAPABILITY_NOT_DISPATCHABLE_BY_ZWR_MPA' : 'METHOD_VERSION_NOT_AUTHORIZED_BY_ZWR_MPA']
    )
  });
}

export const ZWR_MPA_PRODUCTION_AUTHORITY = Object.freeze(authority);
