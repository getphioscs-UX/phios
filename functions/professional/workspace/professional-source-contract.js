export const PROFESSIONAL_SOURCE_CONTRACT_VERSION =
  'phi-os.professional-source.v1';

export const PROFESSIONAL_SOURCE_TYPES = Object.freeze([
  'user_provided',
  'system_extracted',
  'rule_inference',
  'workers_ai_interpretation',
  'professional_observation',
  'external_reader_interpretation'
]);

export const EXTERNAL_READER_TYPES = Object.freeze([
  'human_design',
  'astrology',
  'bazi',
  'ziwei',
  'zi_wei',
  'gene_keys',
  'i_ching',
  'tarot',
  'other_professional_system'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

export function createProfessionalSourceReference(input = {}) {
  const sourceType = cleanText(input.source_type);
  if (!PROFESSIONAL_SOURCE_TYPES.includes(sourceType)) {
    throw new TypeError('A supported professional source_type is required.');
  }
  const readerType = cleanText(input.reader_type);
  if (
    sourceType === 'external_reader_interpretation' &&
    !EXTERNAL_READER_TYPES.includes(readerType)
  ) {
    throw new TypeError(
      'External Reader Interpretation requires a supported reader_type.'
    );
  }
  if (
    sourceType !== 'external_reader_interpretation' &&
    readerType
  ) {
    throw new TypeError(
      'reader_type is only allowed for External Reader Interpretation.'
    );
  }
  const evidenceEligible = [
    'user_provided',
    'system_extracted'
  ].includes(sourceType);
  return Object.freeze({
    schema_version: PROFESSIONAL_SOURCE_CONTRACT_VERSION,
    source_reference_id: requiredText(
      input.source_reference_id,
      'source_reference_id'
    ),
    source_type: sourceType,
    source_record_id: requiredText(input.source_record_id, 'source_record_id'),
    reader_type: readerType || null,
    client_visible: input.client_visible === true,
    evidence_eligible: evidenceEligible,
    interpretation_only: !evidenceEligible,
    runtime_evidence_written: false,
    limitations: Object.freeze(
      Array.isArray(input.limitations)
        ? input.limitations.map(value => requiredText(value, 'limitation'))
        : []
    )
  });
}

export function assertExternalReaderBoundary(source) {
  if (
    source?.source_type === 'external_reader_interpretation' &&
    (
      source.evidence_eligible !== false ||
      source.interpretation_only !== true ||
      source.runtime_evidence_written !== false
    )
  ) {
    throw new TypeError(
      'External Reader Interpretation cannot become Runtime Evidence.'
    );
  }
  return true;
}

export default Object.freeze({
  createProfessionalSourceReference,
  assertExternalReaderBoundary
});
