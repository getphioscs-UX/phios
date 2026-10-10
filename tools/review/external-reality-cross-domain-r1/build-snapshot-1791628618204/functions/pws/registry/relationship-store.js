import {
  REGISTRY_STATUSES, enumValue, jsonObject, parseJson, requiredText
} from './universal-registry-schema.js';
import { all, assertDb, defaultClock, defaultId, id } from './store-helpers.js';

export function createRelationshipStore(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async create(input) {
      const record = {
        relationship_id: requiredText(
          input.relationship_id || createId('rel'), 'relationship_id'
        ),
        source_object_id: id(input.source_object_id, 'source_object_id'),
        target_object_id: id(input.target_object_id, 'target_object_id'),
        relationship_type: requiredText(input.relationship_type, 'relationship_type'),
        status: enumValue(
          input.status || 'active', REGISTRY_STATUSES.relationship, 'status'
        ),
        attributes: jsonObject(input.attributes, 'attributes'),
        valid_from: requiredText(input.valid_from || clock(), 'valid_from'),
        valid_to: input.valid_to || null,
        created_by: requiredText(input.created_by, 'created_by'),
        created_at: requiredText(input.created_at || clock(), 'created_at')
      };
      await db.prepare(`
        INSERT INTO pws_registry_relationships VALUES
        (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
      `).bind(
        record.relationship_id, record.source_object_id, record.target_object_id,
        record.relationship_type, record.status, JSON.stringify(record.attributes),
        record.valid_from, record.valid_to, record.created_by, record.created_at
      ).run();
      return record;
    },
    async listForObject(objectId) {
      const object_id = id(objectId);
      const rows = await all(db.prepare(`
        SELECT * FROM pws_registry_relationships
        WHERE source_object_id = ?1 OR target_object_id = ?1
        ORDER BY created_at DESC
      `).bind(object_id));
      return rows.map(row => ({
        ...row, attributes: parseJson(row.attributes_json, 'attributes')
      }));
    }
  };
}
