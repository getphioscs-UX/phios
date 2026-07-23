/**
 * M2-W2 Runtime Persistence Contract.
 *
 * This is an infrastructure boundary, not a new Runtime Stage. All drivers
 * must implement the same nine asynchronous operations and return canonical
 * snake_case records.
 */

export const PERSISTENCE_CONTRACT_ID = 'phi-os.runtime-persistence.v1';

export const PERSISTENCE_METHODS = Object.freeze([
  'create',
  'read',
  'update',
  'delete',
  'list',
  'appendEvent',
  'listEvents',
  'saveSnapshot',
  'loadSnapshot'
]);

export const PERSISTENCE_DRIVERS = Object.freeze({
  test: 'memory',
  development: 'local',
  production: 'd1'
});

export const PERSISTENCE_ERROR_CODES = Object.freeze({
  INVALID_DRIVER: 'persistence_invalid_driver',
  INVALID_INPUT: 'persistence_invalid_input',
  NOT_FOUND: 'persistence_not_found',
  CONFLICT: 'persistence_conflict',
  BINDING_MISSING: 'persistence_binding_missing',
  STORAGE_UNAVAILABLE: 'persistence_storage_unavailable',
  DRIVER_FAILURE: 'persistence_driver_failure'
});

export class PersistenceContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PersistenceContractError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function clone(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.INVALID_INPUT,
      'Persistence values must be JSON serializable.'
    );
  }
}

function requireText(value, field) {
  const text = cleanText(value);
  if (!text) {
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.INVALID_INPUT,
      `Missing required persistence field: ${field}`,
      { field }
    );
  }
  return text;
}

export function defaultPersistenceClock() {
  return new Date().toISOString();
}

export function defaultPersistenceId(prefix = 'record') {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}_${uuid}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function normalizeRuntimeRecord(input = {}, { now } = {}) {
  const timestamp = cleanText(now) || defaultPersistenceClock();
  return Object.freeze({
    runtime_id: requireText(input.runtime_id, 'runtime_id'),
    user_id: cleanText(input.user_id),
    status: cleanText(input.status) || 'active',
    current_stage: cleanText(input.current_stage) || 'entry_collecting',
    schema_version: cleanText(input.schema_version) ||
      'phi-os.runtime-persistence.v1',
    state: clone(input.state || {}),
    created_at: cleanText(input.created_at) || timestamp,
    updated_at: cleanText(input.updated_at) || timestamp
  });
}

export function normalizeRuntimePatch(input = {}, { now } = {}) {
  const allowed = [
    'user_id',
    'status',
    'current_stage',
    'schema_version',
    'state'
  ];
  const patch = {};

  for (const field of allowed) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    patch[field] = field === 'state'
      ? clone(input[field] || {})
      : cleanText(input[field]);
    if (field !== 'user_id' && field !== 'state' && !patch[field]) {
      throw new PersistenceContractError(
        PERSISTENCE_ERROR_CODES.INVALID_INPUT,
        `Persistence field cannot be empty: ${field}`,
        { field }
      );
    }
  }

  patch.updated_at = cleanText(now) || defaultPersistenceClock();
  return Object.freeze(patch);
}

export function normalizeRuntimeEvent(input = {}, options = {}) {
  const timestamp = cleanText(options.now) || defaultPersistenceClock();
  const createId = options.createId || defaultPersistenceId;
  return Object.freeze({
    event_id: cleanText(input.event_id) || createId('event'),
    runtime_id: requireText(input.runtime_id, 'runtime_id'),
    event_type: requireText(input.event_type, 'event_type'),
    payload: clone(input.payload || {}),
    event_version: cleanText(input.event_version) || '1.0.0',
    created_at: cleanText(input.created_at) || timestamp
  });
}

export function normalizeEventQuery(query = {}) {
  const parsedLimit = Number.parseInt(query.limit, 10);
  return Object.freeze({
    after: cleanText(query.after),
    event_type: cleanText(query.event_type),
    limit: Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 1000)
      : 250
  });
}

export function normalizeRuntimeSnapshot(input = {}, options = {}) {
  const timestamp = cleanText(options.now) || defaultPersistenceClock();
  const createId = options.createId || defaultPersistenceId;
  return Object.freeze({
    snapshot_id: cleanText(input.snapshot_id) || createId('snapshot'),
    runtime_id: requireText(input.runtime_id, 'runtime_id'),
    stage: requireText(input.stage, 'stage'),
    state: clone(input.state || {}),
    schema_version: cleanText(input.schema_version) ||
      'phi-os.runtime-snapshot.v1',
    created_at: cleanText(input.created_at) || timestamp
  });
}

export function normalizeListQuery(query = {}) {
  const parsedLimit = Number.parseInt(query.limit, 10);
  const parsedOffset = Number.parseInt(query.offset, 10);
  return Object.freeze({
    user_id: cleanText(query.user_id),
    status: cleanText(query.status),
    current_stage: cleanText(query.current_stage),
    limit: Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 25,
    offset: Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0
  });
}

export function assertPersistenceDriver(driver) {
  if (!driver || typeof driver !== 'object') {
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.INVALID_DRIVER,
      'Persistence driver must be an object.'
    );
  }

  for (const method of PERSISTENCE_METHODS) {
    if (typeof driver[method] !== 'function') {
      throw new PersistenceContractError(
        PERSISTENCE_ERROR_CODES.INVALID_DRIVER,
        `Persistence driver is missing method: ${method}`,
        { method, driver: driver.name || 'unknown' }
      );
    }
  }

  return driver;
}

export function clonePersistenceValue(value) {
  return clone(value);
}
