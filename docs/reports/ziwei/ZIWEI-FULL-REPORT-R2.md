# Zi Wei Full Report R2 — implementation and review record

Status: ACCEPTED_FROZEN. The user's ACCEPT_WITH_NARROW_REPAIR and F5 authorization are fulfilled by the verified S11 repair. Editorial acceptance and reference-implementation freeze are recorded; production admission, commerce E2E and customer release remain separate.

Review: [bilingual, two-subject switcher](../../../tools/review/ZIWEI-FULL-REPORT-R2-REVIEW.html).
The switcher exposes source-node/page mapping, measured fit modes, section assets and palace evidence roles. Its customer links open the reports without audit controls.

## Scope and preservation

R2 composes the admitted R1 material into section-specific editorial structures. Original section claim objects, subject evidence, natal placements, calculation digests and time layers are unchanged. Existing PRO-R2 dimensions are referenced by placement, star and dimension; cross-section references reuse existing claims in the Publication IR brief. They do not create calculation facts. The calculator, 28-star authority, unknown brightness states and Publication IR architecture remain unchanged.

The W0 baseline is [baseline.json](full-report-r2/baseline.json), recorded at HEAD `bae1b1796a91cf554079f6e0fcb2aa4a9fbe94b9`. It hashes the R1 artifacts, registry, section composer and authority sources. R1 remains independently available for comparison.

## Work-order coverage

| Work | Delivered evidence |
| --- | --- |
| W0 | Frozen R1 file hashes, claims, timing and authority digests; checked before regeneration and QA. |
| W1–W2 | Dedicated generated visual registry and resolver; all ten section images mapped to the specified chapters. S08 uses SECTION STYLE. |
| W3–W4 | Real section imagery, BODY and two existing SVG motifs; chapter-specific cropping and placement. S09/S11 share the timing family with different treatments. |
| W5 | Existing data-driven palace and timing panels preserved; synthetic repeated palace motifs suppressed only for R2-bound pages. |
| W6–W8 | Distinct Core Orientation and Inner Structure grammars; Life/Body tension, private expectations and recovery conditions. |
| W9 | Work function, conditional task examples, delivery conditions, failure modes and navigation. A uses Po Jun/Tian Fu; B follows its own placements. |
| W10 | Six resource dimensions: acquisition/retention, acquisition, allocation, ownership, optionality and a resource-record test. |
| W11 | Every displayed palace classified with a role and reason. Per-block evidence references identify admitted dimensions; unused context has an explicit reason. |
| W12–W14 | Relationships, three-palace family/support, and Health-led symbolic pressure/recovery use each subject's actual placements. Medical boundaries remain explicit. |
| W15–W16 | Natal, long-cycle and annual layers compared separately; no monthly or event-date extrapolation. |
| W17 | Five navigation questions: protect, change, avoid overcommitment, observe now, and revision evidence. |
| W18 | Repeated-skeleton checks and names-masked A/B differentiation checks, alongside grammar and locale-parity assertions. Human review remains necessary for editorial quality. |
| W19 | Required-image loading/decode checks, HTTP verification, local SVG hashes, no synthetic fallback motifs, browser errors, typography and clipping checks. |
| W20 | Four reports, 33 actual printed pages each; shared page architecture and source-block coverage validated. |

## Verification and reproducibility

Commands:

```text
npm run build:ziwei-report-visual-registry
npm run build:ziwei-full-report-r2
npm run check:ziwei-report-r2
npm run check:ziwei-report-visuals
```

The full checker uses Edge rendering and PDF page counts, with screenshot samples for each subject/locale. The visual-only command runs the same structural and asset checks while preserving the full print measurement evidence.

Evidence:

- [Browser/print measurements](full-report-r2/browser-measurements.json): four 33-page reports, no overflow, clipped source paragraphs, broken images or browser errors.
- [Visual verification](full-report-r2/visual-verification.json): twelve remote WebPs return HTTP 200; both local canonical SVGs match their registered hashes. All ten section families, BODY and both motifs load in the rendered reports.
- [Editorial checks](full-report-r2/editorial-checks.json): original claims, evidence utilisation, source coverage, grammar variation and subject differentiation.
- [Manifest](../../../content/reports/ziwei/full-report-r2-manifest.json): measured physical-page map, source nodes, fit modes and review state.

Focused regressions passed: BaZi visual/commerce boundary, RNT2 adversarial checks and Zi Wei Publication IR. Rendering the two frozen 38-page BaZi snapshots through the shared renderer reproduced their existing HTML main content byte for byte. This establishes renderer compatibility; it does not establish commerce E2E or production admission.

## Final narrow repair and acceptance

S11 retains its five accepted source paragraphs and all claims. Five visible headings now identify protection, change, overcommitment, current observation and revision evidence. A compact NEXT REVIEW WINDOW offers five customer prompts and explicitly describes the next 30–90 days as an observation/review horizon, not astrological event timing.

The repair reuses the existing R2 records without regenerating any section narrative or Publication IR. All four evidence files remain byte-identical. The other 32 pages of each rendered report remain byte-identical within the report body. The shared renderer, visual registry, mappings, images and motifs remain unchanged. Only the S11 presentation adapter and its scoped stylesheet were added.

All four actual printed reports remain 33 pages, with no overflow, clipped source text, clipped action panel, missing assets or browser errors. Chinese and English S11 screenshots were inspected. [Narrow-repair verification](full-report-r2/narrow-repair-verification.json) records preservation hashes and page counts; [acceptance](../../../content/reports/ziwei/full-report-r2-acceptance.json) records all seven editorial ACCEPT states and the content/reference freeze. The build command verifies frozen inputs and reuses the accepted reports.

`ZIWEI_UNUSED_BAZI_CSS_INHERITANCE = TECH_DEBT` is recorded in the [technical-debt register](../../../content/reports/ziwei/technical-debt.json). It is not an acceptance blocker; no shared CSS or renderer refactor was performed.

BaZi content and Composition R1 remain frozen, and its historical sample is not rebound to a manufactured identity. Editorial acceptance does not establish Zi Wei production admission, commerce E2E or customer release.
