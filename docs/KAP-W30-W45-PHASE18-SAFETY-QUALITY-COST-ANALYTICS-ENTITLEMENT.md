# PHI OS｜KAP-W30–W45 Phase 18
## Safety / Quality / Cost / Analytics / Entitlement

Baseline: `a6395ad926ce1bcd318b596d6f6ce028f5b96ae9`

## Purpose

Phase 18 extends the already-frozen KAP-W0–W29 chain with a post-composition governance layer. It does **not** create a second Answer Runtime, Knowledge Authority, Method Authority, Reality Authority, Publication Authority, or Professional Authority.

```text
Existing KAP Answer Runtime
        ↓
KAP-W30–W45 Governance Guard
        ↓
CKA consumer (parallel work)
```

The backend governance can be frozen now. CKA-dependent client consumption acceptance remains explicitly pending until the separate Client Surface work lands.

## Authority invariants

```text
KAP Safety Policy
!= Professional Judgment Authority

KAP Entitlement
!= Method Production Authority

Subscription
!= MPA grant

Analytics / Demand
!= Canonical Knowledge mutation

Cache
!= Knowledge Authority

AI budget
!= Knowledge quality downgrade
```

## W30–W32｜Safety

- **W30 Professional Boundary** covers Medical, Mental Health, Legal, Financial, and Professional Judgment domains. KAP defaults to Explain / Observe / Compare / Explore and does not replace licensed or external professional judgment.
- **W31 Explanation vs Advice** makes explanation the default and requires caution or external authority when output becomes directive, prescriptive, mandatory, or unjustifiably certain.
- **W32 Personalization Boundary** requires evidence before a personal assertion can be presented as grounded. Without evidence, only propositional wording is allowed.

## W33–W35｜Answer Quality

- **W33 Grounded Acceptance** requires all claims grounded, all nodes valid, publication ownership valid, relationships governed, no Book/Volume inference from a node-code B-prefix, no fake citation, and no unsupported certainty.
- **W34 Regression Corpus** includes the six required questions in both `zh-Hans` and `en` under stable case identities.
- **W35 Locale Regression** requires the same authority, boundary, and meaning across both locales. CKA locale surface acceptance remains `CONSUMER_PENDING`.

## W36–W39｜Cost & Performance

- **W36 Retrieval Cache** may cache normalization, node relations, grounding fragments, and published refs only when the cache key binds locale and knowledge revision. Private/personal context is excluded from shared caches.
- **W37 Answer Cache** allows shared caching for generic answers. Personalized, private-context, or history-bound answers require context-bound recomposition and cannot be simply reused.
- **W38 AI Budget** may be governed by user/session/plan/answer mode, but budget cannot reduce Knowledge Authority quality. Deployment configuration owns numerical limits.
- **W39 AI Failure Fallback** requires the deterministic answer path to remain usable when AI is unavailable.

## W40–W42｜Analytics

Allowed outcome events are only:

```text
answerViewed
relatedKnowledgeOpened
followUpAsked
guidedStarted
journeyStarted
helpfulFeedback
```

W40 signals are anonymous product signals: no raw question, raw answer, user ID, case ID, birth data, or hidden personal payload. The production registry starts empty because CKA emitters are not yet accepted.

W41 converts only high-frequency `PARTIAL` / `INSUFFICIENT` coverage into an aggregated `KnowledgeGapSignal`. Threshold is currently governance-fixed at 3 aggregated occurrences for registry eligibility. It is a planning signal only and may feed PCA/KPP advisory demand handling.

W42 hard-blocks automatic client-behavior actions that would create a Canonical Node, change a Thesis, change a governed Relationship, or publish an Article.

## W43–W45｜Entitlement

- **W43 Free Ask PHI OS** may limit quota, depth, or history, but never lower Knowledge Authority quality.
- **W44 Membership Answer** may add deeper answer access, history, follow-up continuity, and Guided Reading access. Membership does not create Knowledge Authority.
- **W45 Method / Journey Entitlement** controls access only. Method execution still requires both MPA dispatch authority and MCD production availability. Paid access cannot manufacture Method authority.

Current critical invariant:

```text
HUMAN_DESIGN / HDR
MPA dispatchAllowed = false

Paid entitlement = true
still results in
methodAllowed = false
reason = MPA_BLOCKED
```

ASTROLOGY / BAZI / NUMEROLOGY may only be accessed when their existing MPA + MCD gates are actually satisfied.

## Parallel CKA boundary

Phase 18 intentionally does not claim the following as complete:

```text
KAP-W33 CKA grounded surface acceptance
KAP-W35 CKA locale surface acceptance
KAP-W40 CKA analytics emitters
KAP-W43 Free Ask client enforcement
KAP-W44 Membership / Account client enforcement
```

They remain `CONSUMER_PENDING` and require a later CKA × KAP reconciliation delta.

## Commands

Historical W0–W29 command remains unchanged to preserve its frozen checker contract:

```bash
npm run check:kap
```

Phase 18 only:

```bash
npm run check:kap-phase18
```

Current full KAP chain:

```bash
npm run check:kap-current
```

## Exit state

```text
KAP_PHASE18_BACKEND_READY
+
CKA_CONSUMPTION_PENDING
```

This is **not** global Client Production Acceptance and is **not** CKA Production Acceptance.
