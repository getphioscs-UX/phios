# MR-W0｜Method Runtime Constitution

## Freeze metadata

| Field | Frozen value |
| --- | --- |
| Repository | getphioscs-UX/phios |
| Branch | main |
| Baseline | 38d5f465cdb9a8db140e589f1f41f2e998237ab2 |
| Phase | PHASE 30 |
| Stage | MR-W0 |
| Status | Frozen |
| Runtime version | 1.0.0 |

This Constitution is the sole foundation for MR-W1 through MR-W6. Method-specific tracks and future plugins inherit it; they cannot silently modify it.

## Runtime Identity

PHI OS establishes exactly one Method Runtime Platform, identified as METHOD_RUNTIME. Human Design, Astrology, BaZi, I Ching, Tarot, Psychology and future methods are plugins. A method-specific calculation engine is a module executed inside the Shared Calculation Runtime, not a second Runtime.

MR-W0 establishes the Method Registry and Plugin Registry contracts. MR-W1 owns method population.

## Runtime Layer

The frozen order is:

~~~text
Method Definition
↓
Data Authority
↓
Calculation Runtime
↓
Projection Runtime
↓
Interpretation Runtime
↓
Professional Runtime
~~~

No active layer may be bypassed or reordered. Method Definition must exist before Runtime execution.

## Authority

| Layer | Sole authority |
| --- | --- |
| Method Definition | IMR-approved Method Definition |
| Data | Shared Data Authority |
| Calculation | Shared Calculation Runtime |
| Projection | Shared Projection Runtime |
| Interpretation | Shared Interpretation Runtime |
| Professional review and release | Shared Professional Runtime plus an authorized human |

Birth Record, Coordinate, Timezone, DST, True Solar Time, Astronomy, Calendar, Solar Terms and Reference Tables belong to Shared Data Authority, not an individual Method.

## Boundary

The following identities are permanently distinct:

~~~text
Method Runtime ≠ Journey Runtime
Method Runtime ≠ Knowledge Runtime
Method Runtime ≠ Professional Workspace
~~~

Journey Runtime and Published Knowledge may be optional Interpretation inputs through governed adapters. They are not required Method Runtime dependencies. Professional Workspace is downstream and may read governed Runtime outputs; it does not become their authority and must not directly read OpenAI or Workers AI.

## Plugin Contract

Every Method must register as a Plugin. The minimum contract freezes pluginCode, pluginVersion, runtimeVersion, projectionVersion, status, licenseStatus and dependencies. The governed contract additionally requires IMR status, Method Definition version, Shared Data Authority, explicit layer authority, Calculation policy, Projection policy, Interpretation policy, Professional policy and ordered capabilities.

Registration does not create Production authority.

## Lifecycle

All plugins use one lifecycle:

~~~text
draft → experimental → internal → pilot → production → deprecated → archived
~~~

Only transitions listed in method-runtime-lifecycle.json are legal. Direct draft-to-production, archived reactivation and Production without IMR or license gates are prohibited.

## Provider Boundary

Calculation excludes Provider participation:

~~~text
No OpenAI
No Workers AI
No Prompt
No Interpretation
100% repeatable
~~~

OpenAI and Workers AI are permitted only in Interpretation. Their output is an Interpretation Candidate. Provider output cannot become a Professional Conclusion, signature or release without independent Professional Review.

## Production Contract

Production requires all of the following:

1. IMR Production Eligibility.
2. Plugin status production.
3. License status approved or not_required.
4. Compatible Runtime and Projection versions.
5. Resolved dependencies.
6. Repeatability and calculation validation evidence.
7. Provider Boundary validation.
8. Independent Professional Review and authorized-human release.
9. Auditable lineage.
10. A passing npm run check:mr-w0 gate.

MR-W0 remains standalone and does not enter npm run check, check:pja, check:knowledge-runtime, check:imr-w0 or check:hdr-w0.

## Future Plugin Policy

HDR, AST, BZR, ICH, TAR, PSY and future plugins register under the same Constitution. DISC, MBTI, Big Five and CliftonStrengths remain Psychology plugins. Zi Wei Dou Shu remains deferred until IMR audit. Gene Keys is a translation layer over Human Design Projection and does not create a Runtime.

Method Fusion coordinates multiple projections but does not promote Method Projection to Reality. A fusion result must be combined with Reality Evidence through Journey Runtime before Reality Navigation.

## Twelve Principles

1. Method Runtime 是唯一 Method 平台。
2. 所有 Method 必须以 Plugin 注册。
3. Method Definition 必须先于 Runtime。
4. Data Authority 必须唯一。
5. Calculation 必须完全确定性。
6. Projection 不等于 Interpretation。
7. Interpretation 不等于 Professional Conclusion。
8. Provider 不参与 Calculation。
9. Professional Review 必须独立。
10. 所有 Plugin 必须通过 IMR。
11. 所有 Plugin 必须遵守统一 Lifecycle。
12. Method Runtime 永远独立于 Journey、Knowledge 与 Professional Workspace。

These twelve principles are validated individually by the MR-W0 checker.

## Change control

Any future change to Runtime identity, layer order, authority, Provider Boundary or Production Contract requires an explicit Constitution version and migration review. A plugin registration, Provider change or method-specific release cannot amend MR-W0 by implication.

