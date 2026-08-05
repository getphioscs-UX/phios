export const ERROR_CODES = Object.freeze([
  'NODE_CODE_REQUIRED',
  'NODE_CODE_INVALID',
  'NODE_NOT_FOUND',
  'NODE_NOT_PRODUCTION_READY',
  'LOCALIZED_CONTENT_NOT_FOUND',
  'CANONICAL_THESIS_NOT_READY',
  'READINESS_FILE_NOT_FOUND',
  'SCHEMA_NOT_FOUND',
  'SCHEMA_VERSION_UNSUPPORTED',
  'OUTPUT_ALREADY_EXISTS',
  'PACKAGE_NOT_FOUND',
  'PACKAGE_FORMAT_UNSUPPORTED',
  'PACKAGE_TOO_LARGE',
  'PACKAGE_FILE_LIMIT_EXCEEDED',
  'PACKAGE_PATH_TRAVERSAL',
  'PACKAGE_SYMLINK_NOT_ALLOWED',
  'PACKAGE_FILE_MISSING',
  'PACKAGE_UNKNOWN_FILE',
  'PACKAGE_MANIFEST_INVALID',
  'PACKAGE_CHECKSUM_MISMATCH',
  'PACKAGE_NODE_MISMATCH',
  'PACKAGE_LOCALE_MISMATCH',
  'PACKAGE_STATUS_FORBIDDEN',
  'ARTICLE_SCHEMA_INVALID',
  'CLAIM_SCHEMA_INVALID',
  'SOURCE_SCHEMA_INVALID',
  'REVIEW_SCHEMA_INVALID',
  'MEDIA_BRIEF_SCHEMA_INVALID',
  'CROSS_REFERENCE_INVALID',
  'REGISTRY_RELATION_MISMATCH',
  'TARGET_PACKAGE_EXISTS',
  'TARGET_PATH_PROTECTED',
  'IMPORT_REQUIRES_VALID_PACKAGE',
  'IMPORT_CONFLICT',
  'IMPORT_ATOMIC_WRITE_FAILED'
]);

export class ProductionError extends Error {
  constructor(code, message, hint = null, details = null) {
    super(message);
    this.name = 'ProductionError';
    this.code = code;
    this.hint = hint;
    this.details = details;
  }
}

export function finding(code, message, path = null) {
  return { code, message, path };
}

export function formatError(error) {
  const code = error?.code || 'IMPORT_CONFLICT';
  const lines = [`${code}: ${error?.message || 'Unexpected production tool failure.'}`];
  if (error?.hint) lines.push(`Hint: ${error.hint}`);
  if (error?.details) lines.push(`Details: ${error.details}`);
  return lines.join('\n');
}
