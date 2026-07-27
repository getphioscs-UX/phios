import {
  assertReaderType,
  requiredText
} from './external-reader-constants.js';

export const EXTERNAL_READER_ADAPTER_CONTRACT_VERSION =
  'phi-os.external-reader-adapter.v1';

const INPUT_MODES = new Set([
  'shared_birth_data',
  'uploaded_chart',
  'manual_entry'
]);
const ADAPTER_STATUSES = new Set([
  'manual_entry_and_upload',
  'scaffold_only'
]);

export function createExternalReaderAdapter(input = {}) {
  const modes = Array.isArray(input.input_modes)
    ? input.input_modes
    : [];
  if (!modes.length || modes.some(mode => !INPUT_MODES.has(mode))) {
    throw new TypeError('Unsupported External Reader Adapter input mode.');
  }
  const status = requiredText(input.status, 'status');
  if (!ADAPTER_STATUSES.has(status)) {
    throw new TypeError('Unsupported External Reader Adapter status.');
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_ADAPTER_CONTRACT_VERSION,
    adapter_id: requiredText(input.adapter_id, 'adapter_id'),
    reader_type: assertReaderType(input.reader_type),
    input_modes: Object.freeze([...modes]),
    output_schema: 'external-reader-normalized-chart.v1',
    status,
    automatic_calculation: false,
    automatic_rendering: false,
    automatic_interpretation: false,
    runtime_evidence_written: false
  });
}

export default Object.freeze({ createExternalReaderAdapter });
