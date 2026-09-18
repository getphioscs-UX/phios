# COM-STRIPE-R1 final delivery

Baseline: **aacfba0425cdc37f9b69a1bdc958b0e9bfef6420**, branch main, initially clean.

**COM-STRIPE-R1-IMPLEMENTATION-ACCEPTED** — local implementation, machine and mock acceptance only.

**REAL_STRIPE_E2E = NOT_RUN — QA credential / deployment dependency**. **LIVE = NOT_ACTIVATED**. Human review remains **PENDING**. This is not COM-STRIPE-R1-QA-ACCEPTED.

## Delivered implementation

- 24 user-approved products/prices: 9 reports, 3 bundles, 7 books, membership, will writing and 3 services. QA IDs were read back from PHI OS QA through Stripe MCP; no products or prices were created or changed. Live mappings remain null. `stripe-product-registry.json/.md`, schema and provider readback record the matrix.
- Existing PWS Commercial authority exposes the additive Stripe registry. Bundle selection reads its existing eligible standard-report registry, enforces distinct counts, excludes HD/Cross/Financial and grants separate selected-report rights. Bundle never grants Cross.
- Existing Stripe fetch adapter creates canonical-price Checkout Sessions, reuses the server-bound Stripe customer, uses dynamic payment methods, pins QA API version, checks the QA account, rejects live keys/objects, and keeps idempotency stable.
- Authenticated successor endpoints use the existing trusted account context. No new Auth/Customer runtime, guest mechanism or application test account. No secret values were written into the repo.
- Orders extend `commerce_checkout_attempts`; paid purchases, receipts and rights use `commerce_purchases`, `commerce_receipts` and `digital_entitlements`. Migration 0006 preserves existing rows and foreign keys and adds only customer binding, subscription and service dependent records. Original migrations 0001–0005 remain unchanged.
- The existing `/api/stripe-webhook` verifies the raw body. RECEIVED/PROCESSING/failed events can retry; completed and terminal events do not re-grant. Atomic purchase/receipt/rights mutations and unique per-purchase entitlement codes prevent duplicate bundle grants. Unknown/mismatched provider data is review-required. Temporary failures return a retryable non-2xx response.
- Subscriptions retain paid-through and current-period boundaries, cancel-at-period-end and last invoice. Access requires a verified paid invoice and current active status; expiration is checked when projecting access. Creation alone never grants membership, and past-due/unpaid/canceled states deny access without an invented grace period.
- Financial Report follows the existing professional report/intake owner. Will writing and services create INTAKE_REQUIRED fulfillment. Cash Flow Game is one 120-minute session; Natural Healer is 60 minutes with modality UNDECIDED. No service is marked completed by payment.
- Protected book fulfillment reuses private BOOKS, watermark jobs/callback and token delivery. Books II–VII require approved deployment source mappings; no paths or previews are invented. New account-owned download requests authorize the canonical owner and reuse the existing secure download endpoint. Legacy Book I remains supported.
- Refunds persist amount/time and require review for successor rights because no blanket revocation policy was approved. Legacy Book I retains its existing revocation policy. Returning to either new or legacy success/status pages cannot create a purchase or entitlement.
- Existing Account page now groups My Reports, My Books, Membership and My Services and provides a compact product/category selector. Prices come from the server registry. The page remains closed for purchase when QA configuration is absent.

## Endpoints and owners

| Entry | Purpose |
|---|---|
| GET /api/commerce-catalog | Public canonical customer projection; no price IDs or secrets |
| POST /api/commerce-checkout | Same-origin, authenticated, canonical product checkout |
| POST /api/stripe-webhook | Existing signed provider event entry |
| GET /api/commerce-order-status | Read-only own-order status |
| GET /api/commerce-account | Persisted own purchases/rights/subscription/service projection |
| POST /api/commerce-portal | Server-bound own Stripe Customer Portal |
| POST /api/commerce-book-download | Own ready book → existing bounded download token |
| /api/book-one-download; /api/book-one-watermark-complete | Existing protected delivery owners reused |

The established report production admissions still apply after purchase. A paid entitlement does not create a report, bypass HD/Profile/Cross publication review, complete a professional service, or sign a legal document.

## Validation

- Full `npm run check`, including precheck/check/postcheck: **PASS, exit 0** (`npm-run-check-current.log`). Earlier runs exposed historical fixed-five-migration assertions; current checks now recognize migration 0006 while preserving historical evidence. `check-repair-history.json` records repaired runs.
- Commerce campaign: **15 machine groups PASS**, including all 24 mappings, bundle boundaries, identity/origin/tamper rejection, paid-only rights, duplicate/concurrent callbacks, PI/Checkout double-notification, RECEIVED recovery, temporary DB failure/retry, subscriptions, refunds, services, protected book ownership and unknown-order review. `machine-results.json` / `machine-check.log`.
- Legacy Book I payment, watermark, download and refund regression: **PASS** (`legacy-book-regression.log`).
- Immutable migration checks and legacy populated-row preservation: **PASS** (`migration-check.log` and campaign).
- Account browser checks: **MOCK_ACCEPTED**, English/Chinese at 390/1440, dynamic product selection and prices, service duration, keyboard, no overflow, reload and failure/cancel presentation. These are mock customer fixtures, not real Stripe acceptance.
- Lightweight review browser checks: **MACHINE_TESTED**. All 230 actual interface/case targets return HTTP 200; no embedded media; mobile layout, comment persistence and single JSON export pass. Target HTTP checks do not establish human acceptance or real Stripe E2E.
- Pages Functions build: **PASS**, check-only; no deployment. See `pages-build-check.log` for final bundle size.

## One final human-review HTML

Open **UNIFIED-HUMAN-REVIEW.html**. The lightweight index opens actual local/Preview interfaces and synthetic cases (230 entries), with per-item comments and a single JSON export. No embedded screenshots, report copies or base64 image payloads. Start the candidate server or set its Preview URL before opening interface links. Original ECR rejection and production admission gates remain.

No human ACCEPTED decision is inferred from tests or exports. PIS, HD Intake, Visual Report, Bundle and Cross reviews remain together for the user's final comments.

## Cleanup and remaining external dependencies

Deleted **760 generated review/cache/archive files / 461,553,839 bytes** in total (including 412 review images/PDF exports and obsolete delivery archives). Review-only screenshots and synthetic PDF exports are retired at the user’s explicit request; see review-artifact-deletions.json and cleanup-manifest.json for exact deletion counts. Registered assets, runtime data, fixtures and historical decision metadata remain. Screenshot generation is opt-in and generated captures are ignored by Git.

No real Checkout payment, webhook delivery, authenticated cross-session entitlement persistence, subscription lifecycle E2E or Customer Portal E2E has run. The user explicitly confirmed the missing QA identity and secrets. Follow **COM-STRIPE-R1-REAL-E2E-READINESS.md** / `real-e2e-readiness.json` once those dependencies are supplied. Do not use getphios.com as QA. `docs/commerce/stripe-live-cutover-r1.md` is prepare-only.

Changed/additional/deleted files are listed in `changed-files.json`. The Delta ZIP includes source changes, QA evidence and an explicit deletion manifest; it contains no `.dev.vars`, credentials, dependency tree or local caches. No commit, push or deployment was performed.
