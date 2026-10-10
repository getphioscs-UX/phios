import {
  defaultPersistenceClock,
  defaultPersistenceId
} from '../persistence/persistence-contract.js';
import {
  RECOVERY_CONTRACT_ID,
  RECOVERY_ERROR_CODES,
  RecoveryContractError,
  normalizeRecoveryRequest,
  requireRecoveryText
} from './recovery-contract.js';
import { createEventAppendService } from
  '../timeline/event-append-service.js';

const EVENT_STAGE = Object.freeze({
  'entry.completed': 'entry_complete',
  'reconstruction.generated': 'reconstruction_ready',
  'reconstruction.revised': 'reconstruction_ready',
  'reading.generated': 'reading_ready',
  'navigation.generated': 'navigation_ready',
  'review.completed': 'review_ready',
  'memory.committed': 'continuity_active',
  'continuity.started': 'continuity_active'
});

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requestLedger(state) {
  return isObject(state?.recovery?.provider_requests)
    ? { ...state.recovery.provider_requests }
    : {};
}

function withProviderRequest(state, requestId, record) {
  const ledger = requestLedger(state);
  ledger[requestId] = clone(record);
  const entries = Object.entries(ledger)
    .sort(([, left], [, right]) =>
      String(right.updated_at || '').localeCompare(
        String(left.updated_at || '')
      ))
    .slice(0, 25);
  return {
    ...clone(state || {}),
    recovery: {
      ...(isObject(state?.recovery) ? clone(state.recovery) : {}),
      provider_requests: Object.fromEntries(entries)
    }
  };
}

function appendConversationMessage(conversation, message) {
  const next = Array.isArray(conversation) ? clone(conversation) : [];
  const normalized = typeof message === 'string'
    ? { role: 'user', content: message }
    : clone(message);
  if (!isObject(normalized)) return next;
  const messageId = String(normalized.message_id || normalized.id || '');
  if (messageId && next.some(item =>
    String(item?.message_id || item?.id || '') === messageId
  )) return next;
  next.push(normalized);
  return next;
}

function beforeTimestamp(value) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp)
    ? new Date(timestamp - 1).toISOString()
    : '';
}

function afterEventCursor(event, cursor) {
  if (!cursor?.created_at) return true;
  const eventTime = String(event?.created_at || '');
  const cursorTime = String(cursor.created_at);
  if (eventTime !== cursorTime) return eventTime > cursorTime;
  return String(event?.event_id || '') > String(cursor.event_id || '');
}

export function replayRecoveryEvents(initialState, events = [], initialStage = '') {
  let state = clone(initialState || {});
  let currentStage = initialStage;
  const appliedEventIds = [];

  for (const event of events) {
    const payload = isObject(event?.payload) ? event.payload : {};
    if (isObject(payload.runtime_state)) state = clone(payload.runtime_state);
    if (isObject(payload.state_patch)) {
      state = { ...state, ...clone(payload.state_patch) };
    }
    if (Array.isArray(payload.conversation)) {
      state.conversation = clone(payload.conversation);
    }
    if (event?.event_type === 'entry.answer_added' && payload.message) {
      state.conversation = appendConversationMessage(
        state.conversation,
        payload.message
      );
    }
    currentStage =
      String(payload.current_stage || '').trim() ||
      EVENT_STAGE[event?.event_type] ||
      currentStage;
    if (event?.event_id) appliedEventIds.push(event.event_id);
  }

  return {
    state,
    current_stage: currentStage,
    applied_event_ids: appliedEventIds
  };
}

