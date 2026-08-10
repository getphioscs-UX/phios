# RMO-W10-W12｜Reality Lifecycle Representation

Baseline: `0375a0c14f044e8bdc6622ce44270ff57f9ebf0e`

Status: `BOUNDARY_COMPLETE / VALIDATION_ONLY`

## Canonical boundary

```text
Known Reality Components
        │
        ├── REALITY_UNKNOWN
        │     UNKNOWN | UNRESOLVED | DISPUTED
        │
        ├── REALITY_ACTION
        │     observed | reported | declared intent | unknown
        │
        └── REALITY_OUTCOME
              observed change | reported change |
              no observed change | unexpected change | unknown
```

All three are RMO `RUNTIME_STATE_RECORD` components. They are not Navigation records, operational Action execution records, PR `OUTCOME_RECORD`, or Professional Judgment.

## RMO-W10｜Unknown Runtime

- UNKNOWN is a formal component, not `null`, an empty string, a guessed default, or an exception path.
- `UNKNOWN`, `UNRESOLVED`, and `DISPUTED` remain distinct RDG-governed certainties.
- Unknown records bind a controlled kind, exact Reality components, optional accepted Evidence Bindings, a statement reference, and explicit resolution requirements.
- W10 does not resolve an Unknown. Resolution requires RRE Evidence, RDG governance, and a later Reality version under RMO-W13.
- A professional-boundary Unknown records that PR authority is required; it does not create Professional Judgment.

## RMO-W11｜Action Runtime

- `OBSERVED_ACTION` requires accepted Evidence Binding.
- `REPORTED_ACTION` remains `USER_REPORTED` and does not become observed fact.
- `DECLARED_INTENT` explicitly remains not executed.
- `UNKNOWN_ACTION` requires a W10 Unknown reference.
- RMO only records a Reality Action representation. JR/RNE and the existing Navigation execution layer retain path selection and execution authority.
- No command, required action, recommendation, professional judgment, execution, or outcome prediction is created.

## RMO-W12｜Outcome Runtime

- Every Outcome binds an immutable RMO Action digest and matching Reality component lineage.
- `OBSERVED_CHANGE` requires a new post-Action accepted Evidence Binding; Action Evidence cannot be silently reused as Outcome Evidence.
- Reported, no-change, and unexpected-change outcomes remain user-reported.
- `UNKNOWN_OUTCOME` requires a W10 Unknown reference.
- No-change is not failure, unexpected change does not prove cause, and no Outcome determines success or Action effectiveness.
- PR retains `OUTCOME_RECORD`; Review and Continuity retain customer choice and next-Runtime routing.

## Preserved authorities

- RMO-W0-W9 frozen outputs are content-preserved with normalized UTF-8/LF hashes.
- RDG retains unknown/disputed, nature, certainty, Evidence, purpose, and data-contract governance.
- JR/RNE and the existing Navigation Action layer retain selection and execution.
- PR retains Professional Judgment and `OUTCOME_RECORD`.
- Review, Runtime Memory, and Continuity remain unchanged.
- Provider/AI authority, persistent storage, migration, network calls, Action execution, automatic Outcome, and production activation remain disabled.

## Baseline validation note

The clean `0375a0c` baseline passes RMO-W0-W9, then the repository-wide check stops in the parallel ALR-W29-W32 checker because its preserved hash for `wave1-c2-human-editorial-freeze-resolution-v1.json` differs from the file on that same commit. This RMO delivery does not modify or reconcile that ALR/Wave 1 authority.

Run after applying the manual package wiring:

```bash
npm run check:rmo-w10-w12
npm run check:rmo
npm run check
```

Next work: `RMO-W13｜Reality Versioning`.
