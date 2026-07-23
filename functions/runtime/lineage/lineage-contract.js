export const LINEAGE_CONTRACT_ID =
  'phi-os.runtime-lineage-revision.v1';

export const RUNTIME_CHANGE_MODES = Object.freeze({
  edit: 'same_runtime_new_revision',
  new_journey: 'new_independent_runtime',
  branch: 'new_child_runtime'
});

export const LINEAGE_RELATIONSHIP_TYPES = Object.freeze([
  'branch'
]);

export const LINEAGE_METHODS = Object.freeze([
  'editRuntime',
  'createNewJourney',
  'branchRuntime',
  'buildViewerData'
]);

export const LINEAGE_ERROR_CODES = Object.freeze({
  INVALID_INPUT: 'lineage_invalid_input',
  RUNTIME_NOT_FOUND: 'lineage_runtime_not_found',
  RUNTIME_EXISTS: 'lineage_runtime_exists',
  REVISION_CONFLICT: 'lineage_revision_conflict',
  RELATIONSHIP_CONFLICT: 'lineage_relationship_conflict',
  USER_ACTION_REQUIRED: 'lineage_user_action_required',
  STORAGE_REQUIRED: 'lineage_storage_required'
});

export class LineageContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'LineageContractError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function assertLineageService(service) {
  if (!service || typeof service !== 'object') {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.INVALID_INPUT,
      'Lineage and Revision service must be an object.'
    );
  }
  for (const method of LINEAGE_METHODS) {
    if (typeof service[method] !== 'function') {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.INVALID_INPUT,
        `Lineage service is missing method: ${method}`,
        { method }
      );
    }
  }
  return service;
}
