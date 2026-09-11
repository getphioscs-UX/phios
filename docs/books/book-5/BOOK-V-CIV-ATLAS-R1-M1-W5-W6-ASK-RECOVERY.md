# BOOK-V-CIV-ATLAS-R1-M1-W5–W6｜Atlas-Aware Ask Retrieval Recovery + Answer Composition + Deep-Link Recovery

Baseline: `1e1d0363c4170fa751c93ac4d8111e76bbae95b8` (`m4b`)

## W5 retrieval recovery

This wave does not create a second Ask runtime. The existing CKA → KAP pipeline remains the answer owner.

When the authorized public knowledge context is Book V / Part 12 / Civilization Atlas, an Atlas-aware adapter runs before the existing KAP retrieval question is submitted.

Priority is fixed:

1. selected Atlas entity
2. related Atlas registry evidence
3. Part 12 canonical nodes
4. Book V published/reviewed knowledge
5. broader PHI OS knowledge

The adapter classifies Atlas intent, reads only the relevant static Atlas registries, and adds bounded evidence cues to the existing retrieval question.

Critical fixture:

`为什么某些国家落寞？`

must enter `CIVILIZATION_DECLINE`, use Loss / Case / Transition evidence cues, and explicitly prohibit fallback to a generic differentiation-only answer when Atlas evidence exists.

## W6 composition recovery

Customer projection uses the same upstream answer but adds Atlas-grounded framing and readable sections:

- Direct Answer
- What Changed
- Loss Dimensions
- Examples
- What Continued
- Evidence / Unknown
- Explore in Atlas

The Atlas framing never creates civilization ranking, collapse score, superiority score, or a second authority.

## Deep-link recovery

The original Atlas URL fragment may be stripped by the existing public route sanitizer. W6 therefore reconstructs the public Atlas deep link from the authorized `contextSummary` state:

`/books/reality-differentiation/?atlas=<layer>&...#atlas`

Selected Case / Snapshot / Family / Trajectory / Transition / Loss / Time are preserved when present.

## Governance

- existing Ask runtime reused
- existing KAP retrieval reused
- no second retrieval runtime
- no second answer runtime
- registries provide governed evidence context but do not become new Canonical Knowledge
- no poster evidence
- no OCR
- no civilization score
