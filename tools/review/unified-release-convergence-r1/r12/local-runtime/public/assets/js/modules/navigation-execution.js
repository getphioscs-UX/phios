/*
 * PHI OS M3C-W12 Navigation Execution Layer
 *
 * Extends the existing Navigation response. Reading, path generation,
 * Navigation Contract and Review Contract remain unchanged.
 */
import { scheduleRuntimeSnapshot } from './runtime-persistence.js';

const NAVIGATION_SESSION_KEY = 'phiOSRealityNavigation';

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

export const EXECUTION_STATES = Object.freeze([
  'available', 'selected', 'configured', 'active',
  'completed', 'review_due', 'cancelled'
]);

export const EXECUTION_TRANSITIONS = Object.freeze({
  available: Object.freeze({ select_path: 'selected' }),
  selected: Object.freeze({
    save_configuration: 'configured',
    cancel: 'cancelled'
  }),
  configured: Object.freeze({
    start: 'active',
    change_path: 'cancelled',
    cancel: 'cancelled'
  }),
  active: Object.freeze({
    add_log: 'active',
    completion_condition_met: 'completed',
    stop_condition_triggered: 'review_due',
    observation_window_completed: 'review_due',
    user_end: 'review_due',
    professional_review_requested: 'review_due',
    cancel: 'cancelled'
  }),
  completed: Object.freeze({
    request_review: 'review_due',
    cancel: 'cancelled'
  }),
  review_due: Object.freeze({ cancel: 'cancelled' }),
  cancelled: Object.freeze({})
});

