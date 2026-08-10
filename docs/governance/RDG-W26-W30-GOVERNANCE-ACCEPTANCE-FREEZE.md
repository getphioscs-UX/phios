# RDG-W26～W30｜Governance / Acceptance / Freeze

Baseline: `ab07f77f1e389b7a99499b8f242751cc64ecc1ad`

## Closure

- RDG-W26 registers cross-runtime data types, read/write authority, purpose, persistence, sensitivity ceilings, and evidence/professional/analytics permissions for every runtime family currently present in the OP inventory.
- RDG-W27 compares Purpose, Consent, Retention, Sensitivity, Evidence, Authority, Professional Boundary, Inference, Analytics, and Deletion dimensions. Missing or unapproved change fails closed.
- RDG-W28 registers stable public identities `RDG-W0` through `RDG-W30`, routes shared implementations once for aggregate checks, and restores RDG to the `postcheck` governance chain.
- RDG-W29 provides a contract-and-classification index. It contains no user record, runtime payload, professional note, assessment response, or telemetry payload.
- RDG-W30 accepts the full RDG gate set and freezes `Reality Data Governance Frozen v1`.

## Authority boundaries

- RDG remains the single Reality Data Governance authority. Registry location and storage location do not create authority.
- CPR may produce only bounded telemetry/analytics records under the registered contract; it may not write canonical Reality Input, Reality Evidence, Professional Judgment, or Runtime State.
- ALR remains reserved and not implemented. Its future contract permits Learning Data and Capability Evidence, never Reality Evidence or Professional Judgment.
- PR remains the Professional Judgment authority. Professional-scoped data does not become Runtime Memory by default.
- Analytics is not truth, UI telemetry is not Runtime State, and an assessment score is not Capability State.

## Checker entry points

```bash
npm run check:rdg
npm run check:rdg -- RDG-W26
npm run check:rdg-w26-w30
npm run check:governance-data-closure
```

The frozen RG v3 registry is not rewritten. RDG uses an RG-identity-contract-compatible domain registry and stable work-code runner.

## Baseline reconciliation

The baseline retained the RDG-W21～W25 artifacts but no longer prefixed `postcheck` with `check:governance-data-closure`. RDG-W28 records and repairs this package/CI integration drift; it does not change runtime or user data.
