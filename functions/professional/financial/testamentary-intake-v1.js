export const PTRC_TESTAMENTARY_INTAKE_VERSION = 'ptrc-testamentary-intake.v1';

export const PTRC_TESTAMENTARY_SECTIONS = Object.freeze([
  'identity', 'family', 'executors', 'guardians', 'beneficiaries',
  'assets', 'liabilities', 'trusts', 'gifts', 'exclusions',
  'digital_assets', 'funeral_wishes', 'advisors', 'documents',
  'review_consent'
]);

export const PTRC_TESTAMENTARY_SECTION_STATUSES = Object.freeze([
  'UNSET', 'KNOWN', 'PARTIAL', 'UNKNOWN', 'NOT_APPLICABLE'
]);

const FORBIDDEN_EXACT_IDENTIFIER_KEYS = new Set([
  'identity_number', 'national_id', 'passport_number', 'tax_number',
  'bank_account_number', 'account_number', 'policy_number', 'exact_address',
  'password', 'secret', 'private_key', 'seed_phrase'
]);

const text = value => typeof value === 'string' ? value.trim() : '';
const requiredText = (value, field) => {
  const cleaned = text(value);
  if (!cleaned) throw new TypeError(`PTRC_W9_REQUIRED:${field}`);
  return cleaned;
};
const isoDate = (value, field) => {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new TypeError(`PTRC_W9_DATE_INVALID:${field}`);
  return new Date(time).toISOString().slice(0, 10);
};
const isoInstant = (value, field) => {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new TypeError(`PTRC_W9_INSTANT_INVALID:${field}`);
  return new Date(time).toISOString();
};

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function cloneAndValidate(value, path = 'input') {
  if (Array.isArray(value)) return value.map((item, index) => cloneAndValidate(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') {
    return typeof value === 'string' ? value.trim() : value;
  }
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_EXACT_IDENTIFIER_KEYS.has(key) && child !== null && child !== '') {
      throw new TypeError(`PTRC_W9_RESTRICTED_IDENTIFIER:${path}.${key}`);
    }
    output[key] = cloneAndValidate(child, `${path}.${key}`);
  }
  return output;
}

function uniqueStrings(values = []) {
  return [...new Set(values.map(value => text(value)).filter(Boolean))];
}

function normaliseSection(sectionId, input = {}) {
  const status = text(input.status).toUpperCase() || 'UNSET';
  if (!PTRC_TESTAMENTARY_SECTION_STATUSES.includes(status)) {
    throw new TypeError(`PTRC_W9_SECTION_STATUS_INVALID:${sectionId}:${status}`);
  }
  const items = Array.isArray(input.items) ? cloneAndValidate(input.items, `sections.${sectionId}.items`) : [];
  const sourceReferences = uniqueStrings(input.sourceReferences || []);
  const conflicts = uniqueStrings(input.conflicts || []);
  if (['KNOWN', 'PARTIAL'].includes(status) && !sourceReferences.length) {
    throw new TypeError(`PTRC_W9_PROVENANCE_REQUIRED:${sectionId}`);
  }
  return deepFreeze({
    sectionId,
    status,
    items,
    note: text(input.note) || null,
    sourceReferences,
    conflicts
  });
}

function buildWarnings(sections) {
  const gaps = [];
  const conflicts = [];
  for (const [sectionId, section] of Object.entries(sections)) {
    if (['UNSET', 'UNKNOWN', 'PARTIAL'].includes(section.status)) {
      gaps.push(Object.freeze({
        code: `GAP_${section.status}`,
        sectionId,
        message: section.status === 'PARTIAL'
          ? `${sectionId} is only partially confirmed.`
          : `${sectionId} is ${section.status.toLowerCase()}.`
      }));
    }
    for (const message of section.conflicts) {
      conflicts.push(Object.freeze({ code: 'CONFLICT_DECLARED', sectionId, message }));
    }
  }
  return deepFreeze({ gaps, conflicts });
}

function serialisableInput(intake) {
  return {
    caseId: intake.caseId,
    clientId: intake.clientId,
    jurisdiction: intake.jurisdiction,
    currency: intake.currency,
    dataDate: intake.dataDate,
    dataVersion: intake.dataVersion,
    status: intake.status,
    sections: Object.fromEntries(Object.entries(intake.normalizedFacts.sections).map(([id, section]) => [id, {
      status: section.status,
      items: section.items,
      note: section.note,
      sourceReferences: section.sourceReferences,
      conflicts: section.conflicts
    }]))
  };
}

