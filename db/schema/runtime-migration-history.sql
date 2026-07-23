-- PHI OS Migration Runner history table.
-- Cloudflare Wrangler also keeps its own d1_migrations table. This PHI OS
-- table pins file checksums and schema identities for application-level audit.

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
);

