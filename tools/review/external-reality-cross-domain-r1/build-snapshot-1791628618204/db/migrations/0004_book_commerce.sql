-- PHI OS M3B-W8 Book Commerce and Digital Entitlement migration.
-- Immutable after deployment. Future changes require 0005_*.sql or later.
-- Money uses integer minor units. Buyer email is encrypted at application
-- level; only a keyed, irreversible subject hash is used for lookup.

CREATE TABLE IF NOT EXISTS commerce_products (
  product_id TEXT PRIMARY KEY,
  product_version TEXT NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  format TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  source_object_key TEXT NOT NULL,
  source_sha256 TEXT,
  active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(trim(product_id)) > 0),
  CHECK (length(trim(product_version)) > 0),
  CHECK (currency = 'MYR'),
  CHECK (amount_minor = 8900),
  CHECK (active IN (0, 1)),
  UNIQUE (product_id, product_version)
);

CREATE TABLE IF NOT EXISTS commerce_checkout_attempts (
  checkout_attempt_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  idempotency_key_hash TEXT NOT NULL UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'creating',
  locale TEXT NOT NULL DEFAULT 'zh-Hans',
  created_at TEXT NOT NULL,
  expires_at TEXT,
  updated_at TEXT NOT NULL,
  CHECK (status IN (
    'creating', 'payment_pending', 'paid', 'failed', 'expired', 'cancelled'
  )),
  CHECK (locale IN ('en', 'zh-Hans')),
  FOREIGN KEY (product_id) REFERENCES commerce_products(product_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commerce_purchases (
  purchase_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  checkout_attempt_id TEXT NOT NULL UNIQUE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  buyer_email_ciphertext TEXT NOT NULL,
  buyer_email_hash TEXT NOT NULL,
  buyer_name_ciphertext TEXT,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  refunded_amount_minor INTEGER NOT NULL DEFAULT 0,
  purchase_state TEXT NOT NULL DEFAULT 'payment_pending',
  paid_at TEXT,
  refunded_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (currency = 'MYR'),
  CHECK (amount_minor = 8900),
  CHECK (refunded_amount_minor >= 0),
  CHECK (refunded_amount_minor <= amount_minor),
  CHECK (purchase_state IN (
    'payment_pending', 'purchased', 'refunded', 'revoked'
  )),
  FOREIGN KEY (product_id) REFERENCES commerce_products(product_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (checkout_attempt_id)
    REFERENCES commerce_checkout_attempts(checkout_attempt_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS digital_entitlements (
  entitlement_id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  entitlement_status TEXT NOT NULL DEFAULT 'active',
  watermark_status TEXT NOT NULL DEFAULT 'pending',
  watermarked_object_key TEXT,
  granted_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (entitlement_status IN ('active', 'refunded', 'revoked', 'expired')),
  CHECK (watermark_status IN ('pending', 'processing', 'ready', 'failed')),
  CHECK (
    (watermark_status = 'ready' AND watermarked_object_key IS NOT NULL) OR
    watermark_status <> 'ready'
  ),
  FOREIGN KEY (purchase_id) REFERENCES commerce_purchases(purchase_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES commerce_products(product_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commerce_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  livemode INTEGER NOT NULL,
  payload_sha256 TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received',
  error_code TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  CHECK (livemode IN (0, 1)),
  CHECK (length(payload_sha256) = 64),
  CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed'))
);

CREATE TABLE IF NOT EXISTS commerce_download_tokens (
  token_id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL DEFAULT 'buyer_download',
  expires_at TEXT NOT NULL,
  max_uses INTEGER NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  CHECK (purpose IN ('buyer_download', 'delivery_email')),
  CHECK (max_uses BETWEEN 1 AND 10),
  CHECK (use_count >= 0),
  CHECK (use_count <= max_uses),
  FOREIGN KEY (entitlement_id) REFERENCES digital_entitlements(entitlement_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commerce_download_events (
  download_event_id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  object_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  downloaded_at TEXT NOT NULL,
  FOREIGN KEY (entitlement_id) REFERENCES digital_entitlements(entitlement_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (token_id) REFERENCES commerce_download_tokens(token_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commerce_receipts (
  receipt_id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  purchase_id TEXT NOT NULL UNIQUE,
  receipt_json TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  CHECK (json_valid(receipt_json)),
  FOREIGN KEY (purchase_id) REFERENCES commerce_purchases(purchase_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commerce_delivery_messages (
  delivery_message_id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  delivery_type TEXT NOT NULL,
  provider_message_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  updated_at TEXT NOT NULL,
  CHECK (channel = 'email'),
  CHECK (delivery_type IN ('receipt_and_book_delivery')),
  CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  CHECK (attempt_count BETWEEN 0 AND 20),
  UNIQUE (purchase_id, delivery_type),
  FOREIGN KEY (purchase_id) REFERENCES commerce_purchases(purchase_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS commerce_watermark_jobs (
  watermark_job_id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL UNIQUE,
  source_object_key TEXT NOT NULL,
  destination_object_key TEXT NOT NULL UNIQUE,
  watermark_payload_ciphertext TEXT NOT NULL,
  job_status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  CHECK (job_status IN ('pending', 'processing', 'completed', 'failed')),
  CHECK (attempt_count BETWEEN 0 AND 20),
  FOREIGN KEY (entitlement_id) REFERENCES digital_entitlements(entitlement_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_commerce_checkout_status_created
  ON commerce_checkout_attempts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_purchase_subject_state
  ON commerce_purchases(buyer_email_hash, purchase_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_purchase_payment_intent
  ON commerce_purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_entitlement_subject_status
  ON digital_entitlements(subject_hash, entitlement_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_status_received
  ON commerce_webhook_events(processing_status, received_at);
CREATE INDEX IF NOT EXISTS idx_download_token_entitlement_expiry
  ON commerce_download_tokens(entitlement_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_download_event_entitlement_date
  ON commerce_download_events(entitlement_id, downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_status_created
  ON commerce_delivery_messages(delivery_status, created_at);
CREATE INDEX IF NOT EXISTS idx_watermark_status_created
  ON commerce_watermark_jobs(job_status, created_at);
