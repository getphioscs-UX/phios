# M3B-W8 Production Runbook

Baseline: `main@513767dacbc223f60f5222bb0b1143b3f641932a`
Product: `phios-book-one-zh-pdf`
Price: `8900` MYR minor units (`RM89`)
Source object: `private/books/book-one/zh-Hans/book-one-v1.pdf`

## Release boundary

`PHIOS_BOOK_ONE_SALES_ENABLED` must remain `false` until every item in this
runbook passes. The checkout endpoint also fails closed if D1, Stripe, the
webhook secret, the access secret, private R2, the source checksum, the
watermark service or the receipt sender is unavailable.

## 1. Install and validate

```powershell
npm ci
npm run migrate:check
npm run check:m3b-book-access-payment
npm run check
```

## 2. Create private R2 and upload Book I

The bucket must not have an `r2.dev` public URL or public custom domain.

```powershell
npx wrangler login
npm run book:r2:create
npm run book:r2:upload -- "C:\secure-source\book-one.pdf"
```

Record the SHA-256 printed by the upload command. The PDF remains outside the
Git repository and public Pages output.

In Cloudflare Pages → `getphios` → Settings → Bindings, add the private R2
binding:

```text
Variable name: BOOKS
R2 bucket: phios-private-books
```

The equivalent configuration shape is recorded in
`config/book-commerce-bindings.example.jsonc`. The frozen Runtime
`wrangler.jsonc` is intentionally not changed.

## 3. Apply D1 migration

```powershell
npx wrangler d1 migrations apply phios-runtime-production --remote
```

Confirm migration `0004_book_commerce.sql` and all ten commerce tables.

## 4. Configure production secrets

Set these through Cloudflare Pages encrypted secrets, never in Git:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
BOOK_ACCESS_TOKEN_SECRET
BOOK_ONE_SOURCE_SHA256
BOOK_WATERMARK_SERVICE_URL
BOOK_WATERMARK_SERVICE_TOKEN
RESEND_API_KEY
BOOK_RECEIPT_FROM_EMAIL
```

`BOOK_ACCESS_TOKEN_SECRET` must be at least 32 random characters. Keep Stripe
test and live secrets separate.

## 5. Configure Stripe

1. Enable cards and FPX for the Malaysia Stripe account.
2. Add the production endpoint:
   `https://phios-github.pages.dev/api/stripe-webhook`.
3. Subscribe to:
   `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`,
   `checkout.session.expired`, and `charge.refunded`.
4. Store the endpoint `whsec_...` value as `STRIPE_WEBHOOK_SECRET`.

The success page retrieves the Checkout Session from Stripe and does not trust
the redirect. Webhook event IDs are idempotent; raw payloads are hashed, not
stored.

## 6. Connect the watermark service

Implement the contract in
`docs/knowledge/M3B-W8-WATERMARK-SERVICE-CONTRACT.md`. It must read the private
source object, add a visible purchaser/receipt watermark, write only to the
assigned private destination key, and call the signed completion endpoint.
Unwatermarked source delivery is forbidden.

## 7. Configure receipt delivery

Verify the sender domain with Resend and set `BOOK_RECEIPT_FROM_EMAIL`. A
successful delivery email contains the receipt number and a token valid for 72
hours with no more than three downloads. On-page tokens are valid for 15
minutes with no more than two downloads.

## 8. Sandbox acceptance

Run Stripe test-mode acceptance for:

- successful card payment;
- successful FPX payment;
- cancelled Checkout;
- failed or expired payment;
- duplicate webhook replay;
- invalid and stale signatures;
- purchaser watermark generation;
- receipt and delivery email;
- two successful on-page downloads followed by rejection;
- full refund followed by entitlement and token revocation.

Keep `PHIOS_BOOK_ONE_SALES_ENABLED=false` after sandbox acceptance.

## 9. RM89 live acceptance

Use the live `sk_live_...` and live webhook endpoint. Complete one controlled
RM89 purchase, confirm the D1 purchase and active entitlement, inspect the
watermarked PDF, verify the receipt email, perform the refund test if required
by the release owner, and confirm access revocation.

Only after written acceptance should:

```text
PHIOS_BOOK_ONE_SALES_ENABLED=true
```

be set in production.

## Evidence references

- Stripe Checkout Sessions:
  <https://docs.stripe.com/api/checkout/sessions/create>
- Stripe fulfillment:
  <https://docs.stripe.com/checkout/fulfillment>
- Stripe webhook signatures:
  <https://docs.stripe.com/webhooks/signature>
- Stripe FPX:
  <https://docs.stripe.com/payments/fpx>
- Cloudflare R2 Workers API:
  <https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>
