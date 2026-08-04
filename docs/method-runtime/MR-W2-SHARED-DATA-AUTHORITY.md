# MR-W2｜Shared Data Authority

## Runtime position

MR-W2 freezes the single `SHARED_DATA_AUTHORITY` at baseline `main@6769f262c71a3a08319194942f17a0a154419fc8`.

It implements the Data layer established by MR-W0:

`Method Definition → Data Authority → Calculation Runtime → Projection Runtime → Interpretation Runtime → Professional Runtime`

The authority is part of the Method Runtime Platform, but its records belong to no individual Method or Plugin.

## Single shared authority

There is exactly one Shared Data Authority. Human Design, Astrology, BaZi, I Ching, Tarot, Psychology and future Plugins consume governed records from the same authority.

A Method may not:

- own, fork or rename the Shared Data Authority;
- keep an authoritative Method-specific copy;
- silently replace or repair an authoritative value;
- use a Provider or AI model as data authority; or
- promote a shared record into Projection, Interpretation or Professional authority.

## Nine governed domains

The frozen domain order is:

1. `BIRTH_RECORD` — declared civil birth date, local time, place, precision and uncertainty;
2. `COORDINATE` — latitude, longitude, elevation, WGS84 datum, accuracy and source;
3. `TIMEZONE` — IANA timezone resolution against a timestamp and explicit TZDB version;
4. `DST` — historical daylight-saving status and offsets derived from governed timezone evidence;
5. `TRUE_SOLAR_TIME` — versioned deterministic derivation from normalized civil time, longitude and equation-of-time inputs;
6. `ASTRONOMY` — versioned ephemeris facts with explicit epoch, time scale, reference frame and observer context;
7. `CALENDAR` — governed calendar identity, convention and reproducible conversion;
8. `SOLAR_TERMS` — versioned events derived from astronomical solar longitude;
9. `REFERENCE_TABLES` — licensed, versioned and checksummed lookup material.

## Source and derived records

Birth Record and Coordinate preserve declared or measured facts. Reference Tables preserve governed source material. They carry provenance and normalization metadata but no calculation engine lineage.

Timezone, DST, True Solar Time, Astronomy, Calendar and Solar Terms may require governed deterministic derivation. Their resulting records remain under `SHARED_DATA_AUTHORITY`, while execution belongs to `SHARED_CALCULATION_RUNTIME`.

This distinction prevents MR-W2 from prematurely implementing MR-W3.

## Record contract

Every shared record declares:

- record identity and type;
- authority and authority version;
- record version and status;
- null Method and Plugin owners;
- provenance and source version;
- normalization version;
- input lineage;
- algorithm code and version when derived;
- deterministic status;
- `aiUsed: false`; and
- a type-specific payload.

Corrections create a new revision. Source facts are not silently mutated, inferred or repaired. Unknown values remain explicit.

## Time authority

Timezone and DST are timestamp-sensitive. An offset alone is not an authoritative timezone. A valid resolution requires an IANA zone identifier and TZDB version.

Historical DST is resolved from governed timezone evidence. It is not copied as a universal constant or guessed from a place name.

## Deterministic derivation boundary

Derived data requires input record identifiers, an algorithm code, an algorithm version and deterministic execution. OpenAI, Workers AI and prompts may not create or repair shared data facts.

MR-W2 establishes data contracts only. It does not implement a production astronomy engine, calendar engine, true-solar-time solver or solar-term solver. Those execution responsibilities remain gated by MR-W3 and Method-specific validation.

## Reference table boundary

Every Reference Table requires a stable table code, semantic version, SHA-256 checksum, source reference, row count and license status.

A Method cannot override a shared table. A replacement requires a new governed version and audit lineage.

## Privacy boundary

Birth Record and Coordinate are sensitive. Purpose limitation and minimum-necessary access are mandatory. Existing PHI OS privacy, consent and retention governance remains authoritative.

MR-W2 creates no storage entitlement, disclosure permission, customer-facing access right or Professional Workspace authority.

## Runtime independence

Shared Data Authority has no required dependency on Journey Runtime, Knowledge Runtime, Professional Workspace or a Method Plugin. Plugins are consumers only.

Optional downstream use does not transfer ownership or create a reverse dependency.

## Production boundary

MR-W2 establishes an authority and validation contract. It does not publish production data, create Calculation facts, activate a Plugin, generate Projection JSON, create Interpretation, or authorize a Professional Conclusion.

The next implementation gate is `MR-W3｜Shared Calculation Runtime`.

## Default-chain isolation

MR-W2 is validated independently:

```text
npm run check:mr-w2
```

It is not added to the default `npm run check`, PJA, Knowledge Runtime, MR-W0, MR-W1, IMR-W0 or HDR-W0 chains.
