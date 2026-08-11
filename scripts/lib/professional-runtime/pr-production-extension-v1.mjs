import crypto from 'node:crypto';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function required(value, field) {
  const text = clean(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}
function iso(value, field) {
  const text = required(value, field);
  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) throw new TypeError(`${field} must be ISO date-time.`);
  return new Date(ms).toISOString();
}
function unique(values, field, { allowEmpty = false } = {}) {
  const result = [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
  if (!allowEmpty && result.length === 0) throw new TypeError(`${field} requires at least one explicit value.`);
  if (result.includes('*')) throw new TypeError(`${field} cannot contain wildcard scope.`);
  return Object.freeze(result);
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}
function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}
function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freeze(child);
  return value;
}

const SOURCE_RULES = Object.freeze({
  RAW_DATA: { dataTypes: ['REALITY_INPUT_RECORD'], authorities: ['ICR'] },
  REALITY: { dataTypes: ['RUNTIME_STATE_RECORD'], authorities: ['RMO'] },
  EVIDENCE: { dataTypes: ['REALITY_EVIDENCE_RECORD'], authorities: ['RRE'] },
  READOUT: { dataTypes: ['REALITY_READOUT_RECORD'], authorities: ['RRE'] },
  METRICS: { referenceKinds: ['GOVERNED_METRIC_REFERENCE'], authorities: ['METRIC_AUTHORITY', 'UPSTREAM_METRIC_AUTHORITY', 'UPSTREAM_METRIC_AUTHORITY_IF_AVAILABLE'] },
  MEANING: { dataTypes: ['MEANING_PROJECTION_RECORD'], authorities: ['CMR'] },
  KNOWLEDGE: { referenceKinds: ['PUBLISHED_KNOWLEDGE_REFERENCE'], authorities: ['KNOWLEDGE_AUTHORITY'] },
  JOURNEY: { dataTypes: ['NAVIGATION_RECORD'], authorities: ['JR'] },
  UNKNOWN: { dataTypes: ['REALITY_READOUT_RECORD', 'RUNTIME_STATE_RECORD'], authorities: ['RRE', 'RMO'] }
});

export function materializeProfessionalCaseVersion(caseContext, input = {}) {
  if (caseContext?.objectClass !== 'PR_CASE_CONTEXT') throw new TypeError('Canonical PR Case Context is required.');
  if (!['ACTIVE', 'SUSPENDED', 'CLOSED'].includes(clean(input.status))) throw new TypeError('Unsupported PR Case Version status.');
  const caseVersion = Number(input.caseVersion);
  if (!Number.isInteger(caseVersion) || caseVersion < 1) throw new TypeError('caseVersion must be a positive integer.');
  const previous = input.previousCaseVersion || null;
  if (caseVersion === 1 && previous) throw new TypeError('Version 1 cannot have previousCaseVersion.');
  if (caseVersion > 1) {
    if (!previous || typeof previous !== 'object') throw new TypeError('Later Case Version requires previousCaseVersion.');
    if (previous.objectClass !== 'PR_CASE_VERSION') throw new TypeError('previousCaseVersion must be canonical PR_CASE_VERSION.');
    if (previous.caseReference !== caseContext.caseId) throw new TypeError('Previous Case Version reference mismatch.');
    if (previous.caseVersion !== caseVersion - 1) throw new TypeError('Case Version sequence must be contiguous.');
    if (!clean(previous.versionDigest)) throw new TypeError('Previous Case Version digest required.');
    if (previous.status === 'CLOSED' && clean(input.status) !== 'CLOSED') throw new TypeError('Closed Case Version cannot be reopened in place.');
  }
  const openedAt = iso(input.openedAt || caseContext.createdAt, 'openedAt');
  const closedAt = clean(input.closedAt) ? iso(input.closedAt, 'closedAt') : null;
  if (clean(input.status) === 'CLOSED' && !closedAt) throw new TypeError('Closed Case Version requires closedAt.');
  if (closedAt && closedAt < openedAt) throw new TypeError('closedAt cannot precede openedAt.');

  const record = {
    objectClass: 'PR_CASE_VERSION',
    caseReference: caseContext.caseId,
    caseVersion,
    caseDigest: required(caseContext.caseDigest, 'caseContext.caseDigest'),
    previousCaseVersion: previous ? previous.caseVersion : null,
    previousCaseDigest: previous ? previous.versionDigest : null,
    assignmentReference: required(caseContext.assignmentReference?.assignmentId, 'assignmentReference'),
    workspaceReference: required(caseContext.workspaceReference, 'workspaceReference'),
    customerReference: required(caseContext.customer?.customerId, 'customerReference'),
    professionalReference: required(caseContext.professional?.professionalId, 'professionalReference'),
    serviceReference: required(caseContext.service?.serviceId, 'serviceReference'),
    scope: unique(caseContext.scope, 'scope'),
    consentReferences: Object.freeze([required(caseContext.consent?.reference, 'consentReference')]),
    status: clean(input.status),
    openedAt,
    closedAt,
    versionDigest: null,
    persistence: {
      state: 'PERSISTENCE_INTENT_READY',
      intentReference: `${caseContext.caseId}:v${caseVersion}:persist-intent`,
      storageWritePerformed: false,
      executorAuthority: 'PWS_OR_STORAGE_EXECUTOR',
      executorState: 'NOT_IMPLEMENTED_FAIL_CLOSED'
    }
  };
  record.versionDigest = digest({ ...record, versionDigest: null });
  return freeze(record);
}

