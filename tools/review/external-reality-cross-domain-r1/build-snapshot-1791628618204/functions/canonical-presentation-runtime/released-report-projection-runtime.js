import {
  digestCanonical,
  REPORT_RELEASE_ASSERTION_VERSION
} from './report-release-runtime.js';
import {
  validateProfessionalConsent
} from '../professional/consent/professional-consent-contract.js';

export const RELEASED_CUSTOMER_REPORT_PROJECTION_VERSION =
  'PHI-OS-RELEASED-CUSTOMER-REPORT-PROJECTION-v1.0.0';

function object(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(code);
  }
  return value;
}

export function resolveReleasedCustomerReport(input = {}, options = {}) {
  const report = object(input.report, 'CPR_RELEASED_REPORT_REQUIRED');
  const release = object(
    input.releaseAssertion,
    'CPR_RELEASED_ASSERTION_REQUIRED'
  );
  const consent = object(input.consent, 'CPR_RELEASED_CONSENT_REQUIRED');

  if (report.status !== 'final') {
    throw new Error('CPR_RELEASED_REPORT_NOT_FINAL');
  }
  if (release.schemaVersion !== REPORT_RELEASE_ASSERTION_VERSION) {
    throw new Error('CPR_RELEASED_ASSERTION_VERSION_INVALID');
  }
  if (release.releaseStatus !== 'ACTIVE') {
    throw new Error(`CPR_RELEASED_RELEASE_NOT_ACTIVE:${release.releaseStatus}`);
  }
  if (
    release.reportId !== report.report_id ||
    release.reportVersion !== report.version ||
    release.customerId !== report.client_id ||
    release.professionalId !== report.professional_id
  ) {
    throw new Error('CPR_RELEASED_REPORT_RELEASE_IDENTITY_MISMATCH');
  }
  const reportDigest = digestCanonical(report);
  if (release.reportDigest !== reportDigest) {
    throw new Error('CPR_RELEASED_REPORT_DIGEST_MISMATCH');
  }
  if (
    !release.signatureReference ||
    release.signatureReference.signedBy !== report.professional_id
  ) {
    throw new Error('CPR_RELEASED_SIGNATURE_REFERENCE_INVALID');
  }

  const now = options.now || new Date().toISOString();
  const validation = validateProfessionalConsent(consent, { now });
  if (!validation.active) {
    throw new Error('CPR_RELEASED_CONSENT_NOT_ACTIVE');
  }
  if (
    consent.consent_id !== release.consentReference ||
    consent.client_id !== report.client_id ||
    consent.professional_id !== report.professional_id
  ) {
    throw new Error('CPR_RELEASED_CONSENT_IDENTITY_MISMATCH');
  }
  const revoked = Array.isArray(consent.revoked_scopes)
    ? consent.revoked_scopes
    : [];
  if (
    consent.revoked === true ||
    revoked.includes('all_professional_access') ||
    revoked.includes('report_sharing')
  ) {
    throw new Error('CPR_RELEASED_REPORT_SHARING_REVOKED');
  }

  const eligibilityBody = Object.freeze({
    schemaVersion: RELEASED_CUSTOMER_REPORT_PROJECTION_VERSION,
    eligibilityCode: `RELEASED:${release.releaseId}:${report.report_id}:${report.version}`,
    reportReference: Object.freeze({
      reportId: report.report_id,
      reportVersion: report.version,
      reportDigest
    }),
    releaseReference: Object.freeze({
      releaseId: release.releaseId,
      releaseDigest: release.releaseDigest,
      releasedAt: release.releasedAt,
      releaseChannel: release.releaseChannel
    }),
    customerReference: Object.freeze({
      customerId: report.client_id
    }),
    professionalReference: Object.freeze({
      professionalId: report.professional_id
    }),
    sourceAuthority: 'RELEASED_CANONICAL_REPORT',
    downstreamEligibilityOnly: true,
    mutatesReport: false,
    clonesReportAuthority: false,
    changesInterpretation: false
  });

  return Object.freeze({
    ...eligibilityBody,
    sourceDigest: digestCanonical(eligibilityBody),
    canonicalReport: report
  });
}

export default Object.freeze({ resolveReleasedCustomerReport });
