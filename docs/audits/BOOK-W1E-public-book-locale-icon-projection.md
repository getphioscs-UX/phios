# BOOK-W1E｜Public Book / Locale / Icon Projection

## Gate result

BOOK-W1E candidate preparation is complete, but activation is blocked because **W1D is not active**. The W1D evidence based on `610ccf4` is a candidate ledger only. It accounts for 716 predecessor Canonical Nodes, two KAU-R5 admissions and 473 publication-ownership records without creating active reconciliation authority.

Direct W1D activation is not a safe TL checkbox. **P8–P15 source authority is complete**, and BOOK-W1B plus BOOK-W1C are Human approved with no overrides. All 323 W1C dispositions are resolved, but no Canonical Node has been created. The repository now has one remaining explicit TL acceptance gate before W1E may activate:

1. accept or revise the W1D 718-entry existing-identity ledger, 213 Canonical admission candidates (192 promote + 21 supersede), and 473 publication-ownership records, including explicit physical-application decisions for `KN-B2-P7-052 → P11` and `KN-B2-P7-057 → P10`. The 66 accepted links remain relationship-only; the 44 deferred candidates remain preserved.

The exact artifact hashes and ordered decisions are recorded in `content/knowledge/migrations/book-w1d/book-w1d-tl-activation-review-v1.json`. The system may not infer or self-record these decisions.

## Candidate projection

The deterministic candidate records the final five-book ownership and routes:

| Book | Parts | Canonical route |
| --- | --- | --- |
| BOOK-1 · Reality Formation | P1–P4 | `/books/reality-formation/` |
| BOOK-2 · Reality Runtime | P5–P7 | `/books/reality-runtime/` |
| BOOK-3 · Reality Continuity | P8–P9 | `/books/reality-continuity/` |
| BOOK-4 · Reality Civilization | P10–P12 | `/books/reality-civilization/` |
| BOOK-5 · Reality Navigation | P13–P15 | `/books/reality-navigation/` |

`/books/reality-maintenance/` is projected only as a 308 compatibility alias to `/books/reality-continuity/`. It has no Canonical route authority and cannot compete with Reality Continuity.

The candidate also records the requested Book 3–5 primary and legacy visual vocabularies. `ai` remains retained metadata for Book 5 but is not a Book-level primary icon.

## Current-production boundary

All ten required public, locale, asset and composition sources are hash-bound in the candidate. Five stale production classes are explicitly inventoried: four-volume guards/copy, stale Volume III/IV identity, BOOK-2 P5–P9 ownership, and stale Part 8–15 titles.

**Current production remains byte-identical** while the Knowledge Authority gate is blocked. No stale current-production statement is mislabeled `HISTORICAL_ALLOWED`; it is queued for replacement on activation. Historical files outside the current-production projection may retain old terms only when they are explicitly marked `HISTORICAL_ALLOWED` during the activation scan.

## Checker

`npm run check:book-w1-public-projection` verifies the candidate, compatibility route, ownership, locale intent, visual vocabulary, exact source hashes, current-production fail-closed boundary and W1D TL review sequence.
