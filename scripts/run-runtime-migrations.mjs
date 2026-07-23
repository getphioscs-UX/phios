import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
  applyRuntimeMigrations,
  verifyMigrationChecksums
} from '../functions/runtime/migrations/migration-runner.js';
import {
  createSqliteD1Adapter,
  loadRuntimeMigrations
} from './runtime-migration-loader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { migrations } = loadRuntimeMigrations(root);
const [command = '--check', databasePath] = process.argv.slice(2);

if (command === '--check') {
  await verifyMigrationChecksums(migrations);
  console.log(
    `✓ ${migrations.length} Runtime migrations are ordered, present, and checksum-valid.`
  );
  process.exit(0);
}

if (command !== '--apply-local') {
  throw new Error(
    'Usage: node scripts/run-runtime-migrations.mjs ' +
    '[--check | --apply-local <sqlite-file>]'
  );
}
if (!databasePath) {
  throw new Error('--apply-local requires an explicit SQLite file path.');
}

const resolvedPath = path.resolve(process.cwd(), databasePath);
const database = new DatabaseSync(resolvedPath);
database.exec('PRAGMA foreign_keys = ON;');

try {
  const result = await applyRuntimeMigrations({
    db: createSqliteD1Adapter(database),
    migrations
  });
  console.log(
    result.applied.length
      ? `✓ Applied ${result.applied.length} migration(s) to ${resolvedPath}.`
      : `✓ ${resolvedPath} is already up to date.`
  );
} finally {
  database.close();
}

