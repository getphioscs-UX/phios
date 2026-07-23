export const RECOVERY_CONTRACT_ID = 'phi-os.runtime-recovery.v1';

export const RECOVERY_METHODS = Object.freeze([
  'recoverSession',
  'recoverPartialWrite',
  'beginProviderRequest',
  'completeProviderRequest',
  'recordProviderFailure',
  'executeProviderOperation'
]);

export const RECOVERY_ERROR_CODES = Object.freeze({
  INVALID_INPUT: 'recovery_invalid_input',
  RUNTIME_NOT_FOUND: 'recovery_runtime_not_found',
  REQUEST_LOCKED: 'recovery_request_locked',
  RECOVERY_FAILED: 'recovery_failed'
});

export class RecoveryContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RecoveryContractError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function requireRecoveryText(value, field) {
  const text = cleanText(value);
  if (!text) {
    throw new RecoveryContractError(
      RECOVERY_ERROR_CODES.INVALID_INPUT,
      `Missing required Recovery field: ${field}`,
      { field }
    );
  }
  return text;
}

export function normalizeRecoveryRequest(input = {}) {
  return Object.freeze({
    runtime_id: requireRecoveryText(
      input.runtime_id || input.runtimeId,
      'runtime_id'
    ),
    request_id: cleanText(input.request_id || input.requestId),
    stage: cleanText(input.stage),
    provider: cleanText(input.provider),
    allow_retry: input.allow_retry === true || input.allowRetry === true
  });
}

export function assertRecoveryService(service) {
  if (!service || typeof service !== 'object') {
    throw new RecoveryContractError(
      RECOVERY_ERROR_CODES.INVALID_INPUT,
      'Recovery service must be an object.'
    );
  }
  for (const method of RECOVERY_METHODS) {
    if (typeof service[method] !== 'function') {
      throw new RecoveryContractError(
        RECOVERY_ERROR_CODES.INVALID_INPUT,
        `Recovery service is missing method: ${method}`,
        { method }
      );
    }
  }
  return service;
}

