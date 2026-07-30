export const REGISTRY_SCHEMA_ID = 'phi-os.pws.universal-registry.v1';
export const REGISTRY_SCHEMA_VERSION = 'pws-v1';

export const REGISTRY_STATUSES = Object.freeze({
  object: ['draft', 'active', 'suspended', 'deprecated', 'archived'],
  version: ['draft', 'active', 'superseded', 'withdrawn'],
  relationship: ['active', 'inactive', 'revoked'],
  restriction: ['active', 'inactive', 'revoked', 'expired']
});

export class RegistryValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'RegistryValidationError';
    this.code = 'PWS_REGISTRY_VALIDATION_FAILED';
    this.details = details;
  }
}

export function requiredText(value, field) {
  const text = String(value ?? '').trim();
  if (!text) throw new RegistryValidationError(`${field} is required.`, { field });
  return text;
}

export function enumValue(value, allowed, field) {
  const normalized = requiredText(value, field);
  if (!allowed.includes(normalized)) {
    throw new RegistryValidationError(`${field} has an unsupported value.`, {
      field, value: normalized, allowed
    });
  }
  return normalized;
}

export function jsonObject(value, field) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new RegistryValidationError(`${field} must be an object.`, { field });
  }
  return structuredClone(value);
}

export function normalizeObject(input, now) {
  return {
    object_id: requiredText(input.object_id, 'object_id'),
    object_code: requiredText(input.object_code, 'object_code'),
    object_type: requiredText(input.object_type, 'object_type'),
    canonical_name: requiredText(input.canonical_name, 'canonical_name'),
    owner_module: requiredText(input.owner_module, 'owner_module'),
    schema_version: requiredText(
      input.schema_version || REGISTRY_SCHEMA_VERSION, 'schema_version'
    ),
    status: enumValue(input.status || 'active', REGISTRY_STATUSES.object, 'status'),
    metadata: jsonObject(input.metadata, 'metadata'),
    created_at: requiredText(input.created_at || now, 'created_at'),
    updated_at: requiredText(input.updated_at || now, 'updated_at')
  };
}

export function parseJson(value, field) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : (value ?? {});
  } catch {
    throw new RegistryValidationError(`Invalid JSON returned for ${field}.`, { field });
  }
}
