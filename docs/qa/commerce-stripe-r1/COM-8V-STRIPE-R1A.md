# COM-8V-STRIPE-R1A

Status: successor implementation and QA Preview available; publication source gaps and real Stripe E2E remain open. Human review is PENDING. LIVE = NOT_ACTIVATED.

Execution began on clean `main / 16a0ca903137fdd83cd31e639a119c8c5b3d3c48`. During work, main advanced to `58097bdf3d8377392f3cd3b9b61127c092e8f093` (`8 volume`); that commit was preserved. The QA candidate records this commit with `dirty=true` because it includes subsequent reviewed working-tree changes.

## Publication and commerce identity

The existing publication pointer selects `content/registry/successors/eight-volume-v1/`. Historical five-volume and seven-volume registries remain intact. Existing public loaders, Knowledge, search, homepage, Library, book pages, bilingual copy, visual bindings and Commerce are extended; no parallel runtime or authentication system is introduced.

| Current publication | Purchased-work product ID | MYR | Entitlement |
|---|---|---:|---|
| VI · 世界如何重组 / Reality Configuration | COM-BOOK-CONFIGURATION | 109 | BOOK_CONFIGURATION_FULL_ACCESS |
| VII · 世界如何被观察 / Reality Observation | COM-BOOK-06 | 59 | BOOK_06_FULL_ACCESS |
| VIII · 世界将如何继续 / Reality Navigation | COM-BOOK-07 | 59 | BOOK_07_FULL_ACCESS |

Product IDs and entitlement IDs preserve the work purchased. Historical orders, price IDs and private-source map keys for Observation and Navigation are not repurposed. Their QA Stripe display names and publication metadata were updated, and old numbered product images removed. Configuration has its own Test Mode product and price, independently read back. No new COM-BOOK-08 alias is inferred from the publication number.

Private delivery reuses `COMMERCE_BOOK_SOURCE_KEYS_JSON`, `BOOKS`, the existing watermark owner and download-token owner. `COM-BOOK-06` must still point to Observation; `COM-BOOK-07` to Navigation; `COM-BOOK-CONFIGURATION` requires its own approved source. Checkout rejects an unconfigured book source before creating an order or Stripe session. Static visuals contain no new price; the book page reads the Commerce catalog.

## Open publication inputs

- Book VI Part numbers/titles and canonical manuscript/source authority have not been supplied. It is registered with no invented Part assignment and `PENDING_USER_AUTHORITY`. Existing P1–P15 and canonical Node identities are preserved; P13 now belongs to Book VII, P14–P15 to Book VIII.
- Approved Book VI cover/branding, correctly renumbered VII/VIII cover/branding and eight-volume series hero are not supplied. These registry entries are explicitly unavailable. Old numbered covers are not substituted. Existing accepted Book I–V visual assets remain.
- The new manifest schema permits the explicit pending-source state; it does not assert content completion or production admission.

## QA environment

- Preview: https://ae325042.phios-github.pages.dev
- Deployment: `ae325042-43c3-42c1-92e4-013038e24113`; existing `qa` branch alias only.
- Account: PHI OS QA `acct_1UFr0TBEKXJyHMkK`, `livemode=false`.
- QA D1: `phios-runtime-sandbox`, `c2c6e313-9bc8-4fd4-89b1-36f3d764dad8`. Existing migrations 0001–0006 applied and read back; foreign keys clean, zero orders and entitlements at verification.
- Preview `STRIPE_SECRET_KEY` exists encrypted, and `STRIPE_ENVIRONMENT=QA` is set. No secret values are in this report or repository.
- Test Mode webhook destination: `we_1UGycRBEKXJyHMkKQ9I4HJAx`, `https://qa.phios-github.pages.dev/api/stripe-webhook`, API `2026-07-29.dahlia`. Its signing secret still needs to be configured in Cloudflare Preview as `STRIPE_WEBHOOK_SECRET`, followed by a Preview redeploy. Do not send it in chat.
- Existing Commerce verified-identity contract still needs an approved login provider. No hard-coded account or alternative Auth Runtime was created.
- Book private-source mappings/watermark delivery and Test Mode Customer Portal configuration remain prerequisites. Enable the existing QA gate only after these dependencies are checked.

## Verification

- `check-eight-volume-successor.mjs`: PASS, including schema, ownership, historical purchase identity, distinct book sources, exact QA price and unavailable visuals.
- `check-commerce-stripe-r1.mjs`: 15 groups PASS with all 25 products; SQLite and injected Stripe fixtures only.
- `check-eight-volume-browser.mjs`: 32 book page cases PASS (8 books × English/Chinese × 390/1440), dynamic prices, Parts, unavailable covers, catalog and search. No screenshots generated.
- Commerce browser and unified review: PASS; 239 actual target routes, comments/export and responsive behavior; no embedded media.
- Worker build: PASS, gzip 1,236,634 bytes.
- Remote Preview health: PASS_WITH_EXPECTED_CONFIG_GATES. Eight-volume registry and Configuration page return 200; 25 catalog products match the canonical registry; anonymous checkout returns 401; unsigned webhook returns 503 while signing-secret configuration is absent. No production redirects.
- Full repository validation is recorded separately in `eight-volume-validation.json`; corrected freeze checks retain explicit predecessor lineage rather than waiving drift.

These results do not prove Stripe payment, valid signed delivery, authenticated persisted entitlement, subscription lifecycle or Customer Portal E2E. All remain NOT_RUN. Do not label this release COM-STRIPE-R1-QA-ACCEPTED.

## Human review

Use `UNIFIED-HUMAN-REVIEW.html`: 239 per-interface/per-case comment entries, including the earlier HD Intake, Free/Full visual reports, Cross and PIS plus eight-volume pages. No decisions were automatically accepted. The earlier ECR rejection remains applicable until reviewed. The index links actual runtime pages and exports comments as one JSON; it contains no embedded screenshots, PDFs or report snapshots.

No Delta ZIP was produced. The isolated Preview deployment copy was deleted after upload. Production was not deployed and Live Stripe was not activated.
