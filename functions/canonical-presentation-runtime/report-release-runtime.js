import crypto from 'node:crypto';
import {
  validateProfessionalConsent
} from '../professional/consent/professional-consent-contract.js';

export const REPORT_RELEASE_ASSERTION_VERSION =
  'PHI-OS-REPORT-RELEASE-ASSERTION-v1.0.0';

export const REPORT_RELEASE_STATUSES = Object.freeze([
  'ACTIVE', 'REVOKED', 'SUPERSEDED', 'EXPIRED'
]);

export const REPORT_RELEASE_CHANNELS = Object.freeze([
  'CUSTOMER_WORKSPACE', 'SECURE_PDF', 'APP'
]);

function object(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(code);
  }
  return value;
}

function text(value, code) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(code);
  }
  return value.trim();
}

function iso(value, code) {
  const candidate = text(value, code);
  const time = Date.parse(candidate);
  if (!Number.isFinite(time)) throw new TypeError(code);
  return new Date(time).toISOString();
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, stable(value[key])])
    );
  }
  return value;
}

export function digestCanonical(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stable(value)))
    .digest('hex');
}

function validateConsent(consent, report, professionalId, options) {
  const validation = validateProfessionalConsent(consent, options);
  if (!validation.active) {
    throw new Error(`CPR_RELEASE_CONSENT_INVALID:${validation.errors.join('|')}`);
  }
  if (consent.consent_id !== report.consent_reference) {
    throw new Error('CPR_RELEASE_CONSENT_REFERENCE_MISMATCH');
  }
  if (consent.client_id !== report.client_id) {
    throw new Error('CPR_RELEASE_CONSENT_CUSTOMER_MISMATCH');
  }
  if (consent.professional_id !== professionalId) {
    throw new Error('CPR_RELEASE_CONSENT_PROFESSIONAL_MISMATCH');
  }
  const revoked = Array.isArray(consent.revoked_scopes)
    ? consent.revoked_scopes
    : [];
  if (
    consent.revoked === true ||
    revoked.includes('all_professional_access') ||
    revoked.includes('report_sharing')
  ) {
    throw new Error('CPR_RELEASE_REPORT_SHARING_REVOKED');
  }
  return consent;
}

