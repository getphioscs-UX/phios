-- P8 local successor. Existing person, purchase, material and budget owners remain canonical.
CREATE TABLE paid_report_readiness (
 readiness_id TEXT PRIMARY KEY, owner_account_id TEXT NOT NULL, product_id TEXT NOT NULL,
 method_code TEXT NOT NULL, person_id TEXT NOT NULL, state TEXT NOT NULL,
 record_json TEXT NOT NULL, expires_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX paid_report_readiness_owner ON paid_report_readiness(owner_account_id,updated_at);
CREATE TABLE paid_report_jobs (
 job_id TEXT PRIMARY KEY, environment TEXT NOT NULL CHECK(environment IN ('QA','LIVE')),
 owner_account_id TEXT NOT NULL, purchase_id TEXT NOT NULL, order_id TEXT NOT NULL,
 product_id TEXT NOT NULL, method_code TEXT NOT NULL, person_id TEXT NOT NULL,
 readiness_id TEXT NOT NULL REFERENCES paid_report_readiness(readiness_id),
 report_id TEXT NOT NULL, state TEXT NOT NULL, record_json TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 0, claimed_by TEXT, lease_expires_at INTEGER,
 due_at INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 UNIQUE(environment,purchase_id,method_code,person_id),
 FOREIGN KEY(purchase_id) REFERENCES commerce_purchases(purchase_id)
);
CREATE INDEX paid_report_jobs_due ON paid_report_jobs(state,due_at,lease_expires_at);
CREATE TABLE paid_report_incidents (
 incident_id TEXT PRIMARY KEY, dedup_key TEXT NOT NULL UNIQUE,
 owner_account_id TEXT NOT NULL, state TEXT NOT NULL, record_json TEXT NOT NULL,
 first_seen_at INTEGER NOT NULL,last_seen_at INTEGER NOT NULL,attempt_count INTEGER NOT NULL
);
CREATE TABLE paid_report_refunds (
 refund_key TEXT PRIMARY KEY, job_id TEXT NOT NULL UNIQUE REFERENCES paid_report_jobs(job_id),
 purchase_id TEXT NOT NULL, state TEXT NOT NULL, record_json TEXT NOT NULL,
 stripe_refund_id TEXT UNIQUE, updated_at INTEGER NOT NULL
);
