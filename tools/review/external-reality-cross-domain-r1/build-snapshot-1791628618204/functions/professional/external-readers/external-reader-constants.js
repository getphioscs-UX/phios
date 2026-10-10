export const EXTERNAL_READER_FRAMEWORK_VERSION =
  'phi-os.external-reader-framework.v1';

export const SUPPORTED_EXTERNAL_READERS = Object.freeze([
  'human_design',
  'bazi',
  'ziwei',
  'gene_keys',
  'astrology'
]);

export const EXTERNAL_READER_SOURCE_LABELS = Object.freeze([
  'user_provided',
  'uploaded_chart',
  'uploaded_external_chart',
  'manually_entered_chart_data',
  'phi_os_generated',
  'third_party_api',
  'registry_source',
  'rule_inference',
  'professional_interpretation',
  'ai_draft',
  'ai_assisted_draft',
  'client_confirmed_correspondence',
  'professionally_supported_correspondence',
  'unverified_correspondence'
]);

export const EXTERNAL_READER_RUNTIME_DOMAINS = Object.freeze([
  'carrier',
  'decision',
  'environment',
  'relationship',
  'experience',
  'expression',
  'action',
  'time',
  'resources',
  'constraints',
  'signatures',
  'navigation'
]);

export const EXTERNAL_READER_CORRESPONDENCE_STATUSES = Object.freeze([
  'possible',
  'client_confirmed',
  'professionally_supported',
  'possible_correspondence',
  'client_confirmed_correspondence',
  'professionally_supported_correspondence',
  'conflicting_evidence',
  'no_confirmed_correspondence',
  'insufficient_evidence'
]);

export const EXTERNAL_READER_CONFIDENCE_LEVELS = Object.freeze([
  'low',
  'moderate',
  'high',
  'not_assessed'
]);

export function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

export function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

export function assertReaderType(value) {
  const readerType = cleanText(value);
  if (!SUPPORTED_EXTERNAL_READERS.includes(readerType)) {
    throw new TypeError('Unsupported External Reader type.');
  }
  return readerType;
}

export function assertActiveWorkspace(workspace) {
  if (
    workspace?.consent_validated !== true ||
    workspace?.status === 'access_revoked'
  ) {
    throw new TypeError(
      'An active consent-gated Professional Workspace is required.'
    );
  }
}
