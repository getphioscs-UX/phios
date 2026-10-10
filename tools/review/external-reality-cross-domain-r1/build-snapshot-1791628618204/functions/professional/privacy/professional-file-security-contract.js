export const PROFESSIONAL_FILE_SECURITY_VERSION =
  'phi-os.professional-file-security.v1';

export const PROFESSIONAL_FILE_TYPES = Object.freeze({
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});

export const PROFESSIONAL_FILE_MAXIMUM_BYTES = 26214400;
export const PROFESSIONAL_SIGNED_ACCESS_MAXIMUM_SECONDS = 900;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function normalized(value) {
  return cleanText(value).toLowerCase().replace(/^\./, '');
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

export function createProfessionalFileSecurityRecord(input = {}, options = {}) {
  if (input.upload_channel === 'ordinary_email') {
    throw new TypeError(
      'Highly restricted Professional files cannot use ordinary email.'
    );
  }
  const extension = normalized(input.extension);
  const mimeType = cleanText(input.mime_type).toLowerCase();
  if (!PROFESSIONAL_FILE_TYPES[extension]) {
    throw new TypeError('Professional file extension is not allowed.');
  }
  if (PROFESSIONAL_FILE_TYPES[extension] !== mimeType) {
    throw new TypeError('Professional file MIME type does not match extension.');
  }
  if (
    !Number.isInteger(input.size_bytes) ||
    input.size_bytes <= 0 ||
    input.size_bytes > PROFESSIONAL_FILE_MAXIMUM_BYTES
  ) {
    throw new TypeError('Professional file exceeds the allowed size.');
  }
  for (const flag of [
    'private_storage',
    'encryption_at_rest',
    'encryption_in_transit'
  ]) {
    if (input[flag] !== true) {
      throw new TypeError(`${flag} is required.`);
    }
  }
  const malwareStatus = normalized(input.malware_scan_status);
  if (!['pending', 'clean', 'infected', 'failed'].includes(malwareStatus)) {
    throw new TypeError('A supported malware scan status is required.');
  }

  const domain = normalized(input.domain);
  if (!['financial', 'human_design', 'report'].includes(domain)) {
    throw new TypeError('A supported Professional file domain is required.');
  }

  return Object.freeze({
    contract: PROFESSIONAL_FILE_SECURITY_VERSION,
    file_id: requiredText(input.file_id, 'file_id'),
    data_subject_id: requiredText(input.data_subject_id, 'data_subject_id'),
    consent_id: requiredText(input.consent_id, 'consent_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    domain,
    extension,
    mime_type: mimeType,
    size_bytes: input.size_bytes,
    received_at: isoDate(
      options.now || input.received_at || new Date().toISOString(),
      'received_at'
    ),
    upload_channel: 'secure_private_upload',
    private_storage: true,
    encryption_at_rest: true,
    encryption_in_transit: true,
    malware_scan_status: malwareStatus,
    access_ready: malwareStatus === 'clean',
    original_filename_retained: false,
    raw_content_in_audit_log: false,
    public_url: false,
    signed_access_required: true,
    download_logging_required: true,
    deletion_workflow_required: true,
    storage_implementation_enabled: false
  });
}

export function createTemporaryFileAccessGrant(input = {}, options = {}) {
  const record = input.file_security_record;
  if (record?.contract !== PROFESSIONAL_FILE_SECURITY_VERSION) {
    throw new TypeError('A valid Professional file security record is required.');
  }
  if (record.malware_scan_status !== 'clean' || record.access_ready !== true) {
    throw new TypeError('Professional file access requires a clean malware scan.');
  }
  if (
    input.explicit_action !== true ||
    input.consent_access_allowed !== true
  ) {
    throw new TypeError('Professional file access requires active consent.');
  }
  const ttl = Number(input.ttl_seconds);
  if (
    !Number.isInteger(ttl) ||
    ttl <= 0 ||
    ttl > PROFESSIONAL_SIGNED_ACCESS_MAXIMUM_SECONDS
  ) {
    throw new TypeError('Signed Professional file access exceeds maximum TTL.');
  }
  const now = isoDate(
    options.now || input.created_at || new Date().toISOString(),
    'created_at'
  );
  const action = normalized(input.action);
  if (!['view', 'download'].includes(action)) {
    throw new TypeError('A supported Professional file access action is required.');
  }
  const expiresAt = new Date(Date.parse(now) + ttl * 1000).toISOString();
  return Object.freeze({
    contract: PROFESSIONAL_FILE_SECURITY_VERSION,
    access_grant_id: requiredText(input.access_grant_id, 'access_grant_id'),
    file_id: record.file_id,
    professional_id: requiredText(input.professional_id, 'professional_id'),
    data_subject_id: record.data_subject_id,
    consent_id: record.consent_id,
    action,
    created_at: now,
    expires_at: expiresAt,
    ttl_seconds: ttl,
    audit_event_id: requiredText(input.audit_event_id, 'audit_event_id'),
    signed_url_required: true,
    signed_url_issued: false,
    public_url: false,
    download_logging_required: true,
    access_service_enabled: false
  });
}

export default Object.freeze({
  createProfessionalFileSecurityRecord,
  createTemporaryFileAccessGrant
});
