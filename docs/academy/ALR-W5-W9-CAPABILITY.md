# ALR-W5～W9 Capability

Baseline: `c1ded91129cea2e9406f49c5066fdf041df0c1eb`

Status: frozen semantic runtime; learner-data and Capability State persistence remain inactive.

## Completed work

- **ALR-W5** registers five canonical Learning Capabilities under the `ALR-CAP-` namespace. They do not reuse PWS Professional Capability definitions.
- **ALR-W6** establishes an explicit `REQUIRES` dependency graph. The graph is acyclic, all direct dependencies are required, and dependency satisfaction never grants Capability State.
- **ALR-W7** consumes RDG-governed Capability Evidence eligibility and evaluates registered ALR criteria. ALR is semantic authority; RDG remains data-governance authority.
- **ALR-W8** defines governed Capability States and explicit transitions. The evaluator returns transition eligibility only and performs no persistence or user-data mutation.
- **ALR-W9** identifies deterministic prerequisite, state, evidence, maintenance, disputed and unknown gaps. A gap is neither a deficit judgment nor a learning recommendation.

## Authority chain

`Learning Exposure → Practice → Assessment → Capability Evidence → Capability State`

The chain is governed by these invariants:

- Lesson completion is not Capability.
- Assessment score alone is not Capability Evidence.
- Capability Evidence is not Capability State.
- CAR briefs and assets cannot promote Capability.
- RDG governs evidence data and eligibility but cannot determine Capability State.
- ALR Capability cannot grant PWS Capability, Credential, Entitlement, Professional Readiness or Professional Judgment authority.

## Runtime boundary

This work establishes canonical registries, contracts and pure semantic evaluators. It intentionally does not activate a learner store, write Capability State, create Program/Learning Path/Module/Lesson content, generate Learning Recommendations, modify Academy presentation, or change RDG/PWS/CAR frozen artifacts.

The next permitted work is **ALR-W10 Program**.

## Checks

```sh
npm run check:alr-foundation
npm run check:alr-capability
npm run check
```
