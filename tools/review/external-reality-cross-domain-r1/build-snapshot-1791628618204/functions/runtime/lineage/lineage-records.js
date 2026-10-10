import {
  LINEAGE_ERROR_CODES,
  LineageContractError
} from './lineage-contract.js';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function clone(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.INVALID_INPUT,
      'Lineage values must be JSON serializable.'
    );
  }
}

function requireText(value, field) {
  const text = cleanText(value);
  if (!text) {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.INVALID_INPUT,
      `Missing required Lineage field: ${field}`,
      { field }
    );
  }
  return text;
}

export function normalizeRevisionRecord(input = {}, options = {}) {
  const timestamp = cleanText(options.now) ||
    new Date().toISOString();
  const createId = options.createId ||
    (prefix => `${prefix}_${Date.now()}`);
  const revisionId = cleanText(input.revision_id) ||
    createId('revision');
  const parentRevisionId = cleanText(input.parent_revision_id);
  if (parentRevisionId && parentRevisionId === revisionId) {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.REVISION_CONFLICT,
      'A Revision cannot be its own parent.'
    );
  }
  return Object.freeze({
    revision_id: revisionId,
    runtime_id: requireText(input.runtime_id, 'runtime_id'),
    parent_revision_id: parentRevisionId || null,
    reason: requireText(input.reason, 'reason'),
    changes: clone(input.changes || {}),
    schema_version: cleanText(input.schema_version) ||
      'phi-os.runtime-revision.v1',
    created_at: cleanText(input.created_at) || timestamp
  });
}

export function normalizeLineageRecord(input = {}, options = {}) {
  const timestamp = cleanText(options.now) ||
    new Date().toISOString();
  const createId = options.createId ||
    (prefix => `${prefix}_${Date.now()}`);
  const parentRuntimeId = requireText(
    input.parent_runtime_id,
    'parent_runtime_id'
  );
  const childRuntimeId = requireText(
    input.child_runtime_id,
    'child_runtime_id'
  );
  if (parentRuntimeId === childRuntimeId) {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.RELATIONSHIP_CONFLICT,
      'A Runtime cannot be its own parent.'
    );
  }
  const relationshipType =
    cleanText(input.relationship_type) || 'branch';
  if (relationshipType !== 'branch') {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.INVALID_INPUT,
      `Unsupported Runtime relationship: ${relationshipType}`
    );
  }
  return Object.freeze({
    lineage_id: cleanText(input.lineage_id) ||
      createId('lineage'),
    parent_runtime_id: parentRuntimeId,
    child_runtime_id: childRuntimeId,
    relationship_type: relationshipType,
    metadata: clone(input.metadata || {}),
    created_at: cleanText(input.created_at) || timestamp
  });
}

export function cloneLineageValue(value) {
  return clone(value);
}
