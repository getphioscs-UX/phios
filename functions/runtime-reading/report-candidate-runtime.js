/**
 * PHI OS RRP-W24/W25/W28 canonical report-candidate runtime.
 *
 * Deterministically validates and digests a RuntimeReadingReportCandidate and
 * constructs the RR submission envelope. It never finalizes, releases,
 * authorizes, presents or renders a report.
 */

export const RRP_REPORT_CANDIDATE_RUNTIME_CODE = 'RRP_REPORT_CANDIDATE_RUNTIME';
export const RRP_REPORT_CANDIDATE_RUNTIME_VERSION = '1.0.0';

const STATEMENT_TYPES = new Set([
  'CALCULATED_FACT', 'USER_REPORTED_FACT', 'CANONICAL_MEANING',
  'SYSTEM_INTERPRETATION', 'PROFESSIONAL_JUDGMENT', 'NAVIGATION_OPTION',
  'UNKNOWN', 'BOUNDARY'
]);
const COMPLETION_STATES = new Set([
  'COMPLETE', 'PARTIAL', 'UNKNOWN', 'NOT_INCLUDED', 'UNAVAILABLE',
  'PROFESSIONAL_COMPLETION_REQUIRED'
]);
const VISUAL_TYPES = new Set(['CALCULATED_VISUAL', 'EXPLANATORY_VISUAL']);
const VISUAL_STATES = new Set(['AVAILABLE', 'UNAVAILABLE', 'NOT_REQUIRED']);
const RELEASE_KEYS = new Set(['releaseId', 'released', 'published', 'downloadReady']);
const CUSTOMER_PRESENTATION_KEYS = new Set(['customerVisible', 'customerAuthorization', 'releaseEligibility', 'audienceAccess', 'clientVisibleFiltering', 'workspaceProjection', 'PDFProjection', 'pdfProjection']);
const LAYOUT_KEYS = new Set(['fontSize', 'cssClass', 'grid', 'pageNumber', 'pageBreak', 'mobileLayout', 'cardStyle', 'heroPosition', 'position', 'width', 'height', 'page', 'column', 'mobileOrder', 'printScale', 'style']);
const FORBIDDEN_KEYS = new Set([
  'releaseId', 'released', 'published', 'downloadReady', 'customerVisible',
  'customerAuthorization', 'releaseEligibility', 'audienceAccess',
  'clientVisibleFiltering', 'workspaceProjection', 'PDFProjection',
  'pdfProjection', 'fontSize', 'cssClass', 'grid', 'pageNumber', 'pageBreak',
  'mobileLayout', 'cardStyle', 'heroPosition', 'position', 'width', 'height',
  'page', 'column', 'mobileOrder', 'printScale', 'style'
]);

export class RRPValidationError extends TypeError {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = 'RRPValidationError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new RRPValidationError(code, message);
}

function assertObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}

function assertString(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

function assertArray(value, name) {
  if (!Array.isArray(value)) throw new TypeError(`${name} must be an array.`);
}

function assertNoForbiddenKeys(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoForbiddenKeys(item, `${path}[${i}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      if (RELEASE_KEYS.has(key)) fail('RELEASE_AUTHORITY_LEAKAGE', `RRP release authority leakage forbidden at ${path}.${key}`);
      if (CUSTOMER_PRESENTATION_KEYS.has(key)) fail('CUSTOMER_PRESENTATION_AUTHORITY_LEAKAGE', `RRP customer presentation authority leakage forbidden at ${path}.${key}`);
      if (LAYOUT_KEYS.has(key)) fail('PRESENTATION_AUTHORITY_LEAKAGE', `RRP presentation/layout authority leakage forbidden at ${path}.${key}`);
      fail('RRP_AUTHORITY_LEAKAGE', `RRP authority leakage forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, normalize(value[key])])
  );
}

