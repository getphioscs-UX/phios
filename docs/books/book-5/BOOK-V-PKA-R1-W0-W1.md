# BOOK-V-PKA-R1 — Batch 1: W0–W1

Baseline: `main`, `8fa4a9111e5cbcc6583c1905545d4a352c13e982`. Initial working tree was clean. No commit, push, reset, delivery archive, artwork generation or R2 write was performed.

## Final manuscript authority

The user identified `PHI-OS-Book-5-v1.pdf` on the desktop. The 410-page PDF is the publication source for this work. Its SHA-256 is `011996e36225e6ec1d7bba8b368d3b5d2c3b8c1567dab7ea5cd6f51f1ac069be` (source identity, not a delivery package).

Native text is retained in the existing private review-source pattern at `functions/_source-material/books/book-5-desktop-text-v1.json`. It is not wired to public delivery or retrieval. Page hashes preserve the unedited extraction, including the PDF's duplicated display headings and spaced Chinese glyphs. Article production must normalize these for reading rather than publish the raw extraction.

PDF page 2 was visually reviewed: the table of contents lists **12.A–12.K, eleven parts**, not A–N. There are **126 unique native-text section headings**. The final body page (408) hands off to Book VI, 世界如何重组. The source inventory uses local `B5-S…` locators because body headings have no native-text 12.x numbers; these locators do not rename Knowledge nodes. Part-to-section grouping is an editorial interpretation of topic and order, explicitly labelled as such.

Six image-only figure pages were visually reviewed (49, 96, 124, 191, 362, 409). Only figure captions and placement are recorded. No image dates, numbers, map boundaries, coordinates or historical claims were transcribed into an Atlas registry. The figure labels 12A–12F are distinct from the eleven TOC part codes. Existing R2 bindings remain to be reconciled in W6.

## Current implementation

The active architecture pointer selects **eight volumes**. The shared renderer and some loader names still contain `seven`, which is not a reason to restore historical seven-volume files. Books I–IV and V use `assets/js/pages/book-volume-seven.js`. Articles use `published-content.js`, the shared article renderer, and three active release manifests. Search uses the customer Knowledge surface and the current public-discovery loader. Ask uses `/knowledge/ask/`, `/api/customer-contextual-ask`, the existing Context Resolver and orchestrated Ask chain.

Current Book V ownership is P12. The historical P12 successor contains 98 node identities (including superseded records), not zero; Book IV's later P10/P11-only successor is not Book V authority. The three active Article release manifests contain no records joined to those P12 identities. The visual v2 registry contains 380 records and the approved binding subset contains 162. Neither number is asserted to be the R2 bucket total. Remote reachability was not checked in this batch.

The complete path inventory and classified differences are in `content/books/book-5/maintenance/book-v-pka-r1-baseline-v1.json`. Frozen Atlas data, its admission, and its maintenance successors are unchanged.

## Article plan

`content/books/book-5/articles/article-production-map-v1.json` contains **42 article candidates / 84 locale records**, covering all 126 source sections. Groupings follow connected reader questions rather than one article per heading. Some self-contained arguments remain focused articles; the compact industrial sections are grouped by energy, organization and institutions.

Each locale pair shares source headings, page windows, Knowledge concept candidates, selected Atlas relationships and Ask context. These are editorial candidates, not runtime activation. Case links preserve the narrower Atlas case scope rather than equating an entire manuscript discussion with one case. Knowledge links are related concepts, not a claim that old chapter numbers and final source sections are equivalent.

Titles are bilingual editorial candidates. Summaries are explicitly production briefs, **not public deks**. No article body, English body parity approval, public article route, source retrieval, live visual binding or publication approval is claimed.

## Validation and next batch

Run `node scripts/check-book-v-pka-r1.mjs` for W0–W1 source integrity, coverage, locale mapping, valid references, current architecture and unchanged admission state. It explicitly reports W2–W16 as not run. This is not the eventual full publication acceptance suite.

The existing Atlas current checker passed. The existing sitemap checker exposed baseline drift: the actual sitemap includes the current Book VI `/books/reality-configuration/` route, but the checker helper's older static route list omits it. Its generated audit reflects that failure. Preserve the legitimate Book VI route and reconcile the shared route authority in W13; do not remove the newer page to satisfy an old expectation.

`npm run check` was attempted. Sandbox execution could not launch Git; an authorized run outside the sandbox passed that obstacle and progressed through repository checks, but stopped in a nested `check:cx-r1` task because its child shell could not resolve `npm`. The complete suite is **FAIL / environment**, not PASS. Detailed command outcomes are recorded in `content/books/book-5/maintenance/book-v-pka-r1-batch-1-checks-v1.json`. Browser, fresh R2 reachability and publication acceptance were not run.

Next: W2–W5, write the Chinese bodies from the retained final source, produce natural English with explicit semantic review, and connect articles and the reading index to the existing shared runtime. W6–W14 remain subsequent batches. W15 human decision remains `PENDING_HUMAN_REVIEW`; W16 admission must wait for explicit acceptance. The A–K source boundary and the article grouping are available for editorial review without changing the frozen Atlas.
