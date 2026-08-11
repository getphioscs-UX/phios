# PHASE MPA｜Method Production Activation — W0–W5 Foundation

Baseline: `1d4bc9e98d38c743b44f9659fd89d75bdbb1c0f7`

This increment establishes the activation governance foundation only. It does **not** activate any Method endpoint.

## Reconciled facts

- MR Frozen v1 and IMR Frozen v1 remain immutable.
- NUM runtime artifacts exist, but NUM is absent from frozen MR/IMR v1 and exists only as a versioned registration extension candidate.
- Method Registry v2 is therefore an additive governed successor, not an in-place repair.
- AST, BZR, NUM and HDR calculation/projection implementations are treated as validation-only until later MPA gates pass.
- HDR remains fail-closed for production/public activation because license, external algorithm authority, public vocabulary and professional/commercial boundaries remain unresolved.
- Internal codes `HDR`, `AST`, `BZR`, `NUM` cannot become customer-facing copy automatically.
- Capability eligibility is split into DATA, CALCULATION, PROJECTION, INTERPRETATION, PROFESSIONAL and PUBLIC.

## Check

```bash
npm run check:mpa-w0-w5
```

The MPA scripts are intentionally not added to global `postcheck` before MPA-W30 Full Acceptance / Freeze.

## Next

`MPA-W6｜Canonical Method Input Contract`
