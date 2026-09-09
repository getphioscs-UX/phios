# PVP-R1-VIS-W11｜Mandala Hierarchy

W11 freezes visual hierarchy on top of the existing ECR Mandala; it does not create a second Mandala or change ECR calculation/meaning authority.

## Story hierarchy

Primary story: `CC12 → G16 → Q16 → R9`.

Secondary depth: `D12 → M8 → H64 → A8`.

Visual emphasis is governed by four states: `PRIMARY_ACTIVE`, `SUPPORTING_ACTIVE`, `BACKGROUND`, `LOCKED_DEPTH`. Free Snapshot keeps deeper personalized structure fail-closed; Paid Depth may reveal governed supporting/depth selections.

## Reconciliation found in W11

The current renderer already described D12 ranks 2–3 as “supporting baseline driver”, but visual-state resolution left them as `BACKGROUND`. W11 closes only that implementation mismatch: rank 1 stays primary; ranks 2–3 become supporting in Paid Depth and locked in Free Snapshot; ranks 4–12 stay background.

No geometry, selected coordinate, semantic selection, source authority, calculation authority, or ECR meaning authority changes in this work.

Next gate: `PVP-R1-VIS-W12｜Selected Path`.
