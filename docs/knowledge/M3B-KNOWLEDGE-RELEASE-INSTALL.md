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

This locked response is intentional until the owner selects and configures a real payment provider.

## Content and payment blockers

- The canonical Manifest references a 462-page Book I source PDF, but that file is not present in the repository or supplied package.
- Therefore the preview is explicitly a registered-structure preview, not fabricated or verbatim manuscript text.
- Checkout does not accept money until the provider, merchant account, webhook secret, D1 purchase storage and receipt sender are configured.
