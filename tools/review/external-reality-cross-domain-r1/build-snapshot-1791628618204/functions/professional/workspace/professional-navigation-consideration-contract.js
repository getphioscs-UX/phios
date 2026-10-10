import {
  assertExternalReaderBoundary
} from './professional-source-contract.js';

export const PROFESSIONAL_NAVIGATION_CONSIDERATION_CONTRACT_VERSION =
  'phi-os.professional-navigation-consideration.v1';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function textList(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array.`);
  }
  return Object.freeze(
    value.map(item => requiredText(item, field))
  );
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function assertWorkspace(workspace) {
  if (
    workspace?.consent_validated !== true ||
    workspace?.status === 'access_revoked' ||
    workspace?.capabilities?.view_navigation !== true
  ) {
    throw new TypeError(
      'Navigation Considerations require active consent with Navigation access.'
    );
  }
}

export function createProfessionalNavigationConsideration(
  workspace,
  input = {},
  options = {}
) {
  assertWorkspace(workspace);
  if (cleanText(input.required_action)) {
    throw new TypeError(
      'Professional Navigation Considerations cannot create a required action.'
    );
  }
  const sources = Array.isArray(input.source_references)
    ? input.source_references
    : [];
  if (!sources.length) {
    throw new TypeError('At least one source reference is required.');
  }
  sources.forEach(assertExternalReaderBoundary);
  const hasExternalReader = sources.some(source =>
    source.source_type === 'external_reader_interpretation'
  );
  return Object.freeze({
    schema_version:
      PROFESSIONAL_NAVIGATION_CONSIDERATION_CONTRACT_VERSION,
    consideration_id: requiredText(
      input.consideration_id,
      'consideration_id'
    ),
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    service_id: workspace.service_id,
    runtime_id: requiredText(
      input.runtime_id || workspace.current_runtime_id,
      'runtime_id'
    ),
    navigation_reference_id: requiredText(
      input.navigation_reference_id,
      'navigation_reference_id'
    ),
    current_runtime_position: requiredText(
      input.current_runtime_position,
      'current_runtime_position'
    ),
    available_paths: textList(input.available_paths, 'available_paths'),
    constraints: textList(input.constraints, 'constraints'),
    required_evidence: textList(
      input.required_evidence,
      'required_evidence'
    ),
    low_risk_next_step: requiredText(
      input.low_risk_next_step,
      'low_risk_next_step'
    ),
    review_point: requiredText(input.review_point, 'review_point'),
    stop_condition: requiredText(
      input.stop_condition,
      'stop_condition'
    ),
    escalation_condition: requiredText(
      input.escalation_condition,
      'escalation_condition'
    ),
    source_references: Object.freeze([...sources]),
    includes_external_reader: hasExternalReader,
    external_reader_role: hasExternalReader
      ? 'navigation_consideration_only'
      : null,
    required_action: null,
    user_choice_required: true,
    navigation_contract_overwritten: false,
    runtime_evidence_written: false,
    created_by: requiredText(
      input.created_by || workspace.professional_id,
      'created_by'
    ),
    created_at: isoDate(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    )
  });
}

export default Object.freeze({
  createProfessionalNavigationConsideration
});
