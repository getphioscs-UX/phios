-- SOURCE CANDIDATE ONLY. Not in the active migration manifest.
-- Entitlement allocation only: all monetary reservations and usage remain in
-- provider_product_cost_entries, not a second spend ledger or subscription.
CREATE TABLE IF NOT EXISTS continuity_quota_units (
 quota_unit_id TEXT PRIMARY KEY,
 envelope_id TEXT NOT NULL REFERENCES provider_product_cost_envelopes(envelope_id),
 owner_account_id TEXT NOT NULL,
 stripe_subscription_id TEXT NOT NULL REFERENCES commerce_subscriptions(stripe_subscription_id),
 billing_period_start INTEGER NOT NULL,
 billing_period_end INTEGER NOT NULL CHECK(billing_period_end>billing_period_start),
 grant_source_id TEXT NOT NULL UNIQUE,
 grant_kind TEXT NOT NULL CHECK(grant_kind IN ('INVOICE','REFILL')),
 purchase_id TEXT NOT NULL,
 maximum_micro_usd INTEGER NOT NULL CHECK(maximum_micro_usd=3000000),
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS continuity_quota_owner_period ON continuity_quota_units(owner_account_id,stripe_subscription_id,billing_period_end);
