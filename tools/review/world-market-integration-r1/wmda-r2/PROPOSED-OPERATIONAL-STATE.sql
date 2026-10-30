-- REVIEW ONLY. Not a production migration; never executed against D1.
-- Reuse the existing approved D1 owner only after schema/migration approval.
-- Store operational/source references, not a second financial authority.
CREATE TABLE wmda_operational_jobs (
 job_id TEXT PRIMARY KEY,
 source_id TEXT NOT NULL,
 instrument_id TEXT NOT NULL,
 context_key TEXT NOT NULL UNIQUE,
 job_state_json TEXT NOT NULL CHECK(json_valid(job_state_json)),
 source_evidence_ref TEXT,
 candidate_version_ref TEXT,
 lease_until INTEGER,
 updated_at TEXT NOT NULL
);
CREATE TABLE wmda_operational_receipts (
 receipt_id TEXT PRIMARY KEY,
 job_id TEXT NOT NULL,
 status TEXT NOT NULL,
 request_count INTEGER NOT NULL,
 cost_state TEXT NOT NULL,
 created_at TEXT NOT NULL
);
-- No financial facts, credentials, client holdings or personal context columns.
-- No trigger, Cron, deployment or production authorization is implied.
