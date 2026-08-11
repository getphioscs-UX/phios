# MPA-W23｜BZR Activation

Baseline: `57bccb6d6f9fc6aca054b4261e854f04758ec0e3`

## Decision

`READY_FOR_MPA_W26_ELIGIBILITY_DECISION`

This is a versioned successor activation-evidence path. It does not mutate the historical BZR manifest, MR/IMR freezes, MPA Method Registry v2, W12 fixture corpus, or W15 comparison registry.

## Critical reconciliation

The historical W12/W1 BaZi validation fixture used synthetic values:

- true-solar correction `-12.5 min`
- true-solar clock `22:37:30`
- fixed synthetic solar-term timestamps

These values remain valid only as historical adapter-validation data and are forbidden as Production reference evidence.

W23 recalculates the 1989-11-15 fixture using:
- pinned IANA TZDB authority inherited as BZR successor evidence;
- longitude correction relative to UTC+8 standard meridian;
- NOAA/Meeus equation-of-time reference;
- independent Swiss Ephemeris 2.10.03 smoke comparison;
- pinned Astronomy Engine 2.1.19 solar-term engine identity;
- HKO 24-solar-term longitude definition;
- independent sexagenary recalculation.

Corrected reference:
- physical UTC instant: `1989-11-15T14:50:00.000Z`
- total true-solar correction: `-61.68234507085435 min`
- true-solar clock: `1989-11-15 21:48:19.059296`
- pillars remain `JI-SI / YI-HAI / JI-MAO / YI-HAI`.

True solar clock is now semantically separated from the physical UTC instant.

## Luck start

The exact successor fixture uses the physical birth instant and next governed Jie instant:
- DAXUE: `1989-12-07T03:20:57.000Z`
- interval: `1,859,457 seconds`
- exact age ratio: `619819 / 86400 years`
- rounding: forbidden.

## Authority boundary

W23 creates no Production eligibility and no execution authority. W26 remains the global eligibility decision and W27 remains the Production Execution Gate. Professional/Public eligibility remain false.
