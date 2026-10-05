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
- VFR-ZWR-8 one representative live Sol generation: READY_TO_RUN. Requires explicit REPORT_PROVIDER_LIVE_ALLOWED=true and OPENAI_API_KEY. Evidence written to LIVE-RESULT.json and LIVE-EVIDENCE.json.
- VFR-ZWR-9 Browser / print Human Review: READY_TO_BUILD after W8. Review artifact: tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html. HUMAN ACCEPT must be explicit.
- VFR-ZWR-10 Production cutover: GATED. check:vfr:zwr-cutover-readiness requires W8 evidence + W9 HUMAN ACCEPT. cutover:vfr:zwr-production then swaps canonical binding from old R5 generation to Zi Wei VFR R1 and writes PRODUCTION-CUTOVER.json.

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
