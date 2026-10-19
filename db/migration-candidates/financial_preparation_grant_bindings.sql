-- PWS-I8 extension, local candidate only. Never executed by an HTTP request.
CREATE TABLE IF NOT EXISTS financial_preparation_grant_bindings (
 grant_id TEXT PRIMARY KEY REFERENCES financial_purpose_grants(grant_id),
 binding_json TEXT NOT NULL,
 binding_digest TEXT NOT NULL
);