export function stableCanonicalize(value) {
  return JSON.stringify(normalize(value));
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function canonicalDigest(value) {
  return `sha256:${await sha256Hex(stableCanonicalize(value))}`;
}

function validateUnknown(unknown, path) {
  assertObject(unknown, `${path} must be an object.`);
  assertString(unknown.unknownId, `${path}.unknownId`);
  assertString(unknown.reasonCode, `${path}.reasonCode`);
  assertArray(unknown.sourceReferences, `${path}.sourceReferences`);
  assertArray(unknown.affectedSectionIds, `${path}.affectedSectionIds`);
  assertString(unknown.resolutionState, `${path}.resolutionState`);
}

function validateContradiction(item, path) {
  assertObject(item, `${path} must be an object.`);
  assertString(item.contradictionId, `${path}.contradictionId`);
  assertArray(item.sourceReferences, `${path}.sourceReferences`);
  assertArray(item.statementReferences, `${path}.statementReferences`);
  assertString(item.classification, `${path}.classification`);
  assertString(item.resolutionState, `${path}.resolutionState`);
}

export function validateVisualReference(ref, path = '$.visualReference') {
  assertObject(ref, `${path} must be an object.`);
  for (const key of ['visualReferenceId', 'sectionId', 'visualRole', 'visualType', 'sourceAuthority', 'visualState']) {
    assertString(ref[key], `${path}.${key}`);
  }
  if (!VISUAL_TYPES.has(ref.visualType)) throw new TypeError(`${path}.visualType is unsupported.`);
  if (!VISUAL_STATES.has(ref.visualState)) throw new TypeError(`${path}.visualState is unsupported.`);
  if (ref.sourceAuthority !== 'CAR') throw new TypeError(`${path}.sourceAuthority must remain CAR.`);
  if (typeof ref.semanticRequired !== 'boolean' || typeof ref.optional !== 'boolean') {
    throw new TypeError(`${path} semanticRequired/optional must be boolean.`);
  }
  assertArray(ref.sourceProjectionReferences, `${path}.sourceProjectionReferences`);
  if (ref.visualType === 'CALCULATED_VISUAL' && ref.visualState === 'AVAILABLE' && ref.sourceProjectionReferences.length === 0) {
    throw new TypeError(`${path} calculated visual requires Canonical Method Projection references.`);
  }
  if (ref.visualState === 'AVAILABLE' && !ref.assetIdentity) {
    throw new TypeError(`${path} available visual requires CAR assetIdentity.`);
  }
  assertNoForbiddenKeys(ref, path);
  return true;
}

function validateStatement(statement, path) {
  assertObject(statement, `${path} must be an object.`);
  for (const key of ['statementId', 'statementType', 'semanticCode', 'contentCanonical', 'sourceType', 'evidenceLevel', 'confidenceState', 'unknownState']) {
    assertString(statement[key], `${path}.${key}`);
  }
  if (!STATEMENT_TYPES.has(statement.statementType)) throw new TypeError(`${path}.statementType is unsupported.`);
  assertArray(statement.sourceReferences, `${path}.sourceReferences`);
  assertArray(statement.limitationReferences, `${path}.limitationReferences`);
  if (statement.sourceReferences.length === 0) fail('STATEMENT_SOURCE_REQUIRED', `${path} requires at least one sourceReference.`);

  if (statement.statementType === 'CANONICAL_MEANING') {
    if (!Array.isArray(statement.meaningReferences) || statement.meaningReferences.length === 0) {
      fail('MEANING_AUTHORITY_REQUIRED', `${path} CANONICAL_MEANING requires governed meaningReferences.`);
    }
    if (statement.sourceReferences.some(ref => String(ref).startsWith('LLM:'))) {
      fail('MEANING_AUTHORITY_REQUIRED', `${path} cannot use an invented LLM meaning source.`);
    }
  }
  if (statement.statementType === 'SYSTEM_INTERPRETATION') {
    if (!Array.isArray(statement.meaningReferences) || statement.meaningReferences.length === 0 ||
        !Array.isArray(statement.interpretationReferences) || statement.interpretationReferences.length === 0) {
      fail('MEANING_AUTHORITY_REQUIRED', `${path} SYSTEM_INTERPRETATION requires Meaning and Interpretation authority.`);
    }
  }
  if (statement.statementType === 'PROFESSIONAL_JUDGMENT') {
    if (!Array.isArray(statement.professionalReferences) || statement.professionalReferences.length === 0) {
      fail('PR_SOURCE_REQUIRED', `${path} PROFESSIONAL_JUDGMENT requires PR professionalReferences.`);
    }
    if (!statement.professionalReferences.every(ref => String(ref).startsWith('PR:'))) {
      fail('PR_SOURCE_REQUIRED', `${path} professionalReferences must bind PR authority.`);
    }
    try { assertObject(statement.professionalAuthorship, `${path}.professionalAuthorship is required.`); } catch { fail('PR_SOURCE_REQUIRED', `${path}.professionalAuthorship is required.`); }
    for (const key of ['professionalReference', 'signatureReference', 'attributionLabel']) {
      assertString(statement.professionalAuthorship[key], `${path}.professionalAuthorship.${key}`);
    }
  }
  if (statement.statementType === 'UNKNOWN') {
    assertString(statement.reasonCode, `${path}.reasonCode`);
    if (statement.unknownState === 'NONE') throw new TypeError(`${path} UNKNOWN cannot use unknownState NONE.`);
  }
  if (statement.statementType === 'BOUNDARY' && statement.sourceType !== 'GOVERNANCE') {
    throw new TypeError(`${path} BOUNDARY requires GOVERNANCE sourceType.`);
  }
  assertNoForbiddenKeys(statement, path);
}

function validateSection(section, path) {
  assertObject(section, `${path} must be an object.`);
  for (const key of ['sectionId', 'sectionType', 'sectionVersion', 'titleSemanticCode', 'completionState']) {
    assertString(section[key], `${path}.${key}`);
  }
  if (!COMPLETION_STATES.has(section.completionState)) throw new TypeError(`${path}.completionState is unsupported.`);
  for (const key of ['statements', 'unknowns', 'contradictions', 'limitations', 'sourceReferences', 'meaningReferences', 'interpretationReferences', 'professionalReferences', 'visualSemanticReferences']) {
    assertArray(section[key], `${path}.${key}`);
  }
  assertObject(section.evidenceSummary, `${path}.evidenceSummary must be an object.`);
  section.statements.forEach((s, i) => validateStatement(s, `${path}.statements[${i}]`));
  section.unknowns.forEach((u, i) => validateUnknown(u, `${path}.unknowns[${i}]`));
  section.contradictions.forEach((c, i) => validateContradiction(c, `${path}.contradictions[${i}]`));
  section.visualSemanticReferences.forEach((v, i) => validateVisualReference(v, `${path}.visualSemanticReferences[${i}]`));
  assertNoForbiddenKeys(section, path);
}


export function validateRuntimeReadingGovernanceContext(candidateDraft, governanceContext = {}) {
  assertObject(governanceContext, 'governanceContext must be an object.');
  const selected = Array.isArray(governanceContext.selectedMethods) ? governanceContext.selectedMethods : candidateDraft.selectedMethods;
  const consented = new Set(Array.isArray(governanceContext.consentedMethods) ? governanceContext.consentedMethods : []);
  const executions = Array.isArray(governanceContext.methodExecutions) ? governanceContext.methodExecutions : [];
  if (JSON.stringify(selected) !== JSON.stringify(candidateDraft.selectedMethods)) {
    fail('METHOD_SELECTION_MISMATCH', 'candidate selectedMethods must match governanceContext.selectedMethods.');
  }
  for (const method of executions) {
    if (!consented.has(method)) fail('METHOD_CONSENT_REQUIRED', `${method} execution requires method-specific consent.`);
    if (method === 'HDR' || method === 'ZWR') fail('UNSUPPORTED_METHOD_EXECUTION', `${method} cannot auto-execute in the current RRP authority state.`);
  }
  if (Array.isArray(governanceContext.requiredUnknownIds)) {
    const present = new Set(candidateDraft.unknowns.map(x => x.unknownId));
    for (const id of governanceContext.requiredUnknownIds) {
      if (!present.has(id)) fail('UNKNOWN_PRESERVATION_REQUIRED', `required unknown ${id} was silently removed.`);
    }
  }
  if (governanceContext.customerAutoExecutionAllowed === false && executions.includes('HDR')) {
    fail('UNSUPPORTED_METHOD_EXECUTION', 'HDR customer auto-execution is forbidden.');
  }
  if (governanceContext.inventMeaningAllowed === false) {
    for (const section of candidateDraft.sections) {
      for (const statement of section.statements) {
        if ((statement.statementType === 'CANONICAL_MEANING' || statement.statementType === 'SYSTEM_INTERPRETATION') && statement.sourceReferences.some(ref => String(ref).startsWith('LLM:'))) {
          fail('MEANING_AUTHORITY_REQUIRED', 'invented meaning is forbidden.');
        }
      }
    }
  }
  return true;
}

export function validateRuntimeReadingReportCandidateDraft(draft) {
  assertObject(draft, 'RuntimeReadingReportCandidate draft is required.');
  for (const key of ['reportCandidateId', 'productCode', 'productVersion', 'caseReference', 'customerReference', 'inputBundleReference', 'generatedAt', 'localeIntent']) {
    assertString(draft[key], `$.${key}`);
  }
  if (draft.productCode !== 'RRP') throw new TypeError('$.productCode must be RRP.');
  if (!['en', 'zh-Hans'].includes(draft.localeIntent)) throw new TypeError('$.localeIntent is unsupported.');
  for (const key of ['selectedMethods', 'sections', 'unknowns', 'contradictions', 'limitations', 'sourceAuthorities', 'professionalCompletionReasons']) {
    assertArray(draft[key], `$.${key}`);
  }
  if (typeof draft.professionalCompletionRequired !== 'boolean') {
    throw new TypeError('$.professionalCompletionRequired must be boolean.');
  }
  if (draft.professionalCompletionRequired && draft.professionalCompletionReasons.length === 0) {
    throw new TypeError('Professional completion reasons are required when professionalCompletionRequired=true.');
  }
  if (!draft.professionalCompletionRequired && draft.professionalCompletionReasons.length > 0) {
    throw new TypeError('Professional completion reasons require professionalCompletionRequired=true.');
  }
  if (draft.sections.length === 0) throw new TypeError('At least one canonical section is required.');
  const sectionIds = draft.sections.map(s => s.sectionId);
  if (new Set(sectionIds).size !== sectionIds.length) throw new TypeError('Duplicate sectionId is forbidden.');
  draft.sections.forEach((s, i) => validateSection(s, `$.sections[${i}]`));
  draft.unknowns.forEach((u, i) => validateUnknown(u, `$.unknowns[${i}]`));
  draft.contradictions.forEach((c, i) => validateContradiction(c, `$.contradictions[${i}]`));
  assertNoForbiddenKeys(draft);
  return true;
}

export async function createRuntimeReadingReportCandidate(input) {
  const wrapped = Boolean(input?.candidateDraft);
  const draft = structuredClone(input?.candidateDraft ?? input);
  if ('candidateDigest' in draft) delete draft.candidateDigest;
  validateRuntimeReadingReportCandidateDraft(draft);
  if (wrapped) validateRuntimeReadingGovernanceContext(draft, input.governanceContext ?? {});
  const candidateDigest = await canonicalDigest(draft);
  return Object.freeze({ ...draft, candidateDigest });
}

export async function verifyRuntimeReadingReportCandidate(candidate) {
  assertObject(candidate, 'RuntimeReadingReportCandidate is required.');
  assertString(candidate.candidateDigest, '$.candidateDigest');
  const draft = structuredClone(candidate);
  delete draft.candidateDigest;
  validateRuntimeReadingReportCandidateDraft(draft);
  const expected = await canonicalDigest(draft);
  if (candidate.candidateDigest !== expected) throw new TypeError('candidateDigest does not match canonical candidate content.');
  return true;
}

export async function buildRRReportCandidateSubmission(candidate, submittedAt) {
  await verifyRuntimeReadingReportCandidate(candidate);
  assertString(submittedAt, 'submittedAt');
  const visualSemanticReferences = candidate.sections.flatMap(section =>
    section.visualSemanticReferences.map(v => v.visualReferenceId)
  );
  const submission = {
    rrpCandidateReference: candidate.reportCandidateId,
    rrpCandidateDigest: candidate.candidateDigest,
    caseReference: candidate.caseReference,
    customerReference: candidate.customerReference,
    reportProductCode: candidate.productCode,
    productVersion: candidate.productVersion,
    sectionCount: candidate.sections.length,
    sourceAuthorityReferences: [...candidate.sourceAuthorities],
    professionalCompletionRequired: candidate.professionalCompletionRequired,
    unknownCount: candidate.unknowns.length,
    contradictionCount: candidate.contradictions.length,
    limitationCount: candidate.limitations.length,
    visualSemanticReferences,
    submittedAt
  };
  assertNoForbiddenKeys(submission, '$.RRReportCandidateSubmission');
  return Object.freeze(submission);
}
