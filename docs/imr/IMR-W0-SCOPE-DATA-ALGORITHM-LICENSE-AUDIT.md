# IMR-W0｜Scope, Data, Algorithm and License Audit

## Baseline

```text
Repository: getphioscs-UX/phios
Branch: main
Commit: cfa39ac50d5129f3b0b31bc126e813c8a883a5ba
```

## Position

IMR is a parallel development track. It does not enter the PHI OS Master Work Steps and does not block PJA, KNR, Reality Journey or Professional Workspace.

## Scope

Included:

```text
ASTROLOGY
BAZI
```

Preserved but separately governed:

```text
HUMAN_DESIGN
→ existing Professional Method
→ external calculation retained
→ self-calculation requires HDR-W0
```

Excluded:

```text
GENE_KEYS = not_planned
ZI_WEI_DOU_SHU = deferred_out_of_scope
```

## Astrology decision

```text
Pilot Engine: Astronomy Engine JavaScript
License: MIT
Commercial fee: none
Validation reference: NASA JPL Horizons
Swiss Ephemeris: deferred commercial fallback
Production: blocked until accuracy validation
```

IMR-W0 does not install Astronomy Engine and does not create a calculation engine.

## BaZi source stack

```text
IANA TZDB
+
Astronomy Engine solar-longitude candidate
+
PHI OS true-solar-time implementation
+
PHI OS sexagenary calendar implementation
+
PHI OS BaZi Policy v1
```

External BaZi websites are validation references only and never become calculation authority.

## BaZi Policy v1 candidate

```text
Method family: Zi Ping Four Pillars
Formal time basis: true solar time
True solar time: enabled by default
Year boundary: exact Li Chun instant
Month boundary: exact twelve Jie instants
Day boundary: true solar time 00:00
Zi hour: 23:00–00:59
23:00–23:59: same true-solar date
00:00–00:59: next true-solar date

Luck direction:
Yang-year male / Yin-year female → forward
Yin-year male / Yang-year female → backward

Luck start:
Forward → next Jie
Backward → previous Jie
Three days → one year
One day → four months
Two hours → ten days
No early rounding

Unknown birth time:
Three pillars remain available
Hour pillar remains unresolved
No fabricated default hour
Hour-dependent interpretation remains conditional

Traditional calculation sex:
Used only for luck-cycle direction
Not used for identity or personality claims
```

## Explicitly not implemented

```text
No Astrology Engine
No BaZi Engine
No Human Design Engine
No Chart Renderer
No Public Chart Page
No API
No Product or Offer
No Provider call
No database migration
No Runtime write
No PJA change
No KNR change
```

## Command

```powershell
npm run check:imr-w0
```

IMR-W0 is deliberately not connected to `precheck`, `npm run check`, `check:pja`, or `check:knowledge-runtime`.

## Expected state

```text
IMR-W0-v1.0.0-Conditional-Passed
```

Remaining conditions:

```text
Astrology accuracy fixtures not yet executed
BaZi calculation implementation and validation not yet executed
Human Design self-calculation remains deferred to HDR-W0
```
