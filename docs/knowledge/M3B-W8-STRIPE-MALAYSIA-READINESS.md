# M3B-W8 Stripe Malaysia Readiness

Date: 2026-07-23  
Product: PHI OS Book I  
Amount: RM89 MYR  
Provider: Stripe Malaysia  
Current state: selected, production checkout disabled

## Safe release order

1. Activate the Stripe Malaysia merchant account.
2. Enable cards and FPX in the Stripe Dashboard.
3. Store the complete Book I file in private object storage. Do not place the
   109 MB file in the public Pages output or Git repository.
4. Add a server-authenticated reader and short-lived access authorization.
5. Add D1 purchase, webhook-event and access-revocation records.
6. Create Stripe Checkout Sessions only on the server.
7. Verify each Stripe webhook against the unmodified request body and endpoint
   signing secret.
8. Grant `purchased` only from a verified successful payment event.
9. Handle refunds and revocations from verified events.
10. Connect receipt email and run test-mode acceptance.

## Production secrets

Use Cloudflare secrets or encrypted variables. Never commit these values:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
BOOK_ACCESS_TOKEN_SECRET
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

## Official implementation references

- Stripe Checkout Sessions:
  <https://docs.stripe.com/api/checkout/sessions/create>
- Stripe FPX:
  <https://docs.stripe.com/payments/fpx>
- Stripe webhook signature verification:
  <https://docs.stripe.com/webhooks/signature>
- Cloudflare D1 prepared statements:
  <https://developers.cloudflare.com/d1/worker-api/prepared-statements/>
