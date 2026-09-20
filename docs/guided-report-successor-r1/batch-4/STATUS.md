# BAZI-DYNAMIC-R1-BATCH-04

Baseline: `d199fe6d87f61770014150015c0f8e53a9b6a997`. Scope: P20–P22, M07. The user also authorized Batch 5 in the same request; this does not authorize Batch 6 whole-book visual freeze.

[Open Batch 4](http://127.0.0.1:8788/docs/guided-report-successor-r1/batch-4/review.html). Choose Chinese, English or bilingual and use the M07 side-by-side comparison. The default PDF follows the selected language.

## Pages and authority

| Page | Content | Source / boundary |
| --- | --- | --- |
| P20 Timing Architecture | Natal, luck-pillar and annual layers; source age bands and explicit target context | `professionalTimeline.daYunTimeline`, `targetContext`, `currentWindow`. Source cycle order, fractional ages and selected markers are retained. No clock or browser-timezone inference, smooth energy curve, score or invented phase theme. |
| P21 Current or Selected Period | Target timestamp/timezone, natal baseline, selected luck and annual pillars, completeness state | `currentWindow.currentDaYun`, `annual`, `completeness`. Missing target is DATA_REQUIRED; a partially available window is CONDITIONAL. No selection is inferred from the host date. |
| P22 Current Reality Comparison | METHOD PROJECTION, CURRENT EVIDENCE, COUNTER-EVIDENCE, STATUS, WHY | The admitted reading exposes method-side comparison metadata, not independent Current Reality observations. State remains NOT_COMPARED / DATA_REQUIRED. Missing counter-evidence is not treated as proof that no counter-evidence exists. |

P22 is a complete missing-evidence presentation, not a newly implemented reality-adjudication runtime. This batch does not collect or fabricate observations, mark a reading accurate, convert resonance into evidence, or alter the method verdict. Future evidence-bearing envelopes require an explicit supported admission contract; unrecognized evidence/status fields fail closed instead of being silently relabelled missing.

## Review fixtures

The default reuses the previous governed deterministic benchmark, with no target time. Its default PDFs therefore retain the missing-target state. The case selector adds **independent synthetic downstream campaign charts**, not later periods of the default person:

- `selected`: W17 campaign case 001, complete explicitly supplied target and both time layers.
- `transition`: W17 campaign case 005, transition-day boundary; only the annual layer is available.
- `annualMissing`: W17 campaign case 006, luck pillar only.
- `cycleMissing`: W17 campaign case 007, annual pillar only.

These fixtures are built with the existing `buildInputs(generateCampaignCases())` test harness and processed by `buildBaziMethodNativeReading`. They test downstream presentation and are not evidence that their synthetic pillars represent a real person's astronomical calculation. Target date, time and timezone remain visible. Changing language preserves the selected case. PDF links are hidden for supplementary cases so that a default PDF cannot be mistaken for a selected-case PDF.

## Artifacts and verification

- Three default A4 PDFs, each with logical P20–P22 / 26.
- 18 default page screenshots and 9 M07 reference comparisons.
- 27 supplementary timing-case page screenshots, including complete-target variants in all three languages at 1440px and 390px, plus three missing-layer variants at 390px.
- `browser-evidence.json`: default responsive, print and 84 prior-batch screenshot comparisons.
- `timing-state-evidence.json`: supplementary responsive and A4-print geometry.
- `pdf-evidence.json`, `pdf-review/`: physical A4 counts, page numbers and rendered inspection pages.
- `validation.json`, `npm-check.log`: final results; the log is shared with Batch 5.

`check-bazi-batch-4-5.mjs` checks missing/explicit/partial states, contradictory selections, malformed chronology, unsupported certainty, source propagation, absent reality evidence and cross-locale bindings. Prior Batch 1–3 HTML, original CSS bytes and tokens must stay exact. Browser regression retains historical mismatches and, when needed, rerenders with the exact previous stylesheet to distinguish browser raster variation from new CSS effects.

Both batches use the existing projection, Page IR and renderer owners. Only bounded M07/M08 composition is added. Shared page chrome, fonts, colors, borders, panel family and footers remain unchanged. References control composition; their mountain artwork, sample years, interpretations and illustrative energy curve are not data sources.

Human dynamic visual acceptance remains PENDING. No production publication, checkout, static-image approval or whole-book freeze state is promoted.

Full `npm run check`: **PASS, exit 0**, including precheck, check and postcheck. Final presentation changes passed the targeted check, browser checks and A4 verification. All default PDF pages were visually inspected. Prior screenshot regression: 83/84 historical captures are byte-identical; the one known raster variation is exactly reproduced by the unchanged prior stylesheet. HTML/CSS/tokens remain exact. Dynamic human acceptance remains pending.
