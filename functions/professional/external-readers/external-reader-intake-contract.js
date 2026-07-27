import { assertReaderType, cleanText, isoDate, requiredText } from './external-reader-constants.js';

export const EXTERNAL_READER_INTAKE_CONTRACT_VERSION = 'phi-os.external-reader-intake.v1';
export const EXTERNAL_READER_RETENTION_CHOICES = Object.freeze([
  'service_only', 'future_professional_sessions', 'delete_after_service'
]);
const HD_FIELDS = new Set([
  'type', 'strategy', 'authority', 'profile', 'definition', 'centers',
  'channels', 'gates', 'variables_phs', 'environment', 'cognition',
  'motivation', 'perspective'
]);

function fields(readerType, input = {}) {
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    const text = cleanText(value);
    if (!text) continue;
    if (readerType === 'human_design' && !HD_FIELDS.has(key)) {
      throw new TypeError(`Unsupported Human Design intake field: ${key}.`);
    }
    result[key] = text;
  }
  return Object.freeze(result);
}

export function createExternalReaderIntake(input = {}, options = {}) {
  const readerType = assertReaderType(input.reader_type);
  const knownFields = fields(readerType, input.known_chart_fields);
  if (!input.chart_upload && !Object.keys(knownFields).length) {
    throw new TypeError('An uploaded chart or manually entered chart fields are required.');
  }
  if (input.chart_upload?.reader_type !== readerType && input.chart_upload) {
    throw new TypeError('Chart upload reader_type does not match intake.');
  }
  if (!EXTERNAL_READER_RETENTION_CHOICES.includes(input.retention_choice)) {
    throw new TypeError('Unsupported External Reader retention choice.');
  }
  for (const key of [
    'data_submission_confirmed',
    'interpretation_boundary_acknowledged',
    'professional_access_confirmed'
  ]) {
    if (input.consent?.[key] !== true) throw new TypeError(`Intake consent requires ${key}.`);
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_INTAKE_CONTRACT_VERSION,
    intake_id: requiredText(input.intake_id, 'intake_id'),
    workspace_id: cleanText(input.workspace_id) || null,
    client_id: requiredText(input.client_id, 'client_id'),
    display_name: requiredText(input.display_name, 'display_name'),
    reader_type: readerType,
    service_id: requiredText(input.service_id, 'service_id'),
    current_reality_question: requiredText(input.current_reality_question, 'current_reality_question'),
    birth_data: input.birth_data || null,
    chart_upload: input.chart_upload || null,
    known_chart_fields: knownFields,
    source_platform: cleanText(input.source_platform) || null,
    calculation_settings_known: input.calculation_settings_known === true,
    school_or_lineage: cleanText(input.school_or_lineage) || null,
    consent: Object.freeze({
      data_submission_confirmed: true,
      interpretation_boundary_acknowledged: true,
      professional_access_confirmed: true,
      runtime_evidence_use_authorised: false,
      runtime_memory_use_authorised: false
    }),
    retention_choice: input.retention_choice,
    status: 'ready_for_professional_review',
    submitted_at: isoDate(input.submitted_at || options.now || new Date().toISOString(), 'submitted_at'),
    interpretation_available: readerType === 'human_design',
    automatic_chart_calculation_used: false,
    automatic_chart_rendering_used: false,
    automatic_interpretation_generated: false,
    automatic_report_generated: false,
    runtime_reading_modified: false,
    runtime_evidence_written: false,
    runtime_memory_written: false
  });
}
