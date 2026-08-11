# MPA-W17–W20｜Projection / Interpretation / Meaning / Professional Integration

Baseline: `1ebd26901fb63db0753a8fc737ea6423155cf8b0`

## Scope

This block establishes the governed bridges after deterministic Method validation and before method-specific activation.

```
Shared Calculation / Method Calculation
        ↓
Canonical Projection
        ↓
MPA-W17 Projection Freeze
        ├──────────────→ MPA-W19 CMR Meaning / Knowledge references
        ↓
MPA-W18 Interpretation Boundary
        ↓
Shared Interpretation Runtime → Interpretation Candidate
        ↓
MPA-W20 Professional Integration Gate
        ↓
PR v2 + Shared Professional Runtime (future authority required)
```

## W17｜Projection Freeze

A freeze records Method version, calculation lineage, calculation/projection policy versions, projection digest and the immutable Projection snapshot. Freezing a validation Projection does **not** promote it to Production.

The existing MR-W4 Canonical Projection and the versioned NUM numeric Projection extension are both recognized without reopening either frozen source contract.

## W18｜Interpretation Boundary

The block preserves these non-equivalences:

- Projection ≠ Interpretation Candidate
- Projection ≠ Reality Fact
- Interpretation Candidate ≠ Reality Fact
- Interpretation Candidate ≠ Diagnosis
- Interpretation Candidate ≠ Professional Judgment

AI/provider authority remains downstream in Shared Interpretation Runtime and candidate-only. It never becomes arithmetic or Projection authority.

## W19｜Meaning / Knowledge Integration

MPA may resolve governed references only:

```
Projection Freeze
→ CMR Method-to-Meaning Mapping
→ Canonical Meaning Code
→ CMR Meaning-to-Knowledge Map
→ Knowledge Node references
```

MPA does not create Meaning, rewrite Knowledge, store Article bodies, or expose unpublished Knowledge. Current CMR paths remain `validation_only`, so this integration remains reference-only.

A NUM Life Path 8 validation fixture proves that a frozen NUMBER Projection can resolve `CM-NUMBER-ORIENTATION-NO08` and its governed Knowledge Node references without copying content.

## W20｜Professional Integration

Customer calculation/projection and Professional interpretation are separate tracks. A Professional path additionally requires Method Professional eligibility, separate Professional eligibility, assignment, service consent, boundary acknowledgement, workspace access, and PR v2 authority.

The current baseline contains Shared Professional Runtime and JR/PWS handoff boundaries, but no canonical PR v2 artifact was found. W20 therefore records PR v2 as unresolved and keeps Professional release blocked rather than inventing authority.

MPA may gate a handoff; it may not sign or release a Professional deliverable.

## Aggregator hardening

Earlier MPA aggregate checkers previously asserted the entire `check:mpa` command as an exact string. This caused every new MPA block to invalidate older acceptance checkers. W17–W20 changes those older MPA-only assertions to verify required ordered segments instead. MPA is not frozen until W30, so this is a pre-freeze checker hardening, not a frozen-authority reconciliation.

## Non-activation

This block does not change Method Registry v2, MPA Capability Matrix, MR/IMR frozen registries, CMR mappings, or Professional eligibility. `check:mpa` remains outside global `postcheck` until W30.
