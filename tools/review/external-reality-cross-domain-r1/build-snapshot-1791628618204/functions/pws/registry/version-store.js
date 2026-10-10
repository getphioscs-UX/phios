import {
  REGISTRY_STATUSES, enumValue, jsonObject, parseJson, requiredText
} from './universal-registry-schema.js';
import { all, assertDb, defaultClock, defaultId, id } from './store-helpers.js';

export function createVersionStore(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async append(input) {
      const objectId = id(input.object_id);
      const latest = await db.prepare(`
        SELECT COALESCE(MAX(version_number), 0) AS value
        FROM pws_registry_versions WHERE object_id = ?1
      `).bind(objectId).first();
      const record = {
        version_id: requiredText(input.version_id || createId('ver'), 'version_id'),
        object_id: objectId,
        version_number: Number(latest?.value || 0) + 1,
        schema_version: requiredText(input.schema_version || 'pws-v1', 'schema_version'),
        payload: jsonObject(input.payload, 'payload'),
        checksum: requiredText(input.checksum, 'checksum'),
        status: enumValue(input.status || 'active', REGISTRY_STATUSES.version, 'status'),
        created_by: requiredText(input.created_by, 'created_by'),
        created_at: requiredText(input.created_at || clock(), 'created_at')
      };
      if (!/^[a-f0-9]{64}$/.test(record.checksum)) {
        throw new TypeError('checksum must be a lowercase SHA-256 value.');
      }
      await db.prepare(`
        INSERT INTO pws_registry_versions (
          version_id, object_id, version_number, schema_version, payload_json,
          checksum, status, created_by, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
      `).bind(
        record.version_id, record.object_id, record.version_number,
        record.schema_version, JSON.stringify(record.payload), record.checksum,
        record.status, record.created_by, record.created_at
      ).run();
      return record;
    },
    async list(objectId) {
      const rows = await all(db.prepare(`
        SELECT * FROM pws_registry_versions
        WHERE object_id = ?1 ORDER BY version_number DESC
      `).bind(id(objectId)));
      return rows.map(row => ({ ...row, payload: parseJson(row.payload_json, 'payload') }));
    }
  };
}
