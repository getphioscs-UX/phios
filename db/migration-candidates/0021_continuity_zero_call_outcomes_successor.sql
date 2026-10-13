-- Versioned successor candidate; preserves original candidate and P9 migration 0018.
-- LOCAL CANDIDATE ONLY; never executed against production.
-- Same continuity owner. Non-billable retrieval outcomes have no positive
-- credit reservation, allocation, provider receipt or separate wallet.
CREATE TABLE IF NOT EXISTS continuity_ask_zero_call_outcomes (
 task_id TEXT PRIMARY KEY,
 owner_account_id TEXT NOT NULL,
 request_digest TEXT NOT NULL,
 context_digest TEXT NOT NULL,
 answer_completeness TEXT NOT NULL CHECK(answer_completeness='SOURCE_INSUFFICIENT'),
 reason_code TEXT NOT NULL CHECK(reason_code='NO_ADMITTED_RELEVANT_SOURCE'),
 answer_json TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS continuity_zero_owner ON continuity_ask_zero_call_outcomes(owner_account_id,created_at);
