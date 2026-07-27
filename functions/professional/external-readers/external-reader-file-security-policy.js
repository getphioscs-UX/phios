export const EXTERNAL_READER_FILE_POLICY_VERSION = 'm4b-w8.file.1';
export const EXTERNAL_READER_ALLOWED_FILE_TYPES = Object.freeze({
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  webp: 'image/webp', pdf: 'application/pdf'
});
export const EXTERNAL_READER_MAXIMUM_FILE_BYTES = 26214400;
export const EXTERNAL_READER_SIGNED_ACCESS_MAXIMUM_SECONDS = 900;

export function getExternalReaderFileSecurityPolicy() {
  return Object.freeze({
    schema_version: EXTERNAL_READER_FILE_POLICY_VERSION,
    allowed_file_types: EXTERNAL_READER_ALLOWED_FILE_TYPES,
    maximum_file_size_bytes: EXTERNAL_READER_MAXIMUM_FILE_BYTES,
    malware_scan_required: true,
    private_storage_required: true,
    signed_access_url_required: true,
    access_expiry_maximum_seconds: EXTERNAL_READER_SIGNED_ACCESS_MAXIMUM_SECONDS,
    deletion_workflow_required: true,
    ordinary_email_upload_allowed: false,
    public_url_allowed: false,
    storage_implementation_enabled: false,
    malware_scanner_enabled: false,
    signed_url_service_enabled: false,
    deletion_worker_enabled: false
  });
}

export function validateExternalReaderFileMetadata(input = {}) {
  const extension = String(input.extension || '').trim().toLowerCase().replace(/^\./, '');
  const mimeType = String(input.mime_type || '').trim().toLowerCase();
  if (EXTERNAL_READER_ALLOWED_FILE_TYPES[extension] !== mimeType) throw new TypeError('File type is not allowed or MIME does not match.');
  if (!Number.isInteger(input.size_bytes) || input.size_bytes <= 0 || input.size_bytes > EXTERNAL_READER_MAXIMUM_FILE_BYTES) {
    throw new TypeError('File exceeds the maximum size.');
  }
  return Object.freeze({
    extension, mime_type: mimeType, size_bytes: input.size_bytes,
    metadata_valid: true, upload_authorised: false,
    malware_scan_status: 'not_started', private_storage_confirmed: false
  });
}
