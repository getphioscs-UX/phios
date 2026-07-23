import {
  PERSISTENCE_ERROR_CODES,
  PersistenceContractError,
  defaultPersistenceClock,
  defaultPersistenceId,
  normalizeListQuery,
  normalizeEventQuery,
  normalizeRuntimeEvent,
  normalizeRuntimePatch,
  normalizeRuntimeRecord,
  normalizeRuntimeSnapshot
} from '../persistence-contract.js';

function assertD1Binding(db) {
  if (!db || typeof db.prepare !== 'function') {
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.BINDING_MISSING,
      'Production persistence requires the RUNTIME_DB D1 binding.',
      { binding: 'RUNTIME_DB' }
    );
  }
  return db;
}

function parseJson(value, field) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : (value || {});
  } catch {
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.DRIVER_FAILURE,
      `D1 returned invalid JSON for ${field}.`,
      { field }
    );
  }
}

function runtimeFromRow(row) {
  if (!row) return null;
  return {
    runtime_id: row.runtime_id,
    user_id: row.user_id || '',
    status: row.status,
    current_stage: row.current_stage,
    schema_version: row.schema_version,
    state: parseJson(row.state, 'state'),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function snapshotFromRow(row) {
  if (!row) return null;
  return {
    snapshot_id: row.snapshot_id,
    runtime_id: row.runtime_id,
    stage: row.stage,
    state: parseJson(row.state, 'snapshot.state'),
    schema_version: row.schema_version,
    created_at: row.created_at
  };
}

function eventFromRow(row) {
  if (!row) return null;
  return {
    event_id: row.event_id,
    runtime_id: row.runtime_id,
    event_type: row.event_type,
    payload: parseJson(row.payload, 'event.payload'),
    event_version: row.event_version,
    created_at: row.created_at
  };
}

async function run(statement, operation) {
  try {
    const result = await statement.run();
    if (result?.success === false) {
      throw new Error('D1 operation returned success=false');
    }
    return result;
  } catch (error) {
    if (error instanceof PersistenceContractError) throw error;
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.DRIVER_FAILURE,
      `D1 persistence operation failed: ${operation}`,
      { operation }
    );
  }
}

export function createD1Driver(options = {}) {
  const db = assertD1Binding(options.db);
  const clock = options.clock || defaultPersistenceClock;
  const createId = options.createId || defaultPersistenceId;

  const driver = {
    name: 'd1',

    async create(input) {
      const record = normalizeRuntimeRecord(input, { now: clock() });
      await run(
        db.prepare(`
          INSERT INTO runtimes (
            runtime_id, user_id, status, current_stage, schema_version,
            state, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        `).bind(
          record.runtime_id,
          record.user_id || null,
          record.status,
          record.current_stage,
          record.schema_version,
          JSON.stringify(record.state),
          record.created_at,
          record.updated_at
        ),
        'create'
      );
      return record;
    },

    async read(runtimeId) {
      const id = String(runtimeId || '').trim();
      try {
        const row = await db.prepare(`
          SELECT runtime_id, user_id, status, current_stage, schema_version,
                 state, created_at, updated_at
          FROM runtimes
          WHERE runtime_id = ?1
          LIMIT 1
        `).bind(id).first();
        return runtimeFromRow(row);
      } catch (error) {
        if (error instanceof PersistenceContractError) throw error;
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.DRIVER_FAILURE,
          'D1 persistence operation failed: read',
          { operation: 'read' }
        );
      }
    },

    async update(runtimeId, input) {
      const id = String(runtimeId || '').trim();
      const current = await driver.read(id);
      if (!current) {
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.NOT_FOUND,
          `Runtime not found: ${id}`,
          { runtime_id: id }
        );
      }
      const patch = normalizeRuntimePatch(input, { now: clock() });
      const updated = { ...current, ...patch, runtime_id: id };
      await run(
        db.prepare(`
          UPDATE runtimes
          SET user_id = ?2,
              status = ?3,
              current_stage = ?4,
              schema_version = ?5,
              state = ?6,
              updated_at = ?7
          WHERE runtime_id = ?1
        `).bind(
          id,
          updated.user_id || null,
          updated.status,
          updated.current_stage,
          updated.schema_version,
          JSON.stringify(updated.state),
          updated.updated_at
        ),
        'update'
      );
      return updated;
    },

    async delete(runtimeId) {
      const id = String(runtimeId || '').trim();
      const result = await run(
        db.prepare('DELETE FROM runtimes WHERE runtime_id = ?1').bind(id),
        'delete'
      );
      return Number(result?.meta?.changes || 0) > 0;
    },

    async list(input = {}) {
      const query = normalizeListQuery(input);
      const clauses = [];
      const values = [];
      const add = (column, value) => {
        if (!value) return;
        values.push(value);
        clauses.push(`${column} = ?${values.length}`);
      };
      add('user_id', query.user_id);
      add('status', query.status);
      add('current_stage', query.current_stage);
      values.push(query.limit);
      const limitParameter = `?${values.length}`;
      values.push(query.offset);
      const offsetParameter = `?${values.length}`;
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

      try {
        const result = await db.prepare(`
          SELECT runtime_id, user_id, status, current_stage, schema_version,
                 state, created_at, updated_at
          FROM runtimes
          ${where}
          ORDER BY updated_at DESC
          LIMIT ${limitParameter} OFFSET ${offsetParameter}
        `).bind(...values).all();
        return (result?.results || []).map(runtimeFromRow);
      } catch {
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.DRIVER_FAILURE,
          'D1 persistence operation failed: list',
          { operation: 'list' }
        );
      }
    },

    async appendEvent(input) {
      const event = normalizeRuntimeEvent(input, {
        now: clock(),
        createId
      });
      await run(
        db.prepare(`
          INSERT INTO runtime_events (
            event_id, runtime_id, event_type, payload, event_version,
            created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        `).bind(
          event.event_id,
          event.runtime_id,
          event.event_type,
          JSON.stringify(event.payload),
          event.event_version,
          event.created_at
        ),
        'appendEvent'
      );
      return event;
    },

    async listEvents(runtimeId, input = {}) {
      const id = String(runtimeId || '').trim();
      const query = normalizeEventQuery(input);
      const clauses = ['runtime_id = ?1'];
      const values = [id];
      if (query.after) {
        values.push(query.after);
        clauses.push(`created_at > ?${values.length}`);
      }
      if (query.event_type) {
        values.push(query.event_type);
        clauses.push(`event_type = ?${values.length}`);
      }
      values.push(query.limit);
      const limitParameter = `?${values.length}`;

      try {
        const result = await db.prepare(`
          SELECT event_id, runtime_id, event_type, payload, event_version,
                 created_at
          FROM runtime_events
          WHERE ${clauses.join(' AND ')}
          ORDER BY created_at ASC, event_id ASC
          LIMIT ${limitParameter}
        `).bind(...values).all();
        return (result?.results || []).map(eventFromRow);
      } catch {
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.DRIVER_FAILURE,
          'D1 persistence operation failed: listEvents',
          { operation: 'listEvents' }
        );
      }
    },

    async saveSnapshot(input) {
      const snapshot = normalizeRuntimeSnapshot(input, {
        now: clock(),
        createId
      });
      await run(
        db.prepare(`
          INSERT INTO runtime_snapshots (
            snapshot_id, runtime_id, stage, state, schema_version, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        `).bind(
          snapshot.snapshot_id,
          snapshot.runtime_id,
          snapshot.stage,
          JSON.stringify(snapshot.state),
          snapshot.schema_version,
          snapshot.created_at
        ),
        'saveSnapshot'
      );
      return snapshot;
    },

    async loadSnapshot(runtimeId, input = {}) {
      const id = String(runtimeId || '').trim();
      const snapshotId = String(input.snapshot_id || '').trim();
      const sql = snapshotId
        ? `SELECT snapshot_id, runtime_id, stage, state, schema_version,
                  created_at
           FROM runtime_snapshots
           WHERE runtime_id = ?1 AND snapshot_id = ?2
           LIMIT 1`
        : `SELECT snapshot_id, runtime_id, stage, state, schema_version,
                  created_at
           FROM runtime_snapshots
           WHERE runtime_id = ?1
           ORDER BY created_at DESC
           LIMIT 1`;
      try {
        const statement = db.prepare(sql);
        const row = snapshotId
          ? await statement.bind(id, snapshotId).first()
          : await statement.bind(id).first();
        return snapshotFromRow(row);
      } catch (error) {
        if (error instanceof PersistenceContractError) throw error;
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.DRIVER_FAILURE,
          'D1 persistence operation failed: loadSnapshot',
          { operation: 'loadSnapshot' }
        );
      }
    }
  };

  return Object.freeze(driver);
}

export default createD1Driver;
