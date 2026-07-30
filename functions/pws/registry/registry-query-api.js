import { parseJson, requiredText } from './universal-registry-schema.js';
import { all, assertDb, boundedLimit } from './store-helpers.js';

function objectFromRow(row) {
  return row && { ...row, metadata: parseJson(row.metadata_json, 'metadata') };
}

export function createRegistryQueryApi(options = {}) {
  const db = assertDb(options.db);
  const getObject = async objectId => objectFromRow(await db.prepare(`
    SELECT * FROM pws_registry_objects WHERE object_id = ?1 LIMIT 1
  `).bind(requiredText(objectId, 'object_id')).first());
  return Object.freeze({
    getObject,
    async findObjects(input = {}) {
      const values = [];
      const clauses = [];
      for (const [column, value] of [
        ['object_type', input.object_type], ['status', input.status],
        ['owner_module', input.owner_module]
      ]) {
        if (value) {
          values.push(String(value));
          clauses.push(`${column} = ?${values.length}`);
        }
      }
      values.push(boundedLimit(input.limit));
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const rows = await all(db.prepare(`
        SELECT * FROM pws_registry_objects ${where}
        ORDER BY canonical_name ASC LIMIT ?${values.length}
      `).bind(...values));
      return rows.map(objectFromRow);
    },
    async getObjectView(objectId) {
      const id = requiredText(objectId, 'object_id');
      const object = await getObject(id);
      if (!object) return null;
      const [versions, relationships, restrictions] = await Promise.all([
        all(db.prepare(`SELECT * FROM pws_registry_versions
          WHERE object_id = ?1 ORDER BY version_number DESC`).bind(id)),
        all(db.prepare(`SELECT * FROM pws_registry_relationships
          WHERE source_object_id = ?1 OR target_object_id = ?1
          ORDER BY created_at DESC`).bind(id)),
        all(db.prepare(`SELECT * FROM pws_registry_restrictions
          WHERE object_id = ?1 AND status = 'active'
          ORDER BY created_at DESC`).bind(id))
      ]);
      return { object, versions, relationships, restrictions };
    }
  });
}
