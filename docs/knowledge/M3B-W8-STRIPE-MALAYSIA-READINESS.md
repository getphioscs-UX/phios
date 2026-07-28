# M3B-W8 Stripe Malaysia Readiness

Updated: 2026-07-28
Product: PHI OS Book I
Amount: RM89 MYR
Provider: Stripe Malaysia
Current state: implementation complete, production checkout acceptance-gated

## Safe release order

1. Activate the Stripe Malaysia merchant account.
2. Enable cards and FPX in the Stripe Dashboard.
3. Store the complete Book I file in private object storage. Do not place the
   109 MB file in the public Pages output or Git repository.
4. Configure the implemented signed HttpOnly Book I access session.
5. Apply `0004_book_commerce.sql` for purchases, entitlements, webhook events,
   receipts, watermarks and download audit.
6. Configure the implemented server-only Stripe Checkout Session endpoint.
7. Register the implemented raw-body webhook endpoint and signing secret.
8. Connect the purchaser watermark service contract.
9. Configure the receipt sender.
10. Run test-mode and RM89 live acceptance before enabling sales.

## Production secrets

Use Cloudflare secrets or encrypted variables. Never commit these values:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
BOOK_ACCESS_TOKEN_SECRET
BOOK_ONE_SOURCE_SHA256
BOOK_WATERMARK_SERVICE_TOKEN
RESEND_API_KEY
```

Keep a separate feature switch disabled until every acceptance gate passes:

```text
PHIOS_BOOK_ONE_SALES_ENABLED=false
```

## Required acceptance

- RM89 is sent as `8900` MYR minor units.
- The success-page redirect does not grant access.
- A replayed webhook cannot create a second purchase transition.
- Invalid or stale webhook signatures are rejected.
- `payment_pending`, `purchased`, `refunded` and `revoked` states remain
  server-owned.
- Card and FPX test payments both settle into the expected state.
- The complete file cannot be opened without verified access.
- Refund handling removes access according to the published policy.

Implementation and release commands are maintained in
`docs/knowledge/M3B-W8-PRODUCTION-RUNBOOK.md`.

## Official implementation references

- Stripe Checkout Sessions:
  <https://docs.stripe.com/api/checkout/sessions/create>
- Stripe FPX:
  <https://docs.stripe.com/payments/fpx>
- Stripe webhook signature verification:
  <https://docs.stripe.com/webhooks/signature>
- Cloudflare D1 prepared statements:
  <https://developers.cloudflare.com/d1/worker-api/prepared-statements/>
