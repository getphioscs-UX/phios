import { jsonObject, parseJson, requiredText } from './universal-registry-schema.js';
import {
  all, assertDb, boundedLimit, defaultClock, defaultId
} from './store-helpers.js';

export function createEventOutbox(options = {}) {
  const db = assertDb(options.db);
  const clock = options.clock || defaultClock;
  const createId = options.createId || defaultId;
  return {
    async enqueue(input) {
      const record = {
        event_id: requiredText(input.event_id || createId('evt'), 'event_id'),
        aggregate_id: requiredText(input.aggregate_id, 'aggregate_id'),
        event_type: requiredText(input.event_type, 'event_type'),
        event_version: Number(input.event_version || 1),
        payload: jsonObject(input.payload, 'payload'),
        occurred_at: requiredText(input.occurred_at || clock(), 'occurred_at')
      };
      await db.prepare(`
        INSERT INTO pws_registry_outbox (
          event_id, aggregate_id, event_type, event_version, payload_json, occurred_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      `).bind(
        record.event_id, record.aggregate_id, record.event_type,
        record.event_version, JSON.stringify(record.payload), record.occurred_at
      ).run();
      return record;
    },
    async pending(limit = 50) {
      const rows = await all(db.prepare(`
        SELECT * FROM pws_registry_outbox WHERE published_at IS NULL
        ORDER BY occurred_at ASC LIMIT ?1
      `).bind(boundedLimit(limit)));
      return rows.map(row => ({ ...row, payload: parseJson(row.payload_json, 'payload') }));
    },
    async markPublished(eventId, publishedAt = clock()) {
      await db.prepare(`
        UPDATE pws_registry_outbox SET published_at = ?2 WHERE event_id = ?1
      `).bind(requiredText(eventId, 'event_id'), publishedAt).run();
    },
    async markFailed(eventId, error) {
      await db.prepare(`
        UPDATE pws_registry_outbox
        SET attempts = attempts + 1, last_error = ?2 WHERE event_id = ?1
      `).bind(requiredText(eventId, 'event_id'), String(error)).run();
    }
  };
}
