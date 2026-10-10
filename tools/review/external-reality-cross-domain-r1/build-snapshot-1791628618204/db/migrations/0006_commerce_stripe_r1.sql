-- COM-STRIPE-R1 additive successor; transaction required. Never edit migration 0004.
PRAGMA defer_foreign_keys = ON;
CREATE TABLE _com_r1_copy_commerce_products AS SELECT * FROM commerce_products;
CREATE TABLE _com_r1_copy_commerce_checkout_attempts AS SELECT * FROM commerce_checkout_attempts;
CREATE TABLE _com_r1_copy_commerce_purchases AS SELECT * FROM commerce_purchases;
CREATE TABLE _com_r1_copy_digital_entitlements AS SELECT * FROM digital_entitlements;
CREATE TABLE _com_r1_copy_commerce_webhook_events AS SELECT * FROM commerce_webhook_events;
CREATE TABLE _com_r1_copy_commerce_download_tokens AS SELECT * FROM commerce_download_tokens;
CREATE TABLE _com_r1_copy_commerce_download_events AS SELECT * FROM commerce_download_events;
CREATE TABLE _com_r1_copy_commerce_receipts AS SELECT * FROM commerce_receipts;
CREATE TABLE _com_r1_copy_commerce_delivery_messages AS SELECT * FROM commerce_delivery_messages;
CREATE TABLE _com_r1_copy_commerce_watermark_jobs AS SELECT * FROM commerce_watermark_jobs;
DROP TABLE commerce_watermark_jobs;
DROP TABLE commerce_delivery_messages;
DROP TABLE commerce_receipts;
DROP TABLE commerce_download_events;
DROP TABLE commerce_download_tokens;
DROP TABLE commerce_webhook_events;
DROP TABLE digital_entitlements;
DROP TABLE commerce_purchases;
DROP TABLE commerce_checkout_attempts;
DROP TABLE commerce_products;
-- Canonical schema authority for PHI OS M3B-W8 Book Commerce.
-- Keep aligned with db/migrations/0004_book_commerce.sql.

CREATE TABLE commerce_products (
  product_id TEXT PRIMARY KEY,
  category TEXT,
  billing_type TEXT,
  qa_price_id TEXT UNIQUE,
  qa_product_id TEXT,
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
  CHECK (amount_minor > 0),
  CHECK (active IN (0, 1)),
  UNIQUE (product_id, product_version)
);

CREATE TABLE commerce_checkout_attempts (
  checkout_attempt_id TEXT PRIMARY KEY,
  customer_id TEXT,
  selected_products_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(selected_products_json)),
  order_state TEXT NOT NULL DEFAULT 'PENDING' CHECK(order_state IN ('PENDING','CHECKOUT_CREATED','PAYMENT_PROCESSING','PAID','FULFILLMENT_PENDING','FULFILLED','PAYMENT_FAILED','CANCELED','REFUNDED','PARTIALLY_REFUNDED')),
  amount_minor INTEGER,
  currency TEXT,
  qa_price_id TEXT,
  request_hash TEXT,
  review_required INTEGER NOT NULL DEFAULT 0,
  environment TEXT,
  context_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(context_json)),
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