export function evaluateProfessionalProductionActivation(input = {}) {
  const requiredTrue = [
    'prV2Frozen',
    'pwsProfessionalHandoffFrozen',
    'assignmentAuthorityAvailable',
    'professionalEligibilityAvailable',
    'professionalAuthorisationAvailable',
    'authorisedResourceLoaderAvailable',
    'rdgPrV2ReadSuccessorAvailable'
  ];
  const missing = requiredTrue.filter(key => input[key] !== true);
  if (missing.length) return freeze({
    decision: 'BLOCKED_MISSING_PRODUCTION_FOUNDATION',
    missing,
    caseVersionMaterializationAllowed: false,
    evidenceResolutionAllowed: false,
    storageExecutionAllowed: false
  });
  const storageBlocked = input.dedicatedPrCasePersistenceExecutorObserved !== true ||
    clean(input.professionalWorkspacePersistenceStatus) === 'contract_only' ||
    input.professionalWorkspaceD1RecordCreated === false ||
    clean(input.authorisedWorkspacePersistenceStatus) === 'not_implemented';
  return freeze({
    decision: storageBlocked
      ? 'FOUNDATION_ALLOWED_CASE_STORAGE_EXECUTION_BLOCKED'
      : 'FOUNDATION_ALLOWED_EXTERNAL_STORAGE_EXECUTOR_AVAILABLE',
    missing: Object.freeze([]),
    caseVersionMaterializationAllowed: true,
    evidenceResolutionAllowed: true,
    storageExecutionAllowed: !storageBlocked,
    storageAuthority: 'PWS_OR_STORAGE_EXECUTOR'
  });
}

function sourceByReference(catalogue, reference) {
  const matches = (Array.isArray(catalogue) ? catalogue : []).filter(item => clean(item?.reference) === reference);
  if (matches.length !== 1) throw new TypeError(matches.length === 0
    ? `Source reference missing: ${reference}`
    : `Source reference ambiguous: ${reference}`);
  return matches[0];
}
function validateSourceRule(sourceClass, source) {
  const rule = SOURCE_RULES[sourceClass];
  if (!rule) throw new TypeError(`Unregistered Professional source class: ${sourceClass}`);
  if (!rule.authorities.includes(clean(source.authority))) throw new TypeError(`Source authority mismatch for ${sourceClass}.`);
  if (rule.dataTypes && !rule.dataTypes.includes(clean(source.dataType))) throw new TypeError(`Source dataType mismatch for ${sourceClass}.`);
  if (rule.referenceKinds && !rule.referenceKinds.includes(clean(source.referenceKind))) throw new TypeError(`Source referenceKind mismatch for ${sourceClass}.`);
}

