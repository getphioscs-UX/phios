# BOOK-V-CIV-ATLAS-R1-M1-W0–W2｜Baseline + Favicon Recovery + Explorer Entry Recovery

Baseline: `42324d1a3492f801d7de19758ea4c88f2f1ede42` (`b10`)

## W0
Reconciled the frozen R1 with the actual production projection. The Atlas registries and R1 shell exist; the defects are projection defects, not missing Atlas data. Ask retrieval/composition is deliberately deferred to M1-W5–W6.

## W1
`LOGO-011 / PHIOS-FAVICON-v1.svg` remains the only canonical favicon. Public and journey shells now seed a verified canonical favicon immediately and remove competing icon links before async resolver hydration. `/knowledge/ask/` and Book V also carry a first-paint canonical favicon link so browser chrome does not inherit the legacy generic Φ mark while JS is loading.

## W2
Book V now exposes two explicit customer actions: **Read World Differentiation / 阅读《世界如何分化》** and **Explore Civilization Atlas / 探索文明图谱**. The already-mounted R1 Atlas node is preserved across locale re-renders and moved directly after the Book V hero, before the long parts architecture, so the Explorer is visibly reachable without excessive scrolling.

## Freeze successor
The historical W16 freeze record is not rewritten. M1 authorizes only the frozen Book V customer page delta through `book-v-civ-atlas-r1-m1-customer-projection-recovery-v1.json`; the W16 checker validates the predecessor digest plus the authorized successor digest.

## Deferred
Dynamic poster/visual binding remains M1-W3–W4. Atlas-aware Ask retrieval and answer composition remain M1-W5–W6.
