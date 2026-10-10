export const PTRC_TESTAMENTARY_SECURITY_VERSION = 'ptrc-testamentary-security.v1';

export const PTRC_TESTAMENTARY_ROLE_PERMISSIONS = Object.freeze({
  CLIENT: Object.freeze(['READ', 'EDIT', 'REVIEW', 'EXPORT', 'DELETE']),
  PROFESSIONAL: Object.freeze(['READ', 'EDIT', 'REVIEW', 'EXPORT', 'AUDIT']),
  AUDITOR: Object.freeze(['READ', 'AUDIT']),
  SYSTEM: Object.freeze(['READ', 'AUDIT', 'DELETE_EXPIRED'])
});

export const PTRC_TESTAMENTARY_SECURITY_POLICY = Object.freeze({
  encryptionAtRestRequired: true,
  transportEncryptionRequired: true,
  leastPrivilegeRequired: true,
  auditEventsRequired: true,
  retentionUntilRequired: true,
  rawDocumentEmbeddingAllowed: false,
  fullIdentityNumberStorageAllowed: false,
  automaticPermanentDownloadAllowed: false,
  downloadExpiryRequired: true,
  maxDownloadTtlMinutes: 60
});

const EXPORT_REDACTED_KEYS = new Set([
  'rawUserInput', 'identity_number', 'national_id', 'passport_number',
  'tax_number', 'bank_account_number', 'account_number', 'policy_number',
  'exact_address', 'password', 'secret', 'private_key', 'seed_phrase',
  'document_storage_key', 'private_note', 'internal_note'
]);

const clean = value => String(value ?? '').trim();
const instant = (value, field) => {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new TypeError(`PTRC_W9_INSTANT_INVALID:${field}`);
  return new Date(time).toISOString();
};

export function assertTestamentaryPermission(role, action) {
  const normalizedRole = clean(role).toUpperCase();
  const normalizedAction = clean(action).toUpperCase();
  if (!(PTRC_TESTAMENTARY_ROLE_PERMISSIONS[normalizedRole] || []).includes(normalizedAction)) {
    throw new Error(`PTRC_W9_ACCESS_DENIED:${normalizedRole || 'MISSING'}:${normalizedAction || 'MISSING'}`);
  }
  return true;
}

export function createTestamentaryAuditEvent({ action, actorRole, caseId, snapshotId = null, now, details = {} } = {}) {
  assertTestamentaryPermission(actorRole, action === 'AUDIT_VIEW' ? 'AUDIT' : action);
  return Object.freeze({
    schemaVersion: 'ptrc-testamentary-audit-event.v1',
    action: clean(action).toUpperCase(),
    actorRole: clean(actorRole).toUpperCase(),
    caseId: clean(caseId),
    snapshotId: clean(snapshotId) || null,
    occurredAt: instant(now || new Date().toISOString(), 'audit.now'),
    details: Object.freeze({ ...details }),
    sensitivePayloadIncluded: false
  });
}

export function createTestamentaryExportGrant({ caseId, snapshotId, actorRole, now, ttlMinutes = 15 } = {}) {
  assertTestamentaryPermission(actorRole, 'EXPORT');
  const issuedAt = instant(now || new Date().toISOString(), 'export.now');
  const ttl = Number(ttlMinutes);
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > PTRC_TESTAMENTARY_SECURITY_POLICY.maxDownloadTtlMinutes) {
    throw new RangeError('PTRC_W9_EXPORT_TTL_INVALID');
  }
  return Object.freeze({
    schemaVersion: 'ptrc-testamentary-export-grant.v1',
    caseId: clean(caseId),
    snapshotId: clean(snapshotId),
    actorRole: clean(actorRole).toUpperCase(),
    issuedAt,
    expiresAt: new Date(Date.parse(issuedAt) + ttl * 60_000).toISOString(),
    ttlMinutes: ttl,
    singlePurpose: 'REVIEWABLE_DRAFT_EXPORT',
    permanentLink: false
  });
}

export function inspectTestamentaryExportGrant(grant, now = new Date().toISOString()) {
  const current = Date.parse(instant(now, 'export.inspect.now'));
  const expiry = Date.parse(instant(grant?.expiresAt, 'export.expiresAt'));
  return Object.freeze({
    valid: current < expiry,
    status: current < expiry ? 'ACTIVE' : 'EXPIRED',
    expiresAt: grant.expiresAt
  });
}

export function redactTestamentaryExport(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(redactTestamentaryExport));
  if (!value || typeof value !== 'object') return value;
  return Object.freeze(Object.fromEntries(Object.entries(value).flatMap(([key, child]) =>
    EXPORT_REDACTED_KEYS.has(key) ? [] : [[key, redactTestamentaryExport(child)]]
  )));
}

export function createTestamentaryDeletionReceipt({ caseId, snapshotId = null, actorRole, now } = {}) {
  assertTestamentaryPermission(actorRole, 'DELETE');
  const deletedAt = instant(now || new Date().toISOString(), 'delete.now');
  return Object.freeze({
    schemaVersion: 'ptrc-testamentary-deletion-receipt.v1',
    caseId: clean(caseId),
    snapshotId: clean(snapshotId) || null,
    deletedAt,
    deletedByRole: clean(actorRole).toUpperCase(),
    payload: null,
    recoverableFromApplicationState: false,
    auditEvent: Object.freeze({
      action: 'DELETE', caseId: clean(caseId), snapshotId: clean(snapshotId) || null,
      actorRole: clean(actorRole).toUpperCase(), occurredAt: deletedAt, sensitivePayloadIncluded: false
    })
  });
}
