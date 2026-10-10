-- Governed private semantic/publication cache. Claims are never automatically
-- stolen or retried: a failed/abandoned paid attempt needs explicit reconciliation.
CREATE TABLE IF NOT EXISTS method_delivery_cache (
 owner_account_id TEXT NOT NULL,
 cache_kind TEXT NOT NULL CHECK(cache_kind IN ('SEMANTIC','PUBLICATION')),
 cache_key TEXT NOT NULL,
 claim_id TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('CLAIMED','READY','FAILED')),
 object_key TEXT,
 payload_digest TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(owner_account_id,cache_kind,cache_key)
);
