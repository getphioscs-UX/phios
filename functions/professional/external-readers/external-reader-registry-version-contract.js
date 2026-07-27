import {
  assertReaderType,
  cleanText,
  isoDate,
  requiredText
} from './external-reader-constants.js';

export const EXTERNAL_READER_REGISTRY_VERSION_CONTRACT_VERSION =
  'phi-os.external-reader-registry-version.v1';

export function createExternalReaderRegistryVersion(input = {}) {
  const effectiveFrom = isoDate(input.effective_from, 'effective_from');
  const effectiveUntil = cleanText(input.effective_until)
    ? isoDate(input.effective_until, 'effective_until')
    : null;
  if (effectiveUntil && effectiveUntil <= effectiveFrom) {
    throw new TypeError('effective_until must follow effective_from.');
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_REGISTRY_VERSION_CONTRACT_VERSION,
    reader_type: assertReaderType(input.reader_type),
    registry_version: requiredText(
      input.registry_version,
      'registry_version'
    ),
    registry_schema_version: requiredText(
      input.registry_schema_version,
      'registry_schema_version'
    ),
    content_version: requiredText(
      input.content_version,
      'content_version'
    ),
    effective_from: effectiveFrom,
    effective_until: effectiveUntil,
    change_reason: requiredText(input.change_reason, 'change_reason'),
    changed_by: requiredText(input.changed_by, 'changed_by'),
    reviewed_by: cleanText(input.reviewed_by) || null,
    supersedes: cleanText(input.supersedes) || null,
    historical_report_reference_supported: true
  });
}

export default Object.freeze({
  createExternalReaderRegistryVersion
});
