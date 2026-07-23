import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const schemaPath = 'db/schema/runtime-schema-v1.sql';
const legacyMigrationPath = 'db/migrations/0001_platform_foundation.sql';
const schemaSql = read(schemaPath);
const legacyMigrationSql = read(legacyMigrationPath);
const manifest = JSON.parse(read('content/registry/runtime-d1-schema.json'));
const db = new DatabaseSync(':memory:');

db.exec('PRAGMA foreign_keys = ON;');
db.exec(legacyMigrationSql);
db.exec(schemaSql);

const requiredTables = [
  'runtime_users',
  'runtimes',
  'runtime_events',
  'runtime_snapshots',
  'runtime_revisions',
  'runtime_lineages',
  'runtime_artifacts'
];

const actualTables = new Set(
  db.prepare(`
    SELECT name FROM sqlite_schema
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all().map(row => row.name)
);
for (const table of requiredTables) {
  assert(actualTables.has(table), `Missing Runtime D1 table: ${table}`);
}

const requiredColumns = {
  runtime_users: ['user_id', 'status', 'created_at', 'updated_at'],
  runtimes: [
    'runtime_id', 'user_id', 'status', 'current_stage', 'schema_version',
    'state', 'created_at', 'updated_at'
  ],
  runtime_events: [
    'event_id', 'runtime_id', 'event_type', 'payload', 'event_version',
    'created_at'
  ],
  runtime_snapshots: [
    'snapshot_id', 'runtime_id', 'stage', 'state', 'schema_version',
    'created_at'
  ],
  runtime_revisions: [
    'revision_id', 'runtime_id', 'parent_revision_id', 'reason', 'changes',
    'schema_version', 'created_at'
  ],
  runtime_lineages: [
    'lineage_id', 'parent_runtime_id', 'child_runtime_id',
    'relationship_type', 'metadata', 'created_at'
  ],
  runtime_artifacts: [
    'artifact_id', 'runtime_id', 'artifact_type', 'stage', 'payload',
    'schema_version', 'created_at', 'updated_at'
  ]
};

for (const [table, expected] of Object.entries(requiredColumns)) {
  const columns = new Set(
    db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name)
  );
  for (const column of expected) {
    assert(columns.has(column), `Missing D1 column: ${table}.${column}`);
  }
}

const requiredIndexes = [
  'idx_runtime_users_created_at',
  'idx_runtimes_user_id_created_at',
  'idx_runtimes_current_stage_updated_at',
  'idx_runtimes_created_at',
  'idx_runtime_events_runtime_id_created_at',
  'idx_runtime_events_event_type_created_at',
  'idx_runtime_snapshots_runtime_id_created_at',
  'idx_runtime_revisions_runtime_id_created_at',
  'idx_runtime_revisions_parent_revision_id',
  'idx_runtime_lineages_parent_runtime_id',
  'idx_runtime_lineages_child_runtime_id',
  'idx_runtime_artifacts_runtime_id_created_at'
];
const indexRows = db.prepare(`
  SELECT name, sql FROM sqlite_schema
  WHERE type = 'index' AND sql IS NOT NULL
`).all();
const indexes = new Map(indexRows.map(row => [row.name, row.sql]));
for (const index of requiredIndexes) {
  assert(indexes.has(index), `Missing Runtime D1 index: ${index}`);
}

const indexSql = indexRows.map(row => row.sql).join('\n');
for (const field of manifest.required_query_fields) {
  assert(
    indexSql.includes(field),
    `Required query field is not indexed: ${field}`
  );
}

for (const table of [
  'runtime_events',
  'runtime_snapshots',
  'runtime_revisions',
  'runtime_artifacts'
]) {
  const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table})`).all();
  const runtimeKey = foreignKeys.find(key =>
    key.table === 'runtimes' && key.from === 'runtime_id'
  );
  assert(runtimeKey, `Missing Runtime foreign key: ${table}.runtime_id`);
  assert.equal(runtimeKey.on_delete, 'CASCADE');
}

const lineageForeignKeys = db.prepare(
  'PRAGMA foreign_key_list(runtime_lineages)'
).all();
assert.equal(
  lineageForeignKeys.filter(key => key.table === 'runtimes').length,
  2
);
assert(lineageForeignKeys.every(key => key.on_delete === 'CASCADE'));

db.prepare(`
  INSERT INTO runtime_users (user_id, status, created_at, updated_at)
  VALUES (?1, 'active', ?2, ?2)
`).run('user_a', '2026-07-23T00:00:00.000Z');

const insertRuntime = db.prepare(`
  INSERT INTO runtimes (
    runtime_id, user_id, status, current_stage, schema_version, state,
    created_at, updated_at
  ) VALUES (?1, 'user_a', 'active', ?2,
    'phi-os.runtime-persistence.v1', '{}', ?3, ?3)
`);
insertRuntime.run('runtime_parent', 'entry_complete', '2026-07-23T00:00:01.000Z');
insertRuntime.run('runtime_child', 'reading_ready', '2026-07-23T00:00:02.000Z');

