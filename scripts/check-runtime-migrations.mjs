import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
  applyRuntimeMigrations,
  loadMigrationHistory,
  verifyMigrationChecksums
} from '../functions/runtime/migrations/migration-runner.js';
import {
  planPendingMigrations,
  validateMigrationSequence
} from '../functions/runtime/migrations/migration-validation.js';
import {
  createSqliteD1Adapter,
  hydrateRuntimeMigrations,
  loadRuntimeMigrations
} from './runtime-migration-loader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const { registry, migrations } = loadRuntimeMigrations(root);

assert.equal(registry.registry_id, 'phi-os.runtime-migrations.v1');
assert.equal(registry.status, 'active');
assert.equal(registry.history_table, 'runtime_migration_history');
assert.equal(registry.rules.immutable_after_deployment, true);
assert.equal(registry.rules.schema_mismatch_forbidden, true);
assert.equal(migrations.length, 3);
assert.equal(migrations[0].file, 'db/migrations/0001_platform_foundation.sql');
assert.equal(migrations[1].file, 'db/migrations/0002_initial_runtime.sql');
assert.equal(
  migrations[2].file,
  'db/migrations/0003_financial_professional_infrastructure.sql'
);
assert.equal(migrations.every(migration => migration.immutable), true);

validateMigrationSequence(migrations);
await verifyMigrationChecksums(migrations);
await verifyMigrationChecksums(
  migrations.map(migration => ({
    ...migration,
    sql: migration.sql.replace(/\n/g, '\r\n')
  }))
);
await verifyMigrationChecksums(
  migrations.map(migration => ({
    ...migration,
    sql: `\uFEFF${migration.sql
      .split('\n')
      .map(line => `${line}   `)
      .join('\r\n')}\r\n\r\n`
  }))
);

assert.throws(
  () => validateMigrationSequence([migrations[0], { ...migrations[1], version: 1 }]),
  /Duplicate migration version/
);
assert.throws(
  () => validateMigrationSequence([migrations[0], { ...migrations[1], version: 3,
    file: 'db\/migrations\/0003_initial_runtime.sql' }]),
  /Migration order is invalid/
);
assert.throws(
  () => validateMigrationSequence([migrations[1]]),
  /Migration order is invalid/
);
assert.throws(
  () => hydrateRuntimeMigrations(root, {
    migrations: [{ ...registry.migrations[0], file: 'db/migrations/0009_missing.sql' }]
  }),
  /Missing migration file/
);

const migrationFiles = fs.readdirSync(path.join(root, 'db/migrations'))
  .filter(file => /^\d{4}_.+\.sql$/.test(file))
  .sort();
assert.deepEqual(migrationFiles, [
  '0001_platform_foundation.sql',
  '0002_initial_runtime.sql',
  '0003_financial_professional_infrastructure.sql'
]);

const migratedDatabase = new DatabaseSync(':memory:');
migratedDatabase.exec('PRAGMA foreign_keys = ON;');
const migratedAdapter = createSqliteD1Adapter(migratedDatabase);
const firstRun = await applyRuntimeMigrations({
  db: migratedAdapter,
  migrations,
  now: () => '2026-07-23T00:00:00.000Z'
});
assert.equal(firstRun.status, 'migrated');
assert.deepEqual(firstRun.applied.map(item => item.version), [1, 2, 3]);

const history = await loadMigrationHistory(migratedAdapter);
assert.equal(history.length, 3);
assert.deepEqual(history.map(row => Number(row.version)), [1, 2, 3]);
assert.deepEqual(history.map(row => row.checksum), migrations.map(item => item.checksum));
assert.equal(planPendingMigrations(migrations, history).length, 0);

const secondRun = await applyRuntimeMigrations({ db: migratedAdapter, migrations });
assert.equal(secondRun.status, 'up_to_date');
assert.equal(secondRun.applied.length, 0);

await assert.rejects(
  () => verifyMigrationChecksums([
    migrations[0],
    {
      ...migrations[1],
      sql: migrations[1].sql.replace(
        'CREATE TABLE IF NOT EXISTS runtime_users',
        'CREATE TABLE IF NOT EXISTS runtime_users_changed'
      )
    }
  ]),
  /Migration checksum mismatch/
);
await assert.rejects(
  () => applyRuntimeMigrations({
    db: migratedAdapter,
    migrations: [
      { ...migrations[0], checksum: '0'.repeat(64) },
      migrations[1]
    ]
  }),
  /Migration checksum mismatch/
);

const canonicalDatabase = new DatabaseSync(':memory:');
canonicalDatabase.exec('PRAGMA foreign_keys = ON;');
canonicalDatabase.exec(read('db/migrations/0001_platform_foundation.sql'));
canonicalDatabase.exec(read('db/schema/runtime-schema-v1.sql'));

const runtimeTables = [
  'runtime_users',
  'runtimes',
  'runtime_events',
  'runtime_snapshots',
  'runtime_revisions',
  'runtime_lineages',
  'runtime_artifacts'
];
const normalizeSql = sql => String(sql || '')
  .replace(/IF NOT EXISTS/gi, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();
const schemaSql = (database, type, name) => database.prepare(`
  SELECT sql FROM sqlite_schema WHERE type = ?1 AND name = ?2
`).get(type, name)?.sql;

for (const table of runtimeTables) {
  assert.equal(
    normalizeSql(schemaSql(migratedDatabase, 'table', table)),
    normalizeSql(schemaSql(canonicalDatabase, 'table', table)),
    `Schema mismatch for table: ${table}`
  );
}

const canonicalIndexes = canonicalDatabase.prepare(`
  SELECT name FROM sqlite_schema
  WHERE type = 'index' AND name LIKE 'idx_runtime%' AND sql IS NOT NULL
  ORDER BY name
`).all().map(row => row.name);
for (const index of canonicalIndexes) {
  assert.equal(
    normalizeSql(schemaSql(migratedDatabase, 'index', index)),
    normalizeSql(schemaSql(canonicalDatabase, 'index', index)),
    `Schema mismatch for index: ${index}`
  );
}

const historyColumns = migratedDatabase
  .prepare('PRAGMA table_info(runtime_migration_history)')
  .all().map(row => row.name);
assert.deepEqual(historyColumns, [
  'version',
  'name',
  'file_name',
  'checksum',
  'schema_id',
  'applied_at',
  'execution_ms'
]);

const d1Manifest = JSON.parse(read('content/registry/runtime-d1-schema.json'));
assert.equal(d1Manifest.migration_target, migrations[1].file);
assert.equal(d1Manifest.previous_migration, migrations[0].file);
const financialManifest = JSON.parse(
  read('content/registry/financial-schema-registry.json')
);
assert.equal(financialManifest.migration, migrations[2].file);
assert.equal(financialManifest.schemaId, migrations[2].schema_id);

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts.check.includes('check-runtime-migrations.mjs'));
assert.equal(
  packageJson.scripts['check:runtime-migrations'],
  'node --no-warnings scripts/check-runtime-migrations.mjs'
);
assert.equal(
  packageJson.scripts['migrate:check'],
  'node --no-warnings scripts/run-runtime-migrations.mjs --check'
);

canonicalDatabase.close();
migratedDatabase.close();

console.log(
  '✓ M2-W4 immutable migrations, history, checksums, ordering, runner, ' +
  'and schema drift checks passed.'
);
