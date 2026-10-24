# PHI OS Financial Publication R3.2 — Second Human Audit (local PDF evidence)

Review date: 2026-10-22 (Malaysia). Status: **SCOPED REVIEW PASS — DOCUMENT STRUCTURE & PRINCIPAL CORRECTIONS ONLY**. This does not constitute final editorial approval, payment-model verification or Production PASS.

## Evidence examined

- `complete-merged-8169ee1e27.pdf`: 44 A4 pages = 22 core + 22 appendix.
- `shortfall-merged-a4e7ddb70f.pdf`: 44 A4 pages = 22 core + 22 appendix.
- `missing-merged-f459284d41.pdf`: 23 A4 pages = 22 core + 1 A00 appendix.
- Previous candidate `complete-merged-0d60324e38.pdf` was available only for comparison of 38-page pre-fix state.
- Human-review HTML at `C:\phios\...`, 22-page core-only PDF and 91-page long-appendix PDF **were not supplied in this turn**, hence not independently inspected.
- Codex results 28/28, R3.2 26/26, 85/90 with five historical rental exceptions are user-supplied execution receipts, **not independently rerun by this audit**.

## Confirmed improvements (retain)

1. The 22-page core contains integrated Chinese/English on each page; no duplicated full language pages.
2. P01–P05 fixed artwork, P21 Method & Boundaries, P22 Special Appendices are visually present; preserve stable R2 identities and routes, but do not infer correct approved bytes from visual appearance.
3. PDF outlines/bookmarks are present for all 44 / 44 / 23 pages. P22 has real destination links to included appendices (4 in the complete and shortfall samples; 1 for A00 in the missing sample). Earlier 38-page PDF did not have bookmarks or links.
4. A08 retirement displays nominal annual cost and base-year real cost as distinct variables on P26–P29, funding and unfunded amounts on P30–P37; A09 education uses tuition/living/other cost on P38–P39 and funding/unfunded on P40–P42; P43 shows designated asset release and prior restricted growth; P44 is the separately identified life-course timeline.
5. Input missingness remains visible rather than silently reverting to zero in the 23-page missing sample. Do not relax this safety/meaning boundary.

## Number reconciliation — displayed values only; not a replacement for the source arithmetic engine

- Complete cash balance: 9400 − 6150 = **3250 MYR**; shortfall: 9400 − 10950 = **−1550 MYR**.
- Net worth: 421400 − 218000 = **203400 MYR** (both complete & shortfall).
- Immediate cash / total outflow: 14750/6150 = **2.40 months**, 14750/10950 = **1.35 months**.
- Immediate cash / declared essential costs: 14750/2500 = **5.90 months**, 14750/7000 = **2.11 months**.
- Debt servicing / net monthly income: 2250/9400 = **23.94%**; liabilities/owned assets: 218000/421400 = **51.73%**.
- Complete retirement 2035: 40463.16 − 31098.92 − 959.71 = **8404.53 MYR** unfunded (matches displayed).
- Shortfall retirement 2034: 39476.25 − 12370.80 − 381.76 = 26723.69, PDF **26723.70**; reconcile using unrounded FCR calculation before PASS.
- Complete education 2033: 19642.52 − 13867.07 − 3200 − 304.04 = 2271.41, PDF **2271.42**; reconcile using unrounded FCR calculation.
- Shortfall education 2032: 24119.86 − 17323.43 − 379.82 = **6416.61 MYR** (matches displayed).
- Designated asset release 2030: complete 9812.02 + 61258.87 + 3200 + 1558.23 − 22735.28 = **53093.84**; shortfall 0 + 61258.87 + 0 + 1343.10 − 22735.28 = **39866.69**. Both match displayed.

## Blocking issues before final publication acceptance

### P0 — Approved P21 artwork and customer-facing placeholder

On P21 in **all three PDFs**, a visible overlay says `本地审阅：待取得批准的空槽位底图；本区不作客户判断。 / Local review: approved empty-slot artwork pending...`. The formerly approved page requested blank dynamic areas, so this local review placeholder must not ship to customers. Do not overwrite approved R2 artwork or manufacture acceptance. Verify exact R2 object key/version/checksum versus the user-approved empty-slot image. If it is unavailable, leave this one page BLOCKED and finish other work.

### P0 — Print-grade source and text accessibility

