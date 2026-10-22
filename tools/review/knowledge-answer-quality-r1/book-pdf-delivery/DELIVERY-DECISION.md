# English Books I–IV Master Work — PDF delivery successor

Owner decision: 2026-10-21. **Each of Books I–IV is sold separately in Chinese and English, RM89 per language. The purchased language must include the full PDF download from the personal library, with purchaser watermark and verified re-downloads. Whole-book website reading is a later extra, not a first-sale prerequisite.**

This supersedes a web-access-only delivery direction. Knowledge extraction, KIR/KAP answer admission and whole-book web reading remain separate projects and must not be treated as PDF-sale prerequisites. A completed private manuscript also does not by itself establish secure sale readiness.

## Actual implementation

The existing PWS Stripe product registry now defines eight independently identified products: `COM-BOOK-01-ZH/EN` through `COM-BOOK-04-ZH/EN`. Every price is MYR 8900 minor units. They use independent entitlement codes, immutable order source/language snapshots and one-language delivery. Historical work-only product IDs remain blocked for new checkout and hidden from the catalog; historical orders and records are not rewritten or deleted.

The existing Commerce checkout, account, watermark dispatch/callback, entitlement and download owners are reused. There is no new account, payment store, download-token system or permission owner. New-language checkout metadata binds SKU, book, language and source SHA. Webhook reconciliation rejects mismatches before granting. The existing schema's unique provider-price column prevents eight aliases reusing one stored price ID, so new QA language SKUs use the existing checkout inline price-data mechanism with the existing book product and exact MYR8900; no provider products/prices were created during this work. LIVE bindings remain absent and are not invented.

`COMMERCE_BOOK_SOURCE_VERSIONS_JSON` is a **server-only configuration proposal**, not deployed configuration. Each exact SKU maps to a verified private source binding/key, source SHA256, page count and byte size. English source bindings must be `MANUSCRIPTS` (the existing private manuscript owner), never a public URL or public bucket. Watermarked purchaser derivatives continue through the existing `BOOKS` private destination owner. No production value, R2 object, secret or permission was changed.

The checkout gate is closed by default. Readiness requires the explicit PDF checkout flag, private source head/size/SHA metadata, destination storage, access-token secret and watermark service configuration. These configuration checks are necessary but **not a substitute for separately proving the deployed watermark service's per-language contract**. Dispatch now conveys source binding/SHA/book/language/expected pages. Completion, entitlement readiness and download reject a derivative whose SKU, language, source SHA, purchase identity or page count mismatches the purchased snapshot.

Verified re-downloads use a new limited token from the existing account endpoint. The new-language GET also requires the same verified account, active/unexpired rights, matching paid purchase/order/environment, no refund/review block, ready watermark and the exact assigned private derivative path. Stolen tokens, wrong-language files and revoked/expired rights fail closed. The legacy download-token consumer now also checks entitlement expiry.

## Customer-facing changes

- Actual canonical details use `assets/js/pages/book-volume-seven.js`; Books I–IV now offer separate Chinese/English PDF choices at RM89, with personal-library/re-download copy and a notice when checkout is closed. Existing public previews, visual assets, reading sections and Atlas remain intact.
- The older `book-volume.js` consumer is kept consistent for its existing routes.
- The existing account Commerce section is labeled as the personal PDF library, identifies the language in the product name, offers full-PDF download and explains separate-language rights. Purchases remain disabled under current readiness gates.
- Product imagery reuses the existing base-book visual resolver for the language SKU, without creating another asset registry or changing R2 objects.

## Actual order audit — limited to what was read

Authenticated Wrangler performed read-only SELECTs against the currently configured production D1. `ACTUAL-ORDER-AUDIT.json` preserves query, timestamp and machine metadata: no commerce/order/purchase/entitlement tables were returned, `rows_written=0`, `changed_db=false`. Thus this database cannot currently contain orders in those absent tables. **Stripe account orders and other databases were not queried, so global “no real historical customers” is not claimed.** No legacy data or delivery branch was deleted. This check does not authorize production migrations; the missing Commerce schema is a release blocker.

## Source identification

`ENGLISH-I-IV-SOURCES.json` records the actual complete Desktop binaries, SHA256, byte sizes and pdfinfo. Book I is `PHI-OS-Book-I-en-v1.pdf` (Roman I), 290 pages / 158974339 bytes, SHA `e8a897419f77bf520a59913a3e14e153f59cb81af4990b661ff9598042f07c3d`. Its prior source authority is not duplicated or overwritten. Books II/III/IV retain the previously identified English versions: 295/262/353 pages and their exact hashes. No raw author PDF was made public or uploaded.

