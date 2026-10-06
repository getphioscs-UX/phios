# Zi Wei VFR R1 Status

Work: VFR-ZWR-0 through VFR-ZWR-10

- VFR-ZWR-0 OLD W4–W10 customer hot-path retirement: STAGED. Old R5 canonical binding remains active until W8 live evidence and W9 HUMAN ACCEPT exist. The gated cutover script retires it atomically.
- VFR-ZWR-1 Compact bilingual Zi Wei Authoring Pack: IMPLEMENTED. Single canonical claim prose, bilingual output contract retained.
- VFR-ZWR-2 <=USD1 preflight budget estimator: IMPLEMENTED. First-call precheck <=USD0.80; total budget <=USD1.
- VFR-ZWR-3 Deep Manuscript content architecture: ACCEPTED. Historical one-call summary architecture is superseded. Current representative content uses five-call deep manuscript generation plus targeted completeness repair, with zero semantic AI review and no post-call semantic verifier.
- VFR-ZWR-4 Deterministic Zi Wei factual guard: ALIGNED. Authority Pack owns chart facts, section identity, timing and deterministic authorityRefs. The factual boundary does not judge customer prose after a paid Sol call.
- VFR-ZWR-5 15 deterministic diagram-data bindings: ALIGNED + W9R2 VISUAL ENRICHED. ZWD-01 through ZWD-15 remain deterministic and provider-free; the current bilingual page plan binds each exactly once. Renderer v3 adds a 4x4 Zi Wei palace board, Life-Body axis, focused palace geometry, major-star atlas, transformation tracks, palace-orbit thematic diagrams, timing layers and a six-domain navigation wheel.
- VFR-ZWR-6 bilingual visual-first publication: DEEP MANUSCRIPT REBOUND / 57-PAGE LANGUAGE-SEQUENTIAL W9R4. Each S02-S11 chapter now uses a distinct visual master, one diagram page, two full-width Chinese reading pages and one full-width English reading page. Four related diagram pairs share composite pages. Fixed side-by-side bilingual reading is retired because Chinese and English have different density.
- VFR-ZWR-7 zero-cost rerender + immutable cache: DEEP CACHE ALIGNED. Cache identity now includes authority digest, repaired-result digest, page-plan version, diagram data version/digest, visual-binding version, renderer version and publication-IR version. Rerender provider calls are explicitly zero.
- VFR-ZWR-8 representative live Sol generation: PASS / DEEP MANUSCRIPT AUTHORITY. Five initial Sol calls plus nine targeted completeness repairs produced ten complete bilingual manuscripts at total experiment cost USD0.647181, semantic review calls=0. Legacy one-call evidence is superseded.
- VFR-ZWR-9 Browser / print Human Review: W9R4 FULL PUBLICATION REDESIGN IN REVIEW / NOT YET ACCEPTED. The builder consumes REPAIRED-RESULT.json through deterministic DEEP-PUBLICATION-IR and renders the current 57-page language-sequential bilingual plan. Chapter masters are visually distinct from reading pages; Chinese and English no longer compete for the same A4 height. The Life-Body axis is rebuilt as a compact dual-palace axis, and sparse Four-Transformation evidence uses a focused admitted-transformation composition rather than empty tracks. HUMAN ACCEPT remains blocked until browser/print review reports overflow=0 and the fixed Zi Wei visual language is approved.
- VFR-ZWR-10 Production cutover: GATED. Requires Deep Manuscript W8 authority + W9 readiness PASS + explicit HUMAN ACCEPT. Old R5 hot path remains active.

## Required execution order

1. npm run check:vfr:zwr-deep-alignment
2. npm run check:vfr:zwr-cache-prelive
3. npm run check:vfr:zwr-live
4. npm run build:vfr:zwr-human-review
5. npm run check:vfr:zwr-diagram-visual-enrichment
6. npm run check:vfr:zwr-human-review-readiness
7. Open tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html and perform browser + print-preview review.
8. Only after genuine HUMAN ACCEPT: npm run accept:vfr:zwr-human-review -- ACCEPT
9. npm run check:vfr:zwr-cutover-readiness
10. Do not run production cutover until the Deep Manuscript production binding implementation is explicitly reviewed.
11. npm run check

Steps 1-6 are zero-provider. No new Sol call is required for W9 rerender. No HUMAN ACCEPT is synthesized automatically.


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