export function resolveProfessionalEvidencePackage(caseVersion, accessDecision, request = {}, sourceCatalogue = []) {
  if (caseVersion?.objectClass !== 'PR_CASE_VERSION' || !clean(caseVersion.versionDigest)) throw new TypeError('Canonical PR Case Version required.');
  if (accessDecision?.decision !== 'ALLOW_MINIMUM_NECESSARY_PROFESSIONAL_ACCESS') throw new TypeError('Allowed Professional access decision required.');
  if (accessDecision.assignmentReference !== caseVersion.assignmentReference) throw new TypeError('Professional access Assignment does not match Case Version.');
  if (accessDecision.professionalId !== caseVersion.professionalReference || accessDecision.customerId !== caseVersion.customerReference) throw new TypeError('Professional access identity does not match Case Version.');
  const accessScopes = unique(accessDecision.scopes, 'accessDecision.scopes');
  const sources = Array.isArray(request.sources) ? request.sources : [];
  if (sources.length === 0) throw new TypeError('Professional Evidence Package requires at least one source reference.');

  const seen = new Set();
  const resolvedSources = sources.map((requestedSource, index) => {
    const sourceClass = required(requestedSource.sourceClass, `sources[${index}].sourceClass`);
    const reference = required(requestedSource.reference, `sources[${index}].reference`);
    const pair = `${sourceClass}:${reference}`;
    if (seen.has(pair)) throw new TypeError(`Duplicate Professional source reference: ${pair}`);
    seen.add(pair);
    const source = sourceByReference(sourceCatalogue, reference);
    if ('payload' in source || 'content' in source || 'body' in source) throw new TypeError(`Source payload copy is forbidden: ${reference}`);
    validateSourceRule(sourceClass, source);
    const requestedVersion = clean(requestedSource.requestedVersion);
    if (requestedVersion && clean(source.version) !== requestedVersion) throw new TypeError(`Source version mismatch: ${reference}`);
    if (clean(source.permissionDecision) !== 'ALLOW') throw new TypeError(`RDG permission denied or unresolved: ${reference}`);
    if (clean(source.purpose) !== accessDecision.purpose) throw new TypeError(`Source purpose mismatch: ${reference}`);
    const sourceScopes = unique(source.scope, `sourceCatalogue.${reference}.scope`);
    if (sourceScopes.some(scope => !accessScopes.includes(scope) || !caseVersion.scope.includes(scope))) {
      throw new TypeError(`Source scope exceeds Professional authorization: ${reference}`);
    }
    return freeze({
      sourceClass,
      reference,
      authority: required(source.authority, `${reference}.authority`),
      dataType: clean(source.dataType) || null,
      referenceKind: clean(source.referenceKind) || null,
      version: clean(source.version) || null,
      permissionDecision: 'ALLOW',
      purpose: accessDecision.purpose,
      scope: sourceScopes,
      sourceDigest: clean(source.sourceDigest) || null,
      payloadCopied: false
    });
  });

  const record = {
    objectClass: 'PR_RESOLVED_EVIDENCE_PACKAGE',
    packageReference: required(request.packageReference, 'packageReference'),
    caseVersionReference: `${caseVersion.caseReference}:v${caseVersion.caseVersion}`,
    accessDecision: accessDecision.decision,
    resolvedSources: Object.freeze(resolvedSources),
    rawDataCountsAsEvidence: false,
    metricCountsAsJudgment: false,
    readoutCountsAsJudgment: false,
    sourcePayloadCopied: false,
    packageDigest: null
  };
  record.packageDigest = digest({ ...record, packageDigest: null });
  return freeze(record);
}

export function buildProfessionalCasePersistenceIntent(caseVersion) {
  if (caseVersion?.objectClass !== 'PR_CASE_VERSION') throw new TypeError('Canonical PR Case Version required.');
  return freeze({
    intentClass: 'PR_CASE_PERSISTENCE_INTENT',
    intentReference: caseVersion.persistence.intentReference,
    caseVersionReference: `${caseVersion.caseReference}:v${caseVersion.caseVersion}`,
    caseVersionDigest: caseVersion.versionDigest,
    targetAuthority: 'PWS_OR_STORAGE_EXECUTOR',
    requestedOperation: 'persist_immutable_case_version',
    storageWritePerformedByPr: false,
    executorState: caseVersion.persistence.executorState,
    decision: 'DEFERRED_FAIL_CLOSED_EXECUTOR_NOT_IMPLEMENTED'
  });
}

export const PR_PRODUCTION_EXTENSION_SOURCE_RULES = SOURCE_RULES;
