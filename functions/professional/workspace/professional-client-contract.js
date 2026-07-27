export const PROFESSIONAL_CLIENT_CONTRACT_VERSION =
  'phi-os.professional-client-index.v1';

export const PROFESSIONAL_CLIENT_STATUSES = Object.freeze([
  'prospective',
  'awaiting_consent',
  'active_service',
  'follow_up',
  'completed',
  'archived'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function isoDate(value, field, optional = false) {
  const text = cleanText(value);
  if (!text && optional) return null;
  const time = Date.parse(text);
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

export function createProfessionalClientIndex(input = {}) {
  const status = cleanText(input.professional_status) || 'prospective';
  if (!PROFESSIONAL_CLIENT_STATUSES.includes(status)) {
    throw new TypeError('Unsupported professional_status.');
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_CLIENT_CONTRACT_VERSION,
    client_id: requiredText(input.client_id, 'client_id'),
    display_name: requiredText(input.display_name, 'display_name'),
    current_runtime_id: cleanText(input.current_runtime_id) || null,
    service_id: cleanText(input.service_id) || null,
    professional_status: status,
    consent_status: cleanText(input.consent_status) || 'not_granted',
    next_appointment_at: isoDate(
      input.next_appointment_at,
      'next_appointment_at',
      true
    ),
    pending_material_count: Math.max(
      0,
      Number.parseInt(input.pending_material_count, 10) || 0
    ),
    report_status: cleanText(input.report_status) || 'not_started',
    follow_up_at: isoDate(input.follow_up_at, 'follow_up_at', true),
    index_only: true,
    sensitive_birth_data_embedded: false,
    uploaded_files_embedded: false,
    runtime_content_embedded: false
  });
}

export default Object.freeze({ createProfessionalClientIndex });
