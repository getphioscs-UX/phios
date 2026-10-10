# Independent QA deployment contract

Target project: `getphios-qa`; target origin: `https://getphios-qa.pages.dev`. It is not deployed. Every checkout → Stripe → webhook → account → entitlement → watermark → receipt → download stage is `BLOCKED_PENDING_QA_DEPLOYMENT`.

Do not deploy using the root production `wrangler.jsonc`. The contract is intentionally not an executable deployment configuration: its D1 resource ID and service identities are not yet available. The operator must create the independent project/resources, then generate a separate QA configuration with the actual QA IDs and the binding names from `environment-contract.json`. Preserve `db/migrations` and apply migrations to the sandbox D1 only. Start with sales disabled.

Before enabling Sandbox checkout, verify: distinct D1 ID; private sandbox BOOKS and MANUSCRIPTS buckets with public access disabled; source PDF checksum and licensed QA source object; sandbox watermark service; Stripe Sandbox account/products/prices; QA-only webhook destination; independently provisioned webhook/access-token/service secrets; blank test account; allowlisted test receipt recipient. Set secrets using the hosting provider's secret interface, never in committed configuration or chat.

Run `node scripts/check-qa-deployment-readiness.mjs` for offline contract/target rejection checks. This does not inspect Cloudflare resources, verify secret independence, send email or run E2E. Deployment operator evidence must identify the deployed commit, actual resource IDs, sandbox account, migrations and private-access settings without exposing secrets. The current checker does not authorize deployment or mark E2E passed.

Once the user supplies the real deployed QA URL, verify its isolation before executing fixtures. Require `requireQaTarget` at every future E2E harness entry point; never substitute production. Bind acceptance to the exact deployment. Verify retries/webhook replay/idempotency, wrong-account denial, token expiry, watermark failure/retry, receipt-recipient confinement, and authenticated download before recording PASS. Any missing stage remains blocked. Production cutover is separate.
