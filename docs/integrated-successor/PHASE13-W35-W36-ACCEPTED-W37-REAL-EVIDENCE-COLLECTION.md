# Phase 13 · W35/W36 Human Accepted · W37 Real Evidence Collection

Baseline Phase 13 machine acceptance remains the W32–W34 acceptance prepared against `52dd1e46e28389a386abda37375a7aefb6c54a5b` and committed before current main `d7d3a82b6fec2c48033fac346030702928065eb7`.

## W35 / W36 owner acceptance

On 2026-09-11 TL explicitly instructed PHI OS to complete W35 Visual Human Acceptance and W36 Free→Paid Purchase Intent Human Acceptance. That instruction is recorded as **ACCEPTED_AS_A_SET** across all 8 W35 families and all 6 W36 scenarios. No per-case score, ranking or additional human note was invented.

This acceptance does **not** revalidate method truth, create a commerce transaction, create a purchase, create an entitlement or authorize Phase 14.

## W37 remains a real-event gate

W37 still requires at least one real event for each signal:

- `click` → `REAL_CLIENT_INTERACTION`
- `unlock` → `REAL_SERVER_ENTITLEMENT_TRANSITION`
- `purchase` → `REAL_COMMERCE_TRANSACTION`
- `upgrade` → `REAL_SERVER_ENTITLEMENT_OR_PLAN_TRANSITION`
- `reality_return` → `REAL_CLIENT_HANDOFF_AND_DESTINATION_ARRIVAL`

Synthetic fixtures, controlled replay and test transactions do not close W37.

## Public repository privacy rule

The PHI OS repository is public. Raw customer content, customer identifiers, payment details and raw Stripe/provider identifiers must **not** be committed as W37 evidence. Keep the private evidence outside the repository and commit only a SHA-256 proof digest plus non-sensitive signal metadata.

Use the template:

`content/product-visual-platform-r1/phase13/pilot/pvp-r1-vis-w37-real-evidence-template-v1.json`

For a private screenshot/log/export file on Windows PowerShell, compute its digest with:

```powershell
(Get-FileHash "C:\path\to\private-proof-file" -Algorithm SHA256).Hash.ToLower()
```

Fill the template with the actual production event time, allowed source system and digest. Then record it with:

```powershell
$env:PVP_W37_REAL_EVIDENCE_FILE="C:\path\to\pvp-r1-vis-w37-real-evidence.json"
npm run record:pvp-r1:phase13:w37
npm run check:pvp-r1:phase13:w37
```

The recorder keeps only digest-level proof metadata in the public evidence file. When all five real signals are present, the W37 checker may pass. Phase 13 must still be explicitly frozen before Phase 14 is authorized.
