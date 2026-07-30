-- PWS-I2-W1 Universal Registry Core
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pws_registry_objects (
  object_id TEXT PRIMARY KEY,
  object_code TEXT NOT NULL UNIQUE,
  object_type TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  owner_module TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(object_id)) > 0),
  CHECK (length(trim(object_code)) > 0),
  CHECK (length(trim(object_type)) > 0),
  CHECK (status IN ('draft', 'active', 'suspended', 'deprecated', 'archived')),
  CHECK (json_valid(metadata_json))
);

CREATE TABLE IF NOT EXISTS pws_registry_versions (
  version_id TEXT PRIMARY KEY,
  object_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  schema_version TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  checksum TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (object_id) REFERENCES pws_registry_objects(object_id),
  UNIQUE (object_id, version_number),
  CHECK (version_number > 0),
  CHECK (length(checksum) = 64),
  CHECK (status IN ('draft', 'active', 'superseded', 'withdrawn')),
  CHECK (json_valid(payload_json))
);

CREATE TABLE IF NOT EXISTS pws_registry_relationships (
  relationship_id TEXT PRIMARY KEY,
  source_object_id TEXT NOT NULL,
  target_object_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  attributes_json TEXT NOT NULL DEFAULT '{}',
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_object_id) REFERENCES pws_registry_objects(object_id),
  FOREIGN KEY (target_object_id) REFERENCES pws_registry_objects(object_id),
  UNIQUE (source_object_id, target_object_id, relationship_type, valid_from),
  CHECK (source_object_id <> target_object_id),
  CHECK (status IN ('active', 'inactive', 'revoked')),
  CHECK (json_valid(attributes_json))
);

CREATE TABLE IF NOT EXISTS pws_registry_restrictions (
  restriction_id TEXT PRIMARY KEY,
  object_id TEXT NOT NULL,
  restriction_type TEXT NOT NULL,
  effect TEXT NOT NULL,
  scope_json TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (object_id) REFERENCES pws_registry_objects(object_id),
  CHECK (effect IN ('deny', 'require', 'limit')),
  CHECK (status IN ('active', 'inactive', 'revoked', 'expired')),
  CHECK (json_valid(scope_json))
);

CREATE TABLE IF NOT EXISTS pws_registry_audit (
  audit_id TEXT PRIMARY KEY,
  object_id TEXT,
  operation TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (object_id) REFERENCES pws_registry_objects(object_id),
  CHECK (before_json IS NULL OR json_valid(before_json)),
  CHECK (after_json IS NULL OR json_valid(after_json))
);

CREATE TABLE IF NOT EXISTS pws_registry_outbox (
  event_id TEXT PRIMARY KEY,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  published_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  CHECK (event_version > 0),
  CHECK (attempts >= 0),
  CHECK (json_valid(payload_json))
);

CREATE INDEX IF NOT EXISTS idx_pws_registry_objects_type_status
  ON pws_registry_objects(object_type, status);
CREATE INDEX IF NOT EXISTS idx_pws_registry_versions_object
  ON pws_registry_versions(object_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_pws_registry_relationships_source
  ON pws_registry_relationships(source_object_id, relationship_type, status);
CREATE INDEX IF NOT EXISTS idx_pws_registry_relationships_target
  ON pws_registry_relationships(target_object_id, relationship_type, status);
CREATE INDEX IF NOT EXISTS idx_pws_registry_restrictions_object
  ON pws_registry_restrictions(object_id, status);
CREATE INDEX IF NOT EXISTS idx_pws_registry_audit_object
  ON pws_registry_audit(object_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pws_registry_outbox_pending
  ON pws_registry_outbox(published_at, occurred_at);
