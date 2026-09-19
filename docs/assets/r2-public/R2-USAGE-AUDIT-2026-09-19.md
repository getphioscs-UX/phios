# R2 visual usage audit · 2026-09-19

The latest authenticated, fully paginated inventory contains **1,097 objects, including 1,012 images**. Public image checks cover all 1,012; per-object timestamps distinguish the initial audit from incremental GET checks.

Open [all R2 visual assets](R2-ALL-VISUAL-ASSETS-REVIEW.html) or the [original 260-image display checklist](R2-260-DISPLAY-CHECKLIST.html) through the local review server on port 8788. The checklist includes previews, exact keys, public URLs, intended uses, observed pages and a [CSV export](R2-260-DISPLAY-CHECKLIST.csv).

## Atlas acceptance and 2026

All **392 Atlas images** have verified delivery and accepted bindings: 162 previously accepted images plus the owner's explicitly accepted original 229 pending images and newly uploaded 2026 reconfiguration image. The owner declaration is separate from browser evidence and scoped by asset ID and SHA-256; unknown future images do not inherit it.

Maya and Early Byzantine HERO images and `images/civilization-atlas/reconfiguration/WORLD_RECONFIGURATION_SNAPSHOT_2026.webp` are present. The 2026 image is selectable in the existing Atlas reference library, labelled as Book VI. This does not create Book VI chapters or historical facts from illustration text.

The original freeze record is preserved. A dated maintenance successor records the accepted bindings, URL selection and verified-delivery enforcement. The earlier review page now shows current image acceptance instead of requiring another image approval.

## Original 260-image cohort

The original cohort is preserved in `r2-260-display-verification-queue-v1.json`. Browser evidence is in `r2-260-display-results-v1.json`.

| Result | Images |
| --- | ---: |
| Actually displayed and decoded on tested local pages | 26 |
| Browser icon link observed (not page-image proof) | 2 |
| Interactive/report flow still needs display verification | 127 |
| Not observed on the pages tested | 105 |
| Total | 260 |

The cohort consists of 13 logos, 61 figures, 12 hero images, 46 icons, 1 illustration, 48 PHI cards and 79 Tarot images. The interactive group is exactly 48 PHI cards plus 78 Tarot cards and one card back.

Checks used desktop signed-out local routes, scrolling and image decoding; report/account backend APIs are unavailable in this static review server. Authenticated product rendering is not inferred from registry references, HTTP success or audit-gallery previews. Old `.html` consumers and current routes are recorded separately. `/knowledge/figures/` returned 404; the registered `/figures/` route was checked successfully.

Current full-bucket source coverage is **747 bound, 260 registered, 5 historical archive**. These describe bindings, not production rendering of every image. The five historical series/numbering assets remain archive material without replacing current eight-volume artwork.

## First-book recovery

Eleven unchanged original WebP files were recovered from Git at `61e4f513077e24a859e4c93c34ea03e46d5cd178^`, before deletion. They were uploaded to the missing public R2 keys under `images/figures/books/book-1/`:

`0A`, `1A`, `1B`, `2A`, `3A`, `3B`, `3C`, `4A`, `4B`, `4C`, `4D`.

Each public GET was SHA-256 matched to the source. No different existing object was overwritten. All eleven display and decode on the actual Book I page at 390 and 1440 pixels. Provenance is in `book-one-recovery-v1.json`.

**4E remains missing.** No matching Git-history original, bucket object or canonical figure definition was found. Its unavailable message remains; no unrelated image or invented diagram was substituted. There are now 50 available summary figures out of 51 records across the books.

## Validation and deployment

- Atlas: 42 bilingual viewport/layer views and 392 browser WebP decodes passed, including keyboard interaction, context isolation and outage fallback.
- Actual-page checks passed for Maya, Early Byzantine, 2026 selection, Book I's 11 restored figures, Book V previews, Book VI–VIII covers and 17 Commerce visuals. Commerce uses a signed-out catalog fixture with checkout disabled.
- PDS-W3 was failing on LF versus CRLF serialization of identical frozen text. The checker accepts either newline encoding while rejecting content changes; it retains the historical evidence hash.
- The Atlas freeze checker recognizes the explicit owner-acceptance maintenance successor instead of treating the authorized asset update as unexplained drift.
- Full `npm run check` passed with exit code 0, including precheck, check and postcheck. The result and full-log SHA-256 are recorded in `npm-check-followup-v1.json`.
- Eleven recovered public image objects were uploaded. No website deployment, push or payment was performed. Website-code changes remain in the local working tree.
- A read-only production check confirms `https://www.getphios.com/api/public-asset-config` already points to the correct R2 public base. Production still serves 391 Atlas bindings / 162 accepted; local changes contain 392 / 392. Evidence is in `production-asset-config-observation-v1.json`. R2 restoration is live, but the updated website binding/acceptance files still need deployment.

## Reproduction

`node scripts/list-r2-public-assets.mjs` reads the existing Wrangler login and writes metadata only, never credentials.

`node scripts/build-civilization-r2-bindings-v2.mjs` applies the recorded per-image acceptance. The maintenance successor records the reviewed resulting hashes; do not regenerate it to bless unrelated changes.

`node scripts/audit-r2-260-display.mjs` captures local evidence; `node scripts/build-r2-260-review.mjs` exports HTML and CSV. `node scripts/build-r2-usage-review.mjs` rebuilds the all-image review.

Browser scripts use `PHIOS_PLAYWRIGHT_MODULE` for the installed Playwright. The recovery upload script requires `--upload`, rejects different existing bytes and verifies public results.
