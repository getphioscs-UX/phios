# BaZi Report Production Reference — MR-W0 / MR-W1

## 2026-10-04 editorial reference successor

The Human-accepted GEN-01 `核心性格与能力` section is now formalized as the active BaZi editorial quality reference in [BAZI-EDITORIAL-REFERENCE-R2.md](./BAZI-EDITORIAL-REFERENCE-R2.md).

This successor changes the writing reference, not BaZi calculation authority:
- future BaZi reports inherit the accepted section discipline, depth and customer-facing tone;
- each section owns a distinct question and must not pre-consume later sections;
- the reference sample is a quality benchmark, never reusable subject-specific semantics;
- professional limitations stay in Authoring/QA unless customer-facing disclosure is specifically required; no repeated `专业附注` block is rendered by default;
- old accepted/full-report artifacts remain historical evidence but do not override this successor when they conflict on editorial style or section overlap.

`BAZI_EDITORIAL_REFERENCE = R2_ACTIVE`.
`BAZI_GEN01_SECTION_1_HUMAN_ACCEPTED = true`.

## 2026-10-02 shared Print Shell V2 successor

BaZi remains the accepted **content, editorial-depth and 38-page physical-composition reference**. It is no longer the sole rendering/print-layout reference.

Zi Wei QA established `PHI-OS-REPORT-PRINT-SHELL-V2` as the shared customer rendering successor: one A4 coordinate system (210mm × 297mm), full-page static editorial WebP assets, method-specific Section Master WebP backgrounds with dynamic overlays, method BODY WebP backgrounds for reading pages, one-pass fixed-A4 verification, immutable released HTML, and customer-browser Print / Save as PDF. Server-side PDF generation/parsing is not part of the customer hot path.

This successor does **not** reopen BaZi content, Career, Wealth, Guidance, Section Master artwork, Composition R1, or the accepted 38/38 page map. BaZi migration is presentation-only: reuse the existing P01–P05 editorial assets, ten accepted Section Master WebPs, body visual system, accepted dynamic content and Composition R1 groups inside Print Shell V2.

Authority split after this decision:

- **BaZi:** accepted content / semantic depth / 38-page physical composition reference.
- **Zi Wei Print Shell V2:** shared rendering / print / low-CPU production reference.
- **Each method:** retains its own semantics, visual identity, section architecture and page budget.

Target state: `BAZI_PRINT_SHELL_V2_MIGRATION = PENDING`. Migration requires visual + print regression only; it is not a new BaZi editorial acceptance gate.

## 2026-10-01 successor decision

The user has accepted and frozen BaZi content, semantic depth, Career, Wealth, Guidance, the ten Section Masters and the 38/38-page [Composition R1](../acceptance/bazi-paid-report/composition-r1/IMPLEMENTATION.md). It is now the cross-method physical composition reference. The historical sample remains unbound; an independent [controlled subject proof](../acceptance/bazi-paid-report/controlled-subject-r1/README.md) passes using a new subject and the real calculation chain. Production admission and commerce E2E remain pending. The remaining text below records the earlier MR-W0–W2 delivery and is historical where it says content/architecture decisions are pending.

Work: `PHI-OS-METHOD-REPORTS-PRODUCTION-ROLLOUT`  
Audit date: 2026-10-01  
Baseline: `611ddf2dd7e4bdced6358879a5bdb9656c0f0286`

## Current decision

`BAZI_CONTENT_STATE = ACCEPTABLE`. Existing S02–S10 owner-accepted copy and its signed receipts remain unchanged. This is an architectural reference freeze, not permission to copy BaZi semantics, titles, ten sections or page counts.

Whole-report human decision is **pending**. `BAZI_CONTENT_FROZEN = false` and `BAZI_REFERENCE_IMPLEMENTATION = false` until MR-W1 ACCEPT is recorded. No production admission is granted. The historical section-level ACCEPT receipts do not substitute for full-report acceptance.

Only report-flow, pagination, visual binding, locale, subject binding, discovered duplication and rendering defects may be corrected. No mass narrative rewrite, section redesign, Section Master redesign or T2/T3 restart.

## Owner map

