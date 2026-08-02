# EXP-G1 Core Public Experience Gate Acceptance

Start and end working-tree baseline: `d7b5a9f57193935a3759c20a0dfc33a773a743a4`  
Production: `https://phios-github.pages.dev`  
Freeze: `EXP-Core-Public-Experience-v1.0.0-Passed`

## Decision

**EXP-G1 Passed.**

The active Core Public Experience has recovered from the EXP-W0 Failed baseline. Ten active customer surfaces average **15.60/18**; every named page exceeds its required minimum; all three core user tasks pass; the scope contains **0 P0** and **0 P1** defects.

The historical Demo is not reinstated. Both old Demo URLs return HTTP 308 in one hop to the sole Reality Journey Overview and are excluded from the active score. EXP-W0 remains Failed as the historical baseline.

## Gate matrix

| Condition | Required | Actual | Result |
|---|---:|---:|---|
| P0 | 0 | 0 | Pass |
| Open P1 in scope | 0 | 0 | Pass |
| Core average | ≥13/18 | 15.60/18 | Pass |
| Home | ≥14/18 | 16/18 | Pass |
| Entry | ≥13/18 | 14/18 | Pass |
| Reconstruction | ≥13/18 | 15/18 | Pass |
| Reading | ≥13/18 | 16/18 | Pass |
| Navigation | ≥12/18 | 15/18 | Pass |
| Review | ≥12/18 | 16/18 | Pass |
| Memory | ≥12/18 | 16/18 | Pass |
| Continuity | ≥12/18 | 17/18 | Pass |
| Core user tasks | 3 Pass | 3 Pass | Pass |

## Production and regression evidence

Production returned the current-main HTML byte-for-byte for Home, About, Journey Overview, Entry, Reconstruction, Reading, Navigation, Review and My Reality. The Demo retirement and My Reality canonical redirects return HTTP 308. The live Public Journey acceptance passes eight routes and nine critical assets.

The live script initially failed because it asserted the obsolete `id="stage-entry"` removed by EXP-W3. The accepted Overview uses `id="journey-flow-title"` and a six-item `.journey-stage-list`. Updating that one assertion restores the live check without changing page behavior or relaxing any customer gate.

The full check then exposed an EXP-W6 packaging regression: `d7b5a9f` placed the new Navigation renderer acceptance hash inside `content/knowledge/registry/` instead of its existing authority file. The misplaced copy is removed, the same hash is applied to `content/registry/m3c-navigation-operationalization.json`, and the frozen Knowledge count returns to 12. This restores the intended EXP-W6 acceptance evidence without changing a Knowledge Registry object, schema or authority.

Final `npm run check` passed, including the EXP-W4–W6 regressions and the new EXP-G1 postcheck. Its success establishes regression safety; the Passed decision above rests on the separately documented Production routes, page scores and user tasks.

## Boundary statement

Public page behavior is unchanged by EXP-G1. Runtime Contract, Registry authority, Schema, Migration, D1, Payment, Entitlement, Consent, Provider, Professional scope and Knowledge publication are unchanged. EXP-G1 adds gate evidence, repairs one stale Production assertion and removes one incorrectly placed non-Knowledge duplicate from the Knowledge Registry directory.

Commercial Runtime work is not executed in this step. The next step may begin only from a new latest main containing this Gate freeze.
