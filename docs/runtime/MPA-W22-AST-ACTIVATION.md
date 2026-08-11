# MPA-W22｜AST Activation

Baseline: `9cd28c6ad24ebffeeb553cfe65fb572ef562d3ed`

## Decision

AST technical activation evidence is complete for the five requested technical blockers, but AST is **not yet ready for MPA-W26** because Method-owned production policies remain unapproved. MPA does not invent Astrology defaults.

## Resolved technical evidence

- Ephemeris: Astronomy Engine JS `2.1.19`, immutable release commit `61dc07020aaa6885d2c7f688a4d82beaf6edb9ef`.
- Ephemeris source identity: Git blob SHA-1 `b16e54660ee65df2947079b383d90bac06ee82bf` plus canonical SHA-256 authority-binding digest.
- Trusted reference: NASA/JPL Horizons archive and the upstream immutable JPL comparison harness are bound by exact Git blob identities. PHI does not claim an unexecuted local exact match.
- Tolerance: `0.878 arcmin` (`52.68 arcsec`) for metric equatorial, apparent equatorial, and horizontal comparison.
- Historical timezone: IANA TZDB `2026c`, release commit `71f28b9ab3b67c0f9466803f6151812d4fc8e357`, `tzdata2026c.tar.gz` SHA-512 `3e5aec7d93522efc875fc8af553f78029677aaa9be8db396c862d687bdedb930379ba6246b33a15c5fb3a76d24e937dac4f4f66d6f9edf69a668bb21e9eeada7`.

## Remaining authority blocker

`PRODUCTION_POLICIES_NOT_APPROVED` remains authoritative from AST Frozen v1: planet set, house system, zodiac, production orb policy, and minor-aspect policy are not approved. MPA-W22 cannot select them.

## Global gates

- Production eligibility: false.
- MPA-W26: not yet reachable for AST until Method policy authority is resolved.
- Production execution: false; MPA-W27 required.
- Professional eligibility/release: false.
