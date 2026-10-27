# PHI OS — Seven Book Bilingual PDF Production Closure (24 Oct 2026)

**Status: PARTIAL / HUMAN_REVIEW_REQUIRED / NOT_LIVE_VERIFIED.**

This is an isolated candidate; do not merge, toggle production checkout, accept live payments, move private assets, or change existing purchaser entitlements on the strength of this document or of Stripe's active product flags alone.

## Evidence authority

- Code reviewed: `main` at `9e35d04ef98bd2a7e633887366e73e006370962c`.
- Current publication owner: `content/registry/current-book-architecture.json` -> `successors/eight-volume-v1`. Book VIII remains **not for sale**.
- User's private R2 screenshot establishes only one displayed key: `phios-private-manuscripts/books/book-7/en/PHI-OS-Book-7-en-v1.pdf`. It does **not** prove other 13 object keys, PDF content completeness, byte size, SHA, PDF readability, or successful book purchase.
- Connected Stripe **Live** account `acct_1Pkdz8B2F823WiPt` read-only inventory: 14 active independently priced English/Chinese Book 1–7 products; **0 webhook endpoints**; no verified book checkout or book fulfillment. Active Stripe catalog objects do not imply a working website sale.
- Private manuscript source binding must be separate from watermark/delivery destination (`MANUSCRIPTS` vs `BOOKS`); both are protected R2. Do not expose raw PDFs via public paths.

## Chinese canonical section audit baseline (NOT English PDF completeness results)

| Book | Part | Registered Chinese source unit count | Authority | Notes |
|---|---|---:|---|---|
| I | P0+P1–P4 | 274 sections (+1 front matter) | `content/knowledge/manuscripts/extraction/book-1-v3-full-section-inventory-v1.json` | P0=12, P1=28, P2=49, P3=104, P4=81; extraction segments, not one-to-one numbered chapters |
| II | P5–P7 | 172 sections (+1 front matter) | `.../extraction/book-2-full-section-inventory-v1.json` | P5=66, P6=49, P7=57; extraction review pending |
| III | P8–P9 | 103 sections (+1 front +2 part intros) | `.../extraction/book-3-full-section-inventory-v1.json` | P8=60, P9=43; extraction review pending |
| IV | P10–P11 | 125 final chapters | `.../extraction/book-4-final-section-inventory-v1.json` | P10=79, P11=46; old outline-only `10.69` and `10.70` explicitly not in final Chinese PDF; do NOT count as English omissions |
| V | P12 | 126 source sections | `content/books/book-5/source/final-manuscript-structure-v1.json` | `B5-S001..B5-S126` source locators; body does not print `12.x` identifiers; assess headings by order/meaning |
| VI | P13 | 85 chapters | `content/registry/successors/eight-volume-v1/book-6-manifest.json` | `13.1..13.85`; English **titles** exist in manifest, not the full English text |
| VII | P14 | 100 nodes | `content/knowledge/book-vii/registries/book-vii-observation-science-node-registry-v1.json` | `14.1..14.100`, Chinese heading metadata only; English text not verified; historical book-7 publication manifest still says architecture-only |

**No English missing-chapter claim is defensible without downloading and reading each English PDF and pairing its actual content against the registered final Chinese baseline.** A raw count, Stripe item, translated title, R2 HEAD, or an uploaded cover screenshot cannot establish semantic completeness. Normalize chapter title wrapping and alternate typography; distinguish content missing, reordered, merged, duplicated, and source intentionally excluded.

## Live Stripe SKU identity mapping confirmed read-only

Live SKU naming is `COM-BOOK-{1..7}-{EN|ZH}` (un-padded), unlike historical QA IDs `COM-BOOK-0{1..4}-{EN|ZH}` and legacy work-based IDs. New SKU and historical purchase rights must coexist. Exact verified existing Live Stripe products and prices are recorded in `functions/pws/commercial/stripe-product-registry.js` as `liveBookPdfListings`; no new Stripe Product/Price creation is necessary.

