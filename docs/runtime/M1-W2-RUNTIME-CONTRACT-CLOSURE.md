# M1-W2 Runtime Contract Closure

Status: **Contract Closed**  
Registry: `content/registry/runtime-contracts.json`  
Baseline: `8123e0a`

M1-W2 freezes the contracts already used by the seven Runtime Stages and the browser Runtime services. It does not add a Runtime Stage or introduce new product behavior.

## T01 — Contract Registry

Twenty contracts are registered across four classes:

| Class | Contracts |
|---|---|
| Stage input/output | Runtime Entry, Reconstruction, Reading Input, Reality Reading, Navigation Input, Navigation, Review, Runtime Memory, Continuity |
| Stage handoff | Reading → Navigation, Reading Revision Request, Entry Continuity Handoff |
| Runtime service | Transition Execution, Revision Initialization, Entry Initialization, Lineage, Snapshot, Recovery State, Workspace State |
| Public boundary | Runtime Kernel status |

Each registry entry freezes `id`, `version`, `status`, `input`, `output`, `required_fields`, `optional_fields`, `errors`, `dependencies`, its schema identifier, owner, contract class, and validator authority.

## T02 — Schema ID and Version Freeze

The following primary Stage schema IDs are closed:

```text
phi-os.runtime-entry.v1
phi-os.reconstruction.v1
phi-os.reading-input.v1
phi-os.reality-reading.v1
phi-os.navigation-input.v1
phi-os.navigation.v1
phi-os.review.v1
phi-os.runtime-memory.v1
phi-os.continuity.v1
```

Breaking changes require a new schema ID and an explicit migration. Existing identifiers are append-only and remain readable. The browser and server schema registries must expose the same primary Stage identifiers. M1-W2 closes the previously missing browser-side `RUNTIME_MEMORY` registration.

## T03 — Stage Handoff Freeze

| From | To | Contract or gate | Closure rule |
|---|---|---|---|
| Entry | Reconstruction | Runtime Entry | No automatic advance |
| Reconstruction | Reading | Reading Input | Reconstruction remains source evidence |
| Reading | Navigation | Reading → Navigation v2 | Unknown Reality preserved; no path selection |
| Navigation | Review | Navigation | Explicit user path selection required |
| Review | Memory | Review | Customer report and outcome remain distinguishable |
| Memory | Continuity | Runtime Memory | Unresolved Reality remains available |
| Continuity | Transition | Continuity | Explicit confirmation required |
| Transition | Reading | Revision Request | Creates a new revision, never overwrites history |
| Transition | Entry | Entry Continuity Handoff | Prepares a new Runtime; does not create it automatically |

## T04 — Contract Guardrail Matrix

| Guardrail | Runtime boundary |
|---|---|
| No new Runtime Stage | Inventory, Workspace, Kernel |
| No automatic path selection | Navigation |
| No automatic transition execution | Continuity, Transition |
| No automatic Runtime creation | Transition, Revision |
| No historical overwrite | Revision, Lineage, Persistence |
| Unknown Reality preserved | Reading through Continuity |
| Reported experience is not verified evidence | Review, Memory, Lineage |
| Professional boundary requires consent | Navigation, Continuity |

## Closure Rules

1. Existing schema IDs cannot be silently repurposed.
2. Required boundary fields cannot be removed under the same schema ID.
3. A handoff may validate and prepare the next Stage, but cannot bypass its user gate.
4. Browser pages consume Kernel services through `assets/js/runtime/index.js`.
5. Historical contracts are append-only.
6. `npm run check:runtime-contracts` must pass before Runtime changes merge.

M1-W2 completion changes the Runtime Engine state from `Feature Complete` to `Contract Closed`. `Freeze Ready` remains pending the final freeze audit and bug-only gate.
