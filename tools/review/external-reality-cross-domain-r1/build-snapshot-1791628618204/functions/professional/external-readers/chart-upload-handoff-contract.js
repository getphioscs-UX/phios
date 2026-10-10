import { isoDate, requiredText } from './external-reader-constants.js';
import { EXTERNAL_READER_INTAKE_CONTRACT_VERSION } from './external-reader-intake-contract.js';

export const EXTERNAL_READER_HANDOFF_CONTRACT_VERSION = 'phi-os.external-reader-handoff.v1';

export function createExternalReaderIntakeHandoff(intake, options = {}) {
  if (intake?.schema_version !== EXTERNAL_READER_INTAKE_CONTRACT_VERSION) {
    throw new TypeError('A valid External Reader Intake is required.');
  }
  const queueTasks = [{ task_type: 'external_reader_intake_received', status: 'received' }];
  if (intake.chart_upload) queueTasks.push({ task_type: 'chart_awaiting_review', status: 'pending' });
  if (Object.keys(intake.known_chart_fields).length) {
    queueTasks.push({ task_type: 'structured_data_awaiting_verification', status: 'pending' });
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_HANDOFF_CONTRACT_VERSION,
    handoff_id: requiredText(options.handoff_id, 'handoff_id'),
    workspace_id: options.workspace_id || null,
    intake_id: intake.intake_id,
    client_id: intake.client_id,
    reader_type: intake.reader_type,
    queue_tasks: Object.freeze(queueTasks.map(task => Object.freeze({
      ...task, requires_professional_review: true
    }))),
    professional_review_status: 'required',
    interpretation_status: intake.interpretation_available ? 'not_started' : 'not_available',
    handed_off_at: isoDate(options.now || new Date().toISOString(), 'handed_off_at'),
    source_lineage_preserved: true,
    file_content_transferred: false,
    runtime_reading_modified: false,
    runtime_evidence_written: false,
    runtime_memory_written: false,
    required_action_generated: false
  });
}
