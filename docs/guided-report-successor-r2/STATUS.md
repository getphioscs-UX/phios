# Guided Report Successor R2 — implementation and acceptance

Baseline: `45198d17c3eb0ede4b131eccdd45823e7ad96cd0`. Review candidate dated 2026-09-21. **The attachment is not fully complete and production cutover is not active.**

[Open BaZi review](review.html) · [NOW / custom input preview](input-review.html) · [Master work](master-work.md)

## Implemented candidate

The existing canonical presentation, BaZi projection, narrative writer, provider adapter and cache owners now expose additive R2 entry points. The legacy entry points remain the production defaults. There is no second method calculation engine or PDF engine.

- Shared P07+ publication shell, eight-method page/skin registry, locale typography, bounded print fitting and one dynamic pagination component.
- P01 uses the same bilingual cover. P02–P05 retain approved images and their baked page numbers as the user's option-1 exception. P06 retains its existing template with duplicate numbering removed. P06–P26 have one dynamic folio each.
- NOW resolves from the generation instant and confirmed customer timezone. CUSTOM validates dates, timezone and DST ambiguity. The generated temporal snapshot is saved and reopening uses the existing cache rather than calculating NOW again.
- BaZi uses the existing native calculation owner. The candidate observation is 2026-09-21 11:22:57, Asia/Kuala_Lumpur, with admitted luck cycle 甲戌 and annual pillar 丙午. A separate 2024 CUSTOM regression verifies a different target year.
- Source-bound interpretation objects feed the existing PAI router and structured provider adapter. Provider failure, missing admission and semantic rejection produce a canonical fallback.
- Customer snapshots omit internal provenance. P26 contains readable closure milestones, not hashes or runtime identifiers.

## Outstanding implementation and editorial work

**T3 composition is not complete.** The candidate actually uses T2 canonical humanization because no semantic paraphrase verifier has been admitted. Wiring a provider route is not evidence of successful governed T3 generation. The remaining work includes admitting and testing that verifier and producing source-faithful domain prose through the routed writer.

The visual inspection of all 52 PDF pages found no obvious clipping. It also identified editorial acceptance concerns: P16–P18 repeat the same leading functional theme with domain-specific introductions/questions; P20–P21 have sparse prose; P06 deliberately retains a different legacy template. Exact duplicate removal does not prove semantic deduplication or premium content depth. These concerns remain open and are not recorded as human acceptance.

Other methods have registry/skin foundations only. Their P06 templates, native projections, temporal layers, localized snapshots and PDF output still need method-specific implementation and verification. The new input component has a verified preview; production form/API cutover has not occurred. Method background assets remain optional CSS fallback pending suitable asset binding.

## Phase ledger

| Master-work phase | Actual state |
| --- | --- |
| W0 baseline | Captured in baseline.json |
| W1 freeze | Static manifest recorded; BaZi P06 preserved; other P06 audits pending |
| W2–W5 visual foundation | Shared implementation; BaZi browser/PDF candidate verified |
| W6–W7 temporal foundation | Resolver, input preview and BaZi NOW/CUSTOM checks implemented; other methods pending |
| W8–W13 content foundation | Interpretation, routing, fallback, cache and exact dedup implemented; T3 admission and semantic editorial depth incomplete |
| W14 internal separation | BaZi customer HTML/PDF checks passed |
| W15 BaZi reference | Review candidate produced; not accepted as final reference |
| W16 human review | Pending; transition comparisons available in pdf-review/ |
| W17 method rollout | Pending BaZi acceptance and method-specific implementation |
| W18 asset binding | Approved intro assets used; shared CSS fallback used for P07+ |
| W19 checker | New result-based temporal, provenance, cache, HTML and PDF checks implemented |
| W20 browser/PDF | 104 page screenshots, two 26-page A4 PDFs, 52 PDF page renders |
| W21 acceptance | Checklist below; all human decisions pending |
| W22 cutover | Inactive |
| W23 production freeze | Not eligible; baseline remains active |

## Method rollout matrix

| Method | Registry pages | R2 native projection / bilingual PDF |
| --- | ---: | --- |
| BaZi | 26 | Candidate verified; editorial/T3/human acceptance pending |
| Astrology | 26 | Not migrated |
| Zi Wei | 26 | Not migrated |
| Numerology | 24 | Not migrated |
| Profile | 26 | Not migrated |
| ECR | 26 | Not migrated |
| Human Design | 32 | Not migrated |
| Cross | 34 | Not migrated |

Registry presence is not production readiness. No readiness claim is made for an unverified method.

## Human acceptance checklist

| Criterion | Evidence and open decision | Human status |
| --- | --- | --- |
| VISUAL_CONTINUITY | Compare P06→07, 07→08, 15→16, 19→20, 24→25 and 25→26 in both languages | Pending |
| CONTENT_DEPTH | Review P16–P25; T3 absent, repeated themes and sparse timing text remain | Pending |
| READABILITY | 1440/390 browser checks and A4 PDF renders pass; inspect actual reading comfort | Pending |
| METHOD_ACCURACY | Existing native engine used; structural uncertainties retained | Pending |
| TEMPORAL_COMPLETENESS | Saved NOW/CUSTOM values and actual admitted BaZi layers checked | Pending |
| LOCALE_PARITY | Same page registry and canonical numeric facts/source references; two PDFs | Pending |
| CUSTOMER_SAFETY | No predictive certainty added; method signals and lived observations separated | Pending |
| PROVENANCE_PRIVACY | Customer HTML/PDF identifier checks pass; internal metadata remains separate | Pending |

The master work §82 says “BaZi 通过以后再推广”; §89 requires “automated pass + human accepted” before production default. These gates do not excuse the outstanding T3/editorial work and are not replaced by machine checks.

## Reproduction and evidence

Run from the repository root:

```powershell
node scripts/build-guided-report-r2-review.mjs
node scripts/check-guided-report-r2.mjs
node scripts/verify-guided-report-r2-browser.mjs
python scripts/verify-guided-report-r2-pdf.py
npm.cmd run check
```

The browser checker requires Playwright (PHIOS_PLAYWRIGHT_MODULE when not installed locally), a server at port 8788, and Chromium. PDF rendering requires Python/pypdf/Pillow and Poppler (PHIOS_PDFTOPPM). Rendering checks verify layout and privacy, not human editorial approval.

Final validation: full `npm.cmd run check` completed with exit code 0, including its lifecycle checks. The final targeted `node scripts/check-guided-report-r2.mjs`, browser checker, PDF checker and `git diff --check` also passed. The new R2 checker is run separately; the governed package check-command tail was not changed.

Evidence: browser-evidence.json, pdf-evidence.json, input-evidence.json, screenshots/, pdf-review/, npm-check.log. The first full-check attempt is preserved in npm-check-first-attempt.log; it found a current-owner digest registration mismatch. The additive input owner was registered with its predecessor retained; historical frozen hashes were not rewritten.

## Cutover record

- Successor version: 2.0.0 candidate.
- Successor active: false.
- Customer publishable: false.
- Human acceptance evidence: none yet.
- Production default: existing baseline preserved.
- Commit: implementation remains uncommitted for review.
