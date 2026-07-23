import {
  PERSISTENCE_ERROR_CODES,
  PersistenceContractError,
  clonePersistenceValue,
  defaultPersistenceClock,
  defaultPersistenceId,
  normalizeListQuery,
  normalizeEventQuery,
  normalizeRuntimeEvent,
  normalizeRuntimePatch,
  normalizeRuntimeRecord,
  normalizeRuntimeSnapshot
} from '../persistence-contract.js';

function sortNewestFirst(a, b) {
  return String(b.updated_at || b.created_at || '').localeCompare(
    String(a.updated_at || a.created_at || '')
  );
}

export function createMemoryDriver(options = {}) {
  const clock = options.clock || defaultPersistenceClock;
  const createId = options.createId || defaultPersistenceId;
  const onMutation = typeof options.onMutation === 'function'
    ? options.onMutation
    : null;
  const initial = options.initialState || {};
  const runtimes = new Map(
    (initial.runtimes || []).map(item => [item.runtime_id, clonePersistenceValue(item)])
  );
  const events = new Map(
    (initial.events || []).map(item => [item.event_id, clonePersistenceValue(item)])
  );
  const snapshots = new Map(
    (initial.snapshots || []).map(item => [item.snapshot_id, clonePersistenceValue(item)])
  );

  function exportState() {
    return {
      runtimes: [...runtimes.values()].map(clonePersistenceValue),
      events: [...events.values()].map(clonePersistenceValue),
      snapshots: [...snapshots.values()].map(clonePersistenceValue)
    };
  }

  function changed() {
    onMutation?.(exportState());
  }

  function requireRuntime(runtimeId) {
    if (!runtimes.has(runtimeId)) {
      throw new PersistenceContractError(
        PERSISTENCE_ERROR_CODES.NOT_FOUND,
        `Runtime not found: ${runtimeId}`,
        { runtime_id: runtimeId }
      );
    }
  }

  const driver = {
    name: 'memory',

    async create(input) {
      const record = normalizeRuntimeRecord(input, { now: clock() });
      if (runtimes.has(record.runtime_id)) {
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.CONFLICT,
          `Runtime already exists: ${record.runtime_id}`,
          { runtime_id: record.runtime_id }
        );
      }
      runtimes.set(record.runtime_id, clonePersistenceValue(record));
      changed();
      return clonePersistenceValue(record);
    },

    async read(runtimeId) {
      return clonePersistenceValue(runtimes.get(String(runtimeId || '').trim())) || null;
    },

    async update(runtimeId, input) {
      const id = String(runtimeId || '').trim();
      requireRuntime(id);
      const current = runtimes.get(id);
      const patch = normalizeRuntimePatch(input, { now: clock() });
      const updated = { ...current, ...patch, runtime_id: id };
      runtimes.set(id, clonePersistenceValue(updated));
      changed();
      return clonePersistenceValue(updated);
    },

    async delete(runtimeId) {
      const id = String(runtimeId || '').trim();
      if (!runtimes.delete(id)) return false;
      for (const [eventId, event] of events) {
        if (event.runtime_id === id) events.delete(eventId);
      }
      for (const [snapshotId, snapshot] of snapshots) {
        if (snapshot.runtime_id === id) snapshots.delete(snapshotId);
      }
      changed();
      return true;
    },

    async list(input = {}) {
      const query = normalizeListQuery(input);
      const records = [...runtimes.values()]
        .filter(record => !query.user_id || record.user_id === query.user_id)
        .filter(record => !query.status || record.status === query.status)
        .filter(record => !query.current_stage ||
          record.current_stage === query.current_stage)
        .sort(sortNewestFirst);
      return clonePersistenceValue(
        records.slice(query.offset, query.offset + query.limit)
      );
    },

    async appendEvent(input) {
      const event = normalizeRuntimeEvent(input, {
        now: clock(),
        createId
      });
      requireRuntime(event.runtime_id);
      if (events.has(event.event_id)) {
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.CONFLICT,
          `Runtime event already exists: ${event.event_id}`,
          { event_id: event.event_id }
        );
      }
      events.set(event.event_id, clonePersistenceValue(event));
      changed();
      return clonePersistenceValue(event);
    },

    async listEvents(runtimeId, input = {}) {
      const id = String(runtimeId || '').trim();
      const query = normalizeEventQuery(input);
      return clonePersistenceValue(
        [...events.values()]
          .filter(event => event.runtime_id === id)
          .filter(event => !query.after || event.created_at > query.after)
          .filter(event => !query.event_type ||
            event.event_type === query.event_type)
          .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
          .slice(0, query.limit)
      );
    },

    async saveSnapshot(input) {
      const snapshot = normalizeRuntimeSnapshot(input, {
        now: clock(),
        createId
      });
      requireRuntime(snapshot.runtime_id);
      if (snapshots.has(snapshot.snapshot_id)) {
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.CONFLICT,
          `Runtime snapshot already exists: ${snapshot.snapshot_id}`,
          { snapshot_id: snapshot.snapshot_id }
        );
      }
      snapshots.set(snapshot.snapshot_id, clonePersistenceValue(snapshot));
      changed();
      return clonePersistenceValue(snapshot);
    },

    async loadSnapshot(runtimeId, input = {}) {
      const id = String(runtimeId || '').trim();
      const snapshotId = String(input.snapshot_id || '').trim();
      if (snapshotId) {
        const snapshot = snapshots.get(snapshotId);
        return snapshot?.runtime_id === id
          ? clonePersistenceValue(snapshot)
          : null;
      }
      const latest = [...snapshots.values()]
        .filter(snapshot => snapshot.runtime_id === id)
        .sort(sortNewestFirst)[0];
      return clonePersistenceValue(latest) || null;
    }
  };

  return Object.freeze(driver);
}

export default createMemoryDriver;
