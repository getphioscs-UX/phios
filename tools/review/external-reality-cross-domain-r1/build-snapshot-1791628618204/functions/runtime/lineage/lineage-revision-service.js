import {
  defaultPersistenceClock,
  defaultPersistenceId
} from '../persistence/persistence-contract.js';
import { createTimelineService } from '../timeline/timeline-service.js';
import {
  LINEAGE_CONTRACT_ID,
  LINEAGE_ERROR_CODES,
  RUNTIME_CHANGE_MODES,
  LineageContractError
} from './lineage-contract.js';
import {
  assertLineageStore,
  selectLineageStore
} from './lineage-store.js';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
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

function requireUserAction(input) {
  if (input.user_initiated !== true && input.userInitiated !== true) {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.USER_ACTION_REQUIRED,
      'Edit, New Journey, and Branch require explicit user action.'
    );
  }
}

function assertPersistence(persistence) {
  for (const method of [
    'create', 'read', 'update', 'list', 'saveSnapshot',
    'appendEvent', 'listEvents'
  ]) {
    if (typeof persistence?.[method] !== 'function') {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.STORAGE_REQUIRED,
        `Lineage requires Persistence.${method}().`
      );
    }
  }
  return persistence;
}

function applyStatePatch(state, changes) {
  return {
    ...(isObject(state) ? clone(state) : {}),
    ...clone(changes)
  };
}

