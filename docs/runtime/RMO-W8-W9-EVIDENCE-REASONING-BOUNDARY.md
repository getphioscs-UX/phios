# RMO-W8-W9｜Evidence and Reasoning Boundary

Baseline: `6920c9efb164a6e29f7dcbd8575f7a54e9d28c2f`

Status: `BOUNDARY_COMPLETE / VALIDATION_ONLY`

## Canonical flow

```text
RRE REALITY_EVIDENCE_RECORD
  + RDG ELIGIBLE / ACCEPTED_EVIDENCE
  + exact subject, digest, purpose and lineage
                    ↓
RMO REALITY_EVIDENCE_BINDING
                    ↓
RMO REALITY_REASONING_BOUNDARY
  ALLOW_BOUNDED | REQUIRE_CORROBORATION |
  REQUIRE_EXPLICIT_CONSENT | REQUIRE_PROFESSIONAL_AUTHORITY |
  DENY | UNRESOLVED
```

`REALITY_EVIDENCE_BINDING` is an immutable reference binding between accepted RRE Evidence and one or more known components in the same Reality. It records `SUPPORTS`, `CONTRADICTS`, `QUALIFIES`, or `CONTEXTUALIZES`; none of those roles claims truth. It neither copies the Evidence payload nor promotes Evidence.

`REALITY_REASONING_BOUNDARY` evaluates permission and required routing only. `ALLOW_BOUNDED` does not create Interpretation or Inference content. `PROFESSIONAL_JUDGMENT` always routes to PR.

## W8 acceptance boundary

- Only `RRE / REALITY_EVIDENCE_RECORD` with a valid digest may bind.
- `ACCEPTED_EVIDENCE` and `ELIGIBLE` are mandatory and reconciled through the existing RDG validator.
- Evidence subject, purposes, sensitivity ceiling, lineage, promotion authority, component membership, and time order are validated.
- ALR assessment Evidence candidates cannot bind directly.
- RMO does not store Evidence payloads, determine truth, or perform Evidence promotion.

## W9 acceptance boundary

- `INFERRED` requires a versioned RMO inference method, exact component and Evidence Binding lineage, and uncertainty.
- `INTERPRETED` requires RMO boundary authority, at least one Evidence Binding for an allowed decision, and a boundary-statement reference.
- `UNKNOWN` and `UNRESOLVED` remain `UNRESOLVED`; `DISPUTED` and material uncertainty require corroboration.
- RDG purpose, sensitivity, explicit-consent, and professional-category firewall decisions fail closed.
- Provider or AI flags cannot grant Evidence Binding or reasoning authority.

## Preserved authorities

- W0-W7 frozen RMO outputs are byte-preserved with normalized UTF-8/LF hashes.
- RRE remains the Reality Evidence producer.
- RDG remains the Evidence, purpose, sensitivity, consent, and inference-governance authority.
- PR remains the Professional Judgment authority.
- Existing Reading/provider interpretation boundaries and ALR assessment artifacts are not mutated.
- Persistent storage, database migration, runtime activation, network/provider activation, navigation/action creation, and user-data creation remain disabled.

Run the independent checker after applying the manual package wiring:

```bash
npm run check:rmo-w8-w9
npm run check:rmo
npm run check
```

Next work: `RMO-W10｜Unknown Runtime`.
