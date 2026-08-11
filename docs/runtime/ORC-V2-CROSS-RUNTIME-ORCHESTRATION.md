# PHI OS｜ORC v2 Cross-Runtime Orchestration

ORC v2 coordinates governed runtime transitions. It does not inherit or exercise any domain authority.

Canonical orchestration order:

Case Opened → Consent Valid → Input Verified → Reality Initialized → Method Calculated → Projection Frozen → Meaning Resolved → Knowledge Coverage Checked → Readout Generated → Journey Activated → Professional Handoff → Professional Decision → Report Assembled → Report Approved → Report Released → Action Recorded → Outcome Observed → Review → Continuity.

Not every service uses every state. A state may be omitted only by a governed service profile; ad-hoc skipping is forbidden.

ORC consumes only governed runtime-state and governance references under RDG and writes only SYSTEM_OPERATION_RECORD. Domain payloads remain with their authoritative runtimes.

Recovery starts from the last committed canonical state. Idempotent replay never duplicates case, report, payment, projection, or action operations. Operational replay reconstructs orchestration state without re-executing external side effects.

RG-W9 integration is implemented as an explicit post-freeze successor extension. Frozen RG v1/v3 artifacts and the global `check:runtime` alias are not silently rewritten. ORC is registered through `check:runtime:v4`.

The ORC-W11 PILOT artifact is an acceptance fixture. It does not activate PHASE PILOT runtime authority.
