/**
 * M2-W1 migration declarations.
 *
 * These are readable baselines, not executable SQL migrations. M2-W4 adds
 * ordered executable records without changing these baseline declarations.
 */
import { RUNTIME_SCHEMAS } from './schema-registry.js';

export const RUNTIME_MIGRATIONS = Object.freeze(
  RUNTIME_SCHEMAS.map(schema => Object.freeze({
    id: `baseline:${schema.id}`,
    schemaId: schema.id,
    from: null,
    to: schema.current,
    version: 0,
    kind: 'baseline-declaration',
    status: 'registered',
    executable: false,
    migrationFile: null
  }))
);

const byId = new Map(
  RUNTIME_MIGRATIONS.map(migration => [migration.id, migration])
);
const bySchema = new Map(
  RUNTIME_MIGRATIONS.map(migration => [migration.schemaId, migration])
);

export function getRuntimeMigration(id) {
  return byId.get(id) || null;
}

export function getRuntimeMigrationForSchema(schemaId) {
  return bySchema.get(schemaId) || null;
}

export function hasRuntimeMigration(id) {
  return byId.has(id);
}

export default RUNTIME_MIGRATIONS;
