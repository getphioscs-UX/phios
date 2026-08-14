# MCD-4 | Execution

MCD-4 establishes the production delivery execution sequence:

`Request -> MPA Evaluation -> Canonical Input Evaluation -> Adapter Binding -> Partial Execution -> Reason Codes`.

MPA is evaluated first. A blocked MPA decision stops before input or Core Runtime invocation. HDR therefore fails closed regardless of input completeness.

MCD-4 does not rewrite historical Core Runtime execution semantics. Immutable Core algorithms continue to execute in their frozen `validation` execution mode, while MPA successor authority controls whether MCD may use that deterministic calculation in a production delivery flow. Raw Core results remain internal execution artifacts until MCD-5 creates a Canonical Method Projection.

Current executable scope:
- NUM: Birth Number and Number Structure execute; Cycle executes only when an explicit target date and governed timezone context are available.
- AST: MPA/input/adapter stages execute, while astronomical calculation is deferred until the governed Astronomy Engine runtime adapter is materialized.
- BZR: MPA/input/adapter stages execute, while Solar Term / Pillar calculation is deferred until its governed runtime adapters are materialized. Unknown birth time remains an explicit three-pillar degrade path.
- HDR: Production invocation remains forbidden at MPA and adapter boundaries.
