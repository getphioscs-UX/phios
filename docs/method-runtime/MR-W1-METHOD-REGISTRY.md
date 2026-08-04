# MR-W1｜Method Registry

## Freeze metadata

| Field | Frozen value |
| --- | --- |
| Repository | getphioscs-UX/phios |
| Branch | main |
| Baseline | a8e8c642af0052c3579e75ce9c9a0fd124002241 |
| Phase | PHASE 30 |
| Stage | MR-W1 |
| Status | Frozen |
| Registry version | 1.0.0 |
| Runtime version | 1.0.0 |

MR-W1 populates the single Method Registry defined by MR-W0. It does not amend the MR-W0 Constitution, activate a Method Plugin or create Production authority.

## Versioned population

MR-W0 freezes `method-registry.json` as the empty contract seed and assigns population authority to MR-W1. MR-W1 therefore publishes the population as `method-registry-v1.json`. This preserves the MR-W0 checker and makes the first populated Registry an explicit, versioned object.

Future additions or changes require a versioned Registry change. They must not silently rewrite the MR-W0 contract seed or this frozen v1 snapshot.

## Required fields

Every Method record contains at least:

~~~text
methodCode
methodVersion
status
runtimeVersion
projectionVersion
requiresProfessional
licenseStatus
~~~

MR-W1 additionally freezes the Method name, reserved Plugin code, category, target track, Method Definition status, IMR status, service status, Calculation status, Production Eligibility, registration states and authority sources.

## Registered Methods

| Method code | Method | Plugin | Category | Lifecycle status | License status | Production eligible |
| --- | --- | --- | --- | --- | --- | --- |
| HUMAN_DESIGN | Human Design | HDR | core | internal | restricted | No |
| ASTROLOGY | Astrology | AST | core | experimental | not_required | No |
| BAZI | BaZi | BZR | core | experimental | not_required | No |
| I_CHING | I Ching | ICH | planned | draft | restricted | No |
| TAROT | Tarot | TAR | planned | draft | restricted | No |
| PSYCHOLOGY | Psychology | PSY | planned | draft | restricted | No |

`core` and `planned` are categories, not Lifecycle states. `restricted` means the Method is not commercially cleared for Production until its IMR and rights gates are resolved; it does not mean the Method is prohibited.

## Current authority alignment

Human Design preserves the existing professional service and external calculation mode. Its self-calculation, Gate/Line mapping and related rights remain restricted by HDR-W0.

Astrology remains inactive and experimental. Astronomy Engine JS is only a pilot candidate pending validation. BaZi remains inactive and experimental with a governed policy candidate; no Calculation Engine is activated.

I Ching, Tarot and Psychology are identity reservations in draft. They have no active Method Definition, Calculation Engine, Projection Runtime implementation, service or Production eligibility.

## Method and Plugin registration

Method Registry registration establishes identity and reserves a Plugin code. It does not create an executable Plugin registration. The MR-W0 Plugin Registry remains unchanged until a versioned Plugin Contract is accepted.

No Method may execute before both conditions are satisfied:

1. An IMR-governed Method Definition exists.
2. A valid Plugin Contract is registered under the single Method Runtime.

## Professional boundary

`requiresProfessional: true` means any formal Professional Conclusion, signature or release must pass the independent Professional Runtime and an authorized human. It does not promote a Projection or Interpretation Candidate to a conclusion.

## Production boundary

All six v1 records explicitly set `productionEligible: false`. Registry presence, `core` classification, an existing service, a pilot candidate or a reserved Plugin code cannot create Production authority.

Production later requires all MR-W0 gates, including IMR Production Eligibility, legal Lifecycle state, approved or not-required license status, compatible Runtime and Projection versions, deterministic Calculation validation and independent Professional Review.

## Exclusions

Gene Keys is not a Method record and does not create a Runtime. It remains a translation layer over Human Design Projection. DISC, MBTI, Big Five and CliftonStrengths remain future Psychology plugins. Zi Wei Dou Shu remains deferred until a separate IMR audit.

## Default-chain isolation

MR-W1 is validated by:

~~~text
npm run check:mr-w1
~~~

It remains outside `precheck`, `check`, `postcheck`, `check:pja`, `check:knowledge-runtime`, `check:mr-w0`, `check:imr-w0` and `check:hdr-w0`.
