import {
  EXTERNAL_READER_RUNTIME_DOMAINS,
  EXTERNAL_READER_CONFIDENCE_LEVELS,
  assertActiveWorkspace,
  assertReaderType,
  cleanText,
  isoDate,
  requiredText
} from './external-reader-constants.js';

export const EXTERNAL_READER_INTERPRETATION_CONTRACT_VERSION =
  'phi-os.external-reader-interpretation.v1';

export function createExternalReaderInterpretation(
  workspace,
  input = {}
) {
  assertActiveWorkspace(workspace);
  const runtimeDomain = cleanText(input.runtime_domain);
  if (!EXTERNAL_READER_RUNTIME_DOMAINS.includes(runtimeDomain)) {
    throw new TypeError('Unsupported External Reader runtime_domain.');
  }
  const confidence = cleanText(input.confidence);
  if (!EXTERNAL_READER_CONFIDENCE_LEVELS.includes(confidence)) {
    throw new TypeError('Unsupported External Reader confidence.');
  }
  if (!input.source_reference || typeof input.source_reference !== 'object') {
    throw new TypeError('Interpretation requires a source reference.');
  }
  const limitations = Array.isArray(input.limitations)
    ? input.limitations.map(item => requiredText(item, 'limitation'))
    : [];
  if (!limitations.length) {
    throw new TypeError('Interpretation requires at least one limitation.');
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_INTERPRETATION_CONTRACT_VERSION,
    interpretation_id: requiredText(
      input.interpretation_id,
      'interpretation_id'
    ),
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    service_id: workspace.service_id,
    reader_type: assertReaderType(input.reader_type),
    chart_element: requiredText(input.chart_element, 'chart_element'),
    chart_id: requiredText(input.chart_id, 'chart_id'),
    source_reference: input.source_reference,
    interpretation: requiredText(
      input.interpretation,
      'interpretation'
    ),
    runtime_domain: runtimeDomain,
    confidence,
    limitations: Object.freeze(limitations),
    professional_id: requiredText(
      input.professional_id || workspace.professional_id,
      'professional_id'
    ),
    client_visible: input.client_visible === true,
    status: cleanText(input.status) || 'draft',
    created_at: isoDate(
      input.created_at || new Date().toISOString(),
      'created_at'
    ),
    updated_at: isoDate(
      input.updated_at || input.created_at || new Date().toISOString(),
      'updated_at'
    ),
    interpretation_only: true,
    runtime_reading_generated: false,
    runtime_evidence_written: false,
    runtime_memory_written: false,
    professional_review_replaced: false
  });
}

export default Object.freeze({ createExternalReaderInterpretation });
