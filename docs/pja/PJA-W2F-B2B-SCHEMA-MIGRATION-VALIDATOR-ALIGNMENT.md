# PJA-W2F-B2B｜Schema Migration and Validator Alignment

## Purpose

Align the frozen PJA-W2A checker with the Universal Canonical Production Readiness Contract introduced by PJA-W2F-A and populated for the first human-frozen node in PJA-W2F-B2A.

## Baseline

- Repository: `getphioscs-UX/phios`
- Branch: `main`
- Baseline commit: `f4fcf8f`
- Applied prerequisite: `PJA-W2F-B2A｜First Human Frozen Production Pilot`

## Defect

The W2A checker dereferenced the removed legacy field:

```text
readiness.claimDossier.claims
```

The human-frozen readiness record now uses the Universal Readiness Contract:

```text
claimBoundary
sourceBoundary
figureBoundary
publicContentBoundary
sequenceBoundary
review
productionReadiness
```

This caused `npm run check` and the PJA chain to stop before reaching B2A validation.

## Resolution

The W2A checker now:

1. Detects the Universal Readiness schema by `readinessSchemaVersion`.
2. Builds a read-only compatibility view for frozen W2A assertions.
3. Validates the new human freeze, production readiness and universal boundaries directly.
4. Preserves support for the legacy readiness structure.
5. Does not weaken article, claim, source, visual, Runtime, Provider, Payment, Entitlement or publication boundaries.

## Frozen Result

```text
KN-PREFACE-001
humanFrozen = true
productionReadiness.status = production_ready
```

No Article Draft, Article Package, approval record, publication record, Registry record, asset or locale was generated.

## Acceptance

```text
npm run check:pja-w2f-b2b
npm run check
```

The stage may freeze only when both commands pass in the local repository with dependencies installed.
