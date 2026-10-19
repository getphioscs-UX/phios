-- Local successor only. Production application requires separate authorization.
-- PWS-I8 consent authority; account draft ciphertext remains owned by functions/account.
CREATE TABLE IF NOT EXISTS financial_purpose_grants (
 grant_id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL REFERENCES users(user_id),
 purpose TEXT NOT NULL CHECK(purpose IN ('WILL_ASSEMBLY','REPORT','PROFESSIONAL_REVIEW')),
 source_ref TEXT NOT NULL,
 source_digest TEXT NOT NULL,
 data_scopes TEXT NOT NULL,
 recipient_ref TEXT,
 jurisdiction_scope TEXT,
 service_scope TEXT,
 granted_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS financial_grant_owner ON financial_purpose_grants(owner_id,grant_id,expires_at);
