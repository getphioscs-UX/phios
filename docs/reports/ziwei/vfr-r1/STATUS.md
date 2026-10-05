# Zi Wei VFR R1 Status

Work: VFR-ZWR-0 through VFR-ZWR-10

- VFR-ZWR-0 OLD W4–W10 customer hot-path retirement: STAGED. Old R5 canonical binding remains active until W8 live evidence and W9 HUMAN ACCEPT exist. The gated cutover script retires it atomically.
- VFR-ZWR-1 Compact bilingual Zi Wei Authoring Pack: IMPLEMENTED. Single canonical claim prose, bilingual output contract retained.
- VFR-ZWR-2 <=USD1 preflight budget estimator: IMPLEMENTED. First-call precheck <=USD0.80; total budget <=USD1.
- VFR-ZWR-3 ONE-CALL Sol bilingual Visual Report IR: IMPLEMENTED. gpt-5.6-sol, one planned provider call, zhHans + en in one structured response.
- VFR-ZWR-4 Deterministic Zi Wei factual guard: IMPLEMENTED. Authority refs, section set, forbidden assertions and structural output checks.
- VFR-ZWR-5 15+ deterministic diagram-data bindings: IMPLEMENTED. 15 deterministic diagrams, zero provider calls.
- VFR-ZWR-6 47-page visual-first publication: IMPLEMENTED. 47-page deterministic plan, <=50 page guard, visual/prose density constraints.
- VFR-ZWR-7 zero-cost rerender + immutable cache: IMPLEMENTED. Immutable cache identity/conflict contract plus composer replay hook.
- VFR-ZWR-8 one representative live Sol generation: HISTORICAL PASS on composer v3 (1 provider call, 0 semantic review, USD0.158980, 10 bilingual sections, 15 diagrams, 47 pages). Current v4 semantic contract requires one final candidate regeneration before W9 acceptance.
- VFR-ZWR-9 Browser / print Human Review: REPAIR IN PROGRESS / NOT ACCEPTED. R2 P01-P05, BODY, both motifs and all ten section assets are bound; section-scoped diagram projections, customer-facing Zi Wei labels, timing differentiation, closing boundary, print-fit diagnostics and editorial completeness gates are active. Existing v3 English copy is rejected for clipped sentences.
- VFR-ZWR-10 Production cutover: GATED. Requires current v4 live evidence + W9 readiness PASS + explicit HUMAN ACCEPT. Old R5 hot path remains active.

## Required execution order

1. npm run check:vfr:zwr-prelive
2. npm run check:vfr:zwr-visual-prelive
3. npm run check:vfr:zwr-cache-prelive
4. $env:REPORT_PROVIDER_LIVE_ALLOWED='true'; $env:OPENAI_API_KEY='<local secret>'; npm run run:vfr:zwr-live
5. npm run build:vfr:zwr-human-review
6. Open tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html and perform browser/print human review.
7. Only after genuine acceptance: npm run accept:vfr:zwr-human-review -- ACCEPT
8. npm run check:vfr:zwr-cutover-readiness
9. npm run cutover:vfr:zwr-production
10. npm run check

No live provider call is permitted in zero-cost regression scripts. No HUMAN ACCEPT is synthesized automatically.


## FIVE-CALL DEEP SEMANTIC MANUSCRIPT experiment

Status: READY FOR CONTROLLED A/B TEST. This lane does not modify production cutover authority.

Purpose: test whether the one-call bilingual 10-section constraint is the primary cause of shallow prose.

Control:
- Existing one-call candidate remains the production reference lane.
- Five-call experiment uses 5 batches x 2 sections.
- Same compact authority pack, same gpt-5.6-sol route, same bilingual requirement.
- PHI OS still owns all diagrams, colors, layout, page plan and publication structure.
- No semantic AI reviewer.
- Experiment hard budget: <= USD1 total.
- Output ceiling: 6000 tokens per batch.
- W10 production cutover remains prohibited from using the five-call result unless a later explicit human decision changes the production architecture.

Execution:
1. npm run check:vfr:zwr-five-call-prelive
2. Set REPORT_PROVIDER_LIVE_ALLOWED=true locally.
3. npm run run:vfr:zwr-five-call-experiment
4. Remove REPORT_PROVIDER_LIVE_ALLOWED.
5. npm run check:vfr:zwr-five-call-result
6. npm run build:vfr:zwr-five-call-comparison
7. Open tools/review/ZWR-VFR-FIVE-CALL-COMPARISON.html
