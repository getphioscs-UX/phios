-- PHI OS M2-W3 canonical Runtime D1 schema.
-- This file defines the target structure; it is not an executable migration.
-- M2-W4 must add a new numbered migration without editing 0001_platform_foundation.sql.

CREATE TABLE IF NOT EXISTS runtime_users (
  user_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(user_id)) > 0),
  CHECK (length(trim(status)) > 0)
);

CREATE TABLE IF NOT EXISTS runtimes (
  runtime_id TEXT PRIMARY KEY,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_stage TEXT NOT NULL DEFAULT 'entry_collecting',
  schema_version TEXT NOT NULL DEFAULT 'phi-os.runtime-persistence.v1',
  state TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(runtime_id)) > 0),
  CHECK (length(trim(status)) > 0),
  CHECK (length(trim(current_stage)) > 0),
  CHECK (length(trim(schema_version)) > 0),
  CHECK (json_valid(state)),
  FOREIGN KEY (user_id)
    REFERENCES runtime_users(user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS runtime_events (
  event_id TEXT PRIMARY KEY,
  runtime_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  event_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TEXT NOT NULL,
  CHECK (length(trim(event_id)) > 0),
  CHECK (length(trim(runtime_id)) > 0),
  CHECK (length(trim(event_type)) > 0),
  CHECK (length(trim(event_version)) > 0),
  CHECK (json_valid(payload)),
  FOREIGN KEY (runtime_id)
    REFERENCES runtimes(runtime_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS runtime_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  runtime_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT '{}',
  schema_version TEXT NOT NULL DEFAULT 'phi-os.runtime-snapshot.v1',
  created_at TEXT NOT NULL,
  CHECK (length(trim(snapshot_id)) > 0),
  CHECK (length(trim(runtime_id)) > 0),
  CHECK (length(trim(stage)) > 0),
  CHECK (length(trim(schema_version)) > 0),
  CHECK (json_valid(state)),
  FOREIGN KEY (runtime_id)
    REFERENCES runtimes(runtime_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS runtime_revisions (
  revision_id TEXT PRIMARY KEY,
  runtime_id TEXT NOT NULL,
  parent_revision_id TEXT,
  reason TEXT NOT NULL,
  changes TEXT NOT NULL DEFAULT '{}',
  schema_version TEXT NOT NULL DEFAULT 'phi-os.runtime-revision.v1',
  created_at TEXT NOT NULL,
  CHECK (length(trim(revision_id)) > 0),
  CHECK (length(trim(runtime_id)) > 0),
  CHECK (length(trim(reason)) > 0),
  CHECK (length(trim(schema_version)) > 0),
  CHECK (json_valid(changes)),
  CHECK (parent_revision_id IS NULL OR parent_revision_id <> revision_id),
  FOREIGN KEY (runtime_id)
    REFERENCES runtimes(runtime_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (parent_revision_id)
    REFERENCES runtime_revisions(revision_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS runtime_lineages (
  lineage_id TEXT PRIMARY KEY,
  parent_runtime_id TEXT NOT NULL,
  child_runtime_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'branch',
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  CHECK (length(trim(lineage_id)) > 0),
  CHECK (length(trim(parent_runtime_id)) > 0),
  CHECK (length(trim(child_runtime_id)) > 0),
  CHECK (length(trim(relationship_type)) > 0),
  CHECK (parent_runtime_id <> child_runtime_id),
  CHECK (json_valid(metadata)),
  UNIQUE (parent_runtime_id, child_runtime_id, relationship_type),
  FOREIGN KEY (parent_runtime_id)
    REFERENCES runtimes(runtime_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (child_runtime_id)
    REFERENCES runtimes(runtime_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS runtime_artifacts (
  artifact_id TEXT PRIMARY KEY,
  runtime_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  stage TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  schema_version TEXT NOT NULL DEFAULT 'phi-os.runtime-artifact.v1',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(artifact_id)) > 0),
  CHECK (length(trim(runtime_id)) > 0),
  CHECK (length(trim(artifact_type)) > 0),
  CHECK (length(trim(stage)) > 0),
  CHECK (length(trim(schema_version)) > 0),
  CHECK (json_valid(payload)),
  FOREIGN KEY (runtime_id)
    REFERENCES runtimes(runtime_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_runtime_users_created_at
  ON runtime_users(created_at);

CREATE INDEX IF NOT EXISTS idx_runtimes_user_id_created_at
  ON runtimes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtimes_current_stage_updated_at
  ON runtimes(current_stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtimes_status_updated_at
  ON runtimes(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtimes_created_at
  ON runtimes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_runtime_events_runtime_id_created_at
  ON runtime_events(runtime_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_events_event_type_created_at
  ON runtime_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_runtime_snapshots_runtime_id_created_at
  ON runtime_snapshots(runtime_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_snapshots_stage_created_at
  ON runtime_snapshots(stage, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_runtime_revisions_runtime_id_created_at
  ON runtime_revisions(runtime_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_revisions_parent_revision_id
  ON runtime_revisions(parent_revision_id);

CREATE INDEX IF NOT EXISTS idx_runtime_lineages_parent_runtime_id
  ON runtime_lineages(parent_runtime_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_lineages_child_runtime_id
  ON runtime_lineages(child_runtime_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_runtime_artifacts_runtime_id_created_at
  ON runtime_artifacts(runtime_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_artifacts_type_created_at
  ON runtime_artifacts(artifact_type, created_at DESC);
