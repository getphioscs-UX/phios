# COM-STRIPE-R1 live cutover — prepare only

LIVE = NOT_ACTIVATED. No live product, price, payment, webhook, subscription, Portal or deployment write was performed. All live IDs in the registry remain null.

After real QA E2E and consolidated human acceptance, obtain separate live activation authorization. Then verify the canonical commercial gate, production identity binding, product publication admissions, approved live mappings, actual currency/amounts, webhook raw-body signature, replay recovery, database backup and migration preservation, private book source and watermark delivery, account-owned access, subscription invoicing and cancellation, refund policy, monitoring and rollback. Do not reuse test IDs in production.

Real QA must run on local/confirmed Preview, never getphios.com. Merely visiting phios-github.pages.dev does not establish that its deployment and bindings are suitable for QA. Production RUNTIME_DB is not a QA substitute.

The current successor adapter intentionally only permits the PHI OS QA account and test-mode keys. Live activation requires an explicitly reviewed successor, not changing a flag to bypass the QA account check.

Stripe Tax has not been enabled. Confirm applicable tax registrations and commercial policy before a later activation; do not switch on automatic_tax merely for this QA test.

References: https://docs.stripe.com/checkout/fulfillment ; https://docs.stripe.com/billing/subscriptions/webhooks ; https://docs.stripe.com/billing/taxes/collect-taxes
