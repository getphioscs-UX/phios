export const TIMELINE_CONTRACT_ID = 'phi-os.runtime-timeline.v1';

export const TIMELINE_METHODS = Object.freeze([
  'append',
  'read',
  'project'
]);

export const TIMELINE_ERROR_CODES = Object.freeze({
  INVALID_INPUT: 'timeline_invalid_input',
  UNKNOWN_EVENT_TYPE: 'timeline_unknown_event_type',
  UNSUPPORTED_EVENT_VERSION: 'timeline_unsupported_event_version',
  PERSISTENCE_REQUIRED: 'timeline_persistence_required'
});

export class TimelineContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'TimelineContractError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function assertTimelineService(service) {
  if (!service || typeof service !== 'object') {
    throw new TimelineContractError(
      TIMELINE_ERROR_CODES.INVALID_INPUT,
      'Timeline service must be an object.'
    );
  }
  for (const method of TIMELINE_METHODS) {
    if (typeof service[method] !== 'function') {
      throw new TimelineContractError(
        TIMELINE_ERROR_CODES.INVALID_INPUT,
        `Timeline service is missing method: ${method}`,
        { method }
      );
    }
  }
  return service;
}
