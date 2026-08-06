# AST-W4A｜Aspect Governance

Status: `AST Aspect Governance Frozen v1`

AST-W4A freezes the governance contract used by the future AST-W4B Aspect
Runtime. It does not detect or output any Aspect.

## Registered mathematical angles

- Conjunction — 0°
- Sextile — 60°
- Square — 90°
- Trine — 120°
- Opposition — 180°

## Validation-only Orb

The only authorized initial Orb policy is:

`EXACT_ONLY_VALIDATION_V1`

Its Orb is 0°. This exists only to validate Runtime wiring and deterministic
pair handling. It is not the PHI OS production Astrology Orb policy.

No 6°, 8°, 10°, luminary-specific, body-specific or user-custom Orb is approved.

## Runtime boundary

AST-W4B must read this Registry. It may not hard-code Aspect angles, Orbs,
priority or applying/separating behavior.

Adding Minor Aspects or approving a production Orb requires a versioned
Governance successor.
