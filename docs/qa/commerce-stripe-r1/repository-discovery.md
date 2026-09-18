# COM-STRIPE-R1 repository discovery

Baseline: aacfba0425cdc37f9b69a1bdc958b0e9bfef6420 (main), initially clean. User authorizes QA only and one final human review packet.

## Existing owners, before implementation

| Responsibility | Existing owner | Successor boundary |
|---|---|---|
| Commercial policy | functions/pws/commercial/commercial-runtime.js; report-successor-contract.js | Extend approved product policy, no second commercial runtime |
| Stripe adapter | functions/commerce/stripe-client.js | Reuse fetch adapter and configured secrets |
| Checkout | functions/api/book-one-checkout.js | Preserve legacy Book I; authenticated successor entry uses same store/adapter |
| Webhook | functions/api/stripe-webhook.js | Single raw-signature endpoint |
| Persistence | functions/commerce/book-commerce-store.js; RUNTIME_DB | Extend existing commerce tables, not a second order/entitlement store |
| Delivery | functions/commerce/book-delivery.js; private BOOKS R2; watermark jobs | Preserve protected delivery; no public book URLs |
| Identity | functions/symbolic-method-persistence/symbolic-account-identity-v1.js | Trusted server context only; no body/header/email ownership |
| Session provider | functions/api/_middleware.js; iching-limited-production-v1.js | Existing provider is limited I Ching, not a general Commerce login. General authenticated QA session integration remains external gate; do not repurpose limited access |
| Financial report | functions/professional/reports/financial-report-contract.js; professional-report-contract.js | Professional report with intake, evidence and publication lifecycle; not auto-completed by payment |
| Human review | docs/visual-report-r1/final-review.html; docs/hd-intake-r1/review.html; docs/public-index-successor | Consolidate review and comments, keep production gates pending |

## Minimal persistent schema gaps

commerce_products and commerce_purchases constrain every amount to 8900. checkout attempts have no canonical customer or selected-product snapshot. digital_entitlements permits only one entitlement per purchase. No subscription/customer binding or service fulfillment persistence exists. The existing event ledger treats RECEIVED replays as completed. A successor migration must preserve legacy records and foreign keys, expand these same tables, and add only customer-binding/subscription/service dependent records.

## External readiness

Stripe connector identifies PHI OS QA acct_1UFr0TBEKXJyHMkK, livemode=false. Live account acct_1Pkdz8B2F823WiPt is excluded from writes. Reading QA prices is provider verification, not evidence of checkout/payment/webhook delivery. No general Commerce authentication provider or publicly reachable QA deployment has been verified at discovery. Live deployment/payment activation remains NOT_EXECUTED.

## Sources

- https://docs.stripe.com/checkout/fulfillment
- https://docs.stripe.com/billing/subscriptions/webhooks
- https://developers.cloudflare.com/d1/sql-api/foreign-keys/

Historical schemas and checksums remain immutable. Cleanup must exclude canonical authorities, active assets, private books, review evidence and dependencies required by checks.