export function createTestamentaryIntake(input = {}, options = {}) {
  const jurisdiction = requiredText(input.jurisdiction, 'jurisdiction').toUpperCase();
  const currency = requiredText(input.currency, 'currency').toUpperCase();
  const sourceSections = input.sections && typeof input.sections === 'object' ? input.sections : {};
  const sections = Object.fromEntries(PTRC_TESTAMENTARY_SECTIONS.map(sectionId => [
    sectionId,
    normaliseSection(sectionId, sourceSections[sectionId] || {})
  ]));
  const createdAt = isoInstant(options.now || input.createdAt || new Date().toISOString(), 'createdAt');
  const rawUserInput = cloneAndValidate(input, 'rawUserInput');
  const normalizedFacts = deepFreeze({
    jurisdiction,
    currency,
    dataDate: isoDate(input.dataDate, 'dataDate'),
    sections: deepFreeze(sections)
  });
  const warnings = buildWarnings(sections);
  return deepFreeze({
    schemaVersion: PTRC_TESTAMENTARY_INTAKE_VERSION,
    caseId: requiredText(input.caseId, 'caseId'),
    clientId: requiredText(input.clientId, 'clientId'),
    jurisdiction,
    currency,
    dataDate: normalizedFacts.dataDate,
    dataVersion: Number.isInteger(Number(input.dataVersion)) && Number(input.dataVersion) > 0 ? Number(input.dataVersion) : 1,
    status: text(input.status).toUpperCase() || 'DRAFT',
    createdAt,
    rawUserInput: deepFreeze(rawUserInput),
    normalizedFacts,
    derivedCalculations: null,
    warnings,
    generatedNarrative: null,
    modelGeneratedFacts: false,
    modelGeneratedNumericInputs: false,
    legalValidityDetermined: false,
    executedInstrumentCreated: false
  });
}

export function serialiseTestamentaryDraft(intake) {
  if (intake?.schemaVersion !== PTRC_TESTAMENTARY_INTAKE_VERSION) {
    throw new TypeError('PTRC_W9_INTAKE_REQUIRED');
  }
  return JSON.stringify(serialisableInput(intake));
}

export function resumeTestamentaryDraft(serialised, options = {}) {
  let parsed;
  try { parsed = JSON.parse(String(serialised)); }
  catch { throw new TypeError('PTRC_W9_DRAFT_SERIALISATION_INVALID'); }
  return createTestamentaryIntake(parsed, options);
}

export function applyTestamentaryCorrection(intake, correction = {}, options = {}) {
  if (intake?.schemaVersion !== PTRC_TESTAMENTARY_INTAKE_VERSION) {
    throw new TypeError('PTRC_W9_INTAKE_REQUIRED');
  }
  const sectionId = requiredText(correction.sectionId, 'correction.sectionId');
  if (!PTRC_TESTAMENTARY_SECTIONS.includes(sectionId)) {
    throw new TypeError(`PTRC_W9_SECTION_UNKNOWN:${sectionId}`);
  }
  const next = serialisableInput(intake);
  next.dataVersion = intake.dataVersion + 1;
  next.status = 'DRAFT';
  next.sections[sectionId] = {
    ...next.sections[sectionId],
    ...(correction.status ? { status: correction.status } : {}),
    ...(correction.items ? { items: correction.items } : {}),
    ...(correction.note !== undefined ? { note: correction.note } : {}),
    ...(correction.sourceReferences ? { sourceReferences: correction.sourceReferences } : {}),
    ...(correction.conflicts ? { conflicts: correction.conflicts } : {})
  };
  const corrected = createTestamentaryIntake(next, options);
  return deepFreeze({
    ...corrected,
    previousDataVersion: intake.dataVersion,
    correctionReason: requiredText(correction.reason, 'correction.reason')
  });
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function approveTestamentarySnapshot(intake, approval = {}, options = {}) {
  if (intake?.schemaVersion !== PTRC_TESTAMENTARY_INTAKE_VERSION) {
    throw new TypeError('PTRC_W9_INTAKE_REQUIRED');
  }
  const consent = intake.normalizedFacts.sections.review_consent;
  if (!['KNOWN', 'PARTIAL'].includes(consent.status) || !consent.items.length) {
    throw new TypeError('PTRC_W9_REVIEW_CONSENT_REQUIRED');
  }
  const retentionUntil = isoInstant(approval.retentionUntil, 'retentionUntil');
  const approvedAt = isoInstant(options.now || approval.approvedAt || new Date().toISOString(), 'approvedAt');
  if (Date.parse(retentionUntil) <= Date.parse(approvedAt)) {
    throw new RangeError('PTRC_W9_RETENTION_MUST_BE_FUTURE');
  }
  const snapshotCore = {
    schemaVersion: 'ptrc-testamentary-approved-snapshot.v1',
    caseId: intake.caseId,
    clientId: intake.clientId,
    jurisdiction: intake.jurisdiction,
    currency: intake.currency,
    dataDate: intake.dataDate,
    dataVersion: intake.dataVersion,
    rawUserInput: intake.rawUserInput,
    normalizedFacts: intake.normalizedFacts,
    warnings: intake.warnings,
    reviewConsentReference: requiredText(approval.reviewConsentReference, 'reviewConsentReference'),
    approvedByRole: requiredText(approval.approvedByRole, 'approvedByRole'),
    approvedAt,
    retentionUntil
  };
  const snapshotFingerprint = await sha256Hex(stable(snapshotCore));
  return deepFreeze({
    ...snapshotCore,
    snapshotId: `${intake.caseId}:v${intake.dataVersion}:${snapshotFingerprint.slice(0, 12)}`,
    snapshotFingerprint,
    fingerprintAlgorithm: 'SHA-256',
    immutableApprovedSnapshot: true,
    modelMayMutateSnapshot: false
  });
}

export default Object.freeze({
  createTestamentaryIntake,
  serialiseTestamentaryDraft,
  resumeTestamentaryDraft,
  applyTestamentaryCorrection,
  approveTestamentarySnapshot
});
