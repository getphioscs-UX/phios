import fs from 'node:fs';
import {sha256Hex} from '../functions/runtime/migrations/migration-runner.js';
// Rebuild the SAME tables atomically; copy every legacy column, including
// protected book delivery records, before removing tables in dependency order.
const original=fs.readFileSync('db/schema/book-commerce-schema-v1.sql','utf8').replaceAll('\r\n','\n');
const tables=[...original.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g)].map(m=>({name:m[1],columns:[...m[2].matchAll(/^  (\w+) (?:TEXT|INTEGER)\b/gm)].map(x=>x[1])}));
let schema=original.replaceAll('CHECK (amount_minor = 8900)','CHECK (amount_minor > 0)');
schema=schema.replace('  product_id TEXT PRIMARY KEY,','  product_id TEXT PRIMARY KEY,\n  category TEXT,\n  billing_type TEXT,\n  qa_price_id TEXT UNIQUE,\n  qa_product_id TEXT,');
schema=schema.replace('  checkout_attempt_id TEXT PRIMARY KEY,',`  checkout_attempt_id TEXT PRIMARY KEY,
  customer_id TEXT,
  selected_products_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(selected_products_json)),
  order_state TEXT NOT NULL DEFAULT 'PENDING' CHECK(order_state IN ('PENDING','CHECKOUT_CREATED','PAYMENT_PROCESSING','PAID','FULFILLMENT_PENDING','FULFILLED','PAYMENT_FAILED','CANCELED','REFUNDED','PARTIALLY_REFUNDED')),
  amount_minor INTEGER,
  currency TEXT,
  qa_price_id TEXT,
  request_hash TEXT,
  review_required INTEGER NOT NULL DEFAULT 0,
  environment TEXT,
  context_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(context_json)),`);
schema=schema.replace('  purchase_id TEXT PRIMARY KEY,','  purchase_id TEXT PRIMARY KEY,\n  customer_id TEXT,');
schema=schema.replace('  buyer_email_ciphertext TEXT NOT NULL,','  buyer_email_ciphertext TEXT,').replace('  buyer_email_hash TEXT NOT NULL,','  buyer_email_hash TEXT,');
schema=schema.replace('  purchase_id TEXT NOT NULL UNIQUE,\n  product_id TEXT NOT NULL,','  purchase_id TEXT NOT NULL,\n  customer_id TEXT,\n  entitlement_code TEXT NOT NULL DEFAULT \'LEGACY_BOOK_ACCESS\',\n  UNIQUE_PLACEHOLDER\n  product_id TEXT NOT NULL,');
schema=schema.replace('  UNIQUE_PLACEHOLDER\n','').replace("  CHECK (entitlement_status IN ('active'", "  UNIQUE (purchase_id, entitlement_code),\n  CHECK (entitlement_status IN ('active'");
schema=schema.replace('  stripe_event_id TEXT PRIMARY KEY,','  stripe_event_id TEXT PRIMARY KEY,\n  order_id TEXT,');
schema=schema.replace("('received', 'processed', 'ignored', 'failed')", "('received', 'processing', 'processed', 'ignored', 'failed', 'failed_terminal')");
schema+=`
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
`;
const sql='-- COM-STRIPE-R1 additive successor; transaction required. Never edit migration 0004.\nPRAGMA defer_foreign_keys = ON;\n'+tables.map(t=>`CREATE TABLE _com_r1_copy_${t.name} AS SELECT * FROM ${t.name};`).join('\n')+'\n'+[...tables].reverse().map(t=>`DROP TABLE ${t.name};`).join('\n')+'\n'+schema+'\n'+tables.map(t=>`INSERT INTO ${t.name} (${t.columns.join(',')}) SELECT ${t.columns.join(',')} FROM _com_r1_copy_${t.name};\nDROP TABLE _com_r1_copy_${t.name};`).join('\n')+'\n';
fs.writeFileSync('db/schema/commerce-stripe-r1.sql',schema);
fs.writeFileSync('db/migrations/0006_commerce_stripe_r1.sql',sql);
const registry=JSON.parse(fs.readFileSync('content/registry/runtime-migrations.json','utf8'));
const entry={version:6,name:'commerce_stripe_r1',file:'db/migrations/0006_commerce_stripe_r1.sql',checksum:await sha256Hex(sql),schema_id:'phi-os.commerce-stripe-r1',immutable:true};
registry.migrations=registry.migrations.filter(x=>x.version!==6).concat(entry);
fs.writeFileSync('content/registry/runtime-migrations.json',JSON.stringify(registry,null,2)+'\n');
console.log('Generated additive Commerce migration and schema.');
