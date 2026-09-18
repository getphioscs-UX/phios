# COM-STRIPE-R1-REAL-E2E-READINESS

REAL_STRIPE_E2E = NOT_RUN — QA credential / deployment dependency. LIVE = NOT_ACTIVATED.

The user confirmed there is no approved general Commerce login and no local QA key or signing secret. No parallel Auth/Customer runtime or application test account has been created. Synthetic identities exist only inside isolated automated test fixtures.

## Existing configuration to reuse

- Local secrets: ignored `.dev.vars`. Never commit it or print secret values.
- Preview: Cloudflare Pages → PHI OS project → Settings → Variables and Secrets → Preview environment.
- Existing secret names: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Successor mode discriminator: `STRIPE_ENVIRONMENT=QA`. The explicit QA-only enable gate is `PHIOS_COMMERCE_QA_ENABLED`; it is not a replacement for the legacy Book I sales flag.
- Existing `wrangler.jsonc` Preview: RUNTIME_DB `phios-runtime-sandbox` (`c2c6e313-9bc8-4fd4-89b1-36f3d764dad8`), BOOKS `phios-private-books-sandbox`. Root configuration points at production; never run root remote migrations for this QA task.
- Preserve `PHIOS_ENVIRONMENT=qa`, `BOOK_ONE_SOURCE_KEY` and the disabled legacy `PHIOS_BOOK_ONE_SALES_ENABLED` gate. Do not silently enable legacy sales.
- New books reuse BOOKS, BOOK_ACCESS_TOKEN_SECRET, BOOK_WATERMARK_SERVICE_URL and BOOK_WATERMARK_SERVICE_TOKEN. Non-secret `COMMERCE_BOOK_SOURCE_KEYS_JSON` maps COM-BOOK-02–07 to owner-approved private keys. No key/path is guessed. Book I reuses BOOK_ONE_SOURCE_KEY.

## Environment prerequisites

1. Approve and connect an existing canonical identity provider to `context.data.symbolicAccountIdentity`. It must verify identity server-side. Do not accept user IDs in request bodies, arbitrary headers or success URLs, and do not reuse limited I Ching access as general Commerce login.
2. Bind QA secrets to PHI OS QA `acct_1UFr0TBEKXJyHMkK`, livemode false. Restricted test keys are supported. The adapter verifies `/v1/account` before checkout/Portal writes and pins its QA API version to `2026-07-29.dahlia`.
3. Confirm Preview deployment SHA and non-production D1/R2 bindings. Apply migrations 0001–0006 through the existing migration workflow, against QA only. Migration 0006 rebuilds the existing Commerce tables in one transaction and copies all legacy columns, including download and watermark records; make a backup and verify foreign keys and row counts first.
4. Configure the existing `/api/stripe-webhook` endpoint, using raw request body and its own signing secret. Subscribe to checkout completion/async success/async failure/expiry, payment_intent.succeeded, invoice.paid/payment_failed, customer.subscription.created/updated/deleted, charge.refunded. Keep endpoint/API fixture versions aligned.
5. Configure Test Mode Customer Portal and private book fulfillment. No successful book payment is considered a ready download until the existing watermark owner confirms the private object.
6. Enable only the explicit QA successor gate. This does not open Live, product publication, professional signing or human review gates.

## Then execute and record

Checkout → Stripe Test Payment → signed Webhook → persisted Order → Entitlement → Customer Surface. Repeat the ten flows listed in real-e2e-readiness.json, including two distinct Bundle reports, HD, Cross, Book, membership and each service type.

Record actual session/event/order IDs, expected provider price and amount, event delivery response, persisted account ownership, reload/new-browser access, decline/cancel/no-payment behavior, duplicate and retry behavior, refund review, subscription renewal/past-due/cancellation/expiry, Portal ownership, protected download, bilingual mobile/desktop keyboard behavior. Do not substitute a mock pass for this evidence.

The accessible https://phios-github.pages.dev is not yet verified as this QA deployment. https://getphios.com is explicitly excluded from this round's QA checkout.
