-- SOURCE CANDIDATE ONLY: production execution requires explicit approval.
CREATE TABLE IF NOT EXISTS account_world_contexts (
 user_id TEXT NOT NULL, context_id TEXT NOT NULL, source_version TEXT NOT NULL,
 scope_json TEXT NOT NULL, source_json TEXT NOT NULL, href TEXT NOT NULL,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 PRIMARY KEY(user_id, context_id, source_version)
);
CREATE INDEX IF NOT EXISTS account_world_contexts_owner_expiry ON account_world_contexts(user_id, expires_at);
