# Commercial / transaction readiness — no real transaction executed

STRIPE_SANDBOX_CONFIGURATION_REQUIRED. Existing repository bindings and historical read-only receipts do not prove a connected current Sandbox.

The isolated combined registry retains 14 language-specific Live edition identities (seven books × EN/ZH), QA-only historical edition rows, original historical work IDs and no active Book VIII checkout. The candidate does not change report prices, ECR RM129/RM139, USD6 total method cap or four report follow-ups. It preserves main's standalone Profile retirement, language-independent Tarot/I Ching and monthly refill blocker.

Current local checks exercise signed synthetic events, event-ID replay, duplicate payment handling, purchase-bound watermark jobs, HMAC dispatch/callback, metadata conflict, bounded downloads, cross-account denial, callback retry and synthetic refund revocation. Events shaped as Live mode in an isolated in-memory fixture are not Stripe Sandbox or Live transactions. No Stripe API call is made.

The real source path uses verified webhook fulfillment, not the payment-success page. Existing `sendReceiptAndDelivery` resolves paid purchase/delivery information through the existing receipt/email path; a local successful callback or console event does not certify an actual emailed receipt or a legally compliant tax invoice. Live email and invoice delivery remain NOT_RUN.

## Founder minimum setup before a later transaction QA

1. In the Stripe Dashboard environment selector, create/select a separate Sandbox for this integration; do not switch the test to Live as a workaround.
2. Supply/authorize appropriately restricted Sandbox API access; do not paste secret values into review evidence.
3. Create/verify Sandbox Product/Price mappings for the same seven-book language identities and report presentation variants. Existing Live Price IDs cannot be used as Sandbox IDs.
4. Configure a Sandbox webhook destination at the isolated QA application's existing `/api/stripe-webhook`; verify the endpoint's own signing secret and required checkout/payment/refund event handling.
5. Bind only QA DB/buckets/origin and disabled-by-default sales flags; verify that the watermark processor and callback operate in that same isolated environment.
6. Separately authorize the bounded test checkout/payment/refund sequence. No real charge/refund is authorized by this local work order.

Release checks still required: exact metadata source/file version propagation, callback retry under outage, Sandbox-to-Live separation, expired/refunded rights, original-order source pin, actual receipt transport, current deployment identity and consented customer browser proof.

This follows the invoked Stripe best-practices skill. No API upgrade, Dashboard mutation, secret mutation, payment or refund was performed.
