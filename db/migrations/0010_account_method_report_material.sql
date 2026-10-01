-- Immutable rendered bytes accompany the existing controlled snapshot owner.
CREATE TABLE IF NOT EXISTS account_method_report_materials (
 report_id TEXT PRIMARY KEY,
 owner_account_id TEXT NOT NULL,
 person_id TEXT NOT NULL,
 method_code TEXT NOT NULL,
 locale TEXT NOT NULL,
 snapshot_id TEXT NOT NULL,
 object_key TEXT NOT NULL,
 output_digest TEXT NOT NULL,
 released_at TEXT NOT NULL,
 verifier_receipt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS account_method_report_library ON account_method_report_materials(owner_account_id, released_at);