export function createRecoveryService(options = {}) {
  const persistence = options.persistence;
  if (!persistence?.read || !persistence?.update ||
      !persistence?.appendEvent || !persistence?.listEvents ||
      !persistence?.saveSnapshot || !persistence?.loadSnapshot) {
    throw new RecoveryContractError(
      RECOVERY_ERROR_CODES.INVALID_INPUT,
      'Recovery requires a complete Persistence interface.'
    );
  }
  const clock = options.clock || defaultPersistenceClock;
  const createId = options.createId || defaultPersistenceId;
  const timeline = createEventAppendService({
    persistence,
    clock,
    createId
  });

  async function requireRuntime(runtimeId) {
    const runtime = await persistence.read(runtimeId);
    if (!runtime) {
      throw new RecoveryContractError(
        RECOVERY_ERROR_CODES.RUNTIME_NOT_FOUND,
        `Runtime not found for recovery: ${runtimeId}`,
        { runtime_id: runtimeId }
      );
    }
    return runtime;
  }

  async function recoverSession(input = {}) {
    const request = normalizeRecoveryRequest(input);
    const runtime = await requireRuntime(request.runtime_id);
    const latestSnapshot = await persistence.loadSnapshot(request.runtime_id);
    const state = clone(latestSnapshot?.state || runtime.state || {});
    return {
      success: true,
      contract: RECOVERY_CONTRACT_ID,
      status: latestSnapshot ? 'snapshot_recovered' : 'runtime_recovered',
      runtime_id: runtime.runtime_id,
      current_stage:
        latestSnapshot?.stage || runtime.current_stage || 'entry_collecting',
      latest_snapshot: clone(latestSnapshot),
      conversation: Array.isArray(state.conversation)
        ? clone(state.conversation)
        : [],
      state,
      provider_requests: requestLedger(state),
      regenerated: false,
      provider_called: false
    };
  }

  async function recoverPartialWrite(input = {}) {
    const request = normalizeRecoveryRequest(input);
    const runtime = await requireRuntime(request.runtime_id);
    const latestSnapshot = await persistence.loadSnapshot(request.runtime_id);
    const cursor = latestSnapshot?.state?.recovery?.event_cursor || null;
    const candidateEvents = await persistence.listEvents(request.runtime_id, {
      after: beforeTimestamp(
        cursor?.created_at || latestSnapshot?.created_at || ''
      ),
      limit: 1000
    });
    const events = candidateEvents.filter(event =>
      afterEventCursor(event, cursor)
    );
    if (!events.length) {
      return {
        success: true,
        contract: RECOVERY_CONTRACT_ID,
        status: 'up_to_date',
        runtime_id: runtime.runtime_id,
        current_stage:
          latestSnapshot?.stage || runtime.current_stage,
        latest_snapshot: clone(latestSnapshot),
        replayed_event_ids: []
      };
    }

    const replayed = replayRecoveryEvents(
      latestSnapshot?.state || runtime.state,
      events,
      latestSnapshot?.stage || runtime.current_stage
    );
    const recoveredAt = clock();
    const auditEventId = createId('event');
    const lastReplayedEvent = events.at(-1);
    const cursorEvent = [
      ...events,
      { event_id: auditEventId, created_at: recoveredAt }
    ].sort((left, right) =>
      String(left.created_at || '').localeCompare(
        String(right.created_at || '')
      ) ||
      String(left.event_id || '').localeCompare(
        String(right.event_id || '')
      )
    ).at(-1);
    const eventCursor = {
      created_at: cursorEvent.created_at,
      event_id: cursorEvent.event_id,
      previous_event_id: lastReplayedEvent?.event_id || ''
    };
    const recoveredState = {
      ...replayed.state,
      recovery: {
        ...(isObject(replayed.state?.recovery)
          ? clone(replayed.state.recovery)
          : {}),
        partial_write: {
          recovered_at: recoveredAt,
          replayed_event_ids: replayed.applied_event_ids
        },
        event_cursor: eventCursor
      }
    };

    await timeline.append({
      event_id: auditEventId,
      runtime_id: runtime.runtime_id,
      event_type: 'runtime.partial_write_recovered',
      payload: {
        current_stage: replayed.current_stage,
        replayed_event_ids: replayed.applied_event_ids
      },
      created_at: recoveredAt
    });
    const snapshot = await persistence.saveSnapshot({
      snapshot_id: createId('snapshot'),
      runtime_id: runtime.runtime_id,
      stage: replayed.current_stage || runtime.current_stage,
      state: recoveredState,
      schema_version: 'phi-os.runtime-snapshot.v1',
      created_at: recoveredAt
    });
    await persistence.update(runtime.runtime_id, {
      current_stage: snapshot.stage,
      state: recoveredState
    });

    return {
      success: true,
      contract: RECOVERY_CONTRACT_ID,
      status: 'partial_write_recovered',
      runtime_id: runtime.runtime_id,
      current_stage: snapshot.stage,
      latest_snapshot: snapshot,
      replayed_event_ids: replayed.applied_event_ids
    };
  }

  async function beginProviderRequest(input = {}) {
    const request = normalizeRecoveryRequest(input);
    const requestId = requireRecoveryText(request.request_id, 'request_id');
    const runtime = await requireRuntime(request.runtime_id);
    const existing = requestLedger(runtime.state)[requestId];

    if (existing?.status === 'completed') {
      return {
        allowed: false,
        reused: true,
        status: 'completed',
        request_id: requestId,
        output: clone(existing.output)
      };
    }
    if (existing && request.allow_retry !== true) {
      return {
        allowed: false,
        reused: false,
        status: existing.status,
        request_id: requestId,
        output: null
      };
    }

    const timestamp = clock();
    const nextState = withProviderRequest(runtime.state, requestId, {
      request_id: requestId,
      status: 'pending',
      stage: request.stage || runtime.current_stage,
      provider: request.provider || 'unknown',
      input: clone(input.input || null),
      started_at: timestamp,
      updated_at: timestamp
    });
    const updated = await persistence.update(runtime.runtime_id, {
      state: nextState
    });
    await persistence.saveSnapshot({
      runtime_id: runtime.runtime_id,
      stage: runtime.current_stage,
      state: updated.state,
      created_at: timestamp
    });
    return {
      allowed: true,
      reused: false,
      status: 'pending',
      request_id: requestId,
      output: null
    };
  }

  async function completeProviderRequest(input = {}) {
    const request = normalizeRecoveryRequest(input);
    const requestId = requireRecoveryText(request.request_id, 'request_id');
    const runtime = await requireRuntime(request.runtime_id);
    const timestamp = clock();
    const nextState = withProviderRequest(runtime.state, requestId, {
      ...(requestLedger(runtime.state)[requestId] || {}),
      request_id: requestId,
      status: 'completed',
      stage: request.stage || runtime.current_stage,
      provider: request.provider || 'unknown',
      output: clone(input.output),
      completed_at: timestamp,
      updated_at: timestamp
    });
    const updated = await persistence.update(runtime.runtime_id, {
      current_stage: request.stage || runtime.current_stage,
      state: nextState
    });
    await timeline.append({
      runtime_id: runtime.runtime_id,
      event_type: 'provider.completed',
      payload: {
        request_id: requestId,
        provider: request.provider || 'unknown',
        current_stage: updated.current_stage
      },
      created_at: timestamp
    });
    await persistence.saveSnapshot({
      runtime_id: runtime.runtime_id,
      stage: updated.current_stage,
      state: updated.state,
      created_at: timestamp
    });
    return {
      success: true,
      status: 'completed',
      request_id: requestId,
      output: clone(input.output)
    };
  }

  async function recordProviderFailure(input = {}) {
    const request = normalizeRecoveryRequest(input);
    const requestId = requireRecoveryText(request.request_id, 'request_id');
    const runtime = await requireRuntime(request.runtime_id);
    const timestamp = clock();
    const failureCode = String(
      input.failure_code || input.failureCode || 'provider_failed'
    ).trim() || 'provider_failed';
    const nextState = withProviderRequest(runtime.state, requestId, {
      ...(requestLedger(runtime.state)[requestId] || {}),
      request_id: requestId,
      status: 'failed',
      stage: request.stage || runtime.current_stage,
      provider: request.provider || 'unknown',
      failure_code: failureCode,
      failed_at: timestamp,
      updated_at: timestamp
    });
    const updated = await persistence.update(runtime.runtime_id, {
      state: nextState
    });
    await timeline.append({
      runtime_id: runtime.runtime_id,
      event_type: 'provider.failed',
      payload: {
        request_id: requestId,
        provider: request.provider || 'unknown',
        failure_code: failureCode,
        current_stage: runtime.current_stage
      },
      created_at: timestamp
    });
    const snapshot = await persistence.saveSnapshot({
      runtime_id: runtime.runtime_id,
      stage: runtime.current_stage,
      state: updated.state,
      created_at: timestamp
    });
    return {
      success: false,
      status: 'provider_failure_preserved',
      request_id: requestId,
      runtime_id: runtime.runtime_id,
      current_stage: runtime.current_stage,
      latest_snapshot: snapshot,
      state_preserved: true,
      automatic_retry: false
    };
  }

  async function executeProviderOperation(input = {}) {
    if (typeof input.run !== 'function') {
      throw new RecoveryContractError(
        RECOVERY_ERROR_CODES.INVALID_INPUT,
        'Provider recovery operation requires run().'
      );
    }
    const begun = await beginProviderRequest(input);
    if (!begun.allowed) {
      return {
        success: begun.reused,
        source: begun.reused ? 'recovery_cache' : 'recovery_guard',
        ...begun
      };
    }
    try {
      const output = await input.run();
      const completed = await completeProviderRequest({ ...input, output });
      return {
        ...completed,
        source: 'provider'
      };
    } catch (error) {
      const failed = await recordProviderFailure({
        ...input,
        failure_code: String(error?.code || 'provider_failed')
      });
      return {
        ...failed,
        source: 'provider_failure'
      };
    }
  }

  return Object.freeze({
    contract: RECOVERY_CONTRACT_ID,
    recoverSession,
    recoverPartialWrite,
    beginProviderRequest,
    completeProviderRequest,
    recordProviderFailure,
    executeProviderOperation
  });
}

export default createRecoveryService;
