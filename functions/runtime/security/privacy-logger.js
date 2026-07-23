import { SECURITY_PRIVACY_CONTRACT_ID } from './security-contract.js';

const safeKeys = new Set([
  'operation',
  'code',
  'status',
  'stage',
  'event_type',
  'driver',
  'environment',
  'request_id',
  'duration_ms',
  'count',
  'classification'
]);

const sensitiveKeyPattern =
  /(answer|message|conversation|payload|state|snapshot|changes|email|phone|address|name|financial|medical|health|token|secret|authorization|cookie|password|note|text)/i;

function sanitizeValue(value, key = '', depth = 0) {
  if (depth > 5) return '[REDACTED]';
  if (value === null || value === undefined) return value;
  if (sensitiveKeyPattern.test(key)) return '[REDACTED]';
  if (typeof value === 'string') {
    if (!safeKeys.has(key)) return '[REDACTED]';
    return value.slice(0, 160);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, key, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeValue(childValue, childKey, depth + 1)
      ])
    );
  }
  return '[REDACTED]';
}

export function sanitizeLogContext(context = {}) {
  return Object.freeze(sanitizeValue(context, '', 0));
}

export function createPrivacyLogger(options = {}) {
  const sink = typeof options.sink === 'function'
    ? options.sink
    : () => {};

  function write(level, message, context = {}) {
    const record = Object.freeze({
      contract: SECURITY_PRIVACY_CONTRACT_ID,
      level,
      message: String(message || '').trim().slice(0, 160),
      context: sanitizeLogContext(context)
    });
    sink(record);
    return record;
  }

  return Object.freeze({
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context)
  });
}

export default createPrivacyLogger;
