import {
  EXTERNAL_READER_SOURCE_LABELS,
  cleanText,
  requiredText
} from './external-reader-constants.js';

export const EXTERNAL_READER_SOURCE_CONTRACT_VERSION =
  'phi-os.external-reader-source.v1';

export function createExternalReaderSourceLabel(input = {}) {
  const sourceLabel = cleanText(input.source_label);
  if (!EXTERNAL_READER_SOURCE_LABELS.includes(sourceLabel)) {
    throw new TypeError('Unsupported External Reader source label.');
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_SOURCE_CONTRACT_VERSION,
    source_label: sourceLabel,
    source_reference_id: requiredText(
      input.source_reference_id,
      'source_reference_id'
    ),
    source_version: cleanText(input.source_version) || null,
    created_by: cleanText(input.created_by) || null,
    created_at: cleanText(input.created_at) || null,
    verified_by: cleanText(input.verified_by) || null,
    verified_at: cleanText(input.verified_at) || null,
    display_label: Object.freeze({
      en: requiredText(input.display_label?.en, 'display_label.en'),
      'zh-Hans': requiredText(
        input.display_label?.['zh-Hans'],
        'display_label.zh-Hans'
      )
    }),
    runtime_evidence_label: false,
    source_display_required: true
  });
}

export default Object.freeze({ createExternalReaderSourceLabel });
