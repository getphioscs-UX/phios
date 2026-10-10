export const PROFESSIONAL_W2C_PROJECTION_VERSION =
  'phi-os.professional-w2c-projection.v1';

function assertWorkspace(workspace) {
  if (
    workspace?.consent_validated !== true ||
    workspace?.status === 'access_revoked'
  ) {
    throw new TypeError(
      'M4B-W2C projection requires an active consent-gated Workspace.'
    );
  }
}

function matchingRecords(workspace, values, field) {
  const source = Array.isArray(values) ? values : [];
  return Object.freeze(source.map(record => {
    if (
      !record ||
      record.workspace_id !== workspace.workspace_id ||
      record.client_id !== workspace.client_id
    ) {
      throw new TypeError(
        `${field} contains a record outside the active Workspace.`
      );
    }
    return record;
  }));
}

export function buildProfessionalW2CProjection(
  workspace,
  input = {}
) {
  assertWorkspace(workspace);
  const timeline = input.follow_up_timeline;
  if (
    timeline &&
    (
      timeline.workspace_id !== workspace.workspace_id ||
      timeline.client_id !== workspace.client_id
    )
  ) {
    throw new TypeError(
      'follow_up_timeline is outside the active Workspace.'
    );
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_W2C_PROJECTION_VERSION,
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    reading_revisions: matchingRecords(
      workspace,
      input.reading_revisions,
      'reading_revisions'
    ),
    navigation_considerations: matchingRecords(
      workspace,
      input.navigation_considerations,
      'navigation_considerations'
    ),
    follow_up_timeline: timeline || null,
    read_only: true,
    professional_actions_enabled: false,
    api_called: false,
    browser_runtime_storage_used: false,
    d1_persistence_enabled: false
  });
}

export default Object.freeze({ buildProfessionalW2CProjection });
