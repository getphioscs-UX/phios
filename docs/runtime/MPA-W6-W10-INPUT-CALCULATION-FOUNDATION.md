# PHASE MPA｜W6–W10 Input & Deterministic Calculation Foundation

Baseline: `b939293cea3ddbe8afd4ca45b25debb98f30a0a1`

This slice establishes the governed path from personal Method input to a canonical resolved context and then to Shared Calculation Runtime validation execution.

## Boundary

- W6 canonicalizes explicit Method input. It never fills missing birth time, timezone, coordinates, date, or calendar policy.
- W7 binds every personal calculation to RDG consent, purpose, retention and visibility governance.
- W8 preserves BirthDate, BirthTime, BirthPlace, Timezone, Coordinates, InputPrecision, Source and CustomerConfirmation as canonical initialization data.
- W9 coordinates versioned temporal/spatial resolution through deterministic governed adapters. Historical timezone/DST and date-boundary lineage remain explicit.
- W10 requires Shared Calculation Runtime and permits validation execution only. Production remains blocked until the later MPA execution gate.

## Important compatibility rule

Existing MR/IMR frozen v1 contracts and Core Method validation runtimes are not rewritten by this slice. Method-specific activation adapters are deferred to MPA-W21–W24 so legacy validation payload shapes cannot silently become a Production API.

## Validation

```bash
npm run check:mpa-w6-w10
npm run check:mpa
```

MPA remains outside global `postcheck` until Full Acceptance / Freeze.
