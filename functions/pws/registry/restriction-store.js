import {
  REGISTRY_STATUSES, enumValue, jsonObject, parseJson, requiredText
} from './universal-registry-schema.js';
import { all, assertDb, defaultClock, defaultId, id } from './store-helpers.js';

export function createRestrictionStore(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async create(input) {
      const record = {
        restriction_id: requiredText(
          input.restriction_id || createId('rst'), 'restriction_id'
        ),
        object_id: id(input.object_id),
        restriction_type: requiredText(input.restriction_type, 'restriction_type'),
        effect: enumValue(input.effect, ['deny', 'require', 'limit'], 'effect'),
        scope: jsonObject(input.scope, 'scope'),
        reason: requiredText(input.reason, 'reason'),
        status: enumValue(
          input.status || 'active', REGISTRY_STATUSES.restriction, 'status'
        ),
        valid_from: requiredText(input.valid_from || clock(), 'valid_from'),
        valid_to: input.valid_to || null,
        created_by: requiredText(input.created_by, 'created_by'),
        created_at: requiredText(input.created_at || clock(), 'created_at')
      };
      await db.prepare(`
        INSERT INTO pws_registry_restrictions VALUES
        (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
      `).bind(
        record.restriction_id, record.object_id, record.restriction_type,
        record.effect, JSON.stringify(record.scope), record.reason, record.status,
        record.valid_from, record.valid_to, record.created_by, record.created_at
      ).run();
      return record;
    },
    async list(objectId, activeOnly = false) {
      const rows = await all(db.prepare(`
        SELECT * FROM pws_registry_restrictions
        WHERE object_id = ?1 ${activeOnly ? "AND status = 'active'" : ''}
        ORDER BY created_at DESC
      `).bind(id(objectId)));
      return rows.map(row => ({ ...row, scope: parseJson(row.scope_json, 'scope') }));
    }
  };
}
