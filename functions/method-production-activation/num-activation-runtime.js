import { canonicalDigest } from './validation-evidence-runtime.js';

export const MPA_NUM_ACTIVATION_DECISION_SCHEMA_VERSION =
  'PHI-OS-MPA-NUM-ACTIVATION-DECISION-v1.0.0';

const REQUIRED_GATES = Object.freeze([
  'registrationSuccessor',
  'canonicalInput',
  'consentPurpose',
  'calculationAuthorityResolver',
  'determinism',
  'fixtureCorpus',
  'validationHarness',
  'regression',
  'crossImplementationComparison',
  'projectionFreeze',
  'interpretationBoundary',
  'meaningKnowledgeBoundary',
  'professionalSeparation'
]);

function object(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
}
function digitSum(value) {
  return String(value).replace(/\D/g, '').split('').reduce((sum, digit) => sum + Number(digit), 0);
}
function reduce(value, masterNumbers) {
  let current = value;
  while (current > 9 && !masterNumbers.has(current)) current = digitSum(current);
  return current;
}

export function resolveNumCalculationAuthorities({ authorityRegistry, artifactDigests = {} } = {}) {
  object(authorityRegistry, 'Calculation Data Authority Registry is required.');
  const authorities = authorityRegistry.authorities ?? [];
  const reduction = authorities.find(item => item.authorityCode === 'NUMERIC_REDUCTION_RULES_V1');
  const cycles = authorities.find(item => item.authorityCode === 'NUMERIC_CYCLE_RULES_V1');
  if (!reduction || !cycles) throw new TypeError('NUM governed calculation authorities are incomplete.');
  if (reduction.license !== 'PHI_OS_INTERNAL' || cycles.license !== 'PHI_OS_INTERNAL') {
    throw new TypeError('NUM activation may only use the currently governed internal calculation authorities.');
  }
  if (reduction.digestStatus !== 'VERIFIED_CANONICAL_PAYLOAD' ||
      reduction.digest !== canonicalDigest(reduction.payload)) {
    throw new TypeError('NUM reduction authority digest is not verified.');
  }
  if (cycles.digestStatus !== 'VERIFIED_REPOSITORY_ARTIFACT' ||
      !/^[a-f0-9]{64}$/.test(cycles.digest)) {
    throw new TypeError('NUM cycle authority digest is not verified.');
  }
  if (artifactDigests[cycles.source] && artifactDigests[cycles.source] !== cycles.digest) {
    throw new TypeError('NUM cycle authority artifact digest drift.');
  }
  if (reduction.productionUse !== 'REQUIRES_AUTHORITY_RESOLVER' ||
      cycles.productionUse !== 'REQUIRES_AUTHORITY_RESOLVER') {
    throw new TypeError('NUM authority resolver boundary drift.');
  }
  return Object.freeze({
    resolverCode: 'MPA_NUM_CALCULATION_AUTHORITY_RESOLVER_V1',
    resolverVersion: '1.0.0',
    methodCode: 'NUMEROLOGY',
    pluginCode: 'NUM',
    reduction: Object.freeze(structuredClone(reduction)),
    cycles: Object.freeze(structuredClone(cycles)),
    authorityCodes: Object.freeze([reduction.authorityCode, cycles.authorityCode]),
    authorityDigests: Object.freeze([reduction.digest, cycles.digest]),
    externalCalculationDatasetRequired: false,
    externalCalculationLicenseClaimCreated: false,
    resolvedForMethodActivationEvidence: true,
    productionExecutionAuthorityCreated: false
  });
}

export function independentNumBirthReference({ birthDate, authorityResolution } = {}) {
  object(authorityResolution, 'NUM authority resolution is required.');
  if (authorityResolution.resolvedForMethodActivationEvidence !== true) {
    throw new TypeError('NUM authority resolution is not activation-ready.');
  }
  if (!validDate(birthDate)) {
    return Object.freeze({ status: 'ERROR', errorCode: 'INPUT_INVALID', result: null });
  }
  const masterNumbers = new Set(authorityResolution.reduction.payload.masterNumbers);
  const [, month, day] = birthDate.split('-').map(Number);
  return Object.freeze({
    status: 'PASS',
    lifePath: reduce(digitSum(birthDate), masterNumbers),
    birthdayNumber: reduce(day, masterNumbers),
    attitudeNumber: reduce(month + day, masterNumbers)
  });
}

export function evaluateNumActivationReadiness({ gates, evidenceReferences = [] } = {}) {
  object(gates, 'NUM activation gates are required.');
  const failed = REQUIRED_GATES.filter(gate => gates[gate] !== true);
  const methodSpecificReady = failed.length === 0;
  return Object.freeze({
    schemaVersion: MPA_NUM_ACTIVATION_DECISION_SCHEMA_VERSION,
    work: 'MPA-W21',
    methodCode: 'NUMEROLOGY',
    pluginCode: 'NUM',
    methodVersion: '0.1.0-candidate',
    decision: methodSpecificReady
      ? 'READY_FOR_MPA_W26_ELIGIBILITY_DECISION'
      : 'NUM_METHOD_SPECIFIC_ACTIVATION_BLOCKED',
    methodSpecificReady,
    gates: Object.freeze({ ...gates }),
    failedMethodSpecificGates: Object.freeze(failed),
    evidenceReferences: Object.freeze([...evidenceReferences]),
    productionEligible: false,
    productionEligibilityDecisionCreated: false,
    productionExecutionAllowed: false,
    productionExecutionGate: 'MPA-W27_REQUIRED',
    globalEligibilityGate: 'MPA-W26_REQUIRED',
    professionalEligible: false,
    professionalReleaseAllowed: false,
    publicEligible: false,
    legacyNumFreezeRewritten: false,
    frozenMrOrImrRewritten: false
  });
}

export function assertNumProductionExecutionBlocked(executionMode) {
  if (executionMode === 'production') throw new Error('MPA_W27_PRODUCTION_EXECUTION_GATE_REQUIRED');
  if (executionMode !== 'validation') throw new TypeError('NUM activation evidence supports validation mode only before MPA-W27.');
  return true;
}
