# BOOK-V-CIV-ATLAS-R1-W3 | Shared Atlas State + URL Contract

Status: COMPLETE
Baseline: `35bba5e0d9ce328801e5d56d812851bb1aad2044`

W3 establishes the single customer interaction state for the Book V Civilization Atlas. It does not populate any L2-L8 historical registry and does not activate any later-wave renderer.

## Contract

- One normalized `CivilizationAtlasState` owns active layer, time, period, snapshot, regions, cases, comparison family, trajectories, transition, loss selection, evidence filters, compare basket and locale.
- Unknown or malformed URL values recover to safe defaults instead of crashing the page.
- Atlas state is URL-addressable through query parameters and the canonical `#atlas` anchor.
- Browser back/forward can restore URL-derived Atlas state.
- State limits compare basket to six cases and selected trajectories to five.
- W3 introduces no new Context Resolver and no Ask runtime.

Primary files:

- `assets/js/pages/civilization-atlas/atlas-state.js`
- `assets/js/pages/civilization-atlas/atlas-url-state.js`
- `scripts/check-book-v-civ-atlas-r1-w3-state.mjs`
