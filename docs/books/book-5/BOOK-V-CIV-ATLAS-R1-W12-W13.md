# BOOK-V-CIV-ATLAS-R1-W12–W13

Baseline: `06888b69bb4ada16fdd570a598f55d311d5ea4ad`

## W12 — Cross-Layer Shared Context

The seven Atlas layers continue to use one `CivilizationAtlasState`.
When a customer switches layers, the successor adds only missing target-layer context derived from the selected case. It does not overwrite an already selected family, snapshot, trajectory set, transition window, loss type, compare basket, or case.

Supported case-seeded bridges:

- Case → Timeline period
- Case → Comparison family
- Case → available World Snapshot
- Case → related Long-Duration Trajectories
- Case → related Transition Window
- Case → Reversal & Loss profile

This is context preservation, not interpretation authority.

## W13 — Contextual Ask Binding

Atlas does not create a second Ask runtime or a new `BOOK_ATLAS` entry surface.
The current Atlas state is compressed into bounded, public, temporary `BOOK:BOOK-5` knowledge context and handed to the existing `/knowledge/ask/` → `/api/customer-contextual-ask` flow.

The carried context may identify the current layer, case, snapshot, comparison family, selected trajectories, transition, loss type, and Atlas time. It does not pre-authorize a conclusion and does not create Canonical Reality.

`Context ≠ Answer` remains the hard boundary.

## Reconciled blockers

- `check-integrated-successor-phase12-preflight.mjs` now recognizes the already-verified W31 successor state `W29_W31_COMPLETE_PHASE12_FROZEN` instead of demanding the obsolete pre-W31 state.
- `check-book-v-civ-atlas-r1-w2-schemas.mjs` checks actual JSON property keys for forbidden score/ranking shortcuts, so its own negative fixture containing the literal `collapseScore` no longer self-triggers the forbidden-string scan. The schema rejection test remains intact.
