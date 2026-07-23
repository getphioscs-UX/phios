import {
  LINEAGE_ERROR_CODES,
  LineageContractError
} from '../lineage-contract.js';
import {
  cloneLineageValue,
  normalizeLineageRecord,
  normalizeRevisionRecord
} from '../lineage-records.js';

export function createMemoryLineageStore(options = {}) {
  const clock = options.clock || (() => new Date().toISOString());
  const createId = options.createId;
  const revisions = new Map(
    (options.initialState?.revisions || []).map(record => [
      record.revision_id,
      cloneLineageValue(record)
    ])
  );
  const lineages = new Map(
    (options.initialState?.lineages || []).map(record => [
      record.lineage_id,
      cloneLineageValue(record)
    ])
  );
  const onMutation = typeof options.onMutation === 'function'
    ? options.onMutation
    : null;

  function exportState() {
    return {
      revisions: [...revisions.values()].map(cloneLineageValue),
      lineages: [...lineages.values()].map(cloneLineageValue)
    };
  }

  function changed() {
    onMutation?.(exportState());
  }

  async function createRevision(input) {
    const record = normalizeRevisionRecord(input, {
      now: clock(),
      createId
    });
    if (revisions.has(record.revision_id)) {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.REVISION_CONFLICT,
        `Revision already exists: ${record.revision_id}`
      );
    }
    if (record.parent_revision_id) {
      const parent = revisions.get(record.parent_revision_id);
      if (!parent || parent.runtime_id !== record.runtime_id) {
        throw new LineageContractError(
          LINEAGE_ERROR_CODES.REVISION_CONFLICT,
          'Parent Revision must exist in the same Runtime.'
        );
      }
    }
    revisions.set(record.revision_id, cloneLineageValue(record));
    changed();
    return cloneLineageValue(record);
  }

  async function listRevisions(runtimeId) {
    return [...revisions.values()]
      .filter(record => record.runtime_id === String(runtimeId || '').trim())
      .sort((left, right) =>
        String(left.created_at).localeCompare(String(right.created_at)) ||
        String(left.revision_id).localeCompare(String(right.revision_id))
      )
      .map(cloneLineageValue);
  }

  async function createLineage(input) {
    const record = normalizeLineageRecord(input, {
      now: clock(),
      createId
    });
    const duplicate = [...lineages.values()].some(item =>
      item.parent_runtime_id === record.parent_runtime_id &&
      item.child_runtime_id === record.child_runtime_id &&
      item.relationship_type === record.relationship_type
    );
    if (lineages.has(record.lineage_id) || duplicate) {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.RELATIONSHIP_CONFLICT,
        'Runtime relationship already exists.'
      );
    }
    lineages.set(record.lineage_id, cloneLineageValue(record));
    changed();
    return cloneLineageValue(record);
  }

  async function listParentLinks(runtimeId) {
    return [...lineages.values()]
      .filter(item =>
        item.child_runtime_id === String(runtimeId || '').trim()
      )
      .map(cloneLineageValue);
  }

  async function listChildLinks(runtimeId) {
    return [...lineages.values()]
      .filter(item =>
        item.parent_runtime_id === String(runtimeId || '').trim()
      )
      .map(cloneLineageValue);
  }

  async function listLineages(input = {}) {
    const runtimeIds = new Set(
      Array.isArray(input.runtime_ids) ? input.runtime_ids : []
    );
    return [...lineages.values()]
      .filter(item => !runtimeIds.size ||
        runtimeIds.has(item.parent_runtime_id) ||
        runtimeIds.has(item.child_runtime_id)
      )
      .sort((left, right) =>
        String(left.created_at).localeCompare(String(right.created_at))
      )
      .map(cloneLineageValue);
  }

  return Object.freeze({
    name: 'memory',
    createRevision,
    listRevisions,
    createLineage,
    listParentLinks,
    listChildLinks,
    listLineages,
    exportState
  });
}

export default createMemoryLineageStore;
