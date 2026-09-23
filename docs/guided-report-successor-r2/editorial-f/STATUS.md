# Addendum F — editorial quality checkpoint

Current work follows the owner's F-W0–F-W13 directive. No new full-matrix API generation is authorized. Addendum E semantic/operator gates remain intact.

## Baseline audit

`audit.html` and `paid-pdf-page-audit.json` inventory all 96 pages of the two 48-page layout PDFs from commit `c6ab7321`. The audit contains actual extracted PDF text, five prose classifications, metrics and source hashes. P01–P05 are frozen raster introductions; Codex visually classified them without claiming OCR extraction or owner acceptance. Existing rendered visual evidence remains separate from editorial human acceptance.

The EN narrative pages P13, P23, P26, P30 and P34 repeat percentages, functional-group plumbing and position-interface terminology. Their zh-Hans counterparts repeat the same native structures. Existing paid-layout fixtures are synthetic and do not establish a released private customer report.

## Implemented

- `BAZI_EDITORIAL_MEANING_CANON_V1`: read-only projection of the already-admitted explanatory Claim IR and its native source lineage. Every theme exposes the eight requested facets; unlicensed contrast, support or reflection stays empty.
- `SectionNarrativeBrief`: deterministic relation-role order, source rank and pair preservation, meaning digest, content plan, locale style contract and appendix destination, built before any provider invocation.
- Separate English and Simplified Chinese style contracts. No new calculation, method rule, causal relation or manifestation license.
- Narrative development now consumes licensed meaning. Repeated raw percentages/counts are retained in native visuals/detail; full conditions move to Method & Appendix. Semantic-block pagination balances complete blocks without filler. The revised layout is 49 pages per locale.
- Six deterministic quality metrics: technical density, numeric repetition, exact template-sentence repetition, boundary density, section specificity and cross-section similarity. They are diagnostic language measures, not substitutes for semantic verification or human editorial judgment.
- Server staging now requires both locale snapshots to be machine-valid and digest-bound human accepted before the next baseline section. High/low/mixed and parity cannot run before all eight baseline sections are human accepted. Browser matrix/parity controls are paused.
- QA T3 publication requires a human record matching both snapshot and brief digests. Paid Production T3 remains closed. Existing bounded provider calls, one repair maximum, immutable snapshots and spend reservations remain intact; no reservation is deleted.
- Report rendering cannot invoke a new T3 provider run. Without a frozen snapshot it returns `ACCEPTED_SNAPSHOT_REQUIRED`; only the staged authenticated QA endpoint starts new section generation.
- The QA review screen displays new F prose and exports a human-selected decision bound to both digests. Old E comparison records are explicitly historical and cannot satisfy F acceptance.

## Local validation

- Targeted BaZi T3 checks pass, including zero implicit provider calls during rendering, preservation of native licensed claims, and human-before-next-section gates.
- Revised EN and zh-Hans layout fixtures each have 49 pages. Browser print/layout checks pass at 1440 and 390; PDF text, A4 size and unique dynamic folios pass. All 98 rendered pages were inspected by Codex, including the changed narrative and appendix pages. These are layout checks, not human prose acceptance.
- PDF raster compression preserved extracted text and page count; files remain below the Pages 25 MiB limit. Poppler emitted ICC/xref warnings, but completed all page renders; inspected images were present.
- T2 fallback still preserves the full admitted qualifiers. Its repetitive phrasing is not represented as publication-quality T3; that decision is reserved for each newly generated, human-reviewed section.

- Full `npm.cmd run check` passed, including precheck, main checks and postcheck. Final Pages build passed: worker 16,585,811 bytes; gzip 2,544,448 bytes.

## Real Preview S02 results

Implementation `0f223ef6` was deployed to `https://64f7a774.phios-github.pages.dev`, alias `https://qa.phios-github.pages.dev`. ONLY BASELINE_NOW S02 was invoked in English and Simplified Chinese. Both responses were HTTP 200, cacheHit false; immutable sandbox R2 snapshots were downloaded and their evidence, snapshot and brief digests verified. English used the existing bounded repair (two attempts); Chinese used one attempt. No S03, parity or full-matrix generation was invoked.

