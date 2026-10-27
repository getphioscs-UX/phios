# EBOOK_WATERMARK_QA_TARGET — configuration candidate, not provisioned

Status: CLOUD_WATERMARK_QA_AWAITING_AUTHORIZATION. No production resource is an acceptable fallback.

## Actual source trace

1. Verified synthetic payment → `commerce_purchases` / `digital_entitlements`, in the existing order owner. Browser success is not authority.
2. `book-product-registry.js` resolves the order-pinned `bookPdf`: product/language, binding, key, source SHA, byte size, ETag, page count. Source HEAD disagreement fails closed.
3. `book-commerce-store.js` creates the purchase-bound encrypted watermark job and destination key; historical purchase/file identity remains immutable.
4. `book-delivery.js::dispatchWatermark` uses `BOOK_WATERMARK_SERVICE_URL` and `_TOKEN`, POST `/jobs` with timestamp + HMAC. No Queue binding or remote PDF processor implementation was found in this dispatch path. METHOD_REPORT_RENDERER is not a watermark processor.
5. The processor must read the exact private source, verify SHA/pages, use the existing local PDF stamping adapter, inspect the full output, then call `writeVerifiedWatermarkArtifact` to atomically persist bytes with trusted identity metadata.
6. Required metadata: `productId`, `language`, `sourceSha256`, `purchaseId`, `pageCount`, `artifactSha256`. Object size must match actual bytes. Conditional create prevents concurrent overwrite; replay compares all required metadata and bytes identity.
7. Callback `/api/book-one-watermark-complete` validates 300-second HMAC, resolves the job/purchase, then verifies destination HEAD/metadata before completed state. An uploaded object alone is insufficient.
8. Download grants are owner-bound, expiring and use-limited. Re-download rechecks rights. Pending watermark never yields the raw source. Refund/revocation blocks subsequent access.

## Located blockers, separated by component

- Historical discovery receipt found watermark URL/token/source-version configuration absent. It is inherited metadata-only evidence, not a new cloud read.
- Historical sandbox roundtrip reached the callback but lacked trusted object identity metadata; HTTP 409 was a metadata-writer failure, not proof that file size alone caused the failure.
- The current local trusted-metadata writer closes that failure for the actual 264-page source: 21 checks and callback HTTP 200, no remote upload.
- No established isolated QA `/jobs` processor with this writer, a capacity contract, and independent QA D1 identity is proven. That is the remaining cloud execution blocker.
- Source-specific peak memory previously measured about 361 MB. This does not establish Pages Worker capacity and cannot justify embedding the full stamping operation in a synchronous Worker request.

## Single proposed execution target

| Component | Proposed value / requirement |
|---|---|
| QA application | Existing intended `getphios-qa`; identity/configuration must be independently verified |
| Gateway | Proposed `phios-book-watermark-qa`, authenticates existing `/jobs` contract only |
| PDF processor | Existing Python `pdf-fixture.py stamp` adapter in one isolated QA processor; deployment/runtime not provisioned |
| Call mode | POST `/jobs` returns 202; existing DB job state owns recovery; no second commerce store |
| Queue | Not present in current source contract. A QA-only durable worker invocation/queue must be established before cloud execution; this document does not invent a live binding |
| Source | Exact read-only Book III EN SHA `871805a46df701d78a121cbb5cff606df80e2097def38684e88a89c609ad796e`, 75,712,797 bytes, 264 pages |
| Destination | Intended `phios-private-books-sandbox`, synthetic `private/books/com-book-3-en/watermarked/{purchaseId}.pdf` only; provisioning/access unverified |
| QA DB | A separately identified QA D1; never production RUNTIME_DB |
| Callback | `https://getphios-qa.pages.dev/api/book-one-watermark-complete`, existing HMAC contract |
| Secrets | Fresh QA-only `BOOK_WATERMARK_SERVICE_TOKEN`, `BOOK_ACCESS_TOKEN_SECRET`; restricted source-read / destination-write credentials as needed; never copied production values |
| Configuration | QA origin, exact source-version JSON, isolated BOOKS destination and MANUSCRIPTS source bindings; sales disabled; no Live Stripe keys |
| Proposed capacity | 100 MiB source cap, 1 GiB processor memory reservation, concurrency 1, 300-second processing deadline, 15-second dispatch acknowledgement timeout. These are candidate limits, not measured cloud guarantees |
| Retry | Same job ID and pinned source version; bounded three automatic attempts with backoff; existing completed/processing states prevent duplicate dispatch. An operational stale-processing lease/recovery proof is still required before provisioning |
| Callback recovery | Retain completed artifact; retry signed callback for same job. Never regenerate a different customer artifact or overwrite on metadata conflict |
| Output checks | Exactly 264 pages, every page stamped, parseable PDF, bounded size, output digest and pinned source digest; reject partial output |
| Cost | Local synthetic processing only this run. Cloud resource tariff/maximum spend not established; cost cap and approval are prerequisites |

## Authorization entry conditions

Founder must approve the exact QA service/runtime, independent QA DB, destination bucket identity, narrowly scoped access, secrets and a bounded cloud processing budget. Then separately authorize provisioning/deployment and one exact source/task trial. No such authorization is inferred here.

Do not point this target at production, borrow Live Webhook configuration, create a production watermark task or modify an accepted source object. Preserve historical failed callback evidence.
