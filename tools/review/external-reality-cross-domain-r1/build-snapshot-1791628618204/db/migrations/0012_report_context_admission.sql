-- Append-only private report-context lineage. No customer text in metadata.
CREATE TABLE IF NOT EXISTS report_context_records (
 record_id TEXT PRIMARY KEY, owner_account_id TEXT NOT NULL, person_id TEXT NOT NULL,
 record_kind TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, payload_digest TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS report_context_owner ON report_context_records(owner_account_id,record_id);
CREATE TABLE IF NOT EXISTS report_context_uses (
 brief_id TEXT PRIMARY KEY, owner_account_id TEXT NOT NULL, person_id TEXT NOT NULL,
 claimed_at TEXT NOT NULL
);
