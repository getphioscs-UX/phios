import { createAuditStore } from './audit-store.js';
import { createEventOutbox } from './event-outbox.js';
import { createRegistryQueryApi } from './registry-query-api.js';
import { createRelationshipStore } from './relationship-store.js';
import { createRestrictionStore } from './restriction-store.js';
import { assertDb, defaultClock } from './store-helpers.js';
import { createVersionStore } from './version-store.js';
import {
  REGISTRY_STATUSES, enumValue, normalizeObject
} from './universal-registry-schema.js';

export function createUniversalRegistry(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const versionStore = createVersionStore({ ...options, db, clock });
  const relationshipStore = createRelationshipStore({ ...options, db, clock });
  const restrictionStore = createRestrictionStore({ ...options, db, clock });
  const auditStore = createAuditStore({ ...options, db, clock });
  const eventOutbox = createEventOutbox({ ...options, db, clock });
  const query = createRegistryQueryApi({ db });

  return Object.freeze({
    versionStore, relationshipStore, restrictionStore, auditStore, eventOutbox, query,
    async registerObject(input, context) {
      const record = normalizeObject(input, clock());
      await db.prepare(`
        INSERT INTO pws_registry_objects (
          object_id, object_code, object_type, canonical_name, owner_module,
          schema_version, status, metadata_json, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
      `).bind(
        record.object_id, record.object_code, record.object_type,
        record.canonical_name, record.owner_module, record.schema_version,
        record.status, JSON.stringify(record.metadata), record.created_at,
        record.updated_at
      ).run();
      await auditStore.append({
        object_id: record.object_id,
        operation: 'registry.object.registered',
        actor_id: context.actor_id,
        correlation_id: context.correlation_id,
        after: record
      });
      await eventOutbox.enqueue({
        aggregate_id: record.object_id,
        event_type: 'pws.registry.object.registered',
        payload: { object_id: record.object_id, object_code: record.object_code }
      });
      return record;
    },
    async updateStatus(objectId, status, context) {
      const before = await query.getObject(objectId);
      if (!before) return null;
      const now = clock();
      const canonicalStatus = enumValue(status, REGISTRY_STATUSES.object, 'status');
      await db.prepare(`
        UPDATE pws_registry_objects SET status = ?2, updated_at = ?3
        WHERE object_id = ?1
      `).bind(objectId, canonicalStatus, now).run();
      const after = {
        ...before, status: canonicalStatus, updated_at: now
      };
      await auditStore.append({
        object_id: objectId, operation: 'registry.object.status_changed',
        actor_id: context.actor_id, correlation_id: context.correlation_id,
        before, after
      });
      await eventOutbox.enqueue({
        aggregate_id: objectId,
        event_type: 'pws.registry.object.status_changed',
        payload: { object_id: objectId, status: canonicalStatus }
      });
      return after;
    }
  });
}
