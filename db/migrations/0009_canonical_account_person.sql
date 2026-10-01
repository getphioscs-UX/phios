-- Shared, method-independent person owner. Birth data and consent are encrypted.
-- Versions are append-only; released report material is never updated here.
CREATE TABLE IF NOT EXISTS account_person_versions (
  person_id TEXT NOT NULL,
  owner_account_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK(version > 0),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  digest TEXT NOT NULL,
  prior_digest TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(person_id, version)
);
CREATE INDEX IF NOT EXISTS account_person_owner ON account_person_versions(owner_account_id, person_id, version);