| Owner | Implementation | Classification | Reuse |
|---|---|---|---|
| subject | [functions/canonical-presentation-runtime/report-cover-subject.js](../../functions/canonical-presentation-runtime/report-cover-subject.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_AS_IS |
| calculation | [functions/bzr-full-production/bazi-chart-runtime.js](../../functions/bzr-full-production/bazi-chart-runtime.js) | METHOD_SPECIFIC_BAZI | BAZI_ONLY |
| claim | [functions/personal-reading/narrative/bazi-explanatory-authority.js](../../functions/personal-reading/narrative/bazi-explanatory-authority.js) | METHOD_SPECIFIC_BAZI | BAZI_ONLY |
| Publication IR | [functions/personal-reading/narrative/report-publication-ir-v2.js](../../functions/personal-reading/narrative/report-publication-ir-v2.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_WITH_ADAPTER |
| narrative | [functions/personal-reading/bazi-section-publication.js](../../functions/personal-reading/bazi-section-publication.js) | METHOD_SPECIFIC_BAZI | BAZI_ONLY |
| locale | [functions/personal-reading/narrative/report-locale-parity.js](../../functions/personal-reading/narrative/report-locale-parity.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_WITH_ADAPTER |
| visual | [functions/canonical-presentation-runtime/bazi-publication-visuals.js](../../functions/canonical-presentation-runtime/bazi-publication-visuals.js) | METHOD_SPECIFIC_BAZI | BAZI_ONLY |
| page composer | [functions/canonical-presentation-runtime/report-section-contract.js](../../functions/canonical-presentation-runtime/report-section-contract.js) | SHARED_REPORT_INFRASTRUCTURE | SHOULD_GENERALIZE_LATER |
| snapshot | [functions/canonical-presentation-runtime/visual-report-page-runtime.js](../../functions/canonical-presentation-runtime/visual-report-page-runtime.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_WITH_ADAPTER |
| release | [functions/canonical-presentation-runtime/report-release-runtime.js](../../functions/canonical-presentation-runtime/report-release-runtime.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_AS_IS |
| customer renderer | [assets/customer-ui/js/personal-products/publication-report-pages.js](../../assets/customer-ui/js/personal-products/publication-report-pages.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_WITH_ADAPTER |
| review builder | [scripts/build-bazi-full-report-accepted-publication-review.mjs](../../scripts/build-bazi-full-report-accepted-publication-review.mjs) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_WITH_ADAPTER |
| commerce mapping | [functions/report-delivery/report-delivery-contract.js](../../functions/report-delivery/report-delivery-contract.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_AS_IS |
| entitlement | [functions/report-delivery/report-access-resolver.js](../../functions/report-delivery/report-access-resolver.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_AS_IS |
| account material | [functions/account/released-report-material-store.js](../../functions/account/released-report-material-store.js) | SHARED_REPORT_INFRASTRUCTURE | REUSABLE_AS_IS |

- **subject:** createReportSubjectPresentation / assertReportSubjectBinding; trusted identity and semantic fingerprints must match.
- **calculation:** BaZi chart owner; Zi Wei keeps zi-wei-runtime calculation authority.
- **claim:** BaZi claim semantics; reuse shape, never wording.
- **Publication IR:** Claim links and evidence constraints need a Zi Wei adapter.
- **narrative:** Accepted-copy routing and section narratives remain BaZi-owned.
- **locale:** Shared parity checks; method terminology must be independently defined.
- **visual:** BaZi dynamic structures are not Zi Wei palace diagrams.
- **page composer:** Shared pagination/layout helpers coexist with BAZI_SECTION_REGISTRY; do not copy the ten-section assumption.
- **snapshot:** assemblePublicationSnapshot; supply method pages, locale, time and internal evidence.
- **release:** Release assertions and channels; existing authority is preserved.
- **customer renderer:** renderPublicationReport and method skins; BaZi frozen intro remains method-specific.
- **review builder:** Existing builder extended for full customer order; fixture and composer remain method-specific.
- **commerce mapping:** Existing eight-method mapping; pilot and production admission remain distinct.
- **entitlement:** Existing account purchase owner; full delivery limited by pilot/environment and release gates.
- **account material:** Persist released material without regenerating on refresh.

Shared modules with embedded BaZi assumptions are recorded for adapters or later generalization. No mass rename or second rendering/review engine was introduced.

## Full-report artifacts

The existing `npm run build:bazi-full-report-review` builder now also calls the existing `buildBaziCustomerPublication()` and `renderPublicationReport()`. These artifacts include all six opening pages, S01–S10, appendix/boundaries and final page, in customer order. They reuse the customer styles, asset fallback and page-fit runtime. The earlier side-by-side section review remains available.

- [Chinese — 74 pages](../../tools/review/BAZI-FULL-REPORT-REVIEW-ZH.html)
- [English — 64 pages](../../tools/review/BAZI-FULL-REPORT-REVIEW-EN.html)
- [Machine manifest](../../content/reports/shared/bazi-full-review-manifest.json)
- [Reference inventory](../../content/reports/shared/report-production-reference.json)

Different locale lengths are allowed. Page counts are measured output, not a template requirement. These files embed report HTML and CSS; remote editorial imagery still requires network access. Runtime page-fit findings are exposed as `window.reviewQuality`; they are not human acceptance.

## Known acceptance blocker

The historical `docs/guided-report-successor-r2/bazi-source.json` has only reading and temporalSnapshot, without trusted account subject identity or birth-input binding. The fixture chart is 己巳・庚午・癸丑・戊午. A cover-only fixture elsewhere supplies an unrelated birth date and is not trusted lineage for this chart.

The review therefore preserves the original cover and explicitly reports `subjectBindingVerified: false`. Do not invent a name/date or derive a supposedly independent semantic fingerprint from a proposed overlay. Recover the original account-person / canonical-birth-input / semantic binding, or regenerate the complete reading from a governed controlled subject before final identity acceptance. This is a permitted technical/subject repair, not a narrative redesign.

## Human review checklist

Read ZH and EN independently from cover through the end:

- Continuity: S02 vs S01, career vs personality, wealth vs career, guidance vs recap.
- Specificity: one subject throughout, no generic-reader or identity drift; resolve the binding blocker above.
- Rhythm: density, empty space, orphan paragraphs, isolated headings, chart/text balance.
- Visual continuity: cover, fixed opening, ten Section Masters, dynamic body.
- Language: natural reading in each locale; bilingual master labels are intentional and not automatically leakage.
- Sources/boundaries: method constraints and timing remain source-bound.

Record only **ACCEPT** or **REJECT** after review; pending is represented by a null decision, not a third decision value. A rejection must name affected pages/sections and narrowly scoped fixes. Only a genuine full-report ACCEPT may switch both freeze/reference booleans to true.

## Validation and limitations

Passed locally: owner-receipt digest check, accepted-copy closure (both locales, one opener per section, no exact accepted-block duplication), shared customer-delivery check, and rollout artifact integrity check. Accepted copy is unchanged and no provider call is needed.

The historical shared delivery contract is still a BaZi-only QA/preview pilot; a report architecture reference does not prove production purchase→release→account delivery. Full visual/language review and trusted subject acceptance remain outstanding.
