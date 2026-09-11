# BOOK-V-CIV-ATLAS-R1-W15｜Responsive + Accessibility + Real-Data Human Acceptance

Baseline: `52dd1e46e28389a386abda37375a7aefb6c54a5b`

W15 does not change the W14 historical registry architecture. It hardens the existing customer Atlas for 360 / 768 / 1440 layouts, keyboard navigation, focus visibility, reduced-motion and forced-colors behavior, accessible table/search semantics, and real-data human review.

The human decision seed is intentionally `PENDING_HUMAN_REVIEW`. Machine checks may establish review readiness, but they may not forge a human ACCEPT decision. Use `tools/review/BOOK-V-CIV-ATLAS-R1-W15-HUMAN-REVIEW.html` through the local/site server, inspect all seven Atlas layers at the three required widths, test keyboard navigation and the existing Contextual Ask handoff, then export the decision JSON.

W16 Production Admission & Freeze must not run until the exported W15 decision is fully accepted.


## Successor acceptance record — 2026-09-11

The reviewer explicitly declared **all human accepted** against main
`d7d3a82b6fec2c48033fac346030702928065eb7`.

`tools/review/BOOK-V-CIV-ATLAS-R1-W15-HUMAN-DECISION.json` is therefore the authoritative W15 human-acceptance evidence for W16 admission. The earlier review page's lack of detailed reference prose is recorded as a review-UX limitation, not as a rejection of the customer Atlas surface.
