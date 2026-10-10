-- Source candidate. Applying production migrations requires owner release approval.
CREATE TABLE IF NOT EXISTS provider_product_cost_envelopes (
 envelope_id TEXT PRIMARY KEY,
 owner_account_id TEXT NOT NULL,
 purchase_id TEXT NOT NULL,
 product_id TEXT NOT NULL,
 maximum_cost_micro_usd INTEGER NOT NULL CHECK(maximum_cost_micro_usd>0),
 authority_version TEXT NOT NULL,
 created_at TEXT NOT NULL,
 UNIQUE(owner_account_id,purchase_id,product_id)
);
CREATE TABLE IF NOT EXISTS provider_product_cost_entries (
 request_id TEXT PRIMARY KEY,
 envelope_id TEXT NOT NULL REFERENCES provider_product_cost_envelopes(envelope_id),
 cost_class TEXT NOT NULL CHECK(cost_class IN ('MODEL','PAYMENT','INFRASTRUCTURE')),
 context_id TEXT NOT NULL,
 reserved_micro_usd INTEGER NOT NULL CHECK(reserved_micro_usd>0),
 measured_micro_usd INTEGER CHECK(measured_micro_usd>=0),
 state TEXT NOT NULL CHECK(state IN ('RESERVED','METERED','USAGE_UNKNOWN')),
 cost_basis TEXT NOT NULL,
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS provider_product_cost_envelope_entries
 ON provider_product_cost_entries(envelope_id,state);
