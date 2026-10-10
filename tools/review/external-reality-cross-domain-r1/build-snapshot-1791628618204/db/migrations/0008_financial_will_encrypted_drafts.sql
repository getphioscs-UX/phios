PRAGMA foreign_keys = ON;

-- Account continuity storage only. Drafts are not FDR facts or released reports.
CREATE TABLE IF NOT EXISTS account_financial_will_drafts (
  draft_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  draft_type TEXT NOT NULL CHECK(draft_type IN ('FINANCIAL','WILL')),
  schema_version TEXT NOT NULL,
  object_version INTEGER NOT NULL CHECK(object_version > 0),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  key_version TEXT NOT NULL,
  digest TEXT NOT NULL,
  prior_digest TEXT,
  retention_id TEXT NOT NULL,
  consent_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  legal_hold_reference TEXT,
  PRIMARY KEY(draft_id, user_id, object_version)
);
CREATE INDEX IF NOT EXISTS account_fw_drafts_owner ON account_financial_will_drafts(user_id,draft_type,expires_at);
CREATE TABLE IF NOT EXISTS account_fw_rights_audit (
  request_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  draft_id TEXT NOT NULL,
  right_code TEXT NOT NULL,
  state TEXT NOT NULL,
  decision_reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
