-- LOCAL REVIEW CANDIDATE ONLY. Not in db/migrations, not applied to D1.
-- Existing commerce tables remain the sole charging/receipt ledger.
CREATE TABLE report_reference_counters (
 environment TEXT NOT NULL CHECK(environment IN ('QA','LIVE')), method TEXT NOT NULL,
 year INTEGER NOT NULL, value INTEGER NOT NULL CHECK(value>=0), PRIMARY KEY(environment,method,year)
);
CREATE TABLE report_public_references (
 environment TEXT NOT NULL CHECK(environment IN ('QA','LIVE')), emission_key TEXT NOT NULL,
 public_report_number TEXT NOT NULL UNIQUE, method TEXT NOT NULL, product_id TEXT NOT NULL,
 owner_ref TEXT NOT NULL, nature TEXT NOT NULL CHECK(nature IN ('PAID','FREE','DRAFT')),
 state TEXT NOT NULL CHECK(state IN ('REPORT_RESERVED','REPORT_ISSUED','VOID','EXPIRED')),
 order_id TEXT REFERENCES commerce_checkout_attempts(checkout_attempt_id),
 purchase_id TEXT REFERENCES commerce_purchases(purchase_id),
 receipt_number TEXT REFERENCES commerce_receipts(receipt_number),
 report_id TEXT, report_artifact_id TEXT, saved_version TEXT, source_digest TEXT,
 issued_at TEXT, created_at TEXT NOT NULL, previous_reference TEXT REFERENCES report_public_references(public_report_number),
 reversed INTEGER NOT NULL DEFAULT 0 CHECK(reversed IN (0,1)),
 PRIMARY KEY(environment,emission_key), UNIQUE(environment,report_artifact_id), UNIQUE(environment,public_report_number),
 FOREIGN KEY(environment,previous_reference) REFERENCES report_public_references(environment,public_report_number),
 CHECK(nature!='FREE' OR (order_id IS NULL AND purchase_id IS NULL AND receipt_number IS NULL)),
 CHECK(state!='REPORT_ISSUED' OR (report_id IS NOT NULL AND report_artifact_id IS NOT NULL AND saved_version IS NOT NULL AND source_digest IS NOT NULL AND issued_at IS NOT NULL))
);
CREATE INDEX report_reference_order ON report_public_references(environment,order_id);
CREATE INDEX report_reference_purchase ON report_public_references(environment,purchase_id);
CREATE TRIGGER report_reference_immutable BEFORE UPDATE ON report_public_references
 WHEN NEW.public_report_number!=OLD.public_report_number OR NEW.environment!=OLD.environment
 OR NEW.emission_key!=OLD.emission_key OR NEW.owner_ref!=OLD.owner_ref OR NEW.product_id!=OLD.product_id
 OR NEW.method!=OLD.method OR NEW.nature!=OLD.nature OR NEW.created_at!=OLD.created_at
 OR NEW.order_id IS NOT OLD.order_id
 OR (OLD.purchase_id IS NOT NULL AND NEW.purchase_id IS NOT OLD.purchase_id)
 OR (OLD.receipt_number IS NOT NULL AND NEW.receipt_number IS NOT OLD.receipt_number)
 OR NEW.previous_reference IS NOT OLD.previous_reference OR NEW.reversed<OLD.reversed
 OR (OLD.state='REPORT_ISSUED' AND (NEW.state!='REPORT_ISSUED' OR NEW.issued_at IS NOT OLD.issued_at
 OR NEW.report_id IS NOT OLD.report_id OR NEW.report_artifact_id IS NOT OLD.report_artifact_id
 OR NEW.saved_version IS NOT OLD.saved_version OR NEW.source_digest IS NOT OLD.source_digest))
 OR (OLD.state IN ('VOID','EXPIRED') AND NEW.state!=OLD.state)
 BEGIN SELECT RAISE(ABORT,'REPORT_REFERENCE_IMMUTABLE'); END;
CREATE TRIGGER report_reference_no_delete BEFORE DELETE ON report_public_references
 BEGIN SELECT RAISE(ABORT,'REPORT_REFERENCE_NON_REUSABLE'); END;
