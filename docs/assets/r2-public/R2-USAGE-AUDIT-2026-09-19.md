# R2 visual usage audit · 2026-09-19

The authenticated Cloudflare Objects API was read to the end of pagination (2 pages): **1,085 objects, including 1,000 images**. All 1,000 public image URLs returned a successful image response. No R2 objects were modified.

Open `R2-ALL-VISUAL-ASSETS-REVIEW.html` through the local review server (`node scripts/serve-book-v-pka-r1-review.mjs`, port 8788). The original unified review and Book V review now link to it. Each image has an intended use, current evidence, and a truthful consumption status. An HTTP response or source reference is not proof of production rendering.

## Applied changes

- Added the verified Maya and Early Byzantine case HERO objects to the existing Atlas bindings. All 391 present Atlas images are registered and decoded by the browser; 162 retain prior acceptance, 229 remain local-review candidates under the existing gate.
- Bound the uploaded Book VI–VIII Hero/branding assets in the current eight-volume registry and their correctly numbered physical covers in the book sample registry. Old numbered artwork was not substituted.
- Connected Book V's 50 uploaded free sample pages and summary figures 12E/12F to the existing sample reader. No canonical figure definitions or manuscript claims were invented.
- Connected 17 verified Commerce visuals to the existing account product selector. Missing imagery does not affect product selection; changing to a book hides the preceding product image. Checkout logic and authorization are unchanged.
- Added a direct Atlas `visual` selection for review links; choosing the supplemental image does not alter the historical state or Ask context.
- Preserved 12 missing Book I summary figure records and added an explicit unavailable message rather than attempting broken image requests.

## Coverage and limits

- 506 images have a traced binding or presentation consumer.
- 260 have current registry entries and intended uses but have not all been observed on their actual product surfaces during this audit.
- 229 Atlas images remain restricted to local review by the existing acceptance policy.
- 5 obsolete series/numbered assets are retained for historical use.
- All 1,000 images have a usage record; this is **not** a claim that all are already displayed in production.
- `images/civilization-atlas/reconfiguration/WORLD_RECONFIGURATION_SNAPSHOT_2026.webp` was absent from the complete bucket listing. The present `VIS-CIV-WS-2026-ATMOSPHERE.webp` is a different Book V image and was not substituted.
- The eight-volume series Hero is still not supplied by the current registry. The old seven-volume Hero is not a replacement.
- No commit, push, deployment, human approval, model activation, or payment was performed.

## Validation

- 1,000/1,000 public image HTTP checks passed.
- Atlas browser checks: 42 bilingual viewport/layer views and 391 actual image decodes passed; keyboard focus, expansion, context isolation and image outage fallback passed.
- New usage browser checks: 390/1440 layouts, Book V page 50, Book VI–VIII covers, both restored HERO images, direct image selection, and all 17 Commerce images passed. Commerce used the existing product registry with a signed-out fixture and disabled checkout.
- Book sample, eight-volume, Atlas activation and 15 Commerce machine test groups passed.
- Existing consolidated Book V review browser check passed with the current unresolved count.

## Reproduction

`node scripts/list-r2-public-assets.mjs` reads the existing Wrangler login (or `CLOUDFLARE_API_TOKEN`) and writes only object metadata. Credentials are never written to the repo.

`node scripts/audit-r2-bucket-coverage.mjs` verifies all current inventory images and repairs verified Atlas gaps. Then run `node scripts/build-civilization-r2-bindings-v2.mjs` and `node scripts/build-r2-usage-review.mjs`.

Browser check scripts use `PHIOS_PLAYWRIGHT_MODULE` to select the installed Playwright package. Evidence is stored beside this document and in the existing Atlas maintenance directory.
