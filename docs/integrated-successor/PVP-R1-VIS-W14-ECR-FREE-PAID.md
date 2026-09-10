# PVP-R1-VIS-W14 — ECR Free / Paid Mandala States

Baseline: `ffc05bc07345011bc24e68884cc1d569c8d96418`.

W14 resolves a current fail-closed gap: the product adapter and renderer previously defaulted an absent Mandala experience state to `PAID_DEPTH`. The current successor now defaults unknown or absent state to `FREE_SNAPSHOT` across hierarchy normalization, Mandala rendering, product rendering, and the server-side ECR product adapter.

`PAID_DEPTH` remains an explicit presentation state only. PVP does not create purchase, price, subscription, credit, or entitlement authority; upstream server authorization is still required.

Status: `MACHINE_ACCEPTED_FREE_PAID_FAIL_CLOSED`.
