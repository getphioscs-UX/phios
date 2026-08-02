# EXP-W4 Reconstruction Customer Projection Acceptance

Baseline: `2299e008f503a4adda590c460e8734fac5500393`  
Freeze: `EXP-W4-v1.0.0-Frozen`

## Customer experience decision

Reconstruction now opens as the customer `Discover` stage and presents five distinct views: what is changing, how events developed, the conditions around them, confirmed facts, and unresolved parts. Runtime Chain, Inspector, source paths, figure codes, raw payloads, schema fields and numeric technical confidence are absent from the default layer.

The second layer explains why information is organized this way, opens supporting information without duplicate cards, identifies conflicts, and lists what needs confirmation. Technical details remain available only after an explicit view selection.

Customers can correct evidence, adjust reported time, change condition or relationship classification, remove an inaccurate relationship, answer “uncertain”, and confirm the current version. Adding an event or changing the source description returns to the bounded Entry revision flow because the current Runtime Contract does not authorize arbitrary event creation inside Reconstruction.

Existing Runtime behavior remains authoritative: corrections create a new Reconstruction version, history is retained, and material revisions mark earlier Reading and Navigation artifacts stale.

## Scorecard

| Page | Purpose | Next step | Customer language | Hierarchy | Continuity | Completion | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Reconstruction | 3 | 3 | 2 | 3 | 2 | 2 | **15/18** |

The score exceeds the EXP-W4 minimum of 13/18. This is code-level acceptance only; Production visual acceptance requires the committed deployment to be inspected.

## Boundaries

No Runtime, Runtime Contract, Registry, Schema, Migration, D1, Payment, Entitlement, Provider, PWS object, Professional scope or Knowledge publication file changed. A green `npm run check` establishes regression safety only and does not establish Production experience acceptance.
