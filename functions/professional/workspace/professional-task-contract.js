export const PROFESSIONAL_TASK_CONTRACT_VERSION =
  'phi-os.professional-task.v1';

export const PROFESSIONAL_TASK_TYPES = Object.freeze([
  'new_runtime_reading',
  'human_design_intake_received',
  'chart_awaiting_review',
  'report_draft_ready',
  'consultation_required',
  'client_clarification_required',
  'revision_requested',
  'follow_up_due'
]);

export const PROFESSIONAL_TASK_STATUSES = Object.freeze([
  'pending',
  'blocked',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
]);

export const PROFESSIONAL_TASK_PRIORITIES = Object.freeze([
  'normal',
  'high',
  'urgent'
]);

const TRANSITIONS = Object.freeze({
  pending: Object.freeze(['blocked', 'assigned', 'cancelled']),
  blocked: Object.freeze(['pending', 'assigned', 'cancelled']),
  assigned: Object.freeze(['in_progress', 'blocked', 'cancelled']),
  in_progress: Object.freeze(['completed', 'blocked', 'cancelled']),
  completed: Object.freeze([]),
  cancelled: Object.freeze([])
});

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

export function createProfessionalTask(input = {}, options = {}) {
  const taskType = cleanText(input.task_type);
  const status = cleanText(input.status) || 'pending';
  const priority = cleanText(input.priority) || 'normal';
  if (!PROFESSIONAL_TASK_TYPES.includes(taskType)) {
    throw new TypeError('Unsupported professional task_type.');
  }
  if (!PROFESSIONAL_TASK_STATUSES.includes(status)) {
    throw new TypeError('Unsupported professional task status.');
  }
  if (!PROFESSIONAL_TASK_PRIORITIES.includes(priority)) {
    throw new TypeError('Unsupported professional task priority.');
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_TASK_CONTRACT_VERSION,
    task_id: requiredText(input.task_id, 'task_id'),
    workspace_id: requiredText(input.workspace_id, 'workspace_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    task_type: taskType,
    status,
    priority,
    assigned_professional_id:
      cleanText(input.assigned_professional_id) || null,
    due_at: isoDate(input.due_at, 'due_at'),
    consent_status: cleanText(input.consent_status) || 'not_granted',
    data_completeness: Math.min(
      100,
      Math.max(0, Number(input.data_completeness) || 0)
    ),
    boundary_flags: Object.freeze(
      Array.isArray(input.boundary_flags)
        ? [...new Set(input.boundary_flags.map(value =>
            requiredText(value, 'boundary_flag')
          ))]
        : []
    ),
    created_at: isoDate(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    )
  });
}

export function transitionProfessionalTask(task, nextStatus) {
  const next = cleanText(nextStatus);
  const allowed = TRANSITIONS[task?.status] || [];
  if (!allowed.includes(next)) {
    throw new TypeError(
      `Illegal professional task transition: ${task?.status} -> ${next}`
    );
  }
  if (
    next === 'in_progress' &&
    !cleanText(task.assigned_professional_id)
  ) {
    throw new TypeError('An assigned professional is required.');
  }
  return Object.freeze({ ...task, status: next });
}

export default Object.freeze({
  createProfessionalTask,
  transitionProfessionalTask
});
