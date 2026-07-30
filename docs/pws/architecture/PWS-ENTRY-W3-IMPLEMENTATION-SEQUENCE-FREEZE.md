# PWS-ENTRY-W3 Implementation Sequence Freeze

Status: **Frozen v1**  
Baseline: `getphioscs-UX/phios` `main@56cb46aaa2695693525e20901022d06b126b5a89`

## Decision

The 28-stage sequence in
`docs/pws/architecture/pws-implementation-sequence-v1.json` is the only
authorised implementation order. A stage may start only after its immediate
predecessor is Passed. Skipping, reordering and parallel stage execution are
not authorised.

Repeated PWS-I8 and PWS-I9 labels are intentionally preserved. Their unique
`sequenceKey` values disambiguate foundation and full-delivery stages without
renaming the programme.

## Frozen order

| # | Sequence key | Frozen label |
|---:|---|---|
| 1 | `PWS-I1` | PWS-I1 |
| 2 | `PWS-I2` | PWS-I2 |
| 3 | `PJA-W0` | PJA-W0 |
| 4 | `PJA-W1` | PJA-W1 |
| 5 | `PWS-I8-FREE-PRIVACY-FOUNDATION` | PWS-I8 Free Privacy Foundation |
| 6 | `PWS-I9-RULE-FOUNDATION` | PWS-I9 Rule Foundation |
| 7 | `PJA-W2` | PJA-W2 |
| 8 | `PWS-I4-COMMERCIAL-FOUNDATION` | PWS-I4 Commercial Foundation |
| 9 | `PJA-W3` | PJA-W3 |
| 10 | `PWS-I8-CONSENT-FOUNDATION` | PWS-I8 Consent Foundation |
| 11 | `PWS-I9-PROVIDER-AND-COST` | PWS-I9 Provider and Cost |
| 12 | `PJA-W4` | PJA-W4 |
| 13 | `CORE-JOURNEY-INTEGRATION` | Core Journey Integration |
| 14 | `PJA-W5` | PJA-W5 |
| 15 | `PJA-W6` | PJA-W6 |
| 16 | `PWS-I3-PROFESSIONAL-IDENTITY` | PWS-I3 Professional Identity |
| 17 | `PWS-I5-WORKSPACE-AND-READINESS` | PWS-I5 Workspace and Readiness |
| 18 | `PJA-W7` | PJA-W7 |
| 19 | `PJA-W8` | PJA-W8 |
| 20 | `PWS-I6-OPERATIONS` | PWS-I6 Operations |
| 21 | `PWS-I7-GOVERNANCE` | PWS-I7 Governance |
| 22 | `PWS-I8-FULL-PRIVACY` | PWS-I8 Full Privacy |
| 23 | `PWS-I9-FULL-INTELLIGENCE` | PWS-I9 Full Intelligence |
| 24 | `PJA-W9` | PJA-W9 |
| 25 | `PWS-X1-PJA` | PWS-X1-PJA |
| 26 | `PJA-W10` | PJA-W10 |
| 27 | `FULL-ACCEPTANCE` | Full Acceptance |
| 28 | `PRODUCTION-FREEZE` | Production Freeze |

## Preserved boundaries

- No Runtime/content Registry entry is added.
- No Migration is added or executed.
- No page or Customer Runtime behaviour is changed.
- W1 authorised-read and W2 ownership boundaries remain authoritative.
- This freeze does not implement any future stage.

## Baseline delivery-path correction

Commit `56cb46a` contained the six W1 access modules under
`professional/access/`, while the W1 checker and W2 frozen legacy map require
`functions/professional/access/`. W3 restores those files to the already
authorised path without changing their contents. This closes a delivery-path
conflict; it does not create or replace a Contract.
