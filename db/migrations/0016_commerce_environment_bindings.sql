-- Local migration proposal. Never execute against production without review.
-- Preserve every existing QA binding; allow isolated LIVE bindings for the same
-- PHI OS account. No secret or customer birth information is added.
ALTER TABLE commerce_customer_bindings RENAME TO commerce_customer_bindings_pre_environment;
CREATE TABLE commerce_customer_bindings (
 customer_id TEXT NOT NULL,
 stripe_customer_id TEXT NOT NULL,
 environment TEXT NOT NULL CHECK(environment IN ('QA','LIVE')),
 created_at TEXT NOT NULL,
 PRIMARY KEY(customer_id,environment),
 UNIQUE(stripe_customer_id,environment)
);
INSERT INTO commerce_customer_bindings(customer_id,stripe_customer_id,environment,created_at)
 SELECT customer_id,stripe_customer_id,environment,created_at FROM commerce_customer_bindings_pre_environment;
DROP TABLE commerce_customer_bindings_pre_environment;
