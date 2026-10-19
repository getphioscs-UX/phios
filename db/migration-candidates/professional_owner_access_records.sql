-- LOCAL CANDIDATE ONLY. No production migration number allocated.
-- Only existing professional identity/assignment/consent owners may admit records.
-- No customer HTTP endpoint may write this authority table.
CREATE TABLE IF NOT EXISTS professional_owner_access_records (
 access_id TEXT PRIMARY KEY,
 subject_account_id TEXT NOT NULL,
 payload_json TEXT NOT NULL,
 payload_digest TEXT NOT NULL,
 owner_receipt_ref TEXT NOT NULL,
 effective_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 revoked_at TEXT,
 test_only INTEGER NOT NULL DEFAULT 0 CHECK(test_only IN (0,1))
);
CREATE INDEX IF NOT EXISTS professional_owner_access_subject ON professional_owner_access_records(subject_account_id);
