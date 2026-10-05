# Zi Wei VFR R1 Status

Work: VFR-ZWR-0 through VFR-ZWR-10

- VFR-ZWR-0 OLD W4–W10 customer hot-path retirement: STAGED. Old R5 canonical binding remains active until W8 live evidence and W9 HUMAN ACCEPT exist. The gated cutover script retires it atomically.
- VFR-ZWR-1 Compact bilingual Zi Wei Authoring Pack: IMPLEMENTED. Single canonical claim prose, bilingual output contract retained.
- VFR-ZWR-2 <=USD1 preflight budget estimator: IMPLEMENTED. First-call precheck <=USD0.80; total budget <=USD1.
- VFR-ZWR-3 Deep Manuscript content architecture: ACCEPTED. Historical one-call summary architecture is superseded. Current representative content uses five-call deep manuscript generation plus targeted completeness repair, with zero semantic AI review and no post-call semantic verifier.
- VFR-ZWR-4 Deterministic Zi Wei factual guard: ALIGNED. Authority Pack owns chart facts, section identity, timing and deterministic authorityRefs. The factual boundary does not judge customer prose after a paid Sol call.
- VFR-ZWR-5 15 deterministic diagram-data bindings: ALIGNED. ZWD-01 through ZWD-15 remain deterministic and provider-free; the Deep 47-page plan binds each exactly once.
- VFR-ZWR-6 47-page visual-first publication: DEEP MANUSCRIPT REBOUND. Front matter remains P01-P05, P06 is natal overview, section masters carry the opening deep-manuscript paragraphs, remaining prose is distributed across READING pages, and all 15 diagrams bind exactly once.
- VFR-ZWR-7 zero-cost rerender + immutable cache: DEEP CACHE ALIGNED. Cache identity now includes authority digest, repaired-result digest, page-plan version, diagram data version/digest, visual-binding version, renderer version and publication-IR version. Rerender provider calls are explicitly zero.
- VFR-ZWR-8 representative live Sol generation: PASS / DEEP MANUSCRIPT AUTHORITY. Five initial Sol calls plus nine targeted completeness repairs produced ten complete bilingual manuscripts at total experiment cost USD0.647181, semantic review calls=0. Legacy one-call evidence is superseded.
- VFR-ZWR-9 Browser / print Human Review: NEXT / NOT YET ACCEPTED. The builder now consumes REPAIRED-RESULT.json through deterministic DEEP-PUBLICATION-IR, renders 47 pages with all ZWD-01..15 exactly once, records zero-provider rerender provenance, and awaits browser/print human review.
- VFR-ZWR-10 Production cutover: GATED. Requires Deep Manuscript W8 authority + W9 readiness PASS + explicit HUMAN ACCEPT. Old R5 hot path remains active.

## Required execution order

1. npm run check:vfr:zwr-deep-alignment
2. npm run check:vfr:zwr-cache-prelive
3. npm run check:vfr:zwr-live
4. npm run build:vfr:zwr-human-review
5. npm run check:vfr:zwr-human-review-readiness
6. Open tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html and perform browser + print-preview review.
7. Only after genuine HUMAN ACCEPT: npm run accept:vfr:zwr-human-review -- ACCEPT
8. npm run check:vfr:zwr-cutover-readiness
9. npm run cutover:vfr:zwr-production
10. npm run check

Steps 1-5 are zero-provider. No new Sol call is required for W9 rerender. No HUMAN ACCEPT is synthesized automatically.


## Deep Manuscript experiment closure

Status: HUMAN ACCEPTED AS CONTENT ARCHITECTURE.

Evidence:
- Initial deep generation: 5 provider calls.
- Targeted completeness repair: 9 provider calls.
- Total experiment provider cost: USD0.647181.
- Semantic AI review calls: 0.
- Post-call semantic verifier: removed from paid live path.
- Repaired result: 10/10 bilingual manuscripts complete.
- One-call summary architecture: SUPERSEDED.
- Current authoritative content source for W6-W9: five-call-experiment/REPAIRED-RESULT.json.
- Production cutover remains blocked until W9 browser/print HUMAN ACCEPT.
