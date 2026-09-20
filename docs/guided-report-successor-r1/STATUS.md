# Guided Reality / Method Guidance / Visual Reports — candidate status

2026-09-20 update on main 16028ad: static images are USER_APPROVED and 120/120 exact paths are readable. The current staged task is [Batch 0 visual reference registration](BATCH-0-STATUS.md); prior dynamic QA artifacts below are historical, not current full-report acceptance.

Baseline: `main`, `a7fc16025e67f653b9cd2e41418dcc2c355d3df3`.

Status: **IMPLEMENTATION IN PROGRESS. HUMAN VISUAL ACCEPTANCE PENDING. NOT PRODUCTION ACCEPTED.**

## Source precedence and preservation

- The active implementation brief is PHIOS-GR-MG-VRPT-R1-L10N-COM-R2. Static P01–P05 must use the exact requested language's R2 artwork; dynamic customer data starts at P06. The older visual attachment's personalized cover example does not authorize placing customer data in a shared static image.
- The user's corrected bundle prices override earlier source prices: Bundle 2 = RM69/69/69, Bundle 3 = RM99/99/109, Bundle 5+ = RM159/159/179, ordered Chinese/English/Bilingual.
- `reference-visual-attachment.md` preserves the complete latest attachment. `visual-requirement-index.json` indexes every heading with its source line. Indexing is not implementation or acceptance.
- The original design conversation's method blueprints and fixed copy are preserved in `reference-*.md`. M01–M08, all six card families, exact BaZi 26-page mapping, density targets, motion limits, mobile layout and print rules are recorded in `visual-master-contract.json` and its presentation-owner module.
- Exact final page mapping overrides the attachment's earlier pre-history-page numbering. P08 permits an approved M04/M05 hybrid; M04 is the registered primary master.

## Implemented candidate behavior

- Existing Current Reality owner now supports Quick/Guided/Deep/Discovery, verbatim summary, edit, explicit confirmation and method probes. Personal entry mounts the guided flow and preserves direct method choice.
- Existing Ask owner supports tentative method guidance and a maximum of two alternatives. Routing metadata does not grant execution or calculation authority.
- Checkout uses explicit report language, server-derived prices and immutable order presentation. Bundle child entitlements retain the purchase language. Stripe fixtures validate modifiers, totals and tamper rejection.
- Existing Page IR owner projects language-specific static assets, source-bound localized dynamic content and separate missing-data/payment states. Paid detail payloads are omitted from locked projections.
- Bilingual candidate pages now share one data chart. Page numbers use the projected report sequence. Locked previews expose anonymous chart-family geometry rather than an empty rectangle; full fidelity to each future master remains pending.
- Premium print pages use A4 and 15mm margins. The legacy renderer outside this candidate keeps its original layout.

## Verification

- Full `npm run check`: PASS, including precheck/check/postcheck, before the final visual-checklist additions. Log: `C:/phios/.tmp/guided-full-check.log`. No old checks were disabled.
- `check-guided-report-successor.mjs`: PASS for 33 price selections, confirmation boundaries, language locks, routing, probes, 120 fail-closed asset paths, eight blueprint counts, BaZi exact master mapping, and locked/missing-data disclosure.
- `check-commerce-stripe-r1.mjs`: 16 fixture groups PASS. Real Stripe checkout/payment: NOT_RUN.
- Package alias registry: PASS. Pages build check: PASS; compiled locally, not deployed.
- Browser: 81 local cases PASS, including actual English/Chinese intake, edit/confirmation → method recommendation → selection, corrected bilingual price persistence, and all eight methods × three report languages × three widths. Evidence: `browser-results.json`. These are local interaction/layout checks, not live production E2E or human visual approval.
- Twelve A4 dynamic-only PDF drafts generated for BaZi/ECR/HD/Cross × three languages. No blank pages detected. The BaZi bilingual first page was visually inspected after the layout correction. This is not all-page visual acceptance.
- English/Chinese HD fixtures currently have different dynamic page counts (10/12); cross-language semantic and adaptive-page parity remains unresolved. Do not claim equivalence from layout success.

## Remaining implementation and blockers

| Area | Remaining work |
|---|---|
| Static artwork | Resolved: 120/120 exact locale paths returned readable images after the user completed uploads. Three BaZi P01 objects contain PNG bytes under WebP names; en/P01 contains a bilingual cover. See Batch 0 for exact observations. |
| Canonical editorial copy | 25 of 32 interior editorial bodies imported from full bilingual source. Seven P05 entries lack complete bilingual body text in the retrieved source and remain candidates. |
| M03–M08 and complete page bind | Existing review fixtures have fewer dynamic pages than the new full blueprints. The 26/24/32/34-page plans are registered, but full evidence-driven page assembly and all master slots are not implemented. |
| Six card families | Registered contract; complete renderer binding, 2–4-line checks and page-level insight density checks remain. |
| Locked continuation | Chart-family preview added; exact paid-master silhouette, safe partial content and complete purchase-to-same-report continuation remain to verify. |
| Actual report delivery | Server ownership lookup exists, but presentation selection is not yet wired through the complete customer report-generation endpoint. No new production entitlement authority is claimed. |
| Reality and Ask | Precise source-specific probes, six capability discovery cards, complete comparison/counter-evidence integration and all required Ask journeys remain to verify/finish. |
| Visual consistency | All eight method-specific skins, commerce promise vs interior, mobile chart stacking, density measurements and every-page PDF inspection remain. |
| Full PDF | Static artwork availability is resolved. Complete page binding and whole-report visual acceptance remain pending. Existing DYNAMIC-ONLY files are historical QA drafts. |
| Human review | Reality UX flows and premium visual acceptance remain PENDING. Earlier Atlas approval is separate and does not approve these new report templates. |

## Review entry points

- `VISUAL-DESIGN-CHECKLIST.html`: full attachment checklist with original sections and master-specific gaps.
- `review.html`: 24 synthetic method/language candidate reports. These historical snapshots predate the uploads; use the Batch 0 review for current static assets.
- `browser-results.json`, `print-results.json`, `pdf-inspection.json`: exact verification scope.

All changes remain in the working tree. No files intentionally deleted; no commit, push, deploy, or ZIP created. Review with `git status` and `git diff --stat`; review untracked files as well. These are review steps, not a request to approve an unfinished release.
