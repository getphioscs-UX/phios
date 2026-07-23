# M3B Knowledge Release — Install and Verify

## Install

Extract the ZIP over the repository root in Visual Studio Code. Preserve the folder structure and allow these new M3B files to be added.

This package does not change the existing `RUNTIME_DB` binding or Runtime D1 migrations.

## Verify

```powershell
npm run check:m3b-knowledge-release
npm run check
```

After GitHub Desktop pushes the commit and Cloudflare Pages deploys, check:

```powershell
Invoke-WebRequest "https://phios-github.pages.dev/library"
Invoke-WebRequest "https://phios-github.pages.dev/book-one"
Invoke-WebRequest "https://phios-github.pages.dev/book-one-preview"
Invoke-WebRequest "https://phios-github.pages.dev/figures"
Invoke-WebRequest "https://phios-github.pages.dev/glossary"
Invoke-WebRequest "https://phios-github.pages.dev/read/book-one/"
Invoke-RestMethod "https://phios-github.pages.dev/api/book-one-access" |
  ConvertTo-Json -Depth 5
```

Expected access response:

```json
{
  "success": true,
  "productId": "phios-book-one",
  "purchaseState": "not_purchased",
  "accessGranted": false,
  "accessConfigured": false,
  "reason": "production-commerce-not-configured"
}
```

This locked response is intentional. Stripe Malaysia is selected, but checkout
must remain disabled until the production prerequisites are configured.

## Content and payment blockers

- The supplied 48-page free-preview PDF is rendered as 48 WebP page images.
- Neither the supplied preview PDF nor the complete Book I PDF is deployed as a public download.
- The complete 109 MB Book I file still needs private authenticated delivery.
- Checkout does not accept money until Stripe credentials, verified webhooks,
  D1 purchase storage, private delivery and receipt sending are configured.

## Preview acceptance

After deployment, open:

```text
https://phios-github.pages.dev/book-one-preview
```

Confirm page 1 and page 48 load, the bilingual directory changes language,
Previous / Next navigation works, and a refresh preserves reading progress.
