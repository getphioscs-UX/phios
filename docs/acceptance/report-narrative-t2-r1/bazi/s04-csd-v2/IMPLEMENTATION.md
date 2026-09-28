# RNT2-W30–W58 · Customer-specific narrative depth

Scope: BaZi S04 only, `T2_CSD_V2`, REVIEW_ONLY. The predecessor is retained and its two technically passing snapshots are registered as HUMAN EDITORIAL REJECT in PREDECESSOR-REJECTION.json. Neither a new machine result nor a rebuild can turn that rejection into acceptance.

## Contracts and source ownership

- W30: digest-bound predecessor rejection and the independent technical/editorial/owner state model.
- W31–34: PaidReportCustomerValueContract, a 1–3 sentence thesis contract, bilingual method/domain translation canon and conditional scenario grammar in `bazi-s04-customer-value.js`.
- W35–42: `bazi-s04-career-ir.js` consumes the existing rich claim Brief and its deterministic facts. It selects and ranks supported career mechanisms, keeps sourceClaimIds/sourceRefs, derives advantage/cost and fit/mismatch pairs, selects distinct scenarios, integrates separate timing layers and creates a practical decision sequence. Missing evidence fails closed; it does not fill a universal scenario list. Every required IR field is retained, with repeated objects normalized to node references.
- W43–50, W53–55: R4 extends existing editorial/semantic infrastructure with primitive exposure, disclaimer repetition, customer-value sentence ratios, observable-expression ratios, thesis/scenario depth, name removal, section substitution, paragraph function, and cross-subject comparison. Independent semantic review must return an exact candidate quotation for every editorial assessment. IDs and keyword counts alone do not establish editorial acceptance. Heuristic thresholds remain initial calibration settings.
- W51–52: a digest-bound S04 Brief successor and conditional branch in the existing `narrative-writer.js`; no second writer, T3 activation or new provider. Original primitive claims and normalized source facts remain available to the independent reviewer. Final prose is written from derived interpretation objects, not a primitive-label glossary.
- W56–57: existing protected QA route, separate immutable `qa/rnt2/csd-v2/s04/` namespace and the read-only snapshot importer `build-bazi-s04-csd-review.mjs`. One combined bilingual HTML prioritizes customer prose; evidence is collapsed. Predecessor and production snapshots are not overwritten.
- W58: explicit owner acceptance is required. S03/S05 and other methods remain outside admission. Every other method needs its own authority, canon, uncertainty contract and section Brief.

## Testing and cost

The ten requested `check:bazi-s04-*` commands share one checker; `npm run check:bazi-s04-csd` runs all and is included in the existing RNT2 CI workflow. Tests cover missing provenance, source digest tampering, unsupported source eligibility, absent independent review, invalid evidence quotations, generic/name-only prose, primitive leakage, repetitive disclaimers and independently tracked owner rejection.

Twenty-four existing synthetic deterministic campaign charts exercise mechanism selection; raw canon text is intentionally rejected by the cross-subject prose guard. Two fixed synthetic profiles are available in the protected QA route for final generated-prose comparison with the agreed review subject. No private customer data is added to those fixtures. The final live comparison is recorded separately from deterministic fixture tests.

The provider remains the existing routed OpenAI model. The successor uses a bounded 120-second transport timeout and a 10,000-token output ceiling to avoid truncating a full section. Existing transient retry and one targeted repair limits remain; the original verification defects are recorded before repair. R4 defects are passed to that same bounded repair, never to an unbounded quality retry loop. QA usage is labeled QA_REVIEW; estimated cost is not final billing. Frozen reopen does not make another model request.

## Regression results

Passed before live generation: CSD ten-check suite, RNT2 core/adversarial/private-review, shared customer delivery, existing BaZi section rendering/page-family/asset/locale tests, existing editorial-quality regressions, Cloudflare import compatibility, package alias registry, and Pages Worker build. These do not imply owner acceptance or production admission.

## Review boundary

Final live results, request counts, retries, repairs, cache state, source facts, Career Narrative IR, provenance, verifier outputs and bilingual text are retained in REVIEW-EVIDENCE.json and review.html after import. Do not claim TECHNICAL_PASS or EDITORIAL_AUTOMATED_PASS without those frozen records. Owner acceptance remains PENDING until an explicit owner decision, even if every automated check passes.

Implementation references: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Cloudflare Workers practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/), [Pages direct upload](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
