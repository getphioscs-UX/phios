-- Proposal only: persisted checkpoint/cache state, never a second money ledger.
CREATE TABLE IF NOT EXISTS report_generation_state (
 namespace TEXT NOT NULL,
 state_key TEXT NOT NULL,
 value_json TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(namespace,state_key)
);
CREATE TABLE IF NOT EXISTS report_generation_locks (
 namespace TEXT PRIMARY KEY,
 lock_token TEXT NOT NULL,
 acquired_at TEXT NOT NULL
);
-- Locks never expire automatically: a crashed provider attempt needs usage
-- reconciliation before an operator may release its lock. No blind retry.
