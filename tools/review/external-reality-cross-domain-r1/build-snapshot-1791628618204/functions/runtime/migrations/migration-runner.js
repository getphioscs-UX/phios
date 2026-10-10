import {
  planPendingMigrations,
  validateMigrationSequence
} from './migration-validation.js';

export const MIGRATION_HISTORY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS runtime_migration_history (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  schema_id TEXT,
  applied_at TEXT NOT NULL,
  execution_ms INTEGER NOT NULL DEFAULT 0,
  CHECK (version > 0),
  CHECK (length(trim(name)) > 0),
  CHECK (length(trim(file_name)) > 0),
  CHECK (length(checksum) = 64),
  CHECK (execution_ms >= 0)
);`;

function normalizeRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.results)) return result.results;
  return [];
}

export function normalizeMigrationText(value) {
  const source = String(value)
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
  let canonical = '';
  let quote = null;
  let pendingSpace = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n') {
        lineComment = false;
        pendingSpace = true;
      }
      continue;
    }

    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        pendingSpace = true;
        index += 1;
      }
      continue;
    }

    if (quote) {
      canonical += character;
      if (character === quote) {
        if (next === quote) {
          canonical += next;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (character === '-' && next === '-') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      if (pendingSpace && canonical) canonical += ' ';
      pendingSpace = false;
      quote = character;
      canonical += character;
      continue;
    }
    if (/\s/.test(character)) {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace && canonical) canonical += ' ';
    pendingSpace = false;
    canonical += character;
  }

  if (quote) throw new Error('Migration SQL contains an unterminated quote.');
  if (blockComment) {
    throw new Error('Migration SQL contains an unterminated block comment.');
  }
  return canonical.trim();
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(normalizeMigrationText(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function splitSqlStatements(sql) {
  const source = String(sql).replace(/^\s*--.*$/gm, '');
  const statements = [];
  let current = '';
  let quote = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (quote) {
      current += character;
      if (character === quote) {
        if (next === quote) {
          current += next;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      current += character;
      continue;
    }

    if (character === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  if (quote) throw new Error('Migration SQL contains an unterminated quote.');
  if (current.trim()) statements.push(current.trim());

  return statements.filter(statement =>
    !/^PRAGMA\s+foreign_keys\s*=\s*ON$/i.test(statement)
  );
}

export async function loadMigrationHistory(db) {
  await db.exec(MIGRATION_HISTORY_TABLE_SQL);
  const result = await db.prepare(`
    SELECT version, name, file_name, checksum, schema_id, applied_at,
      execution_ms
    FROM runtime_migration_history
    ORDER BY version ASC
  `).all();
  return normalizeRows(result);
}

export async function verifyMigrationChecksums(migrations) {
  validateMigrationSequence(migrations);
  for (const migration of migrations) {
    const actual = await sha256Hex(migration.sql);
    if (actual !== migration.checksum) {
      throw new Error(
        `Migration checksum mismatch: ${migration.file}; ` +
        `expected ${migration.checksum}, received ${actual}.`
      );
    }
  }
  return true;
}

export async function applyRuntimeMigrations({
  db,
  migrations,
  now = () => new Date().toISOString()
}) {
  if (!db?.prepare || !db?.batch || !db?.exec) {
    throw new Error('A D1-compatible database binding is required.');
  }

  await verifyMigrationChecksums(migrations);
  const history = await loadMigrationHistory(db);
  const pending = planPendingMigrations(migrations, history);
  const applied = [];

  for (const migration of pending) {
    const statements = splitSqlStatements(migration.sql)
      .map(sql => db.prepare(sql));
    if (statements.length === 0) {
      throw new Error(`Migration contains no executable SQL: ${migration.file}`);
    }

    const historyStatement = db.prepare(`
      INSERT INTO runtime_migration_history (
        version, name, file_name, checksum, schema_id, applied_at, execution_ms
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)
    `).bind(
      migration.version,
      migration.name,
      migration.file,
      migration.checksum,
      migration.schema_id,
      now()
    );

    await db.batch([...statements, historyStatement]);
    applied.push({
      version: migration.version,
      name: migration.name,
      file: migration.file
    });
  }

  return {
    applied,
    pending: migrations.length - history.length - applied.length,
    status: applied.length ? 'migrated' : 'up_to_date'
  };
}
