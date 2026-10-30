# R6.11 · focused reproducible checks

## Report truth from the supplied R6.10 English PDF

- Physical count: 92 A4 pages, locale `en`.
- Old Page 1: generic Human Design cover; owner rejects.
- Old Page 2: Reading Identity and Priorities; owner rejects.
- Old Page 3: Contents; owner now requires a semi-fixed page with **only 17 final page numbers dynamic**.
- Old page 4: calculated BodyGraph; old page 5: planetary activations; old page 6: SEC01 opener.
- The often-assumed three-page shift after replacing 2 with 5 is **a sample observation only** and MUST NOT be coded as a pagination rule.

## Correct new order

`P01 P02 P03 P04 P05 TOC BODYGRAPH ACTIVATIONS SEC01...SEC17`

- The five editorial assets exist in three exact language families. See `HD-TOC-CONTRACT.json`.
- Each editorial asset is one printed A4 page.
- The TOC page remains exactly one page with same label position and visual identity for a language; 17 page numerals and internal links change with actual physical pagination.
- Each title's link lands on the chapter's fixed visual opener, and the numeral equals its one-based physical page index.
- Preserve existing section visuals and customer semantics.

## Negative and regression checks

1. Force `en` purchase with only `zh-Hans` P01 available: fail language asset resolution rather than fallback.
2. Remove P03 in one locale: preserve other two edition assets; report exact locale and asset missing.
3. Change dynamic text length causing SEC14 new page: recompute later numbers and links; no hardcoded delta.
4. Introduce duplicate section opener ID: reject TOC binding.
5. More than 17/missing sections: reject final 17-section report claim.
6. Inspect all 15 actual file bytes (MIME, decode, resolution, hash), not manifest strings.
7. Verify sections' fixed posters are still correct bilingual originals for all three products.
8. Verify Cognition Tone 4 Inner Vision is not accidentally deleted by old SEC10.7 exclusions; maintain independent PHS/Low Sound mapping.
9. Preserve ALL production restrictions; local owner test does not assert real-account delivery.

## Produced here vs not produced here

Produced in this package: a working PDF visual **semi-fixed TOC demonstration**, machine-readable user-selected asset paths, explicit 17 fixed titles and bounded Codex implementation instructions.

NOT produced in this package: the actual R6.11 full report with five new P01–P05 assets, because their image bytes are not attached or mounted, and the current live `C:\phios` runtime cannot be modified from this container. The paths are exact user-declared selectors, not observed content hashes or verified R2 object keys. Do not claim otherwise.
