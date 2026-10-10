PRAGMA foreign_keys = ON;

-- Provider subject, never email, identifies an existing application user.
CREATE TABLE IF NOT EXISTS account_provider_subjects (
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (issuer, subject)
);
CREATE TABLE IF NOT EXISTS account_verified_sessions (
  session_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  issuer TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS account_sessions_user ON account_verified_sessions(user_id, expires_at);
