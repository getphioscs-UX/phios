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

## Remaining

Deploy this revision to QA, then run ONLY BASELINE_NOW S02 in en and zh-Hans. Stop for human prose review before S03. No new live generation has yet been recorded for Addendum F.

`BASELINE_S02_EDITORIAL_ACCEPTED = false`

`FULL_MATRIX_ENABLED = false`

`T3_PAID_PRODUCTION_ACTIVE = false`