export function createLineageRevisionService(options = {}) {
  const persistence = assertPersistence(options.persistence);
  const store = assertLineageStore(selectLineageStore(options));
  const clock = options.clock || defaultPersistenceClock;
  const createId = options.createId || defaultPersistenceId;
  const timeline = options.timeline ||
    createTimelineService({ persistence, clock, createId });

  async function requireRuntime(runtimeId) {
    const runtime = await persistence.read(runtimeId);
    if (!runtime) {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.RUNTIME_NOT_FOUND,
        `Runtime not found: ${runtimeId}`,
        { runtime_id: runtimeId }
      );
    }
    return runtime;
  }

  async function assertRuntimeAvailable(runtimeId) {
    if (await persistence.read(runtimeId)) {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.RUNTIME_EXISTS,
        `Runtime already exists: ${runtimeId}`,
        { runtime_id: runtimeId }
      );
    }
  }

  async function editRuntime(input = {}) {
    requireUserAction(input);
    const runtimeId = requireText(
      input.runtime_id || input.runtimeId,
      'runtime_id'
    );
    const reason = requireText(input.reason, 'reason');
    if (!isObject(input.changes) ||
        Object.keys(input.changes).length === 0) {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.INVALID_INPUT,
        'Edit requires a non-empty changes object.'
      );
    }
    const runtime = await requireRuntime(runtimeId);
    const revisions = await store.listRevisions(runtimeId);
    const parentRevision = revisions.at(-1) || null;
    const createdAt = clock();
    const revision = await store.createRevision({
      revision_id: cleanText(input.revision_id) ||
        createId('revision'),
      runtime_id: runtimeId,
      parent_revision_id: parentRevision?.revision_id || null,
      reason,
      changes: input.changes,
      created_at: createdAt
    });
    const updatedState = applyStatePatch(
      runtime.state,
      input.changes
    );
    const updated = await persistence.update(runtimeId, {
      state: updatedState
    });
    await timeline.append({
      runtime_id: runtimeId,
      event_type: 'revision.created',
      payload: {
        revision_id: revision.revision_id,
        parent_revision_id: revision.parent_revision_id,
        current_stage: updated.current_stage
      },
      created_at: createdAt
    });
    const snapshot = await persistence.saveSnapshot({
      runtime_id: runtimeId,
      stage: updated.current_stage,
      state: updated.state,
      created_at: createdAt
    });
    return Object.freeze({
      contract: LINEAGE_CONTRACT_ID,
      mode: RUNTIME_CHANGE_MODES.edit,
      runtime_id: runtimeId,
      revision,
      snapshot,
      same_runtime: true,
      child_runtime_created: false,
      historical_overwrite: false
    });
  }

  async function createNewJourney(input = {}) {
    requireUserAction(input);
    const runtimeId = cleanText(
      input.runtime_id || input.runtimeId
    ) || createId('runtime');
    await assertRuntimeAvailable(runtimeId);
    const createdAt = clock();
    const runtime = await persistence.create({
      runtime_id: runtimeId,
      user_id: cleanText(input.user_id || input.userId),
      current_stage:
        cleanText(input.current_stage) || 'entry_collecting',
      state: isObject(input.initial_state)
        ? clone(input.initial_state)
        : {},
      created_at: createdAt,
      updated_at: createdAt
    });
    await timeline.append({
      runtime_id: runtimeId,
      event_type: 'runtime.created',
      payload: {
        origin: 'new_journey',
        current_stage: runtime.current_stage
      },
      created_at: createdAt
    });
    return Object.freeze({
      contract: LINEAGE_CONTRACT_ID,
      mode: RUNTIME_CHANGE_MODES.new_journey,
      runtime,
      independent_runtime: true,
      parent_runtime_id: null,
      lineage: null,
      historical_overwrite: false
    });
  }

  async function branchRuntime(input = {}) {
    requireUserAction(input);
    const parentRuntimeId = requireText(
      input.parent_runtime_id || input.parentRuntimeId,
      'parent_runtime_id'
    );
    const parent = await requireRuntime(parentRuntimeId);
    const childRuntimeId = cleanText(
      input.child_runtime_id || input.childRuntimeId
    ) || createId('runtime');
    await assertRuntimeAvailable(childRuntimeId);
    const reason = requireText(input.reason, 'reason');
    const parentRevisions = await store.listRevisions(
      parentRuntimeId
    );
    const sourceRevisionId =
      parentRevisions.at(-1)?.revision_id || null;
    const createdAt = clock();
    const childState = {
      ...(isObject(input.initial_state)
        ? clone(input.initial_state)
        : {}),
      lineage_context: {
        parent_runtime_id: parentRuntimeId,
        source_revision_id: sourceRevisionId,
        relationship_type: 'branch',
        reference_only: true,
        inherited_as_fact: false
      }
    };
    const child = await persistence.create({
      runtime_id: childRuntimeId,
      user_id:
        cleanText(input.user_id || input.userId) ||
        parent.user_id,
      current_stage:
        cleanText(input.current_stage) || 'entry_collecting',
      state: childState,
      created_at: createdAt,
      updated_at: createdAt
    });
    const lineage = await store.createLineage({
      lineage_id: cleanText(input.lineage_id) ||
        createId('lineage'),
      parent_runtime_id: parentRuntimeId,
      child_runtime_id: childRuntimeId,
      relationship_type: 'branch',
      metadata: {
        reason,
        source_revision_id: sourceRevisionId,
        reference_only: true,
        inherited_as_fact: false
      },
      created_at: createdAt
    });
    await timeline.append({
      runtime_id: childRuntimeId,
      event_type: 'runtime.created',
      payload: {
        origin: 'branch',
        parent_runtime_id: parentRuntimeId,
        source_revision_id: sourceRevisionId,
        current_stage: child.current_stage
      },
      created_at: createdAt
    });
    const snapshot = await persistence.saveSnapshot({
      runtime_id: childRuntimeId,
      stage: child.current_stage,
      state: child.state,
      created_at: createdAt
    });
    return Object.freeze({
      contract: LINEAGE_CONTRACT_ID,
      mode: RUNTIME_CHANGE_MODES.branch,
      parent_runtime_id: parentRuntimeId,
      child_runtime_id: childRuntimeId,
      child,
      lineage,
      snapshot,
      inherited_as_fact: false,
      historical_overwrite: false
    });
  }

  async function runtimesFromRoot(runtimeId) {
    const queue = [runtimeId];
    const records = new Map();
    while (queue.length && records.size < 100) {
      const id = queue.shift();
      if (records.has(id)) continue;
      const runtime = await persistence.read(id);
      if (!runtime) continue;
      records.set(id, runtime);
      const [parents, children] = await Promise.all([
        store.listParentLinks(id),
        store.listChildLinks(id)
      ]);
      for (const link of [...parents, ...children]) {
        const related = link.parent_runtime_id === id
          ? link.child_runtime_id
          : link.parent_runtime_id;
        if (!records.has(related)) queue.push(related);
      }
    }
    return [...records.values()];
  }

  async function buildViewerData(input = {}) {
    const runtimeId = cleanText(
      input.runtime_id || input.runtimeId
    );
    const userId = cleanText(input.user_id || input.userId);
    if (!runtimeId && !userId) {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.INVALID_INPUT,
        'Lineage Viewer requires runtime_id or user_id.'
      );
    }
    const runtimes = runtimeId
      ? await runtimesFromRoot(runtimeId)
      : await persistence.list({ user_id: userId, limit: 100 });
    const runtimeIds = runtimes.map(runtime => runtime.runtime_id);
    const [lineages, revisionSets] = await Promise.all([
      store.listLineages({ runtime_ids: runtimeIds }),
      Promise.all(runtimeIds.map(id => store.listRevisions(id)))
    ]);
    const revisionByRuntime = new Map(
      runtimeIds.map((id, index) => [id, revisionSets[index]])
    );
    const parentIds = new Set(
      lineages.map(link => link.child_runtime_id)
    );
    const nodes = runtimes.map(runtime => {
      const revisions = revisionByRuntime.get(runtime.runtime_id) || [];
      return Object.freeze({
        runtime_id: runtime.runtime_id,
        status: runtime.status,
        current_stage: runtime.current_stage,
        created_at: runtime.created_at,
        updated_at: runtime.updated_at,
        root: !parentIds.has(runtime.runtime_id),
        parent_runtime_ids: lineages
          .filter(link =>
            link.child_runtime_id === runtime.runtime_id
          )
          .map(link => link.parent_runtime_id),
        child_runtime_ids: lineages
          .filter(link =>
            link.parent_runtime_id === runtime.runtime_id
          )
          .map(link => link.child_runtime_id),
        revision_count: revisions.length,
        current_revision_id:
          revisions.at(-1)?.revision_id || null
      });
    }).sort((left, right) =>
      String(left.created_at).localeCompare(String(right.created_at))
    );
    const revisionChains = runtimeIds.map(id => Object.freeze({
      runtime_id: id,
      revisions: Object.freeze(
        (revisionByRuntime.get(id) || []).map(revision =>
          Object.freeze({
            revision_id: revision.revision_id,
            parent_revision_id: revision.parent_revision_id,
            reason: revision.reason,
            changed_fields: Object.freeze(
              Object.keys(revision.changes || {})
            ),
            created_at: revision.created_at
          })
        )
      )
    }));
    return Object.freeze({
      schema_version: 'phi-os.lineage-viewer-data.v1',
      generated_at: clock(),
      nodes: Object.freeze(nodes),
      edges: Object.freeze(lineages.map(link => Object.freeze({
        lineage_id: link.lineage_id,
        parent_runtime_id: link.parent_runtime_id,
        child_runtime_id: link.child_runtime_id,
        relationship_type: link.relationship_type,
        created_at: link.created_at
      }))),
      revision_chains: Object.freeze(revisionChains),
      guardrails: Object.freeze({
        raw_runtime_state_exposed: false,
        raw_revision_values_exposed: false,
        historical_overwrite_allowed: false,
        branch_inheritance_is_reference_only: true
      })
    });
  }

  return Object.freeze({
    contract: LINEAGE_CONTRACT_ID,
    store: store.name,
    editRuntime,
    createNewJourney,
    branchRuntime,
    buildViewerData
  });
}

export default createLineageRevisionService;