const LOG_CLASSES = Object.freeze([
  'user_logged_observation',
  'reported_experience',
  'clarification_answer',
  'verification_result',
  'counter_example',
  'professional_note',
  'unknown'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function now(value) {
  return cleanText(value) || new Date().toISOString();
}

function id(prefix) {
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8) ||
    Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

function selectedPath(response) {
  return isObject(response?.navigation?.selectedPath)
    ? response.navigation.selectedPath
    : null;
}

function sourceReading(response) {
  const input = response?.navigationInput || {};
  const handoff = input?.readingNavigationContract ||
    input?.readingHandoff ||
    input?.sourceReading ||
    {};
  return {
    reading_id: cleanText(
      handoff.readingId ||
      handoff.reading_id ||
      input.readingId ||
      response?.readingId
    ),
    reading_version: Number(
      handoff.readingVersion ||
      handoff.reading_version ||
      input.readingVersion ||
      1
    )
  };
}

function pathType(path) {
  const value = cleanText(path?.pathType || path?.type);
  return value === 'professional_review' ? 'financial_review' : value;
}

function baseConfiguration(path) {
  return {
    objective: cleanText(path?.direction || path?.description),
    selected_signal: [],
    baseline: [],
    action: list(path?.actionSteps).map(cleanText).filter(Boolean),
    observation_window: {
      value: 7,
      unit: 'day',
      start_at: '',
      end_at: ''
    },
    frequency: { type: 'daily', value: 1 },
    record_fields: [],
    completion_condition: list(path?.completionSignals)
      .map(cleanText).filter(Boolean),
    stop_condition: list(path?.stopConditions)
      .map(cleanText).filter(Boolean),
    review_condition: list(path?.reviewConditions)
      .map(cleanText).filter(Boolean)
  };
}

function pathSpecific(path) {
  const type = pathType(path);
  if (type === 'observe') {
    return {
      record_fields: [
        'count', 'trigger_context', 'intensity',
        'decision_delayed', 'counter_example', 'note'
      ]
    };
  }
  if (type === 'clarify') {
    return {
      known_items: [],
      reported_experience: [],
      current_interpretation: [],
      unknown_items: list(path?.unknownReality).map(cleanText).filter(Boolean),
      next_evidence_needed: list(path?.evidenceWatch).map(cleanText).filter(Boolean),
      clarification_question: '',
      answer: '',
      answer_classification: 'clarification_answer'
    };
  }
  if (type === 'verify') {
    return {
      primary_reading_id: '',
      alternative_reading_id: '',
      supporting_evidence_ids: [],
      conflicting_evidence_ids: [],
      discriminating_condition: '',
      verification_signal: '',
      verification_window: { value: 7, unit: 'day' },
      result: ''
    };
  }
  if (type === 'financial_review') {
    return {
      professional_domain: 'financial',
      sensitive_financial_data_collected: false,
      financial_intake_enabled: false
    };
  }
  return {};
}

export function transitionExecution(state, action) {
  const current = cleanText(state) || 'available';
  const event = cleanText(action);
  const next = EXECUTION_TRANSITIONS[current]?.[event];
  if (!next) {
    throw new Error(`Illegal Navigation execution transition: ${current} → ${event}`);
  }
  return next;
}

export function createNavigationAction(response, path, options = {}) {
  if (!isObject(path)) throw new Error('A Navigation path is required.');
  const timestamp = now(options.at);
  const reading = sourceReading(response);
  const previous = list(response?.navigationExecution?.actions);
  const version = previous.reduce(
    (highest, action) => Math.max(highest, Number(action.navigation_version) || 0),
    0
  ) + 1;
  const action = {
    schema_version: 'phi-os.navigation-action.v1',
    navigation_action_id: id('navigation_action'),
    runtime_entity_id: cleanText(response?.runtimeEntityId),
    runtime_entry_id: cleanText(response?.runtimeEntryId),
    source_reading_id: reading.reading_id,
    source_reading_version: reading.reading_version,
    navigation_version: version,
    path: {
      path_id: cleanText(path.id),
      path_type: pathType(path),
      ...baseConfiguration(path),
      ...pathSpecific(path)
    },
    execution: {
      state: 'selected',
      started_at: null,
      completed_at: null,
      cancelled_at: null
    },
    evidence_logs: [],
    progress: {
      elapsed_days: 0,
      total_days: 7,
      log_count: 0,
      counter_example_count: 0,
      completion_percentage: 0,
      next_record_at: null,
      last_record_at: null,
      overdue: false,
      outcome_improvement_claimed: false
    },
    review_gate: {
      status: 'not_ready',
      reasons: [],
      trigger_type: null,
      triggered_at: null,
      blocking_items: ['configuration_required'],
      review_payload_ready: false
    },
    created_at: timestamp,
    updated_at: timestamp
  };
  return action;
}

function replaceAction(response, action, extra = {}) {
  const execution = isObject(response?.navigationExecution)
    ? response.navigationExecution
    : {};
  const actions = list(execution.actions);
  const found = actions.some(item =>
    item.navigation_action_id === action.navigation_action_id
  );
  const updated = {
    ...response,
    navigationExecution: {
      schema_version: 'phi-os.navigation-execution.v1',
      storage_capability: {
        local_recovery: true,
        cross_device_recovery: false,
        cross_device_status: 'capability_not_available',
        driver: 'localStorage_snapshot'
      },
      ...execution,
      ...extra,
      actions: found
        ? actions.map(item =>
            item.navigation_action_id === action.navigation_action_id
              ? action
              : item
          )
        : [...actions, action],
      active_action_id: ['selected', 'configured', 'active', 'completed', 'review_due']
        .includes(action.execution.state)
        ? action.navigation_action_id
        : ''
    }
  };
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(NAVIGATION_SESSION_KEY, JSON.stringify(updated));
    scheduleRuntimeSnapshot('navigation_execution_change');
  }
  return updated;
}

export function selectExecutionPath(response, path, options = {}) {
  const current = activeNavigationAction(response);
  let updatedResponse = response;
  if (current && ['selected', 'configured', 'active'].includes(current.execution.state)) {
    updatedResponse = cancelNavigationAction(response, {
      reason: options.change_reason || 'path_changed',
      action: current.execution.state === 'configured' ? 'change_path' : 'cancel',
      at: options.at
    });
  }
  const action = createNavigationAction(updatedResponse, path, options);
  const changes = list(updatedResponse?.navigationExecution?.path_changes);
  const change = current ? {
    change_id: id('navigation_change'),
    from_action_id: current.navigation_action_id,
    to_action_id: action.navigation_action_id,
    from_path_id: current.path.path_id,
    to_path_id: action.path.path_id,
    reason: cleanText(options.change_reason) || 'path_changed',
    changed_at: now(options.at),
    reading_version: action.source_reading_version,
    navigation_version: action.navigation_version
  } : null;
  return replaceAction(updatedResponse, action, {
    path_changes: change ? [...changes, change] : changes
  });
}

export function activeNavigationAction(response) {
  const execution = response?.navigationExecution;
  const activeId = cleanText(execution?.active_action_id);
  return list(execution?.actions).find(action =>
    action.navigation_action_id === activeId
  ) || null;
}

export function saveNavigationConfiguration(response, configuration, options = {}) {
  const current = activeNavigationAction(response);
  if (!current) throw new Error('Select a Navigation path first.');
  const nextState = transitionExecution(current.execution.state, 'save_configuration');
  const timestamp = now(options.at);
  const updated = {
    ...current,
    path: {
      ...current.path,
      ...(isObject(configuration) ? configuration : {}),
      path_id: current.path.path_id,
      path_type: current.path.path_type
    },
    execution: { ...current.execution, state: nextState },
    review_gate: {
      ...current.review_gate,
      blocking_items: ['execution_not_started']
    },
    updated_at: timestamp
  };
  return replaceAction(response, updated);
}

export function startNavigationAction(response, options = {}) {
  const current = activeNavigationAction(response);
  if (!current) throw new Error('No configured Navigation action exists.');
  const timestamp = now(options.at);
  const state = transitionExecution(current.execution.state, 'start');
  const days = Math.max(1, Number(current.path.observation_window?.value) || 7);
  const end = new Date(timestamp);
  end.setUTCDate(end.getUTCDate() + days);
  const updated = {
    ...current,
    path: {
      ...current.path,
      observation_window: {
        ...current.path.observation_window,
        start_at: timestamp,
        end_at: end.toISOString()
      }
    },
    execution: { ...current.execution, state, started_at: timestamp },
    progress: {
      ...current.progress,
      total_days: days,
      next_record_at: timestamp
    },
    review_gate: {
      ...current.review_gate,
      status: 'not_ready',
      blocking_items: current.path.path_type === 'observe'
        ? ['observation_log_required', 'observation_window_active']
        : ['execution_result_required']
    },
    updated_at: timestamp
  };
  return replaceAction(response, updated);
}

export function createEvidenceLog(action, values = {}, options = {}) {
  if (action?.execution?.state !== 'active') {
    throw new Error('Evidence can only be logged for an active Navigation action.');
  }
  const evidenceClass = cleanText(values.evidence_class) ||
    (values.counter_example === true ? 'counter_example' : 'user_logged_observation');
  if (!LOG_CLASSES.includes(evidenceClass)) {
    throw new Error('Unsupported Navigation evidence class.');
  }
  return {
    schema_version: 'phi-os.navigation-evidence-log.v1',
    log_id: id('navigation_log'),
    navigation_action_id: action.navigation_action_id,
    runtime_entity_id: action.runtime_entity_id,
    path_id: action.path.path_id,
    recorded_at: now(values.recorded_at || options.at),
    record_type: cleanText(values.record_type) || action.path.path_type,
    signal: cleanText(values.signal),
    value: values.value ?? null,
    unit: cleanText(values.unit),
    context: cleanText(values.context),
    trigger: cleanText(values.trigger),
    intensity: Number(values.intensity) || null,
    counter_example: values.counter_example === true,
    user_note: cleanText(values.user_note),
    evidence_class: evidenceClass,
    source: 'user_entry',
    created_at: now(options.at)
  };
}

export function calculateProgress(action, at = '') {
  const logs = list(action?.evidence_logs);
  const started = new Date(action?.execution?.started_at || now(at));
  const current = new Date(now(at));
  const elapsed = Math.max(
    0,
    Math.floor((current.getTime() - started.getTime()) / 86400000)
  );
  const total = Math.max(1, Number(action?.path?.observation_window?.value) || 7);
  const last = logs.map(log => log.recorded_at).sort().at(-1) || null;
  const next = last ? new Date(last) : new Date(current);
  if (last) next.setUTCDate(next.getUTCDate() + 1);
  return {
    elapsed_days: Math.min(elapsed, total),
    total_days: total,
    log_count: logs.length,
    counter_example_count: logs.filter(log => log.counter_example).length,
    completion_percentage: Math.min(100, Math.round((elapsed / total) * 100)),
    next_record_at: next.toISOString(),
    last_record_at: last,
    overdue: Boolean(last && current.getTime() > next.getTime()),
    outcome_improvement_claimed: false
  };
}

export function addNavigationEvidenceLog(response, values, options = {}) {
  const current = activeNavigationAction(response);
  const log = createEvidenceLog(current, values, options);
  const updated = {
    ...current,
    evidence_logs: [...list(current.evidence_logs), log],
    updated_at: now(options.at)
  };
  updated.progress = calculateProgress(updated, options.at);
  updated.execution = {
    ...updated.execution,
    state: transitionExecution(current.execution.state, 'add_log')
  };
  return replaceAction(response, updated);
}

export function evaluateReviewGate(action, trigger = '', options = {}) {
  const event = cleanText(trigger);
  const highRisk = options.high_risk === true ||
    ['financial', 'medical', 'legal', 'safety', 'child'].includes(
      cleanText(options.risk_domain)
    );
  const allowed = [
    'completion_condition_met',
    'stop_condition_triggered',
    'observation_window_completed',
    'user_end',
    'professional_review_requested',
    'request_review'
  ];
  if (!allowed.includes(event)) {
    return {
      status: 'not_ready',
      reasons: [],
      trigger_type: null,
      triggered_at: null,
      blocking_items: ['valid_review_trigger_required'],
      review_payload_ready: false
    };
  }
  if (!['active', 'completed'].includes(action?.execution?.state)) {
    return {
      status: 'blocked',
      reasons: [event],
      trigger_type: event,
      triggered_at: null,
      blocking_items: ['active_or_completed_execution_required'],
      review_payload_ready: false
    };
  }
  if (
    action.path.path_type === 'observe' &&
    !list(action.evidence_logs).length &&
    !['stop_condition_triggered', 'user_end'].includes(event)
  ) {
    return {
      status: 'blocked',
      reasons: [event],
      trigger_type: event,
      triggered_at: null,
      blocking_items: ['observation_log_required'],
      review_payload_ready: false
    };
  }
  return {
    status: highRisk || event === 'stop_condition_triggered' ? 'required' : 'ready',
    reasons: [event, ...(highRisk ? ['high_risk_boundary'] : [])],
    trigger_type: event,
    triggered_at: now(options.at),
    blocking_items: [],
    review_payload_ready: true
  };
}

export function triggerNavigationReview(response, trigger, options = {}) {
  const current = activeNavigationAction(response);
  if (!current) throw new Error('No Navigation action exists.');
  const gate = evaluateReviewGate(current, trigger, options);
  if (!gate.review_payload_ready) {
    throw new Error(`Review Gate is blocked: ${gate.blocking_items.join(', ')}`);
  }
  const state = transitionExecution(current.execution.state, trigger);
  const timestamp = now(options.at);
  const updated = {
    ...current,
    execution: {
      ...current.execution,
      state,
      completed_at: state === 'completed' ? timestamp : current.execution.completed_at
    },
    review_gate: gate,
    updated_at: timestamp
  };
  return replaceAction(response, updated);
}

export function cancelNavigationAction(response, options = {}) {
  const current = activeNavigationAction(response);
  if (!current) return response;
  const action = cleanText(options.action) || 'cancel';
  const state = transitionExecution(current.execution.state, action);
  const updated = {
    ...current,
    execution: {
      ...current.execution,
      state,
      cancelled_at: now(options.at),
      cancellation_reason: cleanText(options.reason)
    },
    updated_at: now(options.at)
  };
  return replaceAction(response, updated, { active_action_id: '' });
}

export function saveFinancialReviewIntent(response, values = {}, options = {}) {
  const current = activeNavigationAction(response);
  if (current?.path?.path_type !== 'financial_review') {
    throw new Error('Financial Review path is not selected.');
  }
  const intent = {
    schema_version: 'phi-os.professional-handoff-intent.v1',
    handoff_intent_id: id('handoff_intent'),
    runtime_entity_id: current.runtime_entity_id,
    reading_id: current.source_reading_id,
    navigation_action_id: current.navigation_action_id,
    path_id: current.path.path_id,
    reason: cleanText(values.reason) || current.path.objective,
    professional_domain: 'financial',
    status: 'interest_saved',
    sensitive_financial_data_collected: false,
    created_at: now(options.at)
  };
  const updated = {
    ...current,
    professional_handoff_intent: intent,
    updated_at: now(options.at)
  };
  return replaceAction(response, updated);
}

export function buildReviewHandoff(response, options = {}) {
  const action = activeNavigationAction(response);
  if (!action?.review_gate?.review_payload_ready) {
    throw new Error('Navigation Review Handoff is not ready.');
  }
  const reconstruction = response?.navigationInput?.reconstructionReference || {};
  return {
    schema_version: 'phi-os.navigation-review-handoff.v1',
    runtime_entity_id: action.runtime_entity_id,
    runtime_entry_id: action.runtime_entry_id,
    reconstruction_id: cleanText(reconstruction.reconstruction_id),
    reconstruction_version: Number(reconstruction.reconstruction_version || 1),
    reading_id: action.source_reading_id,
    reading_version: action.source_reading_version,
    navigation_action_id: action.navigation_action_id,
    navigation_version: action.navigation_version,
    path_id: action.path.path_id,
    execution_state: action.execution.state,
    objective: action.path.objective,
    configuration: action.path,
    progress: action.progress,
    completion_reason: cleanText(options.completion_reason),
    stop_reason: cleanText(options.stop_reason),
    reading_reference: {
      reading_id: action.source_reading_id,
      reading_version: action.source_reading_version
    },
    navigation_reference: {
      navigation_action_id: action.navigation_action_id,
      navigation_version: action.navigation_version,
      path_id: action.path.path_id,
      execution_state: action.execution.state
    },
    execution_summary: {
      objective: action.path.objective,
      configuration: action.path,
      progress: action.progress,
      completion_reason: cleanText(options.completion_reason),
      stop_reason: cleanText(options.stop_reason)
    },
    evidence_logs: list(action.evidence_logs),
    evidence_log_ids: list(action.evidence_logs).map(log => log.log_id),
    counter_example_ids: list(action.evidence_logs)
      .filter(log => log.counter_example).map(log => log.log_id),
    open_questions: list(response?.navigation?.unknownReality),
    counter_examples: list(action.evidence_logs)
      .filter(log => log.counter_example),
    review_trigger: action.review_gate.trigger_type,
    professional_review_requested:
      action.review_gate.trigger_type === 'professional_review_requested',
    created_at: now(options.at)
  };
}

export function navigationExecutionStatus() {
  return {
    module: 'M3C-W12 Navigation Execution Layer',
    schemas: [
      'phi-os.navigation-action.v1',
      'phi-os.navigation-evidence-log.v1',
      'phi-os.navigation-review-handoff.v1'
    ],
    localRecovery: true,
    crossDeviceRecovery: false,
    crossDeviceStatus: 'capability_not_available',
    financialIntakeEnabled: false
  };
}
