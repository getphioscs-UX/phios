# KIR-R2-W16R2B — Production Admission & Runtime Cutover

Baseline: `415f73c258454c23d1569c9e2c2f381dcfb6a715` (`B04`).

## Current admission state

W16R2 100-case human acceptance passed at 93/100 with 0 critical failures. W16R2A targeted machine regression passed 7/7, but targeted human spot review is 6/7. Case `KIR-R2-W15R-084` remains human-rejected after the R1 regeneration because its answer invents causal material not established by the admitted article authority.

Therefore this W16R2B build is intentionally **fail-closed**. `KIR_R2_W16R2B_BUILD_ADMITTED=false`. Neither `PHIOS_KIR_R2_MODEL_GATEWAY_ENABLED=true` nor `PHIOS_KIR_R2_W16R2B_PRODUCTION_ADMITTED=true` can override that compile-time admission state. The customer runtime remains on the existing deterministic KIR path.

## Why this is still W16R2B engineering

This stage installs the production-admission boundary and runtime cutover switch without falsely granting admission. It also preserves all earlier evidence and adds the final case-084 R2 regression needed to close the only remaining human blocker.

## Final blocker

Run:

```powershell
node .\scripts\run-kir-r2-w16r2b-case084-r2.mjs
```

Then human-review `review/KIR-R2-W16R2B-CASE084-R2-LIVE-RESULT.json`. If accepted, a tiny production-admission successor may flip `KIR_R2_W16R2B_BUILD_ADMITTED` to true, retain the explicit runtime flag, run wider KIR/integrated regression, and perform the actual customer cutover. No 100-case human re-review is required.
