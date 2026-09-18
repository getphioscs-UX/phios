# COM-STRIPE-R1 Remote QA

State: ACTION_REQUIRED_BY_USER — Checkpoint A. REAL_STRIPE_E2E = NOT_RUN. LIVE = NOT_ACTIVATED.

Preview: https://b13f8e67.phios-github.pages.dev

Commit: eea35d26626ebdb29548fe62b8fce5c3eab26eb7; deployment: b13f8e67-f258-4b23-bc37-88892328c2f5; project phios-github; branch qa. Deployment used existing Wrangler authentication after GitHub branch update returned 403. Production was not deployed. Local main remains unchanged.

Checkout: /api/commerce-checkout
Webhook: /api/stripe-webhook

Preconditions: registry, checkout, signed webhook, order, entitlement, bundles, subscription, service fulfillment and idempotency implemented. Existing full npm precheck/check/postcheck PASS, 15 machine groups PASS; these are not real Stripe E2E.

Health: PASS_WITH_EXPECTED_CONFIG_GATES. GET / → 200; GET /api/commerce-catalog → 200; POST /api/commerce-checkout → 401 commerce_authentication_required; GET /api/stripe-webhook → 405 method_not_allowed; POST /api/stripe-webhook → 503 stripe_webhook_not_configured. A configured-handler 503 confirms the webhook Function exists; signature verification has not yet been tested remotely.

Configure encrypted STRIPE_SECRET_KEY in Cloudflare Pages → phios-github → Settings → Variables and Secrets → Preview, using the PHI OS QA test key. Set plain STRIPE_ENVIRONMENT=QA. Never send secret values in chat. Await user confirmation before real Stripe network E2E.

Subsequent dependencies: signing secret for this Preview destination, approved canonical account authentication, QA D1 migrations, explicit QA enable gate, private book fulfillment and Test Mode Portal configuration. Commerce currently requires trusted server identity; no general login provider is connected. No hard-coded identity or parallel auth runtime was introduced.

All report/bundle/book/subscription/portal/service/replay/refund/failure and signature E2E results remain NOT_RUN. No Stripe account API was called in this phase.

## Preview redirect repair

The existing Cloudflare Bulk Redirect list getphios_pagesdev_canonical incorrectly included subdomains. Include subdomains is now off; base-host production redirect, path and query preservation remain unchanged. Real Preview requests no longer redirect to Production. See remote-qa-operations.json.

## Checkpoint A recheck

User confirmation received, but Pages API and Dashboard both show Preview missing STRIPE_SECRET_KEY and STRIPE_ENVIRONMENT. The Dashboard defaulted to Production, where both names are present as encrypted variables. No secret value was revealed and no Production configuration was changed. Await corrected Preview configuration; real E2E remains NOT_RUN.

## Preview environment flag configured

STRIPE_ENVIRONMENT is now saved as plain_text QA in the existing Preview environment and added to wrangler.jsonc env.preview.vars. Readback confirmed the encrypted STRIPE_SECRET_KEY remains present. No Production configuration or secret value was changed. Configuration checkpoint A is complete; runtime activation after redeployment and actual QA-account validation remain pending.
