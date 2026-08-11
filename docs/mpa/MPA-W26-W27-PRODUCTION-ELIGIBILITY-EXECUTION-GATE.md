# MPA-W26 / MPA-W27 — Production Eligibility Decision & Execution Gate

MPA-W26 is the sole canonical authority that converts existing Method evidence into a method-version-capability eligibility decision. It does not create validation, regression, license, RDG, Professional, or public-vocabulary authority.

The decision result is exactly `ELIGIBLE`, `CONDITIONALLY_ELIGIBLE`, or `BLOCKED`. Missing evidence fails closed. `CONDITIONALLY_ELIGIBLE` is intentionally not executable under W27.

At the 021007b baseline, NUMEROLOGY and BAZI are conditionally eligible for DATA / CALCULATION / PROJECTION because their method-specific activation evidence is ready but canonical commercial-license authority is not unconditionally passed. ASTROLOGY remains blocked by unapproved production policy authority. HUMAN_DESIGN remains W24-blocked. I Ching, Tarot, and Psychology remain W25 holding-only.

MPA-W27 establishes the only Production Method execution route:

`Frontend → WPR → /api/method-execute → isMethodProductionEligible() → Method Runtime`

Frontend/WPR direct calculation imports and direct API-to-Method-runtime bypass are forbidden. Validation, regression, and checker execution may continue to call Method runtimes in explicitly non-production contexts.

W27 currently activates zero production dispatch adapters because W26 contains zero unconditional `ELIGIBLE` execution capabilities. A future versioned successor must first make the relevant W26 decision unconditionally eligible before production dispatch can be registered.