A Chinese source cross-check also found an important per-version gap: Desktop Book II is 232656639 bytes / SHA `312076cd9acf0bb5b1a87c88acfe26fa1c71a803029d56399300d3300458b260`, whereas the existing registered Chinese Book II is 105071786 bytes / SHA `1ae413dbfddae604f65af3e9b16a28a923899e3ebe8f419d9b7f3ff10bfa41fe`. The new Desktop identity is **not silently accepted or sold**. Confirm the intended Chinese Book II delivery version before configuring that SKU. Chinese I/III/IV match their current accepted binary hashes. The known Book III historical retrieval corpus mismatch remains an Ask/index issue and is not a reason to substitute its older PDF for the accepted current source.

## Zero-fee local evidence

- `FULL-AUTHOR-REGRESSION.json`: eight language-SKU synthetic full-PDF flows plus a real Book II English author-PDF flow. The actual 115568391-byte author source produced the purchaser-watermarked byte stream recorded in the receipt; **295/295 pages retained and watermarked**, original SHA unchanged. Source and derivative existed in memory only; no author PDF or full body was added to Git/public storage. The watermark processor was a real local Python PDF adapter behind the existing service contract, **not proof of a deployed production service**.
- Synthetic Stripe HTTP responses exercised the real Commerce checkout and payment-event reconciliation, local SQLite migrations, source selection, watermark dispatch, full response bytes, independent rights and re-downloads. No Stripe request was sent over the network and no real charge was made.
- `BROWSER.json`: Chinese/English ×1440/390, using actual account and canonical book-detail product modules with actual-handler synthetic account data. Language selection, RM89 copy, closed sale gate and SKU-specific download request pass. External images were blocked; this does not reaccept book-cover visuals or claim a real customer login.
- Existing catalog/report-language regression passes. The legacy M3B test passed before deliberate fresh-checkout retirement; in the final candidate it correctly conflicts with the new policy (409 instead of its frozen 201 expectation at line 203). The frozen assertion and historic receipts remain unchanged. Old download/record compatibility remains, but new legacy checkout is closed. The frozen `check-books-1-6-publication-commerce.mjs:46` fails `14 !== 6` because it requires one active work-only product per book; this is an **intentional successor-contract mismatch**, not a baseline PASS. The old test and receipt are retained. It must be reconciled with the accepted new language contract in a reviewed successor, not silently edited to manufacture PASS.

## Release state and remaining operations

SOURCE = LOCAL_CANDIDATE. LOCAL_SECURITY = PASS_DECLARED_TEST_SCOPE. DEPLOYED = NOT_DEPLOYED_BY_THIS_WORK. LIVE_CUSTOMER = RUNTIME_UNVERIFIED. **SALE_READINESS = NOT_READY.**

Before sale: confirm each intended private PDF version (especially Chinese II); prove actual private object bytes and bindings for all offered SKUs; validate the real watermark service's binding/SHA/language/page-preservation contract; configure the existing private derivative destination and LIVE provider bindings; separately review/apply missing existing Commerce migrations and release the reviewed source/configuration; perform bounded deployed account/entitlement/download checks under explicit authorization. No new migration was needed for the local language-SKU design itself, but existing production migrations are absent. None of these production actions was executed.

Full public web readers, AI book answering, embeddings and paragraph indexes are not on the first-phase PDF-sales critical path. Do not return to a “purchase only unlocks webpages” implementation.


## 2026-10-22 unified-source reconciliation (append-only successor)

The earlier “confirm Desktop Book II” sentence is historical. Author-current identity is now bound to SHA256 `312076cd9acf0bb5b1a87c88acfe26fa1c71a803029d56399300d3300458b260`. A fresh read-only GET of account `0b9f36bdf56f38d7d09aebe388f15204`, bucket `phios-private-manuscripts`, key `books/book-2/source/PHI-OS-Book-2-v1.pdf` produced the same exact bytes (394 physical pages). No R2 write occurred. Do not request the manuscript again. See `ADDENDUM-BOOK-II-VERSION-RECONCILIATION.json`.

The exact proposed `COM-BOOK-02-ZH` source is prepared for commercial release review, independently of knowledge admission. This does not deploy SKU configuration or activate sales. Historical corpus/accepted orders are not rebound. Seven additional actual author-source local flows passed (`ADDENDUM-SEVEN-AUTHOR-DELIVERY.json`); the existing English II 295-page proof is reused at its unchanged watermark/handler dependencies. The seven new sources retain and watermark all 2,566 pages; together the eight distinct language variants cover 2,861 pages, not eight real purchases. Page/watermark counts are machine checks, not complete visual reacceptance or proof of a deployed watermark service. Eleven new replay/order/token/source-failure edge checks are in `ADDENDUM-DELIVERY-EDGES.json`.

Production still lacks a proven BOOKS destination/watermark/LIVE SKU configuration and approved migration/deployment execution. The historical D1 query at 2026-10-21T10:20:14.982Z names `phios-runtime-production`; it did not preserve the account identifier, did not query Stripe or other databases, and is not a current global order-history reconciliation. No production reads of customer accounts were added in this continuation.
