export const PROFESSIONAL_FOLLOW_UP_TIMELINE_CONTRACT_VERSION =
  'phi-os.professional-follow-up-timeline.v1';

export const PROFESSIONAL_FOLLOW_UP_EVENT_TYPES = Object.freeze([
  'runtime_entry_created',
  'professional_access_granted',
  'human_design_chart_uploaded',
  'report_drafted',
  'consultation_completed',
  'navigation_chosen',
  'follow_up_evidence_added',
  'report_revised',
  'access_revoked',
  'service_completed',
  'financial_intake_started',
  'financial_data_submitted',
  'document_uploaded',
  'document_verified',
  'financial_position_calculated',
  'risk_flag_raised',
  'professional_review_completed',
  'navigation_plan_delivered',
  'client_decision_recorded',
  'implementation_started',
  'implementation_confirmed',
  'financial_data_updated',
  'scheduled_review_completed'
]);

export const FINANCIAL_FOLLOW_UP_EVENT_TYPES = Object.freeze([
  'financial_intake_started',
  'financial_data_submitted',
  'document_uploaded',
  'document_verified',
  'financial_position_calculated',
  'risk_flag_raised',
  'professional_review_completed',
  'consultation_completed',
  'navigation_plan_delivered',
  'client_decision_recorded',
  'implementation_started',
  'implementation_confirmed',
  'financial_data_updated',
  'scheduled_review_completed'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function assertWorkspace(workspace, eventType) {
  const active = (
    workspace?.consent_validated === true &&
    workspace?.status !== 'access_revoked'
  );
  if (!active && eventType !== 'access_revoked') {
    throw new TypeError(
      'Professional Follow-up events require an active Workspace.'
    );
  }
  if (!workspace?.workspace_id) {
    throw new TypeError('A Professional Workspace is required.');
  }
}

export function createProfessionalFollowUpTimeline(workspace) {
  if (!workspace?.workspace_id) {
    throw new TypeError('A Professional Workspace is required.');
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_FOLLOW_UP_TIMELINE_CONTRACT_VERSION,
    timeline_id: `professional_timeline_${workspace.workspace_id}`,
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    service_id: workspace.service_id,
    runtime_id: workspace.current_runtime_id || null,
    events: Object.freeze([]),
    append_only: true,
    runtime_timeline_overwritten: false,
    runtime_evidence_written: false,
    persistence_status: 'contract_only'
  });
}

export function appendProfessionalFollowUpEvent(
  workspace,
  timeline,
  input = {},
  options = {}
) {
  if (
    !timeline ||
    timeline.workspace_id !== workspace?.workspace_id
  ) {
    throw new TypeError(
      'A matching Professional Follow-up Timeline is required.'
    );
  }
  const eventType = cleanText(input.event_type);
  if (!PROFESSIONAL_FOLLOW_UP_EVENT_TYPES.includes(eventType)) {
    throw new TypeError('Unsupported Professional Follow-up event type.');
  }
  assertWorkspace(workspace, eventType);
  const eventId = requiredText(input.event_id, 'event_id');
  if (timeline.events.some(event => event.event_id === eventId)) {
    throw new TypeError('Professional Follow-up event_id must be unique.');
  }
  const event = Object.freeze({
    event_id: eventId,
    event_type: eventType,
    event_label: requiredText(input.event_label, 'event_label'),
    occurred_at: isoDate(
      options.now || input.occurred_at || new Date().toISOString(),
      'occurred_at'
    ),
    actor_id: requiredText(
      input.actor_id || workspace.professional_id,
      'actor_id'
    ),
    source_record_id: requiredText(
      input.source_record_id,
      'source_record_id'
    ),
    financial_event:
      FINANCIAL_FOLLOW_UP_EVENT_TYPES.includes(eventType),
    data_date: input.data_date
      ? isoDate(input.data_date, 'data_date')
      : null,
    revision_id: cleanText(input.revision_id) || null,
    calculation_id: cleanText(input.calculation_id) || null,
    recommendation_id: cleanText(input.recommendation_id) || null,
    previous_event_id: cleanText(input.previous_event_id) || null,
    client_visible: input.client_visible === true
  });
  return Object.freeze({
    ...timeline,
    events: Object.freeze([...timeline.events, event].sort((left, right) => (
      Date.parse(left.occurred_at) - Date.parse(right.occurred_at) ||
      left.event_id.localeCompare(right.event_id)
    )))
  });
}

export function projectProfessionalFollowUpTimeline(
  timeline,
  filter = {}
) {
  if (!timeline?.timeline_id || !Array.isArray(timeline.events)) {
    throw new TypeError('A Professional Follow-up Timeline is required.');
  }
  const financialOnly = filter.financial_only === true;
  const eventType = cleanText(filter.event_type);
  const events = timeline.events.filter(event => (
    (!financialOnly || event.financial_event === true) &&
    (!eventType || event.event_type === eventType)
  ));
  return Object.freeze({
    ...timeline,
    events: Object.freeze([...events]),
    filter: Object.freeze({
      financial_only: financialOnly,
      event_type: eventType || null
    }),
    append_only: true
  });
}

export default Object.freeze({
  createProfessionalFollowUpTimeline,
  appendProfessionalFollowUpEvent,
  projectProfessionalFollowUpTimeline
});
