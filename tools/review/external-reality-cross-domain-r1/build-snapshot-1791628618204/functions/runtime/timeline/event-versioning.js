import {
  RUNTIME_EVENT_VERSION,
  getRuntimeEventType,
  isRuntimeEventVersionSupported
} from './event-types.js';
import {
  TIMELINE_ERROR_CODES,
  TimelineContractError
} from './timeline-contract.js';

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function legacyPayload(payload = {}) {
  return {
    ...clone(payload),
    current_stage:
      cleanText(payload.current_stage) ||
      cleanText(payload.currentStage),
    runtime_entry_id:
      cleanText(payload.runtime_entry_id) ||
      cleanText(payload.runtimeEntryId),
    revision_id:
      cleanText(payload.revision_id) ||
      cleanText(payload.revisionId),
    selected_path_id:
      cleanText(payload.selected_path_id) ||
      cleanText(payload.selectedPathId)
  };
}

export function adaptRuntimeEventToCurrent(event = {}) {
  const eventType = cleanText(event.event_type || event.type);
  const definition = getRuntimeEventType(eventType);
  if (!definition) {
    throw new TimelineContractError(
      TIMELINE_ERROR_CODES.UNKNOWN_EVENT_TYPE,
      `Unknown Runtime event type: ${eventType || 'empty'}`,
      { event_type: eventType }
    );
  }

  const sourceVersion = cleanText(
    event.event_version || event.version
  ) || RUNTIME_EVENT_VERSION;
  if (!isRuntimeEventVersionSupported(eventType, sourceVersion)) {
    throw new TimelineContractError(
      TIMELINE_ERROR_CODES.UNSUPPORTED_EVENT_VERSION,
      `Unsupported Runtime event version: ${eventType}@${sourceVersion}`,
      { event_type: eventType, event_version: sourceVersion }
    );
  }

  const payload = sourceVersion === '0.9.0'
    ? legacyPayload(event.payload || event.data || {})
    : clone(event.payload || {});

  return Object.freeze({
    event_id: cleanText(event.event_id || event.id),
    runtime_id: cleanText(event.runtime_id || event.runtimeId),
    event_type: eventType,
    payload,
    source_event_version: sourceVersion,
    event_version: definition.current_version,
    created_at: cleanText(event.created_at || event.occurredAt),
    version_adapted: sourceVersion !== definition.current_version
  });
}

export default adaptRuntimeEventToCurrent;
