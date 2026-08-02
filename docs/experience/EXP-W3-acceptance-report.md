# EXP-W3 Journey Overview, Demo and Entry Acceptance

Baseline: `3e6c7cf493b2b6182c0fa00754cc35797d1284b8`  
Freeze: `EXP-W3-v1.0.0-Frozen`

## Customer journey decision

The only customer-facing model is `Enter → Describe → Discover → Understand → Choose → Continue`. The seven internal Runtime stages remain unchanged for execution and lineage, but Entry and Overview no longer ask customers to learn them as a second journey.

Overview has one hero primary action: start a new Reality Journey. Resume/status and the no-save Demo are subordinate choices. The page explains what to bring, browser recovery, current status, Demo versus formal Journey and the separate Professional service boundary.

Demo uses a fixed teaching case plus optional local input. It creates no personal reading, starts no Journey, saves nothing and carries nothing into Entry. Its continuation returns to the Overview so the customer can compare before starting.

Entry is the customer `Describe` stage. Existing protected content stays hidden until explicit Resume. A failed submission keeps the typed response for correction or retry. Internal Runtime workspace navigation remains available to unchanged Runtime code but is not customer-visible.

## Scorecard

| Page | Purpose | Next step | Customer language | Hierarchy | Continuity | Completion | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Journey Overview | 3 | 3 | 3 | 3 | 2 | 2 | **16/18** |
| Demo | 3 | 3 | 3 | 2 | 2 | 2 | **15/18** |
| Entry | 3 | 3 | 2 | 2 | 2 | 2 | **14/18** |

Entry exceeds the EXP-W3 minimum of 13/18. Scores are code-level acceptance only until deployment and Production verification.

## Boundaries

No Runtime behavior, Runtime Contract, Registry, Migration, D1, Payment, Entitlement, Provider, Professional Contract or Knowledge publication file changed. A green `npm run check` proves regression safety, not Production experience acceptance.
