-- Candidate migration only. No production application authorized.
CREATE TABLE IF NOT EXISTS account_report_followup_grants (
 report_id TEXT PRIMARY KEY,
 owner_account_id TEXT NOT NULL,
 purchase_id TEXT NOT NULL,
 product_id TEXT NOT NULL,
 snapshot_id TEXT NOT NULL,
 material_digest TEXT NOT NULL,
 included_questions INTEGER NOT NULL CHECK(included_questions=4),
 granted_at TEXT NOT NULL,
 UNIQUE(owner_account_id,purchase_id,product_id)
);
CREATE TABLE IF NOT EXISTS account_report_followup_questions (
 request_id TEXT PRIMARY KEY,
 owner_account_id TEXT NOT NULL,
 report_id TEXT NOT NULL,
 question_digest TEXT NOT NULL,
 question_object_key TEXT NOT NULL,
 answer_object_key TEXT,
 answer_digest TEXT,
 consent_version TEXT NOT NULL,
 source_class TEXT NOT NULL CHECK(source_class='PURCHASED_REPORT_CONTEXT'),
 source_version TEXT NOT NULL,
 history_state TEXT NOT NULL CHECK(history_state IN ('RESERVED','COMPLETE','FAILED')),
 included_slot INTEGER CHECK(included_slot BETWEEN 1 AND 4),
 access_basis TEXT NOT NULL CHECK(access_basis IN ('INCLUDED_REPORT_QUESTION','PHIOS_MEMBERSHIP')),
 created_at TEXT NOT NULL,
 completed_at TEXT,
 FOREIGN KEY(report_id) REFERENCES account_report_followup_grants(report_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS account_report_followup_slot
 ON account_report_followup_questions(report_id,included_slot) WHERE history_state IN ('RESERVED','COMPLETE');
CREATE INDEX IF NOT EXISTS account_report_followup_owner_history
 ON account_report_followup_questions(owner_account_id,report_id,created_at);
