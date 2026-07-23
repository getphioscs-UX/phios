import { getRuntimeEventType } from './event-types.js';
import { adaptRuntimeEventToCurrent } from './event-versioning.js';
import {
  TIMELINE_CONTRACT_ID,
  TIMELINE_ERROR_CODES,
  TimelineContractError
} from './timeline-contract.js';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeLimit(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 1), 1000)
    : 250;
}

function normalizeTypes(value) {
  return Array.isArray(value)
    ? [...new Set(value.map(cleanText).filter(Boolean))]
    : [];
}

export function createTimelineReader(options = {}) {
  const persistence = options.persistence;
  if (!persistence || typeof persistence.listEvents !== 'function') {
    throw new TimelineContractError(
      TIMELINE_ERROR_CODES.PERSISTENCE_REQUIRED,
      'Timeline Reader requires Persistence.listEvents().'
    );
  }

  async function read(input = {}) {
    const runtimeId = cleanText(input.runtime_id || input.runtimeId);
    if (!runtimeId) {
      throw new TimelineContractError(
        TIMELINE_ERROR_CODES.INVALID_INPUT,
        'Timeline Reader requires runtime_id.'
      );
    }
    const limit = normalizeLimit(input.limit);
    const eventTypes = normalizeTypes(
      input.event_types || input.eventTypes
    );
    const rawEvents = await persistence.listEvents(runtimeId, {
      after: cleanText(input.after),
      limit: 1000
    });
    const warnings = [];
    const events = [];

    for (const rawEvent of rawEvents) {
      try {
        const event = adaptRuntimeEventToCurrent(rawEvent);
        const definition = getRuntimeEventType(event.event_type);
        if (
          input.include_internal !== true &&
          definition?.customer_visible !== true
        ) continue;
        if (
          eventTypes.length &&
          !eventTypes.includes(event.event_type)
        ) continue;
        events.push(event);
      } catch (error) {
        warnings.push(Object.freeze({
          event_id: cleanText(rawEvent?.event_id),
          code: cleanText(error?.code) ||
            TIMELINE_ERROR_CODES.INVALID_INPUT
        }));
      }
    }

    const sorted = events.sort((left, right) =>
      String(left.created_at).localeCompare(String(right.created_at)) ||
      String(left.event_id).localeCompare(String(right.event_id))
    ).slice(0, limit);

    return Object.freeze({
      contract: TIMELINE_CONTRACT_ID,
      runtime_id: runtimeId,
      events: Object.freeze(sorted),
      warnings: Object.freeze(warnings),
      event_count: sorted.length,
      source: 'runtime_events',
      append_only: true
    });
  }

  return Object.freeze({
    contract: TIMELINE_CONTRACT_ID,
    read
  });
}

export default createTimelineReader;