Each examined fixed full-page bitmap is **1055×1491 pixels** placed at A4 (roughly 128 effective DPI). Fixed P02–P05 have about 11 searchable characters per page (mostly page number), while the substantial bilingual paragraphs are raster-only. The PDF files say `Tagged: yes`, but tagging alone does not make artwork lettering selectable/readable. Require genuine print-resolution source (ideally 300 DPI-equivalent if artwork text stays bitmap) or approve a faithful vector re-typeset with approved copy, while maintaining the approved PHIOS visual system. Validate 100% print proof and at least one real print sample before final print acceptance.

### P1 — Scenario variant provenance and fixture isolation

The shortfall fixture is not just a different monthly surplus: it also shows **zero retirement contributions** in A08 P31 vs **7200 MYR per year** in the complete fixture, and **zero education contributions** in A09 P41 vs **3200 MYR per year** in the complete fixture. These may be intentional separate synthetic input conditions, not necessarily regression, but they are additional changes that materially alter long-term projections. Generate a source-backed `SCENARIO-FIXTURE-DELTA.json` and label whether each difference was explicitly entered, recomputed from a documented rule, or unexpected. Do not attribute the changed retirement/education deficit solely to monthly shortfall without evidence.

### P1 — Unnecessary appendix pagination and very sparse pages

In the 44-page sample A00 sources/assumptions takes P23–P24, with P24 having only **one rate row**. A08 retirement spending detail spans P27–P29, the last page with four rows. Retirement funding detail spans **P31–P37**, generally four annual rows per page despite ample whitespace. Compact by semantic table type using adaptable table row-height and reserved footer space, not smaller unreadable type. Preserve complete source rows, relevant calculation precision, table headers and legitimate page breaks. Aim for 1 A00 rates page if readable and materially fewer A08 annual-record pages; do not set an arbitrary hard page count.

### P1 — Static artwork versus live report layout mismatch

P01–P05, P21 and P22 use rich editorial artwork, while most P06–P20 and annual appendices look like a lightly decorated spreadsheet with large unused A4 sections. Keep one core page per topic, but enrich data-native diagrams and bilingual interpretation blocks according to each data category; do not add fake history/risks/projections. Especially P06, P07, P09, P10/P16, P13, P17/P18, P19/P20 and long model appendices. Repeated generic boilerplate at the bottom of almost every page should be replaced or supplemented with a genuinely page-specific, provenance-based interpretation.

## Other corrections and release constraints

- P06 displays `Evidence availability 5/5` in complete/shortfall, while P17 still has missing TPD/Critical Illness facts. Rename to `Five key amount fields: 5/5` or similarly scoped wording, not overall financial/profile completeness.
- A00 in missing-input PDF (P23) repeats generic model-method language but contains no admitted assumptions. Consider rendering a genuine missing-data/source ledger or omitting empty A00, while retaining P22's 12-category directory if that is the approved fixed structure.
- P14 says `8,900 MYR excess designated for education goal` based on the current declared *one-off target*. A09 longer-range education cash-flow projections later show future unfunded need. Both may be true on different horizons; provide an explicit cross-reference and distinguish current declared goal from multi-year nominal need, rather than presenting them as contradicting conclusions.
- P22 printed appendix titles and statuses must continue deriving from the actual final PDF manifest; INCLUDED must never imply verified facts or legal sufficiency. Verified internal hyperlinks/bookmarks present in examined samples.
- P01 carries `PAID VERSION • AI ENHANCED NARRATIVE` while these remain zero-provider synthetic samples. Retain TEST_ONLY cues. Production artifact may claim delivered AI narratives **only after authorized actual dispatch, validation, versioning and entitlement reconciliation**; preserve RM69, bilingual, four post-report questions and USD5 all-in upper cost boundary.
- Free 8-page candidate, 22-page core-only and 91-page stress PDF were not supplied here. Keep them separate acceptance gates, not inferred PASS from the three received PDFs.
- No real OIDC, real professional qualification, tax jurisdiction/year approvals, legally operative Will, customer invoice, live checkout, real AI billing, or production deployment has been demonstrated by these PDF samples.

## Decision

- **SCOPED REVIEW PASS (NOT USER HUMAN ACCEPT):** 22-page merged bilingual core skeleton, sample-conditioned inclusion, navigation/bookmarks, and main retirement/education visualization semantics as a local candidate.
- **NOT ACCEPTED:** P21 approved asset content, print-grade PDF quality/accessibility, fully provenance-isolated fixture differences, appendix packing, final dynamic visual/interpretive quality, production customer delivery.
- Protect prior versions/receipts and all unrelated work; complete the localized correction tasks first; do not re-open the complete financial calculation engines without evidence of a real bug.
