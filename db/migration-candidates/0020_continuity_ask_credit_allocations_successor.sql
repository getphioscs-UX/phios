-- Versioned successor candidate; preserves original candidate and P9 migration 0018.
-- LOCAL CANDIDATE ONLY. Not in db/migrations; no production migration authorized.
-- Quota grants remain continuity_quota_units. These are task allocations, not a wallet.
CREATE TABLE IF NOT EXISTS continuity_ask_tasks (
 task_id TEXT PRIMARY KEY,
 owner_account_id TEXT NOT NULL,
 request_digest TEXT NOT NULL,
 context_digest TEXT NOT NULL,
 reservation_token TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('KNOWLEDGE','NAVIGATION')),
 depth TEXT NOT NULL CHECK(depth IN ('ORDINARY','DEEP','RESEARCH')),
 reserved_micro_usd INTEGER NOT NULL CHECK(reserved_micro_usd>0),
 customer_charge_micro_usd INTEGER CHECK(customer_charge_micro_usd>=0 AND customer_charge_micro_usd<=reserved_micro_usd),
 state TEXT NOT NULL CHECK(state IN ('RESERVED','RUNNING','COMPLETE','FAILED','RECONCILIATION')),
 answer_json TEXT,
 created_at TEXT NOT NULL,
 completed_at TEXT
);
CREATE INDEX IF NOT EXISTS continuity_ask_owner ON continuity_ask_tasks(owner_account_id,created_at);
CREATE TABLE IF NOT EXISTS continuity_ask_allocations (
 task_id TEXT NOT NULL REFERENCES continuity_ask_tasks(task_id),
 quota_unit_id TEXT NOT NULL REFERENCES continuity_quota_units(quota_unit_id),
 reserved_micro_usd INTEGER NOT NULL CHECK(reserved_micro_usd>0),
 charged_micro_usd INTEGER CHECK(charged_micro_usd>=0 AND charged_micro_usd<=reserved_micro_usd),
 PRIMARY KEY(task_id,quota_unit_id)
);
