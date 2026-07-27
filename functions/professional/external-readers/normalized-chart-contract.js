import {
  assertReaderType,
  isoDate,
  requiredText
} from './external-reader-constants.js';

export const NORMALIZED_EXTERNAL_CHART_CONTRACT_VERSION =
  'phi-os.external-reader-normalized-chart.v1';

const VERIFICATION_STATUSES = new Set([
  'unverified',
  'professional_review',
  'verified',
  'conflicting'
]);

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.freeze({ ...value })
    : Object.freeze({});
}

function textList(value, field) {
  return Object.freeze(
    Array.isArray(value)
      ? value.map(item => requiredText(item, field))
      : []
  );
}

export function createNormalizedExternalChart(
  input = {},
  options = {}
) {
  const verificationStatus = requiredText(
    input.verification_status,
    'verification_status'
  );
  if (!VERIFICATION_STATUSES.has(verificationStatus)) {
    throw new TypeError('Unsupported chart verification status.');
  }
  if (!input.source || typeof input.source !== 'object') {
    throw new TypeError('Normalized Chart requires a source.');
  }
  return Object.freeze({
    schema_version: NORMALIZED_EXTERNAL_CHART_CONTRACT_VERSION,
    chart_id: requiredText(input.chart_id, 'chart_id'),
    reader_type: assertReaderType(input.reader_type),
    reader_version: requiredText(input.reader_version, 'reader_version'),
    input_summary: requiredText(input.input_summary, 'input_summary'),
    chart_data: object(input.chart_data),
    derived_fields: object(input.derived_fields),
    warnings: textList(input.warnings, 'warning'),
    uncertainties: textList(input.uncertainties, 'uncertainty'),
    source: input.source,
    verification_status: verificationStatus,
    generated_at: isoDate(
      input.generated_at || options.now || new Date().toISOString(),
      'generated_at'
    ),
    updated_at: isoDate(
      input.updated_at || options.now || new Date().toISOString(),
      'updated_at'
    ),
    runtime_evidence_written: false,
    runtime_reading_generated: false
  });
}

export default Object.freeze({ createNormalizedExternalChart });
