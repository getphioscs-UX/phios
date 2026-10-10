import {
  defaultPersistenceClock,
  defaultPersistenceId
} from '../persistence/persistence-contract.js';
import {
  RUNTIME_EVENT_VERSION,
  getRuntimeEventType
} from './event-types.js';
import {
  TIMELINE_CONTRACT_ID,
  TIMELINE_ERROR_CODES,
  TimelineContractError
} from './timeline-contract.js';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

export function createEventAppendService(options = {}) {
  const persistence = options.persistence;
  if (!persistence || typeof persistence.appendEvent !== 'function') {
    throw new TimelineContractError(
      TIMELINE_ERROR_CODES.PERSISTENCE_REQUIRED,
      'Event Append Service requires Persistence.appendEvent().'
    );
  }
  const clock = options.clock || defaultPersistenceClock;
  const createId = options.createId || defaultPersistenceId;

  async function append(input = {}) {
    const runtimeId = cleanText(input.runtime_id || input.runtimeId);
    const eventType = cleanText(input.event_type || input.eventType);
    const definition = getRuntimeEventType(eventType);
    if (!runtimeId) {
      throw new TimelineContractError(
        TIMELINE_ERROR_CODES.INVALID_INPUT,
        'Runtime event requires runtime_id.'
      );
    }
    if (!definition) {
      throw new TimelineContractError(
        TIMELINE_ERROR_CODES.UNKNOWN_EVENT_TYPE,
        `Unknown Runtime event type: ${eventType || 'empty'}`,
        { event_type: eventType }
      );
    }
    const version = cleanText(input.event_version) ||
      RUNTIME_EVENT_VERSION;
    if (version !== definition.current_version) {
      throw new TimelineContractError(
        TIMELINE_ERROR_CODES.UNSUPPORTED_EVENT_VERSION,
        'New Runtime events must use the current event version.',
        {
          event_type: eventType,
          expected: definition.current_version,
          received: version
        }
      );
    }
    if (input.payload !== undefined && !isObject(input.payload)) {
      throw new TimelineContractError(
        TIMELINE_ERROR_CODES.INVALID_INPUT,
        'Runtime event payload must be an object.'
      );
    }

    return persistence.appendEvent({
      event_id: cleanText(input.event_id) || createId('event'),
      runtime_id: runtimeId,
      event_type: eventType,
      payload: input.payload || {},
      event_version: version,
      created_at: cleanText(input.created_at) || clock()
    });
  }

  return Object.freeze({
    contract: TIMELINE_CONTRACT_ID,
    append
  });
}

export default createEventAppendService;
