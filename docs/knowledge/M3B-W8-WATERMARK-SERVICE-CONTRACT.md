# M3B-W8 Purchaser Watermark Service Contract

## Purpose

Generate one purchaser-specific PDF outside the Cloudflare Pages request
memory boundary. The complete 109 MB source must remain in private R2.

## Job request

PHI OS sends `POST {BOOK_WATERMARK_SERVICE_URL}/jobs` with:

```json
{
  "jobId": "wm_...",
  "sourceObjectKey": "private/books/book-one/zh-Hans/book-one-v1.pdf",
  "destinationObjectKey": "private/books/book-one/watermarked/pur_....pdf",
  "watermark": {
    "purchaserEmail": "buyer@example.com",
    "purchaserName": "Buyer name",
    "receiptNumber": "PHI-2026-...",
    "purchaseId": "pur_...",
    "notice": "Licensed to the named purchaser for personal use only."
  },
  "callbackUrl": "https://phios-github.pages.dev/api/book-one-watermark-complete"
}
```

Headers:

```text
X-PHIOS-Timestamp: Unix seconds
X-PHIOS-Signature: lowercase hexadecimal HMAC-SHA256
```

Derive the HMAC key as
`SHA-256("phi-os:watermark-service:v1:" + BOOK_WATERMARK_SERVICE_TOKEN)`,
then sign the UTF-8 string `timestamp + "." + exactRawJsonBody`. Reject
timestamps more than 300 seconds from the service clock.

The service should return `202 {"status":"processing"}` or, when the destination
object already exists, `200 {"status":"completed","destinationObjectKey":"..."}`.

## Required PDF treatment

- Add a visible, low-opacity watermark containing purchaser identity and
  receipt number on every page.
- Add the purchase ID and personal-use licence notice to document metadata.
- Preserve page count and readable quality.
- Never overwrite the source object.
- Never create a public R2 URL.
- Write only to the destination key assigned by PHI OS.
- Delete temporary plaintext files after the job completes.

## Completion callback

Call `POST /api/book-one-watermark-complete` with the same timestamp/signature
scheme:

```json
{
  "jobId": "wm_...",
  "status": "completed",
  "destinationObjectKey": "private/books/book-one/watermarked/pur_....pdf"
}
```

For failure:

```json
{
  "jobId": "wm_...",
  "status": "failed",
  "errorCode": "normalized_non_sensitive_code"
}
```

PHI OS verifies the callback, confirms that the exact destination exists in
private R2, activates download readiness, and then sends the receipt and
delivery email.
