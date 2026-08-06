# STEP55A-D Validation

Baseline: `ad3dd14` (user-declared short SHA; uploaded archive contains no `.git` metadata).

## Scope

- STEP55A — Canonical Production Brief v2 Schema
- STEP55B — Deterministic zh-Hans Brief Export Runtime
- STEP55C — Read-only Brief Checker
- STEP55D — PJA-L10N-W2 Freeze

## Passed

```text
npm run check:pja-l10n-w2
✓ STEP55A Brief Schema passed.
✓ STEP55B zh-Hans deterministic Brief Export Runtime passed.
✓ STEP55C read-only Brief Checker passed.
✓ STEP55D PJA-L10N-W2 Freeze digests passed.
```

Pilot node: `KN-PREFACE-001`

```text
locale: zh-Hans
briefDigest: 8751853a1ddfacb44ea5654a5ef5a89cd296c8682e7ab1ceec42dc813a3f1f85
terminologyTerms: 3
```

Compatibility:

```text
npm run check:knr-l10n-w1
✓ Passed
```

Exporter smoke test:

```text
npm run knowledge:export-brief:zh-Hans -- KN-PREFACE-001
BRIEF EXPORTED
```

## Boundaries

The exporter may only read, project, validate, export and digest.
It does not generate a Candidate, modify Registry data, change Review or Approval, or publish content.

The output excludes runtime timestamps. Rebuilding from the same commit and authoritative input snapshot produces identical JSON and `briefDigest`.
