import { jsonObject, parseJson, requiredText } from './universal-registry-schema.js';
import { all, assertDb, defaultClock, defaultId } from './store-helpers.js';

export function createAuditStore(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async append(input) {
      const record = {
        audit_id: requiredText(input.audit_id || createId('aud'), 'audit_id'),
        object_id: input.object_id || null,
        operation: requiredText(input.operation, 'operation'),
        actor_id: requiredText(input.actor_id, 'actor_id'),
        correlation_id: requiredText(input.correlation_id, 'correlation_id'),
        before: input.before == null ? null : jsonObject(input.before, 'before'),
        after: input.after == null ? null : jsonObject(input.after, 'after'),
        occurred_at: requiredText(input.occurred_at || clock(), 'occurred_at')
      };
      await db.prepare(`
        INSERT INTO pws_registry_audit VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      `).bind(
        record.audit_id, record.object_id, record.operation, record.actor_id,
        record.correlation_id,
        record.before == null ? null : JSON.stringify(record.before),
        record.after == null ? null : JSON.stringify(record.after),
        record.occurred_at
      ).run();
      return record;
    },
    async list(objectId) {
      const rows = await all(db.prepare(`
        SELECT * FROM pws_registry_audit WHERE object_id = ?1
        ORDER BY occurred_at DESC
      `).bind(requiredText(objectId, 'object_id')));
      return rows.map(row => ({
        ...row,
        before: row.before_json == null ? null : parseJson(row.before_json, 'before'),
        after: row.after_json == null ? null : parseJson(row.after_json, 'after')
      }));
    }
  };
}
