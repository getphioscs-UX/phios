# Pages Preview: Book I only

Requested reference: `5e877958295c40b3df9b0d504cf7db865f184f20`. Actual clean checkout when this patch began: `7925b8c2`; no history reset was performed.

`wrangler.jsonc` preserves every top-level production setting and adds `env.preview` for **all Pages Preview deployments**, not only a `qa` branch. AI is explicitly retained. RUNTIME_DB uses sandbox D1 `c2c6e313-9bc8-4fd4-89b1-36f3d764dad8`; BOOKS uses `phios-private-books-sandbox`. No MANUSCRIPTS binding is inherited into Preview. Any manuscript-dependent flow needs a separately provisioned private sandbox manuscript bucket; it is not a Book I commerce prerequisite. See [Cloudflare Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) for environment-specific bindings.

Only the existing Book I object `books/book-one/PHI-OS-Book-I-v2` is required. `BOOK_ONE_SOURCE_KEY` resolves it without duplicating the PDF. Production without an override retains `private/books/book-one/zh-Hans/book-one-v1.pdf`. Readiness and persisted watermark jobs share this resolver. Purchaser download remains limited to the watermarked destination object, never the raw source. Existing watermark jobs retain their captured source key.

Preview starts with `PHIOS_ENVIRONMENT=qa` and sales disabled until its secrets, webhook, source checksum, watermark service and test receipt recipient are configured. No Books II–VII or subscription checkout is enabled. Book I remains MYR 89.00 / 8900 minor units. Preview URLs must be supplied after deployment; no production fallback is permitted.

## Follow-up: Seven-book Stripe Catalog Binding

After Book I Sandbox E2E passes, explicitly review binding the seven-book catalog. Supplied Book I catalog references are `BOOK_I_STRIPE_PRODUCT_ID=prod_VGNrkqQT5jOa8O` and `BOOK_I_STRIPE_PRICE_ID=price_1UFr6EBEKXJyHMkKNFEDlDg5`. These are recorded references only: current Checkout continues using inline `price_data` and its existing price authority. Their Sandbox account membership has not been verified here.

Real checkout → Stripe → webhook → account → entitlement → watermark → receipt → download remains `BLOCKED_PENDING_QA_DEPLOYMENT`. Local mocked payment checks do not count as real E2E. No secrets were requested, committed or provisioned.