export function createReportReleaseAssertion(input = {}, options = {}) {
  const bundle = object(input.reportBundle, 'CPR_RELEASE_REPORT_BUNDLE_REQUIRED');
  const report = object(bundle.report, 'CPR_RELEASE_CANONICAL_REPORT_REQUIRED');
  const signed = object(bundle.signedOutput, 'CPR_RELEASE_SIGNED_OUTPUT_REQUIRED');
  const authorisation = object(
    bundle.authorisation,
    'CPR_RELEASE_PROFESSIONAL_AUTHORISATION_REQUIRED'
  );
  const release = object(input.release, 'CPR_RELEASE_INPUT_REQUIRED');

  if (report.status !== 'final') {
    throw new Error('CPR_RELEASE_REPORT_NOT_FINAL');
  }
  if (
    authorisation.allowed !== true ||
    authorisation.professional_id !== report.professional_id ||
    authorisation.client_id !== report.client_id
  ) {
    throw new Error('CPR_RELEASE_PROFESSIONAL_NOT_AUTHORISED');
  }
  if (
    signed.professional_id !== report.professional_id ||
    signed.client_id !== report.client_id ||
    signed.signed_by !== report.professional_id ||
    !signed.signed_at
  ) {
    throw new Error('CPR_RELEASE_SIGNED_REPORT_REQUIRED');
  }
  if (release.explicitAction !== true) {
    throw new Error('CPR_RELEASE_EXPLICIT_ACTION_REQUIRED');
  }

  const customerId = text(release.customerId, 'CPR_RELEASE_CUSTOMER_REQUIRED');
  const professionalId = text(
    release.professionalId,
    'CPR_RELEASE_PROFESSIONAL_REQUIRED'
  );
  if (customerId !== report.client_id) {
    throw new Error('CPR_RELEASE_CUSTOMER_REPORT_MISMATCH');
  }
  if (professionalId !== report.professional_id) {
    throw new Error('CPR_RELEASE_PROFESSIONAL_REPORT_MISMATCH');
  }
  if (release.releasedBy !== professionalId) {
    throw new Error('CPR_RELEASE_ACTOR_MUST_MATCH_PROFESSIONAL');
  }

  const channel = text(release.releaseChannel, 'CPR_RELEASE_CHANNEL_REQUIRED');
  if (!REPORT_RELEASE_CHANNELS.includes(channel)) {
    throw new Error('CPR_RELEASE_CHANNEL_INVALID');
  }
  const releaseStatus = release.releaseStatus || 'ACTIVE';
  if (releaseStatus !== 'ACTIVE') {
    throw new Error('CPR_RELEASE_CREATION_MUST_BEGIN_ACTIVE');
  }

  const releasedAt = iso(
    options.now || release.releasedAt,
    'CPR_RELEASE_TIME_REQUIRED'
  );
  validateConsent(input.consent, report, professionalId, { now: releasedAt });

  const reportDigest = digestCanonical(report);
  if (release.reportDigest && release.reportDigest !== reportDigest) {
    throw new Error('CPR_RELEASE_REPORT_DIGEST_MISMATCH');
  }

  const body = Object.freeze({
    schemaVersion: REPORT_RELEASE_ASSERTION_VERSION,
    releaseId: text(release.releaseId, 'CPR_RELEASE_ID_REQUIRED'),
    reportId: report.report_id,
    reportVersion: report.version,
    reportDigest,
    customerId,
    professionalId,
    consentReference: report.consent_reference,
    releaseChannel: channel,
    releasedAt,
    releasedBy: professionalId,
    releaseReason: text(release.releaseReason, 'CPR_RELEASE_REASON_REQUIRED'),
    releaseStatus,
    previousReleaseReference: release.previousReleaseReference || null,
    supersedesReleaseReference: release.supersedesReleaseReference || null,
    signatureReference: Object.freeze({
      signedAt: iso(signed.signed_at, 'CPR_RELEASE_SIGNATURE_TIME_INVALID'),
      signedBy: text(signed.signed_by, 'CPR_RELEASE_SIGNATURE_ACTOR_REQUIRED'),
      source: 'HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_BUNDLE'
    }),
    authority: Object.freeze({
      ownsCustomerDistributionEligibilityOnly: true,
      ownsReportContent: false,
      ownsPresentationComposition: false,
      ownsProfessionalJudgment: false
    })
  });

  return Object.freeze({
    ...body,
    releaseDigest: digestCanonical(body)
  });
}

export function updateReportReleaseStatus(
  assertion,
  status,
  input = {},
  options = {}
) {
  object(assertion, 'CPR_RELEASE_ASSERTION_REQUIRED');
  if (!REPORT_RELEASE_STATUSES.includes(status) || status === 'ACTIVE') {
    throw new Error('CPR_RELEASE_TRANSITION_STATUS_INVALID');
  }
  if (assertion.releaseStatus !== 'ACTIVE') {
    throw new Error('CPR_RELEASE_ONLY_ACTIVE_MAY_TRANSITION');
  }
  if (input.explicitAction !== true) {
    throw new Error('CPR_RELEASE_TRANSITION_EXPLICIT_ACTION_REQUIRED');
  }
  const changedAt = iso(
    options.now || input.changedAt,
    'CPR_RELEASE_TRANSITION_TIME_REQUIRED'
  );
  const body = Object.freeze({
    ...assertion,
    releaseStatus: status,
    statusChangedAt: changedAt,
    statusChangedBy: text(
      input.changedBy,
      'CPR_RELEASE_TRANSITION_ACTOR_REQUIRED'
    ),
    statusChangeReason: text(
      input.reason,
      'CPR_RELEASE_TRANSITION_REASON_REQUIRED'
    ),
    releaseDigest: undefined
  });
  const cleanBody = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined)
  );
  return Object.freeze({
    ...cleanBody,
    releaseDigest: digestCanonical(cleanBody)
  });
}

export default Object.freeze({
  createReportReleaseAssertion,
  updateReportReleaseStatus,
  digestCanonical
});