Both originally passed the semantic verifier and first editorial metrics. Codex prose review then found the same scope clause repeated inside different sentences. `BAZI_EDITORIAL_METRICS_F_V2` now detects clause repetition and the previously missed English/Chinese scope formulations. It also provides Chinese lexical specificity and returns null, not a misleading zero, when cross-section comparison has no other section.

The existing results were reassessed offline without another model call or modification of their immutable snapshots:

| Locale | Technical density | Number repetition | Repeated clauses | Main-prose boundary hits | Current result |
| --- | --- | --- | --- | --- | --- |
| en | 0 | 0 | 1 | 5 | EDITORIAL_REVISION_REQUIRED |
| zh-Hans | 0 | 0 | 1 | 4 | EDITORIAL_REVISION_REQUIRED |

`s02-review.html` displays both actual candidates and the exact reasons. `s02-live-evidence.json` keeps original machine results separate from current reassessment. Existing saved API results are reopened with current editorial reassessment, without replacing the original record or making a new provider call. Current snapshot validation rejects these candidates, and the review UI does not offer acceptance export for a machine-rejected candidate.

After this detector correction, targeted BaZi checks and Pages build passed (worker 16,586,688 bytes; gzip 2,544,571 bytes). The bilingual review artifact passed local 1440/390 browser checks with no overflow or page errors. The earlier full repository run passed before this focused correction; it was not repeated afterward.

## S02 scope revision R1 — current candidate

Owner requested continuing S02 revision from `42664add`. Runtime `1c28097d` was deployed to `https://d7eb39bc.phios-github.pages.dev` (stable QA alias unchanged).

The writer and independent semantic verifier now receive the same digest-bound S02 scope distribution: general symbolic/no-observed-effect scope can be stated once; measurement caveat is retained in the lead; distinct pairs, secondary rank, simultaneous dimensions and unresolved verdicts remain local. This changes editorial placement, not method rules or inference permissions. S03–S09 briefs are unchanged. Old reservations/snapshots remain intact.

Only S02 en/zh-Hans was generated again. Both real QA responses were HTTP 200 / cacheHit false / PASS. Current semantic verification and METRICS_F_V2 both pass. Technical density, number repetition and repeated clauses are zero in both locales. `s02-r1-meaning-preservation.json` verifies that the exact semantic coverage digest is unchanged from the first attempt in both languages; this is not a substitute for the later bilingual parity review.

Current snapshot digests:

- en: `614b4b6a9121409202bf2db76d8f17ff7291818d1b15d059905e4a4d3d3392fa`
- zh-Hans: `01d5bece462951c478ca13f20a46f733886214d8f4a9d0e0a11d93e595c53264`

The current `s02-review.html` and `s02-live-evidence.json` contain this revised pair. The first rejected pair is retained at `attempt-1/s02-live-evidence.json`. Local 1440/390 review-page checks pass with no overflow or page errors. Targeted BaZi checks and Pages build pass. The complete `npm.cmd run check` passed with exit 0, including precheck, main checks and postcheck. No new migration or Production change was made.

## Remaining

Digest-bound owner editorial acceptance of this revised S02 pair is still required by F-W10/F-W11. The request to continue revision does not itself accept unseen replacement prose. After acceptance, S03 can run as one section; the remaining baseline sections follow in order. No S03, high/low/mixed, parity or full matrix call has been made in this revision.

Paid Production remains closed. The separate Commerce QA checkout remains unpaid as clarified by the owner; these synthetic editorial fixtures do not establish purchase or private customer-delivery acceptance.

`BASELINE_S02_EDITORIAL_ACCEPTED = false`

`FULL_MATRIX_ENABLED = false`

`T3_PAID_PRODUCTION_ACTIVE = false`
