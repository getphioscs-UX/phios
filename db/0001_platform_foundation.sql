PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'explorer',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runtime_entities (
  runtime_entity_id TEXT PRIMARY KEY,
  owner_user_id TEXT,
  entity_type TEXT NOT NULL DEFAULT 'personal',
  status TEXT NOT NULL DEFAULT 'active',
  canonical_version INTEGER NOT NULL DEFAULT 1,
  consent_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS runtime_entries (
  runtime_entry_id TEXT PRIMARY KEY,
  runtime_entity_id TEXT NOT NULL,
  schema_version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL,
  entry_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(runtime_entity_id) REFERENCES runtime_entities(runtime_entity_id)
);

CREATE TABLE IF NOT EXISTS reality_readings (
  reading_id TEXT PRIMARY KEY,
  runtime_entity_id TEXT NOT NULL,
  reading_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  reading_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(runtime_entity_id) REFERENCES runtime_entities(runtime_entity_id)
);

CREATE TABLE IF NOT EXISTS runtime_reviews (
  review_id TEXT PRIMARY KEY,
  runtime_entity_id TEXT NOT NULL,
  reading_id TEXT,
  review_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(runtime_entity_id) REFERENCES runtime_entities(runtime_entity_id),
  FOREIGN KEY(reading_id) REFERENCES reality_readings(reading_id)
);

CREATE INDEX IF NOT EXISTS idx_entries_runtime ON runtime_entries(runtime_entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_readings_runtime ON reality_readings(runtime_entity_id, reading_version);
CREATE INDEX IF NOT EXISTS idx_reviews_runtime ON runtime_reviews(runtime_entity_id, created_at);