CREATE TABLE commerce_purchases (
  purchase_id TEXT PRIMARY KEY,
  customer_id TEXT,
  product_id TEXT NOT NULL,
  checkout_attempt_id TEXT NOT NULL UNIQUE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  buyer_email_ciphertext TEXT,
  buyer_email_hash TEXT,
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
  CHECK (amount_minor > 0),
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

CREATE TABLE digital_entitlements (
  entitlement_id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  customer_id TEXT,
  entitlement_code TEXT NOT NULL DEFAULT 'LEGACY_BOOK_ACCESS',
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
  UNIQUE (purchase_id, entitlement_code),
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

CREATE TABLE commerce_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  order_id TEXT,
  event_type TEXT NOT NULL,
  livemode INTEGER NOT NULL,
  payload_sha256 TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received',
  error_code TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  CHECK (livemode IN (0, 1)),
  CHECK (length(payload_sha256) = 64),
  CHECK (processing_status IN ('received', 'processing', 'processed', 'ignored', 'failed', 'failed_terminal'))
);

CREATE TABLE commerce_download_tokens (
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

CREATE TABLE commerce_download_events (
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

CREATE TABLE commerce_receipts (
  receipt_id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  purchase_id TEXT NOT NULL UNIQUE,
  receipt_json TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  CHECK (json_valid(receipt_json)),
  FOREIGN KEY (purchase_id) REFERENCES commerce_purchases(purchase_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE commerce_delivery_messages (
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

CREATE TABLE commerce_watermark_jobs (
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

CREATE INDEX idx_commerce_checkout_status_created
  ON commerce_checkout_attempts(status, created_at DESC);
CREATE INDEX idx_commerce_purchase_subject_state
  ON commerce_purchases(buyer_email_hash, purchase_state, updated_at DESC);
CREATE INDEX idx_commerce_purchase_payment_intent
  ON commerce_purchases(stripe_payment_intent_id);
CREATE INDEX idx_entitlement_subject_status
  ON digital_entitlements(subject_hash, entitlement_status, updated_at DESC);
CREATE INDEX idx_webhook_status_received
  ON commerce_webhook_events(processing_status, received_at);
CREATE INDEX idx_download_token_entitlement_expiry
  ON commerce_download_tokens(entitlement_id, expires_at);
CREATE INDEX idx_download_event_entitlement_date
  ON commerce_download_events(entitlement_id, downloaded_at DESC);
CREATE INDEX idx_delivery_status_created
  ON commerce_delivery_messages(delivery_status, created_at);
CREATE INDEX idx_watermark_status_created
  ON commerce_watermark_jobs(job_status, created_at);

CREATE INDEX idx_commerce_customer_orders ON commerce_checkout_attempts(customer_id, created_at);
CREATE INDEX idx_commerce_customer_entitlements ON digital_entitlements(customer_id, entitlement_code, entitlement_status);
CREATE TABLE commerce_customer_bindings (
  customer_id TEXT PRIMARY KEY,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL CHECK(environment='QA'),
  created_at TEXT NOT NULL
);
CREATE TABLE commerce_subscriptions (
  stripe_subscription_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES commerce_checkout_attempts(checkout_attempt_id),
  stripe_customer_id TEXT NOT NULL,
  subscription_status TEXT NOT NULL,
  current_period_end INTEGER NOT NULL DEFAULT 0,
  paid_until INTEGER NOT NULL DEFAULT 0,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  last_invoice_id TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE commerce_service_fulfillments (
  fulfillment_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES commerce_checkout_attempts(checkout_attempt_id),
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  fulfillment_state TEXT NOT NULL DEFAULT 'INTAKE_REQUIRED',
  duration_minutes INTEGER,
  modality TEXT NOT NULL DEFAULT 'UNDECIDED',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO commerce_products (product_id,product_version,title,language,format,currency,amount_minor,source_object_key,source_sha256,active,created_at,updated_at) SELECT product_id,product_version,title,language,format,currency,amount_minor,source_object_key,source_sha256,active,created_at,updated_at FROM _com_r1_copy_commerce_products;
DROP TABLE _com_r1_copy_commerce_products;
INSERT INTO commerce_checkout_attempts (checkout_attempt_id,product_id,idempotency_key_hash,stripe_checkout_session_id,stripe_checkout_url,status,locale,created_at,expires_at,updated_at) SELECT checkout_attempt_id,product_id,idempotency_key_hash,stripe_checkout_session_id,stripe_checkout_url,status,locale,created_at,expires_at,updated_at FROM _com_r1_copy_commerce_checkout_attempts;
DROP TABLE _com_r1_copy_commerce_checkout_attempts;
INSERT INTO commerce_purchases (purchase_id,product_id,checkout_attempt_id,stripe_checkout_session_id,stripe_payment_intent_id,stripe_customer_id,buyer_email_ciphertext,buyer_email_hash,buyer_name_ciphertext,currency,amount_minor,refunded_amount_minor,purchase_state,paid_at,refunded_at,revoked_at,created_at,updated_at) SELECT purchase_id,product_id,checkout_attempt_id,stripe_checkout_session_id,stripe_payment_intent_id,stripe_customer_id,buyer_email_ciphertext,buyer_email_hash,buyer_name_ciphertext,currency,amount_minor,refunded_amount_minor,purchase_state,paid_at,refunded_at,revoked_at,created_at,updated_at FROM _com_r1_copy_commerce_purchases;
DROP TABLE _com_r1_copy_commerce_purchases;
INSERT INTO digital_entitlements (entitlement_id,purchase_id,product_id,subject_hash,entitlement_status,watermark_status,watermarked_object_key,granted_at,expires_at,revoked_at,created_at,updated_at) SELECT entitlement_id,purchase_id,product_id,subject_hash,entitlement_status,watermark_status,watermarked_object_key,granted_at,expires_at,revoked_at,created_at,updated_at FROM _com_r1_copy_digital_entitlements;
DROP TABLE _com_r1_copy_digital_entitlements;
INSERT INTO commerce_webhook_events (stripe_event_id,event_type,livemode,payload_sha256,processing_status,error_code,received_at,processed_at) SELECT stripe_event_id,event_type,livemode,payload_sha256,processing_status,error_code,received_at,processed_at FROM _com_r1_copy_commerce_webhook_events;
DROP TABLE _com_r1_copy_commerce_webhook_events;
INSERT INTO commerce_download_tokens (token_id,entitlement_id,token_hash,purpose,expires_at,max_uses,use_count,revoked_at,created_at,last_used_at) SELECT token_id,entitlement_id,token_hash,purpose,expires_at,max_uses,use_count,revoked_at,created_at,last_used_at FROM _com_r1_copy_commerce_download_tokens;
DROP TABLE _com_r1_copy_commerce_download_tokens;
INSERT INTO commerce_download_events (download_event_id,entitlement_id,token_id,object_key,request_fingerprint,downloaded_at) SELECT download_event_id,entitlement_id,token_id,object_key,request_fingerprint,downloaded_at FROM _com_r1_copy_commerce_download_events;
DROP TABLE _com_r1_copy_commerce_download_events;
INSERT INTO commerce_receipts (receipt_id,receipt_number,purchase_id,receipt_json,issued_at) SELECT receipt_id,receipt_number,purchase_id,receipt_json,issued_at FROM _com_r1_copy_commerce_receipts;
DROP TABLE _com_r1_copy_commerce_receipts;
INSERT INTO commerce_delivery_messages (delivery_message_id,purchase_id,channel,delivery_type,provider_message_id,delivery_status,attempt_count,last_error_code,created_at,sent_at,updated_at) SELECT delivery_message_id,purchase_id,channel,delivery_type,provider_message_id,delivery_status,attempt_count,last_error_code,created_at,sent_at,updated_at FROM _com_r1_copy_commerce_delivery_messages;
DROP TABLE _com_r1_copy_commerce_delivery_messages;
INSERT INTO commerce_watermark_jobs (watermark_job_id,entitlement_id,source_object_key,destination_object_key,watermark_payload_ciphertext,job_status,attempt_count,last_error_code,created_at,started_at,completed_at,updated_at) SELECT watermark_job_id,entitlement_id,source_object_key,destination_object_key,watermark_payload_ciphertext,job_status,attempt_count,last_error_code,created_at,started_at,completed_at,updated_at FROM _com_r1_copy_commerce_watermark_jobs;
DROP TABLE _com_r1_copy_commerce_watermark_jobs;
