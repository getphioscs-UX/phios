-- HRX dedicated-health-database schema candidate. Not part of current RUNTIME_DB migrations.
CREATE TABLE IF NOT EXISTS health_reality_records (
  case_ref TEXT PRIMARY KEY,
  account_ref TEXT NOT NULL,
  encrypted_payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_health_reality_account_updated ON health_reality_records(account_ref, updated_at DESC);