- Books I–IV: MYR 89 per language.
- Books V–VI: MYR 109 per language.
- Book VII: MYR 59 per language.
- Book VIII: no sale/checkout and no product activation.
- Prior purchased Book I Chinese PDFs and old work-level entitlements remain supported. Do not grant the other language by reinterpreting an old entitlement.
- **Delivery-product wording decision to reconcile:** Live SKU metadata expressly sells a language-specific `PDF_DOWNLOAD`; historical project notes also describe purchased whole-book web reading for some books. Do not silently remove either an accepted existing purchaser right or promised feature.

## Changes in this isolated candidate

1. Register 14 genuine Live product/price IDs under separate language-specific IDs. Do not rename historical work-based SKU IDs.
2. Hide legacy Book V–VII work-only IDs from new purchases; preserve read paths for existing orders. Keep QA padded language SKU independent of Live unpadded SKU.
3. Extend strict private PDF source identity checks to Books I–VII; require version-specific R2 SHA, bytes, pages and object metadata.
4. Charge exact registered Live Stripe Price per edition; preserve historical QA inline-price fixtures. Verify matching provider Price, Product, language/order metadata and paid amount on webhook.
5. Broaden licensed-watermark download path allowlist without allowing source/master manuscript paths or cross-account downloads.
6. Keep `PHIOS_COMMERCE_LIVE_ENABLED` and `PHIOS_BOOK_PDF_CHECKOUT_ENABLED` off until every product passes read-only R2 and paid-delivery evidence.

## Required gates before declaring PRODUCTION_CLOSED

1. **Read R2 bytes, not only screenshot.** For each 14 versions record actual binding, private object key, byte size, SHA-256, pages, PDF opening/extractability and immutable publication version. Confirm appropriate R2 `customMetadata.sourceSha256`; adding missing metadata needs controlled upload of metadata / explicitly versioned replacement, not a silent content change.
2. **English vs Chinese chapter-by-chapter audit.** Extract all seven real English PDFs. Generate `(book,Chinese code/title,English page/heading,match type,missing/duplicate/reorder,semantic acceptance)` row for every final Chinese source section. Do not treat draft outlines or typography as omissions. Human review every uncertain translation alignment. Refuse publication if substantive gaps remain.
3. **Server binding.** Bind `MANUSCRIPTS` to correct private manuscript R2 bucket; `BOOKS` to private delivery/watermark R2; use `COMMERCE_BOOK_SOURCE_VERSIONS_JSON` with 14 verified source identities. Never guess Chinese paths or PDF hashes from filenames.
4. **Webhook end-to-end.** Stripe Live currently lists **zero webhook endpoints**. Provision one verified `/api/stripe-webhook` endpoint and matching deployment secret only after the target Pages Worker release is approved. Test signed `livemode=true` events and required types, duplicate deliveries, async payments, paid vs unpaid, refunds, and failure recovery. Test mode must never authorize a Live entitlement.
5. **Watermark + library.** Check genuine watermark worker, output metadata, per-language filename, owned purchaser identity, secure token expiry/uses, download audit, and repeat download after entitlement lookup. Wrong account/language, unpaid order, refund, wrong SHA, tampered URL, source PDF, cross-environment purchase must all fail.
6. **Real customer purchase.** First perform full local and QA dry-run, then an explicitly approved low-risk Live purchase with real authenticated first and second purchaser; reconcile Stripe event, D1 purchase/entitlement, R2 watermarked object, private library and correct Chinese/English PDF. Record receipt, refunds/failures without exposing personal data.
7. **Production release boundary.** Verify Cloudflare Pages deployment triggers, current commit, production `READ_ONLY` controls, migration state, backup/rollback, both screen languages, mobile/desktop, actual GET/POST behavior and customer support fallback. No direct force-deploy / mass activation based on a local PASS.

## Explicit stop conditions

No activation while any source content is unverified, any edition has an unregistered private source, Webhook is absent, watermark output is unavailable, Live Price is unmatched, download identity fails, or Page/D1 production migration is unknown. Draft PR alone is not production closure.
