# BAZI-DYNAMIC-R1-BATCH-02

Baseline: `c00843bed2bcc2ee2742cb839a079d18362ffefb`.

Scope: **P11–P15 only**. Review implementation and artifacts are available; dynamic visual acceptance remains pending. Stop before P16. This batch does not activate a paid production route or change static-image approval.

## Review

[Open the review page](http://127.0.0.1:8788/docs/guided-report-successor-r1/batch-2/review.html). Choose 中文, English or 双语; select a page and use “参考图并排对照”. The PDF link follows the selected language.

- [Chinese A4 PDF](bazi-p11-p15-zh-Hans.pdf)
- [English A4 PDF](bazi-p11-p15-en.pdf)
- [Bilingual A4 PDF](bazi-p11-p15-bilingual.pdf)
- `screenshots/`: 30 page captures and 15 reference comparisons.
- `pdf-review/`: all 15 rasterized PDF pages and language contact sheets.
- `browser-evidence.json`: six responsive variants, print overflow/overlap assertions and 30 Batch 1 screenshot comparisons.
- `pdf-evidence.json`: A4 dimensions, five physical pages per PDF, logical page numbers 11–15 / 26.

## Page-to-source review

| Page | Master | Primary visual | Source boundary |
| --- | --- | --- | --- |
| P11 Structural Balance & Tension | M05 | Visible support, outward and pressure count bars; separate root/month/Day Master context | Common count axis, no strength percentages; roots are not added to visible counts. |
| P12 Primary Structural Pattern | M04 | Open primary verdict connected to candidate stems and source evidence | Current owner has not established a primary pattern. Candidate reading order follows the owner and is not a quality ranking. |
| P13 Secondary Patterns & Conditions | M04 | Candidate-by-condition map, showing visible, missing and review-required conditions | No secondary pattern is assigned. Visible conditions do not establish formation, defeat or rescue. |
| P14 Available Strengths & Resources | M04 | Root, peer-support and resource-support records; actual root positions | These are structural records, not claims about personal abilities or real-world resources. Zero is retained. |
| P15 Structural Pressure & Friction | M04 | Source-bound pillar tension network and relationship list | Includes tension, repeated tension and group tension; relation count is separate from visible pressure count. No event prediction. |

Each page has one question, one composite primary visual, and at most three short insight/condition/observation cards. P11 uses two cards to avoid duplicate prose on mobile. The existing Batch 1 renderer owns the header, footer, typography and panels. Only scoped composition slots are added; no tokens, card family, icon family or decorative language are introduced.

## Data and authority

The example is the existing deterministic synthetic benchmark executed through the BaZi runtime, **not a live customer record**. Solar-term test fixtures remain declared in `scripts/smr-benchmark-support.mjs`. `scripts/build-bazi-batch-2-review.mjs` regenerates the reading and all three locale projections. Sample values or interpretations from master artwork are never copied.

The existing `projectBaziVisualReport` accepts the explicit Batch 2 review option and delegates to a subordinate presentation helper. `createVisualPage` and `renderVisualReportPages` remain the shared Page IR and rendering owners. Web and PDF consume the same IR. Source references bind every visual node, condition and relationship.

Missing counts, root sources, unsupported condition states, unknown path labels and unknown future confirmed-verdict contracts fail closed. This batch presents the current unresolved-verdict contract; a future upstream confirmed-pattern schema requires explicit presentation support, rather than silently replacing it with an open verdict. No production admission is claimed.

## Visual comparison

The M05 count language and M04 orbit/structural panels retain Batch 1's navy, ivory, gold borders, serif/sans hierarchy and spacing. References are shown only beside the review output. Their painted mountains, sample percentages and example conclusions are not inserted into live pages. This remains a vector/data adaptation, not a claim of pixel equivalence to the artwork.

Desktop/mobile/PDF review checks alignment, legibility, overflow, page numbers, visual dominance and chart/card overlap. The bilingual titles retain Chinese above English. All three PDFs retain five pages with logical numbering 11–15 / 26.

## Regression and validation

`batch-1-regression-baseline.json` is derived from Git commit `c00843b`. The targeted checker compares the original stylesheet prefix, tokens and all three Batch 1 HTML outputs exactly. Browser QA also compares all 30 committed Batch 1 screenshots without overwriting them.

`scripts/check-bazi-batch-2.mjs` checks source propagation, empty cases, missing data, open-verdict boundaries, source reading order, cross-locale evidence, master mapping and styling. It is prepended to `npm run check`; the required PTRC ending remains unchanged.

Full `npm run check`: **PASS, exit 0**, including precheck, check and postcheck. Final scoped presentation adjustments also passed the targeted checks and browser/PDF verification. Batch 1 screenshot regression: **30/30 unchanged**. See `validation.json` and `npm-check.log`. Human visual acceptance remains separate from machine verification.
