import {
  assertActiveWorkspace
} from './external-reader-constants.js';

export const EXTERNAL_READER_WORKSPACE_PROJECTION_VERSION =
  'phi-os.external-reader-workspace-projection.v1';

function workspaceRecords(workspace, values, field) {
  const records = Array.isArray(values) ? values : [];
  return Object.freeze(records.map(record => {
    if (
      record?.workspace_id !== workspace.workspace_id ||
      record?.client_id !== workspace.client_id
    ) {
      throw new TypeError(`${field} contains an unauthorised record.`);
    }
    return record;
  }));
}

export function buildExternalReaderWorkspaceProjection(
  workspace,
  registry,
  input = {}
) {
  assertActiveWorkspace(workspace);
  if (
    registry?.schema_version !== 'phi-os.external-reader-registry.v1' ||
    !Array.isArray(registry.readers)
  ) {
    throw new TypeError('A valid External Reader Registry is required.');
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_WORKSPACE_PROJECTION_VERSION,
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    readers: Object.freeze(registry.readers.map(reader => Object.freeze({
      reader_id: reader.reader_id,
      reader_name: reader.reader_name,
      reader_version: reader.reader_version,
      renderer_status: reader.renderer_status,
      interpretation_status: reader.interpretation_status,
      active: reader.active
    }))),
    interpretations: workspaceRecords(
      workspace,
      input.interpretations,
      'interpretations'
    ),
    correspondences: workspaceRecords(
      workspace,
      input.correspondences,
      'correspondences'
    ),
    read_only: true,
    runtime_reading_modified: false,
    runtime_evidence_written: false,
    runtime_memory_written: false,
    professional_review_replaced: false,
    automatic_chart_calculation: false,
    automatic_report_generation: false
  });
}

export default Object.freeze({
  buildExternalReaderWorkspaceProjection
});
