const present = value => value !== undefined && value !== null && value !== '';

const SENSITIVITY_RANK = new Map([
  ['PUBLIC', 0],
  ['INTERNAL', 1],
  ['PERSONAL', 2],
  ['SENSITIVE', 3],
  ['HIGHLY_SENSITIVE', 4],
  ['RESTRICTED_PROFESSIONAL', 5],
  ['SYSTEM_SECRET', 6]
]);

const DRIFT_FIELDS = new Map([
  ['PURPOSE_DRIFT', 'purposeCodes'],
  ['CONSENT_DRIFT', 'consentClass'],
  ['RETENTION_DRIFT', 'retentionClass'],
  ['SENSITIVITY_DRIFT', 'sensitivityClass'],
  ['EVIDENCE_DRIFT', 'evidenceState'],
  ['AUTHORITY_DRIFT', 'authorityReference'],
  ['PROFESSIONAL_BOUNDARY_DRIFT', 'professionalBoundary'],
  ['INFERENCE_DRIFT', 'inferenceBoundary'],
  ['ANALYTICS_DRIFT', 'analyticsLayer'],
  ['DELETION_DRIFT', 'deletionState']
]);

const normalize = value => Array.isArray(value) ? [...value].sort() : value;
const same = (left, right) => JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));

export function evaluateCrossRuntimeWrite(registry, input = {}) {
  if (!registry || !Array.isArray(registry.entries)) return 'UNRESOLVED_REGISTRY';
  const source = registry.entries.find(entry => entry.runtimeCode === input.sourceRuntimeCode);
  const target = registry.entries.find(entry => entry.runtimeCode === input.targetRuntimeCode);
  if (!source || !target || !present(input.dataType)) return 'UNRESOLVED_CONTRACT';
  if (!source.writeAuthority?.dataTypes?.includes(input.dataType)) return 'DENY_SOURCE_WRITE_AUTHORITY';
  if (!target.readAuthority?.dataTypes?.includes(input.dataType)) return 'DENY_TARGET_READ_AUTHORITY';
  if (!source.allowedPurposes.includes(input.purposeCode)) return 'DENY_PURPOSE';
  if (!source.allowedPersistenceClasses.includes(input.persistenceClass)) return 'DENY_PERSISTENCE';
  if (!SENSITIVITY_RANK.has(input.sensitivityClass) || !SENSITIVITY_RANK.has(source.sensitivityCeiling)) return 'UNRESOLVED_SENSITIVITY';
  if (SENSITIVITY_RANK.get(input.sensitivityClass) > SENSITIVITY_RANK.get(source.sensitivityCeiling)) return 'DENY_SENSITIVITY_CEILING';
  if (input.evidencePromotionRequested === true && source.permissions.evidencePromotion !== 'ALLOW_GOVERNED') return 'DENY_EVIDENCE_PROMOTION';
  if (input.professionalDataWriteRequested === true && source.permissions.professionalDataWrite !== 'ALLOW_PR_AUTHORITY') return 'DENY_PROFESSIONAL_DATA_WRITE';
  if (input.analyticsWriteRequested === true) {
    if (source.permissions.analyticsWrite !== 'ALLOW_PURPOSE_CONSENT_BOUND') return 'DENY_ANALYTICS_WRITE';
    if (input.purposeCode !== 'PRODUCT_ANALYTICS' || input.analyticsConsentValid !== true) return 'REQUIRE_ANALYTICS_PURPOSE_AND_CONSENT';
  }
  if (source.activationState === 'RESERVED_NOT_IMPLEMENTED' && input.contractValidationOnly !== true) return 'RUNTIME_NOT_ACTIVE';
  return 'ALLOW_CONTRACTED_WRITE';
}

export function evaluateDataDrift(input = {}) {
  if (!input.baseline || !input.candidate) {
    return { decision: 'UNRESOLVED', detectedDrifts: [], unapprovedDrifts: [] };
  }
  const detectedDrifts = [];
  for (const [driftType, field] of DRIFT_FIELDS) {
    if (!same(input.baseline[field], input.candidate[field])) detectedDrifts.push(driftType);
  }
  const journeyMarketingExpansion = input.baseline.sourceContext === 'JOURNEY' &&
    (input.candidate.purposeCodes ?? []).includes('MARKETING') &&
    !(input.baseline.purposeCodes ?? []).includes('MARKETING');
  if (journeyMarketingExpansion && !detectedDrifts.includes('PURPOSE_DRIFT')) detectedDrifts.push('PURPOSE_DRIFT');
  if (detectedDrifts.length === 0) return { decision: 'NO_DRIFT', detectedDrifts, unapprovedDrifts: [] };
  const approved = new Set(input.approvedDrifts ?? []);
  const unapprovedDrifts = detectedDrifts.filter(type => !approved.has(type));
  if (journeyMarketingExpansion || unapprovedDrifts.length > 0) {
    return { decision: 'BLOCKED_DRIFT', detectedDrifts, unapprovedDrifts };
  }
  if (!present(input.governedChangeReference)) {
    return { decision: 'BLOCKED_DRIFT', detectedDrifts, unapprovedDrifts: detectedDrifts };
  }
  return { decision: 'APPROVED_GOVERNED_CHANGE', detectedDrifts, unapprovedDrifts: [] };
}

export function evaluateGovernanceAcceptance(gates = []) {
  if (!Array.isArray(gates) || gates.length === 0) return 'UNRESOLVED';
  return gates.every(gate => gate.status === 'PASS' && Array.isArray(gate.evidenceReferences) && gate.evidenceReferences.length > 0)
    ? 'ACCEPTED'
    : 'REJECTED';
}