db.prepare(`
  INSERT INTO runtime_events (
    event_id, runtime_id, event_type, payload, event_version, created_at
  ) VALUES ('event_a', 'runtime_parent', 'entry.completed', '{}', '1.0.0', ?1)
`).run('2026-07-23T00:00:03.000Z');
db.prepare(`
  INSERT INTO runtime_snapshots (
    snapshot_id, runtime_id, stage, state, schema_version, created_at
  ) VALUES ('snapshot_a', 'runtime_parent', 'entry_complete', '{}',
    'phi-os.runtime-snapshot.v1', ?1)
`).run('2026-07-23T00:00:04.000Z');
db.prepare(`
  INSERT INTO runtime_revisions (
    revision_id, runtime_id, parent_revision_id, reason, changes,
    schema_version, created_at
  ) VALUES ('revision_a', 'runtime_parent', NULL, 'initial', '{}',
    'phi-os.runtime-revision.v1', ?1)
`).run('2026-07-23T00:00:05.000Z');
db.prepare(`
  INSERT INTO runtime_revisions (
    revision_id, runtime_id, parent_revision_id, reason, changes,
    schema_version, created_at
  ) VALUES ('revision_b', 'runtime_parent', 'revision_a', 'edit', '{}',
    'phi-os.runtime-revision.v1', ?1)
`).run('2026-07-23T00:00:06.000Z');
db.prepare(`
  INSERT INTO runtime_lineages (
    lineage_id, parent_runtime_id, child_runtime_id, relationship_type,
    metadata, created_at
  ) VALUES ('lineage_a', 'runtime_parent', 'runtime_child', 'branch', '{}', ?1)
`).run('2026-07-23T00:00:07.000Z');
db.prepare(`
  INSERT INTO runtime_artifacts (
    artifact_id, runtime_id, artifact_type, stage, payload, schema_version,
    created_at, updated_at
  ) VALUES ('artifact_a', 'runtime_parent', 'reading', 'reading_ready', '{}',
    'phi-os.runtime-artifact.v1', ?1, ?1)
`).run('2026-07-23T00:00:08.000Z');

db.prepare('DELETE FROM runtime_revisions WHERE revision_id = ?1').run('revision_a');
assert.equal(
  db.prepare(`
    SELECT parent_revision_id FROM runtime_revisions WHERE revision_id = 'revision_b'
  `).get().parent_revision_id,
  null
);

assert.throws(() => db.prepare(`
  INSERT INTO runtime_events (
    event_id, runtime_id, event_type, payload, event_version, created_at
  ) VALUES ('event_bad_json', 'runtime_parent', 'reading.generated',
    'not-json', '1.0.0', '2026-07-23T00:00:09.000Z')
`).run(), /CHECK constraint failed/);

assert.throws(() => db.prepare(`
  INSERT INTO runtime_snapshots (
    snapshot_id, runtime_id, stage, state, schema_version, created_at
  ) VALUES ('snapshot_orphan', 'runtime_missing', 'reading_ready', '{}',
    'phi-os.runtime-snapshot.v1', '2026-07-23T00:00:10.000Z')
`).run(), /FOREIGN KEY constraint failed/);

db.prepare('DELETE FROM runtimes WHERE runtime_id = ?1').run('runtime_parent');
for (const [table, idField, id] of [
  ['runtime_events', 'event_id', 'event_a'],
  ['runtime_snapshots', 'snapshot_id', 'snapshot_a'],
  ['runtime_revisions', 'revision_id', 'revision_b'],
  ['runtime_artifacts', 'artifact_id', 'artifact_a'],
  ['runtime_lineages', 'lineage_id', 'lineage_a']
]) {
  assert.equal(
    db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${idField} = ?1`)
      .get(id).count,
    0,
    `Cascade cleanup failed: ${table}`
  );
}
assert.equal(
  db.prepare(`
    SELECT COUNT(*) AS count FROM runtimes WHERE runtime_id = 'runtime_child'
  `).get().count,
  1,
  'Deleting a parent Runtime must not delete the child Runtime.'
);

assert.equal(manifest.schema_id, 'phi-os.runtime-d1-schema.v1');
assert.equal(manifest.status, 'frozen_for_migration');
assert.equal(manifest.authority, schemaPath);
assert.equal(manifest.tables.length, 7);
assert.equal(manifest.migration_target, 'db/migrations/0002_initial_runtime.sql');
assert.equal(Object.hasOwn(manifest, '$schema'), false);

const migrationFiles = fs.readdirSync(path.join(root, 'db/migrations'))
  .filter(file => /^\d{4}_.+\.sql$/.test(file))
  .sort();
assert.equal(migrationFiles.filter(file => file.startsWith('0001_')).length, 1);
assert.equal(migrationFiles[0], '0001_platform_foundation.sql');
assert(!fs.existsSync(path.join(root, 'db/migrations/0001_initial_runtime.sql')));

const d1Driver = read('functions/runtime/persistence/drivers/d1-driver.js');
for (const table of ['runtimes', 'runtime_events', 'runtime_snapshots']) {
  assert(d1Driver.includes(table), `D1 Driver does not use table: ${table}`);
}
for (const column of requiredColumns.runtimes) {
  assert(d1Driver.includes(column), `D1 Driver is missing Runtime column: ${column}`);
}

db.close();

console.log(
  '✓ M2-W3 Runtime D1 tables, JSON constraints, foreign keys, cascades, ' +
  'Driver alignment, and indexes passed.'
);
