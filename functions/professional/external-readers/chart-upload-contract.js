import {
  assertReaderType,
  cleanText,
  isoDate,
  requiredText
} from './external-reader-constants.js';

export const EXTERNAL_READER_CHART_UPLOAD_CONTRACT_VERSION =
  'phi-os.external-reader-chart-upload.v1';

const FILE_TYPES = new Set(['png', 'jpg', 'jpeg', 'webp', 'pdf']);

export function createExternalReaderChartUpload(input = {}, options = {}) {
  const fileType = String(input.file_type || '').trim().toLowerCase();
  if (!FILE_TYPES.has(fileType)) {
    throw new TypeError('Unsupported uploaded chart file type.');
  }
  const fileSize = Number(input.file_size);
  if (!Number.isInteger(fileSize) || fileSize < 1) {
    throw new TypeError('file_size must be a positive integer.');
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_CHART_UPLOAD_CONTRACT_VERSION,
    chart_upload_id: requiredText(
      input.chart_upload_id,
      'chart_upload_id'
    ),
    chart_id: requiredText(
      input.chart_id || input.chart_upload_id,
      'chart_id'
    ),
    client_id: requiredText(input.client_id, 'client_id'),
    chart_type: assertReaderType(
      input.chart_type || input.reader_type
    ),
    reader_type: assertReaderType(
      input.reader_type || input.chart_type
    ),
    file_type: fileType,
    file_reference: requiredText(
      input.file_reference,
      'file_reference'
    ),
    file_name: requiredText(input.file_name, 'file_name'),
    mime_type: requiredText(input.mime_type, 'mime_type'),
    file_size: fileSize,
    source_platform: requiredText(
      input.source_platform,
      'source_platform'
    ),
    calculation_date: cleanText(input.calculation_date) || null,
    uploaded_at: isoDate(
      options.now || input.uploaded_at || new Date().toISOString(),
      'uploaded_at'
    ),
    calculation_settings_known:
      input.calculation_settings_known === true,
    professional_verified: input.professional_verified === true,
    verification_notes: cleanText(input.verification_notes) || null,
    uploaded_by: requiredText(input.uploaded_by, 'uploaded_by'),
    retention_policy: requiredText(
      input.retention_policy,
      'retention_policy'
    ),
    access_status: requiredText(input.access_status, 'access_status'),
    automatic_calculation_used: false,
    automatic_rendering_used: false,
    automatic_report_generated: false,
    runtime_memory_written: false
  });
}

export default Object.freeze({ createExternalReaderChartUpload });
